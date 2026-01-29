'use client'

import { getTodayString } from '@/lib/utils/format-date'

import { logger } from '@/lib/utils/logger'
import React, { useState, useMemo } from 'react'
import { Receipt as ReceiptIcon } from 'lucide-react'
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
import { DateInput } from '@/components/ui/date-input'
import { useOrdersSlim, useTours } from '@/data'
import { Combobox } from '@/components/ui/combobox'
import { usePaymentData } from '@/app/(main)/finance/payments/hooks/usePaymentData'
import type { ReceiptItem } from '@/stores'
import { alert } from '@/lib/ui/alert-dialog'
import { ReceiptType, RECEIPT_TYPE_OPTIONS } from '@/types/receipt.types'

interface QuickReceiptProps {
  onSubmit?: () => void
  /** 預設選中的團體 ID */
  defaultTourId?: string
  /** 預設選中的訂單 ID */
  defaultOrderId?: string
}

// 收款方式選項（使用統一定義）
const paymentMethods = RECEIPT_TYPE_OPTIONS

export function QuickReceipt({ onSubmit, defaultTourId, defaultOrderId }: QuickReceiptProps) {
  const { items: orders } = useOrdersSlim()
  const { items: tours } = useTours()
  const { handleCreateReceipt } = usePaymentData()

  const [selectedTourId, setSelectedTourId] = useState<string>(defaultTourId || '')
  const [selectedOrderId, setSelectedOrderId] = useState<string>(defaultOrderId || '')

  // 🔥 當 default 值變化時更新選中的值
  React.useEffect(() => {
    if (defaultTourId) setSelectedTourId(defaultTourId)
  }, [defaultTourId])

  React.useEffect(() => {
    if (defaultOrderId) setSelectedOrderId(defaultOrderId)
  }, [defaultOrderId])

  // 使用 ReceiptItem 格式
  const [paymentItem, setPaymentItem] = useState<Partial<ReceiptItem>>({
    id: '1',
    receipt_type: ReceiptType.CASH,
    amount: 0,
    transaction_date: getTodayString(),
  })

  // 可用訂單（根據選中的團體過濾）
  const availableOrders = useMemo(() => {
    if (!selectedTourId) return []
    return (orders || []).filter(order => order.tour_id === selectedTourId)
  }, [orders, selectedTourId])

  // 選中的訂單
  const selectedOrder = useMemo(() => {
    return (orders || []).find(order => order.id === selectedOrderId)
  }, [orders, selectedOrderId])

  // 更新收款項目
  const updatePaymentItem = (updates: Partial<ReceiptItem>) => {
    setPaymentItem(prev => ({ ...prev, ...updates }))
  }

  // 重置表單
  const resetForm = () => {
    setSelectedTourId('')
    setSelectedOrderId('')
    setPaymentItem({
      id: '1',
      receipt_type: ReceiptType.CASH,
      amount: 0,
      transaction_date: getTodayString(),
    })
  }

  // 儲存
  const handleSave = async () => {
    if (!selectedOrderId) {
      void alert('請選擇訂單', 'warning')
      return
    }

    if (!paymentItem.amount || paymentItem.amount === 0) {
      void alert('收款金額不能為 0', 'warning')
      return
    }

    try {
      await handleCreateReceipt({
        selectedOrderId,
        paymentItems: [paymentItem as ReceiptItem],
      })

      await alert('收款單建立成功', 'success')
      onSubmit?.()
      resetForm()
    } catch (error) {
      logger.error('❌ Save Error:', error)
      void alert('建立失敗，請稍後再試', 'error')
    }
  }

  return (
    <div className="space-y-4">
      {/* 團體和訂單（並排） */}
      <div className="grid grid-cols-2 gap-3">
        {/* 選擇團體 */}
        <div>
          <Label className="text-sm font-medium text-morandi-primary">團體</Label>
          <Combobox
            options={(tours || []).map(tour => ({
              value: tour.id,
              label: `${tour.code || ''} - ${tour.name || ''}`,
            }))}
            value={selectedTourId}
            onChange={value => {
              setSelectedTourId(value)
              // 找出該團體的訂單，如果只有一個就自動帶入
              const tourOrders = (orders || []).filter(o => o.tour_id === value)
              if (tourOrders.length === 1) {
                setSelectedOrderId(tourOrders[0].id)
              } else {
                setSelectedOrderId('')
              }
            }}
            placeholder="請選擇團體..."
            className="mt-1"
          />
        </div>

        {/* 選擇訂單 */}
        <div>
          <Label className="text-sm font-medium text-morandi-primary">訂單</Label>
          <Select
            disabled={!selectedTourId || availableOrders.length === 0}
            value={selectedOrderId}
            onValueChange={setSelectedOrderId}
          >
            <SelectTrigger className="mt-1 h-9">
              <SelectValue
                placeholder={
                  !selectedTourId
                    ? '請先選擇團體'
                    : availableOrders.length === 0
                      ? '此團體沒有訂單'
                      : '請選擇訂單...'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableOrders.map(order => (
                <SelectItem key={order.id} value={order.id}>
                  {order.code} - {order.contact_person || '無聯絡人'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 第一排：固定欄位（所有收款方式都有） */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-sm font-medium text-morandi-primary">收款方式 *</Label>
          <Select
            value={paymentItem.receipt_type?.toString()}
            onValueChange={value => updatePaymentItem({ receipt_type: Number(value) })}
          >
            <SelectTrigger className="mt-1 h-10 border-morandi-container/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map(method => (
                <SelectItem key={method.value} value={method.value.toString()}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium text-morandi-primary">金額 *</Label>
          <Input
            type="number"
            placeholder="請輸入金額"
            value={paymentItem.amount || ''}
            onChange={e => updatePaymentItem({ amount: Number(e.target.value) })}
            className="mt-1 border-morandi-container/30"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-morandi-primary">交易日期 *</Label>
          <DateInput
            value={paymentItem.transaction_date || ''}
            onChange={value => updatePaymentItem({ transaction_date: value })}
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-medium text-morandi-primary">付款人姓名</Label>
          <Input
            placeholder="請輸入付款人姓名"
            value={paymentItem.receipt_account || ''}
            onChange={e => updatePaymentItem({ receipt_account: e.target.value })}
            className="mt-1 border-morandi-container/30"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-morandi-primary">備註</Label>
          <Input
            placeholder="選填"
            value={paymentItem.notes || ''}
            onChange={e => updatePaymentItem({ notes: e.target.value })}
            className="mt-1 border-morandi-container/30"
          />
        </div>
      </div>

      {/* 第二排：根據收款方式顯示專屬欄位 */}
      {paymentItem.receipt_type === ReceiptType.CASH && (
        <div className="pt-3 border-t">
          <Label className="text-sm font-medium text-morandi-primary">經手人</Label>
          <Input
            placeholder="請輸入經手人姓名"
            value={paymentItem.handler_name || ''}
            onChange={e => updatePaymentItem({ handler_name: e.target.value })}
            className="mt-1 border-morandi-container/30"
          />
        </div>
      )}

      {paymentItem.receipt_type === ReceiptType.BANK_TRANSFER && (
        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          <div>
            <Label className="text-sm font-medium text-morandi-primary">匯入帳戶 *</Label>
            <Select
              value={paymentItem.account_info || ''}
              onValueChange={value => updatePaymentItem({ account_info: value })}
            >
              <SelectTrigger className="mt-1 border-morandi-container/30">
                <SelectValue placeholder="請選擇匯入帳戶" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="國泰">國泰銀行</SelectItem>
                <SelectItem value="合庫">合作金庫</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium text-morandi-primary">手續費</Label>
            <Input
              type="number"
              placeholder="選填，如有手續費"
              value={paymentItem.fees || ''}
              onChange={e => updatePaymentItem({ fees: Number(e.target.value) })}
              className="mt-1 border-morandi-container/30"
            />
          </div>
        </div>
      )}

      {paymentItem.receipt_type === ReceiptType.CREDIT_CARD && (
        <div className="grid grid-cols-3 gap-3 pt-3 border-t">
          <div>
            <Label className="text-sm font-medium text-morandi-primary">卡號後四碼</Label>
            <Input
              placeholder="1234"
              value={paymentItem.card_last_four || ''}
              onChange={e =>
                updatePaymentItem({ card_last_four: e.target.value.replace(/\D/g, '') })
              }
              className="mt-1 border-morandi-container/30"
              maxLength={4}
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-morandi-primary">授權碼</Label>
            <Input
              placeholder="請輸入授權碼"
              value={paymentItem.auth_code || ''}
              onChange={e => updatePaymentItem({ auth_code: e.target.value })}
              className="mt-1 border-morandi-container/30"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-morandi-primary">手續費</Label>
            <Input
              type="number"
              placeholder="選填，如有手續費"
              value={paymentItem.fees || ''}
              onChange={e => updatePaymentItem({ fees: Number(e.target.value) })}
              className="mt-1 border-morandi-container/30"
            />
          </div>
        </div>
      )}

      {paymentItem.receipt_type === ReceiptType.CHECK && (
        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          <div>
            <Label className="text-sm font-medium text-morandi-primary">支票號碼</Label>
            <Input
              placeholder="請輸入支票號碼"
              value={paymentItem.check_number || ''}
              onChange={e => updatePaymentItem({ check_number: e.target.value })}
              className="mt-1 border-morandi-container/30"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-morandi-primary">開票銀行</Label>
            <Input
              placeholder="請輸入銀行名稱"
              value={paymentItem.check_bank || ''}
              onChange={e => updatePaymentItem({ check_bank: e.target.value })}
              className="mt-1 border-morandi-container/30"
            />
          </div>
        </div>
      )}

      {paymentItem.receipt_type === ReceiptType.LINK_PAY && (
        <div className="space-y-3 pt-3 border-t">
          <div>
            <Label className="text-sm font-medium text-morandi-primary">Email *</Label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={paymentItem.email || ''}
              onChange={e => updatePaymentItem({ email: e.target.value })}
              className="mt-1 border-morandi-container/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium text-morandi-primary">付款截止日 *</Label>
              <DateInput
                value={paymentItem.pay_dateline || ''}
                onChange={value => updatePaymentItem({ pay_dateline: value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-morandi-primary">
                付款名稱（客戶看到的）
              </Label>
              <Input
                placeholder="例如：峇里島五日遊 - 尾款"
                value={paymentItem.payment_name || ''}
                onChange={e => updatePaymentItem({ payment_name: e.target.value })}
                className="mt-1 border-morandi-container/30"
              />
            </div>
          </div>
        </div>
      )}

      {/* 提交按鈕 */}
      <Button
        onClick={handleSave}
        disabled={!selectedOrderId || !paymentItem.amount || paymentItem.amount === 0}
        className="w-full bg-morandi-gold hover:bg-morandi-gold-hover text-white"
      >
        <ReceiptIcon size={16} className="mr-2" />
        建立收款單
      </Button>
    </div>
  )
}
