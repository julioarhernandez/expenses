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
    <div className="max-w-[1280px] mx-auto p-6 md:p-8 space-y-8 bg-[#FAFAFA] min-h-screen">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#171717]">Expenses</h1>
          <p className="text-neutral-500 font-medium">Manage and track your spending</p>
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
            <span className="hidden md:inline">Filters</span>
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
            <span className="hidden md:inline">Export CSV</span>
          </Button>
          <Button 
            onClick={openCreate}
            className="rounded-lg bg-[#171717] px-4 h-9 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 transition-all ml-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {filtersOpen && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] animate-in fade-in slide-in-from-top-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Search</label>
              <Input
                placeholder="Merchant or notes…"
                value={filters.q}
                onChange={(e) => setFilters({ q: e.target.value })}
                className="rounded-lg bg-neutral-50 border-neutral-100 focus:bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">From Date</label>
              <Input
                type="date"
                value={filters.from ?? ''}
                onChange={(e) => setFilters({ from: e.target.value || null })}
                className="rounded-lg bg-neutral-50 border-neutral-100 focus:bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">To Date</label>
              <Input
                type="date"
                value={filters.to ?? ''}
                onChange={(e) => setFilters({ to: e.target.value || null })}
                className="rounded-lg bg-neutral-50 border-neutral-100 focus:bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Category</label>
              <Select
                value={filters.category_id ?? ''}
                onValueChange={(v) => setFilters({ category_id: v ?? null })}
              >
                <SelectTrigger className="rounded-lg bg-neutral-50 border-neutral-100 focus:bg-white">
                  <SelectValue placeholder="All Categories">
                    {filters.category_id ? categories.find(c => c.id === filters.category_id)?.name : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-neutral-100 shadow-xl">
                  <SelectItem value="" label="All Categories">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id} label={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {hasFilters && (
            <div className="mt-4 pt-4 border-t border-neutral-50 flex justify-end">
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-neutral-500 hover:text-red-500">
                <RotateCcw className="h-3.5 w-3.5 mr-2" />
                Reset Filters
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
