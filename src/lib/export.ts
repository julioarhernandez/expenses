import type { Expense } from '@/types'

export function exportToCSV(expenses: Expense[]) {
  const headers = ['Date', 'Merchant', 'Amount', 'Currency', 'Tax', 'Category', 'Payment Method', 'Notes']

  const rows = expenses.map((e) => {
    const [y, m, d] = e.date.split('-')
    const dateStr = `${m}/${d}/${y}`
    return [
      dateStr,
      e.merchant,
      e.amount,
      e.currency,
      e.tax_amount ?? '',
      e.category?.name ?? '',
      e.payment_method ?? '',
      (e.notes ?? '').replace(/"/g, '""'),
    ]
  })

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
