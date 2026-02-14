'use client'
/**
 * QuickQuotePaymentInfo - 付款資訊區
 */


import React from 'react'
import { MORANDI_COLORS } from '../shared/print-styles'
import { PAYMENT_INFO_LABELS } from '@/constants/labels'
import { QUICK_QUOTE_LABELS } from './constants/labels'

export const QuickQuotePaymentInfo: React.FC = () => {
  return (
    <div
      className="grid grid-cols-2 gap-6 pt-4 text-sm"
      style={{ borderTop: `1px solid ${MORANDI_COLORS.borderLight}` }}
    >
      <div>
        <h4 className="font-semibold mb-2" style={{ color: MORANDI_COLORS.brown }}>
          {QUICK_QUOTE_LABELS.LABEL_5832}
        </h4>
        <div className="space-y-1" style={{ color: MORANDI_COLORS.gray }}>
          <div>{QUICK_QUOTE_LABELS.LABEL_8910}</div>
          <div>{PAYMENT_INFO_LABELS.銀行}</div>
          <div>{PAYMENT_INFO_LABELS.分行}</div>
          <div>{PAYMENT_INFO_LABELS.帳號}</div>
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-2" style={{ color: MORANDI_COLORS.brown }}>
          {QUICK_QUOTE_LABELS.LABEL_9304}
        </h4>
        <div className="space-y-1" style={{ color: MORANDI_COLORS.gray }}>
          <div>{QUICK_QUOTE_LABELS.LABEL_5024}</div>
          <div className="font-semibold" style={{ color: '#DC2626' }}>
            {QUICK_QUOTE_LABELS.LABEL_2697}
          </div>
          <div className="text-xs mt-2" style={{ color: MORANDI_COLORS.lightGray }}>
            （請於出發日前付清餘額）
          </div>
        </div>
      </div>
    </div>
  )
}
