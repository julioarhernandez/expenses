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
  period: initialPeriod,
  month: initialMonth,
  quarter: initialQuarter,
  half: initialHalf,
  year: initialYear,
  exportUrl
}: DashboardFiltersOverlayProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const { t, lang } = useTranslation()

  // Local state for filters
  const [localPeriod, setLocalPeriod] = useState<PeriodType>(initialPeriod)
  const [localMonth, setLocalMonth] = useState(initialMonth)
  const [localQuarter, setLocalQuarter] = useState(initialQuarter)
  const [localHalf, setLocalHalf] = useState(initialHalf)
  const [localYear, setLocalYear] = useState(initialYear)
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedIds)

  if (!isOpen) return null

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', localPeriod)
    params.set('month', localMonth.toString())
    params.set('quarter', localQuarter.toString())
    params.set('half', localHalf.toString())
    params.set('year', localYear.toString())
    params.set('workspaces', localSelectedIds.join(','))
    
    startTransition(() => {
      router.push(`?${params.toString()}`)
      onClose()
    })
  }

  const handlePeriod = (p: PeriodType) => setLocalPeriod(p)
  const handleMonth = (m: number) => setLocalMonth(m)
  const handleQuarter = (q: number) => setLocalQuarter(q)
  const handleHalf = (h: number) => setLocalHalf(h)
  const handleYear = (y: number) => setLocalYear(y)

  const handleWorkspace = (id: string, checked: boolean) => {
    if (checked) {
      setLocalSelectedIds([...localSelectedIds, id])
    } else {
      const next = localSelectedIds.filter(x => x !== id)
      if (next.length === 0) return
      setLocalSelectedIds(next)
    }
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
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-6 block">
            {t('dashboard').period_total}
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
            {(['monthly', 'quarterly', 'semi', 'yearly'] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriod(p)}
                className={cn(
                  'px-5 py-2.5 rounded-full text-sm font-bold border transition-all whitespace-nowrap shadow-sm',
                  localPeriod === p
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
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-6 block">
            {t('expenses').date}
          </label>
          <div className="grid grid-cols-2 gap-4">
            {localPeriod === 'monthly' && (
              <div className="relative group">
                <select 
                  value={localMonth} 
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

            {localPeriod === 'quarterly' && (
              <div className="relative group">
                <select
                  value={localQuarter}
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

            {localPeriod === 'semi' && (
              <div className="relative group">
                <select
                  value={localHalf}
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
                value={localYear} 
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
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-6 block">
              {t('dashboard').compare_workspaces}
            </label>
            <div className="grid gap-3">
              {workspaces.map((ws, i) => {
                const active = localSelectedIds.includes(ws.id)
                const isLast = active && localSelectedIds.length === 1
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

        {/* Apply Button in flow */}
        <div className="pt-4 pb-2">
          <button 
            onClick={handleApply}
            disabled={isPending}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-xl shadow-indigo-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
            <span className="uppercase tracking-tighter text-lg">{t('common').apply ?? 'Apply Filters'}</span>
          </button>
        </div>

        {/* Exports */}
        <section className="space-y-4 pt-8 border-t border-border">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-6 block">
            {lang === 'es' ? 'GENERACIÓN DE REPORTES' : 'REPORT GENERATION'}
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
    </div>
  )
}
