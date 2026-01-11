'use client'

import { useState, useEffect, useMemo } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { ContentContainer } from '@/components/layout/content-container'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { CurrencyCell, DateCell } from '@/components/table-cells'
import { ChevronLeft, ChevronRight, TrendingUp, Receipt, Users } from 'lucide-react'
import { useReceiptOrderStore } from '@/stores'
import { ReceiptOrder } from '@/types'

// 取得當前年月
function getCurrentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
}

// 取得月份的第一天和最後一天
function getMonthRange(yearMonth: string): { startDate: string; endDate: string } {
  const [year, month] = yearMonth.split('-').map(Number)
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`
  return { startDate, endDate }
}

// 格式化月份顯示
function formatYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-')
  return `${year} 年 ${parseInt(month)} 月`
}

// 付款方式對應
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: '現金',
  transfer: '匯款',
  card: '刷卡',
  check: '支票',
  linkpay: 'LinkPay',
}

// 月份選擇器
function MonthSelector({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const handlePrev = () => {
    const [year, month] = value.split('-').map(Number)
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    onChange(`${prevYear}-${prevMonth.toString().padStart(2, '0')}`)
  }

  const handleNext = () => {
    const [year, month] = value.split('-').map(Number)
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    onChange(`${nextYear}-${nextMonth.toString().padStart(2, '0')}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={handlePrev}>
        <ChevronLeft size={16} />
      </Button>
      <span className="min-w-[120px] text-center font-medium text-morandi-primary">
        {formatYearMonth(value)}
      </span>
      <Button variant="outline" size="icon" onClick={handleNext}>
        <ChevronRight size={16} />
      </Button>
    </div>
  )
}

// 統計卡片
function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  isCurrency = false,
}: {
  title: string
  value: number
  icon: React.ComponentType<{ size?: number; className?: string }>
  iconColor: string
  isCurrency?: boolean
}) {
  return (
    <Card className="p-4 border border-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-morandi-secondary mb-1">{title}</p>
          {isCurrency ? (
            <CurrencyCell amount={value} variant="income" className="text-2xl font-bold" />
          ) : (
            <p className="text-2xl font-bold text-morandi-primary">{value}</p>
          )}
        </div>
        <Icon size={24} className={iconColor} />
      </div>
    </Card>
  )
}

export default function MonthlyIncomeReportPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentYearMonth())
  const receiptOrderStore = useReceiptOrderStore()

  // 載入數據
  useEffect(() => {
    receiptOrderStore.fetchAll()
  }, [])

  // 篩選該月份的數據
  const { startDate, endDate } = getMonthRange(selectedMonth)

  const filteredReceiptOrders = useMemo(() => {
    return receiptOrderStore.items.filter(ro => {
      const receiptDate = ro.receipt_date
      return receiptDate >= startDate && receiptDate <= endDate
    })
  }, [receiptOrderStore.items, startDate, endDate])

  // 計算統計數據
  const stats = useMemo(() => {
    const totalAmount = filteredReceiptOrders.reduce(
      (sum, ro) => sum + (ro.amount || 0),
      0
    )
    // 按付款方式分組統計
    const byPaymentMethod = filteredReceiptOrders.reduce((acc, ro) => {
      const method = ro.payment_method || 'other'
      if (!acc[method]) {
        acc[method] = { count: 0, amount: 0 }
      }
      acc[method].count += 1
      acc[method].amount += ro.amount || 0
      return acc
    }, {} as Record<string, { count: number; amount: number }>)

    return {
      receiptCount: filteredReceiptOrders.length,
      totalAmount,
      byPaymentMethod,
    }
  }, [filteredReceiptOrders])

  // 收款單表格欄位
  const columns: TableColumn<ReceiptOrder>[] = [
    {
      key: 'code',
      label: '收款單號',
      width: '150',
      render: value => (
        <span className="font-mono text-sm">{String(value || '')}</span>
      ),
    },
    {
      key: 'receipt_date',
      label: '收款日期',
      width: '120',
      render: value => <DateCell date={value as string} />,
    },
    {
      key: 'payment_method',
      label: '付款方式',
      width: '100',
      render: value => {
        const method = String(value || '')
        return (
          <span className="text-sm">
            {PAYMENT_METHOD_LABELS[method] || method || '-'}
          </span>
        )
      },
    },
    {
      key: 'amount',
      label: '金額',
      width: '120',
      render: value => <CurrencyCell amount={Number(value) || 0} variant="income" />,
    },
    {
      key: 'handled_by',
      label: '經手人',
      width: '100',
      render: value => (
        <span className="text-sm">{String(value || '-')}</span>
      ),
    },
    {
      key: 'notes',
      label: '備註',
      width: '150',
      render: value => (
        <span className="text-sm truncate">{String(value || '-')}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <ResponsiveHeader
        title="每月收入報表"
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '財務', href: '/finance' },
          { label: '報表管理', href: '/finance/reports' },
          { label: '每月收入報表', href: '/finance/reports/monthly-income' },
        ]}
        actions={<MonthSelector value={selectedMonth} onChange={setSelectedMonth} />}
      />

      {/* 統計卡片 */}
      <ContentContainer>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="收款單數"
            value={stats.receiptCount}
            icon={Receipt}
            iconColor="text-morandi-green"
          />
          <StatCard
            title="收款總金額"
            value={stats.totalAmount}
            icon={TrendingUp}
            iconColor="text-morandi-green"
            isCurrency
          />
          <StatCard
            title="付款方式統計"
            value={Object.keys(stats.byPaymentMethod).length}
            icon={Users}
            iconColor="text-morandi-gold"
          />
        </div>
      </ContentContainer>

      {/* 付款方式統計 */}
      {Object.keys(stats.byPaymentMethod).length > 0 && (
        <ContentContainer>
          <h3 className="text-lg font-semibold text-morandi-primary mb-4">
            依付款方式統計
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(stats.byPaymentMethod).map(([method, data]) => (
              <div key={method} className="p-4 bg-morandi-container/30 rounded-lg">
                <p className="text-sm text-morandi-secondary">
                  {PAYMENT_METHOD_LABELS[method] || method}
                </p>
                <p className="text-lg font-semibold text-morandi-primary">
                  {data.count} 筆
                </p>
                <CurrencyCell amount={data.amount} variant="income" className="text-sm" />
              </div>
            ))}
          </div>
        </ContentContainer>
      )}

      {/* 收款單列表 */}
      <ContentContainer>
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">
          收款單明細
        </h3>
        <EnhancedTable
          columns={columns}
          data={filteredReceiptOrders}
          emptyMessage="此月份沒有收款單"
        />
      </ContentContainer>
    </div>
  )
}
