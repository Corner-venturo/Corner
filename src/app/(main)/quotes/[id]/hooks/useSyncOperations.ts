'use client'

import { useCallback } from 'react'
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
  itineraries: Itinerary[]
  updateItinerary: (id: string, data: Partial<Itinerary>) => Promise<void>
  router: AppRouterInstance
}

export function useSyncOperations({
  quote,
  categories,
  accommodationDays,
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
          name:
            item.description || item.name.replace(/Day\s*\d+(?:-\d+)?\s*住宿\s*-?\s*/, '').trim(),
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
    const mealUpdates: Record<
      number,
      Record<MealType, { name: string; isSelfArranged: boolean }>
    > = {}

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
        const newValue = updates.lunch.isSelfArranged
          ? QUOTE_SYNC_LABELS.MEAL_SELF
          : updates.lunch.name || ''
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
        const newValue = updates.dinner.isSelfArranged
          ? QUOTE_SYNC_LABELS.MEAL_SELF
          : updates.dinner.name || ''
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
  const handleConfirmSync = useCallback(
    (syncDiffs: MealDiff[]) => {
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
    },
    [quote, itineraries, updateItinerary]
  )

  return {
    handleCreateItinerary,
    calculateSyncDiffs,
    handleConfirmSync,
  }
}
