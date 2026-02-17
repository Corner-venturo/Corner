'use client'

import { LABELS } from './constants/labels'

import React, { useState, useEffect, useMemo } from 'react'
import { ContentPageLayout } from '@/components/layout/content-page-layout'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { QuickReceipt } from '@/features/todos/components/quick-actions/quick-receipt'
import { useOrdersListSlim, useToursListSlim } from '@/hooks/useListSlim'
import { useWorkspaceChannels } from '@/stores/workspace-store'
import { ShoppingCart, AlertCircle, CheckCircle, Clock, Shield, Wifi } from 'lucide-react'
import { SimpleOrderTable } from '@/features/orders/components/simple-order-table'
import { AddOrderForm } from '@/features/orders/components/add-order-form'
import { OrderEditDialog } from '@/features/orders/components/order-edit-dialog'
import { InvoiceDialog } from '@/features/finance/components/invoice-dialog'
import { BatchVisaDialog } from '@/features/orders/components/BatchVisaDialog'
import type { Order } from '@/stores/types'
import { logger } from '@/lib/utils/logger'
import { alert as showAlert } from '@/lib/ui/alert-dialog'

export default function OrdersPage() {
  const { items: orders, create: addOrder } = useOrdersListSlim()
  const { items: tours } = useToursListSlim()
  const { currentWorkspace, loadWorkspaces } = useWorkspaceChannels()
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // 🔥 快速收款對話框狀態
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false)
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<{
    orderId: string
    tourId: string
  } | null>(null)

  // 發票對話框狀態
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false)
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null)

  // 編輯對話框狀態
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<Order | null>(null)
  const [isVisaDialogOpen, setIsVisaDialogOpen] = useState(false)
  const [selectedOrderForVisa, setSelectedOrderForVisa] = useState<Order | null>(null)

  // 🔥 載入 workspace（只執行一次）
  useEffect(() => {
    loadWorkspaces()
   
  }, [])

  // 🔧 優化：建立 tour 出發日期 Map，避免排序時 O(n²) 查詢
  const tourDepartureDates = useMemo(() => {
    const map = new Map<string, number>()
    tours.forEach(t => {
      map.set(t.id, t.departure_date ? new Date(t.departure_date).getTime() : 0)
    })
    return map
  }, [tours])

  const filteredOrders = orders.filter(order => {
    let matchesFilter: boolean
    switch (statusFilter) {
      case 'all':
        matchesFilter = !(order.tour_name?.includes('簽證專用團') || order.tour_name?.includes('網卡專用團'))
        break
      case 'visa-only':
        matchesFilter = order.tour_name?.includes('簽證專用團') ?? false
        break
      case 'sim-only':
        matchesFilter = order.tour_name?.includes('網卡專用團') ?? false
        break
      default:
        matchesFilter = order.payment_status === statusFilter
        break
    }

    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      !searchQuery ||
      (order.order_number || '').toLowerCase().includes(searchLower) ||
      order.code?.toLowerCase().includes(searchLower) ||
      order.tour_name?.toLowerCase().includes(searchLower) ||
      order.contact_person.toLowerCase().includes(searchLower) ||
      order.sales_person?.toLowerCase().includes(searchLower) ||
      order.assistant?.toLowerCase().includes(searchLower)

    return matchesFilter && matchesSearch
  })

  // 按出發日期排序（近的在前）- 使用 Map 做 O(1) 查詢
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const dateA = a.tour_id ? (tourDepartureDates.get(a.tour_id) ?? 0) : 0
    const dateB = b.tour_id ? (tourDepartureDates.get(b.tour_id) ?? 0) : 0
    return dateA - dateB
  })

  const handleAddOrder = async (orderData: {
    tour_id: string
    contact_person: string
    sales_person: string
    assistant: string
  }) => {
    const selectedTour = tours.find(t => t.id === orderData.tour_id)
    if (!selectedTour) {
      void showAlert(LABELS.SELECT_TOUR, 'warning')
      return
    }
    if (!currentWorkspace) {
      void showAlert(LABELS.WORKSPACE_ERROR, 'error')
      return
    }
    if (!orderData.sales_person?.trim()) {
      void showAlert(LABELS.SELECT_SALES, 'warning')
      return
    }

    try {
      // 計算該團的訂單序號 (格式: {團號}-O{2位數})
      const tourOrders = orders.filter(o => o.tour_id === orderData.tour_id)
      const nextOrderNumber = tourOrders.length + 1
      const orderNumber = `${selectedTour.code}-O${nextOrderNumber.toString().padStart(2, '0')}`

      await addOrder({
        order_number: orderNumber,
        tour_id: orderData.tour_id,
        // code 會由 createCloudHook 自動生成（格式：O000001）
        tour_name: selectedTour.name,
        contact_person: orderData.contact_person,
        contact_phone: null,
        sales_person: orderData.sales_person,
        assistant: orderData.assistant,
        member_count: 0,
        total_amount: 0,
        paid_amount: 0,
        payment_status: 'unpaid',
        remaining_amount: 0,
        status: null,
        notes: null,
        customer_id: null,
      } as Omit<Order, 'id' | 'created_at' | 'updated_at'>)

      setIsAddDialogOpen(false)
    } catch (error) {
      logger.error('[Orders] 新增訂單失敗:', error)
      void showAlert(error instanceof Error ? error.message : LABELS.ADD_ORDER_FAILED, 'error')
    }
  }

  return (
    <ContentPageLayout
      title={LABELS.MANAGE_949}
      icon={ShoppingCart}
      breadcrumb={[
        { label: '首頁', href: '/' },
        { label: '訂單管理', href: '/orders' },
      ]}
      showSearch={true}
      searchTerm={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={LABELS.SEARCH_PLACEHOLDER}
      tabs={[
        { value: 'all', label: '全部', icon: ShoppingCart },
        { value: 'unpaid', label: '未收款', icon: AlertCircle },
        { value: 'partial', label: '部分收款', icon: Clock },
        { value: 'paid', label: '已收款', icon: CheckCircle },
        { value: 'visa-only', label: '簽證專用', icon: Shield },
        { value: 'sim-only', label: '網卡專用', icon: Wifi },
      ]}
      activeTab={statusFilter}
      onTabChange={setStatusFilter}
      onAdd={() => setIsAddDialogOpen(true)}
      addLabel="新增訂單"
      contentClassName="flex-1 overflow-auto flex flex-col"
    >
        {/* 訂單列表 */}
        <SimpleOrderTable
          className="flex-1"
          orders={sortedOrders}
          tours={tours}
          showTourInfo={true}
          onQuickInvoice={order => {
            setSelectedOrderForInvoice(order)
            setIsInvoiceDialogOpen(true)
          }}
          onQuickVisa={order => {
            setSelectedOrderForVisa(order)
            setIsVisaDialogOpen(true)
          }}
          onEdit={order => {
            setSelectedOrderForEdit(order)
            setIsEditDialogOpen(true)
          }}
        />

      {/* 新增訂單對話框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent level={1} className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{LABELS.ADD_ORDER}</DialogTitle>
          </DialogHeader>
          <AddOrderForm onSubmit={handleAddOrder} onCancel={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* 🔥 快速收款對話框 */}
      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent level={1} className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{LABELS.QUICK_RECEIPT}</DialogTitle>
          </DialogHeader>
          <QuickReceipt
            defaultTourId={selectedOrderForReceipt?.tourId}
            defaultOrderId={selectedOrderForReceipt?.orderId}
            onSubmit={() => {
              setIsReceiptDialogOpen(false)
              setSelectedOrderForReceipt(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* 發票對話框 */}
      <InvoiceDialog
        open={isInvoiceDialogOpen}
        onOpenChange={open => {
          setIsInvoiceDialogOpen(open)
          if (!open) setSelectedOrderForInvoice(null)
        }}
        defaultOrderId={selectedOrderForInvoice?.id}
        defaultTourId={selectedOrderForInvoice?.tour_id || undefined}
      />

      {/* 編輯訂單對話框 */}
      <OrderEditDialog
        open={isEditDialogOpen}
        onOpenChange={open => {
          setIsEditDialogOpen(open)
          if (!open) setSelectedOrderForEdit(null)
        }}
        order={selectedOrderForEdit}
        level={1}
      />

      {/* 批次簽證對話框 */}
      <BatchVisaDialog
        open={isVisaDialogOpen}
        onOpenChange={open => {
          setIsVisaDialogOpen(open)
          if (!open) setSelectedOrderForVisa(null)
        }}
        order={selectedOrderForVisa}
      />
    </ContentPageLayout>
  )
}
