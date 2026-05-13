'use client'

import { Plus } from 'lucide-react'
import { useExpenseStore } from '@/store/expenses'

export function AddExpenseButton() {
  const openDialog = useExpenseStore((s) => s.openDialog)
  return (
    <button
      onClick={() => openDialog()}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#171717] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 transition-colors"
    >
      <Plus className="h-4 w-4" />
      Add Expense
    </button>
  )
}
