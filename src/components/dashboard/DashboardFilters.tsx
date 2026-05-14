'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState, useEffect } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'

type PeriodType = 'monthly' | 'quarterly' | 'semi' | 'yearly'

interface WorkspaceOption {
  id: string
  name: string
}

interface DashboardFiltersProps {
  workspaces: WorkspaceOption[]
  selectedIds: string[]
  period: PeriodType
  month: number
  quarter: number
  half: number
  year: number
  exportUrl: string
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function buildParams(
  period: PeriodType,
  month: number,
  quarter: number,
  half: number,
  year: number,
  ids: string[],
) {
  const p = new URLSearchParams()
  p.set('period', period)
  p.set('year', String(year))
  if (period === 'monthly') p.set('month', String(month))
  if (period === 'quarterly') p.set('quarter', String(quarter))
  if (period === 'semi') p.set('half', String(half))
  if (ids.length) p.set('workspaces', ids.join(','))
  return p.toString()
}

export function DashboardFilters({
  workspaces,
  selectedIds: initialIds,
  period: initialPeriod,
  month: initialMonth,
  quarter: initialQuarter,
  half: initialHalf,
  year: initialYear,
  exportUrl,
}: DashboardFiltersProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { t, lang } = useTranslation()
  const months = lang === 'es' ? MONTHS_ES : MONTHS

  const [period, setPeriod] = useState<PeriodType>(initialPeriod)
  const [month, setMonth] = useState(initialMonth)
  const [quarter, setQuarter] = useState(initialQuarter)
  const [half, setHalf] = useState(initialHalf)
  const [year, setYear] = useState(initialYear)
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds)

  useEffect(() => {
    setSelectedIds(initialIds)
  }, [initialIds.join(',')])

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 2021 }, (_, i) => currentYear - i)

  function navigate(
    p: PeriodType = period,
    mo = month,
    q = quarter,
    h = half,
    y = year,
    ids = selectedIds,
  ) {
    startTransition(() => {
      router.replace('/dashboard?' + buildParams(p, mo, q, h, y, ids))
    })
  }

  function handlePeriod(p: PeriodType) {
    setPeriod(p)
    navigate(p)
  }

  function handleMonth(mo: number) {
    setMonth(mo)
    navigate(period, mo)
  }

  function handleQuarter(q: number) {
    setQuarter(q)
    navigate(period, month, q)
  }

  function handleHalf(h: number) {
    setHalf(h)
    navigate(period, month, quarter, h)
  }

  function handleYear(y: number) {
    setYear(y)
    navigate(period, month, quarter, half, y)
  }

  function handleWorkspace(id: string, checked: boolean) {
    const next = checked ? [...selectedIds, id] : selectedIds.filter((x) => x !== id)
    if (next.length === 0) return
    setSelectedIds(next)
    navigate(period, month, quarter, half, year, next)
  }

  const periodLabels: Record<PeriodType, string> = {
    monthly: t('dashboard').period_monthly,
    quarterly: t('dashboard').period_quarterly,
    semi: t('dashboard').period_semi,
    yearly: t('dashboard').period_yearly,
  }

  const selectCls = 'h-8 px-2.5 text-xs font-semibold rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#6366F1]/40 transition-all'

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Period type tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl">
          {(['monthly', 'quarterly', 'semi', 'yearly'] as PeriodType[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriod(p)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                period === p
                  ? 'bg-[#6366F1] text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {/* Sub-picker */}
        {period === 'monthly' && (
          <select
            value={month}
            onChange={(e) => handleMonth(Number(e.target.value))}
            className={selectCls}
          >
            {months.map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>
        )}
        {period === 'quarterly' && (
          <select
            value={quarter}
            onChange={(e) => handleQuarter(Number(e.target.value))}
            className={selectCls}
          >
            <option value={1}>Q1</option>
            <option value={2}>Q2</option>
            <option value={3}>Q3</option>
            <option value={4}>Q4</option>
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

        {/* Year */}
        <select
          value={year}
          onChange={(e) => handleYear(Number(e.target.value))}
          className={selectCls}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {/* Loading indicator */}
        {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}

        {/* Export */}
        <a
          href={exportUrl}
          download
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-all"
        >
          <Download className="h-3.5 w-3.5" />
          {t('expenses').export_csv}
        </a>
      </div>

      {/* Workspace checkboxes */}
      {workspaces.length > 1 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 border-t border-border/50">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">
            {t('dashboard').compare_workspaces}
          </span>
          {workspaces.map((ws) => {
            const checked = selectedIds.includes(ws.id)
            const isLast = checked && selectedIds.length === 1
            return (
              <label
                key={ws.id}
                className={cn(
                  'flex items-center gap-1.5 cursor-pointer select-none',
                  isLast && 'opacity-50 cursor-not-allowed'
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={isLast}
                  onChange={(e) => handleWorkspace(ws.id, e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-[#6366F1]"
                />
                <span className="text-xs font-semibold text-foreground">{ws.name}</span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
