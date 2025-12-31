/**
 * PrintableQuotation - 團體報價單列印版
 */

'use client'

import React from 'react'
import { ParticipantCounts, SellingPrices } from '../../../types'
import { PrintableWrapper } from '../shared/PrintableWrapper'
import { QuotationInfo } from './QuotationInfo'
import { QuotationPricingTable } from './QuotationPricingTable'
import { QuotationInclusions } from './QuotationInclusions'
import { QuotationTerms } from './QuotationTerms'
import { Quote } from '@/types/models'

interface TierPricingForPrint {
  participant_count: number
  selling_prices: {
    adult: number
    child_with_bed: number
    child_no_bed: number
    single_room: number
    infant: number
  }
}

interface PrintableQuotationProps {
  quote: Quote
  quoteName: string
  participantCounts: ParticipantCounts
  sellingPrices: SellingPrices
  categories: unknown[]
  totalCost: number
  isOpen: boolean
  onClose: () => void
  onPrint: () => void
  accommodationSummary?: unknown[]
  tierLabel?: string
  tierPricings?: TierPricingForPrint[]
}

export const PrintableQuotation: React.FC<PrintableQuotationProps> = ({
  quote,
  quoteName,
  participantCounts,
  sellingPrices,
  isOpen,
  onClose,
  onPrint,
  tierLabel,
  tierPricings = [],
}) => {
  const totalParticipants =
    participantCounts.adult +
    participantCounts.child_with_bed +
    participantCounts.child_no_bed +
    participantCounts.single_room +
    participantCounts.infant

  return (
    <PrintableWrapper
      isOpen={isOpen}
      onClose={onClose}
      onPrint={onPrint}
      title="旅遊報價單"
      subtitle="QUOTATION"
    >
      <QuotationInfo
        quoteName={quoteName}
        quoteCode={quote?.code ?? undefined}
        totalParticipants={totalParticipants}
        validUntil={quote?.valid_until ?? undefined}
        tierLabel={tierLabel}
      />
      <QuotationPricingTable
        sellingPrices={sellingPrices}
        tierPricings={tierPricings}
      />
      <QuotationInclusions />
      <QuotationTerms validUntil={quote?.valid_until ?? undefined} />
    </PrintableWrapper>
  )
}
