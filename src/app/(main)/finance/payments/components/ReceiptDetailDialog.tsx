/**
 * 收款單詳情對話框
 *
 * 功能：
 * 1. 查看收款單完整資訊
 * 2. 待確認狀態可輸入實收金額並確認
 * 3. 編輯部分欄位
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useReceiptStore, useOrderStore } from '@/stores'
import { CheckCircle, Edit2, DollarSign, User, FileText, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { alert } from '@/lib/ui/alert-dialog'
import { RECEIPT_TYPE_LABELS } from '@/types/receipt.types'
import { DateCell, CurrencyCell } from '@/components/table-cells'
import type { Receipt } from '@/types/receipt.types'
import { logger } from '@/lib/utils/logger'

interface ReceiptDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receipt: Receipt | null
  onSuccess?: () => void
}

export function ReceiptDetailDialog({
  open,
  onOpenChange,
  receipt,
  onSuccess,
}: ReceiptDetailDialogProps) {
  const { update: updateReceipt, fetchAll: fetchReceipts } = useReceiptStore()
  const { items: orders, update: updateOrder } = useOrderStore()
  const { items: receipts } = useReceiptStore()

  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actualAmount, setActualAmount] = useState<number>(0)
  const [note, setNote] = useState('')

  // 當 receipt 改變時重置狀態
  useEffect(() => {
    if (receipt) {
      setActualAmount(receipt.actual_amount || receipt.receipt_amount)
      setNote(receipt.note || '')
      setIsEditing(false)
    }
  }, [receipt])

  if (!receipt) return null

  const isPending = Number(receipt.status) === 0
  const isConfirmed = Number(receipt.status) === 1

  // 確認收款
  const handleConfirm = async () => {
    if (actualAmount <= 0) {
      void alert('實收金額不能為 0', 'warning')
      return
    }

    setIsSubmitting(true)

    try {
      // 更新收款單
      await updateReceipt(receipt.id, {
        actual_amount: actualAmount,
        status: 1,
        note: note || receipt.note,
      })

      // 更新訂單的已收款金額
      if (receipt.order_id) {
        const order = orders.find(o => o.id === receipt.order_id)
        if (order) {
          // 計算該訂單所有已確認收款的總金額
          const allConfirmedReceipts = receipts.filter(
            r => r.order_id === receipt.order_id && Number(r.status) === 1 && r.id !== receipt.id
          )
          const previousConfirmed = allConfirmedReceipts.reduce(
            (sum, r) => sum + (r.actual_amount || 0),
            0
          )
          const newPaidAmount = previousConfirmed + actualAmount

          // 計算付款狀態
          const totalAmount = order.total_amount || 0
          let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid'
          if (newPaidAmount >= totalAmount) {
            paymentStatus = 'paid'
          } else if (newPaidAmount > 0) {
            paymentStatus = 'partial'
          }

          await updateOrder(receipt.order_id, {
            paid_amount: newPaidAmount,
            remaining_amount: Math.max(0, totalAmount - newPaidAmount),
            payment_status: paymentStatus,
          })
        }
      }

      await fetchReceipts()
      await alert('收款確認成功', 'success')
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      logger.error('確認收款失敗:', error)
      void alert('確認失敗，請稍後再試', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 儲存編輯
  const handleSave = async () => {
    setIsSubmitting(true)

    try {
      await updateReceipt(receipt.id, {
        note: note,
      })

      await fetchReceipts()
      await alert('儲存成功', 'success')
      setIsEditing(false)
      onSuccess?.()
    } catch (error) {
      logger.error('儲存失敗:', error)
      void alert('儲存失敗，請稍後再試', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-morandi-gold" />
            收款單詳情
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 狀態標籤 */}
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                isPending && 'bg-morandi-gold/20 text-morandi-gold',
                isConfirmed && 'bg-morandi-green/20 text-morandi-green'
              )}
            >
              {isPending ? '待確認' : '已確認'}
            </span>
            {!isEditing && isConfirmed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-morandi-secondary"
              >
                <Edit2 className="h-4 w-4 mr-1" />
                編輯
              </Button>
            )}
          </div>

          {/* 基本資訊 */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-morandi-secondary">收款單號</div>
              <div className="font-medium text-morandi-primary">{receipt.receipt_number}</div>
            </div>
            <div className="space-y-1">
              <div className="text-morandi-secondary">收款日期</div>
              <DateCell date={receipt.receipt_date} className="font-medium text-morandi-primary" />
            </div>
            <div className="space-y-1">
              <div className="text-morandi-secondary">訂單編號</div>
              <div className="font-medium text-morandi-primary">{receipt.order_number || '-'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-morandi-secondary">收款方式</div>
              <div className="font-medium text-morandi-primary flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                {RECEIPT_TYPE_LABELS[receipt.receipt_type] || '未知'}
              </div>
            </div>
          </div>

          {/* 團名 */}
          <div className="text-sm space-y-1">
            <div className="text-morandi-secondary">團名</div>
            <div className="font-medium text-morandi-primary">{receipt.tour_name || '-'}</div>
          </div>

          {/* 付款人 */}
          {receipt.receipt_account && (
            <div className="text-sm space-y-1">
              <div className="text-morandi-secondary">付款人</div>
              <div className="font-medium text-morandi-primary flex items-center gap-1">
                <User className="h-4 w-4" />
                {receipt.receipt_account}
              </div>
            </div>
          )}

          {/* 金額區塊 */}
          <div className="bg-morandi-container/20 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-morandi-secondary">應收金額</span>
              <CurrencyCell amount={receipt.receipt_amount} className="text-lg font-semibold text-morandi-primary" />
            </div>

            {isPending ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-morandi-primary">
                  實收金額 <span className="text-morandi-red">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-morandi-gold" />
                  <Input
                    type="number"
                    value={actualAmount || ''}
                    onChange={e => setActualAmount(parseFloat(e.target.value) || 0)}
                    className="text-lg font-semibold"
                    placeholder="輸入實收金額"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-morandi-secondary">實收金額</span>
                <CurrencyCell amount={receipt.actual_amount || 0} className="text-lg font-semibold text-morandi-green" />
              </div>
            )}

            {/* 差額提示 */}
            {isPending && actualAmount !== receipt.receipt_amount && actualAmount > 0 && (
              <div
                className={cn(
                  'text-sm px-3 py-2 rounded flex items-center gap-1',
                  actualAmount < receipt.receipt_amount
                    ? 'bg-morandi-red/10 text-morandi-red'
                    : 'bg-morandi-gold/10 text-morandi-gold'
                )}
              >
                {actualAmount < receipt.receipt_amount ? '少收' : '多收'}
                <CurrencyCell
                  amount={Math.abs(receipt.receipt_amount - actualAmount)}
                  className={actualAmount < receipt.receipt_amount ? 'text-morandi-red' : 'text-morandi-gold'}
                />
              </div>
            )}
          </div>

          {/* 備註 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-morandi-primary">備註</label>
            {isEditing || isPending ? (
              <Textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="輸入備註..."
                rows={3}
              />
            ) : (
              <div className="text-sm text-morandi-primary bg-morandi-container/10 rounded-lg p-3 min-h-[60px]">
                {receipt.note || '無備註'}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {isEditing ? '取消' : '關閉'}
          </Button>

          {isPending && (
            <Button
              onClick={handleConfirm}
              disabled={isSubmitting || actualAmount <= 0}
              className="bg-morandi-green hover:bg-morandi-green/90"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isSubmitting ? '確認中...' : '確認收款'}
            </Button>
          )}

          {isEditing && (
            <Button
              onClick={handleSave}
              disabled={isSubmitting}
              className="bg-morandi-gold hover:bg-morandi-gold-hover"
            >
              {isSubmitting ? '儲存中...' : '儲存'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
