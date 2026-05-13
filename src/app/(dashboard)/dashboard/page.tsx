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
    <div className="max-w-[1280px] mx-auto p-6 md:p-8 space-y-8 bg-[#FAFAFA] min-h-screen">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#171717]">{workspace.name} Dashboard</h1>
          <p className="text-neutral-500 font-medium">{format(now, 'MMMM yyyy')}</p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/expenses/new"
            className="inline-flex items-center justify-center rounded-lg bg-[#171717] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 transition-colors"
          >
            Add Expense
          </Link>
          <button className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 transition-colors">
            Export Report
          </button>
        </div>
      </div>

      {/* Stat cards — 4-column grid on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-neutral-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-xl hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-all">
          <CardHeader className="pb-1 pt-6 px-6">
            <CardTitle className="text-xs font-bold text-neutral-400 uppercase tracking-widest">This Month</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <p className="text-3xl font-bold text-[#171717] tabular-nums">{fmt(monthlyTotal)}</p>
            <div className={`flex items-center gap-1 text-xs mt-2 font-semibold ${changeDir === 'up' ? 'text-[#B58371]' : changeDir === 'down' ? 'text-[#8DA399]' : 'text-neutral-400'}`}>
              <ChangeIcon className="h-3.5 w-3.5" />
              <span>{changePct === 0 ? 'No change' : `${Math.abs(changePct).toFixed(1)}% vs last month`}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-neutral-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-xl hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-all">
          <CardHeader className="pb-1 pt-6 px-6">
            <CardTitle className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Last Month</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <p className="text-3xl font-bold text-[#171717] tabular-nums">{fmt(prevMonthTotal)}</p>
            <p className="text-xs text-neutral-500 mt-2 font-medium">{format(new Date(now.getFullYear(), now.getMonth() - 1, 1), 'MMMM')}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-neutral-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-xl hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-all">
          <CardHeader className="pb-1 pt-6 px-6">
            <CardTitle className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Year to Date</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <p className="text-3xl font-bold text-[#171717] tabular-nums">{fmt(yearlyTotal)}</p>
            <p className="text-xs text-neutral-500 mt-2 font-medium">Jan — {format(now, 'MMM')}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-neutral-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-xl hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-all">
          <CardHeader className="pb-1 pt-6 px-6">
            <CardTitle className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Top Vendor</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {topVendors.length > 0 ? (
              <>
                <p className="text-xl font-bold text-[#171717] truncate">{topVendors[0].merchant}</p>
                <p className="text-xs text-neutral-500 mt-2 font-medium tabular-nums">{fmt(topVendors[0].total)} total</p>
              </>
            ) : (
              <p className="text-neutral-400 text-sm">—</p>
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
      <div className="bg-white border border-neutral-200 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#171717]">Recent Activity</h2>
          <Link href="/expenses" className="text-sm font-semibold text-neutral-500 hover:text-[#171717] transition-colors">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-50/50 border-b border-neutral-100">
                <th className="px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Merchant</th>
                <th className="px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-widest w-[140px]">Date</th>
                <th className="px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-widest text-right">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {recentList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-neutral-400 text-sm font-medium">No recent transactions found.</td>
                </tr>
              ) : (
                recentList.map((e) => (
                  <tr key={e.id} className="hover:bg-neutral-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-neutral-800 text-sm truncate max-w-[150px]">{e.merchant}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500 font-medium w-[140px] whitespace-nowrap">
                      {format(new Date(e.date + 'T12:00:00'), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-neutral-900 text-sm tabular-nums">
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
                        <span className="text-neutral-300">—</span>
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
