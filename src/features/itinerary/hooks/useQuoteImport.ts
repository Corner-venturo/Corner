/**
 * Hook for importing data from quote to itinerary
 * Handles URL parameters passed from CreateItineraryFromQuoteButton
 */

'use client'

import { useSearchParams } from 'next/navigation'
import { ITINERARY_HOOKS_LABELS } from '../constants/labels'

interface MealData {
  day: number
  type: '早餐' | '午餐' | '晚餐'
  name: string
  note?: string
}

interface HotelData {
  day: number
  name: string
  note?: string
}

interface ActivityData {
  day: number
  title: string
  description?: string
}

interface DailyItinerary {
  dayLabel: string
  date: string
  title: string
  highlight: string
  description: string
  images: string[]
  activities: Array<{
    icon: string
    title: string
    description: string
    image: string
  }>
  recommendations: string[]
  meals: {
    breakfast: string
    lunch: string
    dinner: string
  }
  accommodation: string
}

interface UseQuoteImportResult {
  isFromQuote: boolean
  quoteId: string | null
  quoteName: string | null
  days: number
  mealsData: MealData[]
  hotelsData: HotelData[]
  activitiesData: ActivityData[]
  hasImportData: boolean
  importDataToItinerary: (dailyItinerary: DailyItinerary[]) => DailyItinerary[]
}

export const useQuoteImport = (): UseQuoteImportResult => {
  const searchParams = useSearchParams()

  const isFromQuote = searchParams.get('from_quote') === 'true'
  const quoteId = searchParams.get('quote_id')
  const quoteName = searchParams.get('quote_name')
  const days = parseInt(searchParams.get('days') || '5')

  const mealsData: MealData[] = searchParams.get('meals')
    ? JSON.parse(searchParams.get('meals') || '[]')
    : []
  const hotelsData: HotelData[] = searchParams.get('hotels')
    ? JSON.parse(searchParams.get('hotels') || '[]')
    : []
  const activitiesData: ActivityData[] = searchParams.get('activities')
    ? JSON.parse(searchParams.get('activities') || '[]')
    : []

  const hasImportData = mealsData.length > 0 || hotelsData.length > 0 || activitiesData.length > 0

  /**
   * 將報價單資料匯入到行程表
   * - 餐食：根據 day 和 type（早餐/午餐/晚餐）填入對應的餐食欄位
   * - 住宿：根據 day 填入對應天的住宿欄位
   * - 活動：根據 day 加入對應天的 activities 陣列
   */
  const importDataToItinerary = (dailyItinerary: DailyItinerary[]): DailyItinerary[] => {
    if (!isFromQuote || !hasImportData) {
      return dailyItinerary
    }

    // 複製一份避免直接修改
    const updatedItinerary = dailyItinerary.map(day => ({
      ...day,
      meals: { ...day.meals },
      activities: [...(day.activities || [])],
    }))

    // 匯入餐食資料
    mealsData.forEach(meal => {
      const dayIndex = meal.day - 1
      if (dayIndex >= 0 && dayIndex < updatedItinerary.length) {
        const mealName = meal.name + (meal.note ? ` (${meal.note})` : '')
        switch (meal.type) {
          case '早餐':
            updatedItinerary[dayIndex].meals.breakfast = mealName
            break
          case '午餐':
            updatedItinerary[dayIndex].meals.lunch = mealName
            break
          case '晚餐':
            updatedItinerary[dayIndex].meals.dinner = mealName
            break
        }
      }
    })

    // 匯入住宿資料
    hotelsData.forEach(hotel => {
      const dayIndex = hotel.day - 1
      if (dayIndex >= 0 && dayIndex < updatedItinerary.length) {
        updatedItinerary[dayIndex].accommodation = hotel.name + (hotel.note ? ` (${hotel.note})` : '')
      }
    })

    // 匯入活動資料
    activitiesData.forEach(activity => {
      const dayIndex = activity.day - 1
      if (dayIndex >= 0 && dayIndex < updatedItinerary.length) {
        updatedItinerary[dayIndex].activities.push({
          icon: '🎯',
          title: activity.title,
          description: activity.description || '',
          image: '',
        })
      }
    })

    return updatedItinerary
  }

  return {
    isFromQuote,
    quoteId,
    quoteName,
    days,
    mealsData,
    hotelsData,
    activitiesData,
    hasImportData,
    importDataToItinerary,
  }
}
