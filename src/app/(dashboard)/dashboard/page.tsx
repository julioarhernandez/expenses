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

export const dynamic = 'force-dynamic'

function fmt(amount: number) {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function merchantInitial(name: string) {
  return name.trim().charAt(0).toUpperCase()
}

const INITIAL_COLORS = [
  '#6366f1','#f59e0b','#10b981','#f43f5e','#0ea5e9',
  '#a855f7','#f97316','#64748b','#84cc16','#06b6d4',
]

function initialColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return INITIAL_COLORS[h % INITIAL_COLORS.length]
}

export default async function DashboardPage() {
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
    <div className="p-4 md:p-6 space-y-3 md:space-y-4">
      <div>
        <h1 className="text-lg font-semibold">{workspace.name}</h1>
        <p className="text-xs text-muted-foreground">{format(now, 'MMMM yyyy')}</p>
      </div>

      {/* Stat cards — 2-column grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/50">
          <CardHeader className="pb-0 pt-3 px-4">
            <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">This month</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xl font-bold tabular-nums">{fmt(monthlyTotal)}</p>
            <p className={`flex items-center gap-1 text-[11px] mt-0.5 ${changeDir === 'up' ? 'text-red-500' : changeDir === 'down' ? 'text-green-500' : 'text-muted-foreground'}`}>
              <ChangeIcon className="h-3 w-3" />
              {changePct === 0 ? 'Same as last month' : `${Math.abs(changePct).toFixed(1)}% vs last month`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-0 pt-3 px-4">
            <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Last month</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xl font-bold tabular-nums">{fmt(prevMonthTotal)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{format(new Date(now.getFullYear(), now.getMonth() - 1, 1), 'MMMM')}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-0 pt-3 px-4">
            <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Total expenses</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xl font-bold tabular-nums">{fmt(yearlyTotal)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Year to date</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-0 pt-3 px-4">
            <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Top vendor</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {topVendors.length > 0 ? (
              <>
                <p className="text-base font-bold truncate leading-tight">{topVendors[0].merchant}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">{fmt(topVendors[0].total)}</p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts — full width trend + bar chart */}
      <SpendingTrendChart data={trendData} />
      <CategoryBarChart data={categoryData} />

      {/* Tabbed: Top Vendors + Recent Expenses */}
      <Tabs defaultValue="recent">
        <Card className="border-border/50">
          <CardHeader className="pb-0 pt-3 px-4">
            <div className="flex items-center justify-between">
              <TabsList className="h-7">
                <TabsTrigger value="recent" className="text-xs px-2.5">Recent</TabsTrigger>
                <TabsTrigger value="vendors" className="text-xs px-2.5">Top vendors</TabsTrigger>
              </TabsList>
              <Link href="/expenses" className="text-xs text-primary hover:underline">View all</Link>
            </div>
          </CardHeader>

          <TabsContent value="recent">
            <CardContent className="px-4 pb-3 pt-2 space-y-1.5">
              {recentList.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No expenses yet.</p>
              ) : (
                recentList.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 py-1">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: e.category?.color ?? initialColor(e.merchant) }}
                    >
                      {merchantInitial(e.merchant)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-tight">{e.merchant}</p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] text-muted-foreground">{format(new Date(e.date + 'T12:00:00'), 'MMM d')}</p>
                        {e.category && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 h-4"
                            style={{ backgroundColor: e.category.color + '20', color: e.category.color }}
                          >
                            {e.category.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-sm font-semibold shrink-0 tabular-nums">
                      {e.currency} {Number(e.amount).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </TabsContent>

          <TabsContent value="vendors">
            <CardContent className="px-4 pb-3 pt-2 space-y-1.5">
              {topVendors.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No data yet.</p>
              ) : (
                topVendors.map((v) => (
                  <div key={v.merchant} className="flex items-center gap-3 py-1">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: initialColor(v.merchant) }}
                    >
                      {merchantInitial(v.merchant)}
                    </div>
                    <span className="text-sm flex-1 truncate font-medium">{v.merchant}</span>
                    <span className="font-mono text-sm font-semibold shrink-0 tabular-nums">{fmt(v.total)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </TabsContent>
        </Card>
      </Tabs>
    </div>
  )
}
