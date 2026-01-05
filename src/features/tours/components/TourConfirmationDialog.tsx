'use client'

/**
 * TourConfirmationDialog - 團確單管理對話框
 *
 * 在對話框中顯示出團確認表
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DIALOG_SIZES,
} from '@/components/ui/dialog'
import { TourConfirmationSheetPage } from '@/features/tour-confirmation'
import type { Tour } from '@/stores/types'

interface TourConfirmationDialogProps {
  open: boolean
  tour: Tour | null
  onClose: () => void
  /** 是否為嵌套 Dialog（從其他 Dialog 打開時設為 true） */
  nested?: boolean
}

export function TourConfirmationDialog({
  open,
  tour,
  onClose,
  nested = false,
}: TourConfirmationDialogProps) {
  if (!tour) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent nested={nested} className="max-w-[95vw] w-[1400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            團確單管理 - {tour.code} {tour.name}
          </DialogTitle>
        </DialogHeader>
        <TourConfirmationSheetPage tour={tour} />
      </DialogContent>
    </Dialog>
  )
}
