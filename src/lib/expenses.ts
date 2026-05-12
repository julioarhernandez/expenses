import { createClient } from '@/lib/supabase/client'
import type { Expense, ExpenseFilters } from '@/types'

export async function fetchExpenses(workspaceId: string, filters: ExpenseFilters): Promise<Expense[]> {
  const supabase = createClient()
  let query = supabase
    .from('expenses')
    .select('*, category:categories(id,name,color)')
    .eq('workspace_id', workspaceId)
    .eq('is_deleted', false)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters.q) {
    query = query.or(`merchant.ilike.%${filters.q}%,notes.ilike.%${filters.q}%`)
  }
  if (filters.from) query = query.gte('date', filters.from)
  if (filters.to) query = query.lte('date', filters.to)
  if (filters.category_id) query = query.eq('category_id', filters.category_id)
  if (filters.min_amount != null) query = query.gte('amount', filters.min_amount)
  if (filters.max_amount != null) query = query.lte('amount', filters.max_amount)
  if (filters.payment_method) query = query.eq('payment_method', filters.payment_method)

  const { data, error } = await query
  if (error) throw error
  return data as Expense[]
}

export async function createExpense(
  payload: Omit<Expense, 'id' | 'user_id' | 'is_deleted' | 'created_at' | 'updated_at' | 'category'>
): Promise<Expense> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('expenses')
    .insert(payload)
    .select('*, category:categories(id,name,color)')
    .single()
  if (error) throw error
  return data as Expense
}

export async function updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select('*, category:categories(id,name,color)')
    .single()
  if (error) throw error
  return data as Expense
}

export async function softDeleteExpense(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('expenses')
    .update({ is_deleted: true })
    .eq('id', id)
  if (error) throw error
}
