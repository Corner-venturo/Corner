/**
 * QuickQuoteReceiptInfo - 收據資訊區
 */

'use client'

import React from 'react'
import { MORANDI_COLORS } from '../shared/print-styles'

export const QuickQuoteReceiptInfo: React.FC = () => {
  return (
    <div className="mt-4 pt-4 text-sm" style={{ borderTop: `1px solid ${MORANDI_COLORS.borderLight}` }}>
      <h4 className="font-semibold mb-2" style={{ color: MORANDI_COLORS.brown }}>
        收據資訊
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex">
          <span className="font-semibold w-32" style={{ color: MORANDI_COLORS.gray }}>
            開立代收轉付抬頭：
          </span>
          <span className="flex-1" style={{ borderBottom: `1px solid ${MORANDI_COLORS.border}` }}>
            {'\u00A0'}
          </span>
        </div>
        <div className="flex">
          <span className="font-semibold w-32" style={{ color: MORANDI_COLORS.gray }}>
            開立代收轉付統編：
          </span>
          <span className="flex-1" style={{ borderBottom: `1px solid ${MORANDI_COLORS.border}` }}>
            {'\u00A0'}
          </span>
        </div>
      </div>
    </div>
  )
}
