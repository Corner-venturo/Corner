/**
 * useDisbursementData Hook
 * 處理出納單的數據獲取和操作
 */

import { formatDate } from '@/lib/utils/format-date'
import { useMemo, useCallback, useEffect } from 'react'
import { usePaymentRequestStore, useDisbursementOrderStore, usePaymentRequestItemStore } from '@/stores'
import { PaymentRequest, DisbursementOrder } from '../types'

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
  // 連接真實的 stores
  const {
    items: payment_requests,
    fetchAll: fetchPaymentRequests,
    update: updatePaymentRequest
  } = usePaymentRequestStore()

  const {
    items: disbursement_orders,
    fetchAll: fetchDisbursementOrders,
    create: createOrder,
    update: updateOrder,
    delete: deleteOrder
  } = useDisbursementOrderStore()

  const { items: requestItems, fetchAll: fetchRequestItems } = usePaymentRequestItemStore()

  // 初始化載入資料
  useEffect(() => {
    fetchPaymentRequests()
    fetchDisbursementOrders()
    fetchRequestItems()

  }, [])

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
        const supplierName = item.supplier_name || '無供應商'

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
      const newIds = [...new Set([...currentOrder.payment_request_ids, ...requestIds])]
      const newAmount = payment_requests
        .filter(r => newIds.includes(r.id))
        .reduce((sum, r) => sum + (r.amount || 0), 0)

      await updateOrder(currentOrder.id, {
        payment_request_ids: newIds,
        amount: newAmount,
      })
    } else {
      // 沒有本週出納單，建立新的
      const amount = payment_requests
        .filter(r => requestIds.includes(r.id))
        .reduce((sum, r) => sum + (r.amount || 0), 0)

      const disbursementDateStr = formatDate(nextThursday)

      await createOrder({
        order_number: generateDisbursementNumber(disbursement_orders, disbursementDateStr),
        disbursement_date: disbursementDateStr,
        payment_request_ids: requestIds,
        amount: amount,
        status: 'pending',
      } as Omit<DisbursementOrder, 'id' | 'created_at' | 'updated_at'>)
    }

    // 更新請款單狀態為 processing
    for (const id of requestIds) {
      await updatePaymentRequest(id, { status: 'processing' })
    }
  }, [currentOrder, payment_requests, disbursement_orders, nextThursday, createOrder, updateOrder, updatePaymentRequest])

  // 從出納單移除請款單
  const removeFromDisbursementOrder = useCallback(async (orderId: string, requestId: string) => {
    const order = disbursement_orders.find(o => o.id === orderId)
    if (!order) return

    const newIds = order.payment_request_ids.filter(id => id !== requestId)
    const newAmount = payment_requests
      .filter(r => newIds.includes(r.id))
      .reduce((sum, r) => sum + (r.amount || 0), 0)

    if (newIds.length === 0) {
      // 沒有請款單了，刪除出納單
      await deleteOrder(orderId)
    } else {
      await updateOrder(orderId, {
        payment_request_ids: newIds,
        amount: newAmount,
      })
    }

    // 將請款單狀態改回 pending
    await updatePaymentRequest(requestId, { status: 'pending' })
  }, [disbursement_orders, payment_requests, updateOrder, deleteOrder, updatePaymentRequest])

  // 確認出帳
  const confirmDisbursementOrder = useCallback(async (orderId: string, confirmedBy: string) => {
    const order = disbursement_orders.find(o => o.id === orderId)
    if (!order) return

    await updateOrder(orderId, {
      status: 'confirmed',
      confirmed_by: confirmedBy,
      confirmed_at: new Date().toISOString(),
    })

    // 更新所有請款單狀態為 paid
    for (const requestId of order.payment_request_ids) {
      await updatePaymentRequest(requestId, {
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
    }
  }, [disbursement_orders, updateOrder, updatePaymentRequest])

  // 建立新出納單
  const createDisbursementOrder = useCallback(async (requestIds: string[]) => {
    const amount = payment_requests
      .filter(r => requestIds.includes(r.id))
      .reduce((sum, r) => sum + (r.amount || 0), 0)

    const disbursementDateStr = formatDate(nextThursday)

    await createOrder({
      order_number: generateDisbursementNumber(disbursement_orders, disbursementDateStr),
      disbursement_date: disbursementDateStr,
      payment_request_ids: requestIds,
      amount: amount,
      status: 'pending',
    } as Omit<DisbursementOrder, 'id' | 'created_at' | 'updated_at'>)

    // 更新請款單狀態為 processing
    for (const id of requestIds) {
      await updatePaymentRequest(id, { status: 'processing' })
    }
  }, [payment_requests, disbursement_orders, nextThursday, createOrder, updatePaymentRequest])

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
    createDisbursementOrder,
    generateDisbursementNumber: () => generateDisbursementNumber(disbursement_orders),
  }
}
