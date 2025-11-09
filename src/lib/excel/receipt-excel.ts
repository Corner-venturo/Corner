/**
 * 收款單 Excel 匯出
 */

import * as XLSX from 'xlsx'
import type { Receipt } from '@/types/receipt.types'
import { formatDate } from '@/lib/utils'
import { RECEIPT_TYPE_LABELS, RECEIPT_STATUS_LABELS, ReceiptType, ReceiptStatus } from '@/types/receipt.types'

export function exportReceiptsToExcel(receipts: Receipt[], filename?: string): void {
  const data = receipts.map(r => ({
    '收款單號': r.receipt_number,
    '訂單編號': r.order_number || '-',
    '團名': r.tour_name || '-',
    '收款日期': formatDate(r.receipt_date),
    '收款方式': RECEIPT_TYPE_LABELS[r.receipt_type as ReceiptType],
    '應收金額': r.receipt_amount,
    '實收金額': r.actual_amount || '-',
    '狀態': RECEIPT_STATUS_LABELS[r.status as ReceiptStatus],
    '經手人': r.handler_name || '-',
    '帳戶資訊': r.account_info || '-',
    '備註': r.note || '-',
    '建立時間': formatDate(r.created_at),
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '收款單列表')

  // 設定欄寬
  worksheet['!cols'] = [
    { wch: 15 }, // 收款單號
    { wch: 15 }, // 訂單編號
    { wch: 30 }, // 團名
    { wch: 12 }, // 收款日期
    { wch: 10 }, // 收款方式
    { wch: 12 }, // 應收金額
    { wch: 12 }, // 實收金額
    { wch: 10 }, // 狀態
    { wch: 12 }, // 經手人
    { wch: 20 }, // 帳戶資訊
    { wch: 30 }, // 備註
    { wch: 18 }, // 建立時間
  ]

  const fileName = filename || `收款單列表_${formatDate(new Date().toISOString())}.xlsx`
  XLSX.writeFile(workbook, fileName)
}
