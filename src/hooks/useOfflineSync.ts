'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { getPendingExpenses, removeFromQueue } from '@/lib/offline-queue'
import { createExpense } from '@/lib/expenses'
import { useExpenseStore, PENDING_ID_PREFIX } from '@/store/expenses'
import type { Expense } from '@/types'

export function pendingId(queueId: string) {
  return `${PENDING_ID_PREFIX}${queueId}`
}

export function isPending(expense: Expense) {
  return expense.id.startsWith(PENDING_ID_PREFIX)
}

export function useOfflineSync() {
  const { addExpense, removeExpense, expenses } = useExpenseStore()
  const syncingRef = useRef(false)

  async function sync() {
    if (syncingRef.current || !navigator.onLine) return
    const queue = await getPendingExpenses()
    if (queue.length === 0) return

    syncingRef.current = true
    let synced = 0

    for (const item of queue) {
      try {
        const real = await createExpense(item.payload)
        removeExpense(pendingId(item.queueId))
        addExpense(real)
        await removeFromQueue(item.queueId)
        synced++
      } catch {
        // leave in queue, will retry next time online
      }
    }

    syncingRef.current = false
    if (synced > 0) {
      toast.success(`${synced} expense${synced > 1 ? 's' : ''} synced`)
    }
  }

  useEffect(() => {
    // Restore any pending expenses from IDB into the store on mount
    getPendingExpenses().then((queue) => {
      const existingIds = new Set(expenses.map((e) => e.id))
      for (const item of queue) {
        const id = pendingId(item.queueId)
        if (!existingIds.has(id)) {
          const fakeExpense: Expense = {
            id,
            user_id: '',
            is_deleted: false,
            created_at: item.queuedAt,
            updated_at: item.queuedAt,
            category: undefined,
            is_recurring: false,
            recurring_expense_id: null,
            ...item.payload,
          }
          addExpense(fakeExpense)
        }
      }
      // Try to sync immediately if online
      sync()
    })

    window.addEventListener('online', sync)

    // SW posts a message when a background sync fires
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'SW_SYNC') sync()
    }
    navigator.serviceWorker?.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('online', sync)
      navigator.serviceWorker?.removeEventListener('message', handleMessage)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
