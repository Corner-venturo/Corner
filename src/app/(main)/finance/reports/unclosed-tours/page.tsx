'use client'

import { useEffect, useMemo } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { ContentContainer } from '@/components/layout/content-container'
import { Card } from '@/components/ui/card'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { CurrencyCell, DateCell } from '@/components/table-cells'
import { AlertCircle, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { useTourStore } from '@/stores'
import { Tour } from '@/types'

// 計算兩個日期之間的天數
function daysBetween(date1: string, date2: Date): number {
  const d1 = new Date(date1)
  const diffTime = date2.getTime() - d1.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

// 添加天數到日期
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

// 未結案團體報表數據類型
interface UnclosedTourData extends Tour {
  expected_closing_date: string
  days_overdue: number
}

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
  const tourStore = useTourStore()

  // 載入數據
  useEffect(() => {
    tourStore.fetchAll()
  }, [])

  // 篩選未結案的團體（回程日 + 7 天已過但未結案）
  const unclosedTours = useMemo<UnclosedTourData[]>(() => {
    const today = new Date()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const cutoffDate = sevenDaysAgo.toISOString().split('T')[0]

    return tourStore.items
      .filter(tour => {
        // 必須有回程日
        if (!tour.return_date) return false
        // 回程日 + 7 天必須已過
        if (tour.return_date > cutoffDate) return false
        // 必須未結案
        if (tour.closing_status === 'closed' || tour.status === '結案') return false
        // 排除已取消的
        if (tour.status === '取消') return false
        return true
      })
      .map(tour => ({
        ...tour,
        expected_closing_date: addDays(tour.return_date!, 7),
        days_overdue: daysBetween(addDays(tour.return_date!, 7), today),
      }))
      .sort((a, b) => b.days_overdue - a.days_overdue) // 逾期最久的排最前面
  }, [tourStore.items])

  // 計算統計數據
  const stats = useMemo(() => {
    const totalRevenue = unclosedTours.reduce(
      (sum, tour) => sum + (tour.total_revenue || 0),
      0
    )
    const totalCost = unclosedTours.reduce(
      (sum, tour) => sum + (tour.total_cost || 0),
      0
    )
    return {
      count: unclosedTours.length,
      totalRevenue,
      totalCost,
      netProfit: totalRevenue - totalCost,
    }
  }, [unclosedTours])

  // 表格欄位
  const columns: TableColumn<UnclosedTourData>[] = [
    {
      key: 'code',
      label: '團號',
      width: '120',
      render: value => (
        <span className="font-mono text-sm font-medium">{String(value || '')}</span>
      ),
    },
    {
      key: 'name',
      label: '團名',
      width: '180',
      render: value => (
        <span className="text-sm truncate">{String(value || '-')}</span>
      ),
    },
    {
      key: 'return_date',
      label: '回程日',
      width: '120',
      render: value => <DateCell date={value as string} />,
    },
    {
      key: 'expected_closing_date',
      label: '應結案日',
      width: '120',
      render: value => <DateCell date={value as string} />,
    },
    {
      key: 'days_overdue',
      label: '逾期天數',
      width: '100',
      render: value => {
        const days = Number(value) || 0
        return (
          <span
            className={`font-medium ${days > 14 ? 'text-morandi-red' : days > 7 ? 'text-morandi-gold' : 'text-morandi-secondary'}`}
          >
            {days} 天
          </span>
        )
      },
    },
    {
      key: 'total_revenue',
      label: '總收入',
      width: '120',
      render: value => (
        <CurrencyCell amount={Number(value) || 0} variant="income" />
      ),
    },
    {
      key: 'total_cost',
      label: '總支出',
      width: '120',
      render: value => (
        <CurrencyCell amount={Number(value) || 0} variant="expense" />
      ),
    },
    {
      key: 'profit',
      label: '利潤',
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
      label: '狀態',
      width: '100',
      render: value => (
        <span className="px-2 py-1 text-xs rounded-full bg-morandi-gold/10 text-morandi-gold">
          {String(value || '進行中')}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <ResponsiveHeader
        title="未結案團體報表"
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '財務', href: '/finance' },
          { label: '報表管理', href: '/finance/reports' },
          { label: '未結案團體報表', href: '/finance/reports/unclosed-tours' },
        ]}
      />

      {/* 說明 */}
      <ContentContainer>
        <div className="flex items-start gap-3 p-4 bg-morandi-gold/5 border border-morandi-gold/20 rounded-lg">
          <AlertCircle size={20} className="text-morandi-gold flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-morandi-primary">
              此報表顯示<strong>回程日 + 7 天已過</strong>但尚未執行結案的團體。
              建議儘快完成結案作業以確保財務數據準確。
            </p>
          </div>
        </div>
      </ContentContainer>

      {/* 統計卡片 */}
      <ContentContainer>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="未結案團體數"
            value={stats.count}
            icon={Calendar}
            iconColor="text-morandi-red"
          />
          <StatCard
            title="總收入"
            value={stats.totalRevenue}
            icon={TrendingUp}
            iconColor="text-morandi-green"
            isCurrency
            variant="income"
          />
          <StatCard
            title="總支出"
            value={stats.totalCost}
            icon={TrendingDown}
            iconColor="text-morandi-red"
            isCurrency
            variant="expense"
          />
          <StatCard
            title="總利潤"
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
          未結案團體列表
        </h3>
        <EnhancedTable
          columns={columns}
          data={unclosedTours}
          emptyMessage="目前沒有需要結案的團體"
          searchable
          searchableFields={['code', 'name']}
          searchPlaceholder="搜尋團號或團名..."
        />
      </ContentContainer>
    </div>
  )
}
