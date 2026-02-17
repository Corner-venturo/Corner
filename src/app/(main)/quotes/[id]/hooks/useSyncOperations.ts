'use client'

import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import type { Quote, Itinerary } from '@/stores/types'
import type { CostCategory, CostItem } from '@/features/quotes/types'
import type { MealDiff } from '@/features/quotes/components'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { QUOTE_SYNC_LABELS } from '../constants/labels'

interface UseSyncOperationsProps {
  quote: Quote | null
  categories: CostCategory[]
  accommodationDays: number
  setCategories: React.Dispatch<React.SetStateAction<CostCategory[]>>
  setAccommodationDays: React.Dispatch<React.SetStateAction<number>>
  itineraries: Itinerary[]
  updateItinerary: (id: string, data: Partial<Itinerary>) => Promise<void>
  router: AppRouterInstance
}

export function useSyncOperations({
  quote,
  categories,
  accommodationDays,
  setCategories,
  setAccommodationDays,
  itineraries,
  updateItinerary,
  router,
}: UseSyncOperationsProps) {

  // 建立行程表
  const handleCreateItinerary = useCallback(() => {
    if (!quote) return

    // 從報價單分類中提取資料
    const extractMeals = () => {
      const mealsCategory = categories.find(cat => cat.id === 'meals')
      if (!mealsCategory || mealsCategory.items.length === 0) return []

      return mealsCategory.items.map((item: CostItem) => {
        const nameMatch = item.name.match(/Day\s*(\d+)\s*(早餐|午餐|晚餐)\s*-?\s*(.*)/)
        if (nameMatch) {
          return {
            day: parseInt(nameMatch[1]),
            type: nameMatch[2],
            name: nameMatch[3].trim() || item.description || '',
            note: item.notes || '',
          }
        }
        return {
          day: 1,
          type: '午餐',
          name: item.name || item.description || '',
          note: item.notes || '',
        }
      })
    }

    const extractHotels = () => {
      const accommodationCategory = categories.find(cat => cat.id === 'accommodation')
      if (!accommodationCategory || accommodationCategory.items.length === 0) return []

      return accommodationCategory.items.map((item: CostItem) => {
        const nameMatch = item.name.match(/Day\s*(\d+)(?:-\d+)?\s*住宿/)
        return {
          day: nameMatch ? parseInt(nameMatch[1]) : 1,
          name: item.description || item.name.replace(/Day\s*\d+(?:-\d+)?\s*住宿\s*-?\s*/, '').trim(),
          note: item.notes || '',
        }
      })
    }

    const extractActivities = () => {
      const activitiesCategory = categories.find(cat => cat.id === 'activities')
      if (!activitiesCategory || activitiesCategory.items.length === 0) return []

      return activitiesCategory.items.map((item: CostItem) => {
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
    }

    const meals = extractMeals()
    const hotels = extractHotels()
    const activities = extractActivities()
    const days = accommodationDays > 0 ? accommodationDays + 1 : 5

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

    router.push(`/itinerary/new?${params.toString()}`)
  }, [quote, categories, accommodationDays, router])

  // 計算同步差異
  const calculateSyncDiffs = useCallback(() => {
    if (!quote?.itinerary_id) return null

    const itinerary = itineraries.find(i => i.id === quote.itinerary_id)
    if (!itinerary) return null

    const mealsCategory = categories.find(cat => cat.id === 'meals')
    if (!mealsCategory || mealsCategory.items.length === 0) return null

    type MealType = 'lunch' | 'dinner'
    const mealUpdates: Record<number, Record<MealType, { name: string; isSelfArranged: boolean }>> = {}

    mealsCategory.items.forEach((item: CostItem) => {
      const match = item.name.match(/Day\s*(\d+)\s*(午餐|晚餐)\s*-?\s*(.*)/)
      if (match) {
        const day = parseInt(match[1])
        const type = match[2] === QUOTE_SYNC_LABELS.MEAL_LUNCH ? 'lunch' : 'dinner'
        const name = match[3].trim()
        const isSelfArranged = item.is_self_arranged || false

        if (!mealUpdates[day]) {
          mealUpdates[day] = {} as Record<MealType, { name: string; isSelfArranged: boolean }>
        }
        mealUpdates[day][type] = { name, isSelfArranged }
      }
    })

    const diffs: MealDiff[] = []

    itinerary.daily_itinerary.forEach((day, index) => {
      const dayNumber = index + 1
      const updates = mealUpdates[dayNumber]
      if (!updates) return

      if (updates.lunch) {
        const newValue = updates.lunch.isSelfArranged ? QUOTE_SYNC_LABELS.MEAL_SELF : (updates.lunch.name || '')
        const oldValue = day.meals.lunch || ''
        if (newValue && newValue !== oldValue) {
          diffs.push({
            day: dayNumber,
            type: 'lunch',
            typeLabel: QUOTE_SYNC_LABELS.MEAL_LUNCH,
            oldValue,
            newValue,
          })
        }
      }

      if (updates.dinner) {
        const newValue = updates.dinner.isSelfArranged ? QUOTE_SYNC_LABELS.MEAL_SELF : (updates.dinner.name || '')
        const oldValue = day.meals.dinner || ''
        if (newValue && newValue !== oldValue) {
          diffs.push({
            day: dayNumber,
            type: 'dinner',
            typeLabel: QUOTE_SYNC_LABELS.MEAL_DINNER,
            oldValue,
            newValue,
          })
        }
      }
    })

    return { itinerary, diffs }
  }, [quote, categories, itineraries])

  // 確認同步
  const handleConfirmSync = useCallback((syncDiffs: MealDiff[]) => {
    if (!quote?.itinerary_id) return

    const itinerary = itineraries.find(i => i.id === quote.itinerary_id)
    if (!itinerary) return

    const updatedDailyItinerary = itinerary.daily_itinerary.map((day, index) => {
      const dayNumber = index + 1
      const dayDiffs = syncDiffs.filter(d => d.day === dayNumber)
      if (dayDiffs.length === 0) return day

      const newMeals = { ...day.meals }
      dayDiffs.forEach(diff => {
        if (diff.type === 'lunch') {
          newMeals.lunch = diff.newValue
        } else if (diff.type === 'dinner') {
          newMeals.dinner = diff.newValue
        }
      })

      return { ...day, meals: newMeals }
    })

    updateItinerary(itinerary.id, {
      daily_itinerary: updatedDailyItinerary,
    })

    toast.success(QUOTE_SYNC_LABELS.SYNC_MEALS_SUCCESS)
  }, [quote, itineraries, updateItinerary])

  // 從行程表同步住宿名稱
  const handleSyncAccommodationFromItinerary = useCallback(() => {
    if (!quote?.itinerary_id) {
      toast.error(QUOTE_SYNC_LABELS.NO_LINKED_ITINERARY)
      return
    }

    const itinerary = itineraries.find(i => i.id === quote.itinerary_id)
    if (!itinerary?.daily_itinerary) {
      toast.error(QUOTE_SYNC_LABELS.ITINERARY_NOT_FOUND)
      return
    }

    const itineraryHotels: Array<{ day: number; name: string }> = []
    itinerary.daily_itinerary.forEach((day, index) => {
      const dayNumber = index + 1
      const hotelName = day.accommodation || ''
      if (hotelName) {
        itineraryHotels.push({ day: dayNumber, name: hotelName })
      }
    })

    if (itineraryHotels.length === 0) {
      toast.info(QUOTE_SYNC_LABELS.NO_ACCOMMODATION_DATA)
      return
    }

    setCategories(prev => {
      const newCategories = [...prev]
      const accommodationCategory = newCategories.find(cat => cat.id === 'accommodation')
      if (!accommodationCategory) return prev

      const maxDay = Math.max(...itineraryHotels.map(h => h.day), accommodationDays)

      const existingByDay: Record<number, CostItem> = {}
      accommodationCategory.items.forEach((item: CostItem) => {
        if (item.day) {
          existingByDay[item.day] = item
        }
      })

      const updatedItems: typeof accommodationCategory.items = []
      let hasChanges = false

      for (let day = 1; day <= maxDay; day++) {
        const itineraryHotel = itineraryHotels.find(h => h.day === day)
        const existingItem = existingByDay[day]

        if (existingItem) {
          if (itineraryHotel && existingItem.name !== itineraryHotel.name) {
            updatedItems.push({ ...existingItem, name: itineraryHotel.name })
            hasChanges = true
          } else {
            updatedItems.push(existingItem)
          }
        } else if (itineraryHotel) {
          updatedItems.push({
            id: `accommodation-day${day}-${Date.now()}`,
            name: itineraryHotel.name,
            quantity: 0,
            unit_price: 0,
            total: 0,
            note: '',
            day: day,
            room_type: '',
          })
          hasChanges = true
        }
      }

      if (!hasChanges) {
        toast.info(QUOTE_SYNC_LABELS.ACCOMMODATION_UP_TO_DATE)
        return prev
      }

      accommodationCategory.items = updatedItems
      if (maxDay > accommodationDays) {
        setAccommodationDays(maxDay)
      }
      toast.success(QUOTE_SYNC_LABELS.SYNC_ACCOMMODATION(itineraryHotels.length))
      return newCategories
    })
  }, [quote, itineraries, accommodationDays, setCategories, setAccommodationDays])

  // 取得行程表的餐飲資料
  const itineraryMealsData = useMemo(() => {
    if (!quote?.itinerary_id) return []
    const itinerary = itineraries.find(i => i.id === quote.itinerary_id)
    if (!itinerary?.daily_itinerary) return []

    const meals: Array<{ day: number; type: '早餐' | '午餐' | '晚餐'; name: string }> = []
    itinerary.daily_itinerary.forEach((day, index) => {
      const dayNumber = index + 1
      if (day.meals?.breakfast && !day.meals.breakfast.includes(QUOTE_SYNC_LABELS.MEAL_SELF)) {
        meals.push({ day: dayNumber, type: '早餐', name: day.meals.breakfast })
      }
      if (day.meals?.lunch && !day.meals.lunch.includes(QUOTE_SYNC_LABELS.MEAL_SELF)) {
        meals.push({ day: dayNumber, type: '午餐', name: day.meals.lunch })
      }
      if (day.meals?.dinner && !day.meals.dinner.includes(QUOTE_SYNC_LABELS.MEAL_SELF)) {
        meals.push({ day: dayNumber, type: '晚餐', name: day.meals.dinner })
      }
    })
    return meals
  }, [quote, itineraries])

  // 取得行程表的景點資料
  const itineraryActivitiesData = useMemo(() => {
    if (!quote?.itinerary_id) return []
    const itinerary = itineraries.find(i => i.id === quote.itinerary_id)
    if (!itinerary?.daily_itinerary) return []

    const activities: Array<{ day: number; title: string; description?: string }> = []
    itinerary.daily_itinerary.forEach((day, index) => {
      const dayNumber = index + 1
      if (day.activities) {
        day.activities.forEach((activity: { title: string; description?: string }) => {
          activities.push({
            day: dayNumber,
            title: activity.title,
            description: activity.description,
          })
        })
      }
    })
    return activities
  }, [quote, itineraries])

  return {
    handleCreateItinerary,
    calculateSyncDiffs,
    handleConfirmSync,
    handleSyncAccommodationFromItinerary,
    itineraryMealsData,
    itineraryActivitiesData,
  }
}
