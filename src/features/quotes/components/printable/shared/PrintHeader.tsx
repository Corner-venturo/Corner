/**
 * PrintHeader - 列印頁首組件（共用）
 */

'use client'

import React from 'react'
import { MORANDI_COLORS } from './print-styles'

interface PrintHeaderProps {
  logoUrl?: string
  title: string
  subtitle?: string
}

export const PrintHeader: React.FC<PrintHeaderProps> = ({
  logoUrl,
  title,
  subtitle = 'QUOTATION',
}) => {
  return (
    <div
      className="relative pb-4 mb-6"
      style={{ borderBottom: `1px solid ${MORANDI_COLORS.gold}` }}
    >
      {/* Logo - 左上角 */}
      {logoUrl ? (
        <div
          className="absolute left-0 top-0"
          style={{ width: '120px', height: '40px' }}
        >
          <img
            src={logoUrl}
            alt="角落旅行社 Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'left top',
            }}
          />
        </div>
      ) : (
        <div className="absolute left-0 top-0 text-xs" style={{ color: MORANDI_COLORS.lightGray }}>
          角落旅行社
        </div>
      )}

      {/* 標題 */}
      <div className="relative z-10 text-center py-2">
        <div
          className="text-sm tracking-widest mb-1"
          style={{ color: MORANDI_COLORS.gold, fontWeight: 500 }}
        >
          {subtitle}
        </div>
        <h1 className="text-xl font-bold" style={{ color: MORANDI_COLORS.brown }}>
          {title}
        </h1>
      </div>
    </div>
  )
}
