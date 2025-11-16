/**
 * Hook for managing quick quote form state
 */

'use client'

import { useState, useEffect } from 'react'
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

const STORAGE_KEY = 'venturo_quick_quote_draft'

interface UseQuickQuoteFormParams {
  addQuote: (data: any) => Promise<any>
}

export const useQuickQuoteForm = ({ addQuote }: UseQuickQuoteFormParams) => {
  const user = useAuthStore(state => state.user)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)


  // 如果 user.workspace_id 不存在，從資料庫讀取
  useEffect(() => {
    const fetchWorkspaceId = async () => {
      if (user?.workspace_id) {
        setWorkspaceId(user.workspace_id)
        return
      }

      if (!user?.id) return

      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          'https://pfqvdacxowpgfamuvnsn.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.5YC6YwTE3xmfHMQYdv1c7UcjIjYK7OjXYv4Z-lUmxFE'
        )
        const { data } = await supabase
          .from('employees')
          .select('workspace_id')
          .eq('user_id', user.id)
          .single()

        if (data?.workspace_id) {
          setWorkspaceId(data.workspace_id)
        }
      } catch (error) {
        console.error('Failed to fetch workspace_id:', error)
      }
    }

    fetchWorkspaceId()
  }, [user?.id, user?.workspace_id])

  // 初始化時從 localStorage 載入草稿
  const [formData, setFormData] = useState<QuickQuoteFormData>(() => {
    if (typeof window === 'undefined') return initialFormData

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // 確保日期是今天（避免載入舊的日期）
        parsed.issue_date = new Date().toISOString().split('T')[0]
        return parsed
      }
    } catch (error) {
      console.error('Failed to load quick quote draft:', error)
    }
    return initialFormData
  })

  // 每次 formData 變更時自動存到 localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
    } catch (error) {
      console.error('Failed to save quick quote draft:', error)
    }
  }, [formData])

  const resetForm = () => {
    setFormData(initialFormData)
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

    // 確保有 workspace_id（多重 fallback）
    let finalWorkspaceId = user?.workspace_id || workspaceId

    // 最後的 fallback：從 IndexedDB 的 employees 表讀取
    if (!finalWorkspaceId && user?.id) {
      try {
        const { openDB } = await import('idb')
        const db = await openDB('VenturoOfflineDB')
        const tx = db.transaction('employees', 'readonly')
        const store = tx.objectStore('employees')

        // 嘗試找到當前用戶的員工記錄
        const allEmployees = await store.getAll()
        const employee = allEmployees.find((emp: any) => emp.user_id === user.id)

        if (employee?.workspace_id) {
          finalWorkspaceId = employee.workspace_id
          console.log('從 IndexedDB 取得 workspace_id:', finalWorkspaceId)
        }
      } catch (error) {
        console.error('無法從 IndexedDB 讀取 workspace_id:', error)
      }
    }

    if (!finalWorkspaceId) {
      alert('無法取得工作空間資訊，請聯繫管理員')
      console.error('workspace_id 取得失敗', { user, workspaceId })
      return false
    }

    try {
      // 計算應收金額
      const totalAmount = formData.items.reduce((sum, item) => sum + item.amount, 0)

      // 建立快速報價單（不傳 code，讓系統自動產生 TP-Q001 格式）
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
        workspace_id: finalWorkspaceId, // 使用 fallback workspace_id
        created_by: user?.id,
        created_by_name: user?.full_name || formData.handler_name,
      })

      if (!newQuote || !newQuote.id) {
        throw new Error('建立快速報價單失敗')
      }

      // 等待 quote 同步到 Supabase（確保外鍵存在）
      console.log('等待 quote 同步到 Supabase...')
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 儲存收費明細項目到 quote_items 表格
      if (formData.items.length > 0) {
        console.log('開始儲存收費明細項目:', formData.items.length, '個')
        const { useQuoteItemStore } = await import('@/stores')
        const { create } = useQuoteItemStore.getState()

        for (const item of formData.items) {
          console.log('儲存項目:', item.description)
          await create({
            quote_id: newQuote.id,
            description: item.description,
            category: '其他', // 快速報價單預設分類
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.amount,
            notes: item.notes || '',
          } as any) // 使用 as any 因為資料庫欄位和型別定義不一致
        }
        console.log('收費明細項目儲存完成')
      }

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
