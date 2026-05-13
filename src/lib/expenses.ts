import { addDays, addMonths, addYears, subYears } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { fetchRecurringExpenses } from '@/lib/recurring'
import type { Expense, ExpenseFilters, RecurringExpense, RecurringFrequency } from '@/types'

function advanceByFrequency(date: Date, frequency: RecurringFrequency): Date {
  switch (frequency) {
    case 'daily': return addDays(date, 1)
    case 'weekly': return addDays(date, 7)
    case 'monthly': return addMonths(date, 1)
    case 'yearly': return addYears(date, 1)
  }
}

function expandRecurring(recurring: RecurringExpense, from: Date, to: Date): Expense[] {
  const occurrences: Expense[] = []
  const startDate = new Date(recurring.start_date + 'T12:00:00')
  const upperBound = recurring.end_date
    ? new Date(Math.min(new Date(recurring.end_date + 'T12:00:00').getTime(), to.getTime()))
    : to

  let current = new Date(startDate)

  // Advance to first occurrence on or after 'from'
  while (current < from) {
    current = advanceByFrequency(current, recurring.frequency)
    if (current > upperBound) return occurrences
  }

  while (current <= upperBound) {
    const dateStr = current.toISOString().split('T')[0]
    occurrences.push({
      id: `recurring-${recurring.id}-${dateStr}`,
      user_id: recurring.user_id,
      workspace_id: recurring.workspace_id,
      category_id: recurring.category_id,
      merchant: recurring.merchant,
      amount: recurring.amount,
      currency: recurring.currency,
      tax_amount: null,
      date: dateStr,
      payment_method: null,
      card_last_four: null,
      notes: recurring.notes,
      receipt_url: null,
      receipt_path: null,
      is_deleted: false,
      created_at: recurring.created_at,
      updated_at: recurring.updated_at,
      category: recurring.category,
      is_recurring: true,
      recurring_expense_id: recurring.id,
    })
    current = advanceByFrequency(current, recurring.frequency)
  }

  return occurrences
}

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

  const today = new Date()
  const fromDate = filters.from ? new Date(filters.from + 'T12:00:00') : subYears(today, 1)
  const toDate = filters.to ? new Date(filters.to + 'T12:00:00') : today

  const [{ data, error }, recurringList] = await Promise.all([
    query,
    fetchRecurringExpenses(workspaceId),
  ])
  if (error) throw error

  const regularExpenses = data as Expense[]

  // Expand recurring into virtual occurrences within the date window
  let recurringRows = recurringList.flatMap((r) => expandRecurring(r, fromDate, toDate))

  // Apply the same client-side filters to recurring rows
  if (filters.q) {
    const q = filters.q.toLowerCase()
    recurringRows = recurringRows.filter(
      (r) => r.merchant.toLowerCase().includes(q) || (r.notes?.toLowerCase().includes(q) ?? false)
    )
  }
  if (filters.category_id) {
    recurringRows = recurringRows.filter((r) => r.category_id === filters.category_id)
  }
  if (filters.min_amount != null) {
    recurringRows = recurringRows.filter((r) => r.amount >= filters.min_amount!)
  }
  if (filters.max_amount != null) {
    recurringRows = recurringRows.filter((r) => r.amount <= filters.max_amount!)
  }
  // Recurring expenses have no payment_method — exclude them if that filter is active
  if (filters.payment_method) {
    recurringRows = []
  }

  const all = [...regularExpenses, ...recurringRows]
  all.sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date)
    return b.created_at.localeCompare(a.created_at)
  })

  return all
}

export async function createExpense(
  payload: Omit<Expense, 'id' | 'user_id' | 'is_deleted' | 'created_at' | 'updated_at' | 'category' | 'is_recurring' | 'recurring_expense_id'>
): Promise<Expense> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('expenses')
    .insert({ ...payload, user_id: user.id })
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

export async function softDeleteExpense(id: string, receiptsPath?: string | null): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('expenses')
    .update({ is_deleted: true })
    .eq('id', id)
  if (error) throw error

  if (receiptsPath) {
    await supabase.storage.from('receipts').remove([receiptsPath])
  }
}
