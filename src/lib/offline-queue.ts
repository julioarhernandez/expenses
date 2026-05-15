import type { PaymentMethod } from '@/types'

const DB_NAME = 'nova-expenses-offline'
const DB_VERSION = 1
const STORE_NAME = 'pending'

export type PendingExpensePayload = {
  merchant: string
  amount: number
  currency: string
  tax_amount: number | null
  date: string
  category_id: string | null
  payment_method: PaymentMethod | null
  card_last_four: string | null
  notes: string | null
  receipt_url: string | null
  receipt_path: string | null
  workspace_id: string
}

export interface PendingExpense {
  queueId: string
  queuedAt: string
  payload: PendingExpensePayload
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'queueId' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function enqueueExpense(payload: PendingExpensePayload): Promise<PendingExpense> {
  const db = await openDB()
  const item: PendingExpense = {
    queueId: crypto.randomUUID(),
    queuedAt: new Date().toISOString(),
    payload,
  }
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).add(item)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  return item
}

export async function getPendingExpenses(): Promise<PendingExpense[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => resolve(req.result as PendingExpense[])
    req.onerror = () => reject(req.error)
  })
}

export async function removeFromQueue(queueId: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(queueId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
