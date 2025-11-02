'use client'

import React, { useState, useEffect } from 'react'
import { useAccountingStore } from '@/stores/accounting-store'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEnterSubmit } from '@/hooks/useEnterSubmit'

interface AddTransactionDialogProps {
  isOpen: boolean
  onClose: () => void
}

type TransactionType = 'income' | 'expense'

export function AddTransactionDialog({ isOpen, onClose }: AddTransactionDialogProps) {
  const { accounts, categories, addTransaction } = useAccountingStore()
  const [transactionType, setTransactionType] = useState<TransactionType>('expense')
  const [formData, setFormData] = useState({
    account_id: '',
    category_id: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  })

  // 當 accounts 載入完成時，設定預設帳戶
  useEffect(() => {
    if (accounts.length > 0 && !formData.account_id) {
      setFormData(prev => ({ ...prev, account_id: accounts[0].id }))
    }
  }, [accounts, formData.account_id])

  const handleSubmit = async () => {
    if (!formData.account_id || !formData.amount || !formData.category_id) {
      return
    }

    const account = accounts.find(acc => acc.id === formData.account_id)
    const category = categories.find(cat => cat.id === formData.category_id)

    const transactionData = {
      account_id: formData.account_id,
      account_name: account?.name || '',
      category_id: formData.category_id,
      category_name: category?.name || '',
      type: transactionType,
      amount: parseFloat(formData.amount),
      currency: 'TWD',
      description: formData.description,
      date: formData.date,
    }

    await addTransaction(transactionData)
    resetForm()
    onClose()
  }

  const resetForm = () => {
    setFormData({
      account_id: accounts.length > 0 ? accounts[0].id : '',
      category_id: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    })
    setTransactionType('expense')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const filteredCategories = categories.filter(category => category.type === transactionType)

  const transactionTypes: Array<{
    id: TransactionType
    label: string
    icon: typeof ArrowUpRight
    color: string
    bgColor: string
  }> = [
    {
      id: 'expense',
      label: '支出',
      icon: ArrowDownRight,
      color: '#C89B9B',
      bgColor: '#FDF8F5',
    },
    {
      id: 'income',
      label: '收入',
      icon: ArrowUpRight,
      color: '#7B9B7E',
      bgColor: '#F7FAF8',
    },
  ] as const

  const { handleKeyDown, compositionProps } = useEnterSubmit(handleSubmit)

  const isFormValid = formData.account_id && formData.amount && formData.category_id

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={open => !open && handleClose()}
      title="新增記帳"
      onSubmit={handleSubmit}
      onCancel={handleClose}
      submitLabel="新增記帳"
      submitDisabled={!isFormValid}
      maxWidth="md"
    >
      {/* 交易類型選擇 */}
      <div>
        <label className="text-sm font-medium text-[#6B5D52] mb-2 block">交易類型</label>
        <div className="grid grid-cols-2 gap-2">
          {transactionTypes.map(type => {
            const Icon = type.icon
            const isSelected = transactionType === type.id
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setTransactionType(type.id)}
                className={cn(
                  'p-4 rounded-xl transition-all flex items-center justify-center space-x-2',
                  isSelected
                    ? 'shadow-sm'
                    : 'bg-white/40 hover:bg-white/60'
                )}
                style={isSelected ? { backgroundColor: type.bgColor, color: type.color } : {}}
              >
                <Icon size={20} />
                <span className="font-medium">{type.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 帳戶選擇 */}
      <div>
        <label className="text-sm font-medium text-[#6B5D52] mb-1.5 block">選擇帳戶</label>
        <select
          value={formData.account_id}
          onChange={e => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
          className="w-full p-3 border border-[#E0D8CC] rounded-lg bg-white/60 focus:border-[#C9A961] focus:ring-[#C9A961]/20 transition-colors"
        >
          <option value="">請選擇帳戶</option>
          {accounts.map(account => (
            <option key={account.id} value={account.id}>
              {account.name} (NT$ {account.balance.toLocaleString()})
            </option>
          ))}
        </select>
      </div>

      {/* 分類選擇 */}
      <div>
        <label className="text-sm font-medium text-[#6B5D52] mb-1.5 block">選擇分類</label>
        <select
          value={formData.category_id}
          onChange={e => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
          className="w-full p-3 border border-[#E0D8CC] rounded-lg bg-white/60 focus:border-[#C9A961] focus:ring-[#C9A961]/20 transition-colors"
        >
          <option value="">請選擇分類</option>
          {filteredCategories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* 金額 */}
      <div>
        <label className="text-sm font-medium text-[#6B5D52] mb-1.5 block">金額</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9E8F81] text-sm">
            NT$
          </span>
          <Input
            type="number"
            value={formData.amount}
            onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            onKeyDown={handleKeyDown}
            {...compositionProps}
            placeholder="0"
            className="pl-12 text-lg font-semibold border-[#E0D8CC] bg-white/60 focus:border-[#C9A961] focus:ring-[#C9A961]/20"
            min="0"
            step="1"
          />
        </div>
      </div>

      {/* 日期 */}
      <div>
        <label className="text-sm font-medium text-[#6B5D52] mb-1.5 block">日期</label>
        <Input
          type="date"
          value={formData.date}
          onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
          className="border-[#E0D8CC] bg-white/60 focus:border-[#C9A961] focus:ring-[#C9A961]/20"
        />
      </div>

      {/* 備註 */}
      <div>
        <label className="text-sm font-medium text-[#6B5D52] mb-1.5 block">備註</label>
        <Input
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          onKeyDown={handleKeyDown}
          {...compositionProps}
          placeholder="輸入備註（選填）"
          className="border-[#E0D8CC] bg-white/60 focus:border-[#C9A961] focus:ring-[#C9A961]/20"
        />
      </div>
    </FormDialog>
  )
}
