'use client'

import React, { useState } from 'react'
import { useAccountingStore } from '@/stores/accounting-store'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { Wallet, CreditCard, PiggyBank, TrendingUp, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CurrencyCell } from '@/components/table-cells'
import { useEnterSubmit } from '@/hooks/useEnterSubmit'
import { ACCOUNTING_LABELS } from '@/features/erp-accounting/constants/labels'

interface AddAccountDialogProps {
  isOpen: boolean
  onClose: () => void
}

type AccountType = 'cash' | 'bank' | 'credit' | 'investment' | 'other'

const accountTypes: Array<{
  id: AccountType
  label: string
  icon: typeof Wallet
  color: string
  description: string
}> = [
  { id: 'cash', label: '現金', icon: Wallet, color: '#7B9B7E', description: '現金錢包、零錢' },
  {
    id: 'bank',
    label: '銀行帳戶',
    icon: Building2,
    color: '#8BA8C4',
    description: '儲蓄帳戶、活期存款',
  },
  {
    id: 'credit',
    label: '信用卡',
    icon: CreditCard,
    color: '#C89B9B',
    description: '信用卡、信貸額度',
  },
  {
    id: 'investment',
    label: '投資帳戶',
    icon: TrendingUp,
    color: '#B4A5C8',
    description: '股票、基金、投資',
  },
  {
    id: 'other',
    label: '其他帳戶',
    icon: PiggyBank,
    color: '#B8A99A',
    description: '數位錢包、其他資產',
  },
] as const

// 莫蘭迪色系 - 柔和不刺眼
const predefinedColors = [
  '#7B9B7E', // 莫蘭迪綠
  '#8BA8C4', // 莫蘭迪藍
  '#C89B9B', // 莫蘭迪粉
  '#B4A5C8', // 莫蘭迪紫
  '#B8A99A', // 莫蘭迪金
  '#D9A5A5', // 莫蘭迪玫瑰
  '#8C8C8C', // 莫蘭迪咖啡
  '#A8B4A5', // 莫蘭迪灰綠
]

export function AddAccountDialog({ isOpen, onClose }: AddAccountDialogProps) {
  const { createAccount } = useAccountingStore()
  const [formData, setFormData] = useState<{
    name: string
    type: AccountType
    balance: string
    credit_limit: string
    color: string
    description: string
  }>({
    name: '',
    type: 'cash',
    balance: '',
    credit_limit: '', // 信用額度
    color: '#10B981',
    description: '',
  })

  const handleSubmit = async () => {
    if (!formData.name.trim()) return

    const selectedType = accountTypes.find(t => t.id === formData.type)

    const iconMap: Record<AccountType, string> = {
      cash: 'Wallet',
      bank: 'Building2',
      credit: 'CreditCard',
      investment: 'TrendingUp',
      other: 'PiggyBank',
    }

    const accountData = {
      name: formData.name.trim(),
      type: formData.type,
      balance: parseFloat(formData.balance) || 0,
      currency: 'TWD',
      icon: iconMap[formData.type],
      color: formData.color,
      is_active: true,
      description: formData.description.trim(),
      // 信用卡相關欄位
      ...(formData.type === 'credit' && {
        credit_limit: parseFloat(formData.credit_limit) || 0,
        available_credit:
          (parseFloat(formData.credit_limit) || 0) + (parseFloat(formData.balance) || 0),
      }),
    }

    await createAccount(accountData)
    resetForm()
    onClose()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'cash',
      balance: '',
      credit_limit: '',
      color: '#10B981',
      description: '',
    })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const selectedAccountType = accountTypes.find(t => t.id === formData.type)
  const { handleKeyDown, compositionProps } = useEnterSubmit(handleSubmit)

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={open => !open && handleClose()}
      title={ACCOUNTING_LABELS.ADD_236}
      onSubmit={handleSubmit}
      onCancel={handleClose}
      submitLabel="建立帳戶"
      submitDisabled={!formData.name.trim()}
      maxWidth="lg"
    >
      {/* 帳戶類型選擇 */}
      <div>
        <label className="text-sm font-medium text-[#8C8C8C] mb-3 block">{ACCOUNTING_LABELS.LABEL_7125}</label>
        <div className="grid grid-cols-1 gap-2">
          {accountTypes.map(type => {
            const Icon = type.icon
            const isSelected = formData.type === type.id
            return (
              <button
                key={type.id}
                type="button"
                onClick={() =>
                  setFormData(prev => ({
                    ...prev,
                    type: type.id,
                    color: type.color,
                  }))
                }
                className={cn(
                  'p-3 rounded-xl transition-all flex items-center space-x-3 text-left',
                  isSelected
                    ? 'bg-gradient-to-r from-[#F9F8F6] to-[#F9F8F6] shadow-sm'
                    : 'bg-card/40 hover:bg-card/60'
                )}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: type.color }}
                >
                  <Icon size={18} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-[#333333] text-sm">{type.label}</div>
                  <div className="text-xs text-[#8C8C8C]">{type.description}</div>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[#B8A99A] flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 帳戶名稱 */}
      <div>
        <label className="text-sm font-medium text-[#8C8C8C] mb-1.5 block">{ACCOUNTING_LABELS.LABEL_1477}</label>
        <Input
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          onKeyDown={handleKeyDown}
          {...compositionProps}
          placeholder={`輸入${selectedAccountType?.label}名稱`}
          className="border-[#E8E4E0] bg-card/60 focus:border-[#B8A99A] focus:ring-[#B8A99A]/20"
        />
      </div>

      {/* 初始餘額 */}
      <div>
        <label className="text-sm font-medium text-[#8C8C8C] mb-1.5 block">
          {formData.type === 'credit' ? '目前欠款金額' : '初始餘額'}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8C8C8C] text-sm">
            NT$
          </span>
          <Input
            type="number"
            value={formData.balance}
            onChange={e => setFormData(prev => ({ ...prev, balance: e.target.value }))}
            onKeyDown={handleKeyDown}
            {...compositionProps}
            placeholder="0"
            className="pl-12 border-[#E8E4E0] bg-card/60 focus:border-[#B8A99A] focus:ring-[#B8A99A]/20"
            step="1"
          />
        </div>
        {formData.type === 'credit' && (
          <div className="text-xs text-[#8C8C8C] mt-1.5 bg-[#F9F8F6] px-3 py-2 rounded-lg">
            {ACCOUNTING_LABELS.PLEASE_ENTER_247}
          </div>
        )}
      </div>

      {/* 信用卡額度 */}
      {formData.type === 'credit' && (
        <div>
          <label className="text-sm font-medium text-[#8C8C8C] mb-1.5 block">{ACCOUNTING_LABELS.LABEL_1690}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8C8C8C] text-sm">
              NT$
            </span>
            <Input
              type="number"
              value={formData.credit_limit}
              onChange={e => setFormData(prev => ({ ...prev, credit_limit: e.target.value }))}
              onKeyDown={handleKeyDown}
              {...compositionProps}
              placeholder="50000"
              className="pl-12 border-[#E8E4E0] bg-card/60 focus:border-[#B8A99A] focus:ring-[#B8A99A]/20"
              min="0"
              step="1000"
            />
          </div>
          <div className="text-xs text-[#8C8C8C] mt-1.5">{ACCOUNTING_LABELS.TOTAL_9749}</div>
        </div>
      )}

      {/* 顏色選擇 */}
      <div>
        <label className="text-sm font-medium text-[#8C8C8C] mb-2 block">{ACCOUNTING_LABELS.LABEL_3288}</label>
        <div className="flex flex-wrap gap-2.5">
          {predefinedColors.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, color }))}
              className={cn(
                'w-10 h-10 rounded-xl transition-all shadow-sm',
                formData.color === color
                  ? 'ring-2 ring-[#B8A99A] ring-offset-2 scale-110'
                  : 'hover:scale-105'
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* 描述 */}
      <div>
        <label className="text-sm font-medium text-[#8C8C8C] mb-1.5 block">{ACCOUNTING_LABELS.LABEL_9909}</label>
        <Input
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          onKeyDown={handleKeyDown}
          {...compositionProps}
          placeholder={ACCOUNTING_LABELS.LABEL_9373}
          className="border-[#E8E4E0] bg-card/60 focus:border-[#B8A99A] focus:ring-[#B8A99A]/20"
        />
      </div>

      {/* 預覽卡片 */}
      {formData.name && (
        <div className="p-4 bg-gradient-to-br from-[#F9F8F6] to-[#F9F8F6] rounded-xl">
          <div className="text-xs font-medium text-[#8C8C8C] mb-3">{ACCOUNTING_LABELS.PREVIEW_1832}</div>
          <div className="flex items-center space-x-3">
            <div
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: formData.color }}
            />
            <div className="flex-1">
              <div className="font-medium text-[#333333] text-sm">{formData.name}</div>
              {formData.description && (
                <div className="text-xs text-[#8C8C8C] mt-0.5">{formData.description}</div>
              )}
            </div>
            <div className="font-semibold text-sm">
              <CurrencyCell
                amount={parseFloat(formData.balance) || 0}
                variant={parseFloat(formData.balance) >= 0 ? 'income' : 'expense'}
                showSign
              />
            </div>
          </div>
        </div>
      )}
    </FormDialog>
  )
}
