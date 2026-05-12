'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'
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
    notes: '',
    receipt_url: '',
    receipt_path: '',
    workspace_id: workspaceId,
  }
}

export function ExpenseDialog({ open, onClose, expense, categories }: ExpenseDialogProps) {
  const { addExpense, updateExpense: updateStore } = useExpenseStore()
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm(activeWorkspaceId ?? ''))
  const [dateOpen, setDateOpen] = useState(false)

  useEffect(() => {
    if (expense) {
      setForm({
        merchant: expense.merchant,
        amount: String(expense.amount),
        tax_amount: expense.tax_amount != null ? String(expense.tax_amount) : '',
        date: expense.date,
        category_id: expense.category_id ?? '',
        payment_method: expense.payment_method ?? '',
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
    setForm((f) => ({
      ...f,
      merchant: data.merchant || f.merchant,
      amount: data.amount ? String(data.amount) : f.amount,
      tax_amount: data.tax_amount != null ? String(data.tax_amount) : f.tax_amount,
      date: data.date || f.date,
      payment_method: (data.payment_method as PaymentMethod) || f.payment_method,
    }))
  }

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.merchant || !form.amount || !form.date) return
    setSaving(true)
    try {
      const payload = {
        merchant: form.merchant,
        amount: parseFloat(form.amount),
        currency: 'USD',
        tax_amount: form.tax_amount ? parseFloat(form.tax_amount) : null,
        date: form.date,
        category_id: form.category_id || null,
        payment_method: (form.payment_method as PaymentMethod) || null,
        notes: form.notes || null,
        receipt_url: form.receipt_url || null,
        receipt_path: form.receipt_path || null,
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

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg min-w-[350px] overflow-y-auto p-6">
        <SheetHeader className="mb-6">
          <SheetTitle>{expense ? 'Edit expense' : 'Add expense'}</SheetTitle>
        </SheetHeader>

        <ReceiptUploader
          onReceiptUploaded={({ url, path }) => {
            set('receipt_url', url)
            set('receipt_path', path)
          }}
          onExtractionComplete={applyOcrExtraction}
          existingUrl={form.receipt_url}
        />

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="merchant">Merchant *</Label>
              <Input
                id="merchant"
                value={form.merchant}
                onChange={(e) => set('merchant', e.target.value)}
                placeholder="Acme Corp"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger
                  className={cn(
                    'flex w-full items-center justify-start gap-2 rounded-md border bg-background px-3 py-2 text-sm font-normal ring-offset-background text-left transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    !form.date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {form.date ? format(new Date(form.date + 'T12:00:00'), 'MMM d, yyyy') : 'Pick a date'}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
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

            <div className="space-y-1.5">
              <Label>Tax amount</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.tax_amount}
                onChange={(e) => set('tax_amount', e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category_id}
                onValueChange={(v) => set('category_id', v ?? '')}
                items={categories.map((c) => ({ value: c.id, label: c.name }))}
              >
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: c.color }} />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <Select
                value={form.payment_method}
                onValueChange={(v) => set('payment_method', v ?? '')}
                items={PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))}
              >
                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Optional notes…"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {expense ? 'Save changes' : 'Add expense'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
