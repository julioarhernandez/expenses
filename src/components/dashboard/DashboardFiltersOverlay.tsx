'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { X, Download, FileText, ChevronRight, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/hooks/useTranslation'

type PeriodType = 'monthly' | 'quarterly' | 'semi' | 'yearly'

interface DashboardFiltersOverlayProps {
  isOpen: boolean
  onClose: () => void
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

export function DashboardFiltersOverlay({
  isOpen,
  onClose,
  workspaces,
  selectedIds,
  period,
  month,
  quarter,
  half,
  year,
  exportUrl
}: DashboardFiltersOverlayProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const { t } = useTranslation()

  if (!isOpen) return null

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
      if (next.length === 0) return
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

  return (
    <div className="fixed inset-0 z-[120] bg-background flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
          <h2 className="text-xl font-bold text-foreground">
            {t('dashboard').title} {t('expenses').filters}
          </h2>
        </div>
        {isPending && <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
        {/* Period Selection */}
        <section className="space-y-4">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
            {t('dashboard').period_total}
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
            {(['monthly', 'quarterly', 'semi', 'yearly'] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriod(p)}
                className={cn(
                  'px-5 py-2.5 rounded-full text-sm font-bold border transition-all whitespace-nowrap shadow-sm',
                  period === p
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-muted/30 text-muted-foreground border-transparent hover:border-border'
                )}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </section>

        {/* Specific Date Selectors */}
        <section className="space-y-4">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
            {t('expenses').date}
          </label>
          <div className="grid grid-cols-2 gap-4">
            {period === 'monthly' && (
              <div className="relative group">
                <select 
                  value={month} 
                  onChange={(e) => handleMonth(Number(e.target.value))}
                  className="w-full h-12 pl-4 pr-10 appearance-none bg-muted/30 border border-border/50 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {format(new Date(2024, i, 1), 'MMMM')}
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rotate-90" />
              </div>
            )}

            {period === 'quarterly' && (
              <div className="relative group">
                <select
                  value={quarter}
                  onChange={(e) => handleQuarter(Number(e.target.value))}
                  className="w-full h-12 pl-4 pr-10 appearance-none bg-muted/30 border border-border/50 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                >
                  {[1, 2, 3, 4].map(q => (
                    <option key={q} value={q}>Q{q}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rotate-90" />
              </div>
            )}

            {period === 'semi' && (
              <div className="relative group">
                <select
                  value={half}
                  onChange={(e) => handleHalf(Number(e.target.value))}
                  className="w-full h-12 pl-4 pr-10 appearance-none bg-muted/30 border border-border/50 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                >
                  <option value={1}>H1</option>
                  <option value={2}>H2</option>
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rotate-90" />
              </div>
            )}

            <div className="relative group">
              <select 
                value={year} 
                onChange={(e) => handleYear(Number(e.target.value))}
                className="w-full h-12 pl-4 pr-10 appearance-none bg-muted/30 border border-border/50 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rotate-90" />
            </div>
          </div>
        </section>

        {/* Workspace Comparison */}
        {workspaces.length > 1 && (
          <section className="space-y-4">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
              {t('dashboard').compare_workspaces}
            </label>
            <div className="grid gap-3">
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
                      'flex items-center justify-between p-4 rounded-2xl border transition-all text-sm font-bold shadow-sm',
                      active 
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-muted/30 text-muted-foreground border-transparent hover:border-border'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span>{ws.name}</span>
                    </div>
                    {active && <Check className="h-4 w-4" />}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* Exports */}
        <section className="space-y-4 pt-4 border-t border-border">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
            {t('expenses').export}
          </label>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => {
                const link = document.createElement('a')
                link.href = exportUrl + '&mode=reading'
                link.setAttribute('download', '')
                link.click()
              }}
              className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-2xl border border-border transition-all group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Download className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{t('reports').csv_reading}</p>
                  <p className="text-xs text-muted-foreground">{t('reports').csv_reading_desc}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => {
                const link = document.createElement('a')
                link.href = exportUrl + '&mode=processing'
                link.setAttribute('download', '')
                link.click()
              }}
              className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-2xl border border-border transition-all group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Download className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{t('reports').csv_processing}</p>
                  <p className="text-xs text-muted-foreground">{t('reports').csv_processing_desc}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href={exportUrl + '&format=pdf'}
              download
              className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-2xl border border-border transition-all group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{t('expenses').export_pdf}</p>
                  <p className="text-xs text-muted-foreground">{t('reports').pdf_desc ?? 'Professional PDF Report'}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </section>
      </div>

      {/* Sticky footer action */}
      <div className="p-6 border-t border-border bg-background/80 backdrop-blur-md">
        <button 
          onClick={onClose}
          className="w-full py-4 bg-foreground text-background rounded-2xl font-bold shadow-xl active:scale-95 transition-all"
        >
          {t('common').done ?? 'Apply & Done'}
        </button>
      </div>
    </div>
  )
}
