import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { Tour } from '@/stores/types'

interface DeleteConfirmDialogProps {
  isOpen: boolean
  tour: Tour | null
  onClose: () => void
  onConfirm: () => void
}

export function DeleteConfirmDialog({
  isOpen,
  tour,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-morandi-red">
            <AlertCircle size={20} />
            確認刪除旅遊團
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-morandi-primary">
            確定要刪除旅遊團 <span className="font-semibold">「{tour?.name}」</span> 嗎？
          </p>
          <div className="bg-morandi-red/5 border border-morandi-red/20 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium text-morandi-red">此操作會影響：</p>
            <ul className="text-sm text-morandi-secondary space-y-1 ml-4">
              <li>• 相關訂單和團員資料</li>
              <li>• 收付款記錄</li>
              <li>• 報價單</li>
            </ul>
            <p className="text-xs text-morandi-red font-medium mt-2">⚠️ 此操作無法復原！</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={onConfirm} className="bg-morandi-red hover:bg-morandi-red/90 text-white">
            確認刪除
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
