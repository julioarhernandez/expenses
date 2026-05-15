import { create } from 'zustand'
import type { Expense, ExpenseFilters } from '@/types'

export const PENDING_ID_PREFIX = 'pending-'

interface ExpenseStore {
  expenses: Expense[]
  filters: ExpenseFilters
  isLoading: boolean
  isDialogOpen: boolean
  draftExpense: Partial<Expense> | null
  editingExpense: Expense | null
  sharedReceiptUrl: string | null
  sharedReceiptPath: string | null
  setExpenses: (expenses: Expense[]) => void
  addExpense: (expense: Expense) => void
  updateExpense: (id: string, updates: Partial<Expense>) => void
  removeExpense: (id: string) => void
  setFilters: (filters: Partial<ExpenseFilters>) => void
  resetFilters: () => void
  setLoading: (loading: boolean) => void
  openDialog: (data?: {
    draft?: Partial<Expense> | null
    expense?: Expense | null
    sharedReceiptUrl?: string | null
    sharedReceiptPath?: string | null
  }) => void
  closeDialog: () => void
}

const defaultFilters: ExpenseFilters = {
  q: '',
  from: null,
  to: null,
  category_id: null,
  min_amount: null,
  max_amount: null,
  payment_method: null,
  is_recurring: null,
}

export const useExpenseStore = create<ExpenseStore>((set) => ({
  expenses: [],
  filters: defaultFilters,
  isLoading: false,
  isDialogOpen: false,
  draftExpense: null,
  editingExpense: null,
  sharedReceiptUrl: null,
  sharedReceiptPath: null,
  setExpenses: (expenses) =>
    set((state) => ({
      expenses: [
        ...state.expenses.filter((e) => e.id.startsWith(PENDING_ID_PREFIX)),
        ...expenses,
      ],
    })),
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
  openDialog: (data = {}) => set({
    isDialogOpen: true,
    draftExpense: data.draft || null,
    editingExpense: data.expense || null,
    sharedReceiptUrl: data.sharedReceiptUrl ?? null,
    sharedReceiptPath: data.sharedReceiptPath ?? null,
  }),
  closeDialog: () => set({
    isDialogOpen: false,
    draftExpense: null,
    editingExpense: null,
    sharedReceiptUrl: null,
    sharedReceiptPath: null,
  }),
}))
