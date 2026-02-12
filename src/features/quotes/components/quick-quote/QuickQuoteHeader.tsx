'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { QUICK_QUOTE_DIALOG_LABELS } from '../../constants/labels';

interface FormData {
  customer_name: string
  contact_phone: string
  contact_address: string
  tour_code: string
  handler_name: string
  issue_date: string
}

interface QuickQuoteHeaderProps {
  formData: FormData
  isEditing: boolean
  onFieldChange: <K extends keyof FormData>(field: K, value: FormData[K]) => void
}

export const QuickQuoteHeader: React.FC<QuickQuoteHeaderProps> = ({
  formData,
  isEditing,
  onFieldChange,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-morandi-primary mb-4">客戶資訊</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-morandi-primary">客戶名稱</label>
          <Input
            value={formData.customer_name}
            onChange={e => onFieldChange('customer_name', e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isEditing}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-morandi-primary">聯絡電話</label>
          <Input
            value={formData.contact_phone}
            onChange={e => onFieldChange('contact_phone', e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isEditing}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-morandi-primary">通訊地址</label>
          <Input
            value={formData.contact_address}
            onChange={e => onFieldChange('contact_address', e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isEditing}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-morandi-primary">團體編號</label>
          <Input
            value={formData.tour_code}
            onChange={e => onFieldChange('tour_code', e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isEditing}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-morandi-primary">承辦業務</label>
          <Input
            value={formData.handler_name}
            onChange={e => onFieldChange('handler_name', e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isEditing}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-morandi-primary">開單日期</label>
          <DatePicker
            value={formData.issue_date}
            onChange={(date) => onFieldChange('issue_date', date || '')}
            disabled={!isEditing}
            placeholder={QUICK_QUOTE_DIALOG_LABELS.選擇日期}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  )
}
