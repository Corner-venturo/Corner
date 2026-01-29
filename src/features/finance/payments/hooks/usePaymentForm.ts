/**
 * Payment Form Hook
 * 收款表單狀態管理
 */

import { getTodayString } from '@/lib/utils/format-date'
import { useState, useCallback, useMemo } from 'react'
import { useToursSlim, useOrdersSlim } from '@/data'
import type { PaymentFormData, PaymentItem } from '../types'
import { RECEIPT_TYPES } from '../types'

export function usePaymentForm() {
  const { items: tours } = useToursSlim()
  const { items: orders } = useOrdersSlim()

  // 基本表單資料
  const [formData, setFormData] = useState<PaymentFormData>({
    tour_id: '',
    order_id: '',
    receipt_date: getTodayString(),
  })

  // 收款項目列表
  const [paymentItems, setPaymentItems] = useState<PaymentItem[]>([
    {
      id: '1',
      receipt_type: RECEIPT_TYPES.BANK_TRANSFER,
      amount: 0,
      transaction_date: getTodayString(),
    },
  ])

  // 根據選中的團體過濾訂單
  const filteredOrders = useMemo(() => {
    if (!formData.tour_id) return []
    return orders.filter(order => order.tour_id === formData.tour_id)
  }, [orders, formData.tour_id])

  // 選中的訂單
  const selectedOrder = useMemo(() => {
    return orders.find(order => order.id === formData.order_id)
  }, [orders, formData.order_id])

  // 計算總金額
  const totalAmount = useMemo(() => {
    return paymentItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  }, [paymentItems])

  // 新增收款項目
  const addPaymentItem = useCallback(() => {
    const newItem: PaymentItem = {
      id: Date.now().toString(),
      receipt_type: RECEIPT_TYPES.BANK_TRANSFER,
      amount: 0,
      transaction_date: getTodayString(),
    }
    setPaymentItems(prev => [...prev, newItem])
  }, [])

  // 移除收款項目
  const removePaymentItem = useCallback((id: string) => {
    setPaymentItems(prev => {
      if (prev.length <= 1) return prev
      return prev.filter(item => item.id !== id)
    })
  }, [])

  // 更新收款項目
  const updatePaymentItem = useCallback((id: string, updates: Partial<PaymentItem>) => {
    setPaymentItems(prev => prev.map(item => (item.id === id ? { ...item, ...updates } : item)))
  }, [])

  // 重置表單
  const resetForm = useCallback(() => {
    setFormData({
      tour_id: '',
      order_id: '',
      receipt_date: getTodayString(),
    })
    setPaymentItems([
      {
        id: '1',
        receipt_type: RECEIPT_TYPES.BANK_TRANSFER,
        amount: 0,
        transaction_date: getTodayString(),
      },
    ])
  }, [])

  // 表單驗證
  const validateForm = useCallback(() => {
    const errors: string[] = []

    if (!formData.tour_id) {
      errors.push('請選擇團體')
    }

    if (!formData.order_id) {
      errors.push('請選擇訂單')
    }

    if (paymentItems.length === 0) {
      errors.push('至少需要一個收款項目')
    }

    if (totalAmount <= 0) {
      errors.push('總收款金額必須大於 0')
    }

    // 驗證每個收款項目
    paymentItems.forEach((item, index) => {
      if (!item.amount || item.amount <= 0) {
        errors.push(`收款項目 ${index + 1}: 金額必須大於 0`)
      }

      if (!item.transaction_date) {
        errors.push(`收款項目 ${index + 1}: 請選擇交易日期`)
      }

      // LinkPay 專屬驗證
      if (item.receipt_type === RECEIPT_TYPES.LINK_PAY) {
        if (!item.email) {
          errors.push(`收款項目 ${index + 1}: LinkPay 需要 Email`)
        }
        if (!item.pay_dateline) {
          errors.push(`收款項目 ${index + 1}: LinkPay 需要付款截止日`)
        }
      }

      // 匯款專屬驗證（已簡化，不需要額外欄位）
    })

    return errors
  }, [formData, paymentItems, totalAmount])

  return {
    // 資料
    tours,
    orders,
    formData,
    paymentItems,
    filteredOrders,
    selectedOrder,
    totalAmount,

    // 操作
    setFormData,
    setPaymentItems,
    addPaymentItem,
    removePaymentItem,
    updatePaymentItem,
    resetForm,
    validateForm,
  }
}
