'use client'

import { format } from 'date-fns'
import { MoreHorizontal, Pencil, Receipt, Trash2 } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslation } from '@/hooks/useTranslation'
import { es, enUS } from 'date-fns/locale'
import type { Expense } from '@/types'

export function ExpenseTable({ expenses, isLoading, onEdit, onDelete }: ExpenseTableProps) {
  const { t, lang } = useTranslation()
  const locale = lang === 'es' ? es : enUS

  const PAYMENT_LABELS: Record<string, string> = {
    credit_card: t('es') === 'es' ? 'Tarjeta de crédito' : 'Credit card',
    debit_card: t('es') === 'es' ? 'Tarjeta de débito' : 'Debit card',
    cash: t('es') === 'es' ? 'Efectivo' : 'Cash',
    bank_transfer: t('es') === 'es' ? 'Transferencia bancaria' : 'Bank transfer',
    other: t('es') === 'es' ? 'Otro' : 'Other',
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-neutral-400">
        <p className="text-sm font-medium">{t('expenses').no_expenses}</p>
        <p className="text-xs mt-1">
          {t('es') === 'es' ? 'Intenta ajustar tus filtros o añade un nuevo gasto.' : 'Try adjusting your filters or add a new expense.'}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-neutral-50/50 border-b border-neutral-100">
            <th className="px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-widest">{t('expenses').merchant}</th>
            <th className="px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-widest w-[140px]">{t('expenses').date}</th>
            <th className="px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-widest text-right">{t('expenses').amount}</th>
            <th className="px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-widest text-right">{t('expenses').category}</th>
            <th className="px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-widest">{t('expenses').payment_method}</th>
            <th className="px-6 py-3 w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {expenses.map((expense) => (
            <tr key={expense.id} className="hover:bg-neutral-50/50 transition-colors group">
              <td className="px-6 py-4">
                <span className="font-semibold text-neutral-800 text-sm">{expense.merchant}</span>
              </td>
              <td className="px-6 py-4 text-sm text-neutral-500 font-medium w-[140px] whitespace-nowrap">
                {format(new Date(expense.date + 'T12:00:00'), 'MMM d, yyyy', { locale })}
              </td>
              <td className="px-6 py-4 text-right">
                <span className="font-bold text-neutral-900 text-sm tabular-nums">
                  {Number(expense.amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                {expense.category ? (
                  <span 
                    style={{ 
                      backgroundColor: expense.category.color + '15', 
                      color: expense.category.color, 
                      borderColor: expense.category.color + '30' 
                    }}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap"
                  >
                    {expense.category.name}
                  </span>
                ) : (
                  <span className="text-neutral-300">—</span>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-neutral-500 font-medium">
                {expense.payment_method ? (
                  <span className="whitespace-nowrap">
                    {PAYMENT_LABELS[expense.payment_method]}
                    {expense.card_last_four && (
                      <span className="ml-1 text-[10px] text-neutral-400">••••{expense.card_last_four}</span>
                    )}
                  </span>
                ) : <span className="text-neutral-300">—</span>}
              </td>
              <td className="px-6 py-4 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-[#171717] hover:bg-neutral-100 transition-all outline-none">
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 shadow-xl border-slate-100">
                    {expense.receipt_url && (
                      <>
                        <DropdownMenuItem
                          onClick={() => window.open(expense.receipt_url!, '_blank', 'noopener,noreferrer')}
                          className="rounded-xl px-3 py-2 cursor-pointer transition-colors focus:bg-slate-50"
                        >
                          <Receipt className="mr-3 h-4 w-4" />{t('es') === 'es' ? 'Recibo' : 'Receipt'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-50" />
                      </>
                    )}
                    <DropdownMenuItem onClick={() => onEdit(expense)} className="rounded-xl px-3 py-2 cursor-pointer transition-colors focus:bg-slate-50">
                      <Pencil className="mr-3 h-4 w-4" />{t('es') === 'es' ? 'Editar' : 'Edit'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(expense)}
                      className="rounded-xl px-3 py-2 cursor-pointer transition-colors focus:bg-red-50 text-red-500 focus:text-red-600"
                    >
                      <Trash2 className="mr-3 h-4 w-4" />{t('es') === 'es' ? 'Eliminar' : 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
