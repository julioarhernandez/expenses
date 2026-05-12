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
import type { Expense } from '@/types'

const PAYMENT_LABELS: Record<string, string> = {
  credit_card: 'Credit card',
  debit_card: 'Debit card',
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  other: 'Other',
}

interface ExpenseTableProps {
  expenses: Expense[]
  isLoading: boolean
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

export function ExpenseTable({ expenses, isLoading, onEdit, onDelete }: ExpenseTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
        <p className="text-sm">No expenses yet.</p>
        <p className="text-xs mt-1">Click &ldquo;Add expense&rdquo; to get started.</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Merchant</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((expense) => (
          <TableRow key={expense.id} className="group">
            <TableCell className="font-medium">{expense.merchant}</TableCell>
            <TableCell className="text-muted-foreground text-xs tabular-nums whitespace-nowrap">
              {format(new Date(expense.date), 'MMM d, yy')}
            </TableCell>
            <TableCell className="text-right font-mono font-medium">
              {Number(expense.amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </TableCell>
            <TableCell>
              {expense.category ? (
                <Badge
                  variant="secondary"
                  style={{ backgroundColor: expense.category.color + '20', color: expense.category.color }}
                >
                  {expense.category.name}
                </Badge>
              ) : (
                <span className="text-muted-foreground text-sm">—</span>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
              {expense.payment_method ? (
                <>
                  {PAYMENT_LABELS[expense.payment_method]}
                  {expense.card_last_four && (
                    <span className="ml-1 font-mono text-xs">••••{expense.card_last_four}</span>
                  )}
                </>
              ) : '—'}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {expense.receipt_url && (
                    <>
                      <DropdownMenuItem
                        onClick={() => window.open(expense.receipt_url!, '_blank', 'noopener,noreferrer')}
                        className="flex items-center"
                      >
                        <Receipt className="mr-2 h-4 w-4" />Receipt
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => onEdit(expense)}>
                    <Pencil className="mr-2 h-4 w-4" />Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(expense)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
