import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { format } from 'date-fns'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SpendingTrendChart } from '@/components/dashboard/SpendingTrendChart'
import { CategoryBarChart } from '@/components/dashboard/CategoryBarChart'
import { PaymentMethodChart } from '@/components/dashboard/PaymentMethodChart'
import { DashboardFilters } from '@/components/dashboard/DashboardFilters'
import { HeaderUpdater } from '@/components/layout/HeaderUpdater'
import { getServerTranslation } from '@/lib/i18n/server-translation'
import { es, enUS } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

type PeriodType = 'monthly' | 'quarterly' | 'semi' | 'yearly'

const WS_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

function toISO(y: number, m0: number, d: number) {
  return new Date(y, m0, d).toISOString().split('T')[0]
}

function computeDateRange(period: PeriodType, year: number, month: number, quarter: number, half: number) {
  const today = new Date().toISOString().split('T')[0]
  let start: string, end: string, prevStart: string, prevEnd: string, label: string

  if (period === 'quarterly') {
    const q = quarter
    start = toISO(year, (q - 1) * 3, 1)
    end = toISO(year, q * 3, 0)
    if (q > 1) { prevStart = toISO(year, (q - 2) * 3, 1); prevEnd = toISO(year, (q - 1) * 3, 0) }
    else { prevStart = toISO(year - 1, 9, 1); prevEnd = toISO(year - 1, 12, 31) }
    label = `Q${q} ${year}`
  } else if (period === 'semi') {
    if (half === 1) {
      start = toISO(year, 0, 1); end = toISO(year, 5, 30)
      prevStart = toISO(year - 1, 6, 1); prevEnd = toISO(year - 1, 11, 31)
    } else {
      start = toISO(year, 6, 1); end = toISO(year, 11, 31)
      prevStart = toISO(year, 0, 1); prevEnd = toISO(year, 5, 30)
    }
    label = `H${half} ${year}`
  } else if (period === 'yearly') {
    start = toISO(year, 0, 1); end = toISO(year, 11, 31)
    prevStart = toISO(year - 1, 0, 1); prevEnd = toISO(year - 1, 11, 31)
    label = String(year)
  } else {
    start = toISO(year, month - 1, 1); end = toISO(year, month, 0)
    prevStart = toISO(year, month - 2, 1); prevEnd = toISO(year, month - 1, 0)
    label = format(new Date(year, month - 1, 1), 'MMMM yyyy')
  }

  if (end > today) end = today
  return { start, end, prevStart, prevEnd, label }
}

function computeSpendingBuckets(
  expenses: any[],
  period: PeriodType,
  start: string,
  end: string,
  wsIds: string[],
) {
  const buckets: Map<string, { label: string; data: Record<string, number> }> = new Map()

  if (period === 'monthly') {
    // Weekly buckets — find all Mondays in range
    const s = new Date(start + 'T12:00:00')
    const e = new Date(end + 'T12:00:00')
    const day = s.getDay()
    const monday = new Date(s)
    monday.setDate(s.getDate() - (day === 0 ? 6 : day - 1))
    const cur = new Date(monday)
    while (cur <= e) {
      const key = cur.toISOString().split('T')[0]
      const lbl = format(cur, 'MMM d')
      buckets.set(key, { label: lbl, data: Object.fromEntries(wsIds.map((id) => [id, 0])) })
      cur.setDate(cur.getDate() + 7)
    }
    for (const exp of expenses) {
      const d = new Date(exp.date + 'T12:00:00')
      const dow = d.getDay()
      const mon = new Date(d)
      mon.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
      const key = mon.toISOString().split('T')[0]
      if (buckets.has(key)) {
        buckets.get(key)!.data[exp.workspace_id] = (buckets.get(key)!.data[exp.workspace_id] ?? 0) + Number(exp.amount)
      }
    }
  } else {
    // Monthly buckets
    const [sy, sm] = start.split('-').map(Number)
    const [ey, em] = end.split('-').map(Number)
    const cur = new Date(sy, sm - 1, 1)
    const endDate = new Date(ey, em - 1, 1)
    while (cur <= endDate) {
      const key = cur.toISOString().split('T')[0].slice(0, 7) + '-01'
      const lbl = format(cur, 'MMM')
      buckets.set(key, { label: lbl, data: Object.fromEntries(wsIds.map((id) => [id, 0])) })
      cur.setMonth(cur.getMonth() + 1)
    }
    for (const exp of expenses) {
      const key = exp.date.slice(0, 7) + '-01'
      if (buckets.has(key)) {
        buckets.get(key)!.data[exp.workspace_id] = (buckets.get(key)!.data[exp.workspace_id] ?? 0) + Number(exp.amount)
      }
    }
  }

  return Array.from(buckets.values()).map(({ label, data }) => ({ label, ...data }))
}

function computeCategoryData(expenses: any[], wsIds: string[]) {
  const map = new Map<string, { color: string; colorTotals: Record<string, number>; totals: Record<string, number>; grandTotal: number }>()
  for (const exp of expenses) {
    const name = exp.category?.name ?? 'Uncategorized'
    const color = exp.category?.color ?? '#94a3b8'
    if (!map.has(name)) map.set(name, { color, colorTotals: {}, totals: Object.fromEntries(wsIds.map((id) => [id, 0])), grandTotal: 0 })
    const entry = map.get(name)!
    const amt = Number(exp.amount)
    entry.totals[exp.workspace_id] = (entry.totals[exp.workspace_id] ?? 0) + amt
    entry.grandTotal += amt
    entry.colorTotals[color] = (entry.colorTotals[color] ?? 0) + amt
  }
  return Array.from(map.entries())
    .map(([name, { colorTotals, totals, grandTotal }]) => {
      const color = Object.entries(colorTotals).sort(([, a], [, b]) => b - a)[0]?.[0] ?? '#94a3b8'
      return { name, color, totals, grandTotal }
    })
    .sort((a, b) => b.grandTotal - a.grandTotal)
    .slice(0, 8)
}

function computePaymentMethodData(expenses: any[]) {
  const labels: Record<string, string> = {
    credit_card: 'Credit card', debit_card: 'Debit card',
    cash: 'Cash', bank_transfer: 'Bank transfer', other: 'Other',
  }
  const map = new Map<string, { total: number; count: number }>()
  for (const exp of expenses) {
    const method = exp.payment_method ?? 'other'
    const entry = map.get(method) ?? { total: 0, count: 0 }
    entry.total += Number(exp.amount)
    entry.count += 1
    map.set(method, entry)
  }
  return Array.from(map.entries())
    .filter(([, { total }]) => total > 0)
    .sort(([, a], [, b]) => b.total - a.total)
    .map(([method, { total, count }]) => ({ method, label: labels[method] ?? method, total, count }))
}

function fmt(amount: number) {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const { t, lang } = await getServerTranslation()
  const locale = lang === 'es' ? es : enUS
  const sp = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Fetch all user workspaces
  const { data: allWorkspaces } = await supabase
    .from('workspaces').select('id,name').eq('user_id', user.id).order('created_at', { ascending: true })
  const workspaceList = (allWorkspaces ?? []) as { id: string; name: string }[]
  const validIds = new Set(workspaceList.map((w) => w.id))

  // 2. Resolve selected workspace IDs
  const cookieStore = await cookies()
  const cookieWsId = cookieStore.get('active-workspace-id')?.value
  let selectedIds: string[] = sp.workspaces
    ? sp.workspaces.split(',').filter((id) => validIds.has(id))
    : []
  if (selectedIds.length === 0) {
    selectedIds = cookieWsId && validIds.has(cookieWsId)
      ? [cookieWsId]
      : workspaceList.slice(0, 1).map((w) => w.id)
  }

  if (workspaceList.length === 0) {
    return (
      <div className="p-6 text-muted-foreground text-sm">
        No workspace found. <Link href="/settings" className="text-primary underline">Create one in settings.</Link>
      </div>
    )
  }

  // 3. Assign colors per workspace
  const workspacesWithColor = workspaceList.map((ws, i) => ({
    ...ws,
    color: WS_COLORS[i % WS_COLORS.length],
  }))
  const selectedWorkspaces = workspacesWithColor.filter((ws) => selectedIds.includes(ws.id))
  const isMulti = selectedIds.length > 1

  // 4. Parse period params
  const now = new Date()
  const period = (['monthly', 'quarterly', 'semi', 'yearly'].includes(sp.period) ? sp.period : 'monthly') as PeriodType
  const year = parseInt(sp.year ?? '') || now.getFullYear()
  const month = parseInt(sp.month ?? '') || (now.getMonth() + 1)
  const quarter = parseInt(sp.quarter ?? '') || Math.ceil((now.getMonth() + 1) / 3)
  const half = parseInt(sp.half ?? '') || (now.getMonth() < 6 ? 1 : 2)

  const { start, end, prevStart, prevEnd, label } = computeDateRange(period, year, month, quarter, half)

  // 5. Build export URL
  const exportParams = new URLSearchParams()
  exportParams.set('period', period)
  exportParams.set('year', String(year))
  if (period === 'monthly') exportParams.set('month', String(month))
  if (period === 'quarterly') exportParams.set('quarter', String(quarter))
  if (period === 'semi') exportParams.set('half', String(half))
  exportParams.set('workspaces', selectedIds.join(','))
  const exportUrl = `/api/reports/export?${exportParams.toString()}`

  // 6. Fetch current + prev period expenses in parallel
  const [{ data: currentRaw }, { data: prevRaw }, { data: recentRaw }] = await Promise.all([
    supabase.from('expenses')
      .select('id,workspace_id,merchant,amount,tax_amount,date,payment_method,notes,currency,category:categories(id,name,color)')
      .in('workspace_id', selectedIds).gte('date', start).lte('date', end).eq('is_deleted', false),
    supabase.from('expenses').select('amount')
      .in('workspace_id', selectedIds).gte('date', prevStart).lte('date', prevEnd).eq('is_deleted', false),
    supabase.from('expenses')
      .select('id,merchant,date,amount,currency,workspace_id,category:categories(id,name,color)')
      .in('workspace_id', selectedIds).gte('date', start).lte('date', end)
      .eq('is_deleted', false).order('date', { ascending: false }).limit(5),
  ])

  const expenses = (currentRaw ?? []) as any[]
  const prevExpenses = (prevRaw ?? []) as any[]
  const recentList = (recentRaw ?? []) as any[]
  const wsNameMap = Object.fromEntries(workspaceList.map((w) => [w.id, w.name]))

  // 7. Aggregate stats
  const periodTotal = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const previousTotal = prevExpenses.reduce((s, e) => s + Number(e.amount), 0)
  let changePct = 0
  let changeDir: 'up' | 'down' | 'flat' = 'flat'
  const isNewSpending = previousTotal === 0 && periodTotal > 0
  if (previousTotal > 0) {
    changePct = ((periodTotal - previousTotal) / previousTotal) * 100
    changeDir = changePct > 1 ? 'up' : changePct < -1 ? 'down' : 'flat'
  }
  const ChangeIcon = changeDir === 'up' ? TrendingUp : changeDir === 'down' ? TrendingDown : Minus

  const vendorTotals: Record<string, number> = {}
  expenses.forEach((e) => { vendorTotals[e.merchant] = (vendorTotals[e.merchant] ?? 0) + Number(e.amount) })
  const topMerchant = Object.entries(vendorTotals).sort(([, a], [, b]) => b - a)[0]

  const catTotalsForStat: Record<string, { id: string; name: string; color: string; total: number }> = {}
  expenses.forEach((e) => {
    if (e.category) {
      const n = e.category.name
      if (!catTotalsForStat[n]) catTotalsForStat[n] = { id: e.category.id, name: n, color: e.category.color, total: 0 }
      catTotalsForStat[n].total += Number(e.amount)
    }
  })
  const topCategory = Object.values(catTotalsForStat).sort((a, b) => b.total - a.total)[0]

  // 8. Chart data
  const spendingBuckets = computeSpendingBuckets(expenses, period, start, end, selectedIds)
  const categoryData = computeCategoryData(expenses, selectedIds)
  const paymentMethodData = computePaymentMethodData(expenses)

  // 9. Top merchants table (top 10, include workspace if multi)
  const merchantMap = new Map<string, { total: number; count: number; workspaceId: string }>()
  expenses.forEach((e) => {
    const key = isMulti ? `${e.merchant}__${e.workspace_id}` : e.merchant
    const entry = merchantMap.get(key) ?? { total: 0, count: 0, workspaceId: e.workspace_id }
    entry.total += Number(e.amount)
    entry.count += 1
    merchantMap.set(key, entry)
  })
  const topMerchants = Array.from(merchantMap.entries())
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 10)
    .map(([key, { total, count, workspaceId }]) => ({
      merchant: key.includes('__') ? key.split('__')[0] : key,
      total,
      count,
      workspaceName: isMulti ? (wsNameMap[workspaceId] ?? '') : undefined,
    }))

  return (
    <div className="max-w-[1280px] mx-auto p-6 md:p-8 pt-2 space-y-8 bg-background min-h-screen">
      <HeaderUpdater title={t('dashboard').title} subtitle={label} />

      {/* Filters */}
      <DashboardFilters
        workspaces={workspaceList}
        selectedIds={selectedIds}
        period={period}
        month={month}
        quarter={quarter}
        half={half}
        year={year}
        exportUrl={exportUrl}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href={`/expenses?from=${start}&to=${end}`} className="block group">
          <Card className="bg-card border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-xl hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-all group-hover:border-foreground/20 cursor-pointer">
            <CardHeader className="pb-1 pt-6 px-6">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('dashboard').period_total}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <p className="text-3xl font-bold text-foreground tabular-nums">{fmt(periodTotal)}</p>
              <div className={`flex items-center gap-1 text-xs mt-2 font-semibold ${changeDir === 'up' ? 'text-[#B58371]' : changeDir === 'down' ? 'text-[#8DA399]' : 'text-muted-foreground'}`}>
                <ChangeIcon className="h-3.5 w-3.5" />
                <span>
                  {isNewSpending
                    ? t('dashboard').new_spending
                    : changePct === 0
                      ? (lang === 'es' ? 'Sin cambios' : 'No change')
                      : `${Math.abs(changePct).toFixed(1)}% ${t('dashboard').vs_prev_period}`}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/expenses?from=${prevStart}&to=${prevEnd}`} className="block group">
          <Card className="bg-card border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-xl hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-all group-hover:border-foreground/20 cursor-pointer">
            <CardHeader className="pb-1 pt-6 px-6">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{lang === 'es' ? 'Período anterior' : 'Prev Period'}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <p className="text-3xl font-bold text-foreground tabular-nums">{fmt(previousTotal)}</p>
              <p className="text-xs text-muted-foreground mt-2 font-medium">{prevStart} — {prevEnd}</p>
            </CardContent>
          </Card>
        </Link>

        {topCategory ? (
          <Link href={`/expenses?category_id=${topCategory.id}&from=${start}&to=${end}`} className="block group">
            <Card className="bg-card border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-xl hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-all group-hover:border-foreground/20 cursor-pointer">
              <CardHeader className="pb-1 pt-6 px-6">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('dashboard').top_category}</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: topCategory.color }} />
                  <p className="text-xl font-bold text-foreground truncate">{topCategory.name}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-medium tabular-nums">{fmt(topCategory.total)}</p>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Card className="bg-card border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-xl hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-all">
            <CardHeader className="pb-1 pt-6 px-6">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('dashboard').top_category}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <p className="text-muted-foreground text-sm">—</p>
            </CardContent>
          </Card>
        )}

        {topMerchant ? (
          <Link href={`/expenses?q=${encodeURIComponent(topMerchant[0])}&from=${start}&to=${end}`} className="block group">
            <Card className="bg-card border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-xl hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-all group-hover:border-foreground/20 cursor-pointer">
              <CardHeader className="pb-1 pt-6 px-6">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('dashboard').top_vendor}</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <p className="text-xl font-bold text-foreground truncate">{topMerchant[0]}</p>
                <p className="text-xs text-muted-foreground mt-2 font-medium tabular-nums">{fmt(topMerchant[1])} total</p>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Card className="bg-card border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-xl hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-all">
            <CardHeader className="pb-1 pt-6 px-6">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('dashboard').top_vendor}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <p className="text-muted-foreground text-sm">—</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SpendingTrendChart data={spendingBuckets} workspaces={selectedWorkspaces} isMulti={isMulti} />
        </div>
        <div>
          <CategoryBarChart data={categoryData} workspaces={selectedWorkspaces} isMulti={isMulti} />
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Top merchants table */}
          <div className="bg-card border border-border rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="px-6 py-5 border-b border-border/50">
              <h2 className="text-sm font-bold text-foreground">{lang === 'es' ? 'Principales proveedores' : 'Top Merchants'}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted/30 border-b border-border/50">
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{t('expenses').merchant}</th>
                    {isMulti && <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{lang === 'es' ? 'Espacio' : 'Workspace'}</th>}
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">{t('expenses').amount}</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">{lang === 'es' ? 'Transacciones' : 'Transactions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {topMerchants.length === 0 ? (
                    <tr><td colSpan={isMulti ? 4 : 3} className="px-6 py-8 text-center text-muted-foreground text-sm">{t('dashboard').no_recent}</td></tr>
                  ) : topMerchants.map((m, i) => (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-semibold text-foreground text-sm truncate max-w-[180px]">{m.merchant}</td>
                      {isMulti && (
                        <td className="px-6 py-4 text-sm text-muted-foreground">{m.workspaceName}</td>
                      )}
                      <td className="px-6 py-4 text-right font-bold text-sm tabular-nums">{fmt(m.total)}</td>
                      <td className="px-6 py-4 text-right text-sm text-muted-foreground">{m.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div>
          <PaymentMethodChart data={paymentMethodData} />
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-card border border-border rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{t('dashboard').recent_expenses}</h2>
          <Link href="/expenses?reset=true" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            {t('dashboard').view_all}
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50">
                <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{t('expenses').merchant}</th>
                {isMulti && <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{lang === 'es' ? 'Espacio' : 'Workspace'}</th>}
                <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest w-[140px]">{t('expenses').date}</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">{t('expenses').amount}</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">{t('expenses').category}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {recentList.length === 0 ? (
                <tr><td colSpan={isMulti ? 5 : 4} className="px-6 py-8 text-center text-muted-foreground text-sm font-medium">{t('dashboard').no_recent}</td></tr>
              ) : recentList.map((e: any) => (
                <tr key={e.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-foreground text-sm truncate max-w-[150px]">{e.merchant}</span>
                  </td>
                  {isMulti && (
                    <td className="px-6 py-4 text-sm text-muted-foreground">{wsNameMap[e.workspace_id] ?? ''}</td>
                  )}
                  <td className="px-6 py-4 text-sm text-muted-foreground font-medium w-[140px] whitespace-nowrap">
                    {format(new Date(e.date + 'T12:00:00'), 'MM/dd/yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-foreground text-sm tabular-nums">
                      {e.currency} {Number(e.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {e.category ? (
                      <span
                        style={{ backgroundColor: e.category.color + '15', color: e.category.color, borderColor: e.category.color + '30' }}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap"
                      >
                        {e.category.name}
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
