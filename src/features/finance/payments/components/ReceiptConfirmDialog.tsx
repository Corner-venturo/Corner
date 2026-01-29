/**
 * Receipt Confirm Dialog
 * 收款單確認對話框（與新增介面相同風格）
 */

'use client'

import { useState } from 'react'
import { Check, X, AlertCircle, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { confirm } from '@/lib/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { RECEIPT_TYPE_OPTIONS } from '../types'
import { useAuthStore } from '@/stores'
import { deleteReceipt } from '@/data'
import type { Receipt } from '@/types/receipt.types'

interface ReceiptConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receipt: Receipt | null
  onConfirm: (receiptId: string, actualAmount: number, isAbnormal: boolean) => Promise<void>
  onSuccess?: () => void
}

export function ReceiptConfirmDialog({
  open,
  onOpenChange,
  receipt,
  onConfirm,
  onSuccess,
}: ReceiptConfirmDialogProps) {
  const { toast } = useToast()
  const { user } = useAuthStore()
  const [isConfirming, setIsConfirming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showAbnormalInput, setShowAbnormalInput] = useState(false)
  const [abnormalAmount, setAbnormalAmount] = useState('')

  if (!receipt) return null

  // 檢查是否可以刪除：會計管理員或建立者
  const isAccountant = user?.roles?.some(role =>
    ['super_admin', 'admin', 'accountant'].includes(role)
  )
  const isCreator = user?.id === receipt.created_by
  const canDelete = isAccountant || isCreator

  const receiptTypeLabel = RECEIPT_TYPE_OPTIONS.find(
    opt => opt.value === receipt.receipt_type
  )?.label || '未知'

  const isConfirmed = receipt.status === '1'

  // 確認金額正確
  const handleConfirmCorrect = async () => {
    setIsConfirming(true)
    try {
      await onConfirm(receipt.id, receipt.receipt_amount || 0, false)
      toast({
        title: '確認成功',
        description: '收款金額已確認',
      })
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: '確認失敗',
        description: error instanceof Error ? error.message : '請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setIsConfirming(false)
    }
  }

  // 金額異常，輸入實際金額
  const handleConfirmAbnormal = async () => {
    const amount = parseFloat(abnormalAmount)
    if (isNaN(amount) || amount < 0) {
      toast({
        title: '請輸入有效金額',
        variant: 'destructive',
      })
      return
    }

    setIsConfirming(true)
    try {
      await onConfirm(receipt.id, amount, true)
      toast({
        title: '確認成功',
        description: '已記錄實際收款金額，並通知建立者',
      })
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: '確認失敗',
        description: error instanceof Error ? error.message : '請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setIsConfirming(false)
      setShowAbnormalInput(false)
      setAbnormalAmount('')
    }
  }

  const handleClose = () => {
    setShowAbnormalInput(false)
    setAbnormalAmount('')
    onOpenChange(false)
  }

  // 刪除收款單
  const handleDelete = async () => {
    const confirmed = await confirm(
      `確定要刪除收款單 ${receipt.receipt_number} 嗎？此操作無法復原。`,
      { title: '刪除收款單', type: 'error' }
    )

    if (!confirmed) return

    setIsDeleting(true)
    try {
      await deleteReceipt(receipt.id)
      toast({
        title: '刪除成功',
        description: `收款單 ${receipt.receipt_number} 已刪除`,
      })
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: '刪除失敗',
        description: error instanceof Error ? error.message : '請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent level={2} className="max-w-[800px] flex flex-col">
        <DialogHeader>
          <DialogTitle>收款單詳情</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {receipt.receipt_number}
          </p>
        </DialogHeader>

        {/* 基本資訊 */}
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">團名：</span>
            <span className="font-medium">{receipt.tour_name || '-'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">訂單：</span>
            <span className="font-medium">{receipt.order_number || '-'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">狀態：</span>
            <span className={cn(
              'font-medium',
              isConfirmed ? 'text-morandi-green' : 'text-morandi-gold'
            )}>
              {isConfirmed ? '已確認' : '待確認'}
            </span>
          </div>
        </div>

        {/* 收款項目表格 */}
        <div className="border border-border rounded-lg overflow-hidden bg-card mt-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-xs text-morandi-primary font-medium bg-morandi-container/50">
                <th className="text-left py-2.5 px-3 border-b border-r border-border" style={{ width: '100px' }}>收款方式</th>
                <th className="text-left py-2.5 px-3 border-b border-r border-border" style={{ width: '120px' }}>交易日期</th>
                <th className="text-left py-2.5 px-3 border-b border-r border-border">付款人</th>
                <th className="text-left py-2.5 px-3 border-b border-r border-border">備註</th>
                <th className="text-right py-2.5 px-3 border-b border-r border-border" style={{ width: '120px' }}>應收金額</th>
                {!isConfirmed && (
                  <th className="text-center py-2.5 px-3 border-b border-border" style={{ width: '100px' }}>確認</th>
                )}
                {isConfirmed && (
                  <th className="text-right py-2.5 px-3 border-b border-border" style={{ width: '120px' }}>實收金額</th>
                )}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-card">
                <td className="py-3 px-3 border-b border-r border-border text-sm">
                  {receiptTypeLabel}
                </td>
                <td className="py-3 px-3 border-b border-r border-border text-sm">
                  {receipt.receipt_date || '-'}
                </td>
                <td className="py-3 px-3 border-b border-r border-border text-sm">
                  {receipt.receipt_account || '-'}
                </td>
                <td className="py-3 px-3 border-b border-r border-border text-sm text-muted-foreground">
                  {receipt.notes || '-'}
                </td>
                <td className="py-3 px-3 border-b border-r border-border text-sm text-right font-medium">
                  NT$ {(receipt.receipt_amount || 0).toLocaleString()}
                </td>
                {!isConfirmed && (
                  <td className="py-2 px-3 border-b border-border text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleConfirmCorrect}
                        disabled={isConfirming}
                        className="h-8 w-8 p-0 text-morandi-green hover:bg-morandi-green/10"
                        title="金額正確"
                      >
                        <Check size={18} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowAbnormalInput(true)}
                        disabled={isConfirming}
                        className="h-8 w-8 p-0 text-morandi-red hover:bg-morandi-red/10"
                        title="金額異常"
                      >
                        <X size={18} />
                      </Button>
                    </div>
                  </td>
                )}
                {isConfirmed && (
                  <td className={cn(
                    "py-3 px-3 border-b border-border text-sm text-right font-medium",
                    receipt.actual_amount !== receipt.receipt_amount && "text-morandi-red"
                  )}>
                    NT$ {(receipt.actual_amount || 0).toLocaleString()}
                    {receipt.actual_amount !== receipt.receipt_amount && (
                      <AlertCircle size={14} className="inline ml-1" />
                    )}
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        </div>

        {/* 金額異常輸入區 */}
        {showAbnormalInput && (
          <div className="bg-morandi-red/5 border border-morandi-red/20 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={16} className="text-morandi-red" />
              <span className="text-sm font-medium text-morandi-red">金額異常 - 請輸入實際收到金額</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm text-muted-foreground">實收金額</span>
                <Input
                  type="number"
                  value={abnormalAmount}
                  onChange={e => setAbnormalAmount(e.target.value)}
                  placeholder="輸入實際金額"
                  className="max-w-[200px]"
                  autoFocus
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowAbnormalInput(false)
                  setAbnormalAmount('')
                }}
                className="gap-1"
              >
                <X size={14} />
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmAbnormal}
                disabled={isConfirming || !abnormalAmount}
                className="bg-morandi-red hover:bg-morandi-red/90 text-white gap-1"
              >
                <Check size={14} />
                確認異常金額
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              確認後將通知收款單建立者：{receipt.receipt_number} 金額異常
            </p>
          </div>
        )}

        {/* 底部按鈕 */}
        <div className="flex justify-between pt-4 border-t border-border mt-4">
          <div>
            {canDelete && (
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
          <Button variant="outline" onClick={handleClose} className="gap-2">
            <X size={16} />
            關閉
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
