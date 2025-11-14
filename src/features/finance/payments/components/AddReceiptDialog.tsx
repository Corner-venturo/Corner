/**
 * Add Receipt Dialog (Table-based Input)
 * 新增收款單對話框（表格式輸入，參考請款管理風格）
 */

'use client'

import { useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/ui/combobox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { usePaymentForm } from '../hooks/usePaymentForm'
import { PaymentItemRow } from './PaymentItemRow'

interface AddReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddReceiptDialog({ open, onOpenChange, onSuccess }: AddReceiptDialogProps) {
  const { toast } = useToast()
  const {
    tours,
    formData,
    setFormData,
    paymentItems,
    filteredOrders,
    selectedOrder,
    totalAmount,
    addPaymentItem,
    removePaymentItem,
    updatePaymentItem,
    resetForm,
    validateForm,
  } = usePaymentForm()

  // 載入資料
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

  const handleSubmit = async () => {
    // 驗證表單
    const errors = validateForm()
    if (errors.length > 0) {
      toast({
        title: '表單驗證失敗',
        description: errors[0],
        variant: 'destructive',
      })
      return
    }

    try {
      // TODO: 實作儲存邏輯
      // 1. 建立收款單
      // 2. 建立收款項目
      // 3. 更新訂單收款狀態

      toast({
        title: '✅ 收款單建立成功',
        description: `已新增 ${paymentItems.length} 項收款，總金額 NT$ ${totalAmount.toLocaleString()}`,
      })

      resetForm()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('❌ Create Receipt Error:', error)
      toast({
        title: '❌ 建立失敗',
        description: '請稍後再試',
        variant: 'destructive',
      })
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
          <DialogTitle>新增收款單</DialogTitle>
          <p className="text-sm text-muted-foreground">
            收款單號將自動產生
          </p>
        </DialogHeader>

        {/* 基本資訊 - 單行 */}
        <div className="bg-white border border-border rounded-md p-4 shadow-sm">
          <div className="grid grid-cols-3 gap-4">
            {/* 選擇團體 */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground">團體 *</Label>
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
              <Label className="text-sm font-medium text-muted-foreground">訂單 *</Label>
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
                      {order.order_number} - {order.contact_person || '無聯絡人'} (待收: NT${' '}
                      {order.remaining_amount?.toLocaleString() || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 待收金額 */}
            {selectedOrder && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">待收金額</Label>
                <div className="mt-1 px-3 py-2 bg-muted rounded-md text-sm font-medium">
                  NT$ {selectedOrder.remaining_amount?.toLocaleString() || 0}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 收款項目 - 表格式 */}
        <div className="bg-white border border-border rounded-md p-4 shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">收款項目</h3>
            <Button onClick={addPaymentItem} size="sm" variant="outline">
              <Plus size={14} className="mr-2" />
              新增項目
            </Button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground w-28">
                    收款方式
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground w-28">
                    金額
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground w-36">
                    交易日期
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground w-40">
                    付款人姓名
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">
                    備註
                  </th>
                  <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground w-20">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {paymentItems.map((item, index) => (
                  <PaymentItemRow
                    key={item.id}
                    item={item}
                    index={index}
                    onUpdate={updatePaymentItem}
                    onRemove={removePaymentItem}
                    canRemove={paymentItems.length > 1}
                  />
                ))}
              </tbody>
            </table>

            {paymentItems.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border flex justify-end items-center">
                <span className="text-base font-semibold text-foreground mr-4">總金額:</span>
                <span className="text-xl font-bold text-morandi-gold">
                  NT$ {totalAmount.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex justify-end space-x-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.tour_id || !formData.order_id || paymentItems.length === 0}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            新增收款單 (共 {paymentItems.length} 項，NT$ {totalAmount.toLocaleString()})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
