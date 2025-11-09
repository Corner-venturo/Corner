/**
 * 出納單 PDF 生成
 *
 * 功能：
 * 1. 生成出納單 PDF
 * 2. 按供應商分組顯示請款項目
 * 3. 包含出納單基本資訊、請款項目明細、總計金額
 * 4. 支援中文字體
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

interface SupplierGroup {
  supplierId: string
  supplierName: string
  items: PaymentRequestItem[]
  total: number
}

/**
 * 生成出納單 PDF
 */
export async function generateDisbursementPDF(data: DisbursementPDFData): Promise<void> {
  const { order, paymentRequests, paymentRequestItems } = data

  // 初始化 PDF (A4 直式)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // 設定字體 (使用內建字體，避免中文顯示問題)
  doc.setFont('helvetica')

  let yPos = 20

  // ========== 標題 ==========
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Disbursement Order', 105, yPos, { align: 'center' })
  yPos += 5
  doc.setFontSize(16)
  doc.text('出納單', 105, yPos, { align: 'center' })
  yPos += 15

  // ========== 基本資訊 ==========
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const infoLeft = 20
  const infoRight = 110

  doc.text(`Order No. / 出納單號: ${order.order_number}`, infoLeft, yPos)
  yPos += 6
  doc.text(`Date / 出帳日期: ${formatDate(order.disbursement_date)}`, infoLeft, yPos)
  yPos += 6
  doc.text(`Status / 狀態: ${getStatusText(order.status)}`, infoLeft, yPos)
  yPos += 6
  doc.text(`Total Amount / 總金額: NT$ ${order.total_amount.toLocaleString()}`, infoLeft, yPos)
  yPos += 10

  if (order.note) {
    doc.setFontSize(9)
    doc.text(`Note / 備註: ${order.note}`, infoLeft, yPos)
    yPos += 8
  }

  // ========== 按供應商分組 ==========
  const supplierGroups = groupBySupplier(paymentRequestItems)

  // ========== 表格標題 ==========
  yPos += 5
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Payment Items by Supplier / 請款項目（按供應商）', infoLeft, yPos)
  yPos += 8

  // ========== 每個供應商一個表格 ==========
  for (const group of supplierGroups) {
    // 供應商名稱
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(`${group.supplierName} - NT$ ${group.total.toLocaleString()}`, infoLeft, yPos)
    yPos += 5

    // 準備表格資料
    const tableData = group.items.map((item, index) => [
      (index + 1).toString(),
      item.item_number,
      item.description || '-',
      item.category,
      `NT$ ${item.unit_price.toLocaleString()}`,
      item.quantity.toString(),
      `NT$ ${item.subtotal.toLocaleString()}`,
    ])

    // 繪製表格
    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Item No. / 項目號', 'Description / 說明', 'Category / 類別', 'Unit Price / 單價', 'Qty / 數量', 'Subtotal / 小計']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [71, 85, 105], // morandi-primary
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: 60,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 30 },
        2: { halign: 'left', cellWidth: 50 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 25 },
        5: { halign: 'center', cellWidth: 15 },
        6: { halign: 'right', cellWidth: 30 },
      },
      margin: { left: infoLeft, right: 20 },
      didDrawPage: (data) => {
        yPos = data.cursor!.y
      },
    })

    yPos += 8

    // 檢查是否需要換頁
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }
  }

  // ========== 總計 ==========
  yPos += 5
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`Total Amount / 總金額: NT$ ${order.total_amount.toLocaleString()}`, infoLeft, yPos)

  // ========== 頁尾 ==========
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150)
    doc.text(
      `Generated on ${formatDate(new Date().toISOString())} - Page ${i} of ${pageCount}`,
      105,
      287,
      { align: 'center' }
    )
  }

  // ========== 儲存 PDF ==========
  const filename = `Disbursement_${order.order_number}_${formatDate(order.disbursement_date)}.pdf`
  doc.save(filename)
}

/**
 * 按供應商分組請款項目
 */
function groupBySupplier(items: PaymentRequestItem[]): SupplierGroup[] {
  const grouped = new Map<string, SupplierGroup>()

  for (const item of items) {
    const key = item.supplier_id
    if (!grouped.has(key)) {
      grouped.set(key, {
        supplierId: item.supplier_id,
        supplierName: item.supplier_name,
        items: [],
        total: 0,
      })
    }
    const group = grouped.get(key)!
    group.items.push(item)
    group.total += item.subtotal
  }

  // 按供應商名稱排序
  return Array.from(grouped.values()).sort((a, b) =>
    a.supplierName.localeCompare(b.supplierName, 'zh-TW')
  )
}

/**
 * 取得狀態文字
 */
function getStatusText(status: DisbursementOrder['status']): string {
  const statusMap: Record<DisbursementOrder['status'], string> = {
    pending: 'Pending / 待確認',
    confirmed: 'Confirmed / 已確認',
    paid: 'Paid / 已付款',
    cancelled: 'Cancelled / 已取消',
  }
  return statusMap[status] || status
}
