'use client'

import React, { useState, useMemo } from 'react'
import { Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useOrderStore, useReceiptOrderStore, useTourStore } from '@/stores'
import { OrderAllocation, ReceiptPaymentItem } from '@/stores/types'
import { Combobox } from '@/components/ui/combobox'

interface QuickReceiptProps {
  onSubmit?: () => void
}

// 收款方式選項
const paymentMethods = [
  { value: 'cash', label: '現金' },
  { value: 'transfer', label: '匯款' },
  { value: 'card', label: '刷卡' },
  { value: 'check', label: '支票' },
]

export function QuickReceipt({ onSubmit }: QuickReceiptProps) {
  const { items: orders } = useOrderStore()
  const { items: tours } = useTourStore()
  const { create: createReceiptOrder } = useReceiptOrderStore()

  const [selectedTourId, setSelectedTourId] = useState<string>('')
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')

  // 訂單分配列表
  const [orderAllocations, setOrderAllocations] = useState<OrderAllocation[]>([])

  // 收款項目
  const [paymentItems, setPaymentItems] = useState<Partial<ReceiptPaymentItem>[]>([
    {
      payment_method: 'cash',
      amount: 0,
      transaction_date: new Date().toISOString().split('T')[0],
    },
  ])

  // 選中的團體
  const selectedTour = useMemo(() => {
    return tours.find(tour => tour.id === selectedTourId)
  }, [tours, selectedTourId])

  // 可用訂單（根據選中的團體過濾，且未收款或部分收款）
  const availableOrders = useMemo(() => {
    if (!selectedTourId) return []

    return orders.filter(
      order =>
        order.tour_id === selectedTourId &&
        (order.payment_status === 'unpaid' || order.payment_status === 'partial')
    )
  }, [orders, selectedTourId])


  // 更新訂單分配
  const updateOrderAllocation = (index: number, updates: Partial<OrderAllocation>) => {
    setOrderAllocations(prev =>
      prev.map((allocation, i) => (i === index ? { ...allocation, ...updates } : allocation))
    )
  }

  // 更新收款項目（現在只有一個項目）
  const updatePaymentItem = (updates: Partial<ReceiptPaymentItem>) => {
    setPaymentItems([{ ...paymentItems[0], ...updates }])
  }

  // 重置表單
  const resetForm = () => {
    setSelectedTourId('')
    setReceiptDate(new Date().toISOString().split('T')[0])
    setNote('')
    setOrderAllocations([])
    setPaymentItems([
      {
        payment_method: 'cash',
        amount: 0,
        transaction_date: new Date().toISOString().split('T')[0],
      },
    ])
  }

  // 儲存
  const handleSave = async () => {
    if (!selectedTourId) {
      alert('請選擇團體')
      return
    }

    if (orderAllocations.length === 0) {
      alert('請選擇訂單')
      return
    }

    const amount = paymentItems[0]?.amount || 0
    if (amount === 0) {
      alert('收款金額不能為 0')
      return
    }

    try {
      // 自動將收款金額同步到訂單分配
      const updatedAllocation = {
        ...orderAllocations[0],
        allocated_amount: amount,
      }

      await createReceiptOrder({
        allocation_mode: 'single',
        order_allocations: [updatedAllocation],
        receipt_date: receiptDate,
        payment_items: paymentItems as ReceiptPaymentItem[],
        total_amount: amount,
        status: '已收款',
        note,
        created_by: '1', // TODO: 從 auth store 取得當前用戶
      } as unknown)

      alert('✅ 收款單建立成功')
      onSubmit?.()
      resetForm()
    } catch (error) {
      alert('❌ 建立失敗，請稍後再試')
    }
  }

  return (
    <div className="space-y-4">
      {/* 選擇團體 */}
      <div>
        <Label className="text-sm font-medium text-morandi-secondary">選擇團體</Label>
        <Combobox
          options={tours.map(tour => ({
            value: tour.id,
            label: `${tour.tour_code || tour.code || ''} - ${tour.tour_name || tour.name || ''}`,
          }))}
          value={selectedTourId}
          onChange={setSelectedTourId}
          placeholder="請選擇團體..."
          className="mt-1"
        />
        {selectedTour && (
          <p className="text-xs text-morandi-secondary mt-1">
            已選擇：{selectedTour.tour_code || selectedTour.code} - {selectedTour.tour_name || selectedTour.name}
          </p>
        )}
      </div>

      {/* 收款日期 */}
      <div>
        <Label className="text-sm font-medium text-morandi-secondary">收款日期</Label>
        <Input
          type="date"
          value={receiptDate}
          onChange={e => setReceiptDate(e.target.value)}
          className="mt-1 border-morandi-container/30"
        />
      </div>

      {/* 收款方式 */}
      <div>
        <Label className="text-sm font-medium text-morandi-secondary">收款方式</Label>
        <Select
          value={paymentItems[0]?.payment_method}
          onValueChange={value => updatePaymentItem({ payment_method: value as unknown })}
        >
          <SelectTrigger className="mt-1 border-morandi-container/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map(method => (
              <SelectItem key={method.value} value={method.value}>
                {method.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 收款金額 */}
      <div>
        <Label className="text-sm font-medium text-morandi-secondary">收款金額</Label>
        <Input
          type="number"
          placeholder="輸入收款金額..."
          value={paymentItems[0]?.amount || ''}
          onChange={e => updatePaymentItem({ amount: parseFloat(e.target.value) || 0 })}
          className="mt-1 border-morandi-container/30"
        />
      </div>

      {/* 選擇訂單 */}
      {selectedTourId && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-morandi-secondary">選擇訂單</Label>
          {availableOrders.length === 0 ? (
            <div className="text-center py-4 text-xs text-morandi-secondary border rounded-lg border-dashed border-morandi-container/30">
              此團體沒有可用的訂單（未收款或部分收款）
            </div>
          ) : (
            <Select
              value={orderAllocations[0]?.order_id || ''}
              onValueChange={value => {
                const order = orders.find(o => o.id === value)
                if (!order) return

                setOrderAllocations([
                  {
                    order_id: order.id,
                    order_number: order.code,
                    tour_id: order.tour_id,
                    code: order.code || '',
                    tour_name: order.tour_name || '',
                    contact_person: order.contact_person,
                    allocated_amount: 0,
                  },
                ])
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="請選擇訂單..." />
              </SelectTrigger>
              <SelectContent>
                {availableOrders.map(order => (
                  <SelectItem key={order.id} value={order.id}>
                    {order.code} - {order.contact_person}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {orderAllocations[0] && (
            <p className="text-xs text-morandi-secondary">
              已選擇：{orderAllocations[0].code} - {orderAllocations[0].contact_person}
            </p>
          )}
        </div>
      )}


      {/* 備註 */}
      <div>
        <Label className="text-sm font-medium text-morandi-secondary">備註</Label>
        <Textarea
          placeholder="收款相關說明..."
          rows={2}
          value={note}
          onChange={e => setNote(e.target.value)}
          className="mt-1 border-morandi-container/30 text-xs"
        />
      </div>

      {/* 提交按鈕 */}
      <Button
        onClick={handleSave}
        disabled={!selectedTourId || orderAllocations.length === 0 || (paymentItems[0]?.amount || 0) === 0}
        className="w-full bg-morandi-gold hover:bg-morandi-gold-hover text-white"
      >
        <Receipt size={16} className="mr-2" />
        建立收款單
      </Button>
    </div>
  )
}
