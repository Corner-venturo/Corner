'use client'

import React from 'react'
import { useAccountingStore } from '@/stores/accounting-store'
import { Wallet, CreditCard, PiggyBank, TrendingUp, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

const accountTypeIcons = {
  cash: Wallet,
  bank: CreditCard,
  credit: CreditCard,
  investment: TrendingUp,
  other: PiggyBank,
}

const accountTypeLabels = {
  cash: '現金',
  bank: '銀行帳戶',
  credit: '信用卡',
  investment: '投資帳戶',
  other: '其他帳戶',
}

export const AccountsOverview = React.memo(function AccountsOverview() {
  const { accounts, stats } = useAccountingStore()

  // 按帳戶類型分組
  const accountsByType = accounts.reduce(
    (groups, account) => {
      if (!groups[account.type]) {
        groups[account.type] = []
      }
      groups[account.type].push(account)
      return groups
    },
    {} as Record<string, typeof accounts>
  )

  return (
    <div className="space-y-8">
      {/* 帳戶總覽 */}
      <div>
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">我的帳戶</h3>
        <div className="space-y-6">
          {Object.entries(accountsByType).map(([type, accountsOfType]) => {
            const Icon = accountTypeIcons[type as keyof typeof accountTypeIcons] || Wallet
            const typeLabel = accountTypeLabels[type as keyof typeof accountTypeLabels] || type
            const totalBalance = accountsOfType.reduce((sum, acc) => sum + acc.balance, 0)

            return (
              <div key={type} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon size={20} className="text-morandi-secondary" />
                    <span className="font-medium text-morandi-primary">{typeLabel}</span>
                  </div>
                  <span
                    className={cn(
                      'font-semibold',
                      totalBalance >= 0 ? 'text-morandi-green' : 'text-morandi-red'
                    )}
                  >
                    {totalBalance >= 0 ? '+' : ''}NT$ {totalBalance.toLocaleString()}
                  </span>
                </div>

                {/* 該類型的帳戶列表 */}
                <div className="space-y-2 ml-7">
                  {accountsOfType.map(account => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-morandi-container/30 transition-colors border border-morandi-container/50"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: account.color }}
                        />
                        <div>
                          <div className="font-medium text-morandi-primary">{account.name}</div>
                          {account.description && (
                            <div className="text-sm text-morandi-secondary">
                              {account.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span
                          className={cn(
                            'font-semibold',
                            account.balance >= 0 ? 'text-morandi-green' : 'text-morandi-red'
                          )}
                        >
                          {account.balance >= 0 ? '+' : ''}NT$ {account.balance.toLocaleString()}
                        </span>
                        <button className="text-morandi-secondary hover:text-morandi-primary">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 支出分析 */}
      {stats.category_breakdown.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-morandi-primary mb-4">支出分析</h3>
          <div className="space-y-3">
            {stats.category_breakdown.slice(0, 6).map(category => (
              <div key={category.category_id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-morandi-primary font-medium">{category.category_name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-morandi-secondary">
                      {category.percentage.toFixed(1)}%
                    </span>
                    <span className="font-semibold text-morandi-red">
                      NT$ {category.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-morandi-container/30 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-morandi-gold to-morandi-gold-hover h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(category.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}

            {stats.category_breakdown.length > 6 && (
              <div className="text-center pt-3">
                <button className="text-sm text-morandi-secondary hover:text-morandi-primary">
                  查看全部分類 ({stats.category_breakdown.length - 6} 項)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 本月統計 */}
      <div>
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">本月統計</h3>
        <div className="bg-morandi-container/10 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-morandi-secondary">收入</span>
            <span className="font-semibold text-morandi-green">
              +NT$ {stats.monthly_income.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-morandi-secondary">支出</span>
            <span className="font-semibold text-morandi-red">
              -NT$ {stats.monthly_expense.toLocaleString()}
            </span>
          </div>
          <div className="h-px bg-border my-2" />
          <div className="flex items-center justify-between">
            <span className="font-medium text-morandi-primary">結餘</span>
            <span
              className={cn(
                'font-bold text-lg',
                stats.monthly_income - stats.monthly_expense >= 0
                  ? 'text-morandi-green'
                  : 'text-morandi-red'
              )}
            >
              {stats.monthly_income - stats.monthly_expense >= 0 ? '+' : ''}
              NT$ {(stats.monthly_income - stats.monthly_expense).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
})
