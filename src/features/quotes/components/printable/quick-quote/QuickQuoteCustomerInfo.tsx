/**
 * QuickQuoteCustomerInfo - 快速報價單客戶資訊區
 */

'use client'

import React from 'react'
import { Quote } from '@/types/quote.types'

interface QuickQuoteCustomerInfoProps {
  quote: Quote
}

export const QuickQuoteCustomerInfo: React.FC<QuickQuoteCustomerInfoProps> = ({ quote }) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
      <div className="flex">
        <span className="font-semibold w-24">團體名稱：</span>
        <span className="flex-1 border-b border-gray-300">{quote.customer_name}</span>
      </div>
      <div className="flex">
        <span className="font-semibold w-24">團體編號：</span>
        <span className="flex-1 border-b border-gray-300">{quote.tour_code || ''}</span>
      </div>
      <div className="flex">
        <span className="font-semibold w-24">聯絡電話：</span>
        <span className="flex-1 border-b border-gray-300">{quote.contact_phone || ''}</span>
      </div>
      <div className="flex">
        <span className="font-semibold w-24">承辦業務：</span>
        <span className="flex-1 border-b border-gray-300">
          {quote.handler_name || 'William'}
        </span>
      </div>
      <div className="flex col-span-2">
        <span className="font-semibold w-24">通訊地址：</span>
        <span className="flex-1 border-b border-gray-300">{quote.contact_address || ''}</span>
      </div>
      <div className="flex">
        <span className="font-semibold w-24">開單日期：</span>
        <span className="flex-1 border-b border-gray-300">
          {quote.issue_date || new Date().toISOString().split('T')[0]}
        </span>
      </div>
    </div>
  )
}
