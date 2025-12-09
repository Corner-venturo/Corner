'use client'

import { logger } from '@/lib/utils/logger'
import { useEffect, useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Combobox } from '@/components/ui/combobox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRequestForm } from '../hooks/useRequestForm'
import { useRequestOperations } from '../hooks/useRequestOperations'
import { categoryOptions } from '../types'
import { cn } from '@/lib/utils'
import { alert } from '@/lib/ui/alert-dialog'

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
    filteredOrders,
    total_amount,
    addItemToList,
    removeItem,
    updateItem,
    resetForm,
    suppliers,
    tours,
    orders,
  } = useRequestForm()

  const { generateRequestNumber, createRequest } = useRequestOperations()

  // ✅ 載入團體、訂單和供應商資料（開啟對話框時）
  useEffect(() => {
    if (open) {
      const loadData = async () => {
        const { useTourStore, useOrderStore, useSupplierStore, useEmployeeStore } = await import('@/stores')
        const tourStore = useTourStore.getState()
        const orderStore = useOrderStore.getState()
        const supplierStore = useSupplierStore.getState()
        const employeeStore = useEmployeeStore.getState()

        if (tourStore.items.length === 0) {
          await tourStore.fetchAll()
        }
        if (orderStore.items.length === 0) {
          await orderStore.fetchAll()
        }
        if (supplierStore.items.length === 0) {
          await supplierStore.fetchAll()
        }
        if (employeeStore.items.length === 0) {
          await employeeStore.fetchAll()
        }
      }
      loadData().catch((err: unknown) => logger.error('載入資料失敗:', err))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // 過濾有效的項目（有 unit_price > 0 的項目）
  const validItems = requestItems.filter(item => item.unit_price > 0)

  const handleSubmit = async () => {
    if (!formData.tour_id || validItems.length === 0 || !formData.request_date) {
      void alert('請填寫必填欄位（團體、請款日期、至少一項有效請款項目）', 'warning')
      return
    }

    const selectedTour = tours.find(t => t.id === formData.tour_id)
    const selectedOrder = orders.find(o => o.id === formData.order_id)

    if (!selectedTour) {
      void alert('找不到選中的團體', 'error')
      return
    }

    try {
      await createRequest(
        formData,
        validItems,
        selectedTour.name || '',
        selectedTour.code || '',
        selectedOrder?.order_number || undefined
      )

      await alert('請款單建立成功', 'success')
      resetForm()
      onOpenChange(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
      logger.error('❌ Create Request Error:', errorMessage, error)
      await alert(`建立失敗: ${errorMessage}`, 'error')
    }
  }

  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[90vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>新增請款單</DialogTitle>
          <p className="text-sm text-morandi-secondary">
            請款單號: {generateRequestNumber()} (自動生成)
          </p>
        </DialogHeader>

        {/* Basic Info - Single Row */}
        <div className="bg-white border border-border rounded-md p-4 shadow-sm overflow-visible">
          <div className="grid grid-cols-3 gap-4">
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
                  emptyMessage="找不到團體"
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
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-sm font-medium text-morandi-secondary">
                    請款日期 <span className="text-morandi-red">*</span>
                  </Label>
                  <div className="flex items-center space-x-1">
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
                    <label htmlFor="isSpecialBilling" className="text-xs text-morandi-primary cursor-pointer">
                      特殊出帳
                    </label>
                  </div>
                </div>

                {formData.is_special_billing ? (
                  <Input
                    type="date"
                    value={formData.request_date}
                    onChange={e => setFormData(prev => ({ ...prev, request_date: e.target.value }))}
                    className="bg-morandi-gold/10 border-morandi-container/30"
                  />
                ) : (
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
                )}
              </div>
            </div>
        </div>

        {/* Add Item Form - Table Style */}
        <div className="bg-white border border-border rounded-md p-4 shadow-sm flex-1 flex flex-col overflow-hidden mt-4">
            <h3 className="text-sm font-medium text-morandi-primary mb-4">請款項目</h3>
            <div className="overflow-x-auto flex-1">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-sm font-medium text-morandi-secondary w-32">
                      請款類型
                    </th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-morandi-secondary w-64">
                      供應商
                    </th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-morandi-secondary w-28">
                      單價
                    </th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-morandi-secondary w-24">
                      數量
                    </th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-morandi-secondary w-28">
                      小計
                    </th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-morandi-secondary w-32">
                      付款方式
                    </th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-morandi-secondary w-32">
                      支票日期
                    </th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-morandi-secondary w-48">
                      備註
                    </th>
                    <th className="text-center py-2 px-3 text-sm font-medium text-morandi-secondary w-32">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* 所有項目 - 統一可編輯 */}
                  {requestItems.map((item, index) => (
                    <tr
                      key={item.id}
                      className={cn(
                        'border-b border-border/40 hover:bg-morandi-container/10 transition-colors',
                        index % 2 === 1 && 'bg-morandi-container/5'
                      )}
                    >
                      <td className="py-2 px-3 w-32">
                        <Select
                          value={item.category}
                          onValueChange={value =>
                            updateItem(item.id, { category: value as typeof item.category })
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
                      <td className="py-2 px-3 w-64">
                        <Combobox
                          options={suppliers.map(supplier => ({
                            value: supplier.id,
                            label: `${supplier.name} (${supplier.group})`,
                          }))}
                          value={item.supplier_id}
                          onChange={value => updateItem(item.id, { supplier_id: value })}
                          placeholder="搜尋供應商..."
                          emptyMessage="找不到供應商"
                          className="h-9"
                        />
                      </td>
                      <td className="py-2 px-3 w-28">
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={item.unit_price || ''}
                          onChange={e => {
                            let value = e.target.value
                              .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
                              .replace(/[^\d]/g, '')
                            updateItem(item.id, { unit_price: value ? Number(value) : 0 })
                          }}
                          placeholder="0"
                          className="h-9 border-morandi-container/30"
                        />
                      </td>
                      <td className="py-2 px-3 w-24">
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={item.quantity || ''}
                          onChange={e => {
                            let value = e.target.value
                              .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
                              .replace(/[^\d]/g, '')
                            updateItem(item.id, { quantity: value ? Number(value) : 1 })
                          }}
                          placeholder="1"
                          className="h-9 border-morandi-container/30"
                        />
                      </td>
                      <td className="py-2 px-3 w-28 text-sm font-bold text-morandi-gold">
                        {(item.unit_price * item.quantity).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 w-32">
                        <Select
                          value={item.payment_method || 'transfer'}
                          onValueChange={value => {
                            const paymentMethod = value as 'transfer' | 'check' | 'cash'
                            updateItem(item.id, {
                              payment_method: paymentMethod,
                              custom_request_date: paymentMethod === 'check' ? item.custom_request_date : undefined,
                            })
                          }}
                        >
                          <SelectTrigger className="h-9 border-morandi-container/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="transfer">轉帳</SelectItem>
                            <SelectItem value="check">支票</SelectItem>
                            <SelectItem value="cash">現金</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2 px-3 w-32">
                        {item.payment_method === 'check' ? (
                          <Input
                            type="date"
                            value={item.custom_request_date || ''}
                            onChange={e => updateItem(item.id, { custom_request_date: e.target.value })}
                            className="h-9 border-morandi-container/30"
                          />
                        ) : (
                          <span className="text-xs text-morandi-secondary">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3 w-48">
                        <Input
                          value={item.description || ''}
                          onChange={e => updateItem(item.id, { description: e.target.value })}
                          placeholder="輸入項目描述"
                          className="h-9 border-morandi-container/30"
                        />
                      </td>
                      <td className="py-2 px-3 w-32 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            onClick={addItemToList}
                            variant="ghost"
                            size="sm"
                            className="h-8 text-morandi-gold hover:text-morandi-gold hover:bg-morandi-gold/10"
                          >
                            <Plus size={14} />
                          </Button>
                          {requestItems.length > 1 && (
                            <Button
                              onClick={() => removeItem(item.id)}
                              variant="ghost"
                              size="sm"
                              className="h-8 text-morandi-red hover:text-morandi-red hover:bg-morandi-red/10"
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 pt-4 border-t border-border flex justify-end items-center">
                <span className="text-base font-semibold text-morandi-primary mr-4">總金額:</span>
                <span className="text-xl font-bold text-morandi-gold">
                  NT$ {total_amount.toLocaleString()}
                </span>
              </div>
            </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t border-border mt-4">
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.tour_id || validItems.length === 0 || !formData.request_date}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-md"
          >
            新增請款單 (共 {validItems.length} 項，NT$ {total_amount.toLocaleString()})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
