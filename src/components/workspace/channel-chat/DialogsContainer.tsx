'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Trash2, X, Save, Share2, Plus, Calendar, Ticket, Loader2 } from 'lucide-react'
import { logger } from '@/lib/utils/logger'
import { cn } from '@/lib/utils'
import { ShareAdvanceDialog } from '../ShareAdvanceDialog'
import { ShareOrdersDialog } from '../ShareOrdersDialog'
import { ShareTodoDialog } from '../ShareTodoDialog'
import { CreateReceiptDialog } from '../CreateReceiptDialog'
import { CreatePaymentRequestDialog } from '../CreatePaymentRequestDialog'
import { PLACEHOLDER_TEXT } from './constants'

// 機票狀態 Dialog 組件
function TicketStatusDialog({
  open,
  onClose,
  channelId,
}: {
  open: boolean
  onClose: () => void
  channelId?: string
}) {
  const [selectedDays, setSelectedDays] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSendQuery = useCallback(async (days: number) => {
    logger.log('🎫 開始查詢機票狀態, channelId:', channelId, 'days:', days)

    if (!channelId) {
      logger.error('❌ channelId 為空')
      setError('無法取得頻道資訊')
      return
    }

    setSelectedDays(days)
    setLoading(true)
    setError(null)

    try {
      logger.log('📡 發送 API 請求...')
      const response = await fetch('/api/bot/ticket-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: channelId,
          days,
          notify_sales: false, // 不發送給業務，只發到當前頻道
        }),
      })
      logger.log('📥 API 回應狀態:', response.status)
      const data = await response.json()
      logger.log('📦 API 回應資料:', data)

      if (data.success) {
        logger.log('✅ 查詢成功，關閉 Dialog')
        // 如果沒有需要通知的內容，顯示提示訊息
        if (data.message === '無需發送通知' || data.data?.sent === false) {
          setError('✅ 未來 ' + days + ' 天內沒有需要關注的開票狀況')
          setLoading(false)
          setSelectedDays(null)
          return
        }
        // 成功發送，關閉 Dialog
        onClose()
      } else {
        logger.error('❌ API 回傳失敗:', data.message)
        setError(data.message || '查詢失敗')
      }
    } catch (err) {
      logger.error('❌ 查詢機票狀態失敗:', err)
      setError('查詢失敗，請稍後再試')
    } finally {
      setLoading(false)
      setSelectedDays(null)
    }
  }, [channelId, onClose])

  const handleClose = useCallback(() => {
    setSelectedDays(null)
    setError(null)
    onClose()
  }, [onClose])

  const periodOptions = [
    { days: 30, label: '1 個月' },
    { days: 90, label: '3 個月' },
    { days: 180, label: '6 個月' },
  ]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent level={1} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket size={20} className="text-morandi-gold" />
            確認機票狀況
          </DialogTitle>
          <DialogDescription>選擇查詢區間，機器人會回傳未開票旅客清單</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex gap-2">
            {periodOptions.map((option) => (
              <Button
                key={option.days}
                variant="outline"
                size="sm"
                className={cn(
                  'flex-1',
                  selectedDays === option.days && 'border-morandi-gold bg-morandi-gold/10 text-morandi-gold'
                )}
                onClick={() => handleSendQuery(option.days)}
                disabled={loading}
              >
                {loading && selectedDays === option.days ? (
                  <Loader2 size={14} className="animate-spin mr-1" />
                ) : null}
                {option.label}
              </Button>
            ))}
          </div>

          {error && (
            <div className="border border-morandi-red/30 bg-morandi-red/5 rounded-lg p-4">
              <p className="text-sm text-morandi-red text-center">{error}</p>
            </div>
          )}

          <p className="text-xs text-morandi-secondary text-center">
            點擊後機器人會在聊天室回覆查詢結果
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} className="gap-2">
            <X size={16} />
            取消
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
import type { Channel } from '@/stores/workspace/types'
import type { AdvanceItem } from '@/stores/workspace/types'

interface User {
  id: string
  display_name: string
  email?: string
  avatar?: string
}

interface OrderForReceipt {
  id: string
  order_number: string | null
  contact_person: string
  total_amount: number
  paid_amount: number
  gap: number
}

interface DialogsContainerProps {
  // Share Advance Dialog
  showShareAdvanceDialog: boolean
  setShowShareAdvanceDialog: (show: boolean) => void
  selectedChannel: Channel | null
  user: User | null

  // Share Orders Dialog
  showShareOrdersDialog: boolean
  setShowShareOrdersDialog: (show: boolean) => void
  onShareOrdersSuccess: () => void

  // Create Receipt Dialog
  showCreateReceiptDialog: boolean
  setShowCreateReceiptDialog: (show: boolean) => void
  selectedOrder: OrderForReceipt | null
  setSelectedOrder: (order: OrderForReceipt | null) => void

  // Create Payment Dialog
  showCreatePaymentDialog: boolean
  setShowCreatePaymentDialog: (show: boolean) => void
  selectedAdvanceItem: AdvanceItem[] | null
  setSelectedAdvanceItem: (item: AdvanceItem[] | null) => void
  selectedAdvanceListId: string
  setSelectedAdvanceListId: (id: string) => void
  onCreatePaymentSuccess: () => void

  // Settings Dialog
  showSettingsDialog: boolean
  setShowSettingsDialog: (show: boolean) => void
  editChannelName: string
  setEditChannelName: (name: string) => void
  editChannelDescription: string
  setEditChannelDescription: (description: string) => void
  onDeleteChannel: () => Promise<void>
  onUpdateChannel: () => Promise<void>

  // Share Quote Dialog
  showShareQuoteDialog: boolean
  setShowShareQuoteDialog: (show: boolean) => void

  // Share Tour Dialog
  showShareTourDialog: boolean
  setShowShareTourDialog: (show: boolean) => void

  // New Payment Dialog
  showNewPaymentDialog: boolean
  setShowNewPaymentDialog: (show: boolean) => void

  // New Receipt Dialog
  showNewReceiptDialog: boolean
  setShowNewReceiptDialog: (show: boolean) => void

  // New Task Dialog
  showNewTaskDialog: boolean
  setShowNewTaskDialog: (show: boolean) => void

  // Bot-specific Dialogs
  showCheckTicketStatusDialog?: boolean
  setShowCheckTicketStatusDialog?: (show: boolean) => void
  showTourReviewDialog?: boolean
  setShowTourReviewDialog?: (show: boolean) => void
  userId?: string
}

export function DialogsContainer({
  showShareAdvanceDialog,
  setShowShareAdvanceDialog,
  selectedChannel,
  user,
  showShareOrdersDialog,
  setShowShareOrdersDialog,
  onShareOrdersSuccess,
  showCreateReceiptDialog,
  setShowCreateReceiptDialog,
  selectedOrder,
  setSelectedOrder,
  showCreatePaymentDialog,
  setShowCreatePaymentDialog,
  selectedAdvanceItem,
  setSelectedAdvanceItem,
  selectedAdvanceListId,
  setSelectedAdvanceListId,
  onCreatePaymentSuccess,
  showSettingsDialog,
  setShowSettingsDialog,
  editChannelName,
  setEditChannelName,
  editChannelDescription,
  setEditChannelDescription,
  onDeleteChannel,
  onUpdateChannel,
  showShareQuoteDialog,
  setShowShareQuoteDialog,
  showShareTourDialog,
  setShowShareTourDialog,
  showNewPaymentDialog,
  setShowNewPaymentDialog,
  showNewReceiptDialog,
  setShowNewReceiptDialog,
  showNewTaskDialog,
  setShowNewTaskDialog,
  showCheckTicketStatusDialog,
  setShowCheckTicketStatusDialog,
  showTourReviewDialog,
  setShowTourReviewDialog,
  userId,
}: DialogsContainerProps) {
  return (
    <>
      {/* Share Advance Dialog */}
      {selectedChannel && user && (
        <ShareAdvanceDialog
          channelId={selectedChannel.id}
          currentUserId={user.id}
          open={showShareAdvanceDialog}
          onClose={() => setShowShareAdvanceDialog(false)}
          onSuccess={() => {
            setShowShareAdvanceDialog(false)
          }}
        />
      )}

      {/* Share Orders Dialog */}
      {selectedChannel && (
        <ShareOrdersDialog
          channelId={selectedChannel.id}
          open={showShareOrdersDialog}
          onClose={() => setShowShareOrdersDialog(false)}
          onSuccess={onShareOrdersSuccess}
        />
      )}

      {/* Create Receipt Dialog */}
      {selectedOrder && (
        <CreateReceiptDialog
          order={selectedOrder}
          open={showCreateReceiptDialog}
          onClose={() => {
            setShowCreateReceiptDialog(false)
            setSelectedOrder(null)
          }}
          onSuccess={receiptId => {
            setShowCreateReceiptDialog(false)
            setSelectedOrder(null)
          }}
        />
      )}

      {/* Create Payment Dialog */}
      {selectedAdvanceItem && selectedAdvanceListId && (
        <CreatePaymentRequestDialog
          items={selectedAdvanceItem}
          listId={selectedAdvanceListId}
          open={showCreatePaymentDialog}
          onOpenChange={(open) => {
            setShowCreatePaymentDialog(open)
            if (!open) {
              setSelectedAdvanceItem(null)
              setSelectedAdvanceListId('')
            }
          }}
          onSuccess={onCreatePaymentSuccess}
        />
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent level={1}>
          <DialogHeader>
            <DialogTitle>頻道設定</DialogTitle>
            <DialogDescription>管理 #{selectedChannel?.name} 的設定</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">頻道名稱</label>
              <Input
                value={editChannelName}
                onChange={e => setEditChannelName(e.target.value)}
                placeholder={PLACEHOLDER_TEXT.CHANNEL_NAME}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">頻道描述</label>
              <Input
                value={editChannelDescription}
                onChange={e => setEditChannelDescription(e.target.value)}
                placeholder={PLACEHOLDER_TEXT.CHANNEL_DESCRIPTION}
              />
            </div>
            <div className="pt-4 border-t border-border">
              <Button variant="destructive" className="w-full" onClick={onDeleteChannel}>
                <Trash2 size={16} className="mr-2" />
                刪除頻道
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)} className="gap-2">
              <X size={16} />
              取消
            </Button>
            <Button onClick={onUpdateChannel} className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2">
              <Save size={16} />
              儲存變更
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Quote Dialog */}
      <Dialog open={showShareQuoteDialog} onOpenChange={setShowShareQuoteDialog}>
        <DialogContent level={1}>
          <DialogHeader>
            <DialogTitle>分享報價單</DialogTitle>
            <DialogDescription>選擇要分享到頻道的報價單</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">報價單編號</label>
              <Input placeholder={PLACEHOLDER_TEXT.QUOTE_SEARCH} />
            </div>
            <div className="border border-morandi-container rounded-lg p-3 space-y-2">
              <p className="text-sm text-morandi-secondary">暫無報價單資料</p>
              <p className="text-xs text-morandi-secondary">提示：完整功能將連接報價單系統</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareQuoteDialog(false)} className="gap-2">
              <X size={16} />
              取消
            </Button>
            <Button onClick={() => setShowShareQuoteDialog(false)} className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2">
              <Share2 size={16} />
              分享到頻道
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Tour Dialog */}
      <Dialog open={showShareTourDialog} onOpenChange={setShowShareTourDialog}>
        <DialogContent level={1}>
          <DialogHeader>
            <DialogTitle>分享團況</DialogTitle>
            <DialogDescription>選擇要分享到頻道的團況資訊</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">團號</label>
              <Input placeholder={PLACEHOLDER_TEXT.TOUR_SEARCH} />
            </div>
            <div className="border border-morandi-container rounded-lg p-3 space-y-2">
              <p className="text-sm text-morandi-secondary">暫無團況資料</p>
              <p className="text-xs text-morandi-secondary">提示：完整功能將連接團況管理系統</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareTourDialog(false)} className="gap-2">
              <X size={16} />
              取消
            </Button>
            <Button onClick={() => setShowShareTourDialog(false)} className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2">
              <Share2 size={16} />
              分享到頻道
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Payment Dialog */}
      <Dialog open={showNewPaymentDialog} onOpenChange={setShowNewPaymentDialog}>
        <DialogContent level={1}>
          <DialogHeader>
            <DialogTitle>新增請款單</DialogTitle>
            <DialogDescription>建立新請款單並分享到頻道</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">請款項目</label>
              <Input placeholder={PLACEHOLDER_TEXT.PAYMENT_ITEM} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">請款金額</label>
              <Input type="number" placeholder={PLACEHOLDER_TEXT.PAYMENT_AMOUNT} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">請款原因</label>
              <Input placeholder={PLACEHOLDER_TEXT.PAYMENT_REASON} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPaymentDialog(false)} className="gap-2">
              <X size={16} />
              取消
            </Button>
            <Button onClick={() => setShowNewPaymentDialog(false)} className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2">
              <Plus size={16} />
              建立並分享
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Receipt Dialog */}
      <Dialog open={showNewReceiptDialog} onOpenChange={setShowNewReceiptDialog}>
        <DialogContent level={1}>
          <DialogHeader>
            <DialogTitle>新增收款單</DialogTitle>
            <DialogDescription>建立新收款單並分享到頻道</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">收款項目</label>
              <Input placeholder={PLACEHOLDER_TEXT.RECEIPT_ITEM} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">收款金額</label>
              <Input type="number" placeholder={PLACEHOLDER_TEXT.RECEIPT_AMOUNT} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">付款人</label>
              <Input placeholder={PLACEHOLDER_TEXT.PAYER_NAME} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewReceiptDialog(false)} className="gap-2">
              <X size={16} />
              取消
            </Button>
            <Button onClick={() => setShowNewReceiptDialog(false)} className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2">
              <Plus size={16} />
              建立並分享
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Todo Dialog */}
      {showNewTaskDialog && selectedChannel && (
        <ShareTodoDialog
          channelId={selectedChannel.id}
          onClose={() => setShowNewTaskDialog(false)}
          onSuccess={() => {
            setShowNewTaskDialog(false)
          }}
        />
      )}

      {/* Bot: 確認機票狀況 Dialog */}
      {showCheckTicketStatusDialog && setShowCheckTicketStatusDialog && (
        <TicketStatusDialog
          open={showCheckTicketStatusDialog}
          onClose={() => setShowCheckTicketStatusDialog(false)}
          channelId={selectedChannel?.id}
        />
      )}

      {/* Bot: 復盤 Dialog */}
      {showTourReviewDialog && setShowTourReviewDialog && (
        <Dialog open={showTourReviewDialog} onOpenChange={setShowTourReviewDialog}>
          <DialogContent level={1} className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar size={20} className="text-morandi-primary" />
                復盤
              </DialogTitle>
              <DialogDescription>團體進度、確認單/需求單狀況、收支概況</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {/* 團體進度 */}
              <div className="border border-morandi-container rounded-lg p-4">
                <h4 className="font-medium text-morandi-primary mb-2">團體進度</h4>
                <p className="text-sm text-morandi-secondary">顯示目前進行中的團...</p>
              </div>
              {/* 確認單/需求單 */}
              <div className="border border-morandi-container rounded-lg p-4">
                <h4 className="font-medium text-morandi-primary mb-2">確認單 / 需求單</h4>
                <p className="text-sm text-morandi-secondary">顯示待處理的確認單和需求單...</p>
              </div>
              {/* 收支狀況 */}
              <div className="border border-morandi-container rounded-lg p-4">
                <h4 className="font-medium text-morandi-primary mb-2">團體收支</h4>
                <p className="text-sm text-morandi-secondary">顯示各團收支概況...</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTourReviewDialog(false)} className="gap-2">
                <X size={16} />
                關閉
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
