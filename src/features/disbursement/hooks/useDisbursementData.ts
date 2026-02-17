/**
 * useDisbursementData Hook
 * 處理出納單的數據獲取和操作
 */

import { formatDate } from '@/lib/utils/format-date'
import { useMemo, useCallback } from 'react'
import {
  usePaymentRequests,
  useDisbursementOrders,
  usePaymentRequestItems,
  updatePaymentRequest as updatePaymentRequestApi,
  createDisbursementOrder as createDisbursementOrderApi,
  updateDisbursementOrder as updateDisbursementOrderApi,
  deleteDisbursementOrder as deleteDisbursementOrderApi,
} from '@/data'
import { PaymentRequest, DisbursementOrder } from '../types'
import { DISBURSEMENT_LABELS } from '../constants/labels'
import { recalculateExpenseStats } from '@/features/finance/payments/services/expense-core.service'

// 計算下一個週四
function getNextThursday(): Date {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7 // 如果今天是週四，取下週四
  const nextThursday = new Date(today)
  nextThursday.setDate(today.getDate() + daysUntilThursday)
  return nextThursday
}

// 生成出納單號: P + YYMMDD + A-Z
// 例如: P250128A, P250128B, ...
function generateDisbursementNumber(existingOrders: DisbursementOrder[], disbursementDate?: string): string {
  const date = disbursementDate ? new Date(disbursementDate) : new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const datePrefix = `P${year}${month}${day}`

  // 找到同日期的最大字母
  let maxLetter = ''
  existingOrders.forEach(order => {
    const orderNum = order.order_number
    if (orderNum?.startsWith(datePrefix)) {
      const lastChar = orderNum.slice(-1)
      if (/^[A-Z]$/.test(lastChar) && lastChar > maxLetter) {
        maxLetter = lastChar
      }
    }
  })

  // 計算下一個字母
  const nextLetter = maxLetter ? String.fromCharCode(maxLetter.charCodeAt(0) + 1) : 'A'
  return `${datePrefix}${nextLetter}`
}

export function useDisbursementData() {
  // 使用 @/data hooks（SWR 自動載入，不需手動 fetchAll）
  const { items: payment_requests } = usePaymentRequests()
  const { items: disbursement_orders } = useDisbursementOrders()
  const { items: requestItems } = usePaymentRequestItems()

  // 🔧 優化：建立 Map 避免 N+1 查詢
  const paymentRequestMap = useMemo(() => {
    const map = new Map<string, typeof payment_requests[0]>()
    payment_requests.forEach(r => map.set(r.id, r))
    return map
  }, [payment_requests])

  // 🔧 優化：按 request_id 分組 items，避免重複 filter
  const requestItemsByRequestId = useMemo(() => {
    const map = new Map<string, typeof requestItems>()
    requestItems.forEach(item => {
      const id = item.request_id
      if (!map.has(id)) {
        map.set(id, [])
      }
      map.get(id)!.push(item)
    })
    return map
  }, [requestItems])

  // 待出帳的請款單 (status = pending 或 approved)
  const pendingRequests = useMemo(
    () => payment_requests.filter(r => r.status === 'pending' || r.status === 'approved'),
    [payment_requests]
  )

  // 處理中的請款單 (status = processing)
  const processingRequests = useMemo(
    () => payment_requests.filter(r => r.status === 'processing'),
    [payment_requests]
  )

  // 本週的出納單 (status = pending)
  const currentOrder = useMemo(() => {
    return disbursement_orders.find(o => o.status === 'pending') || null
  }, [disbursement_orders])

  // 下一個週四日期
  const nextThursday = useMemo(() => getNextThursday(), [])

  // 本週出帳的請款單詳情 - 使用 Map 做 O(1) 查詢
  const currentOrderRequests = useMemo(() => {
    if (!currentOrder || !currentOrder.payment_request_ids) return []
    return currentOrder.payment_request_ids
      .map(id => paymentRequestMap.get(id))
      .filter(Boolean) as PaymentRequest[]
  }, [currentOrder, paymentRequestMap])

  // 按供應商分組的請款項目 - 使用 Map 做 O(1) 查詢
  const groupedBySupplier = useMemo(() => {
    const groups: Record<string, {
      supplier_id: string
      supplier_name: string
      items: Array<{
        request: PaymentRequest
        item: typeof requestItems[0]
      }>
      total: number
    }> = {}

    // 遍歷待出帳的請款單，使用 Map 取得 items
    pendingRequests.forEach(request => {
      const items = requestItemsByRequestId.get(request.id) || []
      items.forEach(item => {
        const supplierId = item.supplier_id || 'unknown'
        const supplierName = item.supplier_name || DISBURSEMENT_LABELS.無供應商

        if (!groups[supplierId]) {
          groups[supplierId] = {
            supplier_id: supplierId,
            supplier_name: supplierName,
            items: [],
            total: 0,
          }
        }

        groups[supplierId].items.push({ request, item })
        groups[supplierId].total += item.subtotal || 0
      })
    })

    return Object.values(groups).sort((a, b) => b.total - a.total)
  }, [pendingRequests, requestItemsByRequestId])

  // 加入本週出帳
  const addToCurrentDisbursementOrder = useCallback(async (requestIds: string[]) => {
    if (currentOrder) {
      // 已有本週出納單，更新它
      const existingIds = currentOrder.payment_request_ids || []
      const newIds = [...new Set([...existingIds, ...requestIds])]
      const newAmount = payment_requests
        .filter(r => newIds.includes(r.id))
        .reduce((sum, r) => sum + (r.amount || 0), 0)

      await updateDisbursementOrderApi(currentOrder.id, {
        payment_request_ids: newIds,
        amount: newAmount,
      })
    } else {
      // 沒有本週出納單，建立新的
      const amount = payment_requests
        .filter(r => requestIds.includes(r.id))
        .reduce((sum, r) => sum + (r.amount || 0), 0)

      const disbursementDateStr = formatDate(nextThursday)

      await createDisbursementOrderApi({
        order_number: generateDisbursementNumber(disbursement_orders, disbursementDateStr),
        disbursement_date: disbursementDateStr,
        payment_request_ids: requestIds,
        amount: amount,
        status: 'pending',
      })
    }

    // 更新請款單狀態為 processing
    for (const id of requestIds) {
      await updatePaymentRequestApi(id, { status: 'processing' })
    }
  }, [currentOrder, payment_requests, disbursement_orders, nextThursday])

  // 從出納單移除請款單
  const removeFromDisbursementOrder = useCallback(async (orderId: string, requestId: string) => {
    const order = disbursement_orders.find(o => o.id === orderId)
    if (!order) return

    const existingIds = order.payment_request_ids || []
    const newIds = existingIds.filter(id => id !== requestId)
    const newAmount = payment_requests
      .filter(r => newIds.includes(r.id))
      .reduce((sum, r) => sum + (r.amount || 0), 0)

    if (newIds.length === 0) {
      // 沒有請款單了，刪除出納單
      await deleteDisbursementOrderApi(orderId)
    } else {
      await updateDisbursementOrderApi(orderId, {
        payment_request_ids: newIds,
        amount: newAmount,
      })
    }

    // 將請款單狀態改回 pending
    await updatePaymentRequestApi(requestId, { status: 'pending' })

    // 重算團成本
    const request = payment_requests.find(r => r.id === requestId)
    if (request?.tour_id) {
      await recalculateExpenseStats(request.tour_id)
    }
  }, [disbursement_orders, payment_requests])

  // 確認出帳
  const confirmDisbursementOrder = useCallback(async (orderId: string, confirmedBy: string) => {
    const order = disbursement_orders.find(o => o.id === orderId)
    if (!order) return

    await updateDisbursementOrderApi(orderId, {
      status: 'confirmed',
      confirmed_by: confirmedBy,
      confirmed_at: new Date().toISOString(),
    })

    // 更新所有請款單狀態為 paid
    const requestIds = order.payment_request_ids || []
    const tour_ids_to_recalculate = new Set<string>()

    for (const requestId of requestIds) {
      await updatePaymentRequestApi(requestId, {
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      const request = payment_requests.find(r => r.id === requestId)
      if (request?.tour_id) {
        tour_ids_to_recalculate.add(request.tour_id)
      }
    }

    // 重算相關團的成本
    for (const tour_id of tour_ids_to_recalculate) {
      await recalculateExpenseStats(tour_id)
    }
  }, [disbursement_orders, payment_requests])

  // 建立新出納單
  const createNewDisbursementOrder = useCallback(async (requestIds: string[]) => {
    const amount = payment_requests
      .filter(r => requestIds.includes(r.id))
      .reduce((sum, r) => sum + (r.amount || 0), 0)

    const disbursementDateStr = formatDate(nextThursday)

    await createDisbursementOrderApi({
      order_number: generateDisbursementNumber(disbursement_orders, disbursementDateStr),
      disbursement_date: disbursementDateStr,
      payment_request_ids: requestIds,
      amount: amount,
      status: 'pending',
    })

    // 更新請款單狀態為 processing
    const tour_ids_to_recalculate = new Set<string>()
    for (const id of requestIds) {
      await updatePaymentRequestApi(id, { status: 'processing' })
      const request = payment_requests.find(r => r.id === id)
      if (request?.tour_id) {
        tour_ids_to_recalculate.add(request.tour_id)
      }
    }

    // 重算相關團的成本（processing 不計入成本）
    for (const tour_id of tour_ids_to_recalculate) {
      await recalculateExpenseStats(tour_id)
    }
  }, [payment_requests, disbursement_orders, nextThursday])

  return {
    payment_requests,
    disbursement_orders,
    pendingRequests,
    processingRequests,
    currentOrder,
    currentOrderRequests,
    nextThursday,
    groupedBySupplier, // 新增: 按供應商分組
    addToCurrentDisbursementOrder,
    removeFromDisbursementOrder,
    confirmDisbursementOrder,
    createDisbursementOrder: createNewDisbursementOrder,
    generateDisbursementNumber: () => generateDisbursementNumber(disbursement_orders),
  }
}
