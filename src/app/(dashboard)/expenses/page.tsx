'use client'

import { useEffect, useState } from 'react'
import { Plus, Download, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ExpenseTable } from '@/components/expenses/ExpenseTable'
import { ExpenseDialog } from '@/components/expenses/ExpenseDialog'
import { RecurringExpenseDialog } from '@/components/expenses/RecurringExpenseDialog'
import { useExpenseStore } from '@/store/expenses'
import { useWorkspaceStore } from '@/store/workspace'
import { useTranslation } from '@/hooks/useTranslation'
import { fetchExpenses, softDeleteExpense } from '@/lib/expenses'
import { deactivateRecurringExpense } from '@/lib/recurring'
import { exportToCSV } from '@/lib/export'
import { createClient } from '@/lib/supabase/client'
import type { Category, Expense } from '@/types'

export default function ExpensesPage() {
  const { expenses, filters, isLoading, setExpenses, setFilters, resetFilters, removeExpense, setLoading, openDialog } =
    useExpenseStore()
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const { t, lang } = useTranslation()
  const [categories, setCategories] = useState<Category[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [editingRecurringId, setEditingRecurringId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [datePeriod, setDatePeriod] = useState<'all' | 'this_month' | 'last_month' | 'last_3' | 'this_year' | 'custom'>('all')
  const [amountOp, setAmountOp] = useState<'' | 'lt' | 'gt' | 'eq' | 'between'>('')
  const [amountVal, setAmountVal] = useState('')
  const [amountVal2, setAmountVal2] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('name')
      .then(({ data }) => setCategories((data as Category[]) ?? []))
  }, [])

  useEffect(() => {
    if (!activeWorkspaceId) return
    setLoading(true)
    fetchExpenses(activeWorkspaceId, filters)
      .then(setExpenses)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [activeWorkspaceId, filters, setExpenses, setLoading, refreshKey])

  function applyDatePeriod(period: typeof datePeriod) {
    setDatePeriod(period)
    if (period === 'custom') return
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const presets: Record<string, { from: string | null; to: string | null }> = {
      all: { from: null, to: null },
      this_month: { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0], to: today },
      last_month: {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0],
        to: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0],
      },
      last_3: { from: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0], to: today },
      this_year: { from: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0], to: today },
    }
    setFilters(presets[period])
  }

  function applyAmountFilter(op: typeof amountOp, val: string, val2 = amountVal2) {
    const v = parseFloat(val)
    const v2 = parseFloat(val2)
    if (!op || !val || isNaN(v)) {
      setFilters({ min_amount: null, max_amount: null })
    } else if (op === 'lt') {
      setFilters({ min_amount: null, max_amount: v })
    } else if (op === 'gt') {
      setFilters({ min_amount: v, max_amount: null })
    } else if (op === 'eq') {
      setFilters({ min_amount: v, max_amount: v })
    } else if (op === 'between') {
      setFilters({ min_amount: v, max_amount: !isNaN(v2) && val2 ? v2 : null })
    }
  }

  function handleResetFilters() {
    resetFilters()
    setDatePeriod('all')
    setAmountOp('')
    setAmountVal('')
    setAmountVal2('')
  }

  async function handleDelete(expense: Expense) {
    const message = lang === 'es' 
      ? `¿Eliminar "${expense.merchant}"?` 
      : `Delete "${expense.merchant}"?`
    if (!confirm(message)) return
    try {
      await softDeleteExpense(expense.id, expense.receipt_path)
      removeExpense(expense.id)
      toast.success(lang === 'es' ? 'Gasto eliminado' : 'Expense deleted')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : (lang === 'es' ? 'Error al eliminar' : 'Failed to delete'))
    }
  }

  async function handleDeleteRecurring(recurringId: string) {
    if (!confirm('Stop this recurring expense? All future occurrences will no longer appear.')) return
    try {
      await deactivateRecurringExpense(recurringId)
      toast.success('Recurring expense stopped')
      setRefreshKey((k) => k + 1)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  function openCreate() {
    openDialog()
  }

  function openEdit(expense: Expense) {
    openDialog({ expense })
  }

  const hasFilters = !!(
    filters.q || filters.from || filters.to || filters.category_id ||
    filters.payment_method || filters.min_amount != null || filters.max_amount != null ||
    filters.is_recurring != null
  )

  return (
    <div className="max-w-[1280px] mx-auto p-6 md:p-8 space-y-8 bg-[#FAFAFA] min-h-screen">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#171717]">{t('nav').expenses}</h1>
          <p className="text-neutral-500 font-medium">{t('expenses').subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={() => setFiltersOpen((o) => !o)}
            className={cn(
              "rounded-lg border-neutral-200 bg-white px-3 md:px-4 h-9 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 transition-all",
              filtersOpen && "bg-neutral-100 border-neutral-300"
            )}
          >
            <SlidersHorizontal className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">{t('expenses').filters}</span>
            {hasFilters && (
              <span className="ml-1.5 md:ml-2 h-2 w-2 rounded-full bg-[#6366F1]" />
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => exportToCSV(expenses)}
            className="rounded-lg border-neutral-200 bg-white px-3 md:px-4 h-9 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 transition-all"
          >
            <Download className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">{t('expenses').export_csv}</span>
          </Button>
          <Button 
            onClick={openCreate}
            className="rounded-lg bg-[#171717] px-4 h-9 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 transition-all ml-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('expenses').add_expense}
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {filtersOpen && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] animate-in fade-in slide-in-from-top-4 space-y-4">

          {/* Row 1: Search + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder={t('expenses').search_placeholder}
              value={filters.q}
              onChange={(e) => setFilters({ q: e.target.value })}
              className="rounded-lg bg-neutral-50 border-neutral-100 focus:bg-white h-9 text-sm"
            />
            <Select
              value={filters.category_id ?? ''}
              onValueChange={(v) => setFilters({ category_id: v || null })}
            >
              <SelectTrigger className="rounded-lg bg-neutral-50 border-neutral-100 focus:bg-white h-9 text-sm">
                <SelectValue placeholder={t('expenses').all_categories}>
                  {filters.category_id ? categories.find(c => c.id === filters.category_id)?.name : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-neutral-100 shadow-xl">
                <SelectItem value="" label={t('expenses').all_categories}>{t('expenses').all_categories}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id} label={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Row 2: Date period chips */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-0.5">{t('expenses').date}</label>
            <div className="flex flex-wrap gap-1.5">
              {([
                { value: 'all', label: t('expenses').date_all },
                { value: 'this_month', label: t('expenses').date_this_month },
                { value: 'last_month', label: t('expenses').date_last_month },
                { value: 'last_3', label: t('expenses').date_last_3 },
                { value: 'this_year', label: t('expenses').date_this_year },
                { value: 'custom', label: t('expenses').date_custom },
              ] as const).map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => applyDatePeriod(p.value)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold border transition-all',
                    datePeriod === p.value
                      ? 'bg-[#171717] text-white border-[#171717]'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:text-neutral-900'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {datePeriod === 'custom' && (
              <div className="flex gap-2 pt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                <Input
                  type="date"
                  value={filters.from ?? ''}
                  onChange={(e) => setFilters({ from: e.target.value || null })}
                  className="rounded-lg bg-neutral-50 border-neutral-100 focus:bg-white h-9 text-sm"
                />
                <Input
                  type="date"
                  value={filters.to ?? ''}
                  onChange={(e) => setFilters({ to: e.target.value || null })}
                  className="rounded-lg bg-neutral-50 border-neutral-100 focus:bg-white h-9 text-sm"
                />
              </div>
            )}
          </div>

          {/* Row 3: Amount filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-0.5">{t('expenses').amount}</label>
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={amountOp}
                onValueChange={(v) => {
                  const op = (v || '') as typeof amountOp
                  setAmountOp(op)
                  applyAmountFilter(op, amountVal, amountVal2)
                }}
              >
                <SelectTrigger className="rounded-lg bg-neutral-50 border-neutral-100 focus:bg-white h-9 text-sm w-[140px]">
                  <SelectValue placeholder={t('expenses').amount_any}>
                    {amountOp === 'lt' ? t('expenses').amount_lt
                      : amountOp === 'gt' ? t('expenses').amount_gt
                      : amountOp === 'eq' ? t('expenses').amount_eq
                      : amountOp === 'between' ? t('expenses').amount_between
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-neutral-100 shadow-xl">
                  <SelectItem value="" label={t('expenses').amount_any}>{t('expenses').amount_any}</SelectItem>
                  <SelectItem value="lt" label={t('expenses').amount_lt}>{t('expenses').amount_lt}</SelectItem>
                  <SelectItem value="gt" label={t('expenses').amount_gt}>{t('expenses').amount_gt}</SelectItem>
                  <SelectItem value="eq" label={t('expenses').amount_eq}>{t('expenses').amount_eq}</SelectItem>
                  <SelectItem value="between" label={t('expenses').amount_between}>{t('expenses').amount_between}</SelectItem>
                </SelectContent>
              </Select>
              {amountOp && (
                <>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-medium">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amountVal}
                      onChange={(e) => {
                        setAmountVal(e.target.value)
                        applyAmountFilter(amountOp, e.target.value, amountVal2)
                      }}
                      placeholder="0.00"
                      className="rounded-lg bg-neutral-50 border-neutral-100 focus:bg-white h-9 text-sm pl-6 w-28"
                    />
                  </div>
                  {amountOp === 'between' && (
                    <>
                      <span className="text-xs text-neutral-400 font-medium">{t('expenses').amount_and}</span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-medium">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={amountVal2}
                          onChange={(e) => {
                            setAmountVal2(e.target.value)
                            applyAmountFilter(amountOp, amountVal, e.target.value)
                          }}
                          placeholder="0.00"
                          className="rounded-lg bg-neutral-50 border-neutral-100 focus:bg-white h-9 text-sm pl-6 w-28"
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Row 4: Type filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-0.5">{t('recurring').badge}</label>
            <div className="flex gap-1.5">
              {([
                { value: 'all', label: t('expenses').type_all, filter: null },
                { value: 'recurring', label: t('expenses').type_recurring, filter: true },
                { value: 'one_time', label: t('expenses').type_one_time, filter: false },
              ] as const).map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setFilters({ is_recurring: p.filter })}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold border transition-all',
                    filters.is_recurring === p.filter
                      ? 'bg-[#171717] text-white border-[#171717]'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:text-neutral-900'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {hasFilters && (
            <div className="pt-1 flex justify-end border-t border-neutral-50">
              <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-neutral-500 hover:text-red-500 h-8 text-xs">
                <RotateCcw className="h-3 w-3 mr-1.5" />
                {t('expenses').reset_filters}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <ExpenseTable
          expenses={expenses}
          isLoading={isLoading}
          onEdit={openEdit}
          onDelete={handleDelete}
          onEditRecurring={setEditingRecurringId}
          onDeleteRecurring={handleDeleteRecurring}
        />
      </div>

      <RecurringExpenseDialog
        recurringId={editingRecurringId}
        categories={categories}
        onClose={() => setEditingRecurringId(null)}
        onSaved={() => { setEditingRecurringId(null); setRefreshKey((k) => k + 1) }}
      />
    </div>
  )
}
