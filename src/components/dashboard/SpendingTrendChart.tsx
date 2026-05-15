'use client'

import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '@/hooks/useTranslation'

interface SpendingBucket {
  label: string
  [workspaceId: string]: number | string
}

interface WorkspaceInfo {
  id: string
  name: string
  color: string
}

interface SpendingTrendChartProps {
  data: SpendingBucket[]
  workspaces: WorkspaceInfo[]
  isMulti: boolean
}

const tooltipStyle = {
  fontSize: 12,
  borderRadius: '8px',
  border: '1px solid var(--border)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  background: 'var(--popover)',
  color: 'var(--popover-foreground)',
}

function fmtTick(v: number) {
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`
  return `$${v}`
}

export function SpendingTrendChart({ data, workspaces, isMulti }: SpendingTrendChartProps) {
  const { t } = useTranslation()

  return (
    <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl shadow-xl">
      <CardHeader className="pb-2 pt-6 px-6">
        <CardTitle className="text-sm font-bold text-foreground">{t('dashboard').spending_trend}</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ResponsiveContainer width="100%" height={220}>
          {isMulti ? (
            <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barGap={2} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} tickFormatter={fmtTick} width={40} />
              <Tooltip
                formatter={(v, name) => [`$${Number(v).toLocaleString()}`, workspaces.find(w => w.id === name)?.name ?? name]}
                contentStyle={tooltipStyle}
              />
              <Legend
                formatter={(value) => workspaces.find(w => w.id === value)?.name ?? value}
                iconSize={8}
                iconType="circle"
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              />
              {workspaces.map((ws) => (
                <Bar key={ws.id} dataKey={ws.id} fill={ws.color} radius={[3, 3, 0, 0]} maxBarSize={28} />
              ))}
            </BarChart>
          ) : (
            <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} tickFormatter={fmtTick} width={40} />
              <Tooltip
                formatter={(v) => [`$${Number(v).toLocaleString()}`, t('dashboard').total_spending]}
                contentStyle={tooltipStyle}
              />
              <Bar
                dataKey={workspaces[0]?.id ?? 'total'}
                fill={workspaces[0]?.color ?? '#6366f1'}
                radius={[3, 3, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
