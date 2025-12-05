/**
 * Hook for importing data from itinerary to quote
 * Handles URL parameters passed from CreateQuoteFromItineraryButton
 */

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CostCategory } from '../types'

interface MealData {
  day: number
  type: string
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

interface UseItineraryImportResult {
  isFromItinerary: boolean
  mealsData: MealData[]
  hotelsData: HotelData[]
  activitiesData: ActivityData[]
  hasImportedData: boolean
  isLinkingItinerary: boolean
  linkItineraryId: string | null
  importDataToCategories: (categories: CostCategory[]) => CostCategory[]
}

export const useItineraryImport = (): UseItineraryImportResult => {
  const searchParams = useSearchParams()
  const [hasImportedData, setHasImportedData] = useState(false)

  const isFromItinerary = searchParams.get('from_itinerary') === 'true'
  const isLinkingItinerary = searchParams.get('link_itinerary') !== null
  const linkItineraryId = searchParams.get('link_itinerary')
  
  const mealsData: MealData[] = searchParams.get('meals') 
    ? JSON.parse(searchParams.get('meals') || '[]') 
    : []
  const hotelsData: HotelData[] = searchParams.get('hotels') 
    ? JSON.parse(searchParams.get('hotels') || '[]') 
    : []
  const activitiesData: ActivityData[] = searchParams.get('activities') 
    ? JSON.parse(searchParams.get('activities') || '[]') 
    : []

  // 將餐食資料轉換為報價項目
  const convertMealsToQuoteItems = (meals: MealData[]) => {
    return meals.map((meal, index) => ({
      id: `meal-${index}`,
      name: `Day ${meal.day} ${meal.type}`,
      description: meal.name,
      quantity: 1,
      unit_price: 0, // 使用者需要手動設定價格
      total: 0,
      notes: `自動帶入：${meal.name}${meal.note ? ` (${meal.note})` : ''}`,
      order: index,
      is_group_cost: false
    }))
  }

  // 將住宿資料轉換為報價項目
  const convertHotelsToQuoteItems = (hotels: HotelData[]) => {
    return hotels.map((hotel, index) => ({
      id: `hotel-${index}`,
      name: `Day ${hotel.day} 住宿`,
      description: hotel.name,
      quantity: 1,
      unit_price: 0, // 使用者需要手動設定價格
      total: 0,
      notes: `自動帶入：${hotel.name}${hotel.note ? ` (${hotel.note})` : ''}`,
      order: index,
      is_group_cost: false
    }))
  }

  // 將活動資料轉換為報價項目
  const convertActivitiesToQuoteItems = (activities: ActivityData[]) => {
    return activities.map((activity, index) => ({
      id: `activity-${index}`,
      name: `Day ${activity.day} - ${activity.title}`,
      description: activity.description || '',
      quantity: 1,
      unit_price: 0, // 使用者需要手動設定價格
      total: 0,
      notes: `自動帶入：${activity.title}`,
      order: index,
      is_group_cost: false
    }))
  }

  // 將行程資料匯入到報價分類中
  const importDataToCategories = (categories: CostCategory[]): CostCategory[] => {
    if (!isFromItinerary || hasImportedData || (mealsData.length === 0 && hotelsData.length === 0 && activitiesData.length === 0)) {
      return categories
    }

    // 標記為已匯入，避免重複匯入
    setHasImportedData(true)

    const updatedCategories = [...categories]

    // 處理餐食資料
    if (mealsData.length > 0) {
      const mealItems = convertMealsToQuoteItems(mealsData)
      const mealsCategory = updatedCategories.find(cat => cat.id === 'meals')
      if (mealsCategory) {
        mealsCategory.items = [...mealsCategory.items, ...mealItems]
        mealsCategory.total = mealsCategory.items.reduce((sum, item) => sum + (item.total || 0), 0)
      }
    }

    // 處理住宿資料
    if (hotelsData.length > 0) {
      const hotelItems = convertHotelsToQuoteItems(hotelsData)
      const hotelsCategory = updatedCategories.find(cat => cat.id === 'accommodation')
      if (hotelsCategory) {
        hotelsCategory.items = [...hotelsCategory.items, ...hotelItems]
        hotelsCategory.total = hotelsCategory.items.reduce((sum, item) => sum + (item.total || 0), 0)
      }
    }

    // 處理活動資料
    if (activitiesData.length > 0) {
      const activityItems = convertActivitiesToQuoteItems(activitiesData)
      const activitiesCategory = updatedCategories.find(cat => cat.id === 'activities')
      if (activitiesCategory) {
        activitiesCategory.items = [...activitiesCategory.items, ...activityItems]
        activitiesCategory.total = activitiesCategory.items.reduce((sum, item) => sum + (item.total || 0), 0)
      }
    }

    return updatedCategories
  }

  return {
    isFromItinerary,
    mealsData,
    hotelsData,
    activitiesData,
    hasImportedData,
    isLinkingItinerary,
    linkItineraryId,
    importDataToCategories
  }
}