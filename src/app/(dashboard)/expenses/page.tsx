'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Download, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ExpenseTable } from '@/components/expenses/ExpenseTable'
import { RecurringExpenseDialog } from '@/components/expenses/RecurringExpenseDialog'
import { ExpenseFiltersOverlay } from '@/components/expenses/ExpenseFiltersOverlay'
import { HelpSupportCard } from '@/components/help/HelpSupportCard'
import { useExpenseStore } from '@/store/expenses'
import { useWorkspaceStore } from '@/store/workspace'
import { useTranslation } from '@/hooks/useTranslation'
import { fetchExpenses, softDeleteExpense } from '@/lib/expenses'
import { deactivateRecurringExpense } from '@/lib/recurring'
import { exportToCSV } from '@/lib/export'
import { createClient } from '@/lib/supabase/client'
import type { Category, Expense } from '@/types'

import { HeaderUpdater } from '@/components/layout/HeaderUpdater'

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
  const searchParams = useSearchParams()

  // Handle URL search params
  useEffect(() => {
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const q = searchParams.get('q')
    const category_id = searchParams.get('category_id')
    const reset = searchParams.get('reset')
    const shareUrl = searchParams.get('share_url')
    const sharePath = searchParams.get('share_path')
    const isNew = searchParams.get('new')

    if (shareUrl) {
      openDialog({ sharedReceiptUrl: shareUrl, sharedReceiptPath: sharePath })
    } else if (isNew === 'true') {
      openDialog()
    } else if (reset === 'true') {
      handleResetFilters()
    } else if (from || to || q || category_id) {
      setFilters({
        from: from || null,
        to: to || null,
        q: q || '',
        category_id: category_id || null,
      })
      setFiltersOpen(true)
      if (from || to) {
        setDatePeriod('custom')
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

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
      .catch((err) => { if (navigator.onLine) toast.error(err.message) })
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

  function openEdit(expense: Expense) {
    openDialog({ expense })
  }

  const hasFilters = !!(
    filters.q || filters.from || filters.to || filters.category_id ||
    filters.payment_method || filters.min_amount != null || filters.max_amount != null ||
    filters.is_recurring != null
  )

  return (
    <div className="min-h-full bg-background px-6 pt-2 pb-32">
      <HeaderUpdater title={t('nav').expenses} />

      {/* Top Action Row */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setFiltersOpen(true)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold border transition-all active:scale-[0.98]",
            hasFilters 
                ? "bg-foreground text-background border-foreground shadow-md" 
                : "bg-muted/30 text-foreground border-border/50 hover:border-foreground/30"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t('expenses').filters}
          {hasFilters && (
            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-indigo-500 text-white text-[10px] ml-1">
                !
            </div>
          )}
        </button>

        <button
          onClick={() => exportToCSV(expenses)}
          className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold border border-border/50 bg-muted/30 text-foreground hover:border-foreground/30 transition-all active:scale-[0.98]"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">{t('expenses').export_csv}</span>
        </button>
      </div>

      {/* Filter Subpage (Overlay) */}
      <ExpenseFiltersOverlay
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        setFilters={setFilters}
        resetFilters={handleResetFilters}
        categories={categories}
        datePeriod={datePeriod}
        applyDatePeriod={applyDatePeriod}
        amountOp={amountOp}
        setAmountOp={setAmountOp}
        amountVal={amountVal}
        setAmountVal={setAmountVal}
        amountVal2={amountVal2}
        setAmountVal2={setAmountVal2}
        applyAmountFilter={applyAmountFilter}
      />

      {/* Table Container */}
      <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden mb-12">
        <ExpenseTable
          expenses={expenses}
          isLoading={isLoading}
          onEdit={openEdit}
          onDelete={handleDelete}
          onEditRecurring={setEditingRecurringId}
          onDeleteRecurring={handleDeleteRecurring}
        />
      </div>

      <HelpSupportCard topic="expenses" />

      <RecurringExpenseDialog
        recurringId={editingRecurringId}
        categories={categories}
        onClose={() => setEditingRecurringId(null)}
        onSaved={() => { setEditingRecurringId(null); setRefreshKey((k) => k + 1) }}
      />
    </div>
  )
}
