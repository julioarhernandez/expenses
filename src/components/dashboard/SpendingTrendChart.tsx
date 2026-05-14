'use client'

import {
  AreaChart, Area, BarChart, Bar,
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
    <Card className="bg-card border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-xl">
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
            <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={workspaces[0]?.color ?? '#6366f1'} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={workspaces[0]?.color ?? '#6366f1'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} tickFormatter={fmtTick} width={40} />
              <Tooltip
                formatter={(v) => [`$${Number(v).toLocaleString()}`, t('dashboard').total_spending]}
                contentStyle={tooltipStyle}
              />
              <Area
                type="monotone"
                dataKey={workspaces[0]?.id ?? 'total'}
                stroke={workspaces[0]?.color ?? '#6366f1'}
                strokeWidth={2}
                fill="url(#spendGradient)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
