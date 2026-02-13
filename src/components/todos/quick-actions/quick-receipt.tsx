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
import { useOrdersSlim, useToursSlim } from '@/data'
import { Combobox } from '@/components/ui/combobox'
import { usePaymentData } from '@/app/(main)/finance/payments/hooks/usePaymentData'
import type { ReceiptItem } from '@/stores'
import { alert } from '@/lib/ui/alert-dialog'
import { ReceiptType, RECEIPT_TYPE_OPTIONS } from '@/types/receipt.types'
import { 
  FORM_LABELS, 
  PLACEHOLDER_LABELS, 
  BUTTON_LABELS, 
  CONTACT_LABELS, 
  BANK_OPTIONS, 
  MESSAGE_LABELS 
} from '../constants/labels'

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
  const { items: tours } = useToursSlim()
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
      void alert(MESSAGE_LABELS.selectOrder, 'warning')
      return
    }

    if (!paymentItem.amount || paymentItem.amount === 0) {
      void alert(MESSAGE_LABELS.amountRequired, 'warning')
      return
    }

    try {
      await handleCreateReceipt({
        selectedOrderId,
        paymentItems: [paymentItem as ReceiptItem],
      })

      await alert(MESSAGE_LABELS.receiptCreateSuccess, 'success')
      onSubmit?.()
      resetForm()
    } catch (error) {
      logger.error('❌ Save Error:', error)
      void alert(MESSAGE_LABELS.createFailed, 'error')
    }
  }

  return (
    <div className="space-y-4">
      {/* 團體和訂單（並排） */}
      <div className="grid grid-cols-2 gap-3">
        {/* 選擇團體 */}
        <div>
          <Label className="text-sm font-medium text-morandi-primary">{FORM_LABELS.group}</Label>
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
            placeholder={PLACEHOLDER_LABELS.selectGroup}
            className="mt-1"
          />
        </div>

        {/* 選擇訂單 */}
        <div>
          <Label className="text-sm font-medium text-morandi-primary">{FORM_LABELS.order}</Label>
          <Select
            disabled={!selectedTourId || availableOrders.length === 0}
            value={selectedOrderId}
            onValueChange={setSelectedOrderId}
          >
            <SelectTrigger className="mt-1 h-9">
              <SelectValue
                placeholder={
                  !selectedTourId
                    ? PLACEHOLDER_LABELS.selectGroupFirst
                    : availableOrders.length === 0
                      ? PLACEHOLDER_LABELS.noOrdersInGroup
                      : PLACEHOLDER_LABELS.selectOrder
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableOrders.map(order => (
                <SelectItem key={order.id} value={order.id}>
                  {order.code} - {order.contact_person || CONTACT_LABELS.noContact}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 第一排：固定欄位（所有收款方式都有） */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-sm font-medium text-morandi-primary">{FORM_LABELS.paymentMethod}</Label>
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
          <Label className="text-sm font-medium text-morandi-primary">{FORM_LABELS.amount}</Label>
          <Input
            type="number"
            placeholder={PLACEHOLDER_LABELS.enterAmount}
            value={paymentItem.amount || ''}
            onChange={e => updatePaymentItem({ amount: Number(e.target.value) })}
            className="mt-1 border-morandi-container/30"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-morandi-primary">{FORM_LABELS.transactionDate}</Label>
          <DateInput
            value={paymentItem.transaction_date || ''}
            onChange={value => updatePaymentItem({ transaction_date: value })}
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-medium text-morandi-primary">{FORM_LABELS.payerName}</Label>
          <Input
            placeholder={PLACEHOLDER_LABELS.enterPayerName}
            value={paymentItem.receipt_account || ''}
            onChange={e => updatePaymentItem({ receipt_account: e.target.value })}
            className="mt-1 border-morandi-container/30"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-morandi-primary">{FORM_LABELS.remarks}</Label>
          <Input
            placeholder={PLACEHOLDER_LABELS.optional}
            value={paymentItem.notes || ''}
            onChange={e => updatePaymentItem({ notes: e.target.value })}
            className="mt-1 border-morandi-container/30"
          />
        </div>
      </div>

      {/* 第二排：根據收款方式顯示專屬欄位 */}
      {paymentItem.receipt_type === ReceiptType.CASH && (
        <div className="pt-3 border-t">
          <Label className="text-sm font-medium text-morandi-primary">{FORM_LABELS.handler}</Label>
          <Input
            placeholder={PLACEHOLDER_LABELS.enterHandlerName}
            value={paymentItem.handler_name || ''}
            onChange={e => updatePaymentItem({ handler_name: e.target.value })}
            className="mt-1 border-morandi-container/30"
          />
        </div>
      )}

      {paymentItem.receipt_type === ReceiptType.BANK_TRANSFER && (
        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          <div>
            <Label className="text-sm font-medium text-morandi-primary">{FORM_LABELS.depositAccount}</Label>
            <Select
              value={paymentItem.account_info || ''}
              onValueChange={value => updatePaymentItem({ account_info: value })}
            >
              <SelectTrigger className="mt-1 border-morandi-container/30">
                <SelectValue placeholder={PLACEHOLDER_LABELS.selectAccount} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="國泰">{BANK_OPTIONS.cathay}</SelectItem>
                <SelectItem value="合庫">{BANK_OPTIONS.hcb}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium text-morandi-primary">{FORM_LABELS.fees}</Label>
            <Input
              type="number"
              placeholder={PLACEHOLDER_LABELS.optionalWithFees}
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
            <Label className="text-sm font-medium text-morandi-primary">{FORM_LABELS.cardLastFour}</Label>
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
            <Label className="text-sm font-medium text-morandi-primary">{FORM_LABELS.authCode}</Label>
            <Input
              placeholder={PLACEHOLDER_LABELS.enterAuthCode}
              value={paymentItem.auth_code || ''}
              onChange={e => updatePaymentItem({ auth_code: e.target.value })}
              className="mt-1 border-morandi-container/30"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-morandi-primary">{FORM_LABELS.fees}</Label>
            <Input
              type="number"
              placeholder={PLACEHOLDER_LABELS.optionalWithFees}
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
            <Label className="text-sm font-medium text-morandi-primary">{FORM_LABELS.checkNumber}</Label>
            <Input
              placeholder={PLACEHOLDER_LABELS.enterCheckNumber}
              value={paymentItem.check_number || ''}
              onChange={e => updatePaymentItem({ check_number: e.target.value })}
              className="mt-1 border-morandi-container/30"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-morandi-primary">{FORM_LABELS.issueBank}</Label>
            <Input
              placeholder={PLACEHOLDER_LABELS.enterBankName}
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
            <Label className="text-sm font-medium text-morandi-primary">{FORM_LABELS.email}</Label>
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
              <Label className="text-sm font-medium text-morandi-primary">{FORM_LABELS.paymentDeadline}</Label>
              <DateInput
                value={paymentItem.pay_dateline || ''}
                onChange={value => updatePaymentItem({ pay_dateline: value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-morandi-primary">
                {FORM_LABELS.paymentNameForCustomer}
              </Label>
              <Input
                placeholder={PLACEHOLDER_LABELS.paymentNameExample}
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
        {BUTTON_LABELS.create}
      </Button>
    </div>
  )
}
