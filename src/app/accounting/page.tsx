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

export default function AccountingPage() {
  const router = useRouter()
  const { accounts, stats, categories, transactions, addTransaction, initialize } =
    useAccountingStore()
  const [isAccountsManagementOpen, setIsAccountsManagementOpen] = useState(false)
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false)
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)

  // 初始化資料
  useEffect(() => {
    initialize()
  }, [])

  // 快速記帳狀態
  const [quickAccount, setQuickAccount] = useState(accounts.length > 0 ? accounts[0].id : '')
  const [quickAmount, setQuickAmount] = useState('')
  const [quickCategory, setQuickCategory] = useState('4') // 預設餐費
  const [showToast, setShowToast] = useState(false)
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
    if (!quickAmount || !quickCategory || !quickAccount) return

    const categoryData = categories.find(c => c.id === quickCategory)
    const accountData = accounts.find(a => a.id === quickAccount)

    if (!categoryData || !accountData) return

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

    // 清空表單並顯示成功動畫
    setQuickAmount('')
    setShowToast(true)
    setTimeout(() => setShowToast(false), UI_DELAYS.SUCCESS_MESSAGE)

    // 重新聚焦到金額輸入
    setTimeout(() => {
      amountInputRef.current?.focus()
    }, 100)
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
            className="border-[#E0D8CC] text-[#6B5D52] hover:bg-[#FAF8F5]"
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
            className="bg-[#C9A961] hover:bg-[#B8985A] text-white"
            size="sm"
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
          {/* 統計卡片 - 柔和莫蘭迪色系 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* 支出卡片 - 柔和粉米色 */}
            <div className="bg-gradient-to-br from-[#F5F0EB] to-[#EDE8E0] rounded-xl p-6">
              <div className="text-[#9E8F81] text-sm mb-2">本月支出</div>
              <div className="text-2xl font-bold text-[#6B5D52]">
                NT$ {(stats?.monthly_expense || 0).toLocaleString()}
              </div>
              {expenseDifference > 0 && (
                <div className="text-xs text-[#A8B4A5] mt-2">
                  ↓ 比上月省 NT$ {expenseDifference.toLocaleString()}
                </div>
              )}
            </div>

            {/* 收入卡片 - 柔和綠米色 */}
            <div className="bg-gradient-to-br from-[#F5F0EB] to-[#E8EDE8] rounded-xl p-6">
              <div className="text-[#9E8F81] text-sm mb-2">本月收入</div>
              <div className="text-2xl font-bold text-[#7B9B7E]">
                NT$ {(stats?.monthly_income || 0).toLocaleString()}
              </div>
            </div>

            {/* 月底倒數 - 柔和金米色 */}
            <div className="bg-gradient-to-br from-[#F9F5ED] to-[#F5EDDC] rounded-xl p-6">
              <div className="text-[#9E8F81] text-sm mb-2">距離月底</div>
              <div className="text-2xl font-bold text-[#C9A961]">{daysToEndOfMonth} 天</div>
            </div>
          </div>

          {/* 今日交易列表 - 柔和配色 */}
          <div className="bg-gradient-to-br from-[#FAF8F5] to-[#F5F0EB] rounded-xl p-6 border border-[#EDE8E0]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#3D2914]">今日交易</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/accounting/transactions')}
                className="text-sm flex items-center gap-1 text-[#C9A961] hover:text-[#B89651]"
              >
                查看全部
                <ChevronRight size={16} />
              </Button>
            </div>

            {todayTransactions.length > 0 ? (
              <div className="space-y-2">
                {todayTransactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/60 border border-[#EDE8E0] hover:border-[#D4C5A8] transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-[#3D2914]">
                          {transaction.category_name}
                        </div>
                        <div className="text-sm text-[#9E8F81]">
                          {new Date(transaction.created_at).toLocaleTimeString('zh-TW', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span
                        className={cn(
                          'font-bold text-lg',
                          transaction.type === 'expense' ? 'text-[#C89B9B]' : 'text-[#7B9B7E]'
                        )}
                      >
                        {transaction.type === 'expense' ? '-' : '+'}NT${' '}
                        {transaction.amount.toLocaleString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 text-[#9E8F81] hover:text-[#6B5D52]"
                      >
                        <Edit3 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto mb-3 text-[#AFA598]" />
                <p className="text-[#3D2914]">今日還沒有交易紀錄</p>
                <p className="text-sm text-[#9E8F81] mt-1">點擊右上角「新增記帳」開始</p>
              </div>
            )}
          </div>
        </div>

        {/* ===== 手機版佈局 (< lg) ===== */}
        <div className="lg:hidden p-4 space-y-4">
          {/* 頂部統計卡片 - 柔和漸層 */}
          <div className="bg-gradient-to-br from-[#F9F5ED] to-[#F0E8D8] rounded-xl p-6">
            <div className="text-[#9E8F81] text-sm mb-1">本月支出</div>
            <div className="text-3xl font-bold text-[#6B5D52] mb-2">
              NT$ {(stats?.monthly_expense || 0).toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-[#7B9B7E]">
                <TrendingUp size={14} />
                <span>收入 NT$ {(stats?.monthly_income || 0).toLocaleString()}</span>
              </div>
              {expenseDifference > 0 && (
                <span className="text-[#A8B4A5]">
                  ↓ 省 NT$ {expenseDifference.toLocaleString()}
                </span>
              )}
            </div>
            <div className="text-xs text-[#AFA598] mt-2">距離月底 {daysToEndOfMonth} 天</div>
          </div>

          {/* 快速記帳卡片 - 柔和莫蘭迪 */}
          <div className="bg-gradient-to-br from-[#FAF8F5] to-[#F5F0EB] rounded-xl p-6 border border-[#EDE8E0]">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-[#C9A961]" />
              <h2 className="text-lg font-semibold text-[#3D2914]">快速記帳</h2>
            </div>

            {/* 帳戶選擇 */}
            <div className="mb-4">
              <label className="text-xs text-[#9E8F81] mb-2 block">帳戶</label>
              <Select value={quickAccount} onValueChange={setQuickAccount}>
                <SelectTrigger
                  ref={accountSelectRef}
                  className="h-12 border border-[#E0D8CC] rounded-lg bg-white/60 text-[#3D2914]"
                >
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
                <label className="text-xs text-[#9E8F81] mb-1 block">金額</label>
                <input
                  ref={amountInputRef}
                  type="number"
                  value={quickAmount}
                  onChange={e => setQuickAmount(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAmountComplete()}
                  placeholder="0"
                  className="w-full h-12 text-lg font-bold bg-white/60 border border-[#E0D8CC] rounded-lg px-3 text-[#3D2914] placeholder-[#AFA598] focus:outline-none focus:border-[#C9A961]"
                />
              </div>

              {/* 分類選擇 */}
              <div className="col-span-1">
                <label className="text-xs text-[#9E8F81] mb-1 block">分類</label>
                <Select value={quickCategory} onValueChange={setQuickCategory}>
                  <SelectTrigger
                    ref={categorySelectRef}
                    className="h-12 border border-[#E0D8CC] rounded-lg bg-white/60 text-[#3D2914]"
                  >
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
                  className="w-full h-12 bg-[#C9A961] hover:bg-[#B89651] text-white font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={18} className="mr-1" />
                  記帳
                </Button>
              </div>
            </div>

            {/* 常用分類快速選擇 */}
            <div className="space-y-3">
              <div className="text-xs text-[#9E8F81]">常用分類</div>
              <div className="grid grid-cols-3 gap-2">
                {quickCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleQuickCategorySelect(category.id)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium border transition-all active:scale-95',
                      quickCategory === category.id
                        ? 'bg-[#C9A961] text-white border-[#C9A961]'
                        : 'bg-white/60 text-[#6B5D52] border-[#E0D8CC] hover:border-[#C9A961]'
                    )}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 今日交易列表 - 柔和配色 */}
          <div className="bg-gradient-to-br from-[#FAF8F5] to-[#F5F0EB] rounded-xl p-6 border border-[#EDE8E0]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#3D2914]">今日交易</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/accounting/transactions')}
                className="text-sm flex items-center gap-1 text-[#C9A961] hover:text-[#B89651]"
              >
                查看全部
                <ChevronRight size={16} />
              </Button>
            </div>

            {todayTransactions.length > 0 ? (
              <div className="space-y-2">
                {todayTransactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/60 border border-[#EDE8E0] hover:border-[#D4C5A8] transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate text-[#3D2914]">
                          {transaction.category_name}
                        </div>
                        <div className="text-sm text-[#9E8F81]">
                          {new Date(transaction.created_at).toLocaleTimeString('zh-TW', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={cn(
                          'font-bold text-lg',
                          transaction.type === 'expense' ? 'text-[#C89B9B]' : 'text-[#7B9B7E]'
                        )}
                      >
                        {transaction.type === 'expense' ? '-' : '+'}NT${' '}
                        {transaction.amount.toLocaleString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 text-[#9E8F81] hover:text-[#6B5D52]"
                      >
                        <Edit3 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto mb-3 text-[#AFA598]" />
                <p className="text-[#3D2914]">今日還沒有交易紀錄</p>
                <p className="text-sm text-[#9E8F81] mt-1">使用上方快速記帳開始吧</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 成功提示Toast */}
      {showToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="font-medium">記帳成功</span>
          </div>
        </div>
      )}

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
