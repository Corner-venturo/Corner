/**
 * Hook for managing quote form state
 */

'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { logger } from '@/lib/utils/logger'
import { DEFAULT_CATEGORIES } from '../constants'

interface QuoteFormData {
  name: string
  status: 'proposed' | 'approved'
  group_size: number | ''
  tour_id: string | null
  is_pinned: boolean
  code: string
  country_id: string | null
  main_city_id: string | null
  other_city_ids: string[]
}

const initialFormData: QuoteFormData = {
  name: '',
  status: 'proposed',
  group_size: 1,
  tour_id: null,
  is_pinned: false,
  code: '',
  country_id: null,
  main_city_id: null,
  other_city_ids: [],
}

interface UseQuoteFormParams {
  addQuote: (data: any) => Promise<any>
  getCitiesByCountry: (countryId: string) => any[]
}

export const useQuoteForm = ({ addQuote, getCitiesByCountry }: UseQuoteFormParams) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState<QuoteFormData>(initialFormData)
  const [citySearchTerm, setCitySearchTerm] = useState('')

  // 根據選擇的國家，取得可選城市
  const availableCities = useMemo(() => {
    if (!formData.country_id) return []
    return getCitiesByCountry(formData.country_id).filter(city => city.is_active)
  }, [formData.country_id, getCitiesByCountry])

  const resetForm = () => {
    setFormData(initialFormData)
    setCitySearchTerm('')
  }

  const setFormField = <K extends keyof QuoteFormData>(field: K, value: QuoteFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const initFormWithTour = (tour: any) => {
    setFormData({
      name: tour.name,
      status: 'proposed',
      group_size: tour.max_participants || 1,
      tour_id: tour.id,
      is_pinned: false,
      code: '',
      country_id: tour.country_id || null,
      main_city_id: tour.main_city_id || null,
      other_city_ids: [],
    })
  }

  const handleSubmit = async (): Promise<boolean> => {
    if (!formData.name.trim()) return false

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

      // 新增報價單並取得完整物件
      const newQuoteObj = await addQuote({
        ...formData,
        group_size: groupSize,
        ...(selectedTourId && { tour_id: selectedTourId }),
        ...(quoteCode && { code: quoteCode }),
        accommodation_days: 0,
        categories: DEFAULT_CATEGORIES,
        total_cost: 0,
        // 補充必填欄位的預設值
        customer_name: '待指定',
        destination: '待指定',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        days: 1,
        nights: 0,
        number_of_people: groupSize,
        total_amount: 0,
        is_pinned: formData.is_pinned || false,
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
    citySearchTerm,
    setCitySearchTerm,
    availableCities,
    resetForm,
    initFormWithTour,
    handleSubmit,
  }
}
