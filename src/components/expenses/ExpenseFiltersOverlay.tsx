'use client'

import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RotateCcw, X, Search, Tag, Calendar, DollarSign, RefreshCw, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Category } from '@/types'

interface ExpenseFiltersOverlayProps {
  isOpen: boolean
  onClose: () => void
  filters: any
  setFilters: (f: any) => void
  resetFilters: () => void
  categories: Category[]
  datePeriod: string
  applyDatePeriod: (p: any) => void
  amountOp: string
  setAmountOp: (o: any) => void
  amountVal: string
  setAmountVal: (v: string) => void
  amountVal2: string
  setAmountVal2: (v: string) => void
  applyAmountFilter: (op: any, val: string, val2?: string) => void
}

export function ExpenseFiltersOverlay({
  isOpen,
  onClose,
  filters,
  setFilters,
  resetFilters,
  categories,
  datePeriod,
  applyDatePeriod,
  amountOp,
  setAmountOp,
  amountVal,
  setAmountVal,
  amountVal2,
  setAmountVal2,
  applyAmountFilter
}: ExpenseFiltersOverlayProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  return (
    <div className="fixed inset-x-0 top-0 bottom-16 z-[90] bg-background flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border/50 flex items-center h-16 px-4 shrink-0">
        <button 
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <div className="flex flex-col ml-1">
          <h1 className="text-lg font-bold text-foreground leading-tight">
            {t('expenses').filters}
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {t('expenses').refine_results ?? 'Refine results'}
          </p>
        </div>
        <button 
          onClick={resetFilters}
          className="ml-auto p-2 rounded-full text-muted-foreground hover:text-destructive transition-colors"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 no-scrollbar">
        
        {/* Search & Category (2 Columns) */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">{t('expenses').search_category ?? 'Search & Category'}</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('expenses').search_placeholder}
                value={filters.q}
                onChange={(e) => setFilters({ q: e.target.value })}
                className="pl-9 rounded-2xl h-12 bg-muted/30 border-border/50 text-sm font-medium focus:bg-background transition-all"
              />
            </div>
            <Select
              value={filters.category_id ?? ''}
              onValueChange={(v) => setFilters({ category_id: v || null })}
            >
              <SelectTrigger className="rounded-2xl h-12 bg-muted/30 border-border/50 text-sm font-medium focus:bg-background transition-all">
                <SelectValue placeholder={t('expenses').all_categories}>
                    <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-indigo-500" />
                        <span className="truncate">
                            {filters.category_id ? categories.find(c => c.id === filters.category_id)?.name : t('expenses').all_categories}
                        </span>
                    </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-2xl shadow-2xl border-border">
                <SelectItem value="" label={t('expenses').all_categories}>{t('expenses').all_categories}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id} label={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date Section */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">{t('expenses').date}</label>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {([
              { value: 'all', label: t('expenses').date_all },
              { value: 'this_month', label: t('expenses').date_this_month },
              { value: 'last_month', label: t('expenses').date_last_month },
              { value: 'last_3', label: t('expenses').date_last_3 },
              { value: 'this_year', label: t('expenses').date_this_year },
              { value: 'custom', label: t('expenses').date_custom },
            ] as const).map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => applyDatePeriod(p.value)}
                className={cn(
                  'flex-shrink-0 px-5 py-2.5 rounded-2xl text-sm font-bold border transition-all',
                  datePeriod === p.value
                    ? 'bg-foreground text-background border-foreground shadow-md'
                    : 'bg-muted/30 text-muted-foreground border-border/50 hover:border-foreground/30'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          
          {datePeriod === 'custom' && (
            <div className="grid grid-cols-2 gap-3 pt-2 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase ml-1">{t('expenses').from ?? 'From'}</span>
                <Input
                  type="date"
                  value={filters.from ?? ''}
                  onChange={(e) => setFilters({ from: e.target.value || null })}
                  className="rounded-2xl h-12 bg-muted/30 border-border/50 text-sm font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase ml-1">{t('expenses').to ?? 'To'}</span>
                <Input
                  type="date"
                  value={filters.to ?? ''}
                  onChange={(e) => setFilters({ to: e.target.value || null })}
                  className="rounded-2xl h-12 bg-muted/30 border-border/50 text-sm font-bold"
                />
              </div>
            </div>
          )}
        </div>

        {/* Amount Section */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">{t('expenses').amount}</label>
          <div className="space-y-3">
            <Select
              value={amountOp}
              onValueChange={(v) => {
                const op = (v || '') as any
                setAmountOp(op)
                applyAmountFilter(op, amountVal, amountVal2)
              }}
            >
              <SelectTrigger className="rounded-2xl h-12 bg-muted/30 border-border/50 text-sm font-bold">
                <SelectValue placeholder={t('expenses').amount_any}>
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        {amountOp === 'lt' ? t('expenses').amount_lt
                        : amountOp === 'gt' ? t('expenses').amount_gt
                            : amountOp === 'eq' ? t('expenses').amount_eq
                            : amountOp === 'between' ? t('expenses').amount_between
                                : t('expenses').amount_any}
                    </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-2xl shadow-2xl border-border">
                <SelectItem value="" label={t('expenses').amount_any}>{t('expenses').amount_any}</SelectItem>
                <SelectItem value="lt" label={t('expenses').amount_lt}>{t('expenses').amount_lt}</SelectItem>
                <SelectItem value="gt" label={t('expenses').amount_gt}>{t('expenses').amount_gt}</SelectItem>
                <SelectItem value="eq" label={t('expenses').amount_eq}>{t('expenses').amount_eq}</SelectItem>
                <SelectItem value="between" label={t('expenses').amount_between}>{t('expenses').amount_between}</SelectItem>
              </SelectContent>
            </Select>

            {amountOp && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amountVal}
                    onChange={(e) => {
                      setAmountVal(e.target.value)
                      applyAmountFilter(amountOp, e.target.value, amountVal2)
                    }}
                    placeholder="0.00"
                    className="rounded-2xl h-12 bg-muted/30 border-border/50 text-sm font-bold pl-8"
                  />
                </div>
                {amountOp === 'between' && (
                  <>
                    <span className="text-xs font-bold text-muted-foreground uppercase">{t('expenses').amount_and}</span>
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={amountVal2}
                        onChange={(e) => {
                          setAmountVal2(e.target.value)
                          applyAmountFilter(amountOp, amountVal, e.target.value)
                        }}
                        placeholder="0.00"
                        className="rounded-2xl h-12 bg-muted/30 border-border/50 text-sm font-bold pl-8"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Type Section */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">{t('recurring').badge}</label>
          <div className="flex gap-2">
            {([
              { value: 'all', label: t('expenses').type_all, filter: null },
              { value: 'recurring', label: t('expenses').type_recurring, icon: RefreshCw, filter: true },
              { value: 'one_time', label: t('expenses').type_one_time, icon: RotateCcw, filter: false },
            ] as const).map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setFilters({ is_recurring: p.filter })}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold border transition-all',
                  filters.is_recurring === p.filter
                    ? 'bg-foreground text-background border-foreground shadow-md'
                    : 'bg-muted/30 text-muted-foreground border-border/50 hover:border-foreground/30'
                )}
              >
                {'icon' in p && p.icon && <p.icon className="h-3.5 w-3.5" />}
                {p.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-border/50 bg-background/80 backdrop-blur-md">
        <Button
          size="lg"
          onClick={onClose}
          className="w-full font-bold"
        >
          {t('common').apply ?? 'Apply Filters'}
        </Button>
      </div>
    </div>
  )
}
