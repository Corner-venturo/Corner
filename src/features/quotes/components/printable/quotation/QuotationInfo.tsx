/**
 * QuotationInfo - 報價單基本資訊區
 */

'use client'

import React from 'react'

interface QuotationInfoProps {
  quoteName: string
  quoteCode?: string
  totalParticipants: number
  validUntil?: string
  tierLabel?: string
}

export const QuotationInfo: React.FC<QuotationInfoProps> = ({
  quoteName,
  quoteCode,
  totalParticipants,
  validUntil,
  tierLabel,
}) => {
  const formatValidUntil = () => {
    if (validUntil) {
      return new Date(validUntil).toLocaleDateString('zh-TW')
    }
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-TW')
  }

  return (
    <div className="mb-6">
      {tierLabel && (
        <div
          className="mb-3 px-3 py-2 rounded-md inline-block"
          style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
        >
          <span className="text-sm font-semibold">{tierLabel}</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex">
          <span className="font-semibold w-32">行程名稱：</span>
          <span className="flex-1 border-b border-gray-300">
            {quoteName || '精選旅遊行程'}
          </span>
        </div>
        <div className="flex">
          <span className="font-semibold w-32">報價單編號：</span>
          <span className="flex-1 border-b border-gray-300">{quoteCode || ''}</span>
        </div>
        <div className="flex">
          <span className="font-semibold w-32">總人數：</span>
          <span className="flex-1 border-b border-gray-300">{totalParticipants} 人</span>
        </div>
        <div className="flex">
          <span className="font-semibold w-32">有效期限：</span>
          <span className="flex-1 border-b border-gray-300">{formatValidUntil()}</span>
        </div>
      </div>
    </div>
  )
}
