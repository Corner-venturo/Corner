'use client'

import { useState, useEffect, useMemo } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { ContentContainer } from '@/components/layout/content-container'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { CurrencyCell, DateCell, StatusCell } from '@/components/table-cells'
import { ChevronLeft, ChevronRight, FileDown, Receipt, Wallet } from 'lucide-react'
import { usePaymentRequestStore, useDisbursementOrderStore } from '@/stores'
import { PaymentRequest, DisbursementOrder } from '@/stores/types'
import { EXPENSE_TYPE_CONFIG, CompanyExpenseType } from '@/stores/types/finance.types'

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
            <CurrencyCell amount={value} className="text-2xl font-bold" />
          ) : (
            <p className="text-2xl font-bold text-morandi-primary">{value}</p>
          )}
        </div>
        <Icon size={24} className={iconColor} />
      </div>
    </Card>
  )
}

export default function MonthlyDisbursementReportPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentYearMonth())
  const paymentRequestStore = usePaymentRequestStore()
  const disbursementOrderStore = useDisbursementOrderStore()

  // 載入數據
  useEffect(() => {
    paymentRequestStore.fetchAll()
    disbursementOrderStore.fetchAll()
  }, [])

  // 篩選該月份的數據
  const { startDate, endDate } = getMonthRange(selectedMonth)

  const filteredPaymentRequests = useMemo(() => {
    return paymentRequestStore.items.filter(pr => {
      const requestDate = pr.request_date
      return requestDate >= startDate && requestDate <= endDate
    })
  }, [paymentRequestStore.items, startDate, endDate])

  const filteredDisbursementOrders = useMemo(() => {
    return disbursementOrderStore.items.filter(d => {
      const disbursementDate = d.disbursement_date
      return disbursementDate >= startDate && disbursementDate <= endDate
    })
  }, [disbursementOrderStore.items, startDate, endDate])

  // 計算統計數據
  const stats = useMemo(() => {
    const totalPaymentAmount = filteredPaymentRequests.reduce(
      (sum, pr) => sum + (pr.amount || 0),
      0
    )
    const totalDisbursementAmount = filteredDisbursementOrders.reduce(
      (sum, d) => sum + (d.amount || 0),
      0
    )
    return {
      paymentRequestCount: filteredPaymentRequests.length,
      disbursementOrderCount: filteredDisbursementOrders.length,
      totalPaymentAmount,
      totalDisbursementAmount,
    }
  }, [filteredPaymentRequests, filteredDisbursementOrders])

  // 請款單表格欄位
  const paymentColumns: TableColumn<PaymentRequest>[] = [
    {
      key: 'code',
      label: '請款單號',
      width: '150',
      render: value => (
        <span className="font-mono text-sm">{String(value || '')}</span>
      ),
    },
    {
      key: 'request_date',
      label: '請款日期',
      width: '120',
      render: value => <DateCell date={value as string} />,
    },
    {
      key: 'request_category',
      label: '類別',
      width: '100',
      render: (value, row) => {
        if (value === 'company') {
          const expenseType = row.expense_type as CompanyExpenseType | undefined
          const typeName = expenseType
            ? EXPENSE_TYPE_CONFIG[expenseType]?.name || expenseType
            : '公司'
          return (
            <span className="px-2 py-1 text-xs rounded-full bg-morandi-gold/10 text-morandi-gold">
              {typeName}
            </span>
          )
        }
        return (
          <span className="text-sm text-morandi-secondary">
            {row.tour_code || '-'}
          </span>
        )
      },
    },
    {
      key: 'request_type',
      label: '類型',
      width: '100',
      render: value => <span className="text-sm">{String(value || '-')}</span>,
    },
    {
      key: 'amount',
      label: '金額',
      width: '120',
      render: value => <CurrencyCell amount={Number(value) || 0} />,
    },
    {
      key: 'status',
      label: '狀態',
      width: '100',
      render: value => <StatusCell type="payment" status={value as string} />,
    },
  ]

  // 出納單表格欄位
  const disbursementColumns: TableColumn<DisbursementOrder>[] = [
    {
      key: 'order_number',
      label: '出納單號',
      width: '150',
      render: value => (
        <span className="font-mono text-sm">{String(value || '')}</span>
      ),
    },
    {
      key: 'disbursement_date',
      label: '出帳日期',
      width: '120',
      render: value => <DateCell date={value as string} />,
    },
    {
      key: 'payment_request_ids',
      label: '請款單數',
      width: '100',
      render: value => (
        <span className="text-sm">
          {Array.isArray(value) ? value.length : 0} 筆
        </span>
      ),
    },
    {
      key: 'amount',
      label: '金額',
      width: '120',
      render: value => <CurrencyCell amount={Number(value) || 0} />,
    },
    {
      key: 'status',
      label: '狀態',
      width: '100',
      render: value => <StatusCell type="payment" status={value as string} />,
    },
  ]

  return (
    <div className="space-y-6">
      <ResponsiveHeader
        title="每月出帳報表"
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '財務', href: '/finance' },
          { label: '報表管理', href: '/finance/reports' },
          { label: '每月出帳報表', href: '/finance/reports/monthly-disbursement' },
        ]}
        actions={<MonthSelector value={selectedMonth} onChange={setSelectedMonth} />}
      />

      {/* 統計卡片 */}
      <ContentContainer>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="請款單數"
            value={stats.paymentRequestCount}
            icon={Receipt}
            iconColor="text-morandi-gold"
          />
          <StatCard
            title="請款總金額"
            value={stats.totalPaymentAmount}
            icon={FileDown}
            iconColor="text-morandi-gold"
            isCurrency
          />
          <StatCard
            title="出納單數"
            value={stats.disbursementOrderCount}
            icon={Wallet}
            iconColor="text-morandi-green"
          />
          <StatCard
            title="出帳總金額"
            value={stats.totalDisbursementAmount}
            icon={FileDown}
            iconColor="text-morandi-green"
            isCurrency
          />
        </div>
      </ContentContainer>

      {/* 請款單列表 */}
      <ContentContainer>
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">
          請款單明細
        </h3>
        <EnhancedTable
          columns={paymentColumns}
          data={filteredPaymentRequests}
          emptyMessage="此月份沒有請款單"
        />
      </ContentContainer>

      {/* 出納單列表 */}
      <ContentContainer>
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">
          出納單明細
        </h3>
        <EnhancedTable
          columns={disbursementColumns}
          data={filteredDisbursementOrders}
          emptyMessage="此月份沒有出納單"
        />
      </ContentContainer>
    </div>
  )
}
