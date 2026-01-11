'use client'

import React, { useState, useCallback } from 'react'
import { logger } from '@/lib/utils/logger'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tour, Payment } from '@/stores/types'
import { useOrderStore, usePaymentRequestStore, useSupplierStore } from '@/stores'
import type { PaymentRequestItem } from '@/stores/types'
import { supabase } from '@/lib/supabase/client'
import { mutate } from 'swr'

// 擴展 PaymentRequest 型別以包含 items
interface PaymentRequestWithItems {
  id: string
  tour_id?: string | null
  order_id?: string | null
  status: string
  created_at?: string | null
  items?: PaymentRequestItem[]
  [key: string]: unknown
}
import { Receipt, Plus, Truck, Hotel, Utensils, MapPin, X } from 'lucide-react'
import { DateCell, CurrencyCell } from '@/components/table-cells'
import { useToast } from '@/components/ui/use-toast'
import { generateUUID } from '@/lib/utils/uuid'

interface TourCostsProps {
  tour: Tour
  orderFilter?: string // 選填：只顯示特定訂單相關的成本
  showSummary?: boolean
  onChildDialogChange?: (hasOpen: boolean) => void
}

// 擴展 Payment 型別以包含成本專用欄位
interface CostPayment extends Payment {
  category?: string
  vendor?: string
  receipt?: string
}

export const TourCosts = React.memo(function TourCosts({ tour, orderFilter, showSummary = true, onChildDialogChange }: TourCostsProps) {
  const { items: orders } = useOrderStore()
  const {
    items: paymentRequests,
    create: createPaymentRequest,
    fetchAll: fetchPaymentRequests,
  } = usePaymentRequestStore()
  const { items: suppliers } = useSupplierStore()
  const { toast } = useToast()

  // 更新 tour 的成本財務欄位
  const updateTourCostFinancials = useCallback(async () => {
    try {
      // 🔧 優化：一請款就計入成本（pending/confirmed/paid 都算），除非被取消
      // 注意：必須過濾已刪除的請款單
      const { data: requestsData } = await supabase
        .from('payment_requests')
        .select('id, status')
        .eq('tour_id', tour.id)
        .is('deleted_at', null) // 過濾已刪除的請款單
        .in('status', ['pending', 'approved', 'confirmed', 'paid']) // pending 也計入（取消/rejected 不計）

      if (!requestsData || requestsData.length === 0) {
        // 如果沒有已確認的請款單，設成本為 0
        const { data: currentTour } = await supabase
          .from('tours')
          .select('total_revenue')
          .eq('id', tour.id)
          .single()

        await supabase
          .from('tours')
          .update({
            total_cost: 0,
            profit: currentTour?.total_revenue || 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tour.id)

        // 刷新 SWR 快取
        await mutate(`tour-${tour.id}`)
        await mutate('tours')
        return
      }

      const requestIds = requestsData.map(r => r.id)

      // 取得已確認請款單的所有項目
      const { data: itemsData } = await supabase
        .from('payment_request_items')
        .select('subtotal')
        .in('request_id', requestIds)

      const totalCost = (itemsData || []).reduce((sum, item) => sum + (item.subtotal || 0), 0)

      // 取得當前收入
      const { data: currentTour } = await supabase
        .from('tours')
        .select('total_revenue')
        .eq('id', tour.id)
        .single()

      const totalRevenue = currentTour?.total_revenue || 0
      const profit = totalRevenue - totalCost

      // 更新 tour
      await supabase
        .from('tours')
        .update({
          total_cost: totalCost,
          profit: profit,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tour.id)

      // 刷新 SWR 快取讓 UI 更新
      await mutate(`tour-${tour.id}`)
      await mutate('tours')

      logger.log('Tour 成本數據已更新:', { total_cost: totalCost, profit })
    } catch (error) {
      logger.error('更新 Tour 成本數據失敗:', error)
    }
  }, [tour.id])

  const addPayment = async (data: {
    tour_id: string
    amount: number
    description: string
    category: string
    vendor: string
    status: string
  }) => {
    try {
      // 找到供應商
      const supplier = suppliers.find(s => s.name === data.vendor || s.id === data.vendor)

      // 類別映射：英文 -> 中文
      const categoryMap: Record<string, '住宿' | '交通' | '餐食' | '門票' | '導遊' | '其他'> = {
        transport: '交通',
        accommodation: '住宿',
        food: '餐食',
        attraction: '門票',
        guide: '導遊',
        other: '其他',
      }

      // 建立請款單項目
      const itemId = generateUUID()
      const requestItem: PaymentRequestItem = {
        id: itemId,
        request_id: '', // 會在 create 時自動設定
        item_number: `ITEM-${Date.now()}`,
        category: categoryMap[data.category] || '其他',
        supplier_id: supplier?.id || '',
        supplier_name: supplier?.name || data.vendor,
        description: data.description,
        unit_price: data.amount,
        quantity: 1,
        subtotal: data.amount,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // 建立請款單
      const paymentRequestData = {
        allocation_mode: 'single' as const,
        tour_id: data.tour_id,
        code: tour.code,
        tour_name: tour.name,
        request_date: new Date().toISOString(),
        items: [requestItem],
        total_amount: data.amount,
        status: data.status === '已確認' ? 'confirmed' : 'pending',
        note: data.description,
        created_by: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      await createPaymentRequest(paymentRequestData as unknown as Parameters<typeof createPaymentRequest>[0])
      await fetchPaymentRequests()

      // 同步更新 tour 的成本數據
      await updateTourCostFinancials()

      toast({
        title: '成功',
        description: '請款單建立成功',
      })
    } catch (error) {
      logger.error('建立請款單失敗:', error)
      toast({
        title: '錯誤',
        description: '建立請款單失敗',
        variant: 'destructive',
      })
      throw error
    }
  }

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // 通知父組件有子 Dialog 開啟（避免多重遮罩）
  React.useEffect(() => {
    onChildDialogChange?.(isAddDialogOpen)
  }, [isAddDialogOpen, onChildDialogChange])

  const [newCost, setNewCost] = useState({
    amount: 0,
    description: '',
    category: 'transport',
    status: '待確認' as const,
    vendor: '',
  })

  const handleAddCost = () => {
    if (!newCost.amount || !newCost.description) return

    addPayment({
      tour_id: tour.id,
      ...newCost,
    })

    setNewCost({
      amount: 0,
      description: '',
      category: 'transport',
      status: '待確認',
      vendor: '',
    })
    setIsAddDialogOpen(false)
  }

  // 獲取屬於這個旅遊團的所有訂單
  const tourOrders = orders.filter(order => order.tour_id === tour.id)

  // 從 payment_requests store 獲取這個團的請款記錄
  const costPayments = React.useMemo(() => {
    const tourOrderIds = new Set(tourOrders.map(o => o.id))

    return (paymentRequests as unknown as (PaymentRequestWithItems & { deleted_at?: string | null })[])
      .filter(request => {
        // 排除已刪除的請款單
        if (request.deleted_at) return false

        // 如果有 orderFilter，只顯示該訂單的請款
        if (orderFilter) {
          return request.order_id === orderFilter
        }

        // 顯示所有屬於這個團的請款
        return (
          request.tour_id === tour.id || (request.order_id && tourOrderIds.has(request.order_id))
        )
      })
      .flatMap(request =>
        (request.items || []).map((item: PaymentRequestItem) => ({
          id: item.id,
          type: 'request' as const,
          tour_id: request.tour_id || tour.id,
          order_id: request.order_id,
          amount: item.subtotal,
          description: item.description,
          status: request.status,
          category: item.category,
          vendor: item.supplier_name,
          created_at: request.created_at,
        }))
      ) as CostPayment[]
  }, [paymentRequests, tourOrders, tour.id, orderFilter])

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
      transport: Truck,
      accommodation: Hotel,
      food: Utensils,
      attraction: MapPin,
      交通: Truck,
      住宿: Hotel,
      餐食: Utensils,
      景點: MapPin,
    }
    return icons[category] || Receipt
  }

  const getCategoryDisplayName = (category: string) => {
    const names: Record<string, string> = {
      transport: '交通',
      accommodation: '住宿',
      food: '餐食',
      attraction: '景點',
      other: '其他',
    }
    return names[category] || category
  }

  // 狀態標籤映射（英文 -> 中文）
  const STATUS_LABELS: Record<string, string> = {
    confirmed: '已確認',
    pending: '待確認',
    paid: '已付款',
  }

  const getStatusLabel = (status: string) => STATUS_LABELS[status] || status

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      // 中文狀態
      已確認: 'bg-morandi-green/20 text-morandi-green',
      待確認: 'bg-morandi-gold/20 text-morandi-gold',
      已付款: 'bg-morandi-container text-morandi-secondary',
      // 英文狀態（相容）
      confirmed: 'bg-morandi-green/20 text-morandi-green',
      pending: 'bg-morandi-gold/20 text-morandi-gold',
      paid: 'bg-morandi-container text-morandi-secondary',
    }
    return badges[status] || 'bg-morandi-container text-morandi-secondary'
  }

  const getReceiptBadge = (receipt: string) => {
    return receipt === '已上傳' ? 'bg-morandi-green text-white' : 'bg-morandi-red text-white'
  }

  const totalCosts = costPayments.reduce((sum, cost) => sum + cost.amount, 0)
  const confirmedCosts = costPayments
    .filter(cost => cost.status === 'confirmed')
    .reduce((sum, cost) => sum + cost.amount, 0)
  const pendingCosts = costPayments
    .filter(cost => cost.status === 'pending')
    .reduce((sum, cost) => sum + cost.amount, 0)

  return (
    <div className="space-y-4">
      {/* 統計摘要 + 新增按鈕 */}
      {showSummary && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center">
              <span className="text-morandi-secondary">總成本</span>
              <CurrencyCell amount={totalCosts} className="ml-2 font-semibold text-morandi-primary" />
            </div>
            <div className="flex items-center">
              <span className="text-morandi-secondary">已確認</span>
              <CurrencyCell amount={confirmedCosts} className="ml-2 font-semibold text-morandi-green" />
            </div>
            <div className="flex items-center">
              <span className="text-morandi-secondary">待確認</span>
              <CurrencyCell amount={pendingCosts} className="ml-2 font-semibold text-morandi-gold" />
            </div>
            <div className="flex items-center">
              <span className="text-morandi-secondary">預估利潤</span>
              <CurrencyCell amount={Math.max(0, tour.total_revenue - totalCosts)} className="ml-2 font-semibold text-morandi-red" />
            </div>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            size="sm"
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            <Plus size={14} className="mr-1" />
            新增支出
          </Button>
        </div>
      )}

      {/* 成本列表 - 直接表格 */}
      <div className="border border-border rounded-lg overflow-hidden">
        {/* 區塊標題行 */}
        <div className="bg-morandi-container/50 border-b border-border/60 px-4 py-2">
          <span className="text-sm font-medium text-morandi-primary">成本支出</span>
        </div>
        {/* 欄位標題行 */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-morandi-container/30 text-xs font-medium text-morandi-secondary">
          <div className="col-span-2">日期</div>
          <div className="col-span-2">金額</div>
          <div className="col-span-2">類別</div>
          <div className="col-span-2">說明</div>
          <div className="col-span-2">供應商</div>
          <div className="col-span-1">收據</div>
          <div className="col-span-1">狀態</div>
        </div>

        {/* 成本項目 */}
        <div className="divide-y divide-border">
          {costPayments.map(cost => {
            const Icon = getCategoryIcon(cost.category || '')
            const displayCategory = getCategoryDisplayName(cost.category || '')
            const relatedOrder = tourOrders.find(order => order.id === cost.order_id)

            return (
              <div
                key={cost.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-morandi-container/20"
              >
                <div className="col-span-2">
                  <DateCell date={cost.created_at} showIcon className="text-sm text-morandi-primary" />
                </div>
                <div className="col-span-2">
                  <CurrencyCell amount={cost.amount} className="font-medium text-morandi-red" />
                </div>
                <div className="col-span-2">
                  <div className="flex items-center text-sm text-morandi-primary">
                    <Icon size={14} className="mr-1 text-morandi-gold" />
                    {displayCategory}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-morandi-primary">{cost.description}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-morandi-primary">
                    {cost.vendor || relatedOrder?.order_number || '-'}
                  </div>
                </div>
                <div className="col-span-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getReceiptBadge('待上傳')}`}>
                    待上傳
                  </span>
                </div>
                <div className="col-span-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(cost.status)}`}>
                    {getStatusLabel(cost.status)}
                  </span>
                </div>
              </div>
            )
          })}

          {costPayments.length === 0 && (
            <div className="text-center py-12 text-morandi-secondary">
              <Receipt size={24} className="mx-auto mb-4 opacity-50" />
              <p>尚無成本支出記錄</p>
            </div>
          )}
        </div>
      </div>

      {/* 新增成本對話框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新增成本支出</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">支出金額</label>
              <Input
                type="number"
                value={newCost.amount}
                onChange={e => setNewCost(prev => ({ ...prev, amount: Number(e.target.value) }))}
                placeholder="0"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">支出說明</label>
              <Input
                value={newCost.description}
                onChange={e => setNewCost(prev => ({ ...prev, description: e.target.value }))}
                placeholder="例：機票費用"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">類別</label>
              <Select
                value={newCost.category}
                onValueChange={value => setNewCost(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transport">交通</SelectItem>
                  <SelectItem value="accommodation">住宿</SelectItem>
                  <SelectItem value="food">餐食</SelectItem>
                  <SelectItem value="attraction">景點</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">供應商</label>
              <Select
                value={newCost.vendor}
                onValueChange={value => setNewCost(prev => ({ ...prev, vendor: value }))}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="請選擇供應商" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="gap-2">
                <X size={16} />
                取消
              </Button>
              <Button
                onClick={handleAddCost}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                新增
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
})
