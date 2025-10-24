'use client';

import React, { useState, useRef, useMemo, useCallback } from 'react';

import {
  Wallet,
  Plus,
  TrendingUp,
  ArrowUpDown,
  BarChart3,
  Settings,
  Zap,
  Package,
  Edit3,
} from 'lucide-react';

import { AccountsManagement } from '@/components/accounting/accounts-management';
import { AddAccountDialog } from '@/components/accounting/add-account-dialog';
import { TransactionList } from '@/components/accounting/transaction-list';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccountingStore } from '@/stores/accounting-store';

import { cn } from '@/lib/utils';

export default function AccountingPage() {
  const { accounts, stats, categories, transactions, addTransaction } = useAccountingStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'accounts' | 'settings'>('overview');
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [theme, setTheme] = useState<'morandi' | 'moneypro'>('morandi');

  // 快速記帳狀態
  const [quickAmount, setQuickAmount] = useState('');
  const [quickCategory, setQuickCategory] = useState('4'); // 預設餐費
  const [quickAccount] = useState(accounts.length > 0 ? accounts[0].id : '');
  const [showToast, setShowToast] = useState(false);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const categorySelectRef = useRef<HTMLButtonElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  const tabs = [
    { id: 'overview', label: '總覽', icon: BarChart3 },
    { id: 'transactions', label: '交易', icon: ArrowUpDown },
    { id: 'accounts', label: '帳戶', icon: Wallet },
    { id: 'settings', label: '設定', icon: Settings },
  ];

  // 常用分類配置
  const quickCategories = [
    { id: '4', name: '餐費', icon: 'Food', color: '#F97316' },
    { id: '5', name: '交通', icon: 'Transport', color: '#8B5CF6' },
    { id: '6', name: '購物', icon: 'Shopping', color: '#EC4899' },
    { id: '7', name: '娛樂', icon: 'Game', color: '#6366F1' },
    { id: '8', name: '其他', icon: 'Other', color: '#6B7280' },
  ];

  // 今日交易
  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = useMemo(() =>
    transactions
      .filter(t => t.date === today)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
  , [transactions, today]);

  // 快速記帳處理
  const handleQuickTransaction = useCallback(async () => {
    if (!quickAmount || !quickCategory || !quickAccount) return;

    const categoryData = categories.find(c => c.id === quickCategory);
    const accountData = accounts.find(a => a.id === quickAccount);

    if (!categoryData || !accountData) return;

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
    };

    addTransaction(transactionData);

    // 清空表單並顯示成功動畫
    setQuickAmount('');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);

    // 重新聚焦到金額輸入
    setTimeout(() => {
      amountInputRef.current?.focus();
    }, 100);
  }, [quickAmount, quickCategory, quickAccount, categories, accounts, today, addTransaction]);

  // 分類快速選擇
  const handleQuickCategorySelect = useCallback((category_id: string) => {
    setQuickCategory(category_id);
    setTimeout(() => {
      addButtonRef.current?.focus();
    }, 100);
  }, []);

  // 金額輸入完成
  const handleAmountComplete = useCallback(() => {
    if (quickAmount) {
      categorySelectRef.current?.focus();
    }
  }, [quickAmount]);

  // 計算本月與上月差異
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const lastMonthExpense = useMemo(() =>
    transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return t.type === 'expense' &&
               transactionDate.getMonth() === lastMonth &&
               transactionDate.getFullYear() === lastMonthYear;
      })
      .reduce((sum, t) => sum + t.amount, 0)
  , [transactions, lastMonth, lastMonthYear]);

  const expenseDifference = lastMonthExpense - (stats?.monthly_expense || 0);
  const daysToEndOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate() - new Date().getDate();

  // 主題配置
  const themeConfig = {
    morandi: {
      bg: 'bg-gradient-to-br from-[#F8F5F0] to-[#E6DDD4]',
      headerBg: 'bg-gradient-to-r from-[#6B5B73] to-[#B5986A]',
      cardBg: 'bg-gradient-to-br from-white to-[#F8F5F0]',
      primary: 'text-[#6B5B73]',
      secondary: 'text-[#6B5B73]/60',
      accent: 'bg-gradient-to-r from-[#B5986A] to-[#D4C4A8]',
      border: 'border-morandi-gold/20'
    },
    moneypro: {
      bg: 'bg-gradient-to-b from-slate-700 to-slate-800',
      headerBg: 'bg-gradient-to-r from-slate-800 to-slate-700',
      cardBg: 'bg-slate-600',
      primary: 'text-white',
      secondary: 'text-slate-300',
      accent: 'bg-gradient-to-r from-blue-600 to-blue-700',
      border: 'border-slate-500'
    }
  };

  const currentTheme = themeConfig[theme];

  return (
    <div className={cn('min-h-screen pb-20 pt-4', currentTheme.bg)}>
      {/* APP風格頂部區域 */}
      <div className={cn('text-white p-4 sm:p-6 mx-4 rounded-3xl shadow-lg', currentTheme.headerBg)}>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl sm:text-2xl font-bold">記帳助手</h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'morandi' ? 'moneypro' : 'morandi')}
              className="text-white hover:bg-white/20 rounded-full p-2 text-xs"
            >
              {theme === 'morandi' ? 'Dark' : 'Light'}
            </Button>
          </div>
        </div>

        {/* 本月支出主卡片 */}
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-4">
          <div className="text-center">
            <div className="text-white/80 text-sm mb-1">本月支出</div>
            <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
              NT$ {(stats?.monthly_expense || 0).toLocaleString()}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-white/80">
              <div className="flex items-center space-x-1">
                <TrendingUp size={14} />
                <span>收入: NT$ {(stats?.monthly_income || 0).toLocaleString()}</span>
              </div>
              {expenseDifference > 0 && (
                <div className="flex items-center space-x-1 text-green-300">
                  <span>比上月省了 NT$ {expenseDifference.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="text-xs text-white/60 mt-2">
              距離月底還有 {daysToEndOfMonth} 天
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-6">
        {/* 快速記帳區域 */}
        <div className={cn('rounded-2xl p-6 shadow-lg border', currentTheme.cardBg, currentTheme.border)}>
          <div className="flex items-center space-x-2 mb-6">
            <Zap className={cn('w-5 h-5', theme === 'morandi' ? 'text-[#B5986A]' : 'text-blue-400')} />
            <h2 className={cn('text-lg font-semibold', currentTheme.primary)}>快速記帳</h2>
          </div>

          {/* 三按鈕區域 - 響應式設計 */}
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-3 mb-6">
            {/* 金額輸入 */}
            <div className="sm:col-span-1">
              <div className={cn('rounded-xl border-2 p-4 h-20 transition-colors',
                theme === 'morandi' ? 'bg-white border-morandi-gold/20 focus-within:border-morandi-gold/20' : 'bg-slate-700 border-slate-500 focus-within:border-blue-400'
              )}>
                <div className={cn('text-xs mb-1', currentTheme.secondary)}>金額</div>
                <input
                  ref={amountInputRef}
                  type="number"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAmountComplete()}
                  placeholder='0'
                  className={cn('w-full text-xl font-bold bg-transparent border-0 focus:outline-none',
                    currentTheme.primary,
                    theme === 'morandi' ? 'placeholder-[#6B5B73]/30' : 'placeholder-slate-400'
                  )}
                />
              </div>
            </div>

            {/* 分類選擇 */}
            <div className="sm:col-span-1">
              <Select value={quickCategory} onValueChange={setQuickCategory}>
                <SelectTrigger
                  ref={categorySelectRef}
                  className={cn('h-20 border-2 rounded-xl text-center',
                    theme === 'morandi'
                      ? 'bg-white border-morandi-gold/20 text-[#6B5B73] focus:border-morandi-gold/20'
                      : 'bg-slate-700 border-slate-500 text-white focus:border-blue-400'
                  )}
                >
                  <SelectValue>
                    <div className="flex items-center justify-center space-x-2">
                      <span className="font-semibold">
                        {quickCategories.find(c => c.id === quickCategory)?.name || '餐費'}
                      </span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {quickCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <span>{category.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 記帳按鈕 */}
            <div className="sm:col-span-1">
              <Button
                ref={addButtonRef}
                onClick={handleQuickTransaction}
                disabled={!quickAmount || !quickCategory}
                className={cn('w-full h-20 text-white font-semibold rounded-xl border-0 shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 text-base',
                  currentTheme.accent
                )}
              >
                <Plus size={20} className="mr-2" />
                記帳
              </Button>
            </div>
          </div>

          {/* 常用分類快速選擇 */}
          <div className="space-y-3">
            <div className={cn('text-sm', currentTheme.secondary)}>常用分類</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {quickCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleQuickCategorySelect(category.id)}
                  className={cn(
                    'flex items-center justify-center px-3 py-3 sm:px-4 rounded-full transition-all duration-200 active:scale-95 text-sm sm:text-base',
                    quickCategory === category.id
                      ? (theme === 'morandi' ? 'bg-[#B5986A] text-white shadow-lg' : 'bg-blue-600 text-white shadow-lg')
                      : (theme === 'morandi' ? 'bg-white/80 text-[#6B5B73] hover:bg-white border border-morandi-gold/20' : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-500')
                  )}
                >
                  <span className="font-medium">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 今日交易簡化列表 */}
        <div className={cn('rounded-2xl p-6 shadow-lg border', currentTheme.cardBg, currentTheme.border)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={cn('text-lg font-semibold', currentTheme.primary)}>今日交易</h3>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setActiveTab('transactions')}
              className={cn('rounded-full text-sm',
                theme === 'morandi' ? 'text-[#B5986A] hover:bg-[#B5986A]/10' : 'text-blue-400 hover:bg-blue-400/10'
              )}
            >
              查看全部
            </Button>
          </div>

          {todayTransactions.length > 0 ? (
            <div className="space-y-3">
              {todayTransactions.map((transaction) => {
                const _category = quickCategories.find(c => c.id === transaction.category_id);
                return (
                  <div key={transaction.id} className={cn('flex items-center justify-between p-3 sm:p-4 rounded-xl border',
                    theme === 'morandi' ? 'bg-white/60 border-morandi-gold/20' : 'bg-slate-700 border-slate-600'
                  )}>
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="min-w-0 flex-1">
                        <div className={cn('font-medium truncate', currentTheme.primary)}>{transaction.category_name}</div>
                        <div className={cn('text-sm', currentTheme.secondary)}>
                          {new Date(transaction.created_at).toLocaleTimeString('zh-TW', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <div className="text-right">
                        <span className={cn(
                          'font-bold text-base sm:text-lg',
                          transaction.type === 'expense'
                            ? (theme === 'morandi' ? 'text-[#D2691E]' : 'text-red-400')
                            : (theme === 'morandi' ? 'text-[#228B22]' : 'text-green-400')
                        )}>
                          {transaction.type === 'expense' ? '-' : '+'}NT$ {transaction.amount.toLocaleString()}
                        </span>
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        className={cn('p-1 sm:p-2',
                          theme === 'morandi' ? 'text-[#6B5B73]/40 hover:text-[#6B5B73]' : 'text-slate-400 hover:text-slate-300'
                        )}
                      >
                        <Edit3 size={14} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={cn('text-center py-8', currentTheme.secondary)}>
              <Package size={40} className={cn('mx-auto mb-3 sm:w-12 sm:h-12',
                theme === 'morandi' ? 'text-[#B5986A]/40' : 'text-blue-400/40'
              )} />
              <p className='text-base sm:text-lg'>今日還沒有交易紀錄</p>
              <p className='text-sm'>使用上方快速記帳開始吧</p>
            </div>
          )}
        </div>

        {/* 其他分頁內容 */}
        {activeTab !== 'overview' && (
          <div className={cn('rounded-2xl shadow-lg border', currentTheme.cardBg, currentTheme.border)}>
            {activeTab === 'transactions' && (
              <div className="p-6">
                <TransactionList />
              </div>
            )}

            {activeTab === 'accounts' && (
              <div className="p-6">
                <AccountsManagement />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="p-6">
                <div className="text-center py-8">
                  <Settings size={48} className="mx-auto mb-3 text-[#B5986A]" />
                  <h3 className="text-lg font-semibold text-[#6B5B73] mb-2">設定功能</h3>
                  <p className="text-[#6B5B73]/60">即將推出更多設定選項</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* APP風格底部導航 */}
      <div className={cn('fixed bottom-0 left-0 right-0 backdrop-blur-lg border-t px-2 sm:px-4 py-2 sm:py-3 safe-area-bottom',
        theme === 'morandi'
          ? 'bg-gradient-to-r from-white/95 to-[#F8F5F0]/95 border-morandi-gold/20'
          : 'bg-slate-800/95 border-slate-600'
      )}>
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const is_active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'flex flex-col items-center space-y-1 p-2 sm:p-3 rounded-xl transition-all duration-200 min-w-0 flex-1',
                  activeTab === tab.id
                    ? (theme === 'morandi' ? 'text-[#B5986A] bg-[#B5986A]/10 scale-110' : 'text-blue-400 bg-blue-400/10 scale-110')
                    : (theme === 'morandi' ? 'text-[#6B5B73]/60 hover:text-[#6B5B73] hover:bg-[#6B5B73]/5' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700')
                )}
              >
                <Icon size={20} className="sm:w-6 sm:h-6" />
                <span className="text-xs font-medium truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>


      {/* 成功提示Toast */}
      {showToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-2 animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
            <span className="font-medium">記帳成功！</span>
          </div>
        </div>
      )}


      {/* 新增帳戶對話框 */}
      <AddAccountDialog
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
      />
    </div>
  );
}