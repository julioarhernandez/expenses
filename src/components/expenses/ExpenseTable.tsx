'use client'

import { format } from 'date-fns'
import { MoreVertical, Pencil, Receipt, RefreshCw, Trash2, WifiOff } from 'lucide-react'
import { isPending } from '@/hooks/useOfflineSync'
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
import { cn } from '@/lib/utils'
import type { Expense } from '@/types'

interface ExpenseTableProps {
  expenses: Expense[]
  isLoading: boolean
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
  onEditRecurring?: (recurringId: string) => void
  onDeleteRecurring?: (recurringId: string) => void
}

export function ExpenseTable({ expenses, isLoading, onEdit, onDelete, onEditRecurring, onDeleteRecurring }: ExpenseTableProps) {
  const { t, lang } = useTranslation()
  const locale = lang === 'es' ? es : enUS

  const PAYMENT_LABELS: Record<string, string> = {
    credit_card: lang === 'es' ? 'Tarjeta de crédito' : 'Credit card',
    debit_card: lang === 'es' ? 'Tarjeta de débito' : 'Debit card',
    cash: lang === 'es' ? 'Efectivo' : 'Cash',
    bank_transfer: lang === 'es' ? 'Transferencia bancaria' : 'Bank transfer',
    other: lang === 'es' ? 'Otro' : 'Other',
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
      <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
        <p className="text-sm font-medium">{t('expenses').no_expenses}</p>
        <p className="text-xs mt-1">
          {t('expenses').no_expenses_subtitle}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-muted/30 border-b border-border/50">
            <th className="px-3 py-3 w-10" />
            <th className="pr-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('expenses').merchant}</th>
            <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest w-[140px]">{t('expenses').date}</th>
            <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest text-right">{t('expenses').amount}</th>
            <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest text-right">{t('expenses').category}</th>
            <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('expenses').payment_method}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {expenses.map((expense) => {
            const pending = isPending(expense)
            return (
            <tr key={expense.id} className={cn("hover:bg-muted/20 transition-colors group", pending && "opacity-60")}>
              <td className="px-3 py-4">
                {pending ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg text-amber-500">
                    <WifiOff className="h-4 w-4" />
                  </div>
                ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all outline-none">
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52 rounded-2xl p-2 shadow-xl border-border">
                    {expense.is_recurring ? (
                      <>
                        <DropdownMenuItem
                          onClick={() => onEditRecurring?.(expense.recurring_expense_id!)}
                          className="rounded-xl px-3 py-2 cursor-pointer transition-colors focus:bg-accent"
                        >
                          <RefreshCw className="mr-3 h-4 w-4" />{t('recurring').edit_recurring}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteRecurring?.(expense.recurring_expense_id!)}
                          className="rounded-xl px-3 py-2 cursor-pointer"
                          variant="destructive"
                        >
                          <Trash2 className="mr-3 h-4 w-4" />{t('recurring').delete_recurring}
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        {expense.receipt_url && (
                          <>
                            <DropdownMenuItem
                              onClick={() => window.open(expense.receipt_url!, '_blank', 'noopener,noreferrer')}
                              className="rounded-xl px-3 py-2 cursor-pointer transition-colors focus:bg-accent"
                            >
                              <Receipt className="mr-3 h-4 w-4" />{t('recurring').receipt}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border/50" />
                          </>
                        )}
                        <DropdownMenuItem onClick={() => onEdit(expense)} className="rounded-xl px-3 py-2 cursor-pointer transition-colors focus:bg-accent">
                          <Pencil className="mr-3 h-4 w-4" />{t('recurring').edit}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(expense)}
                          className="rounded-xl px-3 py-2 cursor-pointer"
                          variant="destructive"
                        >
                          <Trash2 className="mr-3 h-4 w-4" />{t('recurring').delete}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                )}
              </td>
              <td className="pr-4 py-4 max-w-[200px]">
                <div className="flex items-center gap-2">
                  {expense.is_recurring && (
                    <span className="inline-flex items-center justify-center p-1 rounded-full bg-violet-500/10 text-violet-500 border border-violet-500/20 shrink-0">
                      <RefreshCw className="h-2.5 w-2.5" />
                    </span>
                  )}
                  <span className="font-semibold text-foreground text-base truncate">{expense.merchant}</span>
                  {pending && (
                    <span className="ml-1 text-[10px] font-semibold text-amber-500 whitespace-nowrap">pending sync</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-base text-muted-foreground font-medium w-[140px] whitespace-nowrap">
                {format(new Date(expense.date + 'T12:00:00'), 'MM/dd/yyyy')}
              </td>
              <td className="px-6 py-4 text-right">
                <span className="font-bold text-foreground text-base tabular-nums">
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
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap"
                  >
                    {expense.category.name}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-6 py-4 text-base text-muted-foreground font-medium">
                {expense.payment_method ? (
                  <span className="whitespace-nowrap">
                    {PAYMENT_LABELS[expense.payment_method]}
                    {expense.card_last_four && (
                      <span className="ml-1 text-[10px] text-muted-foreground/70">••••{expense.card_last_four}</span>
                    )}
                  </span>
                ) : <span className="text-muted-foreground/50">—</span>}
              </td>
            </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border/50 bg-muted/30">
            <td className="px-3 py-3" />
            <td className="px-6 py-3" colSpan={2}>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {expenses.length} {expenses.length === 1 ? t('expenses').transactions_one : t('expenses').transactions_other}
              </span>
            </td>
            <td className="px-6 py-3 text-right">
              <span className="font-bold text-foreground text-base tabular-nums">
                {expenses.reduce((s, e) => s + Number(e.amount), 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </span>
            </td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
