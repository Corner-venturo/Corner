import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Quote, QuickQuoteItem } from '@/types/quote.types'
import { COMPANY } from '@/lib/constants/company'

// 添加頁首（Logo + 標題）
const addHeaders = (doc: jsPDF, logoUrl: string) => {
  const pageCount = doc.getNumberOfPages()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    // TODO: 如果有 Logo 圖片，可以用 doc.addImage() 添加
    // 暫時用文字表示
    doc.setFontSize(10)
    doc.setFont('ChironHeiHK', 'normal')
    doc.text('角落旅行社', 15, 15)

    // 標題
    doc.setFontSize(16)
    doc.setFont('ChironHeiHK', 'bold')
    doc.text('報價請款單', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' })
  }
}

// 添加頁尾（副標題 + 版權 + 頁碼）
const addFooters = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages()
  doc.setFontSize(9)
  doc.setFont('ChironHeiHK', 'normal')

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    const pageHeight = doc.internal.pageSize.getHeight()
    const pageWidth = doc.internal.pageSize.getWidth()

    // 副標題（斜體效果用較小字型模擬）
    doc.setFontSize(10)
    doc.text(COMPANY.subtitleWithDash, pageWidth / 2, pageHeight - 20, {
      align: 'center',
    })

    // 版權
    doc.setFontSize(8)
    doc.text(`角落旅行社股份有限公司 © ${new Date().getFullYear()}`, 15, pageHeight - 10)

    // 頁碼
    doc.text(`第 ${i} / ${pageCount} 頁`, pageWidth - 15, pageHeight - 10, { align: 'right' })
  }
}

export const generateQuickQuotePDF = async (
  quote: Quote,
  items: QuickQuoteItem[],
  logoUrl?: string
) => {
  const pdf = new jsPDF('p', 'mm', 'a4')

  // 設定字體
  pdf.addFont('/assets/fonts/ChironHeiHK-N.ttf', 'ChironHeiHK', 'normal')
  pdf.addFont('/assets/fonts/ChironHeiHK-B.ttf', 'ChironHeiHK', 'bold')
  pdf.setFont('ChironHeiHK', 'normal')

  // 添加頁首
  addHeaders(pdf, logoUrl || '')

  // 客戶資訊
  let yPos = 30
  pdf.setFontSize(10)

  const infoData = [
    ['團體名稱：', quote.customer_name],
    ['團體編號：', quote.tour_code || ''],
    ['聯絡電話：', quote.contact_phone || ''],
    ['承辦業務：', quote.handler_name || 'William'],
    ['通訊地址：', quote.contact_address || ''],
    ['開單日期：', quote.issue_date || new Date().toISOString().split('T')[0]],
  ]

  autoTable(pdf, {
    body: infoData,
    startY: yPos,
    theme: 'plain',
    styles: {
      font: 'ChironHeiHK',
      fontSize: 10,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 30, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
    },
  })

  // 收費明細表標題
  yPos = (pdf as any).lastAutoTable.finalY + 10
  pdf.setFontSize(12)
  pdf.setFont('ChironHeiHK', 'bold')
  pdf.text('收費明細表 ▽', 15, yPos)

  // 收費明細表
  const tableData = items.map(item => [
    item.description || '',
    item.quantity !== 0 ? item.quantity.toString() : '',
    item.unit_price !== 0 ? item.unit_price.toLocaleString() : '',
    item.amount !== 0 ? item.amount.toLocaleString() : '',
    item.notes || '',
  ])

  // 如果沒有項目，至少顯示一行空白
  if (tableData.length === 0) {
    tableData.push(['', '', '', '', ''])
  }

  autoTable(pdf, {
    head: [['摘要', '數量', '單價', '金額', '備註']],
    body: tableData,
    startY: yPos + 5,
    theme: 'grid',
    styles: {
      font: 'ChironHeiHK',
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 'auto' },
    },
  })

  // 金額統計
  yPos = (pdf as any).lastAutoTable.finalY + 10
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
  const receivedAmount = quote.received_amount || 0
  const balanceAmount = totalAmount - receivedAmount

  const summaryData = [
    ['應收金額', `NT$ ${totalAmount.toLocaleString()}`],
    ['已收金額', `NT$ ${receivedAmount.toLocaleString()}`],
    ['應收餘額', `NT$ ${balanceAmount.toLocaleString()}`],
  ]

  autoTable(pdf, {
    body: summaryData,
    startY: yPos,
    theme: 'grid',
    styles: {
      font: 'ChironHeiHK',
      fontSize: 11,
      cellPadding: 5,
    },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold', fillColor: [250, 250, 250] },
      1: {
        cellWidth: 'auto',
        halign: 'right',
        fontStyle: 'bold',
        fontSize: 12,
      },
    },
  })

  // 付款資訊
  yPos = (pdf as any).lastAutoTable.finalY + 10
  pdf.setFontSize(11)
  pdf.setFont('ChironHeiHK', 'bold')
  pdf.text('匯款資訊', 15, yPos)

  const bankInfo = [
    ['戶名：', '角落旅行社股份有限公司'],
    ['銀行：', '國泰世華銀行 (013)'],
    ['分行：', '大同分行 (0626)'],
    ['帳號：', '062-03-500821-2'],
  ]

  autoTable(pdf, {
    body: bankInfo,
    startY: yPos + 3,
    theme: 'plain',
    styles: {
      font: 'ChironHeiHK',
      fontSize: 9,
      cellPadding: 1,
    },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
    },
  })

  // 支票資訊
  yPos = (pdf as any).lastAutoTable.finalY + 5
  pdf.setFontSize(11)
  pdf.setFont('ChironHeiHK', 'bold')
  pdf.text('支票資訊', 110, yPos)

  const checkInfo = [
    ['抬頭：', '角落旅行社股份有限公司'],
    ['', '禁止背書轉讓'],
    ['', '（請於出發日前付清餘額）'],
  ]

  autoTable(pdf, {
    body: checkInfo,
    startY: yPos + 3,
    margin: { left: 110 },
    theme: 'plain',
    styles: {
      font: 'ChironHeiHK',
      fontSize: 9,
      cellPadding: 1,
    },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
    },
  })

  // 收據資訊
  yPos = Math.max((pdf as any).lastAutoTable.finalY + 10, yPos + 30)
  pdf.setFontSize(11)
  pdf.setFont('ChironHeiHK', 'bold')
  pdf.text('收據資訊', 15, yPos)

  const receiptInfo = [
    ['開立代收轉付抬頭：', '_______________________'],
    ['開立代收轉付統編：', '_______________________'],
  ]

  autoTable(pdf, {
    body: receiptInfo,
    startY: yPos + 3,
    theme: 'plain',
    styles: {
      font: 'ChironHeiHK',
      fontSize: 9,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
    },
  })

  // 添加頁尾
  addFooters(pdf)

  // 保存 PDF
  const fileName = `報價請款單_${quote.customer_name}_${new Date().toISOString().split('T')[0]}.pdf`
  pdf.save(fileName)
}
