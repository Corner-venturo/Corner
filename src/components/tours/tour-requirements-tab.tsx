'use client'

/**
 * TourRequirementsTab - 需求總覽頁籤
 *
 * 使用共用的 RequirementsList 組件
 */

import { RequirementsList } from '@/components/requirements'
import type { Tour } from '@/stores/types'
import type { ProposalPackage } from '@/types/proposal.types'

interface TourRequirementsTabProps {
  tourId: string
  quoteId?: string | null
  onOpenRequestDialog?: (data: {
    category: string
    supplierName: string
    items: { serviceDate: string | null; title: string; quantity: number; note?: string }[]
    tour?: Tour
    pkg?: ProposalPackage
    startDate: string | null
  }) => void
}

export function TourRequirementsTab({ tourId, quoteId, onOpenRequestDialog }: TourRequirementsTabProps) {
  return (
    <RequirementsList
      tourId={tourId}
      quoteId={quoteId}
      onOpenRequestDialog={onOpenRequestDialog}
    />
  )
}
