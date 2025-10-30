'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Card } from '@/components/ui/card'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { useTourStore, useOrderStore } from '@/stores'
import type { Payment } from '@/stores/types'
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

export default function FinancePage() {
  const { items: _tours } = useTourStore()
  const { items: _orders } = useOrderStore()

  // TODO: 實作 payment store
  const payments: Payment[] = []

  // 計算財務統計
  const totalReceivable = payments
    .filter(p => p.type === 'receipt') // 收款
    .reduce((sum, p) => sum + p.amount, 0)

  const totalPayable = payments
    .filter(p => p.type === 'request') // 請款
    .reduce((sum, p) => sum + p.amount, 0)

  const pendingPayments = payments
    .filter(p => p.status === 'pending') // 待確認
    .reduce((sum, p) => sum + p.amount, 0)

  const netProfit = totalReceivable - totalPayable

  // 最近交易表格配置
  const recentPayments = payments.slice(0, 10) // 顯示最近10筆

  const transactionColumns: TableColumn[] = useMemo(
    () => [
      {
        key: 'type',
        label: '類型',
        sortable: true,
        render: (value, payment) => {
          const typeIcons = {
            收款: <TrendingUp size={16} className="text-morandi-green" />,
            請款: <TrendingDown size={16} className="text-morandi-red" />,
            出納: <DollarSign size={16} className="text-morandi-gold" />,
          }
          return (
            <div className="flex items-center space-x-2">
              {typeIcons[payment.type as keyof typeof typeIcons]}
              <span className="text-sm">{payment.type}</span>
            </div>
          )
        },
      },
      {
        key: 'description',
        label: '說明',
        sortable: true,
        render: (value, payment) => (
          <span className="text-sm text-morandi-primary">{payment.description}</span>
        ),
      },
      {
        key: 'amount',
        label: '金額',
        sortable: true,
        render: (value, payment) => {
          const isIncome = payment.type === '收款'
          return (
            <span
              className={cn(
                'text-sm font-medium',
                isIncome ? 'text-morandi-green' : 'text-morandi-red'
              )}
            >
              {isIncome ? '+' : '-'} NT$ {payment.amount.toLocaleString()}
            </span>
          )
        },
      },
      {
        key: 'status',
        label: '狀態',
        sortable: true,
        render: (value, payment) => {
          const statusColors = {
            已確認: 'text-morandi-green',
            待確認: 'text-morandi-gold',
            已完成: 'text-morandi-primary',
          }
          return (
            <span
              className={cn('text-sm', statusColors[payment.status as keyof typeof statusColors])}
            >
              {payment.status}
            </span>
          )
        },
      },
      {
        key: 'created_at',
        label: '日期',
        sortable: true,
        render: (value, payment) => (
          <span className="text-sm text-morandi-secondary">
            {new Date(payment.created_at).toLocaleDateString()}
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
      href: '/finance/payments',
      stats: `${payments.length} 筆記錄`,
      color: 'text-morandi-green',
      bgColor: 'bg-morandi-green/10',
    },
    {
      title: '出納管理',
      description: '日常收支與現金流管理',
      icon: Wallet,
      href: '/finance/treasury',
      stats: `${payments.filter(p => p.type === '出納').length} 筆交易`,
      color: 'text-morandi-gold',
      bgColor: 'bg-morandi-gold/10',
    },
    {
      title: '報表管理',
      description: '財務分析與統計報表',
      icon: BarChart3,
      href: '/finance/reports',
      stats: '即時財務分析',
      color: 'text-morandi-primary',
      bgColor: 'bg-morandi-primary/10',
    },
  ]

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader title="財務管理中心" />

      <div className="flex-1 overflow-auto">
        <div className="space-y-6">
          {/* 財務總覽 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-morandi-secondary mb-1">總收入</p>
                  <p className="text-2xl font-bold text-morandi-green">
                    NT$ {totalReceivable.toLocaleString()}
                  </p>
                </div>
                <TrendingUp size={24} className="text-morandi-green" />
              </div>
            </Card>

            <Card className="p-4 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-morandi-secondary mb-1">總支出</p>
                  <p className="text-2xl font-bold text-morandi-red">
                    NT$ {totalPayable.toLocaleString()}
                  </p>
                </div>
                <TrendingDown size={24} className="text-morandi-red" />
              </div>
            </Card>

            <Card className="p-4 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-morandi-secondary mb-1">淨利潤</p>
                  <p
                    className={`text-2xl font-bold ${netProfit >= 0 ? 'text-morandi-green' : 'text-morandi-red'}`}
                  >
                    NT$ {netProfit.toLocaleString()}
                  </p>
                </div>
                <DollarSign
                  size={24}
                  className={netProfit >= 0 ? 'text-morandi-green' : 'text-morandi-red'}
                />
              </div>
            </Card>

            <Card className="p-4 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-morandi-secondary mb-1">待確認款項</p>
                  <p className="text-2xl font-bold text-morandi-gold">
                    NT$ {pendingPayments.toLocaleString()}
                  </p>
                </div>
                <AlertTriangle size={24} className="text-morandi-gold" />
              </div>
            </Card>
          </div>

          {/* 功能模組 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {financeModules.map((module, index) => (
              <Link key={index} href={module.href}>
                <Card className="p-6 border border-border hover:shadow-lg transition-shadow cursor-pointer">
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
              </Link>
            ))}
          </div>

          {/* 最近交易 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-morandi-primary">最近交易</h3>
            <EnhancedTable columns={transactionColumns} data={recentPayments} />
          </div>
        </div>
      </div>
    </div>
  )
}
