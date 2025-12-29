/**
 * Add Receipt Dialog (Table-based Input)
 * 新增收款單對話框（表格式輸入，參考請款管理風格）
 */

'use client'

import { logger } from '@/lib/utils/logger'
import { useEffect } from 'react'
import { Plus, Save, X } from 'lucide-react'
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

  // 如果只有一個訂單，自動帶入
  useEffect(() => {
    if (formData.tour_id && filteredOrders.length === 1 && !formData.order_id) {
      const order = filteredOrders[0]
      setFormData(prev => ({ ...prev, order_id: order.id }))
    }
  }, [formData.tour_id, filteredOrders, formData.order_id, setFormData])

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
      // 實作儲存邏輯
      const { useReceiptStore, useAuthStore } = await import('@/stores')
      const { generateReceiptNumber } = await import('@/lib/utils/receipt-number-generator')

      const receiptStore = useReceiptStore.getState()
      const authStore = useAuthStore.getState()
      const user = authStore.user

      if (!user?.workspace_id) {
        throw new Error('無法取得 workspace ID')
      }

      // 取得團號（從訂單關聯的旅遊團）
      const tour = tours.find(t => t.id === selectedOrder?.tour_id)
      const tourCode = tour?.code || ''
      if (!tourCode) {
        throw new Error('無法取得團號，請確認訂單已關聯旅遊團')
      }

      // 為每個收款項目建立收款單
      for (const item of paymentItems) {
        // 生成收款單號（新格式：{團號}-R{2位數}）
        const receiptNumber = generateReceiptNumber(
          tourCode,
          receiptStore.items.filter(r => r.receipt_number?.startsWith(`${tourCode}-R`))
        )

        // 建立收款單
        await receiptStore.create({
          receipt_number: receiptNumber,
          workspace_id: user.workspace_id,
          order_id: formData.order_id,
          order_number: selectedOrder?.order_number || '',
          tour_name: selectedOrder?.tour_name || '',
          receipt_date: item.transaction_date,
          receipt_type: item.receipt_type,
          receipt_amount: item.amount,
          actual_amount: 0,
          status: 0,
          receipt_account: item.receipt_account || null,
          email: item.email || null,
          payment_name: item.payment_name || null,
          pay_dateline: item.pay_dateline || null,
          handler_name: item.handler_name || null,
          account_info: item.account_info || null,
          fees: item.fees || null,
          card_last_four: item.card_last_four || null,
          auth_code: item.auth_code || null,
          check_number: item.check_number || null,
          check_bank: item.check_bank || null,
          note: item.note || null,
          created_by: user.id,
          updated_by: user.id,
          deleted_at: null,
          check_date: null,
        } as Parameters<typeof receiptStore.create>[0])
      }

      toast({
        title: '✅ 收款單建立成功',
        description: `已新增 ${paymentItems.length} 項收款，總金額 NT$ ${totalAmount.toLocaleString()}`,
      })

      resetForm()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      logger.error('❌ Create Receipt Error:', error)

      // 解析錯誤訊息
      let errorMessage = '發生未知錯誤，請檢查必填欄位是否完整'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        // Supabase 錯誤格式
        const err = error as { message?: string; error?: string; details?: string; code?: string }
        if (err.message) {
          errorMessage = err.message
        } else if (err.error) {
          errorMessage = err.error
        } else if (err.details) {
          errorMessage = err.details
        } else if (err.code) {
          errorMessage = `錯誤代碼: ${err.code}`
        } else if (Object.keys(error).length > 0) {
          errorMessage = JSON.stringify(error)
        }
      }

      toast({
        title: '❌ 建立失敗',
        description: errorMessage,
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
        <div className="space-y-4">
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

        {/* 收款項目 - 文青風表格 */}
        <div className="flex-1 flex flex-col overflow-hidden pt-4 border-t border-morandi-container/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-morandi-primary">收款項目</h3>
            <Button onClick={addPaymentItem} size="sm" variant="ghost" className="text-morandi-gold hover:bg-morandi-gold/10">
              <Plus size={14} className="mr-2" />
              新增項目
            </Button>
          </div>

          <div className="flex-1 overflow-visible">
            {/* 表頭 */}
            <div className="border-b border-morandi-container/60">
              <div className="grid grid-cols-[110px_120px_150px_180px_1fr_60px] px-2 py-2.5">
                <span className="text-xs font-medium text-morandi-secondary">收款方式</span>
                <span className="text-xs font-medium text-morandi-secondary text-right pr-2">金額</span>
                <span className="text-xs font-medium text-morandi-secondary">交易日期</span>
                <span className="text-xs font-medium text-morandi-secondary">付款人姓名</span>
                <span className="text-xs font-medium text-morandi-secondary">備註</span>
                <span></span>
              </div>
            </div>

            {/* 項目列表 */}
            <table className="w-full">
              <tbody>
                {paymentItems.map((item, index) => (
                  <PaymentItemRow
                    key={item.id}
                    item={item}
                    index={index}
                    onUpdate={updatePaymentItem}
                    onRemove={removePaymentItem}
                    canRemove={paymentItems.length > 1}
                    isNewRow={index === paymentItems.length - 1}
                  />
                ))}
              </tbody>
            </table>

            {paymentItems.length > 0 && (
              <div className="flex justify-end items-center gap-6 pt-4 mt-2">
                <span className="text-sm text-morandi-secondary">總金額</span>
                <span className="text-lg font-semibold text-morandi-gold">
                  NT$ {totalAmount.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex justify-end space-x-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={handleCancel} className="gap-2">
            <X size={16} />
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.tour_id || !formData.order_id || paymentItems.length === 0}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
          >
            <Save size={16} />
            新增收款單 (共 {paymentItems.length} 項，NT$ {totalAmount.toLocaleString()})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
