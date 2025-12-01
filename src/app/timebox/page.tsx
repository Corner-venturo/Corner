'use client'

import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Clock } from 'lucide-react'

/**
 * Timebox 功能頁面
 *
 * ⚠️ 此功能目前已停用
 * 原因：Timebox 相關表格已從資料庫 schema 移除
 */
export default function TimeboxPage() {
  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="Timebox"
        icon={Clock}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: 'Timebox', href: '/timebox' },
        ]}
      />

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <Clock size={64} className="mx-auto text-morandi-secondary/30" />
          <h2 className="text-xl font-semibold text-morandi-primary">此功能目前未啟用</h2>
          <p className="text-morandi-secondary max-w-md">
            Timebox 時間管理功能目前暫時停用。
            如需啟用，請聯繫系統管理員。
          </p>
        </div>
      </div>
    </div>
  )
}
