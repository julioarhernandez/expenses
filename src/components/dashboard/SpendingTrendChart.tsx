'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { useTranslation } from '@/hooks/useTranslation'

interface DataPoint {
  month: string
  total: number
}

export function SpendingTrendChart({ data }: { data: DataPoint[] }) {
  const { t } = useTranslation()
  const formatted = data.map((d) => ({
    month: format(parseISO(d.month), 'MMM yy'),
    total: Number(d.total),
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard').monthly_spending}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={formatted} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#171717" stopOpacity={0.08} />
                <stop offset="95%" stopColor="#171717" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#737373' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#737373' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Spending']}
              contentStyle={{ fontSize: 12, borderRadius: '8px', border: '1px solid #E5E5E5', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#171717"
              strokeWidth={2}
              fill="url(#spendGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
