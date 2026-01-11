'use client'

import Link from 'next/link'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { ContentContainer } from '@/components/layout/content-container'
import { Card } from '@/components/ui/card'
import {
  FileDown,
  TrendingUp,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'

// 報表卡片組件
function ReportCard({
  title,
  description,
  href,
  icon: Icon,
  iconColor,
}: {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  iconColor: string
}) {
  return (
    <Link href={href}>
      <Card className="p-6 border border-border hover:border-morandi-gold hover:shadow-md transition-all cursor-pointer group">
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-lg bg-opacity-10 ${iconColor.replace('text-', 'bg-')}/10`}
          >
            <Icon size={24} className={iconColor} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-morandi-primary mb-1 group-hover:text-morandi-gold transition-colors">
              {title}
            </h3>
            <p className="text-sm text-morandi-secondary">{description}</p>
          </div>
          <ArrowRight
            size={20}
            className="text-morandi-secondary group-hover:text-morandi-gold transition-colors"
          />
        </div>
      </Card>
    </Link>
  )
}

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <ResponsiveHeader
        title="報表管理"
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '財務', href: '/finance' },
          { label: '報表管理', href: '/finance/reports' },
        ]}
      />

      <ContentContainer>
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">
          財務報表
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ReportCard
            title="每月出帳報表"
            description="顯示該月請款單數、出納單數、總金額"
            href="/finance/reports/monthly-disbursement"
            icon={FileDown}
            iconColor="text-morandi-gold"
          />
          <ReportCard
            title="每月收入報表"
            description="顯示該月收款情況"
            href="/finance/reports/monthly-income"
            icon={TrendingUp}
            iconColor="text-morandi-green"
          />
          <ReportCard
            title="未結案團體報表"
            description="回程日+7天已過但未結案的團體"
            href="/finance/reports/unclosed-tours"
            icon={AlertCircle}
            iconColor="text-morandi-red"
          />
        </div>
      </ContentContainer>
    </div>
  )
}
