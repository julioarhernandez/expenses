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
import { DashboardHeaderActions } from '@/components/dashboard/DashboardHeaderActions'
import { HeaderUpdater } from '@/components/layout/HeaderUpdater'
import { HelpSupportCard } from '@/components/help/HelpSupportCard'
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
  const map = new Map<string, { total: number; count: number }>()
  for (const exp of expenses) {
    const method = exp.payment_method ?? 'other'
    const entry = map.get(method) ?? { total: 0, count: 0 }
    entry.total += Number(exp.amount)
    entry.count += 1
    map.set(method, entry)
  }
  return Array.from(map.entries())
    .map(([method, data]) => ({ method, label: method, ...data }))
    .sort((a, b) => b.total - a.total)
}

export default async function DashboardPage({ searchParams: rawSearchParams }: { searchParams: Promise<any> }) {
  const searchParams = await rawSearchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: allWorkspaces } = await supabase.from('workspaces').select('*')
  if (!allWorkspaces || allWorkspaces.length === 0) redirect('/workspaces')

  const cookieStore = await cookies()
  
  const wsQuery = searchParams.workspaces || cookieStore.get('dash_workspaces')?.value
  const selectedWorkspaceIds = wsQuery ? (typeof wsQuery === 'string' ? wsQuery.split(',') : wsQuery) : [allWorkspaces[0].id]
  const selectedWorkspaces = allWorkspaces.filter(ws => selectedWorkspaceIds.includes(ws.id))
  
  const period = (searchParams.period as PeriodType) || (cookieStore.get('dash_period')?.value as PeriodType) || 'monthly'
  const year = Number(searchParams.year) || Number(cookieStore.get('dash_year')?.value) || new Date().getFullYear()
  const month = Number(searchParams.month) || Number(cookieStore.get('dash_month')?.value) || new Date().getMonth() + 1
  const quarter = Number(searchParams.quarter) || Number(cookieStore.get('dash_quarter')?.value) || Math.ceil(month / 3)
  const half = Number(searchParams.half) || Number(cookieStore.get('dash_half')?.value) || (month <= 6 ? 1 : 2)

  const { start, end, prevStart, prevEnd, label } = computeDateRange(period, year, month, quarter, half)

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, category:categories(name, color)')
    .in('workspace_id', selectedWorkspaceIds)
    .gte('date', start)
    .lte('date', end)

  const { data: prevExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .in('workspace_id', selectedWorkspaceIds)
    .gte('date', prevStart)
    .lte('date', prevEnd)

  const { t, lang } = await getServerTranslation()
  const fmt = (val: number) => val.toLocaleString(lang === 'es' ? 'es-ES' : 'en-US', { style: 'currency', currency: 'USD' })

  const fmtNoDec = (val: number) => val.toLocaleString(lang === 'es' ? 'es-ES' : 'en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
  const fmtDate = (dStr: string) => format(new Date(dStr + 'T12:00:00'), 'MM/dd/yyyy')

  const currentExpenses = expenses || []
  const periodTotal = currentExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const previousTotal = (prevExpenses || []).reduce((sum, e) => sum + Number(e.amount), 0)

  const changePct = previousTotal === 0 ? 0 : ((periodTotal - previousTotal) / previousTotal) * 100
  const isNewSpending = previousTotal === 0 && periodTotal > 0
  const changeDir = periodTotal > previousTotal ? 'up' : periodTotal < previousTotal ? 'down' : 'neutral'
  const ChangeIcon = changeDir === 'up' ? TrendingUp : changeDir === 'down' ? TrendingDown : Minus

  const merchants = new Map<string, { total: number; count: number; workspace_id: string }>()
  for (const exp of currentExpenses) {
    const key = exp.merchant + '_' + exp.workspace_id
    const entry = merchants.get(key) ?? { total: 0, count: 0, workspace_id: exp.workspace_id }
    entry.total += Number(exp.amount)
    entry.count += 1
    merchants.set(key, entry)
  }

  const wsNameMap = Object.fromEntries(allWorkspaces.map(w => [w.id, w.name]))
  const topMerchants = Array.from(merchants.entries())
    .map(([key, data]) => ({
      merchant: key.split('_')[0],
      workspaceName: wsNameMap[data.workspace_id],
      ...data
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  const topMerchant: [string, number] | null = topMerchants[0] ? [topMerchants[0].merchant, topMerchants[0].total] : null

  const categoryTotals = new Map<string, { id: string; name: string; color: string; total: number }>()
  for (const exp of currentExpenses) {
    if (!exp.category) continue
    const entry = categoryTotals.get(exp.category.name) ?? { id: exp.category_id, name: exp.category.name, color: exp.category.color, total: 0 }
    entry.total += Number(exp.amount)
    categoryTotals.set(exp.category.name, entry)
  }
  const topCategory = Array.from(categoryTotals.values()).sort((a, b) => b.total - a.total)[0]

  const isMulti = selectedWorkspaceIds.length > 1
  const spendingBuckets = computeSpendingBuckets(currentExpenses, period, start, end, selectedWorkspaceIds)
  const categoryData = computeCategoryData(currentExpenses, selectedWorkspaceIds)
  const paymentMethodData = computePaymentMethodData(currentExpenses)
  const recentList = currentExpenses.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)

  const exportUrl = `/api/reports?workspaces=${selectedWorkspaceIds.join(',')}&from=${start}&to=${end}`

  return (
    <div className="max-w-[1280px] mx-auto p-6 md:p-8 pt-4 space-y-8">
      <HeaderUpdater title={t('dashboard').title} subtitle={label} />
      
      <div className="flex items-center justify-end">
        <DashboardHeaderActions
            workspaces={allWorkspaces}
            selectedIds={selectedWorkspaceIds}
            period={period}
            month={month}
            quarter={quarter}
            half={half}
            year={year}
            exportUrl={exportUrl}
          />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-2">
        <Link href={`/expenses?from=${start}&to=${end}`} className="block group">
          <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-white/20 dark:border-white/10 shadow-xl rounded-2xl hover:shadow-2xl transition-all active:scale-[0.98] cursor-pointer h-full">
            <CardHeader className="pb-1 pt-6 px-6">
              <CardTitle className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-tight">{t('dashboard').period_total}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <p className="text-3xl font-black text-foreground tabular-nums">{fmtNoDec(periodTotal)}</p>
              <div className={`flex items-center gap-1 text-xs mt-2 font-bold ${changeDir === 'up' ? 'text-amber-600' : changeDir === 'down' ? 'text-emerald-600' : 'text-muted-foreground'}`}>
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
          <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-white/20 dark:border-white/10 shadow-lg rounded-2xl hover:shadow-xl transition-all active:scale-[0.98] cursor-pointer h-full">
            <CardHeader className="pb-1 pt-6 px-6">
              <CardTitle className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">{lang === 'es' ? 'Período anterior' : 'Prev Period'}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <p className="text-3xl font-black text-foreground tabular-nums">{fmtNoDec(previousTotal)}</p>
              <p className="text-[10px] text-muted-foreground mt-2 font-bold">{fmtDate(prevStart)} — {fmtDate(prevEnd)}</p>
            </CardContent>
          </Card>
        </Link>

        {topCategory ? (
          <Link href={`/expenses?category_id=${topCategory.id}&from=${start}&to=${end}`} className="block group">
            <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-white/20 dark:border-white/10 shadow-lg rounded-2xl hover:shadow-xl transition-all active:scale-[0.98] cursor-pointer h-full">
              <CardHeader className="pb-1 pt-6 px-6">
                <CardTitle className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-tight">{t('dashboard').top_category}</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: topCategory.color }} />
                  <p className="text-xl font-black text-foreground truncate">{topCategory.name}</p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 font-bold tabular-nums">{fmt(topCategory.total)}</p>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-white/20 dark:border-white/10 shadow-lg rounded-2xl h-full">
            <CardHeader className="pb-1 pt-6 px-6">
              <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">{t('dashboard').top_category}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <p className="text-muted-foreground text-sm font-bold">—</p>
            </CardContent>
          </Card>
        )}

        {topMerchant ? (
          <Link href={`/expenses?q=${encodeURIComponent(topMerchant[0])}&from=${start}&to=${end}`} className="block group">
            <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-white/20 dark:border-white/10 shadow-lg rounded-2xl hover:shadow-xl transition-all active:scale-[0.98] cursor-pointer h-full">
              <CardHeader className="pb-1 pt-6 px-6">
                <CardTitle className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest leading-tight">{t('dashboard').top_vendor}</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <p className="text-xl font-black text-foreground truncate">{topMerchant[0]}</p>
                <p className="text-[10px] text-muted-foreground mt-2 font-bold tabular-nums">{fmt(topMerchant[1])} total</p>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-white/20 dark:border-white/10 shadow-lg rounded-2xl h-full">
            <CardHeader className="pb-1 pt-6 px-6">
              <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">{t('dashboard').top_vendor}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <p className="text-muted-foreground text-sm font-bold">—</p>
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
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-white/10">
              <h2 className="text-sm font-bold text-foreground">{lang === 'es' ? 'Principales proveedores' : 'Top Merchants'}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted/30 border-b border-border/50">
                    <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('expenses').merchant}</th>
                    {isMulti && <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">{lang === 'es' ? 'Espacio' : 'Workspace'}</th>}
                    <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest text-right">{t('expenses').amount}</th>
                    <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest text-right">{lang === 'es' ? 'Transacciones' : 'Transactions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {topMerchants.length === 0 ? (
                    <tr><td colSpan={isMulti ? 4 : 3} className="px-6 py-8 text-center text-muted-foreground text-sm">{t('dashboard').no_recent}</td></tr>
                  ) : topMerchants.map((m, i) => (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-semibold text-foreground text-base truncate max-w-[180px]">{m.merchant}</td>
                      {isMulti && (
                        <td className="px-6 py-4 text-base text-muted-foreground">{m.workspaceName}</td>
                      )}
                      <td className="px-6 py-4 text-right font-bold text-base tabular-nums">{fmt(m.total)}</td>
                      <td className="px-6 py-4 text-right text-base text-muted-foreground">{m.count}</td>
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

      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{t('dashboard').recent_expenses}</h2>
          <Link href="/expenses?reset=true" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            {t('dashboard').view_all}
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50">
                <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('expenses').merchant}</th>
                {isMulti && <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">{lang === 'es' ? 'Espacio' : 'Workspace'}</th>}
                <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest w-[140px]">{t('expenses').date}</th>
                <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest text-right">{t('expenses').amount}</th>
                <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest text-right">{t('expenses').category}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {recentList.length === 0 ? (
                <tr><td colSpan={isMulti ? 5 : 4} className="px-6 py-8 text-center text-muted-foreground text-sm font-medium">{t('dashboard').no_recent}</td></tr>
              ) : recentList.map((e: any) => (
                <tr key={e.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-foreground text-base truncate max-w-[150px]">{e.merchant}</span>
                  </td>
                  {isMulti && (
                    <td className="px-6 py-4 text-base text-muted-foreground">{wsNameMap[e.workspace_id] ?? ''}</td>
                  )}
                  <td className="px-6 py-4 text-base text-muted-foreground font-medium w-[140px] whitespace-nowrap">
                    {format(new Date(e.date + 'T12:00:00'), 'MM/dd/yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-foreground text-base tabular-nums">
                      {e.currency} {Number(e.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {e.category ? (
                      <span
                        style={{ backgroundColor: e.category.color + '15', color: e.category.color, borderColor: e.category.color + '30' }}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap"
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

      <HelpSupportCard topic="dashboard" />
    </div>
  )
}
