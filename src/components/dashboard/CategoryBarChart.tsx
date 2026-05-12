'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DataPoint {
  name: string
  color: string
  total: number
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function CategoryBarChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">By category</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 flex items-center justify-center h-32 text-muted-foreground text-sm">
          No data yet
        </CardContent>
      </Card>
    )
  }

  const max = Math.max(...data.map((d) => Number(d.total)), 1)
  const rows = data.slice(0, 7).map((d) => ({ ...d, total: Number(d.total) }))

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">By category</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2.5">
        {rows.map((d) => (
          <div key={d.name} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium truncate">{d.name}</span>
              <span className="text-xs text-muted-foreground shrink-0 ml-2 tabular-nums">{fmt(d.total)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${(d.total / max) * 100}%`, backgroundColor: d.color }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
