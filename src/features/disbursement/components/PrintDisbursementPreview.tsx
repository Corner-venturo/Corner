/**
 * PrintDisbursementPreview
 * 出納單列印預覽組件
 *
 * 配合 cornerERP 舊版設計：
 * - 橫向 (landscape) A4 格式
 * - 按「付款對象 (供應商)」分組
 * - 跨請款單合併同一供應商
 * - 欄位: 付款對象 | 請款編號 | 請款人員 | 團名 | 項目 | 應付金額 | 小計
 * - 自動分頁處理
 */

'use client'

import React, { forwardRef, useMemo } from 'react'
import type { DisbursementOrder, PaymentRequest, PaymentRequestItem } from '@/stores/types'
import { formatDate } from '@/lib/utils'
import styles from './PrintDisbursementPreview.module.css'

interface PrintDisbursementPreviewProps {
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
 * 處理請款項目，轉換為出納單格式
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
 * 按付款對象分組（跨請款單合併同一供應商）
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
 * 分割大型群組（超過 maxSize 行分割）
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

export const PrintDisbursementPreview = forwardRef<HTMLDivElement, PrintDisbursementPreviewProps>(
  function PrintDisbursementPreview({ order, paymentRequests, paymentRequestItems }, ref) {
    const processedItems = useMemo(
      () => processItems(paymentRequests, paymentRequestItems),
      [paymentRequests, paymentRequestItems]
    )

    const payForGroups = useMemo(
      () => splitLargeGroups(groupByPayFor(processedItems)),
      [processedItems]
    )

    const totalAmount = order.amount || order.total_amount || 0

    return (
      <div ref={ref} id="disbursement-print-container" className={styles.printPreview}>
        {/* 列印樣式已在 globals.css 中定義 */}

        {/* 標題區 */}
        <div className={styles.header}>
          <h1 className={styles.title}>出納單號 {order.order_number || '-'}</h1>
          <p className={styles.date}>出帳日期: {order.disbursement_date ? formatDate(order.disbursement_date) : '-'}</p>
        </div>

        {/* 主表格 */}
        <table className={styles.table}>
          <colgroup><col style={{ width: '14%' }} /><col style={{ width: '12%' }} /><col style={{ width: '10%' }} /><col style={{ width: '18%' }} /><col style={{ width: '22%' }} /><col style={{ width: '12%' }} /><col style={{ width: '12%' }} /></colgroup>
          <thead>
            <tr>
              <th>付款對象</th>
              <th>請款編號</th>
              <th>請款人員</th>
              <th>團名</th>
              <th>項目</th>
              <th style={{ textAlign: 'right' }}>應付金額</th>
              <th style={{ textAlign: 'right' }}>小計</th>
            </tr>
          </thead>
          <tbody>
            {payForGroups.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  無請款項目資料
                </td>
              </tr>
            ) : (
              payForGroups.map((group, groupIdx) =>
                group.items.map((item, itemIdx) => (
                  <tr key={`${groupIdx}-${itemIdx}`}>
                    {itemIdx === 0 && (
                      <td rowSpan={group.items.length} className={styles.payFor}>
                        {group.payFor}
                      </td>
                    )}
                    <td>{item.requestCode}</td>
                    <td>{item.createdBy}</td>
                    <td className={styles.tourName}>{item.tourName}</td>
                    <td>{item.description}</td>
                    <td className={styles.amount}>{item.amount.toLocaleString()}</td>
                    {itemIdx === 0 && (
                      <td rowSpan={group.items.length} className={styles.subtotal}>
                        {group.hiddenTotal ? '' : group.total.toLocaleString()}
                      </td>
                    )}
                  </tr>
                ))
              )
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className={styles.totalLabel}>TOTAL</td>
              <td colSpan={2} className={styles.totalAmount}>{totalAmount.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        {/* 頁尾 */}
        <div className={styles.footer}>
          <p>─ 如果可以，讓我們一起探索世界的每個角落 ─</p>
          <p>Generated on {formatDate(new Date().toISOString())} | Venturo ERP</p>
        </div>
      </div>
    )
  }
)

export default PrintDisbursementPreview
