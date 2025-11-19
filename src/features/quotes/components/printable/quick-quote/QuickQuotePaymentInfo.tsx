/**
 * QuickQuotePaymentInfo - 付款資訊區
 */

'use client'

import React from 'react'
import { MORANDI_COLORS } from '../shared/print-styles'

export const QuickQuotePaymentInfo: React.FC = () => {
  return (
    <div
      className="grid grid-cols-2 gap-6 pt-4 text-sm"
      style={{ borderTop: `1px solid ${MORANDI_COLORS.borderLight}` }}
    >
      <div>
        <h4 className="font-semibold mb-2" style={{ color: MORANDI_COLORS.brown }}>
          匯款資訊
        </h4>
        <div className="space-y-1" style={{ color: MORANDI_COLORS.gray }}>
          <div>戶名：角落旅行社股份有限公司</div>
          <div>銀行：國泰世華銀行 (013)</div>
          <div>分行：大同分行 (0626)</div>
          <div>帳號：062-03-500821-2</div>
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-2" style={{ color: MORANDI_COLORS.brown }}>
          支票資訊
        </h4>
        <div className="space-y-1" style={{ color: MORANDI_COLORS.gray }}>
          <div>抬頭：角落旅行社股份有限公司</div>
          <div className="font-semibold" style={{ color: '#DC2626' }}>
            禁止背書轉讓
          </div>
          <div className="text-xs mt-2" style={{ color: MORANDI_COLORS.lightGray }}>
            （請於出發日前付清餘額）
          </div>
        </div>
      </div>
    </div>
  )
}
