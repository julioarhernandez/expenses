'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '@/hooks/useTranslation'

const METHOD_COLORS: Record<string, string> = {
  credit_card: '#6366f1',
  debit_card: '#818cf8',
  cash: '#10b981',
  bank_transfer: '#f59e0b',
  other: '#94a3b8',
}

interface PaymentMethodDataPoint {
  method: string
  label: string
  total: number
  count: number
}

interface PaymentMethodChartProps {
  data: PaymentMethodDataPoint[]
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function PaymentMethodChart({ data }: PaymentMethodChartProps) {
  const { t } = useTranslation()
  const max = Math.max(...data.map((d) => d.total), 1)
  const visible = data.filter((d) => d.total > 0)

  return (
    <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl shadow-xl">
      <CardHeader className="pb-2 pt-6 px-6">
        <CardTitle className="text-sm font-bold text-foreground">{t('dashboard').by_payment_method}</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{t('dashboard').no_data}</p>
        ) : (
          <div className="space-y-3">
            {visible.map(({ method, label, total, count }) => {
              const pct = (total / max) * 100
              const color = METHOD_COLORS[method] ?? '#94a3b8'
              return (
                <div key={method}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-foreground truncate max-w-[130px]">{label}</span>
                    <span className="text-xs text-muted-foreground font-medium tabular-nums">
                      {fmt(total)}
                      <span className="ml-1.5 text-[10px] text-muted-foreground/60">({count})</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
