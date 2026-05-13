'use client'

import { useEffect, useState } from 'react'
import { ExpenseDialog } from './ExpenseDialog'
import { useExpenseStore } from '@/store/expenses'
import { useWorkspaceStore } from '@/store/workspace'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/types'

export function GlobalExpenseDialog() {
  const { isDialogOpen, draftExpense, editingExpense, closeDialog } = useExpenseStore()
  const { activeWorkspaceId } = useWorkspaceStore()
  const [categories, setCategories] = useState<Category[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (!activeWorkspaceId) return
    supabase
      .from('categories')
      .select('*')
      .eq('workspace_id', activeWorkspaceId)
      .then(({ data }) => {
        if (data) setCategories(data)
      })
  }, [activeWorkspaceId])

  return (
    <ExpenseDialog
      open={isDialogOpen}
      onClose={closeDialog}
      expense={editingExpense}
      draft={draftExpense}
      categories={categories}
    />
  )
}
