'use client'

/**
 * TourRequirementsTab - 需求總覽頁籤
 *
 * 使用共用的 RequirementsList 組件，並提供列印確認單功能
 */

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Printer, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RequirementsList } from '@/features/confirmations/components'
import { COMP_TOURS_LABELS } from '../constants/labels'
import type { Tour } from '@/stores/types'
import type { ProposalPackage } from '@/types/proposal.types'

const TourConfirmationSheetPage = dynamic(
  () => import('@/features/tour-confirmation/components/TourConfirmationSheetPage').then(m => m.TourConfirmationSheetPage),
  { loading: () => <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div> }
)

interface TourRequirementsTabProps {
  tourId: string
  quoteId?: string | null
  tour?: Tour
  onOpenRequestDialog?: (data: {
    category: string
    supplierName: string
    items: { serviceDate: string | null; title: string; quantity: number; note?: string }[]
    tour?: Tour
    pkg?: ProposalPackage
    startDate: string | null
  }) => void
}

export function TourRequirementsTab({ tourId, quoteId, tour, onOpenRequestDialog }: TourRequirementsTabProps) {
  const [showConfirmationSheet, setShowConfirmationSheet] = useState(false)

  return (
    <div className="space-y-4">
      {tour && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfirmationSheet(true)}
            className="gap-2"
          >
            <Printer size={16} />
            {COMP_TOURS_LABELS.列印確認單}
          </Button>
        </div>
      )}
      <RequirementsList
        tourId={tourId}
        quoteId={quoteId}
        onOpenRequestDialog={onOpenRequestDialog}
      />
      {tour && (
        <Dialog open={showConfirmationSheet} onOpenChange={setShowConfirmationSheet}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{COMP_TOURS_LABELS.確認單}</DialogTitle>
            </DialogHeader>
            <TourConfirmationSheetPage tour={tour} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
