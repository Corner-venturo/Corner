'use client'

import { UI_DELAYS } from '@/lib/constants/timeouts'
import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import {
  Plus,
  TrendingUp,
  Zap,
  Package,
  Edit3,
  ChevronRight,
  Wallet,
  CreditCard,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { AddAccountDialog } from '@/components/accounting/add-account-dialog'
import { AddTransactionDialog } from '@/components/accounting/add-transaction-dialog'
import { AccountsManagementDialog } from '@/components/accounting/accounts-management-dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAccountingStore } from '@/stores/accounting-store'
import { cn } from '@/lib/utils'
import { CurrencyCell } from '@/components/table-cells'

import { toast } from 'sonner'

export default function AccountingPage() {
  const router = useRouter()
  const { accounts, stats, categories, transactions, addTransaction, initialize } =
    useAccountingStore()
  const [isAccountsManagementOpen, setIsAccountsManagementOpen] = useState(false)
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false)
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)

  // 載入資料
  useEffect(() => {
    initialize()
  }, [])

  // 快速記帳狀態
  const [quickAccount, setQuickAccount] = useState(accounts.length > 0 ? accounts[0].id : '')
  const [quickAmount, setQuickAmount] = useState('')
  const [quickCategory, setQuickCategory] = useState('4') // 預設餐費
  const accountSelectRef = useRef<HTMLButtonElement>(null)
  const amountInputRef = useRef<HTMLInputElement>(null)
  const categorySelectRef = useRef<HTMLButtonElement>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)

  // 常用分類配置
  const quickCategories = [
    { id: '4', name: '餐費' },
    { id: '5', name: '交通' },
    { id: '6', name: '購物' },
    { id: '7', name: '娛樂' },
    { id: '8', name: '其他' },
  ]

  // 今日交易
  const today = new Date().toISOString().split('T')[0]
  const todayTransactions = useMemo(
    () =>
      transactions
        .filter(t => t.date === today)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
    [transactions, today]
  )

  // 快速記帳處理
  const handleQuickTransaction = useCallback(async () => {
    if (!quickAmount) {
      toast.error('請輸入金額')
      return
    }
    if (!quickCategory) {
      toast.error('請選擇分類')
      return
    }
    if (!quickAccount) {
      toast.error('請選擇帳戶')
      return
    }

    const categoryData = categories.find(c => c.id === quickCategory)
    const accountData = accounts.find(a => a.id === quickAccount)

    if (!categoryData || !accountData) {
      toast.error('找不到選擇的分類或帳戶')
      return
    }

    try {
      const transactionData = {
        account_id: quickAccount,
        account_name: accountData.name,
        category_id: quickCategory,
        category_name: categoryData.name,
        type: 'expense' as const,
        amount: parseFloat(quickAmount),
        currency: 'TWD',
        description: '',
        date: today,
      }

      addTransaction(transactionData)

      // 清空表單並顯示成功提示
      setQuickAmount('')
      toast.success('記帳成功')

      // 重新聚焦到金額輸入
      setTimeout(() => {
        amountInputRef.current?.focus()
      }, 100)
    } catch (error) {
      toast.error('記帳失敗，請稍後再試')
    }
  }, [quickAmount, quickCategory, quickAccount, categories, accounts, today, addTransaction])

  // 分類快速選擇
  const handleQuickCategorySelect = useCallback((category_id: string) => {
    setQuickCategory(category_id)
    setTimeout(() => {
      addButtonRef.current?.focus()
    }, 100)
  }, [])

  // 金額輸入完成
  const handleAmountComplete = useCallback(() => {
    if (quickAmount) {
      categorySelectRef.current?.focus()
    }
  }, [quickAmount])

  // 計算本月與上月差異
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

  const lastMonthExpense = useMemo(
    () =>
      transactions
        .filter(t => {
          const transactionDate = new Date(t.date)
          return (
            t.type === 'expense' &&
            transactionDate.getMonth() === lastMonth &&
            transactionDate.getFullYear() === lastMonthYear
          )
        })
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions, lastMonth, lastMonthYear]
  )

  const expenseDifference = lastMonthExpense - (stats?.monthly_expense || 0)
  const daysToEndOfMonth =
    new Date(currentYear, currentMonth + 1, 0).getDate() - new Date().getDate()

  return (
    <>
      {/* 使用標準 ResponsiveHeader - 添加自定義按鈕 */}
      <ResponsiveHeader
        title="記帳管理"
        icon={CreditCard}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '記帳管理', href: '/accounting' },
        ]}
      >
        {/* 自定義按鈕群組 */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsAccountsManagementOpen(true)}
            variant="outline"
            size="sm"
          >
            <Wallet className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">帳戶管理</span>
          </Button>
          <Button
            onClick={() => {
              if (accounts.length === 0) {
                setIsAddAccountOpen(true)
              } else {
                setIsAddTransactionOpen(true)
              }
            }}
            variant="default"
            size="sm"
            className="btn-gradient-primary"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">新增記帳</span>
          </Button>
        </div>
      </ResponsiveHeader>

      {/* 內容區 */}
      <div className="pt-[72px]">
        {/* ===== 電腦版佈局 (>= lg) ===== */}
        <div className="hidden lg:block p-6">
          {/* 統計卡片 - 使用標準 Card 元件 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* 支出卡片 */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>本月支出</CardDescription>
                <div className="text-2xl text-foreground">
                  <CurrencyCell amount={stats?.monthly_expense || 0} />
                </div>
              </CardHeader>
              <CardContent>
                {expenseDifference > 0 && (
                  <div className="text-xs text-morandi-green flex items-center gap-1">
                    <span>↓ 比上月省</span>
                    <CurrencyCell amount={expenseDifference} variant="income" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 收入卡片 */}
            <Card>
              <CardHeader>
                <CardDescription>本月收入</CardDescription>
                <div className="text-2xl">
                  <CurrencyCell amount={stats?.monthly_income || 0} variant="income" />
                </div>
              </CardHeader>
            </Card>

            {/* 月底倒數 */}
            <Card>
              <CardHeader>
                <CardDescription>距離月底</CardDescription>
                <CardTitle className="text-2xl text-morandi-gold">{daysToEndOfMonth} 天</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* 今日交易列表 - 使用標準 Card 和語意化顏色 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">今日交易</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/accounting/transactions')}
                  className="text-sm text-primary hover:text-primary/90"
                >
                  查看全部
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {todayTransactions.length > 0 ? (
                <div className="space-y-2">
                  {todayTransactions.map(transaction => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-background hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-foreground">
                            {transaction.category_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleTimeString('zh-TW', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-bold text-lg">
                          <CurrencyCell
                            amount={transaction.amount}
                            variant={transaction.type === 'expense' ? 'expense' : 'income'}
                            showSign
                          />
                        </span>
                        <Button variant="ghost" size="iconSm">
                          <Edit3 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package size={48} className="mx-auto mb-3 text-muted-foreground" />
                  <p className="text-foreground">今日還沒有交易紀錄</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    點擊右上角「新增記帳」開始
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ===== 手機版佈局 (< lg) - 使用標準 Card 和語意化顏色 ===== */}
        <div className="lg:hidden p-4 space-y-4">
          {/* 頂部統計卡片 */}
          <Card>
            <CardHeader>
              <CardDescription>本月支出</CardDescription>
              <div className="text-3xl">
                <CurrencyCell amount={stats?.monthly_expense || 0} />
              </div>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-morandi-green">
                  <TrendingUp size={14} />
                  <span className="flex items-center gap-1">
                    收入 <CurrencyCell amount={stats?.monthly_income || 0} variant="income" />
                  </span>
                </div>
                {expenseDifference > 0 && (
                  <span className="text-morandi-green flex items-center gap-1">
                    ↓ 省 <CurrencyCell amount={expenseDifference} variant="income" />
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                距離月底 {daysToEndOfMonth} 天
              </div>
            </CardContent>
          </Card>

          {/* 快速記帳卡片 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">快速記帳</h2>
              </div>
            </CardHeader>
            <CardContent>
              {/* 帳戶選擇 */}
              <div className="mb-4">
                <label className="text-xs text-muted-foreground mb-2 block">帳戶</label>
                <Select value={quickAccount} onValueChange={setQuickAccount}>
                  <SelectTrigger ref={accountSelectRef} className="h-12 rounded-lg">
                    <SelectValue>
                      <Wallet size={16} className="inline mr-2" />
                      {accounts.find(a => a.id === quickAccount)?.name || '請選擇帳戶'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.length > 0 ? (
                      accounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        尚無帳戶，請先新增
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* 金額輸入、分類選擇、記帳按鈕 */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {/* 金額輸入 */}
                <div className="col-span-1">
                  <label className="text-xs text-muted-foreground mb-1 block">金額</label>
                  <input
                    ref={amountInputRef}
                    type="number"
                    value={quickAmount}
                    onChange={e => setQuickAmount(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAmountComplete()}
                    placeholder="0"
                    className="w-full h-12 text-lg font-bold bg-background border border-input rounded-lg px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* 分類選擇 */}
                <div className="col-span-1">
                  <label className="text-xs text-muted-foreground mb-1 block">分類</label>
                  <Select value={quickCategory} onValueChange={setQuickCategory}>
                    <SelectTrigger ref={categorySelectRef} className="h-12 rounded-lg">
                      <SelectValue>
                        {quickCategories.find(c => c.id === quickCategory)?.name || '餐費'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {quickCategories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 記帳按鈕 */}
                <div className="col-span-1">
                  <label className="text-xs text-transparent mb-1 block">-</label>
                  <Button
                    ref={addButtonRef}
                    onClick={handleQuickTransaction}
                    disabled={!quickAmount || !quickCategory || !quickAccount}
                    className="w-full h-12 font-semibold rounded-lg"
                    size="default"
                    variant="default"
                  >
                    <Plus size={18} className="mr-1" />
                    記帳
                  </Button>
                </div>
              </div>

              {/* 常用分類快速選擇 */}
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">常用分類</div>
                <div className="grid grid-cols-3 gap-2">
                  {quickCategories.map(category => (
                    <Button
                      key={category.id}
                      onClick={() => handleQuickCategorySelect(category.id)}
                      variant={quickCategory === category.id ? 'default' : 'outline'}
                      size="sm"
                      className="transition-all active:scale-95"
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 今日交易列表 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">今日交易</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/accounting/transactions')}
                  className="text-sm text-primary hover:text-primary/90"
                >
                  查看全部
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {todayTransactions.length > 0 ? (
                <div className="space-y-2">
                  {todayTransactions.map(transaction => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate text-foreground">
                            {transaction.category_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleTimeString('zh-TW', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-bold text-lg">
                          <CurrencyCell
                            amount={transaction.amount}
                            variant={transaction.type === 'expense' ? 'expense' : 'income'}
                            showSign
                          />
                        </span>
                        <Button variant="ghost" size="iconSm">
                          <Edit3 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package size={48} className="mx-auto mb-3 text-muted-foreground" />
                  <p className="text-foreground">今日還沒有交易紀錄</p>
                  <p className="text-sm text-muted-foreground mt-1">使用上方快速記帳開始吧</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 帳戶管理對話框 */}
      <AccountsManagementDialog
        isOpen={isAccountsManagementOpen}
        onClose={() => setIsAccountsManagementOpen(false)}
        onAddAccount={() => setIsAddAccountOpen(true)}
      />

      {/* 新增帳戶對話框 */}
      <AddAccountDialog isOpen={isAddAccountOpen} onClose={() => setIsAddAccountOpen(false)} />

      {/* 新增記帳對話框 */}
      <AddTransactionDialog
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
      />
    </>
  )
}
