'use client'

import { getTodayString } from '@/lib/utils/format-date'

import { logger } from '@/lib/utils/logger'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { Tour, Payment } from '@/stores/types'
import { useOrderStore, useReceiptStore } from '@/stores'
import type { Receipt, ReceiptType } from '@/types/receipt.types'
import { useToast } from '@/components/ui/use-toast'
import { useTravelInvoiceStore, TravelInvoiceItem, BuyerInfo } from '@/stores/useTravelInvoiceStore'
import { confirm } from '@/lib/ui/alert-dialog'
import { supabase } from '@/lib/supabase/client'
import { mutate } from 'swr'

interface ReceiptPayment extends Payment {
  method?: string
}

interface UseTourPaymentsProps {
  tour: Tour
  orderFilter?: string
  triggerAdd?: boolean
  onTriggerAddComplete?: () => void
}

export function useTourPayments({
  tour,
  orderFilter,
  triggerAdd,
  onTriggerAddComplete,
}: UseTourPaymentsProps) {
  const { items: orders } = useOrderStore()
  const { items: receipts, create: createReceipt, fetchAll: fetchReceipts } = useReceiptStore()
  const { issueInvoice, isLoading: isInvoiceLoading } = useTravelInvoiceStore()
  const { toast } = useToast()

  // 新增收款 Dialog 狀態
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string>('')
  const [newPayment, setNewPayment] = useState<{
    amount: number
    description: string
    method: string
    status: '已確認' | '待確認'
  }>({
    amount: 0,
    description: '',
    method: 'bank_transfer',
    status: '已確認',
  })

  // 代轉發票 Dialog 狀態
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false)
  const [invoiceOrderId, setInvoiceOrderId] = useState<string>('')
  const [invoiceDate, setInvoiceDate] = useState(getTodayString())
  const [reportStatus, setReportStatus] = useState<'unreported' | 'reported'>('unreported')
  const [invoiceBuyer, setInvoiceBuyer] = useState<BuyerInfo>({
    buyerName: '',
    buyerUBN: '',
    buyerEmail: '',
    buyerMobile: '',
  })
  const [invoiceItems, setInvoiceItems] = useState<TravelInvoiceItem[]>([
    { item_name: '', item_count: 1, item_unit: '式', item_price: 0, itemAmt: 0 },
  ])
  const [invoiceRemark, setInvoiceRemark] = useState('')

  // 監聽外部觸發新增
  useEffect(() => {
    if (triggerAdd) {
      setIsAddDialogOpen(true)
      onTriggerAddComplete?.()
    }
  }, [triggerAdd, onTriggerAddComplete])

  // 獲取屬於這個旅遊團的所有訂單
  const tourOrders = useMemo(() => {
    return orders.filter(order => {
      if (orderFilter) {
        return order.id === orderFilter
      }
      return order.tour_id === tour.id
    })
  }, [orders, orderFilter, tour.id])

  // 從 receipts store 獲取這個團的收款記錄
  const tourPayments = useMemo(() => {
    const tourOrderIds = new Set(tourOrders.map(o => o.id))

    return receipts
      .filter(receipt => {
        if (orderFilter) {
          return receipt.order_id === orderFilter
        }
        return receipt.order_id && tourOrderIds.has(receipt.order_id)
      })
      .map(receipt => ({
        id: receipt.id,
        type: 'receipt' as const,
        tour_id: tour.id,
        order_id: receipt.order_id || undefined,
        amount: receipt.actual_amount,
        description: receipt.note || '',
        status: receipt.status === '1' ? 'confirmed' : 'pending',
        method:
          ['bank_transfer', 'cash', 'credit_card', 'check', 'linkpay'][receipt.receipt_type] ||
          'bank_transfer',
        created_at: receipt.created_at,
      })) as ReceiptPayment[]
  }, [receipts, tourOrders, tour.id, orderFilter])

  // 統計數據計算
  const confirmedPayments = useMemo(() => tourPayments.filter(p => p.status === 'confirmed'), [tourPayments])
  const pendingPayments = useMemo(() => tourPayments.filter(p => p.status === 'pending'), [tourPayments])
  const totalConfirmed = useMemo(() => confirmedPayments.reduce((sum, p) => sum + p.amount, 0), [confirmedPayments])
  const totalPending = useMemo(() => pendingPayments.reduce((sum, p) => sum + p.amount, 0), [pendingPayments])
  const totalPayments = useMemo(() => totalConfirmed + totalPending, [totalConfirmed, totalPending])
  const totalOrderAmount = useMemo(() => tourOrders.reduce((sum, order) => sum + (order.total_amount ?? 0), 0), [tourOrders])
  const remaining_amount = useMemo(() => Math.max(0, totalOrderAmount - totalConfirmed), [totalOrderAmount, totalConfirmed])

  // 更新 tour 的財務欄位
  const updateTourFinancials = useCallback(async () => {
    try {
      // 取得該團所有訂單 ID
      const { data: tourOrdersData } = await supabase
        .from('orders')
        .select('id')
        .eq('tour_id', tour.id)

      if (!tourOrdersData || tourOrdersData.length === 0) return

      const orderIds = tourOrdersData.map(o => o.id)

      // 計算總收款（已確認的收據）
      const { data: receiptsData } = await supabase
        .from('receipts')
        .select('actual_amount, status')
        .in('order_id', orderIds)

      const totalRevenue = (receiptsData || [])
        .filter(r => Number(r.status) === 1) // 已確認
        .reduce((sum, r) => sum + (r.actual_amount || 0), 0)

      // 取得當前成本
      const { data: currentTour } = await supabase
        .from('tours')
        .select('total_cost')
        .eq('id', tour.id)
        .single()

      const totalCost = currentTour?.total_cost || 0
      const profit = totalRevenue - totalCost

      // 更新 tour
      await supabase
        .from('tours')
        .update({
          total_revenue: totalRevenue,
          profit: profit,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tour.id)

      // 刷新 SWR 快取讓 UI 更新
      await mutate(`tour-${tour.id}`)
      await mutate('tours')

      logger.log('Tour 財務數據已更新:', { total_revenue: totalRevenue, profit })
    } catch (error) {
      logger.error('更新 Tour 財務數據失敗:', error)
    }
  }, [tour.id])

  // 新增收款
  const addPayment = async (data: {
    type?: string
    tour_id: string
    order_id?: string
    amount: number
    description: string
    method: string
    status: string
  }) => {
    try {
      const order = data.order_id ? orders.find(o => o.id === data.order_id) : undefined

      const receiptTypeMap: Record<string, ReceiptType> = {
        bank_transfer: 0,
        cash: 1,
        credit_card: 2,
        check: 3,
      }

      const receiptData: Partial<Receipt> = {
        order_id: data.order_id || null,
        order_number: order?.order_number || null,
        tour_name: tour.name || null,
        receipt_date: new Date().toISOString(),
        receipt_type: receiptTypeMap[data.method] || 0,
        receipt_amount: data.amount,
        actual_amount: data.amount,
        status: data.status === '已確認' ? '1' : '0',
        note: data.description,
        receipt_account: order?.contact_person || null,
      }

      await createReceipt(receiptData as Receipt)
      await fetchReceipts()

      // 同步更新 tour 的財務數據
      await updateTourFinancials()

      toast({
        title: '成功',
        description: '收款單建立成功',
      })
    } catch (error) {
      logger.error('建立收款單失敗:', error instanceof Error ? error.message : String(error))
      toast({
        title: '錯誤',
        description: '建立收款單失敗',
        variant: 'destructive',
      })
      throw error
    }
  }

  const handleAddPayment = () => {
    if (!newPayment.amount || !newPayment.description) return

    addPayment({
      type: 'receipt',
      tour_id: tour.id,
      order_id: selectedOrderId || undefined,
      ...newPayment,
    })

    setNewPayment({
      amount: 0,
      description: '',
      method: 'bank_transfer',
      status: '已確認',
    })
    setSelectedOrderId('')
    setIsAddDialogOpen(false)
  }

  // 發票相關函數
  const addInvoiceItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      { item_name: '', item_count: 1, item_unit: '式', item_price: 0, itemAmt: 0 },
    ])
  }

  const removeInvoiceItem = (index: number) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter((_, i) => i !== index))
    }
  }

  const updateInvoiceItem = (index: number, field: keyof TravelInvoiceItem, value: unknown) => {
    const newItems = [...invoiceItems]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'item_price' || field === 'item_count') {
      const price = Number(field === 'item_price' ? value : newItems[index].item_price)
      const count = Number(field === 'item_count' ? value : newItems[index].item_count)
      newItems[index].itemAmt = price * count
    }
    setInvoiceItems(newItems)
  }

  const invoiceTotal = useMemo(() => invoiceItems.reduce((sum, item) => sum + item.itemAmt, 0), [invoiceItems])

  const openInvoiceDialog = (orderId?: string) => {
    if (orderId) {
      const order = tourOrders.find(o => o.id === orderId)
      if (order) {
        setInvoiceBuyer({
          buyerName: order.contact_person || '',
          buyerUBN: '',
          buyerEmail: '',
          buyerMobile: order.contact_phone || '',
        })
        setInvoiceOrderId(orderId)
      }
    } else {
      setInvoiceOrderId('')
    }
    setIsInvoiceDialogOpen(true)
  }

  const handleIssueInvoice = async () => {
    if (!invoiceBuyer.buyerName) {
      toast({ title: '錯誤', description: '請輸入買受人名稱', variant: 'destructive' })
      return
    }
    if (invoiceItems.some(item => !item.item_name || item.item_price <= 0)) {
      toast({ title: '錯誤', description: '請完整填寫商品資訊', variant: 'destructive' })
      return
    }

    if (invoiceOrderId) {
      const order = tourOrders.find(o => o.id === invoiceOrderId)
      if (order && invoiceTotal > (order.paid_amount ?? 0)) {
        const confirmed = await confirm(
          `發票金額 NT$ ${invoiceTotal.toLocaleString()} 超過已收款金額 NT$ ${(order.paid_amount ?? 0).toLocaleString()}，確定要開立嗎？`,
          { title: '金額超開提醒', type: 'warning' }
        )
        if (!confirmed) return
      }
    }

    try {
      await issueInvoice({
        invoice_date: invoiceDate,
        total_amount: invoiceTotal,
        tax_type: 'dutiable',
        buyerInfo: invoiceBuyer,
        items: invoiceItems,
        order_id: invoiceOrderId || undefined,
        tour_id: tour.id,
        created_by: 'current_user',
      })
      toast({ title: '成功', description: '代轉發票開立成功' })
      setIsInvoiceDialogOpen(false)
      setInvoiceBuyer({ buyerName: '', buyerUBN: '', buyerEmail: '', buyerMobile: '' })
      setInvoiceItems([{ item_name: '', item_count: 1, item_unit: '式', item_price: 0, itemAmt: 0 }])
      setInvoiceRemark('')
    } catch (error) {
      toast({
        title: '錯誤',
        description: error instanceof Error ? error.message : '開立發票失敗',
        variant: 'destructive',
      })
    }
  }

  return {
    // 資料
    tourOrders,
    tourPayments,

    // 統計
    confirmedPayments,
    pendingPayments,
    totalConfirmed,
    totalPending,
    totalPayments,
    totalOrderAmount,
    remaining_amount,

    // 新增收款對話框狀態
    isAddDialogOpen,
    setIsAddDialogOpen,
    selectedOrderId,
    setSelectedOrderId,
    newPayment,
    setNewPayment,
    handleAddPayment,

    // 發票對話框狀態
    isInvoiceDialogOpen,
    setIsInvoiceDialogOpen,
    invoiceOrderId,
    setInvoiceOrderId,
    invoiceDate,
    setInvoiceDate,
    reportStatus,
    setReportStatus,
    invoiceBuyer,
    setInvoiceBuyer,
    invoiceItems,
    setInvoiceItems,
    invoiceRemark,
    setInvoiceRemark,
    invoiceTotal,
    isInvoiceLoading,

    // 發票相關函數
    addInvoiceItem,
    removeInvoiceItem,
    updateInvoiceItem,
    openInvoiceDialog,
    handleIssueInvoice,
  }
}
