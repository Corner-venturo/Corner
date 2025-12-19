'use client'

import { useMemo } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Card } from '@/components/ui/card'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  BarChart3,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { demoPayments, demoStats, formatCurrency } from '@/lib/demo/demo-data'

// Demo 交易類型
interface DemoTransaction {
  id: string
  type: 'income' | 'expense' | 'transfer'
  description: string
  amount: number
  date: string
  order_number?: string
  customer_name?: string
}

// 將 demo payments 轉換成交易記錄
const demoTransactions: DemoTransaction[] = demoPayments.map(p => ({
  id: p.id,
  type: 'income' as const,
  description: `${p.customer_name} - ${p.note}`,
  amount: p.amount,
  date: p.date,
  order_number: p.order_number,
  customer_name: p.customer_name,
}))

export default function DemoFinancePage() {
  // 統計數據
  const totalReceivable = demoPayments.filter(p => p.status === 'confirmed').reduce((sum, p) => sum + p.amount, 0)
  const totalPending = demoStats.pendingPayments.reduce((sum, p) => sum + p.amount, 0)
  const netProfit = totalReceivable - (totalReceivable * 0.3) // 假設 30% 成本

  // 表格欄位定義
  const transactionColumns: TableColumn<DemoTransaction>[] = useMemo(
    () => [
      {
        key: 'type',
        label: '類型',
        sortable: true,
        render: (_value, transaction) => {
          const typeIcons: Record<string, React.ReactNode> = {
            income: <TrendingUp size={16} className="text-morandi-green" />,
            expense: <TrendingDown size={16} className="text-morandi-red" />,
            transfer: <DollarSign size={16} className="text-morandi-gold" />,
          }
          const typeLabels: Record<string, string> = {
            income: '收入',
            expense: '支出',
            transfer: '轉帳',
          }
          return (
            <div className="flex items-center space-x-2">
              {typeIcons[transaction.type]}
              <span className="text-sm">{typeLabels[transaction.type] || transaction.type}</span>
            </div>
          )
        },
      },
      {
        key: 'description',
        label: '說明',
        sortable: true,
        render: (_value, transaction) => (
          <div>
            <span className="text-sm text-morandi-primary">{transaction.description}</span>
            {transaction.order_number && (
              <span className="ml-2 text-xs text-morandi-secondary">({transaction.order_number})</span>
            )}
          </div>
        ),
      },
      {
        key: 'amount',
        label: '金額',
        sortable: true,
        render: (_value, transaction) => {
          const isIncome = transaction.type === 'income'
          return (
            <span
              className={cn(
                'text-sm font-medium',
                isIncome ? 'text-morandi-green' : 'text-morandi-red'
              )}
            >
              {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
            </span>
          )
        },
      },
      {
        key: 'date',
        label: '日期',
        sortable: true,
        render: (_value, transaction) => (
          <span className="text-sm text-morandi-secondary">
            {transaction.date}
          </span>
        ),
      },
    ],
    []
  )

  const financeModules = [
    {
      title: '財務管理',
      description: '管理所有收款和請款記錄',
      icon: CreditCard,
      stats: `${demoPayments.length} 筆記錄`,
      color: 'text-morandi-green',
      bgColor: 'bg-morandi-green/10',
    },
    {
      title: '出納管理',
      description: '日常收支與現金流管理',
      icon: Wallet,
      stats: '即時現金流',
      color: 'text-morandi-gold',
      bgColor: 'bg-morandi-gold/10',
    },
    {
      title: '報表管理',
      description: '財務分析與統計報表',
      icon: BarChart3,
      stats: '即時財務分析',
      color: 'text-morandi-primary',
      bgColor: 'bg-morandi-primary/10',
    },
  ]

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="財務管理中心"
        breadcrumb={[
          { label: '首頁', href: '/demo' },
          { label: '財務管理', href: '/demo/finance' },
        ]}
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* 財務總覽 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-morandi-green/10 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-morandi-secondary mb-1">總收入</p>
                  <p className="text-2xl font-bold text-morandi-green">
                    {formatCurrency(totalReceivable)}
                  </p>
                </div>
                <TrendingUp size={24} className="text-morandi-green" />
              </div>
            </Card>

            <Card className="p-4 bg-morandi-red/10 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-morandi-secondary mb-1">總支出</p>
                  <p className="text-2xl font-bold text-morandi-red">
                    {formatCurrency(Math.round(totalReceivable * 0.3))}
                  </p>
                </div>
                <TrendingDown size={24} className="text-morandi-red" />
              </div>
            </Card>

            <Card className="p-4 bg-morandi-primary/10 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-morandi-secondary mb-1">淨利潤</p>
                  <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-morandi-primary' : 'text-morandi-red'}`}>
                    {formatCurrency(Math.round(netProfit))}
                  </p>
                </div>
                <DollarSign size={24} className="text-morandi-primary" />
              </div>
            </Card>

            <Card className="p-4 bg-morandi-gold/10 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-morandi-secondary mb-1">待確認款項</p>
                  <p className="text-2xl font-bold text-morandi-gold">
                    {formatCurrency(totalPending)}
                  </p>
                </div>
                <AlertTriangle size={24} className="text-morandi-gold" />
              </div>
            </Card>
          </div>

          {/* 功能模組 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {financeModules.map((module, index) => (
              <Card
                key={index}
                className="p-6 border border-border hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => alert(`DEMO 模式：${module.title}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className={`p-2 rounded-lg ${module.bgColor} mr-3`}>
                        <module.icon size={24} className={module.color} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-morandi-primary">{module.title}</h4>
                        <p className="text-sm text-morandi-secondary">{module.description}</p>
                      </div>
                    </div>
                    <div className="text-sm text-morandi-secondary">{module.stats}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* 交易紀錄 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-morandi-primary">交易紀錄</h3>
            <EnhancedTable
              columns={transactionColumns}
              data={demoTransactions}
              onRowClick={(transaction) => alert(`DEMO 模式：查看交易 ${transaction.description}`)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
