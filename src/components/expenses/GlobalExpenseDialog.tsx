'use client'

import { useEffect, useState } from 'react'
import { ExpenseDialog } from './ExpenseDialog'
import { useExpenseStore } from '@/store/expenses'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/types'

export function GlobalExpenseDialog() {
  const { isDialogOpen, draftExpense, editingExpense, sharedReceiptUrl, sharedReceiptPath, closeDialog } = useExpenseStore()
  const [categories, setCategories] = useState<Category[]>([])
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('name')
      .then(({ data }) => {
        if (data) setCategories(data)
      })
  }, [])

  return (
    <ExpenseDialog
      open={isDialogOpen}
      onClose={closeDialog}
      expense={editingExpense}
      draft={draftExpense}
      categories={categories}
      sharedReceiptUrl={sharedReceiptUrl}
      sharedReceiptPath={sharedReceiptPath}
    />
  )
}
