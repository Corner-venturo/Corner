'use client'

/**
 * UnclosedToursReportPage - 未結案團體報表
 *
 * ✅ Optimized (2026-01-12):
 * - Uses server-side filtering via useUnclosedTours hook
 * - No more fetchAll() + client-side filter
 * - 90%+ reduction in data transfer
 */

import { ContentPageLayout } from '@/components/layout/content-page-layout'
import { ContentContainer } from '@/components/layout/content-container'
import { Card } from '@/components/ui/card'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { CurrencyCell, DateCell } from '@/components/table-cells'
import { AlertCircle, Calendar, TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import { useUnclosedTours, UnclosedTourData } from '@/features/finance/reports/hooks/useUnclosedTours'
import { UNCLOSED_TOURS_LABELS } from '../../constants/labels'

// 統計卡片
function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  isCurrency = false,
  variant,
}: {
  title: string
  value: number
  icon: React.ComponentType<{ size?: number; className?: string }>
  iconColor: string
  isCurrency?: boolean
  variant?: 'income' | 'expense'
}) {
  return (
    <Card className="p-4 border border-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-morandi-secondary mb-1">{title}</p>
          {isCurrency ? (
            <CurrencyCell amount={value} variant={variant} className="text-2xl font-bold" />
          ) : (
            <p className="text-2xl font-bold text-morandi-primary">{value}</p>
          )}
        </div>
        <Icon size={24} className={iconColor} />
      </div>
    </Card>
  )
}

export default function UnclosedToursReportPage() {
  // ✅ Use server-side filtered hook
  const { tours: unclosedTours, stats, loading, error } = useUnclosedTours()

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-morandi-secondary" size={32} />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-morandi-red">{error}</div>
      </div>
    )
  }

  // 表格欄位
  const columns: TableColumn<UnclosedTourData>[] = [
    {
      key: 'code',
      label: UNCLOSED_TOURS_LABELS.COL_TOUR_CODE,
      width: '120',
      render: value => (
        <span className="font-mono text-sm font-medium">{String(value || '')}</span>
      ),
    },
    {
      key: 'name',
      label: UNCLOSED_TOURS_LABELS.COL_TOUR_NAME,
      width: '180',
      render: value => (
        <span className="text-sm truncate">{String(value || '-')}</span>
      ),
    },
    {
      key: 'return_date',
      label: UNCLOSED_TOURS_LABELS.COL_RETURN_DATE,
      width: '120',
      render: value => <DateCell date={value as string} />,
    },
    {
      key: 'expected_closing_date',
      label: UNCLOSED_TOURS_LABELS.COL_EXPECTED_CLOSING_DATE,
      width: '120',
      render: value => <DateCell date={value as string} />,
    },
    {
      key: 'days_overdue',
      label: UNCLOSED_TOURS_LABELS.COL_DAYS_OVERDUE,
      width: '100',
      render: value => {
        const days = Number(value) || 0
        return (
          <span
            className={`font-medium ${days > 14 ? 'text-morandi-red' : days > 7 ? 'text-morandi-gold' : 'text-morandi-secondary'}`}
          >
            {days}{UNCLOSED_TOURS_LABELS.DAYS_SUFFIX}
          </span>
        )
      },
    },
    {
      key: 'total_revenue',
      label: UNCLOSED_TOURS_LABELS.COL_TOTAL_REVENUE,
      width: '120',
      render: value => (
        <CurrencyCell amount={Number(value) || 0} variant="income" />
      ),
    },
    {
      key: 'total_cost',
      label: UNCLOSED_TOURS_LABELS.COL_TOTAL_COST,
      width: '120',
      render: value => (
        <CurrencyCell amount={Number(value) || 0} variant="expense" />
      ),
    },
    {
      key: 'profit',
      label: UNCLOSED_TOURS_LABELS.COL_PROFIT,
      width: '120',
      render: (_, row) => {
        const profit = (row.total_revenue || 0) - (row.total_cost || 0)
        return (
          <CurrencyCell
            amount={profit}
            variant={profit >= 0 ? 'income' : 'expense'}
            className="font-medium"
          />
        )
      },
    },
    {
      key: 'status',
      label: UNCLOSED_TOURS_LABELS.COL_STATUS,
      width: '100',
      render: value => (
        <span className="px-2 py-1 text-xs rounded-full bg-morandi-gold/10 text-morandi-gold">
          {String(value || UNCLOSED_TOURS_LABELS.STATUS_DEFAULT)}
        </span>
      ),
    },
  ]

  return (
    <ContentPageLayout
      title={UNCLOSED_TOURS_LABELS.LABEL_996}
      breadcrumb={[
        { label: UNCLOSED_TOURS_LABELS.BREADCRUMB_HOME, href: '/' },
        { label: UNCLOSED_TOURS_LABELS.BREADCRUMB_FINANCE, href: '/finance' },
        { label: UNCLOSED_TOURS_LABELS.BREADCRUMB_REPORTS, href: '/finance/reports' },
        { label: UNCLOSED_TOURS_LABELS.LABEL_996, href: '/finance/reports/unclosed-tours' },
      ]}
      className="space-y-6"
    >

      {/* 說明 */}
      <ContentContainer>
        <div className="flex items-start gap-3 p-4 bg-morandi-gold/5 border border-morandi-gold/20 rounded-lg">
          <AlertCircle size={20} className="text-morandi-gold flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-morandi-primary">
              {UNCLOSED_TOURS_LABELS.DESCRIPTION}
              {UNCLOSED_TOURS_LABELS.DESCRIPTION_SUFFIX}
            </p>
          </div>
        </div>
      </ContentContainer>

      {/* 統計卡片 */}
      <ContentContainer>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={UNCLOSED_TOURS_LABELS.LABEL_9947}
            value={stats.count}
            icon={Calendar}
            iconColor="text-morandi-red"
          />
          <StatCard
            title={UNCLOSED_TOURS_LABELS.TOTAL_7262}
            value={stats.totalRevenue}
            icon={TrendingUp}
            iconColor="text-morandi-green"
            isCurrency
            variant="income"
          />
          <StatCard
            title={UNCLOSED_TOURS_LABELS.TOTAL_582}
            value={stats.totalCost}
            icon={TrendingDown}
            iconColor="text-morandi-red"
            isCurrency
            variant="expense"
          />
          <StatCard
            title={UNCLOSED_TOURS_LABELS.TOTAL_8800}
            value={stats.netProfit}
            icon={TrendingUp}
            iconColor={stats.netProfit >= 0 ? 'text-morandi-green' : 'text-morandi-red'}
            isCurrency
            variant={stats.netProfit >= 0 ? 'income' : 'expense'}
          />
        </div>
      </ContentContainer>

      {/* 團體列表 */}
      <ContentContainer>
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">
          {UNCLOSED_TOURS_LABELS.LABEL_332}
        </h3>
        <EnhancedTable
          columns={columns}
          data={unclosedTours}
          emptyMessage={UNCLOSED_TOURS_LABELS.EMPTY_MESSAGE}
          searchable
          searchableFields={['code', 'name']}
          searchPlaceholder={UNCLOSED_TOURS_LABELS.SEARCH_PLACEHOLDER}
        />
      </ContentContainer>
    </ContentPageLayout>
  )
}
