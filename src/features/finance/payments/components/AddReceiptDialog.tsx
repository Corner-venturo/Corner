/**
 * Add Receipt Dialog (Table-based Input)
 * 新增收款單對話框（表格式輸入，參考請款管理風格）
 */

'use client'

import { logger } from '@/lib/utils/logger'
import { useEffect, useState } from 'react'
import { Plus, Save, X, Copy, ExternalLink, Check } from 'lucide-react'
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
import { CurrencyCell } from '@/components/table-cells'
import { RECEIPT_TYPES } from '../types'
import { Input } from '@/components/ui/input'

interface LinkPayResult {
  receiptNumber: string
  link: string
}

interface AddReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  /** 預設團 ID（從快速收款按鈕傳入） */
  defaultTourId?: string
  /** 預設訂單 ID（從快速收款按鈕傳入） */
  defaultOrderId?: string
}

export function AddReceiptDialog({ open, onOpenChange, onSuccess, defaultTourId, defaultOrderId }: AddReceiptDialogProps) {
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

  // LinkPay 結果
  const [linkPayResults, setLinkPayResults] = useState<LinkPayResult[]>([])
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

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

  // 當對話框開啟且有預設值時，自動帶入
  useEffect(() => {
    if (open && defaultOrderId && !formData.order_id) {
      // 需要先找到訂單對應的團 ID
      const findTourId = async () => {
        const { useOrderStore } = await import('@/stores')
        const orderStore = useOrderStore.getState()
        const order = orderStore.items.find(o => o.id === defaultOrderId)
        if (order?.tour_id) {
          setFormData(prev => ({
            ...prev,
            tour_id: order.tour_id || '',
            order_id: defaultOrderId,
          }))
        } else if (defaultTourId) {
          setFormData(prev => ({
            ...prev,
            tour_id: defaultTourId,
            order_id: defaultOrderId,
          }))
        }
      }
      findTourId()
    }
  }, [open, defaultTourId, defaultOrderId, formData.order_id, setFormData])

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
      const newLinkPayResults: LinkPayResult[] = []

      for (const item of paymentItems) {
        // 生成收款單號（新格式：{團號}-R{2位數}）
        const receiptNumber = generateReceiptNumber(
          tourCode,
          receiptStore.items.filter(r => r.receipt_number?.startsWith(`${tourCode}-R`))
        )

        // 建立收款單
        // 收款方式轉換為 payment_method 字串（符合資料庫 CHECK 約束）
        const paymentMethodMap: Record<number, string> = {
          0: 'transfer',  // 匯款
          1: 'cash',      // 現金
          2: 'card',      // 刷卡（資料庫用 'card' 不是 'credit_card'）
          3: 'check',     // 支票
          4: 'linkpay',   // LinkPay
        }
        const paymentMethod = paymentMethodMap[item.receipt_type] || 'transfer'

        // 建立收款單
        await receiptStore.create({
          receipt_number: receiptNumber,
          workspace_id: user.workspace_id,
          order_id: formData.order_id,
          tour_id: selectedOrder?.tour_id || null,
          customer_id: selectedOrder?.customer_id || null,  // 付款人不一定是訂單客戶
          order_number: selectedOrder?.order_number || '',
          tour_name: selectedOrder?.tour_name || '',
          // 資料庫必填欄位
          payment_date: item.transaction_date,  // 資料庫期望 payment_date
          payment_method: paymentMethod,        // 資料庫期望 payment_method (string)
          receipt_date: item.transaction_date,
          receipt_type: item.receipt_type,
          receipt_amount: item.amount,
          amount: item.amount,
          actual_amount: 0,
          status: '0',  // 資料庫存的是字串: '0'=待確認, '1'=已確認
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
          check_date: null,
          created_by: user.id,
          updated_by: user.id,
          deleted_at: null,
          link: null,
          linkpay_order_number: null,
        } as Parameters<typeof receiptStore.create>[0])

        // 如果是 LinkPay，呼叫 API 產生付款連結
        if (item.receipt_type === RECEIPT_TYPES.LINK_PAY) {
          try {
            const response = await fetch('/api/linkpay', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                receiptNumber,
                userName: item.receipt_account || '',
                email: item.email || '',
                paymentName: item.payment_name || tourCode,
                createUser: user.id,
                amount: item.amount,
                endDate: item.pay_dateline || '',
              }),
            })
            const data = await response.json()
            if (data.success && data.data?.paymentLink) {
              newLinkPayResults.push({
                receiptNumber,
                link: data.data.paymentLink
              })
              // 更新收款單的 link 欄位
              const createdReceipt = receiptStore.items.find(r => r.receipt_number === receiptNumber)
              if (createdReceipt) {
                await receiptStore.update(createdReceipt.id, { link: data.data.paymentLink })
              }
            }
          } catch (linkPayError) {
            logger.error('LinkPay API 錯誤:', linkPayError)
            // 不阻止流程，繼續處理其他收款項目
          }
        }
      }

      // 設定 LinkPay 結果
      if (newLinkPayResults.length > 0) {
        setLinkPayResults(newLinkPayResults)
      }

      // 收款單建立成功
      if (newLinkPayResults.length > 0) {
        // 有 LinkPay 結果，顯示在對話框中，不關閉
        toast({
          title: '收款單建立成功',
          description: `已新增 ${paymentItems.length} 項收款，其中 ${newLinkPayResults.length} 項 LinkPay 已產生連結`,
        })
        resetForm()
        onSuccess?.()
        // 不關閉對話框，讓使用者複製連結
      } else {
        toast({
          title: '收款單建立成功',
          description: `已新增 ${paymentItems.length} 項收款，總金額 NT$ ${totalAmount.toLocaleString()}`,
        })
        resetForm()
        onOpenChange(false)
        onSuccess?.()
      }
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
    setLinkPayResults([])
    setCopiedLink(null)
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
                      <span className="inline-flex items-center gap-1">
                        {order.order_number} - {order.contact_person || '無聯絡人'} (待收: <CurrencyCell amount={order.remaining_amount || 0} className="inline" />)
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 待收金額 */}
            {selectedOrder && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">待收金額</Label>
                <div className="mt-1 px-3 py-2 bg-muted rounded-md">
                  <CurrencyCell amount={selectedOrder.remaining_amount || 0} />
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
            {/* 項目表格 */}
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="text-xs text-morandi-secondary font-medium bg-morandi-container/30">
                  <th className="text-left py-2 px-3 border border-border" style={{ width: '110px' }}>收款方式</th>
                  <th className="text-left py-2 px-3 border border-border" style={{ width: '150px' }}>交易日期</th>
                  <th className="text-left py-2 px-3 border border-border" style={{ width: '180px' }}>付款人姓名</th>
                  <th className="text-left py-2 px-3 border border-border">備註</th>
                  <th className="text-right py-2 px-3 border border-border" style={{ width: '120px' }}>金額</th>
                  <th className="border border-border" style={{ width: '50px' }}></th>
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
                    isNewRow={index === paymentItems.length - 1}
                    orderInfo={selectedOrder ? {
                      order_number: selectedOrder.order_number || undefined,
                      tour_name: selectedOrder.tour_name || undefined,
                      contact_person: selectedOrder.contact_person || undefined,
                      contact_email: selectedOrder.contact_email || undefined,
                    } : undefined}
                  />
                ))}
              </tbody>
            </table>

            {paymentItems.length > 0 && (
              <div className="flex justify-end items-center gap-6 pt-4 mt-2">
                <span className="text-sm text-morandi-secondary">總金額</span>
                <CurrencyCell amount={totalAmount} className="text-lg font-semibold text-morandi-gold" />
              </div>
            )}
          </div>
        </div>

        {/* LinkPay 結果區域 */}
        {linkPayResults.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-morandi-gold/30 bg-morandi-gold/5 -mx-6 px-6 py-4">
            <h3 className="text-sm font-medium text-morandi-gold flex items-center gap-2">
              <ExternalLink size={16} />
              LinkPay 付款連結已產生
            </h3>
            <div className="space-y-2">
              {linkPayResults.map((result) => (
                <div key={result.receiptNumber} className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 border border-morandi-gold/20">
                  <span className="text-sm font-medium text-morandi-primary min-w-[120px]">
                    {result.receiptNumber}
                  </span>
                  <Input
                    value={result.link}
                    readOnly
                    className="flex-1 text-xs bg-morandi-container/30 border-0"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(result.link)
                      setCopiedLink(result.receiptNumber)
                      setTimeout(() => setCopiedLink(null), 2000)
                    }}
                    className="gap-1 text-morandi-gold hover:bg-morandi-gold/10"
                  >
                    {copiedLink === result.receiptNumber ? (
                      <>
                        <Check size={14} />
                        已複製
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        複製
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(result.link, '_blank')}
                    className="gap-1 text-morandi-secondary hover:bg-morandi-container/50"
                  >
                    <ExternalLink size={14} />
                    開啟
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 操作按鈕 */}
        <div className="flex justify-end space-x-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={handleCancel} className="gap-2">
            <X size={16} />
            {linkPayResults.length > 0 ? '關閉' : '取消'}
          </Button>
          {linkPayResults.length === 0 && (
            <Button
              onClick={handleSubmit}
              disabled={!formData.tour_id || !formData.order_id || paymentItems.length === 0}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
            >
              <Save size={16} />
              <span className="inline-flex items-center gap-1">
                新增收款單 (共 {paymentItems.length} 項，<CurrencyCell amount={totalAmount} className="inline" />)
              </span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
