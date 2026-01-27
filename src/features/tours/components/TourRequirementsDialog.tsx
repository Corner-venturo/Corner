'use client'

/**
 * TourRequirementsDialog - 需求總表對話框
 *
 * 在對話框中顯示需求總覽
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RequirementsList } from '@/components/requirements'
import { TourRequestFormDialog } from '@/features/proposals/components/TourRequestFormDialog'
import type { Tour } from '@/stores/types'

interface TourRequirementsDialogProps {
  open: boolean
  tour: Tour | null
  onClose: () => void
}

export function TourRequirementsDialog({
  open,
  tour,
  onClose,
}: TourRequirementsDialogProps) {
  // 需求單 Dialog 狀態
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [requestData, setRequestData] = useState<{
    category: string
    supplierName: string
    items: { serviceDate: string | null; title: string; quantity: number; note?: string }[]
    startDate: string | null
  } | null>(null)

  if (!tour) return null

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent level={1} className="max-w-[95vw] w-[1200px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              需求總表 - {tour.code} {tour.name}
            </DialogTitle>
          </DialogHeader>
          <RequirementsList
            tourId={tour.id}
            onOpenRequestDialog={(data) => {
              setRequestData({
                category: data.category,
                supplierName: data.supplierName,
                items: data.items,
                startDate: data.startDate,
              })
              setShowRequestDialog(true)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* 需求單對話框 */}
      {requestData && (
        <TourRequestFormDialog
          isOpen={showRequestDialog}
          onClose={() => {
            setShowRequestDialog(false)
            setRequestData(null)
          }}
          tour={tour}
          category={requestData.category}
          supplierName={requestData.supplierName}
          items={requestData.items}
        />
      )}
    </>
  )
}
