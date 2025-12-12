/**
 * Hook for managing quick quote form state
 */

'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores'
import { supabase } from '@/lib/supabase/client'
import { Quote } from '@/stores/types'

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

const getInitialFormData = (): QuickQuoteFormData => ({
  customer_name: '',
  contact_phone: '',
  contact_address: '',
  tour_code: '',
  handler_name: '', // 由 useEffect 自動填入當前登入者名稱
  issue_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
  items: [],
  received_amount: '',
})

const STORAGE_KEY = 'venturo_quick_quote_draft'

interface UseQuickQuoteFormParams {
   
  addQuote: (data: any) => Promise<Quote | undefined>
}

export const useQuickQuoteForm = ({ addQuote }: UseQuickQuoteFormParams) => {
  const user = useAuthStore(state => state.user)

  // ✅ 直接從 user 取得 workspace_id（確保非空）
  const workspaceId = user?.workspace_id || null

  // 初始化時從 localStorage 載入草稿
  const [formData, setFormData] = useState<QuickQuoteFormData>(() => {
    if (typeof window === 'undefined') return getInitialFormData()

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // 確保日期是今天（避免載入舊的日期）
        parsed.issue_date = new Date().toISOString().split('T')[0]
        return parsed
      }
    } catch (error) {
      logger.error('Failed to load quick quote draft:', error)
    }
    return getInitialFormData()
  })

  // 當 user 載入後，自動填入 handler_name（如果目前是空的）
  useEffect(() => {
    if (user && !formData.handler_name) {
      const defaultName = user.display_name || user.chinese_name || user.email || ''
      setFormData(prev => ({ ...prev, handler_name: defaultName }))
    }
  }, [user, formData.handler_name])

  // 每次 formData 變更時自動存到 localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
    } catch (error) {
      logger.error('Failed to save quick quote draft:', error)
    }
  }, [formData])

  const resetForm = () => {
    const resetData = getInitialFormData()
    // 保留當前登入者的名稱
    if (user) {
      resetData.handler_name = user.display_name || user.chinese_name || user.email || ''
    }
    setFormData(resetData)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const setFormField = <K extends keyof QuickQuoteFormData>(
    field: K,
    value: QuickQuoteFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (): Promise<boolean> => {
    if (!formData.customer_name.trim()) return false

    // 確保有 workspace_id
    const finalWorkspaceId = user?.workspace_id || workspaceId

    if (!finalWorkspaceId) {
      alert('無法取得工作空間資訊，請重新登入')
      logger.error('workspace_id 取得失敗', { user, workspaceId })
      return false
    }

    try {
      // 計算應收金額
      const totalAmount = formData.items.reduce((sum, item) => sum + item.amount, 0)

      // ✅ 建立快速報價單（項目直接存入 quick_quote_items JSONB 欄位）
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
        workspace_id: finalWorkspaceId,
        created_by: user?.id,
        created_by_name: user?.display_name || user?.chinese_name || formData.handler_name,
        // ✅ 快速報價單項目直接存入 JSONB 欄位（不使用 quote_items 表格）
        quick_quote_items: formData.items,
      })

      if (!newQuote || !newQuote.id) {
        throw new Error('建立快速報價單失敗')
      }

      logger.log('Quick quote created:', newQuote)
      resetForm()
      return true
    } catch (error) {
      logger.error('Error creating quick quote:', error)
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
