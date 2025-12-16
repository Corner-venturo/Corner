'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import type { JournalVoucher } from '@/types/accounting.types'

interface ReverseVoucherDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  voucher: JournalVoucher
  onSuccess: () => void
}

export function ReverseVoucherDialog({
  open,
  onOpenChange,
  voucher,
  onSuccess,
}: ReverseVoucherDialogProps) {
  const { user } = useAuthStore()
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('請輸入反沖原因')
      return
    }

    if (!user?.workspace_id || !user?.id) {
      toast.error('用戶資訊不完整')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/accounting/reverse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: user.workspace_id,
          user_id: user.id,
          voucher_id: voucher.id,
          reason: reason.trim(),
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '反沖失敗')
      }

      toast.success(`反沖成功，新傳票編號：${result.voucherNo}`)
      setReason('')
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '反沖失敗')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>反沖傳票</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">即將反沖以下傳票：</p>
            <p className="font-mono font-medium">{voucher.voucher_no}</p>
            <p className="text-sm text-muted-foreground mt-1">{voucher.memo}</p>
          </div>

          <div className="space-y-2">
            <Label>反沖原因 *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="請說明反沖原因..."
              rows={3}
            />
          </div>

          <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-sm">
            ⚠️ 反沖後將產生一張新的反向傳票，原傳票狀態將變更為「已反沖」。此操作無法復原。
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting ? '處理中...' : '確認反沖'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
