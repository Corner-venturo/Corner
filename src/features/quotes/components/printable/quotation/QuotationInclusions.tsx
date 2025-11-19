/**
 * QuotationInclusions - 費用包含/不包含說明
 */

'use client'

import React from 'react'
import { MORANDI_COLORS } from '../shared/print-styles'

export const QuotationInclusions: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-6 mb-6">
      <div>
        <h4 className="font-semibold mb-2" style={{ color: MORANDI_COLORS.brown }}>
          費用包含
        </h4>
        <ul className="space-y-1 text-sm" style={{ color: MORANDI_COLORS.gray }}>
          <li>• 行程表所列之交通費用</li>
          <li>• 行程表所列之住宿費用</li>
          <li>• 行程表所列之餐食費用</li>
          <li>• 行程表所列之門票費用</li>
          <li>• 專業導遊服務</li>
          <li>• 旅遊責任險 500 萬元</li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold mb-2" style={{ color: MORANDI_COLORS.brown }}>
          費用不含
        </h4>
        <ul className="space-y-1 text-sm" style={{ color: MORANDI_COLORS.gray }}>
          <li>• 個人護照及簽證費用</li>
          <li>• 行程外之自費行程</li>
          <li>• 個人消費及小費</li>
          <li>• 行李超重費用</li>
          <li>• 單人房差價</li>
        </ul>
      </div>
    </div>
  )
}
