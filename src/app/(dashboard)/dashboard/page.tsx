import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SpendingTrendChart } from '@/components/dashboard/SpendingTrendChart'
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart'

export const dynamic = 'force-dynamic'

function fmt(amount: number) {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id,name')
    .eq('user_id', user.id)
    .eq('is_default', true)
    .single()

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
    .eq('workspace_id', wsId)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('name')

  const catMap = Object.fromEntries((categories ?? []).map((c) => [c.id, c]))

  const expenses = allExpenses ?? []

  // Monthly totals
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

  // Monthly trend (last 12 months)
  const trendMap: Record<string, number> = {}
  expenses.filter((e) => e.date >= trendStart).forEach((e) => {
    const month = e.date.slice(0, 7) + '-01'
    trendMap[month] = (trendMap[month] ?? 0) + Number(e.amount)
  })
  const trendData = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }))

  // Category breakdown
  const catTotals: Record<string, number> = {}
  expenses.forEach((e) => {
    if (e.category_id) catTotals[e.category_id] = (catTotals[e.category_id] ?? 0) + Number(e.amount)
  })
  const categoryData = Object.entries(catTotals)
    .filter(([id]) => catMap[id])
    .sort(([, a], [, b]) => b - a)
    .map(([id, total]) => ({ name: catMap[id].name, color: catMap[id].color, total }))

  // Top vendors
  const vendorTotals: Record<string, number> = {}
  expenses.forEach((e) => {
    vendorTotals[e.merchant] = (vendorTotals[e.merchant] ?? 0) + Number(e.amount)
  })
  const topVendors = Object.entries(vendorTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([merchant, total]) => ({ merchant, total }))

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{workspace.name}</h1>
        <p className="text-sm text-muted-foreground">{format(now, 'MMMM yyyy')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">This month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{fmt(monthlyTotal)}</p>
            <p className={`flex items-center gap-1 text-xs mt-1 ${changeDir === 'up' ? 'text-red-500' : changeDir === 'down' ? 'text-green-500' : 'text-muted-foreground'}`}>
              <ChangeIcon className="h-3 w-3" />
              {changePct === 0 ? 'Same as last month' : `${Math.abs(changePct).toFixed(1)}% vs last month`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Year to date</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{fmt(yearlyTotal)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Top vendor</CardTitle>
          </CardHeader>
          <CardContent>
            {topVendors.length > 0 ? (
              <>
                <p className="text-lg font-semibold truncate">{topVendors[0].merchant}</p>
                <p className="text-xs text-muted-foreground">{fmt(topVendors[0].total)}</p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SpendingTrendChart data={trendData} />
        <CategoryPieChart data={categoryData} />
      </div>

      {/* Top vendors list */}
      {topVendors.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top vendors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topVendors.map((v) => (
              <div key={v.merchant} className="flex items-center justify-between">
                <span className="text-sm truncate">{v.merchant}</span>
                <span className="font-mono text-sm font-medium shrink-0 ml-4">{fmt(v.total)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent expenses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Recent expenses</CardTitle>
          <Link href="/expenses" className="text-xs text-primary hover:underline">View all</Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {(recent ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No expenses yet.</p>
          ) : (
            (recent as unknown as {
              id: string
              merchant: string
              date: string
              amount: number
              currency: string
              category: { name: string; color: string } | null
            }[]).map((e) => (
              <div key={e.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{e.merchant}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(e.date + 'T12:00:00'), 'MMM d')}</p>
                  </div>
                  {e.category && (
                    <Badge
                      variant="secondary"
                      className="shrink-0 text-xs"
                      style={{ backgroundColor: e.category.color + '20', color: e.category.color }}
                    >
                      {e.category.name}
                    </Badge>
                  )}
                </div>
                <span className="font-mono text-sm font-medium shrink-0 ml-4">
                  {e.currency} {Number(e.amount).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
