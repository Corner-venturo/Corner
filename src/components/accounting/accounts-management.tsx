'use client';

import React, { useState } from 'react';
import { useAccountingStore } from '@/stores/accounting-store';
import { Button } from '@/components/ui/button';
import {
  Wallet,
  CreditCard,
  PiggyBank,
  TrendingUp,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

const accountTypeIcons = {
  cash: Wallet,
  bank: CreditCard,
  credit: CreditCard,
  investment: TrendingUp,
  other: PiggyBank,
};

const accountTypeLabels = {
  cash: '現金',
  bank: '銀行帳戶',
  credit: '信用卡',
  investment: '投資帳戶',
  other: '其他帳戶',
};

export const AccountsManagement = React.memo(function AccountsManagement() {
  const { accounts, updateAccount, deleteAccount } = useAccountingStore();
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);

  const handleToggleActive = (account_id: string, is_active: boolean) => {
    updateAccount(account_id, { is_active: !is_active });
  };

  const handleDeleteAccount = (account_id: string, account_name: string) => {
    if (confirm(`確定要刪除帳戶「${account_name}」嗎？這個操作無法復原。`)) {
      deleteAccount(account_id);
    }
  };

  // 按帳戶類型分組
  const accountsByType = accounts.reduce((groups, account) => {
    if (!groups[account.type]) {
      groups[account.type] = [];
    }
    groups[account.type].push(account);
    return groups;
  }, {} as Record<string, typeof accounts>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-morandi-primary">帳戶管理</h3>
        <div className="text-sm text-morandi-secondary">
          共 {accounts.length} 個帳戶 • 活躍 {accounts.filter(a => a.is_active).length} 個
        </div>
      </div>

      {/* 帳戶列表 */}
      <div className="space-y-8">
        {Object.entries(accountsByType).map(([type, accountsOfType]) => {
          const Icon = accountTypeIcons[type as keyof typeof accountTypeIcons] || Wallet;
          const typeLabel = accountTypeLabels[type as keyof typeof accountTypeLabels] || type;
          const totalBalance = accountsOfType.reduce((sum, acc) => sum + acc.balance, 0);

          return (
            <div key={type} className="space-y-4">
              {/* 類型標題 */}
              <div className="flex items-center justify-between p-4 bg-morandi-container/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Icon size={24} className="text-morandi-secondary" />
                  <div>
                    <div className="font-semibold text-morandi-primary">{typeLabel}</div>
                    <div className="text-sm text-morandi-secondary">{accountsOfType.length} 個帳戶</div>
                  </div>
                </div>
                <div className={cn(
                  "text-xl font-bold",
                  totalBalance >= 0 ? "text-morandi-green" : "text-morandi-red"
                )}>
                  {totalBalance >= 0 ? '+' : ''}NT$ {totalBalance.toLocaleString()}
                </div>
              </div>

              {/* 該類型的帳戶卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accountsOfType.map((account) => (
                  <div
                    key={account.id}
                    className={cn(
                      "border rounded-xl p-6 transition-all duration-200 hover:shadow-lg",
                      account.is_active
                        ? "border-border bg-white hover:border-morandi-gold/20"
                        : "border-morandi-container bg-morandi-container/30 opacity-75"
                    )}
                  >
                    {/* 帳戶標題 */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: account.color }}
                        />
                        <div>
                          <div className="font-semibold text-morandi-primary">{account.name}</div>
                          {account.description && (
                            <div className="text-sm text-morandi-secondary">{account.description}</div>
                          )}
                        </div>
                      </div>

                      {/* 狀態指標 */}
                      <div className="flex items-center space-x-1">
                        {account.is_active ? (
                          <Eye size={16} className="text-morandi-green" />
                        ) : (
                          <EyeOff size={16} className="text-morandi-secondary" />
                        )}
                      </div>
                    </div>

                    {/* 餘額顯示 */}
                    <div className="mb-4">
                      <div className="text-sm text-morandi-secondary mb-1">
                        {account.type === 'credit' ? '目前欠款' : '帳戶餘額'}
                      </div>
                      <div className={cn(
                        "text-2xl font-bold",
                        account.balance >= 0 ? "text-morandi-green" : "text-morandi-red"
                      )}>
                        {account.balance >= 0 ? '+' : ''}NT$ {Math.abs(account.balance).toLocaleString()}
                      </div>
                    </div>

                    {/* 信用卡額度資訊 */}
                    {account.type === 'credit' && account.credit_limit && (
                      <div className="mb-4 p-3 bg-morandi-container/20 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-morandi-secondary">信用額度</span>
                          <span className="text-sm font-medium text-morandi-primary">
                            NT$ {account.credit_limit.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-morandi-secondary">可用額度</span>
                          <span className="text-sm font-semibold text-morandi-blue">
                            NT$ {((account.credit_limit || 0) + account.balance).toLocaleString()}
                          </span>
                        </div>
                        {/* 額度使用率條 */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-morandi-secondary mb-1">
                            <span>使用率</span>
                            <span>{(((Math.abs(account.balance) / (account.credit_limit || 1)) * 100)).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-morandi-container/30 rounded-full h-2">
                            <div
                              className={cn(
                                "h-2 rounded-full transition-all duration-300",
                                Math.abs(account.balance) / (account.credit_limit || 1) > 0.8
                                  ? "bg-morandi-red"
                                  : Math.abs(account.balance) / (account.credit_limit || 1) > 0.5
                                  ? "bg-morandi-gold"
                                  : "bg-morandi-green"
                              )}
                              style={{
                                width: `${Math.min(((Math.abs(account.balance) / (account.credit_limit || 1)) * 100), 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 操作按鈕 */}
                    <div className="flex items-center justify-between pt-4 border-t border-morandi-container">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(account.id, account.is_active)}
                          className={cn(
                            "text-xs",
                            account.is_active
                              ? "text-morandi-secondary hover:text-morandi-red"
                              : "text-morandi-secondary hover:text-morandi-green"
                          )}
                        >
                          {account.is_active ? (
                            <>
                              <EyeOff size={12} className="mr-1" />
                              隱藏
                            </>
                          ) : (
                            <>
                              <Eye size={12} className="mr-1" />
                              顯示
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs text-morandi-secondary hover:text-morandi-primary"
                        >
                          <Edit size={12} className="mr-1" />
                          編輯
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAccount(account.id, account.name)}
                          className="text-xs text-morandi-secondary hover:text-morandi-red"
                        >
                          <Trash2 size={12} className="mr-1" />
                          刪除
                        </Button>
                      </div>
                    </div>

                    {/* 建立日期 */}
                    <div className="mt-3 text-xs text-morandi-secondary">
                      建立於 {new Date(account.created_at).toLocaleDateString('zh-TW')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {accounts.length === 0 && (
          <div className="text-center py-12 text-morandi-secondary">
            <Wallet size={24} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">還沒有任何帳戶</p>
            <p className="text-sm">點擊右上角的「新增帳戶」開始建立你的第一個錢包吧！</p>
          </div>
        )}
      </div>
    </div>
  );
});