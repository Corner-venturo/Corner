/**
 * 收款單詳情對話框
 *
 * 功能：
 * 1. 查看收款單完整資訊
 * 2. 待確認狀態可輸入實收金額並確認
 * 3. 編輯部分欄位
 * 4. LinkPay 收款方式可建立付款連結
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
import { useReceiptStore, useOrderStore, useLinkPayLogStore } from '@/stores'
import { CheckCircle, Edit2, DollarSign, User, FileText, CreditCard, Link2, ExternalLink, Copy, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { alert, confirm } from '@/lib/ui/alert-dialog'
import { RECEIPT_TYPE_LABELS, ReceiptType } from '@/types/receipt.types'
import { DateCell, CurrencyCell } from '@/components/table-cells'
import type { Receipt } from '@/types/receipt.types'
import { logger } from '@/lib/utils/logger'
import { CreateLinkPayDialog } from './CreateLinkPayDialog'
import { LinkPayLogsTable } from './LinkPayLogsTable'

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
  const { update: updateReceipt, delete: deleteReceipt, fetchAll: fetchReceipts } = useReceiptStore()
  const { items: orders, update: updateOrder } = useOrderStore()
  const { items: receipts } = useReceiptStore()
  const { items: allLinkPayLogs, fetchAll: fetchLinkPayLogs } = useLinkPayLogStore()

  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actualAmount, setActualAmount] = useState<number>(0)
  const [note, setNote] = useState('')
  const [showLinkPayDialog, setShowLinkPayDialog] = useState(false)

  // 取得此收款單的 LinkPay 記錄
  const linkPayLogs = receipt
    ? allLinkPayLogs.filter(log => log.receipt_number === receipt.receipt_number)
    : []

  // 當 receipt 改變時重置狀態
  useEffect(() => {
    if (receipt) {
      setActualAmount(receipt.actual_amount || receipt.receipt_amount)
      setNote(receipt.note || '')
      setIsEditing(false)
    }
  }, [receipt])

  // 載入 LinkPay 記錄
  useEffect(() => {
    if (open && receipt && Number(receipt.receipt_type) === ReceiptType.LINK_PAY) {
      fetchLinkPayLogs()
    }
  }, [open, receipt, fetchLinkPayLogs])

  if (!receipt) return null

  const isPending = Number(receipt.status) === 0
  const isConfirmed = Number(receipt.status) === 1
  const isLinkPay = Number(receipt.receipt_type) === ReceiptType.LINK_PAY

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
        status: '1',
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

  // 刪除收款單
  const handleDelete = async () => {
    const confirmed = await confirm(
      `確定要刪除收款單 ${receipt.receipt_number} 嗎？此操作無法復原。`,
      { title: '刪除收款單', type: 'warning' }
    )
    if (!confirmed) return

    setIsSubmitting(true)
    try {
      await deleteReceipt(receipt.id)
      await fetchReceipts()
      await alert('收款單已刪除', 'success')
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      logger.error('刪除收款單失敗:', error)
      void alert('刪除失敗，請稍後再試', 'error')
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

          {/* LinkPay 區塊 */}
          {isLinkPay && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">LinkPay 付款連結</span>
                </div>
                {isPending && (
                  <Button
                    size="sm"
                    onClick={() => setShowLinkPayDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    建立付款連結
                  </Button>
                )}
              </div>

              {/* 最新付款連結（直接從收款單取得） */}
              {receipt.link && (
                <div className="bg-white border border-blue-300 rounded-lg p-3">
                  <label className="text-xs font-medium text-blue-700 block mb-2">
                    付款連結（可直接複製）
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={receipt.link}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded font-mono"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(receipt.link || '')
                        void alert('連結已複製！', 'success')
                      }}
                      className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      複製
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(receipt.link || '', '_blank')}
                      className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      開啟
                    </Button>
                  </div>
                </div>
              )}

              {/* 顯示 LinkPay 歷史記錄 */}
              {linkPayLogs.length > 0 ? (
                <details className="text-sm">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                    查看歷史記錄 ({linkPayLogs.length} 筆)
                  </summary>
                  <div className="mt-2">
                    <LinkPayLogsTable logs={linkPayLogs} />
                  </div>
                </details>
              ) : !receipt.link && (
                <div className="text-sm text-blue-600">
                  尚未建立付款連結，請點擊上方按鈕建立。
                </div>
              )}
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

        <DialogFooter className="mt-4 flex justify-between">
          <div>
            {/* 刪除按鈕 - 只有待確認狀態才能刪除 */}
            {isPending && (
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="text-morandi-red border-morandi-red hover:bg-morandi-red hover:text-white gap-2"
              >
                <Trash2 className="h-4 w-4" />
                刪除
              </Button>
            )}
          </div>

          <div className="flex gap-2">
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
          </div>
        </DialogFooter>
      </DialogContent>

      {/* LinkPay 建立對話框 */}
      {isLinkPay && (
        <CreateLinkPayDialog
          isOpen={showLinkPayDialog}
          onClose={() => setShowLinkPayDialog(false)}
          receipt={receipt}
          onSuccess={() => {
            fetchLinkPayLogs()
            onSuccess?.()
          }}
        />
      )}
    </Dialog>
  )
}
