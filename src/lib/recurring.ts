import { createClient } from '@/lib/supabase/client'
import type { RecurringExpense, RecurringFrequency } from '@/types'

export async function createRecurringExpense(payload: {
  merchant: string
  amount: number
  currency: string
  frequency: RecurringFrequency
  start_date: string
  end_date?: string | null
  category_id?: string | null
  notes?: string | null
  workspace_id: string
}): Promise<RecurringExpense> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('recurring_expenses')
    .insert({ ...payload, user_id: user.id })
    .select('*, category:categories(id,name,color)')
    .single()
  if (error) throw error
  return data as RecurringExpense
}

export async function fetchRecurringExpenses(workspaceId: string): Promise<RecurringExpense[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recurring_expenses')
    .select('*, category:categories(id,name,color)')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
  if (error) throw error
  return data as RecurringExpense[]
}

export async function fetchRecurringExpenseById(id: string): Promise<RecurringExpense> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recurring_expenses')
    .select('*, category:categories(id,name,color)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as RecurringExpense
}

export async function updateRecurringExpense(
  id: string,
  updates: {
    merchant?: string
    amount?: number
    frequency?: RecurringFrequency
    start_date?: string
    end_date?: string | null
    category_id?: string | null
    notes?: string | null
  }
): Promise<RecurringExpense> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recurring_expenses')
    .update(updates)
    .eq('id', id)
    .select('*, category:categories(id,name,color)')
    .single()
  if (error) throw error
  return data as RecurringExpense
}

export async function deactivateRecurringExpense(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('recurring_expenses')
    .update({ is_active: false })
    .eq('id', id)
  if (error) throw error
}
