'use client'

import { useEffect, useState } from 'react'
import { Plus, Download, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ExpenseTable } from '@/components/expenses/ExpenseTable'
import { ExpenseDialog } from '@/components/expenses/ExpenseDialog'
import { useExpenseStore } from '@/store/expenses'
import { useWorkspaceStore } from '@/store/workspace'
import { fetchExpenses, softDeleteExpense } from '@/lib/expenses'
import { exportToCSV } from '@/lib/export'
import { createClient } from '@/lib/supabase/client'
import type { Category, Expense } from '@/types'

export default function ExpensesPage() {
  const { expenses, filters, isLoading, setExpenses, setFilters, resetFilters, removeExpense, setLoading } =
    useExpenseStore()
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)

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
  }, [activeWorkspaceId, filters, setExpenses, setLoading])

  async function handleDelete(expense: Expense) {
    if (!confirm(`Delete "${expense.merchant}"?`)) return
    try {
      await softDeleteExpense(expense.id, expense.receipt_path)
      removeExpense(expense.id)
      toast.success('Expense deleted')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  function openCreate() {
    setEditingExpense(null)
    setDialogOpen(true)
  }

  function openEdit(expense: Expense) {
    setEditingExpense(expense)
    setDialogOpen(true)
  }

  const hasFilters =
    filters.q || filters.from || filters.to || filters.category_id || filters.payment_method

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b">
        <h1 className="text-lg font-semibold">Expenses</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen((o) => !o)}
            className="relative"
          >
            <SlidersHorizontal className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Filters</span>
            {hasFilters && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportToCSV(expenses)}>
            <Download className="h-4 w-4 mr-1.5" /><span className="hidden sm:inline">CSV</span>
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" />Add expense
          </Button>
        </div>
      </div>

      {/* Filters */}
      {filtersOpen && (
      <div className="flex flex-wrap items-center gap-2 px-4 md:px-6 py-3 border-b bg-muted/30">
        <Input
          placeholder="Search merchant or notes…"
          value={filters.q}
          onChange={(e) => setFilters({ q: e.target.value })}
          className="h-8 w-full sm:w-56 bg-background"
        />
        <Input
          type="date"
          value={filters.from ?? ''}
          onChange={(e) => setFilters({ from: e.target.value || null })}
          className="h-8 w-36 bg-background"
          placeholder="From"
        />
        <Input
          type="date"
          value={filters.to ?? ''}
          onChange={(e) => setFilters({ to: e.target.value || null })}
          className="h-8 w-36 bg-background"
          placeholder="To"
        />
        <Select
          value={filters.category_id ?? ''}
          onValueChange={(v) => setFilters({ category_id: v ?? null })}
          items={[{ value: '', label: 'All categories' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
        >
          <SelectTrigger className="h-8 w-40 bg-background">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.payment_method ?? ''}
          onValueChange={(v) => setFilters({ payment_method: (v as Expense['payment_method']) ?? null })}
          items={[
            { value: '', label: 'All methods' },
            { value: 'credit_card', label: 'Credit card' },
            { value: 'debit_card', label: 'Debit card' },
            { value: 'cash', label: 'Cash' },
            { value: 'bank_transfer', label: 'Bank transfer' },
            { value: 'other', label: 'Other' },
          ]}
        >
          <SelectTrigger className="h-8 w-40 bg-background">
            <SelectValue placeholder="Payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All methods</SelectItem>
            <SelectItem value="credit_card">Credit card</SelectItem>
            <SelectItem value="debit_card">Debit card</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="bank_transfer">Bank transfer</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8">
            <RotateCcw className="h-3.5 w-3.5 mr-1" />Clear
          </Button>
        )}
      </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <ExpenseTable
          expenses={expenses}
          isLoading={isLoading}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </div>

      <ExpenseDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        expense={editingExpense}
        categories={categories}
      />
    </div>
  )
}
