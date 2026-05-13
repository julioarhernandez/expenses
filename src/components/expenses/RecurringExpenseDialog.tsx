'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, Loader2, RefreshCw } from 'lucide-react'
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
import { fetchRecurringExpenseById, updateRecurringExpense } from '@/lib/recurring'
import type { Category, RecurringExpense, RecurringFrequency } from '@/types'

const RECURRING_FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

interface RecurringExpenseDialogProps {
  recurringId: string | null
  categories: Category[]
  onClose: () => void
  onSaved: () => void
}

function emptyForm(): ReturnType<typeof formFromRecurring> {
  return {
    merchant: '',
    amount: '',
    frequency: 'monthly' as RecurringFrequency,
    start_date: '',
    end_date: '',
    category_id: '',
    notes: '',
  }
}

function formFromRecurring(r: RecurringExpense) {
  return {
    merchant: r.merchant,
    amount: String(r.amount),
    frequency: r.frequency,
    start_date: r.start_date,
    end_date: r.end_date ?? '',
    category_id: r.category_id ?? '',
    notes: r.notes ?? '',
  }
}

export function RecurringExpenseDialog({ recurringId, categories, onClose, onSaved }: RecurringExpenseDialogProps) {
  const [form, setForm] = useState(emptyForm())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [startDateOpen, setStartDateOpen] = useState(false)

  useEffect(() => {
    if (!recurringId) return
    setLoading(true)
    fetchRecurringExpenseById(recurringId)
      .then((r) => setForm(formFromRecurring(r)))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [recurringId])

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!recurringId || !form.merchant || !form.amount || !form.start_date) return
    setSaving(true)
    try {
      await updateRecurringExpense(recurringId, {
        merchant: form.merchant,
        amount: parseFloat(form.amount),
        frequency: form.frequency,
        start_date: form.start_date,
        end_date: form.end_date || null,
        category_id: form.category_id || null,
        notes: form.notes || null,
      })
      toast.success('Recurring expense updated')
      onSaved()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={!!recurringId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg min-w-[350px] overflow-y-auto p-0 border-l border-neutral-100">
        <div className="p-8 space-y-8">
          <SheetHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-2xl font-bold text-[#171717]">Edit Recurring</SheetTitle>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100">
                <RefreshCw className="h-2.5 w-2.5" />
                Recurring
              </span>
            </div>
            <p className="text-sm text-neutral-500 font-medium">
              Changes apply to all future occurrences of this expense.
            </p>
          </SheetHeader>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                <div className="col-span-2 space-y-2">
                  <Label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Merchant *</Label>
                  <Input
                    value={form.merchant}
                    onChange={(e) => set('merchant', e.target.value)}
                    placeholder="Where did you spend?"
                    className="rounded-xl bg-neutral-50 border-neutral-100 focus:bg-white h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Amount *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-medium text-sm">$</span>
                    <Input
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
                  <Label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Frequency *</Label>
                  <Select
                    value={form.frequency}
                    onValueChange={(v) => set('frequency', v ?? 'monthly')}
                  >
                    <SelectTrigger className="rounded-xl bg-neutral-50 border-neutral-100 focus:bg-white h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-neutral-100 shadow-xl">
                      {RECURRING_FREQUENCIES.map((f) => (
                        <SelectItem key={f.value} value={f.value} label={f.label}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Start Date *</Label>
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger
                      className={cn(
                        'w-full flex items-center justify-start gap-3 rounded-xl border border-neutral-100 bg-neutral-50 px-3 h-11 text-sm font-medium transition-all hover:bg-neutral-100',
                        !form.start_date && 'text-neutral-400'
                      )}
                    >
                      <CalendarIcon className="h-4 w-4 text-neutral-400" />
                      {form.start_date ? format(new Date(form.start_date + 'T12:00:00'), 'MMM d, yyyy') : 'Pick a date'}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-neutral-100">
                      <Calendar
                        mode="single"
                        selected={form.start_date ? new Date(form.start_date + 'T12:00:00') : undefined}
                        onSelect={(d) => {
                          if (d) set('start_date', d.toISOString().split('T')[0])
                          setStartDateOpen(false)
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">End Date</Label>
                  <Input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => set('end_date', e.target.value)}
                    min={form.start_date}
                    className="rounded-xl bg-neutral-50 border-neutral-100 focus:bg-white h-11"
                  />
                </div>

                <div className="col-span-2 space-y-2">
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

                <div className="col-span-2 space-y-2">
                  <Label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => set('notes', e.target.value)}
                    placeholder="Add details or descriptions…"
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
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
