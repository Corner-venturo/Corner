'use client'

import { useState, useEffect, useMemo } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { useTravelInvoiceStore, TravelInvoiceItem, BuyerInfo } from '@/stores/useTravelInvoiceStore'
import { useOrderStore, useTourStore } from '@/stores'
import type { Order } from '@/types/order.types'
import type { Tour } from '@/types/tour.types'
import { confirm } from '@/lib/ui/alert-dialog'
import { ComboboxOption } from '@/components/ui/combobox'

interface UseInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultOrderId?: string
  defaultTourId?: string
  fixedOrder?: Order
  fixedTour?: Tour
}

export function useInvoiceDialog({
  open,
  onOpenChange,
  defaultOrderId,
  defaultTourId,
  fixedOrder,
  fixedTour,
}: UseInvoiceDialogProps) {
  const { toast } = useToast()
  const { issueInvoice, invoices, isLoading, fetchInvoices } = useTravelInvoiceStore()
  const { items: allOrders, fetchAll: fetchOrders, loading: ordersLoading } = useOrderStore()
  const { items: allTours, fetchAll: fetchTours, loading: toursLoading } = useTourStore()

  const [dataLoaded, setDataLoaded] = useState(false)
  const [selectedTourId, setSelectedTourId] = useState<string>(defaultTourId || '')
  const [selectedOrderId, setSelectedOrderId] = useState<string>(defaultOrderId || '')
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [reportStatus, setReportStatus] = useState<'unreported' | 'reported'>('unreported')
  const [customNo, setCustomNo] = useState('')
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    buyerName: '',
    buyerUBN: '',
    buyerEmail: '',
    buyerMobile: '',
  })
  const [items, setItems] = useState<TravelInvoiceItem[]>([
    { item_name: '', item_count: 1, item_unit: '式', item_price: 0, itemAmt: 0 },
  ])
  const [remark, setRemark] = useState('')

  // 計算自訂編號
  const generateCustomNo = (orderId: string, orderNumber: string) => {
    const existingCount = invoices.filter(inv => inv.order_id === orderId).length
    return `${orderNumber}-${existingCount + 1}`
  }

  // 載入資料
  useEffect(() => {
    if (open) {
      setDataLoaded(false)
      Promise.all([fetchTours(), fetchOrders(), fetchInvoices()]).then(() => {
        setDataLoaded(true)
      })
    }
  }, [open, fetchTours, fetchOrders, fetchInvoices])

  // 當選擇訂單時，自動帶入資料
  useEffect(() => {
    if (fixedOrder) {
      setBuyerInfo({
        buyerName: fixedOrder.contact_person || '',
        buyerUBN: '',
        buyerEmail: '',
        buyerMobile: fixedOrder.contact_phone || '',
      })
      setCustomNo(generateCustomNo(fixedOrder.id, fixedOrder.order_number || ''))
    } else if (selectedOrderId) {
      const order = allOrders.find(o => o.id === selectedOrderId)
      if (order) {
        setBuyerInfo({
          buyerName: order.contact_person || '',
          buyerUBN: '',
          buyerEmail: '',
          buyerMobile: order.contact_phone || '',
        })
        setCustomNo(generateCustomNo(order.id, order.order_number ?? ''))
      }
    }
  }, [selectedOrderId, fixedOrder, allOrders, invoices])

  // 重置表單
  useEffect(() => {
    if (open) {
      setSelectedTourId(defaultTourId || fixedTour?.id || '')
      setSelectedOrderId(defaultOrderId || fixedOrder?.id || '')
      setInvoiceDate(new Date().toISOString().split('T')[0])
      setReportStatus('unreported')
      setRemark('')
      setItems([{ item_name: '', item_count: 1, item_unit: '式', item_price: 0, itemAmt: 0 }])

      if (fixedOrder) {
        setBuyerInfo({
          buyerName: fixedOrder.contact_person || '',
          buyerUBN: '',
          buyerEmail: '',
          buyerMobile: fixedOrder.contact_phone || '',
        })
        setCustomNo(generateCustomNo(fixedOrder.id, fixedOrder.order_number || ''))
      } else {
        setBuyerInfo({ buyerName: '', buyerUBN: '', buyerEmail: '', buyerMobile: '' })
        setCustomNo('')
      }
    }
  }, [open, defaultTourId, defaultOrderId, fixedTour, fixedOrder])

  // 篩選該團的訂單
  const tourOrders = useMemo(() => {
    if (fixedTour) return allOrders.filter(o => o.tour_id === fixedTour.id)
    if (selectedTourId) return allOrders.filter(o => o.tour_id === selectedTourId)
    return []
  }, [selectedTourId, fixedTour, allOrders])

  // 取得當前訂單
  const currentOrder = useMemo(() => {
    if (fixedOrder) return fixedOrder
    return allOrders.find(o => o.id === selectedOrderId)
  }, [fixedOrder, selectedOrderId, allOrders])

  // 團選項
  const tourOptions: ComboboxOption[] = useMemo(() => {
    return allTours.map(tour => ({
      value: tour.id,
      label: `${tour.code} - ${tour.name}`,
    }))
  }, [allTours])

  // 訂單選項
  const orderOptions: ComboboxOption[] = useMemo(() => {
    return tourOrders.map(order => ({
      value: order.id,
      label: `${order.order_number} - ${order.contact_person}`,
    }))
  }, [tourOrders])

  // 商品明細操作
  const addItem = () => {
    setItems([...items, { item_name: '', item_count: 1, item_unit: '式', item_price: 0, itemAmt: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof TravelInvoiceItem, value: unknown) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'item_price' || field === 'item_count') {
      const price = Number(field === 'item_price' ? value : newItems[index].item_price)
      const count = Number(field === 'item_count' ? value : newItems[index].item_count)
      newItems[index].itemAmt = price * count
    }
    setItems(newItems)
  }

  const totalAmount = items.reduce((sum, item) => sum + item.itemAmt, 0)

  // 開立發票
  const handleSubmit = async () => {
    if (!buyerInfo.buyerName) {
      toast({ title: '錯誤', description: '請輸入買受人名稱', variant: 'destructive' })
      return
    }
    if (items.some(item => !item.item_name || item.item_price <= 0)) {
      toast({ title: '錯誤', description: '請完整填寫商品資訊', variant: 'destructive' })
      return
    }

    const orderId = fixedOrder?.id || selectedOrderId
    const tourId = fixedTour?.id || selectedTourId

    // 檢查超開提醒
    if (currentOrder && totalAmount > (currentOrder.paid_amount ?? 0)) {
      const confirmed = await confirm(
        `發票金額 NT$ ${totalAmount.toLocaleString()} 超過已收款金額 NT$ ${(currentOrder.paid_amount ?? 0).toLocaleString()}，確定要開立嗎？`,
        { title: '金額超開提醒', type: 'warning' }
      )
      if (!confirmed) return
    }

    try {
      await issueInvoice({
        invoice_date: invoiceDate,
        total_amount: totalAmount,
        tax_type: 'dutiable',
        buyerInfo,
        items,
        order_id: orderId || undefined,
        tour_id: tourId || undefined,
        created_by: 'current_user',
      })
      toast({ title: '成功', description: `代轉發票 ${customNo} 開立成功` })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: '錯誤',
        description: error instanceof Error ? error.message : '開立發票失敗',
        variant: 'destructive',
      })
    }
  }

  return {
    // State
    dataLoaded,
    selectedTourId,
    selectedOrderId,
    invoiceDate,
    reportStatus,
    customNo,
    buyerInfo,
    items,
    remark,
    totalAmount,
    currentOrder,
    // Options
    tourOptions,
    orderOptions,
    // Loading
    isLoading,
    ordersLoading,
    toursLoading,
    // Setters
    setSelectedTourId,
    setSelectedOrderId,
    setInvoiceDate,
    setReportStatus,
    setCustomNo,
    setBuyerInfo,
    setRemark,
    // Actions
    addItem,
    removeItem,
    updateItem,
    handleSubmit,
  }
}
