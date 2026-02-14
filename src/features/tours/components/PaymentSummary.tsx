'use client'

import React from 'react'
import { CurrencyCell } from '@/components/table-cells'
import { TOURS_LABELS } from './constants/labels'

interface PaymentSummaryProps {
  totalConfirmed: number
  totalPending: number
  totalPayments: number
  remaining_amount: number
}

export const PaymentSummary = React.memo(function PaymentSummary({
  totalConfirmed,
  totalPending,
  totalPayments,
  remaining_amount,
}: PaymentSummaryProps) {
  return (
    <div className="flex items-center gap-6 text-sm">
      <div className="flex items-center">
        <span className="text-morandi-secondary">{TOURS_LABELS.LABEL_5100}</span>
        <CurrencyCell amount={totalConfirmed} className="ml-2 font-semibold text-morandi-green" />
      </div>
      <div className="flex items-center">
        <span className="text-morandi-secondary">{TOURS_LABELS.CONFIRM_7150}</span>
        <CurrencyCell amount={totalPending} className="ml-2 font-semibold text-morandi-gold" />
      </div>
      <div className="flex items-center">
        <span className="text-morandi-secondary">{TOURS_LABELS.TOTAL_2951}</span>
        <CurrencyCell amount={totalPayments} className="ml-2 font-semibold text-morandi-primary" />
      </div>
      <div className="flex items-center">
        <span className="text-morandi-secondary">{TOURS_LABELS.LABEL_1728}</span>
        <CurrencyCell amount={remaining_amount} className="ml-2 font-semibold text-morandi-red" />
      </div>
    </div>
  )
})
