/**
 * useTourDailyData Hook
 * 
 * 組合旅遊團每日資料：
 * - tour_daily_display (展示層資料)
 * - tour_itinerary_items (核心表資料)
 * 
 * 使用方式：
 * ```tsx
 * const { days, isLoading, error } = useTourDailyData(tourId)
 * ```
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type {
  DayData,
  UseTourDailyDataResult,
  TourItineraryItem,
  TourDailyDisplay,
} from '@/types/tour-daily.types'

export function useTourDailyData(tourId: string | null | undefined): UseTourDailyDataResult {
  const [days, setDays] = useState<DayData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // 載入資料
  const loadData = useCallback(async () => {
    if (!tourId) {
      setDays([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // 1. 載入展示層資料 (tour_daily_display)
      const displayResult: any = await supabase
        .from('tour_daily_display')
        .select('*')
        .eq('tour_id', tourId)
        .order('day', { ascending: true })

      if (displayResult.error) throw displayResult.error

      // 2. 載入核心表資料 (tour_itinerary_items)
      const itemsResult: any = await supabase
        .from('tour_itinerary_items')
        .select('*')
        .eq('tour_id', tourId)
        .order('day', { ascending: true })
        .order('order_index', { ascending: true })

      if (itemsResult.error) throw itemsResult.error

      const displayData = displayResult.data
      const itemsData = itemsResult.data

      // 3. 組合資料
      const combinedDays = combineDayData(
        (displayData as any[]) || [],
        (itemsData as any[]) || []
      )
      
      setDays(combinedDays)
    } catch (err) {
      setError(err as Error)
      console.error('useTourDailyData error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [tourId])

  // 初始載入
  useEffect(() => {
    loadData()
  }, [loadData])

  // 輔助方法：根據天數取得資料
  const getDayByNumber = useCallback(
    (day: number): DayData | undefined => {
      return days.find(d => d.day === day)
    },
    [days]
  )

  // 輔助方法：取得特定天數的項目
  const getItemsByDay = useCallback(
    (day: number, category?: string): TourItineraryItem[] => {
      const dayData = getDayByNumber(day)
      if (!dayData) return []

      const allItems = [
        ...dayData.accommodations,
        ...dayData.meals,
        ...dayData.activities,
        ...dayData.transportation,
      ]

      if (category) {
        return allItems.filter(item => item.category === category)
      }

      return allItems
    },
    [getDayByNumber]
  )

  // 輔助方法：計算總成本
  const getTotalCost = useCallback(() => {
    let estimated = 0
    let actual = 0

    days.forEach(day => {
      estimated += day.totalEstimatedCost
      actual += day.totalActualCost
    })

    return { estimated, actual }
  }, [days])

  return {
    days,
    totalDays: days.length,
    isLoading,
    error,
    refetch: loadData,
    getDayByNumber,
    getItemsByDay,
    getTotalCost,
  }
}

/**
 * 組合每日資料
 */
function combineDayData(
  displayData: TourDailyDisplay[],
  itemsData: TourItineraryItem[]
): DayData[] {
  // 找出所有天數
  const allDays = new Set<number>()
  displayData.forEach(d => allDays.add(d.day))
  itemsData.forEach(i => allDays.add(i.day))

  // 組合每一天的資料
  const combined: DayData[] = []

  Array.from(allDays)
    .sort((a, b) => a - b)
    .forEach(dayNumber => {
      // 展示層資料
      const display = displayData.find(d => d.day === dayNumber)
      
      // 核心表資料（按類別分組）
      const dayItems = itemsData.filter(i => i.day === dayNumber)
      const accommodations = dayItems.filter(i => i.category === 'accommodation')
      const meals = dayItems.filter(i => i.category === 'meals')
      const activities = dayItems.filter(i => i.category === 'activity')
      const transportation = dayItems.filter(i => i.category === 'transportation')

      // 計算成本
      const totalEstimatedCost = dayItems.reduce((sum, item) => {
        return sum + (item.estimated_cost || 0)
      }, 0)

      const totalActualCost = dayItems.reduce((sum, item) => {
        return sum + (item.actual_cost || 0)
      }, 0)

      // 組合
      combined.push({
        day: dayNumber,
        dayLabel: display?.day_label || `Day ${dayNumber}`,
        title: display?.title || '',
        highlight: display?.highlight || '',
        description: display?.description || '',
        images: parseImages(display?.images),
        date: display?.date || null,
        isHidden: display?.is_hidden || false,
        accommodations,
        meals,
        activities,
        transportation,
        totalEstimatedCost,
        totalActualCost,
        itemCount: dayItems.length,
      })
    })

  return combined
}

/**
 * 解析 JSONB images
 */
function parseImages(imagesJsonb: any): Array<{ url: string; caption?: string }> {
  if (!imagesJsonb) return []
  if (Array.isArray(imagesJsonb)) return imagesJsonb
  
  try {
    if (typeof imagesJsonb === 'string') {
      return JSON.parse(imagesJsonb)
    }
  } catch {
    return []
  }
  
  return []
}
