'use client'

import React from 'react'
import type { Order } from '@/types/order.types'
import { CurrencyCell } from '@/components/table-cells'
import { INVOICE_LABELS } from './constants/labels'

interface InvoicePreviewProps {
  totalAmount: number
  currentOrder?: Order
}

export function InvoicePreview({ totalAmount, currentOrder }: InvoicePreviewProps) {
  const isOverpaid = currentOrder && totalAmount > (currentOrder.paid_amount ?? 0)

  return (
    <div className="space-y-4">
      {/* 總計 */}
      <div className="border rounded-lg p-3 bg-muted/30">
        <div className="flex justify-end items-center gap-4">
          <span className="text-sm font-medium">{INVOICE_LABELS.TOTAL}</span>
          <span className="text-lg font-bold text-primary">
            <CurrencyCell amount={totalAmount} className="text-lg font-bold text-primary" />
          </span>
        </div>
      </div>

      {/* 超開提醒 */}
      {isOverpaid && (
        <div className="p-3 bg-status-warning-bg border border-status-warning/30 rounded-md text-sm text-status-warning">
          ⚠️ 發票金額超過已收款金額！已收款：<CurrencyCell amount={currentOrder.paid_amount ?? 0} className="inline text-sm text-status-warning" />
        </div>
      )}
    </div>
  )
}
