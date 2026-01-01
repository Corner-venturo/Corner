'use client'

import React from 'react'
import { CurrencyCell } from '@/components/table-cells'

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
        <span className="text-morandi-secondary">已收款</span>
        <CurrencyCell amount={totalConfirmed} className="ml-2 font-semibold text-morandi-green" />
      </div>
      <div className="flex items-center">
        <span className="text-morandi-secondary">待確認</span>
        <CurrencyCell amount={totalPending} className="ml-2 font-semibold text-morandi-gold" />
      </div>
      <div className="flex items-center">
        <span className="text-morandi-secondary">總收款</span>
        <CurrencyCell amount={totalPayments} className="ml-2 font-semibold text-morandi-primary" />
      </div>
      <div className="flex items-center">
        <span className="text-morandi-secondary">待收款</span>
        <CurrencyCell amount={remaining_amount} className="ml-2 font-semibold text-morandi-red" />
      </div>
    </div>
  )
})
