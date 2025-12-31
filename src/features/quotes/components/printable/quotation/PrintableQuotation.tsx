/**
 * PrintableQuotation - 團體報價單列印版（重構版）
 */

'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ParticipantCounts, CostCategory, AccommodationSummaryItem, SellingPrices } from '../../../types'
import { PrintHeader } from '../shared/PrintHeader'
import { PrintFooter } from '../shared/PrintFooter'
import { PrintControls } from '../shared/PrintControls'
import { usePrintLogo } from '../shared/usePrintLogo'
import { PRINT_STYLES } from '../shared/print-styles'
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
  categories: CostCategory[]
  totalCost: number
  isOpen: boolean
  onClose: () => void
  onPrint: () => void
  accommodationSummary?: AccommodationSummaryItem[]
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
  const [isMounted, setIsMounted] = useState(false)
  const logoUrl = usePrintLogo(isOpen)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // ESC 鍵關閉
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !isMounted) return null

  const totalParticipants =
    participantCounts.adult +
    participantCounts.child_with_bed +
    participantCounts.child_no_bed +
    participantCounts.single_room +
    participantCounts.infant

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-8 print:p-0 print:bg-transparent print:block"
      onClick={onClose}
      id="printable-quotation-overlay"
    >
      <style>{PRINT_STYLES}</style>
      <style>
        {`
          @media print {
            /* 隱藏頁面其他元素 */
            body > *:not(#printable-quotation-overlay) {
              display: none !important;
            }

            /* 重置 overlay 容器 */
            #printable-quotation-overlay {
              position: static !important;
              inset: auto !important;
              width: 100% !important;
              height: auto !important;
              background: transparent !important;
              padding: 0 !important;
              display: block !important;
              z-index: 1 !important;
            }

            /* 重置內部容器 */
            #printable-quotation-overlay > div {
              max-width: 100% !important;
              max-height: none !important;
              overflow: visible !important;
              border-radius: 0 !important;
              box-shadow: none !important;
            }

            /* 隱藏螢幕版本 */
            #printable-quotation-overlay .print\\:hidden,
            #printable-quotation .print\\:hidden {
              display: none !important;
            }

            /* 強制顯示列印版本的 table */
            #printable-quotation table.print-wrapper,
            table.print-wrapper,
            table.print-wrapper.hidden {
              display: table !important;
              visibility: visible !important;
              width: 100% !important;
            }

            /* 確保 table 內容可見 */
            #printable-quotation table.print-wrapper *,
            table.print-wrapper * {
              visibility: visible !important;
            }

            table.print-wrapper tbody > tr {
              height: 100%;
            }

            table.print-wrapper tbody > tr > td {
              vertical-align: top;
            }

            /* 內容區域重置 */
            #printable-quotation {
              padding: 0 !important;
              width: 100% !important;
            }
          }
        `}
      </style>
      <div
        className="bg-white rounded-lg max-w-[1000px] w-full max-h-[90vh] overflow-y-auto print:max-w-full print:rounded-none print:max-h-none print:overflow-visible"
        onClick={e => e.stopPropagation()}
      >
        <PrintControls onClose={onClose} onPrint={onPrint} />

        <div className="bg-white p-8 print:p-0" id="printable-quotation">
          {/* 列印版本 - 使用 table 結構 */}
          <table className="print-wrapper print:table hidden">
            <thead>
              <tr>
                <td>
                  <PrintHeader logoUrl={logoUrl} title="旅遊報價單" subtitle="QUOTATION" />
                </td>
              </tr>
            </thead>

            <tfoot>
              <tr>
                <td>
                  <PrintFooter />
                </td>
              </tr>
            </tfoot>

            <tbody>
              <tr>
                <td>
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
                </td>
              </tr>
            </tbody>
          </table>

          {/* 螢幕顯示版本 */}
          <div className="print:hidden">
            <PrintHeader logoUrl={logoUrl} title="旅遊報價單" subtitle="QUOTATION" />
            <QuotationInfo
              quoteName={quoteName}
              quoteCode={quote?.code ?? undefined}
              totalParticipants={totalParticipants}
              validUntil={quote?.valid_until ?? undefined}
              tierLabel={tierLabel}
            />
            <QuotationPricingTable sellingPrices={sellingPrices} tierPricings={tierPricings} />
            <QuotationInclusions />
            <QuotationTerms validUntil={quote?.valid_until ?? undefined} />

            <div className="text-center mt-8 pt-4">
              <PrintFooter />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
