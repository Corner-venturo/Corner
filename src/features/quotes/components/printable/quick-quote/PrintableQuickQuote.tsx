/**
 * PrintableQuickQuote - 快速報價單列印版（重構版）
 */

'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Quote, QuickQuoteItem } from '@/types/quote.types'
import { PrintHeader } from '../shared/PrintHeader'
import { PrintFooter } from '../shared/PrintFooter'
import { PrintControls } from '../shared/PrintControls'
import { usePrintLogo } from '../shared/usePrintLogo'
import { PRINT_STYLES } from '../shared/print-styles'
import { QuickQuoteCustomerInfo } from './QuickQuoteCustomerInfo'
import { QuickQuoteItemsTable } from './QuickQuoteItemsTable'
import { QuickQuoteSummary } from './QuickQuoteSummary'
import { QuickQuotePaymentInfo } from './QuickQuotePaymentInfo'
import { QuickQuoteReceiptInfo } from './QuickQuoteReceiptInfo'

interface PrintableQuickQuoteProps {
  quote: Quote
  items: QuickQuoteItem[]
  isOpen: boolean
  onClose: () => void
  onPrint: () => void
}

export const PrintableQuickQuote: React.FC<PrintableQuickQuoteProps> = ({
  quote,
  items,
  isOpen,
  onClose,
  onPrint,
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

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

  if (!isOpen || !isMounted) return null

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-8 print:p-0 print:bg-transparent print:block"
      onClick={onClose}
      id="printable-quick-quote-overlay"
    >
      <style>{PRINT_STYLES}</style>
      <style>
        {`
          @media print {
            #printable-quick-quote-overlay {
              position: static !important;
              inset: auto !important;
              width: 100% !important;
              height: auto !important;
              background: transparent !important;
              padding: 0 !important;
              display: block !important;
              z-index: 1 !important;
            }

            body > *:not(#printable-quick-quote-overlay) {
              display: none !important;
            }

            #printable-quick-quote-overlay .print\\:hidden {
              display: none !important;
            }

            /* 顯示列印版本的 table（覆蓋 hidden class） */
            table.print-wrapper {
              display: table !important;
            }

            table.print-wrapper tbody > tr {
              height: 100%;
            }

            table.print-wrapper tbody > tr > td {
              vertical-align: top;
            }
          }
        `}
      </style>
      <div
        className="bg-white rounded-lg max-w-[1000px] w-full max-h-[90vh] overflow-y-auto print:max-w-full print:rounded-none print:max-h-none print:overflow-visible"
        onClick={e => e.stopPropagation()}
      >
        <PrintControls onClose={onClose} onPrint={onPrint} />

        <div className="bg-white p-8 print:p-0" id="printable-quote">
          {/* 列印版本 - 使用 table 結構 */}
          <table className="print-wrapper print:table hidden">
            <thead>
              <tr>
                <td>
                  <PrintHeader logoUrl={logoUrl} title="報價請款單" subtitle="QUOTATION" />
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
                  <QuickQuoteCustomerInfo quote={quote} />
                  <QuickQuoteItemsTable items={items} />
                  <QuickQuoteSummary
                    totalAmount={totalAmount}
                    receivedAmount={quote.received_amount}
                  />
                  <QuickQuotePaymentInfo />
                  <QuickQuoteReceiptInfo />
                </td>
              </tr>
            </tbody>
          </table>

          {/* 螢幕顯示版本 */}
          <div className="print:hidden">
            <PrintHeader logoUrl={logoUrl} title="報價請款單" subtitle="QUOTATION" />
            <QuickQuoteCustomerInfo quote={quote} />
            <QuickQuoteItemsTable items={items} />
            <QuickQuoteSummary totalAmount={totalAmount} receivedAmount={quote.received_amount} />
            <QuickQuotePaymentInfo />
            <QuickQuoteReceiptInfo />

            <div className="text-center mt-16 pt-8" style={{ borderTop: '1px solid #F3F4F6' }}>
              <PrintFooter />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
