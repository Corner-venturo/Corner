'use client'

import { logger } from '@/lib/utils/logger'
import React from 'react'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Combobox } from '@/components/ui/combobox'
import { useRequestForm } from '@/features/finance/requests/hooks/useRequestForm'
import { useRequestOperations } from '@/features/finance/requests/hooks/useRequestOperations'
import { EditableRequestItemList } from '@/features/finance/requests/components/RequestItemList'
import { RequestDateInput } from '@/features/finance/requests/components/RequestDateInput'
import { alert } from '@/lib/ui/alert-dialog'

interface QuickDisbursementProps {
  onSubmit?: () => void
}

export function QuickDisbursement({ onSubmit }: QuickDisbursementProps) {
  const {
    formData,
    setFormData,
    requestItems,
    filteredOrders,
    total_amount,
    addNewEmptyItem,
    updateItem,
    removeItem,
    resetForm,
    suppliers,
    tours,
    orders,
  } = useRequestForm()

  const { createRequest } = useRequestOperations()

  const selectedTour = (tours || []).find(t => t.id === formData.tour_id)
  const selectedOrder = (orders || []).find(o => o.id === formData.order_id)

  const handleSubmit = async () => {
    if (!formData.tour_id || requestItems.length === 0 || !formData.request_date) {
      void alert('請填寫必填欄位（團體、請款日期、至少一項請款項目）', 'warning')
      return
    }

    if (!selectedTour) {
      void alert('找不到選中的團體', 'warning')
      return
    }

    try {
      await createRequest(
        formData,
        requestItems,
        selectedTour.name,
        selectedTour.code,
        selectedOrder?.order_number || undefined
      )

      await alert('請款單建立成功', 'success')
      resetForm()
      onSubmit?.()
    } catch (error) {
      logger.error('❌ Create Request Error:', error)
      void alert('建立失敗，請稍後再試', 'error')
    }
  }

  return (
    <div className="space-y-4">
      {/* 團體和訂單選擇（並排） */}
      <div className="grid grid-cols-2 gap-3">
        {/* 選擇團體 */}
        <div>
          <Label className="text-sm font-medium text-morandi-secondary">團體 *</Label>
          <Combobox
            options={(tours || []).map(tour => ({
              value: tour.id,
              label: `${tour.code || ''} - ${tour.name || ''}`,
            }))}
            value={formData.tour_id}
            onChange={value => {
              // 找出該團體的訂單
              const tourOrders = (orders || []).filter(o => o.tour_id === value)
              // 如果只有一個訂單，自動帶入
              const autoOrderId = tourOrders.length === 1 ? tourOrders[0].id : ''
              setFormData(prev => ({
                ...prev,
                tour_id: value,
                order_id: autoOrderId,
              }))
            }}
            placeholder="請選擇團體..."
            className="mt-1"
          />
        </div>

        {/* 選擇訂單 */}
        <div>
          <Label className="text-sm font-medium text-morandi-secondary">訂單（選填）</Label>
          <Select
            disabled={!formData.tour_id || filteredOrders.length === 0}
            value={formData.order_id}
            onValueChange={value => setFormData(prev => ({ ...prev, order_id: value }))}
          >
            <SelectTrigger className="mt-1 h-9 border-morandi-container/30">
              <SelectValue
                placeholder={
                  !formData.tour_id
                    ? '請先選擇團體'
                    : filteredOrders.length === 0
                      ? '此團體沒有訂單'
                      : '請選擇訂單...'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {filteredOrders.map(order => (
                <SelectItem key={order.id} value={order.id}>
                  {order.order_number} - {order.contact_person || '無聯絡人'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Request Date */}
      <div className="pt-3 border-t border-morandi-container/20">
        <RequestDateInput
          value={formData.request_date}
          onChange={(date, isSpecialBilling) => {
            setFormData(prev => ({ ...prev, request_date: date, is_special_billing: isSpecialBilling }))
          }}
        />
      </div>

      {/* Item List */}
      <div className="pt-3 border-t border-morandi-container/20">
        <EditableRequestItemList
          items={requestItems}
          suppliers={suppliers}
          updateItem={updateItem}
          removeItem={removeItem}
          addNewEmptyItem={addNewEmptyItem}
        />
      </div>

      {/* Note */}
      <div className="pt-3 border-t border-morandi-container/20">
        <label className="text-sm font-medium text-morandi-secondary mb-2 block">備註</label>
        <Textarea
          placeholder="請款相關說明..."
          rows={2}
          value={formData.note}
          onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))}
          className="border-morandi-container/30"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <Button
          onClick={handleSubmit}
          disabled={!formData.tour_id || requestItems.length === 0 || !formData.request_date}
          className="w-full text-white shadow-sm bg-morandi-gold hover:bg-morandi-gold-hover"
        >
          <FileText size={16} className="mr-2" />
          建立請款單 ({requestItems.length} 項，NT$ {total_amount.toLocaleString()})
        </Button>
      </div>
    </div>
  )
}
