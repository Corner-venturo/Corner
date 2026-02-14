'use client'

import { useEffect, useState, useCallback } from 'react'
import { Tour, Order } from '@/stores/types'
import { supabase } from '@/lib/supabase/client'
import { SimpleOrderTable } from '@/features/orders/components/simple-order-table'
import { AddReceiptDialog } from '@/features/finance/payments'
import dynamic from 'next/dynamic'

const AddRequestDialog = dynamic(() => import('@/features/finance/requests/components/AddRequestDialog').then(m => m.AddRequestDialog), { ssr: false })
import { InvoiceDialog } from '@/components/finance/invoice-dialog'
import type { Order as OrderType } from '@/types/order.types'
import { logger } from '@/lib/utils/logger'
import { COMP_TOURS_LABELS, TOUR_ORDERS_LABELS } from '../constants/labels'

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

  // 發票對話框狀態
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null)

  // 注意：已移除 onChildDialogChange 邏輯，改用 Dialog level 系統處理多重遮罩

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
        logger.error(COMP_TOURS_LABELS.載入訂單失敗, err)
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

  // 處理開發票
  const handleQuickInvoice = useCallback((order: Order) => {
    setSelectedOrderForInvoice(order)
    setInvoiceDialogOpen(true)
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
        <div className="text-morandi-secondary">{TOUR_ORDERS_LABELS.載入中}</div>
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
        onQuickInvoice={handleQuickInvoice}
      />

      {/* 收款對話框 */}
      <AddReceiptDialog
        open={receiptDialogOpen}
        onOpenChange={setReceiptDialogOpen}
        defaultTourId={tour.id}
        defaultOrderId={selectedOrderForReceipt?.id}
        onSuccess={handleReceiptSuccess}
      />

      {/* 請款對話框 */}
      <AddRequestDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        defaultTourId={tour.id}
        defaultOrderId={selectedOrderForRequest?.id}
        onSuccess={handleRequestSuccess}
      />

      {/* 發票對話框 */}
      <InvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={open => {
          setInvoiceDialogOpen(open)
          if (!open) handleReceiptSuccess()
        }}
        defaultOrderId={selectedOrderForInvoice?.id}
        defaultTourId={tour.id}
      />
    </>
  )
}
