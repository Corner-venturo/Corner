/**
 * 請款單 Excel 匯出
 */

import * as XLSX from 'xlsx'
import type { PaymentRequest, PaymentRequestItem } from '@/stores/types'
import { formatDate } from '@/lib/utils'

export function exportPaymentRequestsToExcel(
  requests: PaymentRequest[],
  items: PaymentRequestItem[],
  filename?: string
): void {
  // 請款單摘要
  const summaryData = requests.map(r => ({
    '請款單號': r.request_number,
    '團號': r.code || '-',
    '團名': r.tour_name || '-',
    '請款日期': formatDate(r.request_date),
    '總金額': r.total_amount,
    '項目數': items.filter(i => i.request_id === r.id).length,
    '狀態': r.status || '-',
    '建立時間': formatDate(r.created_at),
  }))

  // 請款項目明細
  const itemsData = items.map(item => ({
    '請款單號': requests.find(r => r.id === item.request_id)?.request_number || '-',
    '項目編號': item.item_number,
    '類別': item.category,
    '供應商': item.supplier_name,
    '說明': item.description || '-',
    '單價': item.unit_price,
    '數量': item.quantity,
    '小計': item.subtotal,
    '備註': item.note || '-',
  }))

  const workbook = XLSX.utils.book_new()

  // 第一張工作表：請款單摘要
  const summarySheet = XLSX.utils.json_to_sheet(summaryData)
  summarySheet['!cols'] = [
    { wch: 15 }, // 請款單號
    { wch: 12 }, // 團號
    { wch: 30 }, // 團名
    { wch: 12 }, // 請款日期
    { wch: 12 }, // 總金額
    { wch: 10 }, // 項目數
    { wch: 10 }, // 狀態
    { wch: 18 }, // 建立時間
  ]
  XLSX.utils.book_append_sheet(workbook, summarySheet, '請款單摘要')

  // 第二張工作表：請款項目明細
  const itemsSheet = XLSX.utils.json_to_sheet(itemsData)
  itemsSheet['!cols'] = [
    { wch: 15 }, // 請款單號
    { wch: 15 }, // 項目編號
    { wch: 10 }, // 類別
    { wch: 20 }, // 供應商
    { wch: 30 }, // 說明
    { wch: 12 }, // 單價
    { wch: 8 },  // 數量
    { wch: 12 }, // 小計
    { wch: 30 }, // 備註
  ]
  XLSX.utils.book_append_sheet(workbook, itemsSheet, '請款項目明細')

  const fileName = filename || `請款單列表_${formatDate(new Date().toISOString())}.xlsx`
  XLSX.writeFile(workbook, fileName)
}
