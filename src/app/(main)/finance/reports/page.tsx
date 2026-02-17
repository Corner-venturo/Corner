'use client'

import Link from 'next/link'
import { ContentPageLayout } from '@/components/layout/content-page-layout'
import { ContentContainer } from '@/components/layout/content-container'
import { Card } from '@/components/ui/card'
import {
  FileDown,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Wallet,
  BarChart3,
} from 'lucide-react'
import { REPORTS_LABELS } from './constants/labels'

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
    <ContentPageLayout
      title={REPORTS_LABELS.MANAGE_3253}
      breadcrumb={[
        { label: REPORTS_LABELS.BREADCRUMB_HOME, href: '/' },
        { label: REPORTS_LABELS.BREADCRUMB_FINANCE, href: '/finance' },
        { label: REPORTS_LABELS.BREADCRUMB_REPORTS, href: '/finance/reports' },
      ]}
      className="space-y-6"
    >
      <ContentContainer>
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">
          {REPORTS_LABELS.LABEL_8192}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ReportCard
            title={REPORTS_LABELS.LABEL_3446}
            description={REPORTS_LABELS.TOTAL_6998}
            href="/finance/reports/monthly-disbursement"
            icon={FileDown}
            iconColor="text-morandi-gold"
          />
          <ReportCard
            title={REPORTS_LABELS.LABEL_120}
            description={REPORTS_LABELS.LABEL_7786}
            href="/finance/reports/monthly-income"
            icon={TrendingUp}
            iconColor="text-morandi-green"
          />
          <ReportCard
            title={REPORTS_LABELS.LABEL_996}
            description={REPORTS_LABELS.LABEL_4844}
            href="/finance/reports/unclosed-tours"
            icon={AlertCircle}
            iconColor="text-morandi-red"
          />
          <ReportCard
            title={REPORTS_LABELS.LABEL_1474}
            description={REPORTS_LABELS.LABEL_5090}
            href="/finance/reports/unpaid-orders"
            icon={Wallet}
            iconColor="text-morandi-red"
          />
          <ReportCard
            title={REPORTS_LABELS.TOTAL_2832}
            description={REPORTS_LABELS.LABEL_7727}
            href="/finance/reports/tour-pnl"
            icon={BarChart3}
            iconColor="text-morandi-blue"
          />
        </div>
      </ContentContainer>
    </ContentPageLayout>
  )
}
