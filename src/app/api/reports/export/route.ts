import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

function toDate(y: number, m0: number, d: number) {
  return new Date(y, m0, d).toISOString().split('T')[0]
}

function computeRange(period: string, year: number, month: number, quarter: number, half: number) {
  const today = new Date().toISOString().split('T')[0]
  let start: string, end: string, label: string
  switch (period) {
    case 'quarterly': {
      const q = quarter
      start = toDate(year, (q - 1) * 3, 1)
      end = toDate(year, q * 3, 0)
      label = `q${q}-${year}`
      break
    }
    case 'semi': {
      start = half === 1 ? toDate(year, 0, 1) : toDate(year, 6, 1)
      end = half === 1 ? toDate(year, 5, 30) : toDate(year, 11, 31)
      label = `h${half}-${year}`
      break
    }
    case 'yearly': {
      start = toDate(year, 0, 1)
      end = toDate(year, 11, 31)
      label = `${year}`
      break
    }
    default: {
      start = toDate(year, month - 1, 1)
      end = toDate(year, month, 0)
      const monthName = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short' }).toLowerCase()
      label = `${monthName}-${year}`
    }
  }
  if (end > today) end = today
  return { start, end, label }
}

function csvEscape(val: string | null | undefined) {
  if (val === null || val === undefined) return '""'
  const safe = String(val).replace(/\n/g, ' ').replace(/"/g, '""')
  return `"${safe}"`
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const period = sp.get('period') ?? 'monthly'
  const year = parseInt(sp.get('year') ?? String(new Date().getFullYear()))
  const month = parseInt(sp.get('month') ?? String(new Date().getMonth() + 1))
  const quarter = parseInt(sp.get('quarter') ?? '1')
  const half = parseInt(sp.get('half') ?? '1')
  const wsParam = sp.get('workspaces') ?? ''

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(c) { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: ownedWorkspaces } = await supabase
    .from('workspaces').select('id,name').eq('user_id', user.id)
  const validIds = new Set((ownedWorkspaces ?? []).map((w: any) => w.id))
  const wsNameMap = Object.fromEntries((ownedWorkspaces ?? []).map((w: any) => [w.id, w.name]))

  let selectedIds = wsParam ? wsParam.split(',').filter((id) => validIds.has(id)) : []
  if (selectedIds.length === 0) {
    const cookieWs = cookieStore.get('active-workspace-id')?.value
    selectedIds = cookieWs && validIds.has(cookieWs) ? [cookieWs] : [...validIds].slice(0, 1)
  }

  const { start, end, label } = computeRange(period, year, month, quarter, half)

  const { data: expenses } = await supabase
    .from('expenses')
    .select('date,merchant,amount,tax_amount,payment_method,notes,workspace_id,currency,category:categories(name)')
    .in('workspace_id', selectedIds)
    .gte('date', start)
    .lte('date', end)
    .eq('is_deleted', false)
    .order('date', { ascending: false })

  const rows = (expenses ?? []) as any[]
  const today = new Date().toISOString().split('T')[0]

  const header = 'Date,Merchant,Amount,Tax,Category,Payment Method,Workspace,Notes'
  const lines = rows.map((e) =>
    [
      csvEscape(e.date),
      csvEscape(e.merchant),
      csvEscape(Number(e.amount).toFixed(2)),
      csvEscape(e.tax_amount != null ? Number(e.tax_amount).toFixed(2) : ''),
      csvEscape(e.category?.name ?? ''),
      csvEscape(e.payment_method ?? ''),
      csvEscape(wsNameMap[e.workspace_id] ?? ''),
      csvEscape(e.notes ?? ''),
    ].join(',')
  )

  const csv = '﻿' + [header, ...lines].join('\r\n')
  const filename = `expenses-${label}-${today}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
