/**
 * useDisbursementPDF Hook
 * 處理出納單 PDF 生成邏輯
 */

import { logger } from '@/lib/utils/logger'
import { useCallback } from 'react'
import { generateDisbursementPDF } from '@/lib/pdf/disbursement-pdf'
import { usePaymentRequests, usePaymentRequestItems } from '@/data'
import type { DisbursementOrder } from '../types'

export function useDisbursementPDF() {
  // 使用 @/data hooks（SWR 自動載入）
  const { items: paymentRequests } = usePaymentRequests()
  const { items: paymentRequestItems } = usePaymentRequestItems()

  const handlePrintPDF = useCallback(
    async (order: DisbursementOrder) => {
      try {
        // 找出該出納單關聯的所有請款單
        const requestIds = order.payment_request_ids || []
        const relatedRequests = paymentRequests.filter(req =>
          requestIds.includes(req.id)
        )

        // 找出這些請款單的所有項目
        const relatedItems = paymentRequestItems.filter(item =>
          relatedRequests.some(req => req.id === item.request_id)
        )

        if (relatedRequests.length === 0) {
          alert('⚠️ 找不到關聯的請款單資料')
          return
        }

        if (relatedItems.length === 0) {
          alert('⚠️ 找不到請款項目資料')
          return
        }

        // 生成 PDF
        await generateDisbursementPDF({
          order,
          paymentRequests: relatedRequests,
          paymentRequestItems: relatedItems,
        })
      } catch (error) {
        logger.error('生成 PDF 失敗:', error)
        alert('❌ 生成 PDF 失敗，請稍後再試')
      }
    },
    [paymentRequests, paymentRequestItems]
  )

  return { handlePrintPDF }
}
