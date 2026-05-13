export type WorkspaceType = 'personal' | 'business' | 'freelance' | 'side_project'

export type PaymentMethod = 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer' | 'other'

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface RecurringExpense {
  id: string
  user_id: string
  workspace_id: string
  category_id: string | null
  merchant: string
  amount: number
  currency: string
  frequency: RecurringFrequency
  start_date: string
  end_date: string | null
  last_generated_date: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  category?: Category
}

export interface Workspace {
  id: string
  user_id: string
  name: string
  type: WorkspaceType
  is_default: boolean
  created_at: string
}

export interface Category {
  id: string
  user_id: string
  workspace_id?: string | null
  name: string
  color: string
  is_default: boolean
  created_at: string
}

export interface Expense {
  id: string
  user_id: string
  workspace_id: string
  category_id: string | null
  merchant: string
  amount: number
  currency: string
  tax_amount: number | null
  date: string
  payment_method: PaymentMethod | null
  card_last_four: string | null
  notes: string | null
  receipt_url: string | null
  receipt_path: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
  category?: Category
  // Virtual fields for recurring expense occurrences (not persisted in DB)
  is_recurring?: boolean
  recurring_expense_id?: string | null
}

export interface ExpenseFilters {
  q: string
  from: string | null
  to: string | null
  category_id: string | null
  min_amount: number | null
  max_amount: number | null
  payment_method: PaymentMethod | null
  is_recurring: boolean | null
}

export interface OcrExtraction {
  merchant: string
  amount: number
  tax_amount: number | null
  date: string
  currency: string
  payment_method: string | null
  card_last_four: string | null
  suggested_category: string | null
}

export interface DashboardStats {
  monthly_total: number
  monthly_change_pct: number
  yearly_total: number
  top_vendors: { merchant: string; total: number }[]
  recent_expenses: Expense[]
  monthly_trend: { month: string; total: number }[]
  category_breakdown: { name: string; color: string; total: number }[]
}
