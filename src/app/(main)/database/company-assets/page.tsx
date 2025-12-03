/**
 * 公司資源管理頁面
 */

'use client'

import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { CompanyAssetsPage } from '@/features/company-assets/components'

export default function CompanyAssetsManagementPage() {
  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="公司資源管理"
        breadcrumb={[
          { label: '資料庫', href: '/database' },
          { label: '公司資源管理', href: '/database/company-assets' },
        ]}
      />

      <div className="flex-1 overflow-auto p-6">
        <CompanyAssetsPage />
      </div>
    </div>
  )
}
