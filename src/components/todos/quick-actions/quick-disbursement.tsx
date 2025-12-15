'use client'

import { logger } from '@/lib/utils/logger'
import React, { useMemo, useState } from 'react'
import { FileText, Plus, Trash2 } from 'lucide-react'
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
import { Combobox } from '@/components/ui/combobox'
import { useRequestForm } from '@/features/finance/requests/hooks/useRequestForm'
import { useBatchRequestForm } from '@/features/finance/requests/hooks/useBatchRequestForm'
import { useRequestOperations } from '@/features/finance/requests/hooks/useRequestOperations'
import { categoryOptions } from '@/features/finance/requests/types'
import { BatchTourSelect } from '@/features/finance/requests/components/BatchTourSelect'
import { EditableRequestItemList } from '@/features/finance/requests/components/RequestItemList'
import { cn } from '@/lib/utils'
import { alert } from '@/lib/ui/alert-dialog'

interface QuickDisbursementProps {
  onSubmit?: () => void
}

export function QuickDisbursement({ onSubmit }: QuickDisbursementProps) {
  // Mode: 'single' or 'batch'
  const [mode, setMode] = useState<'single' | 'batch'>('single')

  // Single request hook
  const {
    formData,
    setFormData,
    requestItems,
    tourSearchValue,
    setTourSearchValue,
    orderSearchValue,
    setOrderSearchValue,

    showTourDropdown,
    setShowTourDropdown,
    showOrderDropdown,
    setShowOrderDropdown,

    filteredTours,
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

  // ✅ 載入團體和訂單資料（進入請款頁面時）
  React.useEffect(() => {
    const loadData = async () => {
      const { useTourStore, useOrderStore } = await import('@/stores')
      const tourStore = useTourStore.getState()
      const orderStore = useOrderStore.getState()

      if (tourStore.items.length === 0) {
        await tourStore.fetchAll()
      }
      if (orderStore.items.length === 0) {
        await orderStore.fetchAll()
      }
    }
    loadData()
  }, [])

  // Batch request hook
  const {
    formData: batchFormData,
    setFormData: setBatchFormData,
    selectedTourIds,
    batchTourSearch,
    setBatchTourSearch,
    showBatchTourDropdown,
    setShowBatchTourDropdown,
    filteredTours: batchFilteredTours,
    toggleTourSelection,
    removeTourFromSelection,
    resetForm: resetBatchForm,
    tours: batchTours,
  } = useBatchRequestForm()

  const { createRequest, createBatchRequests } = useRequestOperations()

  // Generate upcoming Thursdays for request date (20 weeks = ~5 months)
  const upcomingThursdays = useMemo(() => {
    const thursdays = []
    const today = new Date()
    const currentDay = today.getDay()

    // 如果今天是週四，從今天開始；否則從下一個週四開始
    let daysUntilThursday = (4 - currentDay + 7) % 7

    for (let i = 0; i < 20; i++) {
      const thursdayDate = new Date(today)
      thursdayDate.setDate(today.getDate() + daysUntilThursday + i * 7)

      thursdays.push({
        value: thursdayDate.toISOString().split('T')[0],
        label: `${thursdayDate.toLocaleDateString('zh-TW')} (${thursdayDate.toLocaleDateString('zh-TW', { weekday: 'short' })})`,
      })
    }

    return thursdays
  }, [])

  const selectedTour = tours.find(t => t.id === formData.tour_id)
  const selectedOrder = orders.find(o => o.id === formData.order_id)

  const handleSubmit = async () => {
    if (mode === 'single') {
      // Single request validation
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
    } else {
      // Batch request validation
      if (
        selectedTourIds.length === 0 ||
        requestItems.length === 0 ||
        !batchFormData.request_date
      ) {
        void alert('請填寫必填欄位（至少一個團體、請款日期、至少一項請款項目）', 'warning')
        return
      }

      try {
        await createBatchRequests(batchFormData, requestItems, selectedTourIds, batchTours)

        await alert(`成功為 ${selectedTourIds.length} 個團體建立請款單`, 'success')
        resetBatchForm()
        resetForm() // Also reset items
        onSubmit?.()
      } catch (error) {
        logger.error('❌ Create Batch Request Error:', error)
        void alert('建立失敗，請稍後再試', 'error')
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-morandi-container/20 rounded-lg shadow-sm">
        <button
          onClick={() => setMode('single')}
          className={cn(
            'flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all',
            mode === 'single'
              ? 'bg-morandi-gold text-white shadow-sm'
              : 'text-morandi-secondary hover:bg-morandi-container/30'
          )}
        >
          單一請款
        </button>
        <button
          onClick={() => setMode('batch')}
          className={cn(
            'flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all',
            mode === 'batch'
              ? 'bg-morandi-primary text-white shadow-sm'
              : 'text-morandi-secondary hover:bg-morandi-container/30'
          )}
        >
          批次請款
        </button>
      </div>

      {mode === 'single' ? (
        <>
          {/* 團體和訂單選擇（並排） */}
          <div className="grid grid-cols-2 gap-3">
            {/* 選擇團體 */}
            <div>
              <Label className="text-sm font-medium text-morandi-secondary">團體 *</Label>
              <Combobox
                options={tours.map(tour => ({
                  value: tour.id,
                  label: `${tour.code || ''} - ${tour.name || ''}`,
                }))}
                value={formData.tour_id}
                onChange={value => {
                  setFormData(prev => ({
                    ...prev,
                    tour_id: value,
                    order_id: '',
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
        </>
      ) : (
        <>
          {/* Batch Request: Multi Tour Select */}
          <BatchTourSelect
            searchValue={batchTourSearch}
            onSearchChange={setBatchTourSearch}
            tours={batchFilteredTours}
            selectedTourIds={selectedTourIds}
            onToggleTour={toggleTourSelection}
            onRemoveTour={removeTourFromSelection}
            showDropdown={showBatchTourDropdown}
            onShowDropdown={setShowBatchTourDropdown}
            allTours={batchTours}
          />
        </>
      )}

      {/* Request Date */}
      <div className="pt-3 border-t border-morandi-container/20">
        <label className="text-sm font-medium text-morandi-secondary mb-2 block">
          請款日期 <span className="text-morandi-red">*</span>
        </label>

        <div className="mb-3 flex items-center space-x-2">
          <input
            type="checkbox"
            id="isSpecialBilling"
            checked={
              mode === 'single' ? formData.is_special_billing : batchFormData.is_special_billing
            }
            onChange={e => {
              if (mode === 'single') {
                setFormData(prev => ({
                  ...prev,
                  is_special_billing: e.target.checked,
                  request_date: '',
                }))
              } else {
                setBatchFormData(prev => ({
                  ...prev,
                  is_special_billing: e.target.checked,
                  request_date: '',
                }))
              }
            }}
            className="rounded border-border"
          />
          <label htmlFor="isSpecialBilling" className="text-sm text-morandi-primary cursor-pointer">
            特殊出帳 (可選擇任何日期)
          </label>
        </div>

        {(mode === 'single' ? formData.is_special_billing : batchFormData.is_special_billing) ? (
          <div>
            <Input
              type="date"
              value={mode === 'single' ? formData.request_date : batchFormData.request_date}
              onChange={e => {
                if (mode === 'single') {
                  setFormData(prev => ({ ...prev, request_date: e.target.value }))
                } else {
                  setBatchFormData(prev => ({ ...prev, request_date: e.target.value }))
                }
              }}
              className="bg-morandi-gold/10 border-morandi-container/30"
            />
            <p className="text-xs text-morandi-gold mt-1.5">⚠️ 特殊出帳：可選擇任何日期</p>
          </div>
        ) : (
          <div>
            <Select
              value={mode === 'single' ? formData.request_date : batchFormData.request_date}
              onValueChange={value => {
                if (mode === 'single') {
                  setFormData(prev => ({ ...prev, request_date: value }))
                } else {
                  setBatchFormData(prev => ({ ...prev, request_date: value }))
                }
              }}
            >
              <SelectTrigger className="border-morandi-container/30">
                <SelectValue placeholder="選擇請款日期 (週四)" />
              </SelectTrigger>
              <SelectContent>
                {upcomingThursdays.map(thursday => (
                  <SelectItem key={thursday.value} value={thursday.value}>
                    {thursday.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-morandi-secondary mt-1.5">💼 一般請款固定每週四</p>
          </div>
        )}
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
          value={mode === 'single' ? formData.note : batchFormData.note}
          onChange={e => {
            if (mode === 'single') {
              setFormData(prev => ({ ...prev, note: e.target.value }))
            } else {
              setBatchFormData(prev => ({ ...prev, note: e.target.value }))
            }
          }}
          className="border-morandi-container/30"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <Button
          onClick={handleSubmit}
          disabled={
            mode === 'single'
              ? !formData.tour_id || requestItems.length === 0 || !formData.request_date
              : selectedTourIds.length === 0 ||
                requestItems.length === 0 ||
                !batchFormData.request_date
          }
          className={cn(
            'w-full text-white shadow-sm',
            mode === 'single'
              ? 'bg-morandi-gold hover:bg-morandi-gold-hover'
              : 'bg-morandi-primary hover:bg-morandi-primary/90'
          )}
        >
          <FileText size={16} className="mr-2" />
          {mode === 'single'
            ? `建立請款單 (${requestItems.length} 項，NT$ ${total_amount.toLocaleString()})`
            : `建立批次請款 (${selectedTourIds.length} 個團，${requestItems.length} 項，總計 NT$ ${(total_amount * selectedTourIds.length).toLocaleString()})`}
        </Button>
      </div>
    </div>
  )
}
