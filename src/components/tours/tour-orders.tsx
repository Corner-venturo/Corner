'use client'

import { useEffect, useState, useCallback } from 'react'
import { Tour, Order } from '@/stores/types'
import { supabase } from '@/lib/supabase/client'
import { SimpleOrderTable } from '@/components/orders/simple-order-table'
import { AddReceiptDialog } from '@/features/finance/payments'
import { AddRequestDialog } from '@/features/finance/requests/components/AddRequestDialog'
import type { Order as OrderType } from '@/types/order.types'
import { logger } from '@/lib/utils/logger'

interface TourOrdersProps {
  tour: Tour
  onChildDialogChange?: (hasOpen: boolean) => void
}

export function TourOrders({ tour, onChildDialogChange }: TourOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // 收款對話框狀態
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<Order | null>(null)

  // 請款對話框狀態
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [selectedOrderForRequest, setSelectedOrderForRequest] = useState<Order | null>(null)

  // 通知父組件有子 Dialog 開啟（避免多重遮罩）
  useEffect(() => {
    onChildDialogChange?.(receiptDialogOpen || requestDialogOpen)
  }, [receiptDialogOpen, requestDialogOpen, onChildDialogChange])

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('tour_id', tour.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setOrders((data || []) as Order[])
      } catch (err) {
        logger.error('載入訂單失敗:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [tour.id])

  // 處理快速收款
  const handleQuickReceipt = useCallback((order: Order) => {
    setSelectedOrderForReceipt(order)
    setReceiptDialogOpen(true)
  }, [])

  // 處理快速請款
  const handleQuickPaymentRequest = useCallback((order: Order) => {
    setSelectedOrderForRequest(order)
    setRequestDialogOpen(true)
  }, [])

  // 收款成功後重新載入訂單
  const handleReceiptSuccess = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('tour_id', tour.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setOrders(data as Order[])
    }
  }, [tour.id])

  // 請款成功後的處理（目前不需要重新載入訂單，但保留以便未來擴展）
  const handleRequestSuccess = useCallback(() => {
    // 請款不影響訂單狀態，無需重新載入
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-morandi-secondary">載入中...</div>
      </div>
    )
  }

  return (
    <>
      <SimpleOrderTable
        orders={orders as OrderType[]}
        showTourInfo={false}
        onQuickReceipt={handleQuickReceipt}
        onQuickPaymentRequest={handleQuickPaymentRequest}
      />

      {/* 收款對話框 */}
      <AddReceiptDialog
        open={receiptDialogOpen}
        onOpenChange={setReceiptDialogOpen}
        defaultTourId={tour.id}
        defaultOrderId={selectedOrderForReceipt?.id}
        onSuccess={handleReceiptSuccess}
        nested
      />

      {/* 請款對話框 */}
      <AddRequestDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        defaultTourId={tour.id}
        defaultOrderId={selectedOrderForRequest?.id}
        onSuccess={handleRequestSuccess}
        nested
      />
    </>
  )
}
