'use client'

import React, { useState } from 'react'
import { useAccountingStore } from '@/stores/accounting-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  Calendar,
  Search,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { alertError } from '@/lib/ui/alert-dialog'
import { ConfirmDialog } from '@/components/dialog/confirm-dialog'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'

const transactionTypeIcons = {
  income: ArrowUpRight,
  expense: ArrowDownRight,
  transfer: ArrowRightLeft,
}

export const TransactionList = React.memo(function TransactionList() {
  const { transactions, deleteTransaction } = useAccountingStore()
  const [searchText, setSearchText] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all')
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('month')
  const { confirm, confirmDialogProps } = useConfirmDialog()

  const handleDeleteTransaction = async (
    transactionId: string,
    description: string,
    amount: number
  ) => {
    const confirmed = await confirm({
      type: 'danger',
      title: '刪除交易',
      message: '確定要刪除此筆交易嗎？',
      details: [
        `金額：NT$ ${amount.toLocaleString()}`,
        `說明：${description || '無'}`,
        '',
        '⚠️ 此操作會影響帳戶餘額統計',
      ],
      confirmLabel: '確認刪除',
      cancelLabel: '取消',
    })

    if (!confirmed) {
      return
    }

    try {
      deleteTransaction(transactionId)
    } catch (err) {
      await alertError('刪除失敗，請稍後再試')
    }
  }

  // 篩選交易
  const filteredTransactions = transactions.filter(transaction => {
    // 搜尋篩選
    const matchesSearch =
      !searchText ||
      transaction.description?.toLowerCase().includes(searchText.toLowerCase()) ||
      transaction.category_name.toLowerCase().includes(searchText.toLowerCase()) ||
      transaction.account_name.toLowerCase().includes(searchText.toLowerCase())

    // 類型篩選
    const matchesType = filterType === 'all' || transaction.type === filterType

    // 日期篩選
    let matchesDate = true
    const transactionDate = new Date(transaction.date)
    const now = new Date()

    switch (dateRange) {
      case 'today':
        matchesDate = transactionDate.toDateString() === now.toDateString()
        break
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        matchesDate = transactionDate >= weekAgo
        break
      case 'month':
        matchesDate =
          transactionDate.getMonth() === now.getMonth() &&
          transactionDate.getFullYear() === now.getFullYear()
        break
    }

    return matchesSearch && matchesType && matchesDate
  })

  // 按日期排序（最新的在前）
  const sortedTransactions = filteredTransactions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="space-y-6">
      {/* 篩選和搜尋 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-morandi-secondary"
            size={16}
          />
          <Input
            placeholder="搜尋交易..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          {/* 類型篩選 */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as unknown)}
            className="px-3 py-2 border border-border rounded-md bg-background text-sm"
          >
            <option value="all">全部類型</option>
            <option value="income">收入</option>
            <option value="expense">支出</option>
            <option value="transfer">轉帳</option>
          </select>

          {/* 日期篩選 */}
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value as unknown)}
            className="px-3 py-2 border border-border rounded-md bg-background text-sm"
          >
            <option value="all">全部時間</option>
            <option value="today">今天</option>
            <option value="week">本週</option>
            <option value="month">本月</option>
          </select>
        </div>
      </div>

      {/* 統計摘要 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-morandi-container/10 rounded-lg">
        <div className="text-center">
          <div className="text-sm text-morandi-secondary">收入</div>
          <div className="text-lg font-semibold text-morandi-green">
            +NT${' '}
            {filteredTransactions
              .filter(t => t.type === 'income')
              .reduce((sum, t) => sum + t.amount, 0)
              .toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-morandi-secondary">支出</div>
          <div className="text-lg font-semibold text-morandi-red">
            -NT${' '}
            {filteredTransactions
              .filter(t => t.type === 'expense')
              .reduce((sum, t) => sum + t.amount, 0)
              .toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-morandi-secondary">結餘</div>
          <div
            className={cn(
              'text-lg font-semibold',
              filteredTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0) -
                filteredTransactions
                  .filter(t => t.type === 'expense')
                  .reduce((sum, t) => sum + t.amount, 0) >=
                0
                ? 'text-morandi-green'
                : 'text-morandi-red'
            )}
          >
            {filteredTransactions
              .filter(t => t.type === 'income')
              .reduce((sum, t) => sum + t.amount, 0) -
              filteredTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0) >=
            0
              ? '+'
              : ''}
            NT${' '}
            {(
              filteredTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0) -
              filteredTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0)
            ).toLocaleString()}
          </div>
        </div>
      </div>

      {/* 交易列表 */}
      <div className="space-y-2">
        {sortedTransactions.length === 0 ? (
          <div className="space-y-6">
            {/* 空狀態提示 */}
            <div className="text-center py-8 text-morandi-secondary">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium text-morandi-primary mb-2">
                沒有找到相符的交易記錄
              </p>
              <p className="text-sm text-morandi-secondary">
                {searchText || filterType !== 'all' || dateRange !== 'all'
                  ? '嘗試調整篩選條件或新增交易記錄'
                  : '開始新增收入、支出或轉帳記錄'}
              </p>
            </div>

            {/* 示例交易記錄 */}
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-medium text-morandi-primary mb-4">預覽：交易記錄樣式</h3>
              <div className="space-y-2">
                {[
                  {
                    type: 'income',
                    category_name: '薪資收入',
                    account_name: '台幣現金',
                    description: '2024年1月薪水',
                    amount: 45000,
                    date: new Date().toLocaleDateString('zh-TW'),
                  },
                  {
                    type: 'expense',
                    category_name: '餐費',
                    account_name: '信用卡',
                    description: '午餐 - 便當',
                    amount: 120,
                    date: new Date().toLocaleDateString('zh-TW'),
                  },
                  {
                    type: 'transfer',
                    category_name: '轉帳',
                    account_name: '銀行帳戶',
                    to_account_name: '投資帳戶',
                    description: '定期投資',
                    amount: 10000,
                    date: new Date().toLocaleDateString('zh-TW'),
                  },
                  {
                    type: 'expense',
                    category_name: '交通',
                    account_name: '悠遊卡',
                    description: '捷運通勤',
                    amount: 30,
                    date: new Date().toLocaleDateString('zh-TW'),
                  },
                ].map((transaction, index) => {
                  const Icon =
                    transactionTypeIcons[transaction.type as keyof typeof transactionTypeIcons]
                  const isIncome = transaction.type === 'income'
                  const isExpense = transaction.type === 'expense'

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-border rounded-lg opacity-60"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            isIncome && 'bg-morandi-green/10',
                            isExpense && 'bg-morandi-red/10',
                            transaction.type === 'transfer' && 'bg-morandi-blue/10'
                          )}
                        >
                          <Icon
                            className={cn(
                              'w-5 h-5',
                              isIncome && 'text-morandi-green',
                              isExpense && 'text-morandi-red',
                              transaction.type === 'transfer' && 'text-morandi-blue'
                            )}
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-morandi-primary">
                              {transaction.category_name}
                            </span>
                            <span className="text-sm text-morandi-secondary">
                              • {transaction.account_name}
                            </span>
                          </div>
                          <div className="text-sm text-morandi-secondary">
                            {transaction.description || '無備註'}
                          </div>
                          <div className="text-xs text-morandi-secondary">{transaction.date}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={cn(
                            'text-lg font-semibold',
                            isIncome && 'text-morandi-green',
                            isExpense && 'text-morandi-red',
                            transaction.type === 'transfer' && 'text-morandi-blue'
                          )}
                        >
                          {isIncome && '+'}
                          {isExpense && '-'}
                          {transaction.type === 'transfer' && ''}
                          NT$ {transaction.amount.toLocaleString()}
                        </div>
                        {transaction.type === 'transfer' && transaction.to_account_name && (
                          <div className="text-xs text-morandi-secondary">
                            轉至 {transaction.to_account_name}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 p-4 bg-morandi-container/10 rounded-lg text-center">
                <p className="text-sm text-morandi-secondary">
                  💡 以上為交易記錄樣式預覽，實際資料建立後將顯示真實內容
                </p>
              </div>
            </div>
          </div>
        ) : (
          sortedTransactions.map(transaction => {
            const Icon = transactionTypeIcons[transaction.type]
            const isIncome = transaction.type === 'income'
            const isExpense = transaction.type === 'expense'

            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-morandi-container/20 transition-colors group"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      isIncome && 'bg-morandi-green/10',
                      isExpense && 'bg-morandi-red/10',
                      transaction.type === 'transfer' && 'bg-morandi-blue/10'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5',
                        isIncome && 'text-morandi-green',
                        isExpense && 'text-morandi-red',
                        transaction.type === 'transfer' && 'text-morandi-blue'
                      )}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-morandi-primary">
                        {transaction.category_name}
                      </span>
                      <span className="text-sm text-morandi-secondary">
                        • {transaction.account_name}
                      </span>
                    </div>
                    <div className="text-sm text-morandi-secondary">
                      {transaction.description || '無備註'}
                    </div>
                    <div className="text-xs text-morandi-secondary">
                      {new Date(transaction.date).toLocaleDateString('zh-TW')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div
                      className={cn(
                        'text-lg font-semibold',
                        isIncome && 'text-morandi-green',
                        isExpense && 'text-morandi-red',
                        transaction.type === 'transfer' && 'text-morandi-blue'
                      )}
                    >
                      {isIncome && '+'}
                      {isExpense && '-'}
                      {transaction.type === 'transfer' && ''}
                      NT$ {transaction.amount.toLocaleString()}
                    </div>
                    {transaction.type === 'transfer' && transaction.to_account_name && (
                      <div className="text-xs text-morandi-secondary">
                        轉至 {transaction.to_account_name}
                      </div>
                    )}
                  </div>

                  {/* 刪除按鈕 - 懸停顯示 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleDeleteTransaction(
                        transaction.id,
                        transaction.description || '',
                        transaction.amount
                      )
                    }
                    className="h-8 w-8 p-0 text-morandi-red hover:bg-morandi-red/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="刪除交易"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 載入更多按鈕 */}
      {sortedTransactions.length > 0 && (
        <div className="text-center">
          <Button variant="outline" size="sm">
            載入更多交易
          </Button>
        </div>
      )}
      <ConfirmDialog {...confirmDialogProps} />
    </div>
  )
})
