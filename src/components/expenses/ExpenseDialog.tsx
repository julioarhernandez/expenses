'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, Loader2, ScanSearch, Plus } from 'lucide-react'
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
import { createRecurringExpense } from '@/lib/recurring'
import { useExpenseStore } from '@/store/expenses'
import { useWorkspaceStore } from '@/store/workspace'
import { useTranslation } from '@/hooks/useTranslation'
import { es, enUS } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { ReceiptUploader } from './ReceiptUploader'
import type { Category, Expense, OcrExtraction, PaymentMethod, RecurringFrequency } from '@/types'

const RECURRING_FREQUENCY_VALUES: RecurringFrequency[] = ['daily', 'weekly', 'monthly', 'yearly']

interface ExpenseDialogProps {
  open: boolean
  onClose: () => void
  expense?: Expense | null
  draft?: Partial<Expense> | null
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

export function ExpenseDialog({ open, onClose, expense, draft, categories }: ExpenseDialogProps) {
  const { addExpense, updateExpense: updateStore, expenses } = useExpenseStore()
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const { t, lang } = useTranslation()
  const locale = lang === 'es' ? es : enUS

  const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
    { value: 'credit_card', label: lang === 'es' ? 'Tarjeta de crédito' : 'Credit card' },
    { value: 'debit_card', label: lang === 'es' ? 'Tarjeta de débito' : 'Debit card' },
    { value: 'cash', label: lang === 'es' ? 'Efectivo' : 'Cash' },
    { value: 'bank_transfer', label: lang === 'es' ? 'Transferencia bancaria' : 'Bank transfer' },
    { value: 'other', label: lang === 'es' ? 'Otro' : 'Other' },
  ]
  const [saving, setSaving] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<{ exact: boolean } | null>(null)
  const [pendingSubmit, setPendingSubmit] = useState<(() => Promise<void>) | null>(null)
  const [receiptsOpen, setReceiptOpen] = useState(false)
  const [receiptsRotation, setReceiptRotation] = useState(0)
  const [localReceiptUrl, setLocalReceiptUrl] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [form, setForm] = useState(emptyForm(activeWorkspaceId ?? ''))
  const [dateOpen, setDateOpen] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('monthly')
  const [recurringEndDate, setRecurringEndDate] = useState('')

  useEffect(() => {
    setLocalReceiptUrl(null)
    setPendingFile(null)
    setIsRecurring(false)
    setRecurringFrequency('monthly')
    setRecurringEndDate('')
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
    } else if (draft) {
      setForm({
        ...emptyForm(activeWorkspaceId ?? ''),
        merchant: draft.merchant || '',
        amount: draft.amount ? String(draft.amount) : '',
        tax_amount: draft.tax_amount != null ? String(draft.tax_amount) : '',
        date: draft.date || new Date().toISOString().split('T')[0],
        category_id: draft.category_id || '',
        payment_method: draft.payment_method || '',
        card_last_four: draft.card_last_four || '',
        notes: draft.notes || '',
        receipt_url: draft.receipt_url || '',
        receipt_path: draft.receipt_path || '',
      })
    } else {
      setForm(emptyForm(activeWorkspaceId ?? ''))
    }
  }, [expense, draft, activeWorkspaceId, open])

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

        if (isRecurring) {
          await createRecurringExpense({
            merchant: payload.merchant,
            amount: payload.amount,
            currency: payload.currency,
            frequency: recurringFrequency,
            start_date: payload.date,
            end_date: recurringEndDate || null,
            category_id: payload.category_id ?? null,
            notes: payload.notes ?? null,
            workspace_id: payload.workspace_id,
          })
          toast.success('Expense added as recurring')
        } else {
          toast.success('Expense added')
        }
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
            <SheetTitle className="text-2xl font-bold text-[#171717]">
              {expense ? t('expense_dialog').edit_title : t('expense_dialog').add_title}
            </SheetTitle>
            <p className="text-sm text-neutral-500 font-medium">
              {expense ? t('expense_dialog').edit_desc : t('expense_dialog').add_desc}
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
                  <Label htmlFor="merchant" className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">{t('expense_dialog').merchant_label} *</Label>
                  <Input
                    id="merchant"
                    value={form.merchant}
                    onChange={(e) => set('merchant', e.target.value)}
                    placeholder={t('expense_dialog').merchant_placeholder}
                    className="rounded-xl bg-neutral-50 border-neutral-100 focus:bg-white h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">{t('expense_dialog').amount_label} *</Label>
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
                  <Label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">{t('expense_dialog').date_label} *</Label>
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger
                      className={cn(
                        'w-full flex items-center justify-start gap-3 rounded-xl border border-neutral-100 bg-neutral-50 px-3 h-11 text-sm font-medium transition-all hover:bg-neutral-100',
                        !form.date && 'text-neutral-400'
                      )}
                    >
                      <CalendarIcon className="h-4 w-4 text-neutral-400" />
                      {form.date ? format(new Date(form.date + 'T12:00:00'), 'MMM d, yyyy', { locale }) : (lang === 'es' ? 'Seleccionar fecha' : 'Pick a date')}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-neutral-100">
                      <Calendar
                        mode="single"
                        locale={locale}
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
                  <Label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">{t('expense_dialog').category_label}</Label>
                  <Select
                    value={form.category_id}
                    onValueChange={(v) => set('category_id', v ?? '')}
                  >
                    <SelectTrigger className="rounded-xl bg-neutral-50 border-neutral-100 focus:bg-white h-11">
                      <SelectValue placeholder={lang === 'es' ? 'Seleccionar categoría' : 'Select category'}>
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
                  <Label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">{t('expense_dialog').payment_method_label}</Label>
                  <Select
                    value={form.payment_method}
                    onValueChange={(v) => set('payment_method', v ?? '')}
                  >
                    <SelectTrigger className="rounded-xl bg-neutral-50 border-neutral-100 focus:bg-white h-11">
                      <SelectValue placeholder={lang === 'es' ? 'Seleccionar método' : 'Select method'}>
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
                  <Label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">{t('expense_dialog').tax_label}</Label>
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
                  <Label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">{t('expense_dialog').card_last_four_label}</Label>
                  <Input
                    value={form.card_last_four}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 4)
                      set('card_last_four', v)
                    }}
                    placeholder={t('expense_dialog').card_last_four_placeholder}
                    maxLength={4}
                    inputMode="numeric"
                    className="rounded-xl bg-neutral-50 border-neutral-100 focus:bg-white h-11 font-mono"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">{t('expense_dialog').notes_label}</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => set('notes', e.target.value)}
                    placeholder={t('expense_dialog').notes_placeholder}
                    rows={3}
                    className="rounded-xl bg-neutral-50 border-neutral-100 focus:bg-white resize-none"
                  />
                </div>

                {!expense && (
                  <div className="col-span-2 pt-2">
                    <label className="flex items-center gap-3 cursor-pointer group select-none">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={isRecurring}
                          onChange={(e) => setIsRecurring(e.target.checked)}
                        />
                        <div className={cn(
                          'h-5 w-5 rounded-md border-2 transition-all flex items-center justify-center',
                          isRecurring
                            ? 'bg-[#171717] border-[#171717]'
                            : 'bg-white border-neutral-300 group-hover:border-neutral-400'
                        )}>
                          {isRecurring && (
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-neutral-700">{t('recurring').make_recurring}</span>
                    </label>

                    {isRecurring && (
                      <div className="mt-4 grid grid-cols-2 gap-4 pl-8 animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">{t('recurring').frequency} *</Label>
                          <Select
                            value={recurringFrequency}
                            onValueChange={(v) => setRecurringFrequency(v as RecurringFrequency)}
                          >
                            <SelectTrigger className="rounded-xl bg-neutral-50 border-neutral-100 focus:bg-white h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-neutral-100 shadow-xl">
                              {RECURRING_FREQUENCY_VALUES.map((v) => (
                                <SelectItem key={v} value={v} label={t('recurring')[v]}>{t('recurring')[v]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">{t('recurring').end_date}</Label>
                          <Input
                            type="date"
                            value={recurringEndDate}
                            onChange={(e) => setRecurringEndDate(e.target.value)}
                            min={form.date}
                            className="rounded-xl bg-neutral-50 border-neutral-100 focus:bg-white h-11"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-6 border-t border-neutral-100">
                <Button 
                  type="button" 
                  onClick={onClose} 
                  className="flex-1 rounded-lg h-9 text-sm font-semibold bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-all shadow-sm"
                >
                  {t('expense_dialog').cancel}
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
                  {expense ? t('expense_dialog').save_changes : t('expenses').add_expense}
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
            {duplicateWarning?.exact 
              ? (lang === 'es' ? 'Posible duplicado' : 'Possible duplicate') 
              : (lang === 'es' ? 'Gasto similar encontrado' : 'Similar expense found')}
          </DialogTitle>
          <DialogDescription>
            {duplicateWarning?.exact
              ? (lang === 'es' 
                  ? 'Ya existe un gasto con el mismo comercio, monto, fecha y categoría. ¿Estás seguro de que quieres añadirlo?' 
                  : 'An expense with the same merchant, amount, date, and category already exists. Are you sure you want to add it?')
              : (lang === 'es' 
                  ? 'Ya existe un gasto con el mismo monto, fecha y categoría pero con un comercio diferente. Esto podría ser un duplicado. ¿Quieres proceder?' 
                  : 'An expense with the same amount, date, and category already exists but with a different merchant. This could be a duplicate. Do you want to proceed?')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-3">
          <Button 
            className="flex-1 rounded-lg h-9 text-sm font-semibold bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-all shadow-sm" 
            onClick={() => { setDuplicateWarning(null); setPendingSubmit(null) }}
          >
            {t('expense_dialog').cancel}
          </Button>
          <Button 
            className="flex-1 rounded-lg h-9 text-sm font-semibold bg-[#171717] text-white hover:bg-neutral-800 transition-all shadow-sm"
            onClick={async () => { setDuplicateWarning(null); await pendingSubmit?.() }}
          >
            {t('expense_dialog').save_anyway}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
