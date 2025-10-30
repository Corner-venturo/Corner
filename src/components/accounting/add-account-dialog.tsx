'use client'

import React, { useState } from 'react'
import { useAccountingStore } from '@/stores/accounting-store'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { Wallet, CreditCard, PiggyBank, TrendingUp, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEnterSubmit } from '@/hooks/useEnterSubmit'

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
  { id: 'cash', label: '現金', icon: Wallet, color: '#10B981', description: '現金錢包、零錢' },
  {
    id: 'bank',
    label: '銀行帳戶',
    icon: Building2,
    color: '#3B82F6',
    description: '儲蓄帳戶、活期存款',
  },
  {
    id: 'credit',
    label: '信用卡',
    icon: CreditCard,
    color: '#EF4444',
    description: '信用卡、信貸額度',
  },
  {
    id: 'investment',
    label: '投資帳戶',
    icon: TrendingUp,
    color: '#8B5CF6',
    description: '股票、基金、投資',
  },
  {
    id: 'other',
    label: '其他帳戶',
    icon: PiggyBank,
    color: '#F59E0B',
    description: '數位錢包、其他資產',
  },
] as const

const predefinedColors = [
  '#10B981', // 綠色
  '#3B82F6', // 藍色
  '#EF4444', // 紅色
  '#8B5CF6', // 紫色
  '#F59E0B', // 橘色
  '#EC4899', // 粉紅
  '#6B7280', // 灰色
  '#84CC16', // 萊姆綠
]

export function AddAccountDialog({ isOpen, onClose }: AddAccountDialogProps) {
  const { addAccount } = useAccountingStore()
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

  const handleSubmit = () => {
    if (!formData.name.trim()) return

    const selectedType = accountTypes.find(t => t.id === formData.type)

    const accountData = {
      name: formData.name.trim(),
      type: formData.type,
      balance: parseFloat(formData.balance) || 0,
      currency: 'TWD',
      icon: selectedType?.icon.name || 'Wallet',
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

    addAccount(accountData)
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
      title="新增帳戶"
      onSubmit={handleSubmit}
      onCancel={handleClose}
      submitLabel="建立帳戶"
      submitDisabled={!formData.name.trim()}
      maxWidth="lg"
    >
      {/* 帳戶類型選擇 */}
      <div>
        <label className="text-sm font-medium text-morandi-primary mb-3 block">帳戶類型</label>
        <div className="grid grid-cols-1 gap-3">
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
                  'p-4 rounded-lg border-2 transition-all flex items-center space-x-4 text-left',
                  isSelected
                    ? 'border-morandi-gold bg-morandi-gold/5'
                    : 'border-morandi-container hover:border-morandi-container-hover'
                )}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: type.color }}
                >
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-morandi-primary">{type.label}</div>
                  <div className="text-sm text-morandi-secondary">{type.description}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 帳戶名稱 */}
      <div>
        <label className="text-sm font-medium text-morandi-primary">帳戶名稱</label>
        <Input
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          onKeyDown={handleKeyDown}
          {...compositionProps}
          placeholder={`輸入${selectedAccountType?.label}名稱`}
          className="mt-1"
        />
      </div>

      {/* 初始餘額 */}
      <div>
        <label className="text-sm font-medium text-morandi-primary">
          {formData.type === 'credit' ? '目前欠款金額' : '初始餘額'}
        </label>
        <div className="mt-1 relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-morandi-secondary">
            NT$
          </span>
          <Input
            type="number"
            value={formData.balance}
            onChange={e => setFormData(prev => ({ ...prev, balance: e.target.value }))}
            onKeyDown={handleKeyDown}
            {...compositionProps}
            placeholder="0"
            className="pl-12"
            step="1"
          />
        </div>
        {formData.type === 'credit' && (
          <div className="text-xs text-morandi-secondary mt-1">
            💡 信用卡請輸入負數（如：-5000 表示欠款5000元）
          </div>
        )}
      </div>

      {/* 信用卡額度 */}
      {formData.type === 'credit' && (
        <div>
          <label className="text-sm font-medium text-morandi-primary">信用額度</label>
          <div className="mt-1 relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-morandi-secondary">
              NT$
            </span>
            <Input
              type="number"
              value={formData.credit_limit}
              onChange={e => setFormData(prev => ({ ...prev, credit_limit: e.target.value }))}
              onKeyDown={handleKeyDown}
              {...compositionProps}
              placeholder="50000"
              className="pl-12"
              min="0"
              step="1000"
            />
          </div>
          <div className="text-xs text-morandi-secondary mt-1">設定這張信用卡的總額度限制</div>
        </div>
      )}

      {/* 顏色選擇 */}
      <div>
        <label className="text-sm font-medium text-morandi-primary">顏色標識</label>
        <div className="mt-2 flex flex-wrap gap-3">
          {predefinedColors.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, color }))}
              className={cn(
                'w-8 h-8 rounded-full border-2 transition-all',
                formData.color === color
                  ? 'border-morandi-primary scale-110'
                  : 'border-morandi-container hover:border-morandi-container-hover'
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* 描述 */}
      <div>
        <label className="text-sm font-medium text-morandi-primary">備註說明</label>
        <Input
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          onKeyDown={handleKeyDown}
          {...compositionProps}
          placeholder="輸入帳戶備註（選填）"
          className="mt-1"
        />
      </div>

      {/* 預覽卡片 */}
      {formData.name && (
        <div className="p-4 bg-morandi-container/10 rounded-lg">
          <div className="text-sm font-medium text-morandi-secondary mb-2">預覽</div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: formData.color }} />
            <div className="flex-1">
              <div className="font-medium text-morandi-primary">{formData.name}</div>
              {formData.description && (
                <div className="text-sm text-morandi-secondary">{formData.description}</div>
              )}
            </div>
            <div
              className={cn(
                'font-semibold',
                parseFloat(formData.balance) >= 0 ? 'text-morandi-green' : 'text-morandi-red'
              )}
            >
              {parseFloat(formData.balance) >= 0 ? '+' : ''}
              NT$ {Math.abs(parseFloat(formData.balance) || 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </FormDialog>
  )
}
