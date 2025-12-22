/**
 * ArchiveReasonDialog - 旅遊團封存原因對話框
 */

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Archive } from 'lucide-react'
import { Tour } from '@/stores/types'
import { cn } from '@/lib/utils'

// 封存原因選項
export const ARCHIVE_REASONS = [
  { value: 'no_deal', label: '沒成交', description: '客戶最終未成交' },
  { value: 'cancelled', label: '取消', description: '客戶或公司取消此團' },
  { value: 'test_error', label: '測試錯誤', description: '測試用資料或操作錯誤' },
] as const

export type ArchiveReason = typeof ARCHIVE_REASONS[number]['value']

interface ArchiveReasonDialogProps {
  isOpen: boolean
  tour: Tour | null
  onClose: () => void
  onConfirm: (reason: ArchiveReason) => void
}

export function ArchiveReasonDialog({
  isOpen,
  tour,
  onClose,
  onConfirm,
}: ArchiveReasonDialogProps) {
  const [selectedReason, setSelectedReason] = useState<ArchiveReason | null>(null)

  const handleConfirm = () => {
    if (selectedReason) {
      onConfirm(selectedReason)
      setSelectedReason(null)
    }
  }

  const handleClose = () => {
    setSelectedReason(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-morandi-gold">
            <Archive size={20} />
            封存旅遊團
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-morandi-primary">
            確定要封存旅遊團 <span className="font-semibold">「{tour?.name}」</span> 嗎？
          </p>

          <div className="space-y-2">
            <p className="text-sm font-medium text-morandi-primary">請選擇封存原因：</p>
            <div className="space-y-2">
              {ARCHIVE_REASONS.map((reason) => (
                <button
                  key={reason.value}
                  onClick={() => setSelectedReason(reason.value)}
                  className={cn(
                    'w-full p-3 rounded-lg border text-left transition-all',
                    selectedReason === reason.value
                      ? 'border-morandi-gold bg-morandi-gold/10'
                      : 'border-morandi-container hover:border-morandi-gold/50 hover:bg-morandi-container/30'
                  )}
                >
                  <div className="font-medium text-morandi-primary">{reason.label}</div>
                  <div className="text-xs text-morandi-secondary">{reason.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-morandi-gold/5 border border-morandi-gold/20 rounded-lg p-3 space-y-2">
            <p className="text-sm text-morandi-secondary">
              封存後，此旅遊團將：
            </p>
            <ul className="text-sm text-morandi-secondary space-y-1 ml-4">
              <li>• 從列表中隱藏（可在「封存」分頁查看）</li>
              <li>• 自動斷開關聯的報價單和行程表</li>
            </ul>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedReason}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            確認封存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
