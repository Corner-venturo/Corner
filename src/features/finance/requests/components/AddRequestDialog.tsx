'use client'

import { useEffect, useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { useRequestForm } from '../hooks/useRequestForm'
import { useRequestOperations } from '../hooks/useRequestOperations'
import { categoryOptions } from '../types'
import { cn } from '@/lib/utils'

interface AddRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddRequestDialog({ open, onOpenChange }: AddRequestDialogProps) {
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

  const { generateRequestNumber, createRequest } = useRequestOperations()

  // ✅ 載入團體和訂單資料（開啟對話框時）
  useEffect(() => {
    if (open) {
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
    }
  }, [open])

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

  const handleSubmit = async () => {
    if (!formData.tour_id || requestItems.length === 0 || !formData.request_date) {
      alert('請填寫必填欄位（團體、請款日期、至少一項請款項目）')
      return
    }

    const selectedTour = tours.find(t => t.id === formData.tour_id)
    const selectedOrder = orders.find(o => o.id === formData.order_id)

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
        selectedOrder?.order_number
      )

      alert('✅ 請款單建立成功')
      resetForm()
      onOpenChange(false)
    } catch (error) {
      console.error('❌ Create Request Error:', error)
      alert('❌ 建立失敗，請稍後再試')
    }
  }

  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增請款單</DialogTitle>
          <p className="text-sm text-morandi-secondary">
            請款單號: {generateRequestNumber()} (自動生成)
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white border border-border rounded-md p-4 shadow-sm">
            <h3 className="text-sm font-medium text-morandi-primary mb-4">基本資訊</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <SelectTrigger className="mt-1 border-morandi-container/30">
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

              {/* Request Date */}
              <div>
                <label className="text-sm font-medium text-morandi-secondary mb-2 block">
                  請款日期 <span className="text-morandi-red">*</span>
                </label>

                <div className="mb-3 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isSpecialBilling"
                    checked={formData.is_special_billing}
                    onChange={e => {
                      setFormData(prev => ({
                        ...prev,
                        is_special_billing: e.target.checked,
                        request_date: '',
                      }))
                    }}
                    className="rounded border-border"
                  />
                  <label htmlFor="isSpecialBilling" className="text-sm text-morandi-primary cursor-pointer">
                    特殊出帳 (可選擇任何日期)
                  </label>
                </div>

                {formData.is_special_billing ? (
                  <div>
                    <Input
                      type="date"
                      value={formData.request_date}
                      onChange={e => setFormData(prev => ({ ...prev, request_date: e.target.value }))}
                      className="bg-morandi-gold/10 border-morandi-container/30"
                    />
                    <p className="text-xs text-morandi-gold mt-1.5">⚠️ 特殊出帳：可選擇任何日期</p>
                  </div>
                ) : (
                  <div>
                    <Select
                      value={formData.request_date}
                      onValueChange={value => setFormData(prev => ({ ...prev, request_date: value }))}
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

              {/* Note */}
              <div>
                <Label className="text-sm font-medium text-morandi-secondary">備註</Label>
                <Textarea
                  placeholder="請款相關說明..."
                  rows={3}
                  value={formData.note}
                  onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  className="mt-1 border-morandi-container/30"
                />
              </div>
            </div>
          </div>

          {/* Add Item Form - Table Style */}
          <div className="bg-white border border-border rounded-md p-4 shadow-sm">
            <h3 className="text-sm font-medium text-morandi-primary mb-4">請款項目</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-sm font-medium text-morandi-secondary">
                      請款類型
                    </th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-morandi-secondary">
                      供應商
                    </th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-morandi-secondary">
                      單價
                    </th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-morandi-secondary">
                      數量
                    </th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-morandi-secondary">
                      小計
                    </th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-morandi-secondary">
                      備註
                    </th>
                    <th className="text-center py-2 px-3 text-sm font-medium text-morandi-secondary w-20">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* New Item Row */}
                  <tr className="bg-morandi-gold/5 border-b-2 border-morandi-gold/30">
                    <td className="py-2 px-3">
                      <Select
                        value={newItem.category}
                        onValueChange={value =>
                          setNewItem(prev => ({ ...prev, category: value as typeof newItem.category }))
                        }
                      >
                        <SelectTrigger className="h-9 border-morandi-container/30">
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
                    </td>
                    <td className="py-2 px-3">
                      <Select
                        value={newItem.supplier_id}
                        onValueChange={value => setNewItem(prev => ({ ...prev, supplier_id: value }))}
                      >
                        <SelectTrigger className="h-9 border-morandi-container/30">
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
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        type="number"
                        value={newItem.unit_price || ''}
                        onChange={e =>
                          setNewItem(prev => ({ ...prev, unit_price: Number(e.target.value) }))
                        }
                        placeholder="0"
                        className="h-9 border-morandi-container/30"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        type="number"
                        value={newItem.quantity || ''}
                        onChange={e =>
                          setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))
                        }
                        placeholder="1"
                        className="h-9 border-morandi-container/30"
                      />
                    </td>
                    <td className="py-2 px-3 text-sm font-bold text-morandi-gold">
                      {(newItem.unit_price * newItem.quantity).toLocaleString()}
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        value={newItem.description}
                        onChange={e => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="輸入項目描述"
                        className="h-9 border-morandi-container/30"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <Button
                        onClick={addItemToList}
                        disabled={!newItem.supplier_id || !newItem.description}
                        size="sm"
                        className="h-9 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                      >
                        <Plus size={14} />
                      </Button>
                    </td>
                  </tr>

                  {/* Existing Items */}
                  {requestItems.map((item, index) => (
                    <tr
                      key={item.id}
                      className={cn(
                        'border-b border-border/40 hover:bg-morandi-container/10 transition-colors',
                        index % 2 === 1 && 'bg-morandi-container/5'
                      )}
                    >
                      <td className="py-3 px-3">
                        <span className="text-xs bg-morandi-gold/20 text-morandi-gold px-2 py-1 rounded font-medium">
                          {categoryOptions.find(c => c.value === item.category)?.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-sm text-morandi-primary font-medium">
                        {item.supplierName}
                      </td>
                      <td className="py-3 px-3 text-sm text-morandi-secondary">
                        {item.unit_price.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-sm text-morandi-secondary">{item.quantity}</td>
                      <td className="py-3 px-3 text-sm font-bold text-morandi-gold">
                        {(item.unit_price * item.quantity).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-sm text-morandi-secondary">{item.description}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-morandi-red hover:bg-morandi-red/10 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {requestItems.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border flex justify-end items-center">
                  <span className="text-base font-semibold text-morandi-primary mr-4">總金額:</span>
                  <span className="text-xl font-bold text-morandi-gold">
                    NT$ {total_amount.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={handleCancel}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.tour_id || requestItems.length === 0 || !formData.request_date}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-md"
            >
              新增請款單 (共 {requestItems.length} 項，NT$ {total_amount.toLocaleString()})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
