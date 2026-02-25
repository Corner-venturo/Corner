'use client'
/**
 * PrintFooter - 列印頁尾組件（共用）
 */


import React from 'react'
import { COMPANY } from '@/lib/constants/company'
import { MORANDI_COLORS } from './print-styles'
import { useAuthStore } from '@/stores/auth-store'

export const PrintFooter: React.FC = () => {
  const workspaceName = useAuthStore(state => state.user?.workspace_name) || ''
  const companyFullName = workspaceName ? `${workspaceName}股份有限公司` : ''

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
        <span>{companyFullName} © {new Date().getFullYear()}</span>
      </div>
    </div>
  )
}
