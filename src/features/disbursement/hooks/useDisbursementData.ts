/**
 * useDisbursementData Hook
 * 處理出納單的數據獲取和操作
 */

import { useMemo } from 'react'
import { PaymentRequest, DisbursementOrder } from '../types'

export function useDisbursementData() {
  // 注意: 暫時使用空資料，等待 payment store 完整實作
  const {
    payment_requests = [],
    disbursement_orders = [],
    addToCurrentDisbursementOrder = () => {},
    removeFromDisbursementOrder = () => {},
    confirmDisbursementOrder = () => {},
    getCurrentWeekDisbursementOrder = () => null,
    getPendingPaymentRequests = () => [],
    getProcessingPaymentRequests = () => [],
    getNextThursday = () => new Date().toLocaleDateString('zh-TW'),
    createDisbursementOrder = () => {},
    generateDisbursementNumber = () => 'DISB-000001',
  } = {} as unknown

  const pendingRequests = useMemo(
    () => (getPendingPaymentRequests ? getPendingPaymentRequests() : []),
    [getPendingPaymentRequests]
  )

  const processingRequests = useMemo(
    () => (getProcessingPaymentRequests ? getProcessingPaymentRequests() : []),
    [getProcessingPaymentRequests]
  )

  const currentOrder = useMemo(
    () => (getCurrentWeekDisbursementOrder ? getCurrentWeekDisbursementOrder() : null),
    [getCurrentWeekDisbursementOrder]
  )

  const nextThursday = useMemo(
    () => (getNextThursday ? getNextThursday() : new Date()),
    [getNextThursday]
  )

  // 獲取本週出帳的請款單詳情
  const currentOrderRequests = useMemo(() => {
    if (!currentOrder) return []
    return currentOrder.payment_request_ids
      .map((id: string) => payment_requests.find((r: PaymentRequest) => r.id === id))
      .filter(Boolean) as PaymentRequest[]
  }, [currentOrder, payment_requests])

  return {
    payment_requests,
    disbursement_orders,
    pendingRequests,
    processingRequests,
    currentOrder,
    currentOrderRequests,
    nextThursday,
    addToCurrentDisbursementOrder,
    removeFromDisbursementOrder,
    confirmDisbursementOrder,
    createDisbursementOrder,
    generateDisbursementNumber,
  }
}
