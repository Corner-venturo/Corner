/**
 * 請款單 PDF 生成
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { PaymentRequest, PaymentRequestItem } from '@/stores/types'
import { formatDate } from '@/lib/utils'

interface PaymentRequestPDFData {
  request: PaymentRequest
  items: PaymentRequestItem[]
}

export async function generatePaymentRequestPDF(data: PaymentRequestPDFData): Promise<void> {
  const { request, items } = data

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  doc.setFont('helvetica')
  let yPos = 20

  // 標題
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Payment Request / 請款單', 105, yPos, { align: 'center' })
  yPos += 15

  // 基本資訊
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const infoLeft = 20

  doc.text(`Request No. / 請款單號: ${request.request_number}`, infoLeft, yPos)
  yPos += 6
  doc.text(`Request Date / 請款日期: ${formatDate(request.request_date)}`, infoLeft, yPos)
  yPos += 6
  doc.text(`Tour Code / 團號: ${request.code || '-'}`, infoLeft, yPos)
  yPos += 6
  doc.text(`Tour Name / 團名: ${request.tour_name || '-'}`, infoLeft, yPos)
  yPos += 6
  doc.text(`Total Amount / 總金額: NT$ ${request.total_amount.toLocaleString()}`, infoLeft, yPos)
  yPos += 10

  // 請款項目表格
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Payment Items / 請款項目', infoLeft, yPos)
  yPos += 6

  const tableData = items.map((item, index) => [
    (index + 1).toString(),
    item.category,
    item.supplier_name,
    item.description || '-',
    `NT$ ${item.unit_price.toLocaleString()}`,
    item.quantity.toString(),
    `NT$ ${item.subtotal.toLocaleString()}`,
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Category / 類別', 'Supplier / 供應商', 'Description / 說明', 'Unit Price / 單價', 'Qty / 數量', 'Subtotal / 小計']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [71, 85, 105],
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
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'left', cellWidth: 30 },
      3: { halign: 'left', cellWidth: 45 },
      4: { halign: 'right', cellWidth: 25 },
      5: { halign: 'center', cellWidth: 15 },
      6: { halign: 'right', cellWidth: 30 },
    },
    margin: { left: infoLeft, right: 20 },
    didDrawPage: data => {
      yPos = data.cursor!.y
    },
  })

  yPos += 10

  // 總計
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`Total Amount / 總金額: NT$ ${request.total_amount.toLocaleString()}`, infoLeft, yPos)

  // 頁尾
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

  const filename = `PaymentRequest_${request.request_number}_${formatDate(request.request_date)}.pdf`
  doc.save(filename)
}
