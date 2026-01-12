'use client'

import { getTodayString } from '@/lib/utils/format-date'

import React, { useState, useEffect } from 'react'
import { useAccountingStore } from '@/stores/accounting-store'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { ArrowUpRight, ArrowDownRight, Plus, ChevronLeft, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CurrencyCell } from '@/components/table-cells'
import { useEnterSubmit } from '@/hooks/useEnterSubmit'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AddTransactionDialogProps {
  isOpen: boolean
  onClose: () => void
}

type TransactionType = 'income' | 'expense'
type Step = 'selectType' | 'selectCategory' | 'enterDetails'

export function AddTransactionDialog({ isOpen, onClose }: AddTransactionDialogProps) {
  const { accounts, categories, createTransaction, createCategory } = useAccountingStore()
  const [step, setStep] = useState<Step>('selectType')
  const [transactionType, setTransactionType] = useState<TransactionType>('expense')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const [formData, setFormData] = useState({
    account_id: '',
    amount: '',
    description: '',
    date: getTodayString(),
  })

  // 當 accounts 載入完成時，設定預設帳戶
  useEffect(() => {
    if (accounts.length > 0 && !formData.account_id) {
      setFormData(prev => ({ ...prev, account_id: accounts[0].id }))
    }
  }, [accounts, formData.account_id])

  // 當對話框打開時重置狀態
  useEffect(() => {
    if (isOpen) {
      setStep('selectType')
      setTransactionType('expense')
      setSelectedCategory('')
      setIsAddingCategory(false)
      setNewCategoryName('')
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!formData.account_id || !formData.amount || !selectedCategory) {
      return
    }

    const account = accounts.find(acc => acc.id === formData.account_id)
    const category = categories.find(cat => cat.id === selectedCategory)

    const transactionData = {
      account_id: formData.account_id,
      account_name: account?.name || '',
      category_id: selectedCategory,
      category_name: category?.name || '',
      type: transactionType,
      amount: parseFloat(formData.amount),
      currency: 'TWD',
      description: formData.description,
      date: formData.date,
    }

    await createTransaction(transactionData)
    resetForm()
    onClose()
  }

  const resetForm = () => {
    setFormData({
      account_id: accounts.length > 0 ? accounts[0].id : '',
      amount: '',
      description: '',
      date: getTodayString(),
    })
    setStep('selectType')
    setTransactionType('expense')
    setSelectedCategory('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleTypeSelect = (type: TransactionType) => {
    setTransactionType(type)
    setStep('selectCategory')
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setStep('enterDetails')
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    const newCategory = await createCategory({
      name: newCategoryName.trim(),
      type: transactionType,
      color: transactionType === 'expense' ? '#C89B9B' : '#7B9B7E',
      is_system: false,
    })

    if (newCategory) {
      setSelectedCategory(newCategory.id)
      setIsAddingCategory(false)
      setNewCategoryName('')
      setStep('enterDetails')
    }
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

  const isFormValid = formData.account_id && formData.amount && selectedCategory

  // 步驟 1：選擇交易類型
  if (step === 'selectType') {
    return (
      <FormDialog
        open={isOpen}
        onOpenChange={open => !open && handleClose()}
        title="選擇交易類型"
        onCancel={handleClose}
        maxWidth="sm"
      >
        <div className="grid grid-cols-2 gap-3">
          {transactionTypes.map(type => {
            const Icon = type.icon
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => handleTypeSelect(type.id)}
                className="p-6 rounded-xl transition-all flex flex-col items-center space-y-3 hover:shadow-md"
                style={{ backgroundColor: type.bgColor, color: type.color }}
              >
                <Icon size={32} strokeWidth={2} />
                <span className="font-semibold text-lg">{type.label}</span>
              </button>
            )
          })}
        </div>
      </FormDialog>
    )
  }

  // 步驟 2：選擇分類
  if (step === 'selectCategory') {
    return (
      <FormDialog
        open={isOpen}
        onOpenChange={open => !open && handleClose()}
        title={`選擇${transactionType === 'expense' ? '支出' : '收入'}分類`}
        onCancel={handleClose}
        maxWidth="md"
      >
        {/* 返回按鈕 */}
        <button
          onClick={() => setStep('selectType')}
          className="flex items-center text-[#8C8C8C] hover:text-[#8C8C8C] mb-4 -mt-2"
        >
          <ChevronLeft size={20} />
          <span className="text-sm">返回</span>
        </button>

        {/* 分類列表或空狀態 */}
        {filteredCategories.length === 0 && !isAddingCategory ? (
          <div className="text-center py-12">
            <div className="text-[#8C8C8C] mb-4">還沒有分類</div>
            <Button
              onClick={() => setIsAddingCategory(true)}
              className="bg-[#B8A99A] hover:bg-[#9E8C7A] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              新增第一個分類
            </Button>
          </div>
        ) : isAddingCategory ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#8C8C8C] mb-1.5 block">分類名稱</label>
              <Input
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCategory()
                  }
                }}
                placeholder="例如：餐費、交通、娛樂"
                className="border-[#E8E4E0] bg-card/60 focus:border-[#B8A99A] focus:ring-[#B8A99A]/20"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setIsAddingCategory(false)
                  setNewCategoryName('')
                }}
                variant="outline"
                className="flex-1 border-[#E8E4E0] gap-1"
              >
                <X size={16} />
                取消
              </Button>
              <Button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
                className="flex-1 bg-[#B8A99A] hover:bg-[#9E8C7A] text-white gap-1"
              >
                <Plus size={16} />
                新增
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 分類卡片 */}
            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
              {filteredCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className="p-4 rounded-xl bg-card/60 hover:bg-card border-2 border-[#E8E4E0] hover:border-[#B8A99A] transition-all text-left"
                >
                  <div className="font-medium text-[#333333]">{category.name}</div>
                </button>
              ))}
            </div>

            {/* 新增分類按鈕 */}
            <button
              onClick={() => setIsAddingCategory(true)}
              className="w-full p-3 rounded-xl border-2 border-dashed border-[#E8E4E0] hover:border-[#B8A99A] text-[#8C8C8C] hover:text-[#8C8C8C] transition-all flex items-center justify-center space-x-2"
            >
              <Plus size={18} />
              <span className="text-sm font-medium">新增分類</span>
            </button>
          </div>
        )}
      </FormDialog>
    )
  }

  // 步驟 3：輸入詳細資訊
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
      {/* 返回按鈕 */}
      <button
        onClick={() => setStep('selectCategory')}
        className="flex items-center text-[#8C8C8C] hover:text-[#8C8C8C] mb-4 -mt-2"
      >
        <ChevronLeft size={20} />
        <span className="text-sm">更改分類</span>
      </button>

      {/* 已選分類顯示 */}
      <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-[#F9F8F6] to-[#F9F8F6]">
        <div className="text-xs text-[#8C8C8C] mb-1">
          {transactionType === 'expense' ? '支出' : '收入'}分類
        </div>
        <div className="font-medium text-[#333333]">
          {categories.find(c => c.id === selectedCategory)?.name}
        </div>
      </div>

      {/* 帳戶選擇 */}
      <div>
        <label className="text-sm font-medium text-[#8C8C8C] mb-1.5 block">選擇帳戶</label>
        <Select value={formData.account_id} onValueChange={(value) => setFormData(prev => ({ ...prev, account_id: value }))}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="請選擇帳戶" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map(account => (
              <SelectItem key={account.id} value={account.id}>
                <span className="flex items-center gap-1">
                  {account.name} (<CurrencyCell amount={account.balance} />)
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 金額 */}
      <div>
        <label className="text-sm font-medium text-[#8C8C8C] mb-1.5 block">金額</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8C8C8C] text-sm">
            NT$
          </span>
          <Input
            type="number"
            value={formData.amount}
            onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            onKeyDown={handleKeyDown}
            {...compositionProps}
            placeholder="0"
            className="pl-12 text-lg font-semibold border-[#E8E4E0] bg-card/60 focus:border-[#B8A99A] focus:ring-[#B8A99A]/20"
            min="0"
            step="1"
            autoFocus
          />
        </div>
      </div>

      {/* 日期 */}
      <div>
        <label className="text-sm font-medium text-[#8C8C8C] mb-1.5 block">日期</label>
        <DatePicker
          value={formData.date}
          onChange={date => setFormData(prev => ({ ...prev, date }))}
          placeholder="選擇日期"
          className="border-[#E8E4E0] bg-card/60 focus:border-[#B8A99A] focus:ring-[#B8A99A]/20"
        />
      </div>

      {/* 備註 */}
      <div>
        <label className="text-sm font-medium text-[#8C8C8C] mb-1.5 block">備註</label>
        <Input
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          onKeyDown={handleKeyDown}
          {...compositionProps}
          placeholder="輸入備註（選填）"
          className="border-[#E8E4E0] bg-card/60 focus:border-[#B8A99A] focus:ring-[#B8A99A]/20"
        />
      </div>
    </FormDialog>
  )
}
