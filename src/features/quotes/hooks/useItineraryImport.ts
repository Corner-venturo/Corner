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
  shouldCreateNewVersion: boolean
  importDataToCategories: (categories: CostCategory[], skipCheck?: boolean) => CostCategory[]
  markAsImported: () => void
}

export const useItineraryImport = (): UseItineraryImportResult => {
  const searchParams = useSearchParams()
  const [hasImportedData, setHasImportedData] = useState(false)

  const isFromItinerary = searchParams.get('from_itinerary') === 'true'
  const isLinkingItinerary = searchParams.get('link_itinerary') !== null
  const linkItineraryId = searchParams.get('link_itinerary')
  const shouldCreateNewVersion = searchParams.get('create_new_version') === 'true'
  
  const mealsData: MealData[] = searchParams.get('meals') 
    ? JSON.parse(searchParams.get('meals') || '[]') 
    : []
  const hotelsData: HotelData[] = searchParams.get('hotels') 
    ? JSON.parse(searchParams.get('hotels') || '[]') 
    : []
  const activitiesData: ActivityData[] = searchParams.get('activities') 
    ? JSON.parse(searchParams.get('activities') || '[]') 
    : []

  // 將餐食資料轉換為報價項目（排除早餐，因為通常飯店附）
  // 只帶入餐廳名稱，不加 Day X 前綴
  const convertMealsToQuoteItems = (meals: MealData[]) => {
    return meals
      .filter(meal => meal.type !== '早餐')
      .map((meal, index) => ({
        id: `meal-${index}`,
        name: meal.name, // 只使用餐廳名稱
        description: meal.note || '',
        quantity: 1,
        unit_price: 0, // 使用者需要手動設定價格
        total: 0,
        notes: '',
        order: index,
        is_group_cost: false
      }))
  }

  // 將住宿資料轉換為報價項目（使用報價單住宿專用格式）
  const convertHotelsToQuoteItems = (hotels: HotelData[]) => {
    return hotels.map((hotel, index) => ({
      id: `hotel-${Date.now()}-${index}`,
      name: hotel.name, // 飯店名稱
      quantity: 0, // 房間人數（需手動填寫）
      unit_price: 0, // 房價（需手動填寫）
      total: 0,
      note: hotel.note || '',
      day: hotel.day, // 使用獨立的 day 欄位
      room_type: '', // 房型（需手動填寫）
    }))
  }

  // 將活動資料轉換為報價項目
  // 只帶入景點名稱，不加 Day X 前綴
  const convertActivitiesToQuoteItems = (activities: ActivityData[]) => {
    return activities.map((activity, index) => ({
      id: `activity-${index}`,
      name: activity.title, // 只使用景點名稱
      description: activity.description || '',
      quantity: 1,
      unit_price: 0, // 使用者需要手動設定價格
      total: 0,
      notes: '',
      order: index,
      is_group_cost: false
    }))
  }

  // 將行程資料匯入到報價分類中
  // skipCheck: 跳過 hasImportedData 檢查（用於 useState 初始化時）
  const importDataToCategories = (categories: CostCategory[], skipCheck: boolean = false): CostCategory[] => {
    console.log('[useItineraryImport] importDataToCategories called', {
      isFromItinerary,
      hasImportedData,
      skipCheck,
      mealsCount: mealsData.length,
      hotelsCount: hotelsData.length,
      activitiesCount: activitiesData.length,
    })

    // 如果不是從行程來的，或沒有資料，直接返回
    if (!isFromItinerary || (mealsData.length === 0 && hotelsData.length === 0 && activitiesData.length === 0)) {
      console.log('[useItineraryImport] Skipping import - no data')
      return categories
    }

    // 如果已經匯入過且不是跳過檢查模式，直接返回
    if (hasImportedData && !skipCheck) {
      console.log('[useItineraryImport] Skipping import - already imported')
      return categories
    }

    console.log('[useItineraryImport] Starting import...')

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

  // 標記為已匯入（供外部調用）
  const markAsImported = () => {
    setHasImportedData(true)
  }

  return {
    isFromItinerary,
    mealsData,
    hotelsData,
    activitiesData,
    hasImportedData,
    isLinkingItinerary,
    linkItineraryId,
    shouldCreateNewVersion,
    importDataToCategories,
    markAsImported,
  }
}