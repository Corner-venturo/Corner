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
    <div className="bg-morandi-container/20 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-morandi-primary mb-4">收款概況</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-morandi-green">
            NT$ {totalConfirmed.toLocaleString()}
          </div>
          <div className="text-sm text-morandi-secondary">已收款</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-morandi-gold">
            NT$ {totalPending.toLocaleString()}
          </div>
          <div className="text-sm text-morandi-secondary">待確認</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-morandi-primary">
            NT$ {totalPayments.toLocaleString()}
          </div>
          <div className="text-sm text-morandi-secondary">總收款</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-morandi-red">
            NT$ {remaining_amount.toLocaleString()}
          </div>
          <div className="text-sm text-morandi-secondary">待收款</div>
        </div>
      </div>
    </div>
  )
})
