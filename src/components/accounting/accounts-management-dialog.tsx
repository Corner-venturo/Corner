'use client'

import React, { useState } from 'react'
import { useAccountingStore } from '@/stores/accounting-store'
import { FormDialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { Wallet, CreditCard, Building2, TrendingUp, PiggyBank, Plus, Edit, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccountsManagementDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddAccount: () => void
}

const accountTypeIcons = {
  cash: Wallet,
  bank: Building2,
  credit: CreditCard,
  investment: TrendingUp,
  other: PiggyBank,
}

export function AccountsManagementDialog({ isOpen, onClose, onAddAccount }: AccountsManagementDialogProps) {
  const { accounts, deleteAccount } = useAccountingStore()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`確定要刪除帳戶「${name}」嗎？\n\n此操作無法復原。`)) {
      setDeletingId(id)
      await deleteAccount(id)
      setDeletingId(null)
    }
  }

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
      title="帳戶管理"
      onCancel={onClose}
      maxWidth="lg"
    >
      {/* 總資產卡片 */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-[#F9F5ED] to-[#F5EDDC]">
        <div className="text-sm text-[#9E8F81] mb-1">總資產</div>
        <div className="text-3xl font-bold text-[#3D2914]">
          NT$ {totalBalance.toLocaleString()}
        </div>
        <div className="text-xs text-[#AFA598] mt-2">
          {accounts.length} 個帳戶
        </div>
      </div>

      {/* 帳戶列表 */}
      {accounts.length === 0 ? (
        <div className="text-center py-12">
          <Wallet size={48} className="mx-auto mb-3 text-[#AFA598]" />
          <div className="text-[#9E8F81] mb-4">還沒有帳戶</div>
          <Button
            onClick={() => {
              onClose()
              onAddAccount()
            }}
            className="bg-[#C9A961] hover:bg-[#B8985A] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            新增第一個帳戶
          </Button>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {accounts.map(account => {
            const Icon = accountTypeIcons[account.type as keyof typeof accountTypeIcons] || Wallet
            const isNegative = account.balance < 0

            return (
              <div
                key={account.id}
                className="p-4 rounded-xl bg-white/60 border border-[#E0D8CC] hover:border-[#C9A961] transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* 圖標 */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                    style={{ backgroundColor: account.color || '#C9A961' }}
                  >
                    <Icon size={24} />
                  </div>

                  {/* 帳戶資訊 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[#3D2914] truncate">
                          {account.name}
                        </div>
                        <div className="text-xs text-[#9E8F81] mt-0.5">
                          {account.type === 'cash' && '現金'}
                          {account.type === 'bank' && '銀行帳戶'}
                          {account.type === 'credit' && '信用卡'}
                          {account.type === 'investment' && '投資帳戶'}
                          {account.type === 'other' && '其他帳戶'}
                        </div>
                        {account.description && (
                          <div className="text-xs text-[#AFA598] mt-1">
                            {account.description}
                          </div>
                        )}
                      </div>

                      {/* 餘額 */}
                      <div className="text-right flex-shrink-0">
                        <div
                          className={cn(
                            'font-bold text-lg',
                            isNegative ? 'text-[#C89B9B]' : 'text-[#3D2914]'
                          )}
                        >
                          {isNegative ? '-' : ''}NT$ {Math.abs(account.balance).toLocaleString()}
                        </div>
                        {account.type === 'credit' && account.credit_limit && (
                          <div className="text-xs text-[#9E8F81] mt-1">
                            額度 NT$ {account.credit_limit.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 信用卡可用額度 */}
                    {account.type === 'credit' && account.available_credit !== undefined && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-[#9E8F81] mb-1">
                          <span>可用額度</span>
                          <span>NT$ {account.available_credit.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-[#F5F0EB] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#C9A961] rounded-full transition-all"
                            style={{
                              width: `${account.credit_limit ? (account.available_credit / account.credit_limit) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* 操作按鈕 */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleDelete(account.id, account.name)}
                        disabled={deletingId === account.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#C89B9B] hover:bg-[#FDF8F5] rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        {deletingId === account.id ? '刪除中...' : '刪除'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 新增帳戶按鈕 */}
      {accounts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#E0D8CC]">
          <Button
            onClick={() => {
              onClose()
              onAddAccount()
            }}
            variant="outline"
            className="w-full border-[#E0D8CC] hover:border-[#C9A961] hover:bg-[#FAF8F5]"
          >
            <Plus className="h-4 w-4 mr-2" />
            新增帳戶
          </Button>
        </div>
      )}
    </FormDialog>
  )
}
