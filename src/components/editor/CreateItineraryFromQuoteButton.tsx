'use client'

import React, { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import { Quote } from '@/types/quote.types'
import { CostCategory } from '@/features/quotes/types'
import { COMP_EDITOR_LABELS } from './constants/labels'

interface CreateItineraryFromQuoteButtonProps {
  quote: Quote & { categories?: CostCategory[] }
  accommodationDays?: number
}

/**
 * 從報價單建立行程表按鈕
 * 將報價單的餐食、住宿、活動資料轉換並帶入行程表
 */
export const CreateItineraryFromQuoteButton: React.FC<CreateItineraryFromQuoteButtonProps> = ({
  quote,
  accommodationDays = 0,
}) => {
  const router = useRouter()

  // 從報價單分類中提取餐食資料
  const extractMealsFromCategories = useCallback((categories: CostCategory[]) => {
    const mealsCategory = categories.find(cat => cat.id === 'meals')
    if (!mealsCategory || mealsCategory.items.length === 0) return []

    return mealsCategory.items.map(item => {
      // 解析名稱格式：「Day 1 午餐 - 餐廳名稱」
      const nameMatch = item.name.match(/Day\s*(\d+)\s*(早餐|午餐|晚餐)\s*-?\s*(.*)/)
      if (nameMatch) {
        return {
          day: parseInt(nameMatch[1]),
          type: nameMatch[2],
          name: nameMatch[3].trim() || item.description || '',
          note: item.notes || '',
        }
      }
      // 如果格式不符，嘗試從 description 取得
      return {
        day: 1,
        type: COMP_EDITOR_LABELS.午餐,
        name: item.name || item.description || '',
        note: item.notes || '',
      }
    })
  }, [])

  // 從報價單分類中提取住宿資料
  const extractHotelsFromCategories = useCallback((categories: CostCategory[]) => {
    const accommodationCategory = categories.find(cat => cat.id === 'accommodation')
    if (!accommodationCategory || accommodationCategory.items.length === 0) return []

    return accommodationCategory.items.map(item => {
      // 解析名稱格式：「Day 1 住宿」或「Day 1-2 住宿」
      const nameMatch = item.name.match(/Day\s*(\d+)(?:-\d+)?\s*住宿/)
      return {
        day: nameMatch ? parseInt(nameMatch[1]) : 1,
        name: item.description || item.name.replace(/Day\s*\d+(?:-\d+)?\s*住宿\s*-?\s*/, '').trim(),
        note: item.notes || '',
      }
    })
  }, [])

  // 從報價單分類中提取活動資料
  const extractActivitiesFromCategories = useCallback((categories: CostCategory[]) => {
    const activitiesCategory = categories.find(cat => cat.id === 'activities')
    if (!activitiesCategory || activitiesCategory.items.length === 0) return []

    return activitiesCategory.items.map(item => {
      // 解析名稱格式：「Day 1 - 活動名稱」
      const nameMatch = item.name.match(/Day\s*(\d+)\s*-?\s*(.*)/)
      if (nameMatch) {
        return {
          day: parseInt(nameMatch[1]),
          title: nameMatch[2].trim(),
          description: item.description || item.notes || '',
        }
      }
      return {
        day: 1,
        title: item.name,
        description: item.description || item.notes || '',
      }
    })
  }, [])

  const handleCreateItinerary = useCallback(() => {
    if (!quote.categories) {
      // 沒有分類資料，直接跳轉新增行程表頁面
      router.push('/itinerary/new')
      return
    }

    // 提取資料
    const meals = extractMealsFromCategories(quote.categories)
    const hotels = extractHotelsFromCategories(quote.categories)
    const activities = extractActivitiesFromCategories(quote.categories)

    // 計算天數
    const days = accommodationDays > 0 ? accommodationDays + 1 : 5 // 預設 5 天

    // 建立 URL 參數
    const params = new URLSearchParams()
    params.set('from_quote', 'true')
    params.set('quote_id', quote.id)
    params.set('quote_name', quote.name || '')
    params.set('days', days.toString())

    if (meals.length > 0) {
      params.set('meals', JSON.stringify(meals))
    }
    if (hotels.length > 0) {
      params.set('hotels', JSON.stringify(hotels))
    }
    if (activities.length > 0) {
      params.set('activities', JSON.stringify(activities))
    }

    // 跳轉到行程表編輯頁面
    router.push(`/itinerary/new?${params.toString()}`)
  }, [quote, accommodationDays, router, extractMealsFromCategories, extractHotelsFromCategories, extractActivitiesFromCategories])

  return (
    <Button
      onClick={handleCreateItinerary}
      variant="outline"
      className="h-8 px-3 text-sm"
    >
      <FileText size={14} className="mr-1.5" />
      建立行程表
    </Button>
  )
}
