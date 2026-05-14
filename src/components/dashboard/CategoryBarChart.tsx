'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '@/hooks/useTranslation'

interface CategoryDataPoint {
  name: string
  color: string
  totals: Record<string, number>
  grandTotal: number
}

interface WorkspaceInfo {
  id: string
  name: string
  color: string
}

interface CategoryBarChartProps {
  data: CategoryDataPoint[]
  workspaces: WorkspaceInfo[]
  isMulti: boolean
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function CategoryBarChart({ data, workspaces, isMulti }: CategoryBarChartProps) {
  const { t } = useTranslation()
  const rows = data.slice(0, 8)
  const max = Math.max(...rows.map((d) => d.grandTotal), 1)
  const singleWsId = workspaces[0]?.id

  if (rows.length === 0) {
    return (
      <Card className="bg-card border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-xl">
        <CardHeader className="pb-2 pt-6 px-6">
          <CardTitle className="text-sm font-bold text-foreground">{t('dashboard').by_category}</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 flex items-center justify-center h-32 text-muted-foreground text-sm">
          {t('dashboard').no_data}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-xl">
      <CardHeader className="pb-2 pt-6 px-6">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-bold text-foreground">{t('dashboard').by_category}</CardTitle>
          {isMulti && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 justify-end">
              {workspaces.map((ws) => (
                <span key={ws.id} className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                  <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ws.color }} />
                  {ws.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-3">
        {rows.map((d) => (
          <div key={d.name} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground truncate max-w-[130px]">{d.name}</span>
              <span className="text-xs text-muted-foreground font-medium tabular-nums shrink-0 ml-2">{fmt(d.grandTotal)}</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
              {isMulti ? (
                workspaces.map((ws) => {
                  const amt = d.totals[ws.id] ?? 0
                  const pct = (amt / max) * 100
                  if (pct <= 0) return null
                  return (
                    <div
                      key={ws.id}
                      className="h-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: ws.color }}
                      title={`${ws.name}: ${fmt(amt)}`}
                    />
                  )
                })
              ) : (
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${((d.totals[singleWsId] ?? 0) / max) * 100}%`,
                    backgroundColor: d.color,
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
