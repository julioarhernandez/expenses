import { create } from 'zustand'
import type { Expense, ExpenseFilters } from '@/types'

interface ExpenseStore {
  expenses: Expense[]
  filters: ExpenseFilters
  isLoading: boolean
  setExpenses: (expenses: Expense[]) => void
  addExpense: (expense: Expense) => void
  updateExpense: (id: string, updates: Partial<Expense>) => void
  removeExpense: (id: string) => void
  setFilters: (filters: Partial<ExpenseFilters>) => void
  resetFilters: () => void
  setLoading: (loading: boolean) => void
}

const defaultFilters: ExpenseFilters = {
  q: '',
  from: null,
  to: null,
  category_id: null,
  min_amount: null,
  max_amount: null,
  payment_method: null,
}

export const useExpenseStore = create<ExpenseStore>((set) => ({
  expenses: [],
  filters: defaultFilters,
  isLoading: false,
  setExpenses: (expenses) => set({ expenses }),
  addExpense: (expense) =>
    set((state) => ({ expenses: [expense, ...state.expenses] })),
  updateExpense: (id, updates) =>
    set((state) => ({
      expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),
  removeExpense: (id) =>
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
    })),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: defaultFilters }),
  setLoading: (isLoading) => set({ isLoading }),
}))
