import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getServerTranslation } from '@/lib/i18n/server-translation'
import fs from 'fs'
import path from 'path'

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

  if (format === 'pdf') {
    const doc = new jsPDF()

    const colors = {
      primary: [99, 102, 241] as [number, number, number],
      primaryDark: [79, 70, 229] as [number, number, number],
      textDark: [31, 41, 55] as [number, number, number],
      textLight: [107, 114, 128] as [number, number, number],
      bgLight: [239, 240, 241] as [number, number, number],
      white: [255, 255, 255] as [number, number, number],
      border: [229, 231, 235] as [number, number, number],
    }

    const commonTableProps = {
      theme: 'striped' as const,
      headStyles: {
        fillColor: colors.primary,
        textColor: colors.white,
        fontStyle: 'bold' as const,
        fontSize: 10,
        cellPadding: 4,
      },
      footStyles: {
        fillColor: colors.bgLight,
        textColor: colors.textDark,
        fontStyle: 'bold' as const,
        fontSize: 10,
        cellPadding: 4,
      },
      alternateRowStyles: { fillColor: [245, 245, 245] as [number, number, number] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9, cellPadding: 3, textColor: colors.textDark },
    }

    // --- Modern Header Image ---
    try {
      const headerImgPath = path.join(process.cwd(), 'public', 'report-header.jpg')
      const headerImgData = fs.readFileSync(headerImgPath).toString('base64')
      doc.addImage(headerImgData, 'JPG', 14, 14, 182, 30) // Adjusted height for 1260x205 aspect ratio
    } catch (e) {
      // Fallback to solid color if image fails
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2])
      doc.roundedRect(14, 14, 182, 30, 4, 4, 'F')
    }

    // Dynamic Header Text (Right Side)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('Expense Report', 145, 28) // Moved up to match shorter header
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`${label.toUpperCase()}`, 145, 36)

    // --- Metadata Section (Prepared By, Department, Period) ---
    let metaY = 60 // Moved up due to shorter header
    // Icons helper
    const addMetaIcon = (imgPath: string, x: number, y: number) => {
      try {
        const fullPath = path.join(process.cwd(), 'public', imgPath)
        const data = fs.readFileSync(fullPath).toString('base64')
        doc.addImage(data, 'PNG', x, y, 10.5, 10) // Scale 64x60px to ~10mm
      } catch (e) {
        console.error(`Missing icon: ${imgPath}`)
      }
    }

    // Column 1: Prepared By
    addMetaIcon('report-user.png', 14, metaY - 3)
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
    doc.setFontSize(9)
    doc.text(t('reports').prepared_by, 28, metaY)
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2])
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(user.email?.split('@')[0].replace('.', ' ').toUpperCase() || 'USER', 28, metaY + 6)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
    doc.text(user.email || '', 28, metaY + 12)

    // Column 2: Department/Workspace
    addMetaIcon('report-workspace.png', 80, metaY - 3)
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
    doc.text(t('common').workspace, 94, metaY)
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2])
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(workspacesInReport.length > 1 ? 'MULTI-WORKSPACE' : workspacesInReport[0]?.name || '—', 94, metaY + 6)

    // Column 3: Report Period
    addMetaIcon('report-date.png', 140, metaY - 3)
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
    doc.text(t('reports').report_period, 154, metaY)
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2])
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(`${formatDate(start)} – ${formatDate(end)}`, 154, metaY + 6)

    let currentY = 85 // Moved up to close gap

    workspacesInReport.forEach((ws: any) => {
      const wsExpenses = rows.filter(e => e.workspace_id === ws.id)
      const wsTotal = wsTotals[ws.id]

      if (currentY > 230) {
        doc.addPage()
        currentY = 20
      }

      // Workspace Header Card
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(14, currentY, 182, 12, 2, 2, 'F')
      
      // Workspace Icon
      try {
        const wsIconPath = path.join(process.cwd(), 'public', 'report-workspace.png')
        const wsIconData = fs.readFileSync(wsIconPath).toString('base64')
        doc.addImage(wsIconData, 'PNG', 14, currentY + 1, 10.6, 10) // Centered 10mm icon in 12mm bar
      } catch (e) {}

      doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2])
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text(ws.name.toUpperCase(), 28, currentY + 8.5) // Centered text baseline
      currentY += 16

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

      // Category Summary Table (Per Workspace)
      const catTotals: Record<string, number> = {}
      wsExpenses.forEach(e => {
        const catName = e.category?.name || '—'
        catTotals[catName] = (catTotals[catName] || 0) + Number(e.amount)
      })

      autoTable(doc, {
        ...commonTableProps,
        startY: currentY,
        styles: { ...commonTableProps.styles, fontSize: 8 },
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

    // --- Global Summary Section ---
    if (selectedIds.length > 1) {
      if (currentY > 180) {
        doc.addPage()
        currentY = 20
      }

      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
      doc.line(14, currentY, 196, currentY)
      currentY += 10

      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2])
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text(t('reports').summary.toUpperCase(), 14, currentY + 5)
      currentY += 10

      autoTable(doc, {
        ...commonTableProps,
        startY: currentY,
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

      // Category Totals Summary (Global)
      currentY = (doc as any).lastAutoTable.finalY + 15
      if (currentY > 180) {
        doc.addPage()
        currentY = 20
      }

      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2])
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text(t('dashboard').by_category.toUpperCase(), 14, currentY + 5)
      currentY += 10

      const globalCatTotals = Object.entries(categoryWsMap)
        .map(([name, wsMap]) => {
          const total = Object.values(wsMap).reduce((s, v) => s + v, 0)
          return [name, total]
        })
        .sort(([, a], [, b]) => (b as number) - (a as number))

      autoTable(doc, {
        ...commonTableProps,
        startY: currentY,
        head: [[
          t('expenses').category,
          { content: t('expenses').amount, styles: { halign: 'right' } },
          { content: t('reports').percentage, styles: { halign: 'right' } }
        ]],
        body: globalCatTotals.map(([name, total]) => [
          name as string,
          { content: (total as number).toFixed(2), styles: { halign: 'right' } },
          { content: grandTotal > 0 ? (((total as number) / grandTotal) * 100).toFixed(1) + '%' : '0%', styles: { halign: 'right' } }
        ]),
        foot: [[
          t('common').total,
          { content: grandTotal.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } },
          { content: '100%', styles: { halign: 'right', fontStyle: 'bold' } }
        ]],
      })
    }

    const pdfBuffer = doc.output('arraybuffer')
    const filename = `Expense_Report_${label}_${today}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  const mode = sp.get('mode') || 'reading'
  let csvContent = ''
  let filename = ''

  if (mode === 'reading') {
    // Structured "Readable" CSV
    const csvLines: string[] = []
    csvLines.push(`${t('reports').title.toUpperCase()} - ${label.toUpperCase()} - ${today}`)
    csvLines.push(`${t('reports').generated_at}: ${new Date().toLocaleString()}`)
    csvLines.push('')

    workspacesInReport.forEach(ws => {
      const wsExpenses = rows.filter(e => e.workspace_id === ws.id)
      const wsTotal = wsTotals[ws.id]
      
      csvLines.push(`${t('common').workspace.toUpperCase()}: ${ws.name.toUpperCase()}`)
      csvLines.push(`${t('expenses').date},${t('expenses').merchant},${t('expenses').category},${t('expenses').notes},${t('expenses').amount}`)
      
      wsExpenses.forEach(e => {
        csvLines.push([
          formatDate(e.date),
          csvEscape(e.merchant),
          csvEscape(e.category?.name || '—'),
          csvEscape(e.notes || '—'),
          Number(e.amount).toFixed(2)
        ].join(','))
      })
      
      csvLines.push(`,,,${t('common').total.toUpperCase()},${wsTotal.toFixed(2)}`)
      csvLines.push('')
      
      // Category Summary for Workspace
      const catTotals: Record<string, number> = {}
      wsExpenses.forEach(e => {
        const catName = e.category?.name || '—'
        catTotals[catName] = (catTotals[catName] || 0) + Number(e.amount)
      })
      
      csvLines.push(`${t('reports').category_summary.toUpperCase()} (${ws.name.toUpperCase()})`)
      csvLines.push(`${t('expenses').category},${t('expenses').amount},${t('reports').percentage}`)
      Object.entries(catTotals)
        .sort(([, a], [, b]) => b - a)
        .forEach(([name, total]) => {
          csvLines.push([
            csvEscape(name),
            total.toFixed(2),
            wsTotal > 0 ? ((total / wsTotal) * 100).toFixed(1) + '%' : '0%'
          ].join(','))
        })
      csvLines.push('')
      csvLines.push('')
    })

    if (selectedIds.length > 1) {
      csvLines.push(t('reports').summary.toUpperCase())
      csvLines.push(`${t('common').workspace},${t('expenses').amount},${t('reports').percentage}`)
      workspacesInReport.forEach(ws => {
        csvLines.push([
          csvEscape(ws.name),
          wsTotals[ws.id].toFixed(2),
          grandTotal > 0 ? ((wsTotals[ws.id] / grandTotal) * 100).toFixed(1) + '%' : '0%'
        ].join(','))
      })
      csvLines.push(`${t('common').total.toUpperCase()},${grandTotal.toFixed(2)},100%`)
    }

    csvContent = '\uFEFF' + csvLines.join('\r\n')
    filename = `Expense_Report_${label}_${today}.csv`
  } else {
    // Flat "Processing" CSV (Taxes)
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
    csvContent = '\uFEFF' + [header, ...lines].join('\r\n')
    filename = `Expense_Data_${label}_${today}.csv`
  }

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
