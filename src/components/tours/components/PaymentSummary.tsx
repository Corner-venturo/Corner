'use client'

import React from 'react'

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
      <div>
        <span className="text-morandi-secondary">已收款</span>
        <span className="ml-2 font-semibold text-morandi-green">NT$ {totalConfirmed.toLocaleString()}</span>
      </div>
      <div>
        <span className="text-morandi-secondary">待確認</span>
        <span className="ml-2 font-semibold text-morandi-gold">NT$ {totalPending.toLocaleString()}</span>
      </div>
      <div>
        <span className="text-morandi-secondary">總收款</span>
        <span className="ml-2 font-semibold text-morandi-primary">NT$ {totalPayments.toLocaleString()}</span>
      </div>
      <div>
        <span className="text-morandi-secondary">待收款</span>
        <span className="ml-2 font-semibold text-morandi-red">NT$ {remaining_amount.toLocaleString()}</span>
      </div>
    </div>
  )
})
