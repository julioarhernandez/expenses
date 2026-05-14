import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { format } from 'date-fns'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SpendingTrendChart } from '@/components/dashboard/SpendingTrendChart'
import { CategoryBarChart } from '@/components/dashboard/CategoryBarChart'
import { getServerTranslation } from '@/lib/i18n/server-translation'
import { es, enUS } from 'date-fns/locale'
import { AddExpenseButton } from '@/components/dashboard/AddExpenseButton'

export const dynamic = 'force-dynamic'

function fmt(amount: number) {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function merchantInitial(name: string) {
  return name.trim().charAt(0).toUpperCase()
}



export default async function DashboardPage() {
  const { t, lang } = await getServerTranslation()
  const locale = lang === 'es' ? es : enUS

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const activeWsId = cookieStore.get('active-workspace-id')?.value

  let workspace = null
  if (activeWsId) {
    const { data } = await supabase
      .from('workspaces')
      .select('id,name')
      .eq('user_id', user.id)
      .eq('id', activeWsId)
      .single()
    workspace = data
  }
  if (!workspace) {
    const { data } = await supabase
      .from('workspaces')
      .select('id,name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()
    workspace = data
  }

  if (!workspace) {
    return (
      <div className="p-6 text-muted-foreground text-sm">
        No workspace found. <Link href="/settings" className="text-primary underline">Create one in settings.</Link>
      </div>
    )
  }

  const wsId = workspace.id
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
  const trendStart = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString().split('T')[0]

  const base = () =>
    supabase.from('expenses').select('amount,date,merchant,currency,category_id').eq('workspace_id', wsId).eq('is_deleted', false)

  const [
    { data: allExpenses },
    { data: recent },
  ] = await Promise.all([
    base().gte('date', trendStart),
    supabase
      .from('expenses')
      .select('id,merchant,date,amount,currency,category:categories(id,name,color)')
      .eq('workspace_id', wsId)
      .eq('is_deleted', false)
      .order('date', { ascending: false })
      .limit(5),
  ])

  const { data: categories } = await supabase
    .from('categories')
    .select('id,name,color')
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('name')

  const catMap = Object.fromEntries((categories ?? []).map((c) => [c.id, c]))
  const expenses = allExpenses ?? []

  const monthlyTotal = expenses
    .filter((e) => e.date >= monthStart)
    .reduce((s, e) => s + Number(e.amount), 0)

  const prevMonthTotal = expenses
    .filter((e) => e.date >= prevMonthStart && e.date <= prevMonthEnd)
    .reduce((s, e) => s + Number(e.amount), 0)

  const yearlyTotal = expenses
    .filter((e) => e.date >= yearStart)
    .reduce((s, e) => s + Number(e.amount), 0)

  let changePct = 0
  let changeDir: 'up' | 'down' | 'flat' = 'flat'
  if (prevMonthTotal > 0) {
    changePct = ((monthlyTotal - prevMonthTotal) / prevMonthTotal) * 100
    changeDir = changePct > 1 ? 'up' : changePct < -1 ? 'down' : 'flat'
  }
  const ChangeIcon = changeDir === 'up' ? TrendingUp : changeDir === 'down' ? TrendingDown : Minus

  const trendMap: Record<string, number> = {}
  expenses.filter((e) => e.date >= trendStart).forEach((e) => {
    const month = e.date.slice(0, 7) + '-01'
    trendMap[month] = (trendMap[month] ?? 0) + Number(e.amount)
  })
  const trendData = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }))

  const catTotals: Record<string, number> = {}
  expenses.forEach((e) => {
    if (e.category_id) catTotals[e.category_id] = (catTotals[e.category_id] ?? 0) + Number(e.amount)
  })
  const categoryData = Object.entries(catTotals)
    .filter(([id]) => catMap[id])
    .sort(([, a], [, b]) => b - a)
    .map(([id, total]) => ({ name: catMap[id].name, color: catMap[id].color, total }))

  const vendorTotals: Record<string, number> = {}
  expenses.forEach((e) => {
    vendorTotals[e.merchant] = (vendorTotals[e.merchant] ?? 0) + Number(e.amount)
  })
  const topVendors = Object.entries(vendorTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([merchant, total]) => ({ merchant, total }))

  type RecentExpense = {
    id: string
    merchant: string
    date: string
    amount: number
    currency: string
    category: { name: string; color: string } | null
  }
  const recentList = (recent as unknown as RecentExpense[]) ?? []

  return (
    <div className="max-w-[1280px] mx-auto p-6 md:p-8 space-y-8 bg-background min-h-screen">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{workspace.name} {t('dashboard').title}</h1>
          <p className="text-muted-foreground font-medium">{format(now, 'MMMM yyyy', { locale })}</p>
        </div>
        <div className="flex gap-3">
          <AddExpenseButton />
          <button className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-accent transition-colors">
            {t('expenses').export_csv}
          </button>
        </div>
      </div>

      {/* Stat cards — 4-column grid on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-xl hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-all">
          <CardHeader className="pb-1 pt-6 px-6">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('dashboard').this_month}</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <p className="text-3xl font-bold text-foreground tabular-nums">{fmt(monthlyTotal)}</p>
            <div className={`flex items-center gap-1 text-xs mt-2 font-semibold ${changeDir === 'up' ? 'text-[#B58371]' : changeDir === 'down' ? 'text-[#8DA399]' : 'text-muted-foreground'}`}>
              <ChangeIcon className="h-3.5 w-3.5" />
              <span>{changePct === 0 ? (lang === 'es' ? 'Sin cambios' : 'No change') : `${Math.abs(changePct).toFixed(1)}% ${t('dashboard').vs_last_month}`}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-xl hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-all">
          <CardHeader className="pb-1 pt-6 px-6">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('dashboard').last_month}</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <p className="text-3xl font-bold text-foreground tabular-nums">{fmt(prevMonthTotal)}</p>
            <p className="text-xs text-muted-foreground mt-2 font-medium">{format(new Date(now.getFullYear(), now.getMonth() - 1, 1), 'MMMM', { locale })}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-xl hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-all">
          <CardHeader className="pb-1 pt-6 px-6">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('dashboard').year_to_date}</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <p className="text-3xl font-bold text-foreground tabular-nums">{fmt(yearlyTotal)}</p>
            <p className="text-xs text-muted-foreground mt-2 font-medium">{lang === 'es' ? 'Ene' : 'Jan'} — {format(now, 'MMM', { locale })}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-xl hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-all">
          <CardHeader className="pb-1 pt-6 px-6">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('dashboard').top_vendor}</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {topVendors.length > 0 ? (
              <>
                <p className="text-xl font-bold text-foreground truncate">{topVendors[0].merchant}</p>
                <p className="text-xs text-muted-foreground mt-2 font-medium tabular-nums">{fmt(topVendors[0].total)} total</p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SpendingTrendChart data={trendData} />
        </div>
        <div>
          <CategoryBarChart data={categoryData} />
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-card border border-border rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{t('dashboard').recent_expenses}</h2>
          <Link href="/expenses" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            {t('dashboard').view_all}
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50">
                <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{t('expenses').merchant}</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest w-[140px]">{t('expenses').date}</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">{t('expenses').amount}</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">{t('expenses').category}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {recentList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground text-sm font-medium">
                    {t('dashboard').no_recent}
                  </td>
                </tr>
              ) : (
                recentList.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-foreground text-sm truncate max-w-[150px]">{e.merchant}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground font-medium w-[140px] whitespace-nowrap">
                      {format(new Date(e.date + 'T12:00:00'), 'MMM d, yyyy', { locale })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-foreground text-sm tabular-nums">
                        {e.currency} {Number(e.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {e.category ? (
                        <span
                          style={{
                            backgroundColor: e.category.color + '15',
                            color: e.category.color,
                            borderColor: e.category.color + '30'
                          }}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap"
                        >
                          {e.category.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
