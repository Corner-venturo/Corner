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
import { cn } from '@/lib/utils'

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
    newItem,
    setNewItem,
    tourSearchValue,
    setTourSearchValue,
    orderSearchValue,
    setOrderSearchValue,
    supplierSearchValue,
    setSupplierSearchValue,
    showTourDropdown,
    setShowTourDropdown,
    showOrderDropdown,
    setShowOrderDropdown,
    showSupplierDropdown,
    setShowSupplierDropdown,
    filteredTours,
    filteredOrders,
    filteredSuppliers,
    total_amount,
    addItemToList,
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
        alert('請填寫必填欄位（團體、請款日期、至少一項請款項目）')
        return
      }

      if (!selectedTour) {
        alert('找不到選中的團體')
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

        alert('✅ 請款單建立成功')
        resetForm()
        onSubmit?.()
      } catch (error) {
        logger.error('❌ Create Request Error:', error)
        alert('❌ 建立失敗，請稍後再試')
      }
    } else {
      // Batch request validation
      if (
        selectedTourIds.length === 0 ||
        requestItems.length === 0 ||
        !batchFormData.request_date
      ) {
        alert('請填寫必填欄位（至少一個團體、請款日期、至少一項請款項目）')
        return
      }

      try {
        await createBatchRequests(batchFormData, requestItems, selectedTourIds, batchTours)

        alert(`✅ 成功為 ${selectedTourIds.length} 個團體建立請款單`)
        resetBatchForm()
        resetForm() // Also reset items
        onSubmit?.()
      } catch (error) {
        logger.error('❌ Create Batch Request Error:', error)
        alert('❌ 建立失敗，請稍後再試')
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

      {/* Add Item Form */}
      <div className="pt-3 border-t border-morandi-container/20">
        <label className="text-sm font-medium text-morandi-primary mb-3 block">新增請款項目</label>

        <div className="space-y-3 p-4 bg-morandi-container/5 rounded-lg border border-morandi-container/30">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-morandi-secondary mb-1 block">類別</label>
              <Select
                value={newItem.category}
                onValueChange={value =>
                  setNewItem(prev => ({ ...prev, category: value as typeof newItem.category }))
                }
              >
                <SelectTrigger className="border-morandi-container/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-secondary mb-1 block">
                供應商
              </label>
              <Select
                value={newItem.supplier_id}
                onValueChange={value => setNewItem(prev => ({ ...prev, supplier_id: value }))}
              >
                <SelectTrigger className="border-morandi-container/30">
                  <SelectValue placeholder="選擇供應商" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name} ({supplier.group})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-morandi-secondary mb-1 block">
              項目描述
            </label>
            <Input
              value={newItem.description}
              onChange={e => setNewItem(prev => ({ ...prev, description: e.target.value }))}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  // 只有在不是輸入法組合中時才新增
                  if (!e.nativeEvent.isComposing) {
                    addItemToList()
                  }
                }
              }}
              placeholder="輸入項目描述"
              className="border-morandi-container/30"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-morandi-secondary mb-1 block">單價</label>
              <Input
                type="text"
                inputMode="numeric"
                value={newItem.unit_price || ''}
                onChange={e => {
                  // 全形轉半形並只保留數字
                  let value = e.target.value
                    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
                    .replace(/[^\d]/g, '')
                  setNewItem(prev => ({ ...prev, unit_price: value ? Number(value) : 0 }))
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                  }
                }}
                placeholder="0"
                className="border-morandi-container/30"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-secondary mb-1 block">數量</label>
              <Input
                type="text"
                inputMode="numeric"
                value={newItem.quantity || ''}
                onChange={e => {
                  // 全形轉半形並只保留數字
                  let value = e.target.value
                    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
                    .replace(/[^\d]/g, '')
                  setNewItem(prev => ({ ...prev, quantity: value ? Number(value) : 1 }))
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                  }
                }}
                placeholder="1"
                className="border-morandi-container/30"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-secondary mb-1 block">小計</label>
              <Input
                value={`NT$ ${(newItem.unit_price * newItem.quantity).toLocaleString()}`}
                disabled
                className="bg-morandi-container/30"
              />
            </div>
          </div>

          <Button
            onClick={addItemToList}
            disabled={!newItem.supplier_id || !newItem.description}
            className="w-full bg-morandi-gold hover:bg-morandi-gold-hover text-white shadow-sm"
            size="sm"
          >
            <Plus size={16} className="mr-2" />
            新增項目
          </Button>
        </div>
      </div>

      {/* Item List */}
      {requestItems.length > 0 && (
        <div className="pt-3 border-t border-morandi-container/20">
          <label className="text-sm font-medium text-morandi-primary mb-3 block">
            請款項目列表 ({requestItems.length})
          </label>
          <div className="space-y-2 p-4 bg-morandi-container/5 rounded-lg border border-morandi-container/30">
            <div className="space-y-2">
              {requestItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-morandi-container/20"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-morandi-gold/20 text-morandi-gold px-2 py-0.5 rounded">
                        {categoryOptions.find(c => c.value === item.category)?.label}
                      </span>
                      <span className="text-sm font-medium text-morandi-primary">
                        {item.supplierName}
                      </span>
                    </div>
                    <div className="text-xs text-morandi-secondary">{item.description}</div>
                    <div className="text-xs text-morandi-secondary mt-1">
                      NT$ {item.unit_price.toLocaleString()} × {item.quantity} =
                      <span className="font-semibold text-morandi-gold ml-1">
                        NT$ {(item.unit_price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="ml-4 text-morandi-red hover:bg-morandi-red/10 p-2 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-morandi-container/30 flex justify-between items-center">
              <span className="text-sm font-semibold text-morandi-primary">總金額:</span>
              <span className="text-lg font-bold text-morandi-gold">
                NT$ {total_amount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

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
