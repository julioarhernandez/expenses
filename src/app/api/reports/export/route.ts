import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getServerTranslation } from '@/lib/i18n/server-translation'

function toDate(y: number, m0: number, d: number) {
  return new Date(y, m0, d).toISOString().split('T')[0]
}

function formatDate(iso: string) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${m}/${d}/${y}`
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
  const { t, lang } = await getServerTranslation()
  const sp = request.nextUrl.searchParams
  const format = sp.get('format') ?? 'csv'
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
  const workspaceList = ownedWorkspaces ?? []
  const validIds = new Set(workspaceList.map((w: any) => w.id))
  const wsNameMap = Object.fromEntries(workspaceList.map((w: any) => [w.id, w.name]))

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

  if (format === 'pdf') {
    const doc = new jsPDF()
    const workspacesInReport = workspaceList.filter((w: any) => selectedIds.includes(w.id))

    // Pre-calculate totals for summary
    const wsTotals: Record<string, number> = {}
    const categoryWsMap: Record<string, Record<string, number>> = {}
    const categorySet = new Set<string>()
    let grandTotal = 0

    workspacesInReport.forEach(ws => {
      const wsExpenses = rows.filter(e => e.workspace_id === ws.id)
      const total = wsExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
      wsTotals[ws.id] = total
      grandTotal += total

      wsExpenses.forEach(e => {
        const catName = e.category?.name || '—'
        categorySet.add(catName)
        if (!categoryWsMap[catName]) categoryWsMap[catName] = {}
        categoryWsMap[catName][ws.id] = (categoryWsMap[catName][ws.id] || 0) + Number(e.amount)
      })
    })
    const sortedCategories = Array.from(categorySet).sort()

    // Header
    doc.setFontSize(22)
    doc.setTextColor(33, 33, 33)
    doc.text(t('reports').title, 14, 20)

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`${t('reports').period}: ${label.toUpperCase()}`, 14, 28)
    doc.text(`${t('reports').range}: ${formatDate(start)} to ${formatDate(end)}`, 14, 33)
    doc.text(`${t('reports').generated_at}: ${formatDate(today)}`, 14, 38)

    let currentY = 45

    const commonTableProps = {
      theme: 'striped' as const,
      headStyles: {
        fillColor: [99, 102, 241] as [number, number, number],
        textColor: [255, 255, 255] as [number, number, number],
        fontStyle: 'bold' as const
      },
      footStyles: {
        fillColor: [249, 250, 251] as [number, number, number],
        textColor: [0, 0, 0] as [number, number, number],
        fontStyle: 'bold' as const
      },
      alternateRowStyles: { fillColor: [230, 230, 230] as [number, number, number] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9, cellPadding: 3 },
    }

    workspacesInReport.forEach((ws: any) => {
      const wsExpenses = rows.filter(e => e.workspace_id === ws.id)
      const wsTotal = wsTotals[ws.id]

      if (currentY > 240) {
        doc.addPage()
        currentY = 20
      }

      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.text(ws.name.toUpperCase(), 14, currentY)
      currentY += 2

      // Main Expenses Table
      autoTable(doc, {
        ...commonTableProps,
        startY: currentY + 2,
        head: [[
          t('expenses').date,
          t('expenses').merchant,
          t('expenses').category,
          t('expenses').notes,
          { content: t('expenses').amount, styles: { halign: 'right' } }
        ]],
        body: wsExpenses.map(e => [
          formatDate(e.date),
          e.merchant,
          e.category?.name || '—',
          e.notes || '—',
          { content: Number(e.amount).toFixed(2), styles: { halign: 'right' } }
        ]),
        foot: [[
          { content: t('reports').workspace_total, colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: wsTotal.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } }
        ]],
      })

      currentY = (doc as any).lastAutoTable.finalY + 10

      // Category Summary Table
      const catTotals: Record<string, number> = {}
      wsExpenses.forEach(e => {
        const catName = e.category?.name || '—'
        catTotals[catName] = (catTotals[catName] || 0) + Number(e.amount)
      })

      autoTable(doc, {
        ...commonTableProps,
        startY: currentY,
        styles: { fontSize: 8, cellPadding: 3 },
        head: [[
          t('expenses').category,
          { content: t('expenses').amount, styles: { halign: 'right' } },
          { content: t('reports').percentage, styles: { halign: 'right' } }
        ]],
        body: Object.entries(catTotals)
          .sort(([, a], [, b]) => b - a)
          .map(([name, total]) => [
            name,
            { content: total.toFixed(2), styles: { halign: 'right' } },
            { content: wsTotal > 0 ? ((total / wsTotal) * 100).toFixed(1) + '%' : '0%', styles: { halign: 'right' } }
          ]),
      })

      currentY = (doc as any).lastAutoTable.finalY + 15
    })

    // Summary section
    if (selectedIds.length > 1) {
      if (currentY > 180) {
        doc.addPage()
        currentY = 20
      }

      doc.setDrawColor(200, 200, 200)
      doc.line(14, currentY, 196, currentY)
      currentY += 10

      doc.setFontSize(16)
      doc.setTextColor(99, 102, 241)
      doc.text(t('reports').summary, 14, currentY)
      currentY += 5

      // 1. Category totals per workspace (Pivot table)
      const catPivotHead = [
        t('expenses').category,
        ...workspacesInReport.map(ws => ({ content: ws.name, styles: { halign: 'right' } })),
        { content: t('common').total, styles: { halign: 'right' } }
      ]

      const catPivotBody = sortedCategories.map(cat => {
        const row: any[] = [cat]
        workspacesInReport.forEach(ws => {
          row.push((categoryWsMap[cat][ws.id] || 0).toFixed(2))
        })
        const catTotal = Object.values(categoryWsMap[cat]).reduce((s, v) => s + v, 0)
        row.push(catTotal.toFixed(2))
        return row
      })

      const catPivotFooter = [
        t('common').total,
        ...workspacesInReport.map(ws => wsTotals[ws.id].toFixed(2)),
        grandTotal.toFixed(2)
      ]

      autoTable(doc, {
        ...commonTableProps,
        startY: currentY,
        styles: { fontSize: 8, cellPadding: 2 },
        head: [catPivotHead],
        body: catPivotBody.map(row => row.map((cell, i) => i === 0 ? cell : { content: cell, styles: { halign: 'right' } })),
        foot: [catPivotFooter.map((cell, i) => i === 0 ? cell : { content: cell, styles: { halign: 'right', fontStyle: 'bold' } })],
      })

      currentY = (doc as any).lastAutoTable.finalY + 15

      // 2. Workspace Totals Summary (with Percentage)
      autoTable(doc, {
        ...commonTableProps,
        startY: currentY + 2,
        head: [[
          t('common').workspace,
          { content: t('expenses').amount, styles: { halign: 'right' } },
          { content: t('reports').percentage, styles: { halign: 'right' } }
        ]],
        body: workspacesInReport.map(ws => [
          ws.name,
          { content: wsTotals[ws.id].toFixed(2), styles: { halign: 'right' } },
          { content: grandTotal > 0 ? ((wsTotals[ws.id] / grandTotal) * 100).toFixed(1) + '%' : '0%', styles: { halign: 'right' } }
        ]),
        foot: [[
          t('common').total,
          { content: grandTotal.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } },
          { content: '100%', styles: { halign: 'right', fontStyle: 'bold' } }
        ]],
      })
    }

    const pdfBuffer = doc.output('arraybuffer')
    const filename = `report-${label}-${today}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  const header = `${t('expenses').date},${t('expenses').merchant},${t('expenses').amount},Tax,${t('expenses').category},${t('expenses').payment_method},Workspace,${t('expenses').notes}`
  const lines = rows.map((e) =>
    [
      csvEscape(formatDate(e.date)),
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
