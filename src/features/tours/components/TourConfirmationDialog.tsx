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
import { TOUR_CONFIRMATION } from '../constants'

interface TourConfirmationDialogProps {
  open: boolean
  tour: Tour | null
  onClose: () => void
}

export function TourConfirmationDialog({
  open,
  tour,
  onClose,
}: TourConfirmationDialogProps) {
  if (!tour) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent level={2} className="max-w-[95vw] w-[1400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {TOUR_CONFIRMATION.title(tour.code, tour.name)}
          </DialogTitle>
        </DialogHeader>
        <TourConfirmationSheetPage tour={tour} />
      </DialogContent>
    </Dialog>
  )
}
