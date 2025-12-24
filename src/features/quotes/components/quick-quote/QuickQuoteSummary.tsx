'use client'

import React from 'react'
import { Input } from '@/components/ui/input'

interface QuickQuoteSummaryProps {
  totalCost: number
  totalAmount: number
  totalProfit: number
  receivedAmount: number
  balanceAmount: number
  isEditing: boolean
  expenseDescription: string
  onReceivedAmountChange: (value: number) => void
  onExpenseDescriptionChange: (value: string) => void
}

export const QuickQuoteSummary: React.FC<QuickQuoteSummaryProps> = ({
  totalCost,
  totalAmount,
  totalProfit,
  receivedAmount,
  balanceAmount,
  isEditing,
  expenseDescription,
  onReceivedAmountChange,
  onExpenseDescriptionChange,
}) => {
  const normalizeNumber = (val: string): string => {
    // 全形轉半形
    val = val.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    val = val.replace(/[．]/g, '.')
    val = val.replace(/[－]/g, '-')
    return val
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  return (
    <>
      {/* 費用說明 - 只在編輯模式或有內容時顯示 */}
      {(isEditing || expenseDescription) && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-morandi-primary mb-4">費用說明</h2>
          {isEditing ? (
            <textarea
              value={expenseDescription}
              onChange={e => onExpenseDescriptionChange(e.target.value)}
              placeholder="輸入整體報價說明，例如：含機票、住宿、餐食..."
              className="w-full min-h-[100px] p-3 border border-border rounded-md text-sm resize-y focus:outline-none focus:ring-2 focus:ring-morandi-gold/50"
            />
          ) : (
            <p className="text-sm text-morandi-secondary whitespace-pre-wrap">
              {expenseDescription}
            </p>
          )}
        </div>
      )}

      {/* 金額統計 */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-morandi-primary mb-4">金額統計</h2>
        <div className={`grid gap-4 ${isEditing ? 'grid-cols-5' : 'grid-cols-3'}`}>
          {isEditing && (
            <div className="p-4 bg-morandi-container/10 rounded-lg">
              <label className="text-sm font-medium text-morandi-secondary">總成本</label>
              <div className="mt-1 text-2xl font-bold text-morandi-primary">
                NT$ {totalCost.toLocaleString()}
              </div>
            </div>
          )}
          <div className="p-4 bg-morandi-container/10 rounded-lg">
            <label className="text-sm font-medium text-morandi-secondary">應收金額</label>
            <div className="mt-1 text-2xl font-bold text-morandi-primary">
              NT$ {totalAmount.toLocaleString()}
            </div>
          </div>
          {isEditing && (
            <div className="p-4 bg-morandi-container/10 rounded-lg">
              <label className="text-sm font-medium text-morandi-secondary">總利潤</label>
              <div className={`mt-1 text-2xl font-bold ${totalProfit >= 0 ? 'text-morandi-green' : 'text-morandi-red'}`}>
                NT$ {totalProfit.toLocaleString()}
              </div>
            </div>
          )}
          <div className="p-4 bg-morandi-container/10 rounded-lg">
            <label className="text-sm font-medium text-morandi-secondary">已收金額</label>
            {isEditing ? (
              <Input
                type="text"
                inputMode="decimal"
                value={receivedAmount === 0 ? '' : receivedAmount}
                onChange={e => {
                  const val = normalizeNumber(e.target.value)
                  if (val === '' || val === '-') {
                    onReceivedAmountChange(0)
                  } else {
                    const num = parseFloat(val)
                    if (!isNaN(num)) {
                      onReceivedAmountChange(num)
                    }
                  }
                }}
                onKeyDown={handleKeyDown}
                className="mt-1 text-xl font-bold"
                step="0.01"
                placeholder=""
              />
            ) : (
              <div className="mt-1 text-2xl font-bold text-morandi-primary">
                NT$ {receivedAmount.toLocaleString()}
              </div>
            )}
          </div>
          <div className="p-4 bg-morandi-container/10 rounded-lg">
            <label className="text-sm font-medium text-morandi-secondary">應收餘額</label>
            <div
              className={`mt-1 text-2xl font-bold ${
                balanceAmount > 0 ? 'text-morandi-red' : 'text-morandi-green'
              }`}
            >
              NT$ {balanceAmount.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
