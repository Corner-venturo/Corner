/**
 * Add Receipt Dialog (Table-based Input)
 * 新增收款單對話框（表格式輸入，參考請款管理風格）
 */

'use client'

import { logger } from '@/lib/utils/logger'
import { getTodayString } from '@/lib/utils/format-date'
import { useEffect, useState } from 'react'
import { Plus, Save, X, Copy, ExternalLink, Check, Trash2, Lock } from 'lucide-react'
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
import { confirm } from '@/lib/ui/alert-dialog'
import { usePaymentForm } from '../hooks/usePaymentForm'
import { PaymentItemRow } from './PaymentItemRow'
import { RECEIPT_TYPES, type ReceiptType } from '../types'
import { Input } from '@/components/ui/input'
import type { Receipt } from '@/stores'

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
  /** 編輯模式：傳入要編輯的收款單 */
  editingReceipt?: Receipt | null
  /** 編輯模式：更新回呼 */
  onUpdate?: (receiptId: string, data: Partial<Receipt>) => Promise<void>
  /** 編輯模式：刪除回呼 */
  onDelete?: (receiptId: string) => Promise<void>
}

export function AddReceiptDialog({ open, onOpenChange, onSuccess, defaultTourId, defaultOrderId, editingReceipt, onUpdate, onDelete }: AddReceiptDialogProps) {
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
    setPaymentItems,
  } = usePaymentForm()

  // 是否為編輯模式
  const isEditMode = !!editingReceipt

  // 是否為已確認狀態（已確認的收款單不可編輯或刪除）
  const isConfirmed = editingReceipt?.status === '1'

  // 提交狀態（防止重複點擊）
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // LinkPay 結果
  const [linkPayResults, setLinkPayResults] = useState<LinkPayResult[]>([])
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  // 當對話框開啟時：載入資料、重置表單、設定預設值
  useEffect(() => {
    if (!open) return

    // 重置狀態
    setIsSubmitting(false)
    setLinkPayResults([])
    setCopiedLink(null)

    const initialize = async () => {
      const { invalidateTours, invalidateOrders } = await import('@/data')
      const { supabase } = await import('@/lib/supabase/client')

      // 確保 SWR 快取已載入
      await Promise.all([
        invalidateTours(),
        invalidateOrders(),
      ])

      // 編輯模式：載入收款單資料和項目
      if (editingReceipt) {
        setFormData({
          tour_id: editingReceipt.tour_id || '',
          order_id: editingReceipt.order_id || '',
          receipt_date: editingReceipt.receipt_date || getTodayString(),
        })
        
        // 從 receipt_items 載入項目
        const { data: receiptItems } = await supabase
          .from('receipt_items')
          .select('*')
          .eq('receipt_id', editingReceipt.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: true })

        if (receiptItems && receiptItems.length > 0) {
          // 有 receipt_items，用新的結構
          setPaymentItems(receiptItems.map(item => ({
            id: item.id,
            receipt_type: (item.receipt_type ?? 0) as ReceiptType,
            transaction_date: item.created_at?.split('T')[0] || getTodayString(),
            receipt_account: item.receipt_account || '',
            notes: item.notes || '',
            amount: Number(item.amount) || 0,
            email: item.email || '',
            payment_name: item.payment_name || '',
            pay_dateline: item.pay_dateline || '',
            handler_name: item.handler_name || '',
            account_info: item.account_info || '',
            fees: item.fees || 0,
            card_last_four: item.card_last_four || '',
            auth_code: item.auth_code || '',
            check_number: item.check_number || '',
            check_bank: item.check_bank || '',
          })))
        } else {
          // 舊資料：從 receipt 主表載入（向下相容）
          setPaymentItems([{
            id: editingReceipt.id,
            receipt_type: editingReceipt.receipt_type ?? 0,
            transaction_date: editingReceipt.receipt_date || getTodayString(),
            receipt_account: editingReceipt.receipt_account || '',
            notes: editingReceipt.notes || '',
            amount: editingReceipt.receipt_amount || 0,
            email: editingReceipt.email || '',
            payment_name: editingReceipt.payment_name || '',
            pay_dateline: editingReceipt.pay_dateline || '',
            handler_name: editingReceipt.handler_name || '',
            account_info: editingReceipt.account_info || '',
            fees: editingReceipt.fees || 0,
            card_last_four: editingReceipt.card_last_four || '',
            auth_code: editingReceipt.auth_code || '',
            check_number: editingReceipt.check_number || '',
            check_bank: editingReceipt.check_bank || '',
          }])
        }
        return
      }

      // 如果有預設訂單 ID，直接查詢該訂單取得團 ID
      if (defaultOrderId) {
        const { data: order } = await supabase
          .from('orders')
          .select('tour_id')
          .eq('id', defaultOrderId)
          .single()
        const tourId = order?.tour_id || defaultTourId || ''
        setFormData({
          tour_id: tourId,
          order_id: defaultOrderId,
          receipt_date: getTodayString(),
        })
      } else if (defaultTourId) {
        // 只有團 ID，沒有訂單 ID
        setFormData({
          tour_id: defaultTourId,
          order_id: '',
          receipt_date: getTodayString(),
        })
      } else {
        // 沒有任何預設值，重置表單
        resetForm()
      }
    }

    initialize()
  }, [open, defaultTourId, defaultOrderId, resetForm, setFormData, editingReceipt, setPaymentItems])

  // 如果只有一個訂單，自動帶入（編輯模式除外）
  useEffect(() => {
    if (!isEditMode && formData.tour_id && filteredOrders.length === 1 && !formData.order_id) {
      const order = filteredOrders[0]
      setFormData(prev => ({ ...prev, order_id: order.id }))
    }
  }, [isEditMode, formData.tour_id, filteredOrders, formData.order_id, setFormData])

  const handleSubmit = async () => {
    // 防止重複提交
    if (isSubmitting) return

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

    setIsSubmitting(true)

    try {
      // 編輯模式：更新收款單主表 + 管理收款項目
      if (isEditMode && editingReceipt && onUpdate) {
        const { createReceiptItem, updateReceiptItem, deleteReceiptItem } = await import('@/data')
        const { supabase } = await import('@/lib/supabase/client')
        const { useAuthStore } = await import('@/stores')

        const authStore = useAuthStore.getState()
        const user = authStore.user

        if (!user?.workspace_id) {
          throw new Error('無法取得 workspace ID')
        }

        // 計算總金額
        const totalAmount = paymentItems.reduce((sum, item) => sum + (item.amount || 0), 0)

        // 1. 更新收款單主表
        await onUpdate(editingReceipt.id, {
          tour_id: formData.tour_id || null,
          order_id: formData.order_id,
          receipt_amount: totalAmount,
          amount: totalAmount,
          total_amount: totalAmount,
        })

        // 2. 取得現有的 receipt_items
        const { data: existingItems } = await supabase
          .from('receipt_items')
          .select('id')
          .eq('receipt_id', editingReceipt.id)
          .is('deleted_at', null)

        const existingItemIds = new Set(existingItems?.map(i => i.id) || [])

        // 收款方式轉換
        const paymentMethodMap: Record<number, string> = {
          0: 'transfer',
          1: 'cash',
          2: 'card',
          3: 'check',
          4: 'linkpay',
        }

        // 3. 處理每個項目
        for (const item of paymentItems) {
          const paymentMethod = paymentMethodMap[item.receipt_type] || 'transfer'
          const itemData = {
            tour_id: formData.tour_id || null,
            order_id: formData.order_id,
            customer_id: selectedOrder?.customer_id || null,
            amount: item.amount,
            payment_method: paymentMethod,
            receipt_type: item.receipt_type,
            receipt_account: item.receipt_account || null,
            handler_name: item.handler_name || null,
            account_info: item.account_info || null,
            fees: item.fees || null,
            card_last_four: item.card_last_four || null,
            auth_code: item.auth_code || null,
            check_number: item.check_number || null,
            check_bank: item.check_bank || null,
            email: item.email || null,
            payment_name: item.payment_name || null,
            pay_dateline: item.pay_dateline || null,
            notes: item.notes || null,
            updated_by: user.id,
          }

          if (item.id && existingItemIds.has(item.id)) {
            // 更新現有項目
            await updateReceiptItem(item.id, itemData)
            existingItemIds.delete(item.id)
          } else {
            // 新增項目
            await createReceiptItem({
              receipt_id: editingReceipt.id,
              workspace_id: user.workspace_id,
              ...itemData,
              actual_amount: 0,
              status: '0',
              created_by: user.id,
              deleted_at: null,
              link: null,
              linkpay_order_number: null,
              check_date: null,
            })
          }
        }

        // 4. 刪除被移除的項目
        for (const itemId of existingItemIds) {
          await deleteReceiptItem(itemId)
        }

        toast({
          title: '收款單更新成功',
          description: `已更新收款單 ${editingReceipt.receipt_number}（${paymentItems.length} 個項目）`,
        })
        resetForm()
        onOpenChange(false)
        onSuccess?.()
        return
      }

      // 新增模式：建立一張收款單 + 多個收款項目
      const { useAuthStore } = await import('@/stores')
      const { createReceipt, updateReceipt } = await import('@/data')
      const { createReceiptItem } = await import('@/data')
      const { generateReceiptNumber } = await import('@/lib/utils/receipt-number-generator')
      const { supabase } = await import('@/lib/supabase/client')

      const authStore = useAuthStore.getState()
      const user = authStore.user

      if (!user?.workspace_id) {
        throw new Error('無法取得 workspace ID')
      }

      // 取得團號（從訂單關聯的旅遊團，或使用表單中選擇的團）
      const tourId = selectedOrder?.tour_id || formData.tour_id
      const tour = tours.find(t => t.id === tourId)
      const tourCode = tour?.code || ''
      if (!tourCode) {
        throw new Error('無法取得團號，請確認訂單已關聯旅遊團')
      }

      // 查詢已存在的收款單編號（用於生成編號）
      const { data: existingReceipts } = await supabase
        .from('receipts')
        .select('receipt_number')
        .like('receipt_number', `${tourCode}-R%`)

      // 生成收款單號
      const receiptNumber = generateReceiptNumber(
        tourCode,
        existingReceipts?.filter(r => r.receipt_number?.startsWith(`${tourCode}-R`)) || []
      )

      // 計算總金額
      const totalAmount = paymentItems.reduce((sum, item) => sum + (item.amount || 0), 0)

      // 1. 建立收款單主表（基本資訊）
      const createdReceipt = await createReceipt({
        receipt_number: receiptNumber,
        workspace_id: user.workspace_id,
        order_id: formData.order_id,
        tour_id: tourId || null,
        customer_id: selectedOrder?.customer_id || null,
        order_number: selectedOrder?.order_number || '',
        tour_name: selectedOrder?.tour_name || tour?.name || '',
        // 主表用第一個項目的日期
        payment_date: paymentItems[0]?.transaction_date || new Date().toISOString().split('T')[0],
        payment_method: 'transfer', // 主表預設
        receipt_date: paymentItems[0]?.transaction_date || new Date().toISOString().split('T')[0],
        receipt_type: 0,
        receipt_amount: totalAmount,
        amount: totalAmount,
        total_amount: totalAmount,
        actual_amount: 0,
        status: '0',
        // 主表不存項目詳細資料，這些移到 receipt_items
        receipt_account: null,
        email: null,
        payment_name: null,
        pay_dateline: null,
        handler_name: null,
        account_info: null,
        fees: null,
        card_last_four: null,
        auth_code: null,
        check_number: null,
        check_bank: null,
        notes: null,
        check_date: null,
        created_by: user.id,
        updated_by: user.id,
        deleted_at: null,
        link: null,
        linkpay_order_number: null,
      })

      if (!createdReceipt?.id) {
        throw new Error('建立收款單失敗')
      }

      // 2. 為每個項目建立 receipt_item
      const newLinkPayResults: LinkPayResult[] = []
      const paymentMethodMap: Record<number, string> = {
        0: 'transfer',
        1: 'cash',
        2: 'card',
        3: 'check',
        4: 'linkpay',
      }

      for (const item of paymentItems) {
        const paymentMethod = paymentMethodMap[item.receipt_type] || 'transfer'

        const createdItem = await createReceiptItem({
          receipt_id: createdReceipt.id,
          workspace_id: user.workspace_id,
          tour_id: tourId || null,
          order_id: formData.order_id,
          customer_id: selectedOrder?.customer_id || null,
          amount: item.amount,
          actual_amount: 0,
          payment_method: paymentMethod,
          receipt_type: item.receipt_type,
          receipt_account: item.receipt_account || null,
          handler_name: item.handler_name || null,
          account_info: item.account_info || null,
          fees: item.fees || null,
          card_last_four: item.card_last_four || null,
          auth_code: item.auth_code || null,
          check_number: item.check_number || null,
          check_bank: item.check_bank || null,
          check_date: null,
          email: item.email || null,
          payment_name: item.payment_name || null,
          pay_dateline: item.pay_dateline || null,
          link: null,
          linkpay_order_number: null,
          notes: item.notes || null,
          status: '0',
          created_by: user.id,
          updated_by: user.id,
          deleted_at: null,
        })

        // 如果是 LinkPay，呼叫 API 產生付款連結
        if (item.receipt_type === RECEIPT_TYPES.LINK_PAY && createdItem?.id) {
          try {
            const response = await fetch('/api/linkpay', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                receipt_number: receiptNumber,
                user_name: item.receipt_account || '',
                email: item.email || '',
                payment_name: item.payment_name || tourCode,
                create_user: user.id,
                amount: item.amount,
                end_date: item.pay_dateline || '',
              }),
            })
            const data = await response.json()
            if (data.success && data.data?.payment_link) {
              newLinkPayResults.push({
                receiptNumber,
                link: data.data.payment_link
              })
              // 更新 receipt_item 的 link 欄位
              const { updateReceiptItem } = await import('@/data')
              await updateReceiptItem(createdItem.id, { link: data.data.payment_link })
            }
          } catch (linkPayError) {
            logger.error('LinkPay API 錯誤:', linkPayError)
          }
        }
      }

      // 設定 LinkPay 結果
      if (newLinkPayResults.length > 0) {
        setLinkPayResults(newLinkPayResults)
      }

      // 更新訂單的已收金額和付款狀態
      if (formData.order_id && totalAmount > 0) {
        const { supabase } = await import('@/lib/supabase/client')

        // 先取得訂單的總金額
        const { data: orderData } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('id', formData.order_id)
          .single()

        const orderTotalAmount = orderData?.total_amount || 0

        // 計算該訂單所有已確認收款的總金額
        const { data: orderReceipts } = await supabase
          .from('receipts')
          .select('actual_amount, status')
          .eq('order_id', formData.order_id)

        const totalPaid = (orderReceipts || [])
          .filter(r => r.status === '1') // 只計算已確認的
          .reduce((sum, r) => sum + (r.actual_amount || 0), 0)

        // 加上這次新增的收款（待確認狀態，但已收金額先累計）
        const newTotalPaid = totalPaid + totalAmount

        // 計算付款狀態
        let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid'
        if (newTotalPaid >= orderTotalAmount && orderTotalAmount > 0) {
          paymentStatus = 'paid'
        } else if (newTotalPaid > 0) {
          paymentStatus = 'partial'
        }

        // 更新訂單的已收金額和付款狀態
        await supabase
          .from('orders')
          .update({
            paid_amount: newTotalPaid,
            remaining_amount: Math.max(0, orderTotalAmount - newTotalPaid),
            payment_status: paymentStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', formData.order_id)

        logger.log('訂單已收金額和狀態已更新:', {
          order_id: formData.order_id,
          paid_amount: newTotalPaid,
          payment_status: paymentStatus,
        })
      }

      // 更新團的財務數據
      if (tourId) {
        const { supabase } = await import('@/lib/supabase/client')

        // 取得該團所有訂單 ID
        const { data: tourOrdersData } = await supabase
          .from('orders')
          .select('id')
          .eq('tour_id', tourId)

        const orderIds = (tourOrdersData || []).map(o => o.id)

        // 查詢所有相關收款：透過 order_id 或直接透過 tour_id
        let receiptsQuery = supabase
          .from('receipts')
          .select('actual_amount, receipt_amount, status')

        if (orderIds.length > 0) {
          // 有訂單：查詢 order_id 在訂單列表中 OR tour_id 直接等於該團
          receiptsQuery = receiptsQuery.or(`order_id.in.(${orderIds.join(',')}),tour_id.eq.${tourId}`)
        } else {
          // 沒有訂單：只查詢直接關聯到團的收款
          receiptsQuery = receiptsQuery.eq('tour_id', tourId)
        }

        const { data: receiptsData } = await receiptsQuery

        // 計算總收入（已確認用 actual_amount，待確認用 receipt_amount）
        const totalRevenue = (receiptsData || [])
          .reduce((sum, r) => {
            if (r.status === '1') {
              return sum + (r.actual_amount || 0)
            } else {
              return sum + (r.receipt_amount || 0)
            }
          }, 0)

        // 取得當前成本
        const { data: currentTour } = await supabase
          .from('tours')
          .select('total_cost')
          .eq('id', tourId)
          .single()

        const totalCost = currentTour?.total_cost || 0
        const profit = totalRevenue - totalCost

        // 更新 tour
        await supabase
          .from('tours')
          .update({
            total_revenue: totalRevenue,
            profit: profit,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tourId)

        logger.log('團財務數據已更新:', { tour_id: tourId, total_revenue: totalRevenue, profit })
      }

      // 刷新 SWR 快取讓 UI 更新
      const { mutate } = await import('swr')
      await mutate(`tour-${tourId}`)
      await mutate('tours')
      await mutate('orders')
      await mutate('receipts')

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
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    resetForm()
    setLinkPayResults([])
    setCopiedLink(null)
    onOpenChange(false)
  }

  const handleDelete = async () => {
    if (!editingReceipt || !onDelete) return

    const confirmed = await confirm(
      `確定要刪除收款單 ${editingReceipt.receipt_number} 嗎？此操作無法復原。`,
      { type: 'warning', title: '刪除收款單' }
    )

    if (!confirmed) return

    setIsDeleting(true)
    try {
      await onDelete(editingReceipt.id)
      toast({
        title: '刪除成功',
        description: `收款單 ${editingReceipt.receipt_number} 已刪除`,
      })
      resetForm()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      logger.error('刪除收款單失敗:', error)
      toast({
        title: '刪除失敗',
        description: '請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent level={2} className="max-w-[95vw] w-[95vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditMode ? '編輯收款單' : '新增收款單'}
            {isConfirmed && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-morandi-green/20 text-morandi-green text-xs font-medium">
                <Lock size={12} />
                已確認
              </span>
            )}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {isConfirmed
              ? `${editingReceipt?.receipt_number} - 已確認的收款單無法編輯或刪除`
              : isEditMode
                ? `編輯 ${editingReceipt?.receipt_number}`
                : '收款單號將自動產生'
            }
          </p>
        </DialogHeader>

        {/* 基本資訊 */}
        <div className="flex items-end gap-4">
          {/* 選擇團體 */}
          <div className="w-[300px]">
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
              className="mt-1 bg-card"
            />
          </div>

          {/* 選擇訂單 */}
          <div className="w-[350px]">
            <Label className="text-sm font-medium text-muted-foreground">訂單 *</Label>
            <Select
              disabled={!formData.tour_id || filteredOrders.length === 0}
              value={formData.order_id}
              onValueChange={value => setFormData(prev => ({ ...prev, order_id: value }))}
            >
              <SelectTrigger className="mt-1 bg-card border-morandi-container/30">
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

        {/* 收款項目 - 文青風表格 */}
        <div className="flex-1 flex flex-col overflow-hidden pt-4 border-t border-morandi-container/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-morandi-primary">收款項目</h3>
            {/* 未確認的收款單都可以新增/刪除項目 */}
            {!isConfirmed && (
              <Button onClick={addPaymentItem} size="sm" variant="ghost" className="text-morandi-gold hover:bg-morandi-gold/10">
                <Plus size={14} className="mr-2" />
                新增項目
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            {/* 項目表格 */}
            <div className="border border-border rounded-lg overflow-hidden bg-card">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-xs text-morandi-primary font-medium bg-morandi-container/50">
                    <th className="text-left py-2.5 px-3 border-b border-r border-border" style={{ width: '110px' }}>收款方式</th>
                    <th className="text-left py-2.5 px-3 border-b border-r border-border" style={{ width: '150px' }}>交易日期</th>
                    <th className="text-left py-2.5 px-3 border-b border-r border-border" style={{ width: '180px' }}>付款資訊</th>
                    <th className="text-left py-2.5 px-3 border-b border-r border-border">備註</th>
                    <th className="text-right py-2.5 px-3 border-b border-r border-border" style={{ width: '120px' }}>金額</th>
                    <th className="border-b border-border" style={{ width: '50px' }}></th>
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
                      contact_email: (selectedOrder as { contact_email?: string }).contact_email || undefined,
                    } : undefined}
                  />
                ))}
              </tbody>
              </table>
            </div>

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
                <div key={result.receiptNumber} className="flex items-center gap-3 bg-card rounded-lg px-4 py-3 border border-morandi-gold/20">
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
        <div className="flex justify-between items-center pt-4 border-t border-border">
          {/* 左側：總金額 + 刪除按鈕 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-morandi-secondary">總金額</span>
              <span className="text-lg font-semibold text-morandi-gold w-[120px]">
                NT$ {totalAmount.toLocaleString()}
              </span>
            </div>
            {/* 刪除按鈕：只在編輯模式且未確認時顯示 */}
            {isEditMode && !isConfirmed && onDelete && (
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isDeleting}
                className="gap-2 text-morandi-red border-morandi-red hover:bg-morandi-red hover:text-white"
              >
                <Trash2 size={16} />
                {isDeleting ? '刪除中...' : '刪除'}
              </Button>
            )}
          </div>

          {/* 右側：按鈕 */}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleCancel} className="gap-2">
              <X size={16} />
              {linkPayResults.length > 0 ? '關閉' : (isConfirmed ? '關閉' : '取消')}
            </Button>
            {linkPayResults.length === 0 && !isConfirmed && (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.tour_id || !formData.order_id || paymentItems.length === 0}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
              >
                <Save size={16} />
                {isSubmitting
                  ? (isEditMode ? '更新中...' : '建立中...')
                  : (isEditMode ? '更新收款單' : `新增收款單 (共 ${paymentItems.length} 項)`)
                }
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
