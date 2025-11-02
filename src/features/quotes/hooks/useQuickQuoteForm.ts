/**
 * Hook for managing quick quote form state
 */

'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores'

interface QuickQuoteItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
  notes: string
}

export interface QuickQuoteFormData {
  customer_name: string
  contact_phone: string
  contact_address: string
  tour_code: string
  handler_name: string
  issue_date: string
  items: QuickQuoteItem[]
  received_amount: number | ''
}

const initialFormData: QuickQuoteFormData = {
  customer_name: '',
  contact_phone: '',
  contact_address: '',
  tour_code: '',
  handler_name: 'William',
  issue_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
  items: [],
  received_amount: '',
}

interface UseQuickQuoteFormParams {
  addQuote: (data: any) => Promise<any>
}

export const useQuickQuoteForm = ({ addQuote }: UseQuickQuoteFormParams) => {
  const [formData, setFormData] = useState<QuickQuoteFormData>(initialFormData)
  const user = useAuthStore(state => state.user)

  const resetForm = () => {
    setFormData(initialFormData)
  }

  const setFormField = <K extends keyof QuickQuoteFormData>(
    field: K,
    value: QuickQuoteFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (): Promise<boolean> => {
    if (!formData.customer_name.trim()) return false

    try {
      // 計算應收金額
      const totalAmount = formData.items.reduce((sum, item) => sum + item.amount, 0)

      // 建立快速報價單
      const newQuote = await addQuote({
        quote_type: 'quick', // 快速報價單類型
        customer_name: formData.customer_name,
        contact_phone: formData.contact_phone,
        contact_address: formData.contact_address,
        tour_code: formData.tour_code,
        handler_name: formData.handler_name,
        issue_date: formData.issue_date,
        total_amount: totalAmount,
        received_amount: Number(formData.received_amount) || 0,
        status: 'draft',
        is_active: true,
        is_pinned: false,
        created_by: user?.id,
        created_by_name: user?.full_name || formData.handler_name,
      })

      if (!newQuote || !newQuote.id) {
        throw new Error('建立快速報價單失敗')
      }

      // TODO: 儲存收費明細項目到 quote_items 表格
      // 目前先完成基本儲存，後續再處理 items

      console.log('Quick quote created:', newQuote)
      resetForm()
      return true
    } catch (error) {
      console.error('Error creating quick quote:', error)
      alert('建立快速報價單失敗')
      return false
    }
  }

  return {
    formData,
    setFormField,
    resetForm,
    handleSubmit,
  }
}
