'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, Loader2, RotateCw, ScanSearch, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { createExpense, updateExpense } from '@/lib/expenses'
import { useExpenseStore } from '@/store/expenses'
import { useWorkspaceStore } from '@/store/workspace'
import { createClient } from '@/lib/supabase/client'
import { ReceiptUploader } from './ReceiptUploader'
import type { Category, Expense, OcrExtraction, PaymentMethod } from '@/types'

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'credit_card', label: 'Credit card' },
  { value: 'debit_card', label: 'Debit card' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'other', label: 'Other' },
]

interface ExpenseDialogProps {
  open: boolean
  onClose: () => void
  expense?: Expense | null
  categories: Category[]
}

function emptyForm(workspaceId: string) {
  return {
    merchant: '',
    amount: '',
    tax_amount: '',
    date: new Date().toISOString().split('T')[0],
    category_id: '',
    payment_method: '' as PaymentMethod | '',
    card_last_four: '',
    notes: '',
    receipt_url: '',
    receipt_path: '',
    workspace_id: workspaceId,
  }
}

export function ExpenseDialog({ open, onClose, expense, categories }: ExpenseDialogProps) {
  const { addExpense, updateExpense: updateStore, expenses } = useExpenseStore()
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const [saving, setSaving] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<{ exact: boolean } | null>(null)
  const [pendingSubmit, setPendingSubmit] = useState<(() => Promise<void>) | null>(null)
  const [receiptsOpen, setReceiptOpen] = useState(false)
  const [receiptsRotation, setReceiptRotation] = useState(0)
  const [localReceiptUrl, setLocalReceiptUrl] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [form, setForm] = useState(emptyForm(activeWorkspaceId ?? ''))
  const [dateOpen, setDateOpen] = useState(false)

  useEffect(() => {
    setLocalReceiptUrl(null)
    setPendingFile(null)
    if (expense) {
      setForm({
        merchant: expense.merchant,
        amount: String(expense.amount),
        tax_amount: expense.tax_amount != null ? String(expense.tax_amount) : '',
        date: expense.date,
        category_id: expense.category_id ?? '',
        payment_method: expense.payment_method ?? '',
        card_last_four: expense.card_last_four ?? '',
        notes: expense.notes ?? '',
        receipt_url: expense.receipt_url ?? '',
        receipt_path: expense.receipt_path ?? '',
        workspace_id: expense.workspace_id,
      })
    } else {
      setForm(emptyForm(activeWorkspaceId ?? ''))
    }
  }, [expense, activeWorkspaceId, open])

  function applyOcrExtraction(data: OcrExtraction) {
    const matchedCategory = data.suggested_category
      ? categories.find((c) => c.name.toLowerCase() === data.suggested_category!.toLowerCase())
      : null
    setForm((f) => ({
      ...f,
      merchant: data.merchant || f.merchant,
      amount: data.amount ? String(data.amount) : f.amount,
      tax_amount: data.tax_amount != null ? String(data.tax_amount) : f.tax_amount,
      date: data.date || f.date,
      payment_method: (data.payment_method as PaymentMethod) || f.payment_method,
      card_last_four: data.card_last_four || f.card_last_four,
      category_id: matchedCategory ? matchedCategory.id : f.category_id,
    }))
  }

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function saveExpense() {
    setSaving(true)
    try {
      let receiptsUrl = form.receipt_url || null
      let receiptsPath = form.receipt_path || null

      if (pendingFile) {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')
        const ext = pendingFile.name.split('.').pop()
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage.from('receipts').upload(path, pendingFile)
        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)
        const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(path)
        receiptsUrl = publicUrl
        receiptsPath = path
      }

      const payload = {
        merchant: form.merchant,
        amount: parseFloat(form.amount),
        currency: 'USD',
        tax_amount: form.tax_amount ? parseFloat(form.tax_amount) : null,
        date: form.date,
        category_id: form.category_id || null,
        payment_method: (form.payment_method as PaymentMethod) || null,
        card_last_four: form.card_last_four || null,
        notes: form.notes || null,
        receipt_url: receiptsUrl,
        receipt_path: receiptsPath,
        workspace_id: form.workspace_id,
      }

      if (expense) {
        const updated = await updateExpense(expense.id, payload)
        updateStore(expense.id, updated)
        toast.success('Expense updated')
      } else {
        const created = await createExpense(payload)
        addExpense(created)
        toast.success('Expense added')
      }
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save expense')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.merchant || !form.amount || !form.date) return

    if (!expense) {
      const amount = parseFloat(form.amount)
      const duplicate = expenses.find(
        (ex) =>
          !ex.is_deleted &&
          parseFloat(String(ex.amount)) === amount &&
          ex.date === form.date &&
          (ex.category_id ?? '') === (form.category_id ?? '')
      )
      if (duplicate) {
        const exact = duplicate.merchant.toLowerCase() === form.merchant.toLowerCase()
        setDuplicateWarning({ exact })
        setPendingSubmit(() => saveExpense)
        return
      }
    }

    await saveExpense()
  }

  return (
    <>
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg min-w-[350px] overflow-y-auto p-0 border-l border-neutral-100">
        <div className="p-8 space-y-8">
          <SheetHeader className="space-y-1">
            <SheetTitle className="text-2xl font-bold text-[#171717]">{expense ? 'Edit Expense' : 'Add Expense'}</SheetTitle>
            <p className="text-sm text-neutral-500 font-medium">
              {expense ? 'Update the details of your transaction.' : 'Enter the details of your new transaction.'}
            </p>
          </SheetHeader>

          <div className="space-y-8">
            <div className="bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100">
              <ReceiptUploader
                onFileSelected={(file, localUrl) => {
                  setPendingFile(file)
                  if (localUrl) setLocalReceiptUrl(localUrl)
                }}
                onFileRemoved={() => {
                  setPendingFile(null)
                  setLocalReceiptUrl(null)
                }}
                onExtractionComplete={applyOcrExtraction}
                existingUrl={form.receipt_url}
                categories={categories}
              />

              {(form.receipt_url || localReceiptUrl) && (
                <div className="flex justify-center mt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setReceiptOpen(true)}
                    className="h-8 px-3 text-xs font-bold text-neutral-500 hover:text-[#171717] hover:bg-white rounded-lg transition-all gap-2"
                  >
                    <ScanSearch className="h-3.5 w-3.5" />
                    Preview Receipt
                  </Button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="merchant" className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Merchant *</Label>
                  <Input
                    id="merchant"
                    value={form.merchant}
                    onChange={(e) => set('merchant', e.target.value)}
                    placeholder="Where did you spend?"
                    className="rounded-xl bg-neutral-50 border-neutral-100 focus:bg-white h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Amount *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-medium text-sm">$</span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.amount}
                      onChange={(e) => set('amount', e.target.value)}
                      placeholder="0.00"
                      className="rounded-xl bg-neutral-50 border-neutral-100 focus:bg-white h-11 pl-7 font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Date *</Label>
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger
                      className={cn(
                        'w-full flex items-center justify-start gap-3 rounded-xl border border-neutral-100 bg-neutral-50 px-3 h-11 text-sm font-medium transition-all hover:bg-neutral-100',
                        !form.date && 'text-neutral-400'
                      )}
                    >
                      <CalendarIcon className="h-4 w-4 text-neutral-400" />
                      {form.date ? format(new Date(form.date + 'T12:00:00'), 'MMM d, yyyy') : 'Pick a date'}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-neutral-100">
                      <Calendar
                        mode="single"
                        selected={form.date ? new Date(form.date + 'T12:00:00') : undefined}
                        onSelect={(d) => {
                          if (d) set('date', d.toISOString().split('T')[0])
                          setDateOpen(false)
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Category</Label>
                  <Select
                    value={form.category_id}
                    onValueChange={(v) => set('category_id', v ?? '')}
                  >
                    <SelectTrigger className="rounded-xl bg-neutral-50 border-neutral-100 focus:bg-white h-11">
                      <SelectValue placeholder="Select category">
                        {form.category_id ? categories.find(c => c.id === form.category_id)?.name : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-neutral-100 shadow-xl">
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id} label={c.name}>
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                            {c.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Payment Method</Label>
                  <Select
                    value={form.payment_method}
                    onValueChange={(v) => set('payment_method', v ?? '')}
                  >
                    <SelectTrigger className="rounded-xl bg-neutral-50 border-neutral-100 focus:bg-white h-11">
                      <SelectValue placeholder="Select method">
                        {form.payment_method ? PAYMENT_METHODS.find(m => m.value === form.payment_method)?.label : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-neutral-100 shadow-xl">
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m.value} value={m.value} label={m.label}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Tax Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.tax_amount}
                    onChange={(e) => set('tax_amount', e.target.value)}
                    placeholder="0.00"
                    className="rounded-xl bg-neutral-50 border-neutral-100 focus:bg-white h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Card Last 4</Label>
                  <Input
                    value={form.card_last_four}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 4)
                      set('card_last_four', v)
                    }}
                    placeholder="1234"
                    maxLength={4}
                    inputMode="numeric"
                    className="rounded-xl bg-neutral-50 border-neutral-100 focus:bg-white h-11 font-mono"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => set('notes', e.target.value)}
                    placeholder="Add details, tags, or descriptions…"
                    rows={3}
                    className="rounded-xl bg-neutral-50 border-neutral-100 focus:bg-white resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-6 border-t border-neutral-100">
                <Button 
                  type="button" 
                  onClick={onClose} 
                  className="flex-1 rounded-lg h-9 text-sm font-semibold bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-all shadow-sm"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving} 
                  className="flex-1 rounded-lg h-9 text-sm font-semibold bg-[#171717] text-white hover:bg-neutral-800 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    !expense && <Plus className="h-4 w-4" />
                  )}
                  {expense ? 'Save Changes' : 'Add Expense'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <Dialog open={!!duplicateWarning} onOpenChange={(o) => { if (!o) { setDuplicateWarning(null); setPendingSubmit(null) } }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>
            {duplicateWarning?.exact ? 'Possible duplicate' : 'Similar expense found'}
          </DialogTitle>
          <DialogDescription>
            {duplicateWarning?.exact
              ? 'An expense with the same merchant, amount, date, and category already exists. Are you sure you want to add it?'
              : 'An expense with the same amount, date, and category already exists but with a different merchant. This could be a duplicate. Do you want to proceed?'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-3">
          <Button 
            className="flex-1 rounded-lg h-9 text-sm font-semibold bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-all shadow-sm" 
            onClick={() => { setDuplicateWarning(null); setPendingSubmit(null) }}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1 rounded-lg h-9 text-sm font-semibold bg-[#171717] text-white hover:bg-neutral-800 transition-all shadow-sm"
            onClick={async () => { setDuplicateWarning(null); await pendingSubmit?.() }}
          >
            Save anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
