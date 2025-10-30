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
import { Trash2 } from 'lucide-react'
import { ShareAdvanceDialog } from '../ShareAdvanceDialog'
import { ShareOrdersDialog } from '../ShareOrdersDialog'
import { ShareTodoDialog } from '../ShareTodoDialog'
import { CreateReceiptDialog } from '../CreateReceiptDialog'
import { CreatePaymentRequestDialog } from '../CreatePaymentRequestDialog'
import { PLACEHOLDER_TEXT } from './constants'

interface DialogsContainerProps {
  // Share Advance Dialog
  showShareAdvanceDialog: boolean
  setShowShareAdvanceDialog: (show: boolean) => void
  selectedChannel: any
  user: any

  // Share Orders Dialog
  showShareOrdersDialog: boolean
  setShowShareOrdersDialog: (show: boolean) => void
  onShareOrdersSuccess: () => void

  // Create Receipt Dialog
  showCreateReceiptDialog: boolean
  setShowCreateReceiptDialog: (show: boolean) => void
  selectedOrder: unknown
  setSelectedOrder: (order: unknown) => void

  // Create Payment Dialog
  showCreatePaymentDialog: boolean
  setShowCreatePaymentDialog: (show: boolean) => void
  selectedAdvanceItem: unknown
  setSelectedAdvanceItem: (item: unknown) => void
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
}: DialogsContainerProps) {
  return (
    <>
      {/* Share Advance Dialog */}
      {showShareAdvanceDialog && selectedChannel && user && (
        <ShareAdvanceDialog
          channelId={selectedChannel.id}
          currentUserId={user.id}
          onClose={() => setShowShareAdvanceDialog(false)}
          onSuccess={() => {
            setShowShareAdvanceDialog(false)
          }}
        />
      )}

      {/* Share Orders Dialog */}
      {showShareOrdersDialog && selectedChannel && (
        <ShareOrdersDialog
          channelId={selectedChannel.id}
          onClose={() => setShowShareOrdersDialog(false)}
          onSuccess={onShareOrdersSuccess}
        />
      )}

      {/* Create Receipt Dialog */}
      {showCreateReceiptDialog && selectedOrder && (
        <CreateReceiptDialog
          order={selectedOrder}
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
      {showCreatePaymentDialog && selectedAdvanceItem && selectedAdvanceListId && (
        <CreatePaymentRequestDialog
          items={selectedAdvanceItem}
          listId={selectedAdvanceListId}
          onClose={() => {
            setShowCreatePaymentDialog(false)
            setSelectedAdvanceItem(null)
            setSelectedAdvanceListId('')
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
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              取消
            </Button>
            <Button onClick={onUpdateChannel}>儲存變更</Button>
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
            <Button variant="outline" onClick={() => setShowShareQuoteDialog(false)}>
              取消
            </Button>
            <Button onClick={() => setShowShareQuoteDialog(false)}>分享到頻道</Button>
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
            <Button variant="outline" onClick={() => setShowShareTourDialog(false)}>
              取消
            </Button>
            <Button onClick={() => setShowShareTourDialog(false)}>分享到頻道</Button>
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
            <Button variant="outline" onClick={() => setShowNewPaymentDialog(false)}>
              取消
            </Button>
            <Button onClick={() => setShowNewPaymentDialog(false)}>建立並分享</Button>
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
            <Button variant="outline" onClick={() => setShowNewReceiptDialog(false)}>
              取消
            </Button>
            <Button onClick={() => setShowNewReceiptDialog(false)}>建立並分享</Button>
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
    </>
  )
}
