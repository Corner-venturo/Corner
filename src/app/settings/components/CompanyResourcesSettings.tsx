/**
 * CompanyResourcesSettings - 公司資源設定組件
 */

'use client'

import React from 'react'
import { CompanyAssetsPage } from '@/features/company-assets/components'

export const CompanyResourcesSettings: React.FC = () => {
  return (
    <section className="bg-card border border-border rounded-xl p-6">
      <CompanyAssetsPage />
    </section>
  )
}
