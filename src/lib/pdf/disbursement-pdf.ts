/**
 * 出納單 PDF 生成
 *
 * 功能：
 * 1. 橫向 A4 格式（配合 cornerERP）
 * 2. 按付款對象（供應商）分組
 * 3. 跨請款單合併同一供應商
 * 4. 自動分頁處理
 * 5. 支援中文字體
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { DisbursementOrder, PaymentRequest, PaymentRequestItem } from '@/stores/types'
import { formatDate } from '@/lib/utils'

interface DisbursementPDFData {
  order: DisbursementOrder
  paymentRequests: PaymentRequest[]
  paymentRequestItems: PaymentRequestItem[]
}

interface ProcessedItem {
  requestCode: string
  createdBy: string
  tourName: string
  description: string
  payFor: string
  amount: number
}

interface PayForGroup {
  payFor: string
  items: ProcessedItem[]
  total: number
  hiddenTotal?: boolean
}

/**
 * 處理請款項目
 */
function processItems(
  paymentRequests: PaymentRequest[],
  paymentRequestItems: PaymentRequestItem[]
): ProcessedItem[] {
  const requestMap = new Map(paymentRequests.map(r => [r.id, r]))

  return paymentRequestItems.map(item => {
    const request = requestMap.get(item.request_id)
    return {
      requestCode: request?.code || '-',
      createdBy: request?.created_by_name || '-',
      tourName: request?.tour_name || '-',
      description: item.description || item.category || '-',
      payFor: item.supplier_name || '未指定供應商',
      amount: item.subtotal || 0,
    }
  })
}

/**
 * 按付款對象分組
 */
function groupByPayFor(items: ProcessedItem[]): PayForGroup[] {
  const grouped = new Map<string, ProcessedItem[]>()

  for (const item of items) {
    if (!grouped.has(item.payFor)) {
      grouped.set(item.payFor, [])
    }
    grouped.get(item.payFor)!.push(item)
  }

  const groups: PayForGroup[] = Array.from(grouped.entries()).map(([payFor, groupItems]) => ({
    payFor,
    items: groupItems,
    total: groupItems.reduce((sum, item) => sum + item.amount, 0),
  }))

  groups.sort((a, b) => a.payFor.localeCompare(b.payFor, 'zh-TW'))

  return groups
}

/**
 * 分割大型群組
 */
function splitLargeGroups(groups: PayForGroup[], maxSize = 5): PayForGroup[] {
  const result: PayForGroup[] = []

  for (const group of groups) {
    if (group.items.length <= maxSize) {
      result.push(group)
    } else {
      for (let i = 0; i < group.items.length; i += maxSize) {
        const chunk = group.items.slice(i, i + maxSize)
        result.push({
          payFor: group.payFor,
          items: chunk,
          total: i === 0 ? group.total : 0,
          hiddenTotal: i !== 0,
        })
      }
    }
  }

  return result
}

/**
 * 生成出納單 PDF
 */
export async function generateDisbursementPDF(data: DisbursementPDFData): Promise<void> {
  const { order, paymentRequests, paymentRequestItems } = data

  // 處理資料
  const processedItems = processItems(paymentRequests, paymentRequestItems)
  const payForGroups = splitLargeGroups(groupByPayFor(processedItems))

  // 初始化 PDF - 橫向 A4 (208mm x 295mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [208, 295],
  })

  // 設定字體
  doc.setFont('helvetica')

  // ========== 標題區 ==========
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`出納單號 ${order.order_number || '-'}`, 15, 15)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`出帳日期: ${order.disbursement_date ? formatDate(order.disbursement_date) : '-'}`, 15, 22)

  // ========== 準備表格資料 ==========
  const tableBody: (string | { content: string; rowSpan?: number })[][] = []

  for (const group of payForGroups) {
    group.items.forEach((item, idx) => {
      const row: (string | { content: string; rowSpan?: number })[] = []

      // 付款對象（第一行使用 rowSpan）
      if (idx === 0) {
        row.push({ content: group.payFor, rowSpan: group.items.length })
      }

      row.push(item.requestCode)
      row.push(item.createdBy)
      row.push(item.tourName)
      row.push(item.description)
      row.push(item.amount.toLocaleString())

      // 小計（第一行使用 rowSpan）
      if (idx === 0) {
        row.push({
          content: group.hiddenTotal ? '' : group.total.toLocaleString(),
          rowSpan: group.items.length,
        })
      }

      tableBody.push(row)
    })
  }

  // ========== 繪製表格 ==========
  autoTable(doc, {
    startY: 28,
    head: [['付款對象', '請款編號', '請款人員', '團名', '項目', '應付金額', '小計']],
    body: tableBody,
    foot: [['TOTAL', '', '', '', '', '', (order.amount || order.total_amount || 0).toLocaleString()]],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
      lineWidth: 0.1,
      lineColor: [200, 200, 200],
      textColor: [60, 60, 60],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [80, 80, 80],
      fontStyle: 'bold',
      lineWidth: { top: 0.3, bottom: 0.3, left: 0, right: 0 },
      lineColor: [150, 150, 150],
    },
    footStyles: {
      fillColor: [255, 255, 255],
      textColor: [120, 120, 120],
      fontSize: 12,
      fontStyle: 'normal',
      lineWidth: { top: 0.5, bottom: 0, left: 0, right: 0 },
      lineColor: [100, 100, 100],
    },
    columnStyles: {
      0: { cellWidth: 35, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 30, halign: 'left' },
      2: { cellWidth: 25, halign: 'left' },
      3: { cellWidth: 45, halign: 'left' },
      4: { cellWidth: 'auto', halign: 'left' },
      5: { cellWidth: 28, halign: 'right' },
      6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 15, right: 15 },
    showFoot: 'lastPage',
  })

  // ========== 頁尾 ==========
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150)

    const pageHeight = doc.internal.pageSize.getHeight()
    const pageWidth = doc.internal.pageSize.getWidth()

    doc.text(
      '─ 如果可以，讓我們一起探索世界的每個角落 ─',
      pageWidth / 2,
      pageHeight - 12,
      { align: 'center' }
    )
    doc.text(
      `${i} / ${pageCount}`,
      pageWidth - 18,
      pageHeight - 12,
      { align: 'center' }
    )
  }

  // ========== 儲存 PDF ==========
  const filename = `${order.order_number || 'Disbursement'}.pdf`
  doc.save(filename)
}

/**
 * 取得狀態文字
 */
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待出帳',
    confirmed: '已確認',
    paid: '已出帳',
    cancelled: '已取消',
  }
  return statusMap[status] || status
}
