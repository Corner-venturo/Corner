/**
 * 結帳明細 PDF 生成
 *
 * 功能：
 * 1. A4 直式格式
 * 2. 頁面 1：收支明細（收入 + 支出）
 * 3. 頁面 2：利潤計算（使用 profit-calculation.service）
 * 4. 頁碼（第 X 頁 / 共 Y 頁）
 * 5. 支援中文字體
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Tour, PaymentRequest } from '@/stores/types'
import type { Receipt } from '@/types/receipt.types'
import type { ProfitCalculationResult } from '@/types/bonus.types'
import { BonusSettingType, BonusCalculationType } from '@/types/bonus.types'
import { formatDate } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/format-currency'
import { loadChineseFonts } from './pdf-fonts'
import { CLOSING_REPORT_PDF_LABELS as L } from './constants/pdf-labels'

// jspdf-autotable 擴展類型
interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number
  }
}

// 簡化的訂單介面
interface OrderForReport {
  code?: string | null
  contact_person?: string | null
  member_count?: number | null
  total_amount?: number | null
}

// 收款資料介面
interface ReceiptForReport {
  receipt_number?: string
  receipt_date?: string
  receipt_amount?: number
  amount?: number
  payment_method?: string
  receipt_type?: number
}

export interface TourClosingPDFData {
  tour: Tour
  orders: OrderForReport[]
  receipts: ReceiptForReport[]
  costs: PaymentRequest[]
  profitResult: ProfitCalculationResult
  preparedBy?: string
}

// Morandi 色調
const MORANDI_GOLD: [number, number, number] = [201, 170, 124]
const MORANDI_RED: [number, number, number] = [192, 131, 116]
const MORANDI_GREEN: [number, number, number] = [159, 166, 143]

/**
 * 取得付款方式顯示文字
 */
function getPaymentMethodLabel(method: string | undefined): string {
  if (!method) return '-'
  const map: Record<string, string> = {
    transfer: '匯款',
    cash: '現金',
    card: '信用卡',
    check: '支票',
    linkpay: 'LinkPay',
  }
  return map[method] || method
}

/**
 * 生成結帳明細 PDF
 */
export async function generateTourClosingPDF(data: TourClosingPDFData): Promise<void> {
  const { tour, receipts, costs, profitResult, preparedBy } = data

  // 初始化 PDF - A4 直式
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // 載入中文字體
  await loadChineseFonts(doc)

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15

  // ================================================================
  // 頁面 1：收支明細
  // ================================================================
  let yPos = 15

  // 標題
  doc.setFontSize(18)
  doc.setFont('ChironHeiHK', 'bold')
  doc.text(L.REPORT_TITLE, pageWidth / 2, yPos, { align: 'center' })
  yPos += 7

  doc.setFontSize(12)
  doc.setFont('ChironHeiHK', 'normal')
  doc.text(tour.code, pageWidth / 2, yPos, { align: 'center' })
  yPos += 8

  // 團基本資訊
  doc.setFontSize(9)
  doc.text(`${L.TOUR_NAME}：${tour.name || '-'}`, margin, yPos)
  doc.text(
    `${L.DEPARTURE_DATE}：${formatDate(tour.departure_date)} ~ ${formatDate(tour.return_date)}`,
    pageWidth - margin,
    yPos,
    { align: 'right' }
  )
  yPos += 5

  if (preparedBy) {
    doc.text(`${L.PREPARED_BY}：${preparedBy}`, margin, yPos)
  }
  doc.text(
    `${L.PRINT_DATE}：${formatDate(new Date().toISOString())}`,
    pageWidth - margin,
    yPos,
    { align: 'right' }
  )
  yPos += 8

  // ---- 收入明細 ----
  doc.setFontSize(11)
  doc.setFont('ChironHeiHK', 'bold')
  doc.text(L.SECTION_INCOME, margin, yPos)
  yPos += 2

  const incomeRows: string[][] = receipts.length > 0
    ? receipts.map((r, idx) => [
        String(idx + 1),
        r.receipt_number || '-',
        r.receipt_date ? formatDate(r.receipt_date) : '-',
        formatCurrency(r.receipt_amount ?? r.amount ?? 0),
        getPaymentMethodLabel(r.payment_method),
      ])
    : [['', L.NO_INCOME_RECORDS, '', '', '']]

  // 加入小計行
  incomeRows.push(['', '', '', formatCurrency(profitResult.receipt_total), L.INCOME_SUBTOTAL])

  autoTable(doc, {
    startY: yPos,
    head: [['#', L.COL_RECEIPT_NO, L.COL_DATE, L.COL_AMOUNT, L.COL_PAYMENT_METHOD]],
    body: incomeRows,
    theme: 'striped',
    styles: {
      font: 'ChironHeiHK',
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: MORANDI_GOLD,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 40 },
      2: { cellWidth: 30 },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 30, halign: 'center' },
    },
    margin: { left: margin, right: margin },
    didParseCell: (hookData) => {
      // 小計行加粗
      if (hookData.section === 'body' && hookData.row.index === incomeRows.length - 1) {
        hookData.cell.styles.fontStyle = 'bold'
      }
    },
  })

  yPos = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 8

  // ---- 支出明細 ----
  doc.setFontSize(11)
  doc.setFont('ChironHeiHK', 'bold')
  doc.text(L.SECTION_EXPENSE, margin, yPos)
  yPos += 2

  const expenseRows: string[][] = costs.length > 0
    ? costs.map((c, idx) => [
        String(idx + 1),
        c.code || '-',
        c.supplier_name || '-',
        formatCurrency(c.amount || 0),
        c.request_type || '-',
      ])
    : [['', L.NO_EXPENSE_RECORDS, '', '', '']]

  expenseRows.push(['', '', '', formatCurrency(profitResult.expense_total), L.EXPENSE_SUBTOTAL])

  autoTable(doc, {
    startY: yPos,
    head: [['#', L.COL_REQUEST_NO, L.COL_SUPPLIER, L.COL_AMOUNT, L.COL_CATEGORY]],
    body: expenseRows,
    theme: 'striped',
    styles: {
      font: 'ChironHeiHK',
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: MORANDI_RED,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 40 },
      2: { cellWidth: 45 },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 30 },
    },
    margin: { left: margin, right: margin },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.row.index === expenseRows.length - 1) {
        hookData.cell.styles.fontStyle = 'bold'
      }
    },
  })

  // ================================================================
  // 頁面 2：利潤計算
  // ================================================================
  doc.addPage()
  yPos = 15

  doc.setFontSize(16)
  doc.setFont('ChironHeiHK', 'bold')
  doc.text(L.SECTION_PROFIT, pageWidth / 2, yPos, { align: 'center' })
  yPos += 5

  doc.setFontSize(10)
  doc.setFont('ChironHeiHK', 'normal')
  doc.text(tour.code, pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  // 利潤計算表格
  const profitRows: string[][] = [
    [L.RECEIPT_TOTAL, formatCurrency(profitResult.receipt_total)],
    [L.EXPENSE_TOTAL, `- ${formatCurrency(profitResult.expense_total)}`],
    [
      L.ADMIN_COST(profitResult.admin_cost_per_person, profitResult.member_count),
      `- ${formatCurrency(profitResult.administrative_cost)}`,
    ],
    [L.PROFIT_BEFORE_TAX, formatCurrency(profitResult.profit_before_tax)],
    [
      L.PROFIT_TAX(profitResult.tax_rate),
      `- ${formatCurrency(profitResult.profit_tax)}`,
    ],
    [L.NET_PROFIT, formatCurrency(profitResult.net_profit)],
  ]

  // 分隔線（空行）
  profitRows.push(['', ''])

  // 獎金明細
  if (profitResult.net_profit >= 0) {
    // OP 獎金
    for (const b of profitResult.employee_bonuses) {
      if (b.setting.type === BonusSettingType.OP_BONUS) {
        const bonusVal = Number(b.setting.bonus)
        const pctLabel = b.setting.bonus_type === BonusCalculationType.PERCENT
          ? L.PERCENT_LABEL(bonusVal)
          : L.FIXED_LABEL(bonusVal)
        const suffix = b.employee_name ? L.EMPLOYEE_SUFFIX(b.employee_name) : ''
        profitRows.push([
          `${L.OP_BONUS}${pctLabel}${suffix}`,
          `- ${formatCurrency(b.amount)}`,
        ])
      }
    }

    // 業務獎金
    for (const b of profitResult.employee_bonuses) {
      if (b.setting.type === BonusSettingType.SALE_BONUS) {
        const bonusVal = Number(b.setting.bonus)
        const pctLabel = b.setting.bonus_type === BonusCalculationType.PERCENT
          ? L.PERCENT_LABEL(bonusVal)
          : L.FIXED_LABEL(bonusVal)
        const suffix = b.employee_name ? L.EMPLOYEE_SUFFIX(b.employee_name) : ''
        profitRows.push([
          `${L.SALE_BONUS}${pctLabel}${suffix}`,
          `- ${formatCurrency(b.amount)}`,
        ])
      }
    }

    // 團隊獎金
    for (const b of profitResult.team_bonuses) {
      const bonusVal = Number(b.setting.bonus)
      const pctLabel = b.setting.bonus_type === BonusCalculationType.PERCENT
        ? L.PERCENT_LABEL(bonusVal)
        : L.FIXED_LABEL(bonusVal)
      profitRows.push([
        `${L.TEAM_BONUS}${pctLabel}`,
        `- ${formatCurrency(b.amount)}`,
      ])
    }
  } else {
    profitRows.push([L.NO_BONUS, ''])
  }

  // 公司盈餘（最後一行）
  profitRows.push(['', ''])
  profitRows.push([L.COMPANY_PROFIT, formatCurrency(profitResult.company_profit)])

  autoTable(doc, {
    startY: yPos,
    body: profitRows,
    theme: 'plain',
    styles: {
      font: 'ChironHeiHK',
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 110, fontStyle: 'bold' },
      1: { cellWidth: 50, halign: 'right' },
    },
    margin: { left: margin, right: margin },
    didDrawCell: (hookData) => {
      // 淨利行底線
      if (hookData.section === 'body' && hookData.row.index === 5) {
        const cell = hookData.cell
        doc.setDrawColor(100, 100, 100)
        doc.setLineWidth(0.5)
        doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height)
      }
      // 公司盈餘行頂線
      if (hookData.section === 'body' && hookData.row.index === profitRows.length - 1) {
        const cell = hookData.cell
        doc.setDrawColor(80, 80, 80)
        doc.setLineWidth(0.5)
        doc.line(cell.x, cell.y, cell.x + cell.width, cell.y)
      }
    },
    didParseCell: (hookData) => {
      // 公司盈餘行加粗加大
      if (hookData.section === 'body' && hookData.row.index === profitRows.length - 1) {
        hookData.cell.styles.fontSize = 12
        hookData.cell.styles.fontStyle = 'bold'
      }
      // 淨利行加粗
      if (hookData.section === 'body' && hookData.row.index === 5) {
        hookData.cell.styles.fontStyle = 'bold'
      }
    },
  })

  // ========== 頁尾 ==========
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('ChironHeiHK', 'normal')
    doc.setTextColor(150)

    const pageHeight = doc.internal.pageSize.getHeight()

    doc.text(
      L.GENERATED_AT(formatDate(new Date().toISOString())),
      margin,
      pageHeight - 10,
    )
    doc.text(
      L.PAGE_NUMBER(i, pageCount),
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    )
  }

  // ========== 儲存 PDF ==========
  const filename = `${tour.code}_結帳明細.pdf`
  doc.save(filename)
}
