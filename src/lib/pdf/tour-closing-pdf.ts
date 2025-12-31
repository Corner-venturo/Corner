/**
 * 結案報表 PDF 生成
 *
 * 功能：
 * 1. A4 直式格式
 * 2. 團體基本資訊
 * 3. 訂單收入明細
 * 4. 支出/成本明細
 * 5. 獎金計算
 * 6. 損益摘要
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Tour, PaymentRequest } from '@/stores/types'
import { formatDate } from '@/lib/utils'

// 簡化的訂單介面（只需要報表需要的欄位）
interface OrderForReport {
  code?: string | null
  contact_person?: string | null
  member_count?: number | null
  total_amount?: number | null
}

export interface TourClosingPDFData {
  tour: Tour
  orders: OrderForReport[]
  costs: PaymentRequest[] // 成本請款單
  bonuses: PaymentRequest[] // 獎金請款單
}

interface CostSummary {
  category: string
  amount: number
}

/**
 * 格式化金額
 */
function formatCurrency(amount: number): string {
  return `NT$ ${amount.toLocaleString()}`
}

/**
 * 生成結案報表 PDF
 */
export async function generateTourClosingPDF(data: TourClosingPDFData): Promise<void> {
  const { tour, orders, costs, bonuses } = data

  // 計算統計數據
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
  const totalCost = costs.reduce((sum, c) => sum + (c.amount || 0), 0)
  const totalBonus = bonuses.reduce((sum, b) => sum + (b.amount || 0), 0)
  const grossProfit = totalRevenue - totalCost
  const netProfit = grossProfit - totalBonus

  // 初始化 PDF - A4 直式
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = 15

  // ========== 標題區 ==========
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Tour Closing Report', pageWidth / 2, yPos, { align: 'center' })
  yPos += 6
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(tour.code, pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  // ========== 團體資訊區 ==========
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Tour Information', 15, yPos)
  yPos += 2

  autoTable(doc, {
    startY: yPos,
    body: [
      ['Tour Code', tour.code, 'Tour Name', tour.name || '-'],
      ['Departure', formatDate(tour.departure_date), 'Return', formatDate(tour.return_date)],
      ['Location', tour.location || '-', 'Status', tour.status || '-'],
    ],
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 30 },
      1: { cellWidth: 55 },
      2: { fontStyle: 'bold', cellWidth: 30 },
      3: { cellWidth: 55 },
    },
    margin: { left: 15, right: 15 },
  })

  yPos = (doc as any).lastAutoTable.finalY + 8

  // ========== 訂單收入明細 ==========
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Revenue Details', 15, yPos)
  yPos += 2

  const orderRows = orders.map((o, idx) => [
    String(idx + 1),
    o.code || '-',
    o.contact_person || '-',
    String(o.member_count || 0),
    formatCurrency(o.total_amount || 0),
  ])

  // 加入小計
  orderRows.push(['', '', '', 'Total:', formatCurrency(totalRevenue)])

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Order Code', 'Contact', 'Members', 'Amount']],
    body: orderRows,
    theme: 'striped',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [201, 170, 124], // morandi-gold
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 40 },
      2: { cellWidth: 50 },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 45, halign: 'right' },
    },
    margin: { left: 15, right: 15 },
    footStyles: {
      fontStyle: 'bold',
    },
  })

  yPos = (doc as any).lastAutoTable.finalY + 8

  // ========== 支出/成本明細 ==========
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Cost Details', 15, yPos)
  yPos += 2

  // 按類型彙總成本
  const costByType = new Map<string, number>()
  costs.forEach(c => {
    const type = c.request_type || 'Other'
    costByType.set(type, (costByType.get(type) || 0) + (c.amount || 0))
  })

  const costRows: string[][] = []
  costByType.forEach((amount, type) => {
    costRows.push([type, formatCurrency(amount)])
  })

  if (costRows.length === 0) {
    costRows.push(['No costs recorded', '-'])
  }

  // 加入小計
  costRows.push(['Total Cost:', formatCurrency(totalCost)])

  autoTable(doc, {
    startY: yPos,
    head: [['Category', 'Amount']],
    body: costRows,
    theme: 'striped',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [192, 131, 116], // morandi-red
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 70, halign: 'right' },
    },
    margin: { left: 15, right: 15 },
  })

  yPos = (doc as any).lastAutoTable.finalY + 8

  // ========== 獎金明細 ==========
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Bonus Details', 15, yPos)
  yPos += 2

  const bonusRows = bonuses.map(b => [
    b.request_type || '-',
    b.note || '-',
    formatCurrency(b.amount || 0),
  ])

  if (bonusRows.length === 0) {
    bonusRows.push(['No bonuses', '-', '-'])
  }

  // 加入小計
  bonusRows.push(['Total Bonus:', '', formatCurrency(totalBonus)])

  autoTable(doc, {
    startY: yPos,
    head: [['Type', 'Note', 'Amount']],
    body: bonusRows,
    theme: 'striped',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [159, 166, 143], // morandi-green
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 80 },
      2: { cellWidth: 40, halign: 'right' },
    },
    margin: { left: 15, right: 15 },
  })

  yPos = (doc as any).lastAutoTable.finalY + 8

  // ========== 損益摘要 ==========
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Profit Summary', 15, yPos)
  yPos += 2

  autoTable(doc, {
    startY: yPos,
    body: [
      ['Total Revenue', formatCurrency(totalRevenue)],
      ['Total Cost', `- ${formatCurrency(totalCost)}`],
      ['Gross Profit', formatCurrency(grossProfit)],
      ['Total Bonus', `- ${formatCurrency(totalBonus)}`],
      ['Net Profit', formatCurrency(netProfit)],
    ],
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 100, fontStyle: 'bold' },
      1: { cellWidth: 70, halign: 'right' },
    },
    margin: { left: 15, right: 15 },
    didDrawCell: (data) => {
      // 最後一行加粗並加底線
      if (data.row.index === 4 && data.section === 'body') {
        const cell = data.cell
        doc.setDrawColor(100, 100, 100)
        doc.setLineWidth(0.3)
        doc.line(cell.x, cell.y, cell.x + cell.width, cell.y)
      }
    },
  })

  // ========== 頁尾 ==========
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150)

    const pageHeight = doc.internal.pageSize.getHeight()

    // 頁碼
    doc.text(
      `Page ${i} / ${pageCount}`,
      pageWidth - 20,
      pageHeight - 10,
      { align: 'right' }
    )

    // 生成日期
    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      15,
      pageHeight - 10
    )
  }

  // ========== 儲存 PDF ==========
  const filename = `${tour.code}_Closing_Report.pdf`
  doc.save(filename)
}
