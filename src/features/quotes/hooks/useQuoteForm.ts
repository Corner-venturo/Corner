/**
 * Hook for managing quote form state
 */

'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { logger } from '@/lib/utils/logger'
import { DEFAULT_CATEGORIES } from '../constants'
import { Quote } from '@/stores/types'
import type { CostItem } from '../types'

interface QuoteFormData {
  name: string
  status: 'proposed' | 'approved'
  group_size: number | ''
  tour_id: string | null
  is_pinned: boolean
  code: string
  accommodation_days: number
  departure_date: string | null
  return_date: string | null
}

const initialFormData: QuoteFormData = {
  name: '',
  status: 'proposed',
  group_size: 1,
  tour_id: null,
  is_pinned: false,
  code: '',
  accommodation_days: 0,
  departure_date: null,
  return_date: null,
}

interface UseQuoteFormParams {
  addQuote: (data: Omit<Quote, 'id' | 'created_at' | 'updated_at' | 'version' | 'versions'>) => Promise<Quote>
}

export const useQuoteForm = ({ addQuote }: UseQuoteFormParams) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState<QuoteFormData>(initialFormData)

  const resetForm = () => {
    setFormData(initialFormData)
  }

  const setFormField = <K extends keyof QuoteFormData>(field: K, value: QuoteFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const initFormWithTour = (tour: { id: string; name: string; max_participants?: number | null; departure_date?: string; return_date?: string }) => {
    // 計算天數（住宿天數 = 總天數 - 1）
    let accommodationDays = 0
    if (tour.departure_date && tour.return_date) {
      const startDate = new Date(tour.departure_date)
      const endDate = new Date(tour.return_date)
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      accommodationDays = Math.max(0, totalDays - 1) // 住宿天數 = 總天數 - 1
    }

    setFormData({
      name: tour.name,
      status: 'proposed',
      group_size: tour.max_participants || 1,
      tour_id: tour.id,
      is_pinned: false,
      code: '',
      accommodation_days: accommodationDays,
      departure_date: tour.departure_date || null,
      return_date: tour.return_date || null,
    })
  }

  const handleSubmit = async (): Promise<boolean> => {
    if (!formData.name.trim()) {
      alert('請填寫報價單名稱')
      return false
    }

    // 確保人數有效
    const groupSize = typeof formData.group_size === 'number' ? formData.group_size : 1
    if (groupSize < 1) {
      alert('人數必須至少為 1')
      return false
    }

    try {
      // 使用表單中的 tour_id（如果有選擇），否則從 URL 取得
      const selectedTourId = formData.tour_id || searchParams.get('tour_id')

      // 如果是置頂範本且有自訂編號，使用自訂編號；否則使用自動生成編號
      const quoteCode =
        formData.is_pinned && formData.code.trim() ? formData.code.trim().toUpperCase() : undefined

      // 根據住宿天數建立住宿項目
      const accommodationItems: CostItem[] = []
      const accommodationDays = formData.accommodation_days

      if (accommodationDays > 0) {
        for (let day = 1; day <= accommodationDays; day++) {
          accommodationItems.push({
            id: `accommodation-day${day}-${Date.now()}-${day}`,
            name: '',
            quantity: null,
            unit_price: null,
            total: 0,
            note: '',
            day: day,
            room_type: '',
          })
        }
      }

      // 建立 categories，包含住宿項目
      const categories = DEFAULT_CATEGORIES.map(cat => {
        if (cat.id === 'accommodation') {
          return {
            ...cat,
            items: accommodationItems,
          }
        }
        return { ...cat }
      })

      // 新增報價單並取得完整物件
      const newQuoteObj = await addQuote({
        ...formData,
        quote_type: 'standard', // 團體報價單類型
        group_size: groupSize,
        tour_id: selectedTourId || undefined, // Use undefined instead of null
        ...(quoteCode && { code: quoteCode }),
        accommodation_days: accommodationDays,
        categories: categories,
        total_cost: 0,
        // 補充必填欄位的預設值
        customer_name: '待指定',
        is_pinned: formData.is_pinned || false,
        // 根據 group_size 初始化 participant_counts（預設全部為成人）
        participant_counts: {
          adult: groupSize,
          child_with_bed: 0,
          child_no_bed: 0,
          single_room: 0,
          infant: 0,
        },
      })

      // 重置表單
      resetForm()

      // 直接跳轉到詳細頁面開始編輯
      if (newQuoteObj?.id) {
        router.replace(`/quotes/${newQuoteObj.id}`)
        return true
      }

      return false
    } catch (error) {
      logger.error('新增報價單失敗:', error)
      alert('新增報價單失敗，請重試')
      return false
    }
  }

  return {
    formData,
    setFormData,
    setFormField,
    resetForm,
    initFormWithTour,
    handleSubmit,
  }
}
