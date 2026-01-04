/**
 * QuotationTerms - 注意事項
 */

'use client'

import React from 'react'
import { formatDateTW } from '@/lib/utils/format-date'
import { MORANDI_COLORS } from '../shared/print-styles'

interface QuotationTermsProps {
  validUntil?: string
}

export const QuotationTerms: React.FC<QuotationTermsProps> = ({ validUntil }) => {
  const formatValidUntil = () => {
    if (validUntil) {
      return formatDateTW(validUntil)
    }
    return formatDateTW(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
  }

  return (
    <div
      className="pt-4 text-sm"
      style={{ borderTop: `1px solid ${MORANDI_COLORS.border}`, color: MORANDI_COLORS.gray }}
    >
      <h4 className="font-semibold mb-2" style={{ color: MORANDI_COLORS.brown }}>
        注意事項
      </h4>
      <ul className="space-y-1">
        <li>• 本報價單有效期限至 {formatValidUntil()}，逾期請重新報價。</li>
        <li>• 最終價格以確認訂單時之匯率及費用為準。</li>
        <li>• 如遇旺季或特殊節日，價格可能會有調整。</li>
        <li>• 出發前 30 天內取消，需支付團費 30% 作為取消費。</li>
        <li>• 出發前 14 天內取消，需支付團費 50% 作為取消費。</li>
        <li>• 出發前 7 天內取消，需支付團費 100% 作為取消費。</li>
      </ul>
    </div>
  )
}
