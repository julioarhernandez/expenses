'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { Download, FileText, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { useTranslation } from '@/hooks/useTranslation'

type PeriodType = 'monthly' | 'quarterly' | 'semi' | 'yearly'

interface DashboardFiltersProps {
  workspaces: any[]
  selectedIds: string[]
  period: PeriodType
  month: number
  quarter: number
  half: number
  year: number
  exportUrl: string
}

const WS_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

export function DashboardFilters({
  workspaces,
  selectedIds,
  period,
  month,
  quarter,
  half,
  year,
  exportUrl
}: DashboardFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const { t, lang } = useTranslation()

  const updateFilters = (updates: Record<string, string | string[]>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        params.set(key, value.join(','))
      } else {
        params.set(key, value)
      }
    })
    
    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  const handlePeriod = (p: PeriodType) => updateFilters({ period: p })
  const handleMonth = (m: number) => updateFilters({ month: m.toString() })
  const handleQuarter = (q: number) => updateFilters({ quarter: q.toString() })
  const handleHalf = (h: number) => updateFilters({ half: h.toString() })
  const handleYear = (y: number) => updateFilters({ year: y.toString() })

  const handleWorkspace = (id: string, checked: boolean) => {
    let next: string[]
    if (checked) {
      next = [...selectedIds, id]
    } else {
      next = selectedIds.filter(x => x !== id)
      if (next.length === 0) return // Must have at least one
    }
    updateFilters({ workspaces: next })
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  const periodLabels: Record<PeriodType, string> = {
    monthly: t('dashboard').period_monthly,
    quarterly: t('dashboard').period_quarterly,
    semi: t('dashboard').period_semi,
    yearly: t('dashboard').period_yearly,
  }

  const selectCls = 'h-9 px-3 text-sm font-semibold rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#6366F1]/40 transition-all w-full'

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        {/* Period type tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl w-full">
          {(['monthly', 'quarterly', 'semi', 'yearly'] as PeriodType[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriod(p)}
              className={cn(
                'flex-1 px-2 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap',
                period === p
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {/* Filters grid */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {period === 'monthly' && (
            <select 
              value={month} 
              onChange={(e) => handleMonth(Number(e.target.value))}
              className={selectCls}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {format(new Date(2024, i, 1), 'MMMM')}
                </option>
              ))}
            </select>
          )}

          {period === 'quarterly' && (
            <select
              value={quarter}
              onChange={(e) => handleQuarter(Number(e.target.value))}
              className={selectCls}
            >
              {[1, 2, 3, 4].map(q => (
                <option key={q} value={q}>Q{q}</option>
              ))}
            </select>
          )}

          {period === 'semi' && (
            <select
              value={half}
              onChange={(e) => handleHalf(Number(e.target.value))}
              className={selectCls}
            >
              <option value={1}>H1</option>
              <option value={2}>H2</option>
            </select>
          )}

          <select 
            value={year} 
            onChange={(e) => handleYear(Number(e.target.value))}
            className={selectCls}
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Loading indicator */}
        {isPending && (
          <div className="flex items-center gap-2 text-muted-foreground px-1">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs font-medium">Updating...</span>
          </div>
        )}
      </div>

      {/* Workspace Selection (App-oriented chips) */}
      {workspaces.length > 1 && (
        <div className="flex flex-col gap-3 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {t('dashboard').compare_workspaces}
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
            {workspaces.map((ws, i) => {
              const active = selectedIds.includes(ws.id)
              const isLast = active && selectedIds.length === 1
              const color = WS_COLORS[i % WS_COLORS.length]
              
              return (
                <button
                  key={ws.id}
                  disabled={isLast}
                  onClick={() => handleWorkspace(ws.id, !active)}
                  className={cn(
                    'flex-shrink-0 flex items-center gap-2.5 px-4 py-2 rounded-full border transition-all text-sm font-bold whitespace-nowrap',
                    active 
                      ? 'bg-foreground text-background border-foreground shadow-md'
                      : 'bg-background text-muted-foreground border-border hover:border-foreground/20'
                  )}
                >
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: active ? 'currentColor' : color }} 
                  />
                  {ws.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border border-border bg-background text-foreground hover:bg-accent transition-all outline-none">
            <Download className="h-5 w-5" />
            {t('expenses').export_csv}
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 rounded-xl p-1.5 shadow-xl border-border bg-card">
            <DropdownMenuItem 
              className="rounded-lg px-3 py-3 cursor-pointer focus:bg-accent transition-colors"
              onClick={() => {
                const link = document.createElement('a')
                link.href = exportUrl + '&mode=reading'
                link.setAttribute('download', '')
                link.click()
              }}
            >
              <div className="flex flex-col gap-0.5 text-left w-full">
                <span className="text-[14px] font-bold">{t('reports').csv_reading}</span>
                <span className="text-[11px] text-muted-foreground">{t('reports').csv_reading_desc}</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="rounded-lg px-3 py-3 cursor-pointer focus:bg-accent transition-colors mt-1"
              onClick={() => {
                const link = document.createElement('a')
                link.href = exportUrl + '&mode=processing'
                link.setAttribute('download', '')
                link.click()
              }}
            >
              <div className="flex flex-col gap-0.5 text-left w-full">
                <span className="text-[14px] font-bold">{t('reports').csv_processing}</span>
                <span className="text-[11px] text-muted-foreground">{t('reports').csv_processing_desc}</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <a
          href={exportUrl + '&format=pdf'}
          download
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border border-border bg-background text-foreground hover:bg-accent transition-all"
        >
          <FileText className="h-5 w-5" />
          {t('expenses').export_pdf}
        </a>
      </div>
    </div>
  )
}
