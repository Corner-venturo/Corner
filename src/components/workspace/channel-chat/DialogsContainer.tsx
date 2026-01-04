'use client'

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
import { Trash2, X, Save, Share2, Plus, Calendar, Ticket } from 'lucide-react'
import { ShareAdvanceDialog } from '../ShareAdvanceDialog'
import { ShareOrdersDialog } from '../ShareOrdersDialog'
import { ShareTodoDialog } from '../ShareTodoDialog'
import { CreateReceiptDialog } from '../CreateReceiptDialog'
import { CreatePaymentRequestDialog } from '../CreatePaymentRequestDialog'
import { PLACEHOLDER_TEXT } from './constants'
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
        <DialogContent>
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
        <DialogContent>
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
        <DialogContent>
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
        <DialogContent>
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
        <DialogContent>
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
        <Dialog open={showCheckTicketStatusDialog} onOpenChange={setShowCheckTicketStatusDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ticket size={20} className="text-morandi-gold" />
                確認機票狀況
              </DialogTitle>
              <DialogDescription>查詢指定區間內未開票的旅客</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">1 個月</Button>
                <Button variant="outline" size="sm" className="flex-1">3 個月</Button>
                <Button variant="outline" size="sm" className="flex-1">6 個月</Button>
              </div>
              <div className="border border-morandi-container rounded-lg p-4">
                <p className="text-sm text-morandi-secondary text-center">選擇區間後顯示未開票旅客...</p>
                <p className="text-xs text-morandi-secondary text-center mt-1">
                  包含旅客姓名、團號、開票期限 (DL)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCheckTicketStatusDialog(false)} className="gap-2">
                <X size={16} />
                關閉
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Bot: 復盤 Dialog */}
      {showTourReviewDialog && setShowTourReviewDialog && (
        <Dialog open={showTourReviewDialog} onOpenChange={setShowTourReviewDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
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
