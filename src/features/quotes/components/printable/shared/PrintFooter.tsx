/**
 * PrintFooter - 列印頁尾組件（共用）
 */

'use client'

import React from 'react'
import { COMPANY } from '@/lib/constants/company'
import { MORANDI_COLORS } from './print-styles'
import { PRINT_FOOTER_LABELS } from '@/constants/labels'

export const PrintFooter: React.FC = () => {
  return (
    <div
      className="border-t"
      style={{
        borderColor: MORANDI_COLORS.borderLight,
        marginTop: '24px',
        paddingTop: '16px',
      }}
    >
      <div className="text-center" style={{ marginBottom: '12px' }}>
        <p className="text-sm italic" style={{ color: MORANDI_COLORS.lightGray, margin: 0 }}>
          {COMPANY.subtitle}
        </p>
      </div>
      <div className="text-center text-xs" style={{ color: MORANDI_COLORS.lightGray }}>
        <span>{PRINT_FOOTER_LABELS.角落旅行社版權.replace('{year}', new Date().getFullYear().toString())}</span>
      </div>
    </div>
  )
}
