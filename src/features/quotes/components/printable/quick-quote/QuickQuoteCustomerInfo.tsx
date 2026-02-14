/**
 * QuickQuoteCustomerInfo - 快速報價單客戶資訊區
 */

'use client'

import { getTodayString } from '@/lib/utils/format-date'
import React from 'react'
import { Quote } from '@/types/quote.types'
import { QUICK_QUOTE_LABELS } from './constants/labels'

interface QuickQuoteCustomerInfoProps {
  quote: Quote
}

export const QuickQuoteCustomerInfo: React.FC<QuickQuoteCustomerInfoProps> = ({ quote }) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
      <div className="flex">
        <span className="font-semibold w-24">{QUICK_QUOTE_LABELS.LABEL_9995}</span>
        <span className="flex-1 border-b border-border">{quote.customer_name}</span>
      </div>
      <div className="flex">
        <span className="font-semibold w-24">{QUICK_QUOTE_LABELS.LABEL_3418}</span>
        <span className="flex-1 border-b border-border">{quote.tour_code || ''}</span>
      </div>
      <div className="flex">
        <span className="font-semibold w-24">{QUICK_QUOTE_LABELS.LABEL_4738}</span>
        <span className="flex-1 border-b border-border">{quote.contact_phone || ''}</span>
      </div>
      <div className="flex">
        <span className="font-semibold w-24">{QUICK_QUOTE_LABELS.LABEL_7518}</span>
        <span className="flex-1 border-b border-border">
          {quote.handler_name || 'William'}
        </span>
      </div>
      <div className="flex col-span-2">
        <span className="font-semibold w-24">{QUICK_QUOTE_LABELS.LABEL_1301}</span>
        <span className="flex-1 border-b border-border">{quote.contact_address || ''}</span>
      </div>
      <div className="flex">
        <span className="font-semibold w-24">{QUICK_QUOTE_LABELS.LABEL_4115}</span>
        <span className="flex-1 border-b border-border">
          {quote.issue_date || getTodayString()}
        </span>
      </div>
    </div>
  )
}
