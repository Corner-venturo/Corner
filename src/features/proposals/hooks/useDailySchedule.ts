/**
 * 每日行程編輯 Hook
 * 處理每日行程的新增、編輯、刪除邏輯
 */

import { useState, useCallback } from 'react'
import type { Itinerary, ItineraryVersionRecord } from '@/stores/types'

// 簡化版活動類型（只包含時間軸需要的欄位）
export interface SimpleActivity {
  id: string
  title: string
  startTime?: string  // 格式 "0900"
  endTime?: string    // 格式 "1030"
}

// 每日行程資料結構
export interface DaySchedule {
  day: number
  route: string
  meals: { breakfast: string; lunch: string; dinner: string }
  accommodation: string
  sameAsPrevious: boolean
  hotelBreakfast: boolean
  activities?: SimpleActivity[]
}

interface UseDailyScheduleOptions {
  initialDays?: number
}

export function useDailySchedule({ initialDays = 0 }: UseDailyScheduleOptions = {}) {
  const [dailySchedule, setDailySchedule] = useState<DaySchedule[]>(() =>
    createEmptySchedule(initialDays)
  )
  const [isTimelineMode, setIsTimelineMode] = useState(false)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)

  // 創建空的行程表
  function createEmptySchedule(days: number): DaySchedule[] {
    return Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      route: '',
      meals: { breakfast: '', lunch: '', dinner: '' },
      accommodation: '',
      sameAsPrevious: false,
      hotelBreakfast: false,
      activities: undefined,
    }))
  }

  // 從行程表或版本記錄載入每日行程
  const loadFromItinerary = useCallback((
    itinerary: Itinerary,
    versionIndex: number,
    days: number
  ) => {
    const versionRecordsData = (itinerary.version_records || []) as ItineraryVersionRecord[]

    type DailyData = Array<{
      title?: string
      meals?: { breakfast?: string; lunch?: string; dinner?: string }
      accommodation?: string
      activities?: Array<{ id?: string; title?: string; startTime?: string; endTime?: string }>
    }>

    let dailyData: DailyData | null = null

    if (versionIndex === -1) {
      // 主版本：從行程表的 daily_itinerary 讀取
      dailyData = (itinerary.daily_itinerary || []) as unknown as DailyData
    } else if (versionRecordsData[versionIndex]) {
      // 特定版本：從版本記錄讀取
      dailyData = (versionRecordsData[versionIndex].daily_itinerary || []) as unknown as DailyData
    }

    if (dailyData && dailyData.length > 0) {
      const loadedSchedule = dailyData.map((day, idx) => {
        const isHotelBreakfast = day.meals?.breakfast === '飯店早餐'
        let sameAsPrevious = false
        if (idx > 0 && dailyData![idx - 1]?.accommodation) {
          sameAsPrevious = day.accommodation === dailyData![idx - 1].accommodation
        }
        // 載入活動（如果有的話）
        const activities = (day.activities || []).map((act, actIdx) => ({
          id: act.id || `activity-${idx}-${actIdx}`,
          title: act.title || '',
          startTime: act.startTime || '',
          endTime: act.endTime || '',
        }))
        return {
          day: idx + 1,
          route: day.title || '',
          meals: {
            breakfast: isHotelBreakfast ? '' : (day.meals?.breakfast || ''),
            lunch: day.meals?.lunch || '',
            dinner: day.meals?.dinner || '',
          },
          accommodation: sameAsPrevious ? '' : (day.accommodation || ''),
          sameAsPrevious,
          hotelBreakfast: isHotelBreakfast,
          activities: activities.length > 0 ? activities : undefined,
        }
      })
      setDailySchedule(loadedSchedule)
      // 如果有任何一天有活動，自動開啟時間軸模式
      if (loadedSchedule.some(d => d.activities && d.activities.length > 0)) {
        setIsTimelineMode(true)
      }
    } else {
      // 使用傳入的天數初始化
      setDailySchedule(createEmptySchedule(days))
    }
  }, [])

  // 初始化空的行程表
  const initialize = useCallback((days: number) => {
    setDailySchedule(createEmptySchedule(days))
    setIsTimelineMode(false)
    setSelectedDayIndex(0)
  }, [])

  // 更新每日行程
  const updateDay = useCallback((
    index: number,
    field: string,
    value: string | boolean
  ) => {
    setDailySchedule(prev => {
      const newSchedule = [...prev]
      if (field === 'route' || field === 'accommodation') {
        newSchedule[index] = { ...newSchedule[index], [field]: value }
      } else if (field === 'sameAsPrevious' || field === 'hotelBreakfast') {
        newSchedule[index] = { ...newSchedule[index], [field]: value as boolean }
      } else if (field.startsWith('meals.')) {
        const mealType = field.split('.')[1] as 'breakfast' | 'lunch' | 'dinner'
        newSchedule[index] = {
          ...newSchedule[index],
          meals: { ...newSchedule[index].meals, [mealType]: value as string },
        }
      }
      return newSchedule
    })
  }, [])

  // 新增活動
  const addActivity = useCallback((dayIndex: number) => {
    setDailySchedule(prev => {
      const newSchedule = [...prev]
      const activities = newSchedule[dayIndex].activities || []
      const newActivity: SimpleActivity = {
        id: `activity-${dayIndex}-${Date.now()}`,
        title: '',
        startTime: '',
        endTime: '',
      }
      newSchedule[dayIndex] = {
        ...newSchedule[dayIndex],
        activities: [...activities, newActivity],
      }
      return newSchedule
    })
  }, [])

  // 移除活動
  const removeActivity = useCallback((dayIndex: number, activityIndex: number) => {
    setDailySchedule(prev => {
      const newSchedule = [...prev]
      const activities = [...(newSchedule[dayIndex].activities || [])]
      activities.splice(activityIndex, 1)
      newSchedule[dayIndex] = {
        ...newSchedule[dayIndex],
        activities: activities.length > 0 ? activities : undefined,
      }
      return newSchedule
    })
  }, [])

  // 更新活動
  const updateActivity = useCallback((
    dayIndex: number,
    activityIndex: number,
    field: keyof SimpleActivity,
    value: string
  ) => {
    setDailySchedule(prev => {
      const newSchedule = [...prev]
      const activities = [...(newSchedule[dayIndex].activities || [])]
      activities[activityIndex] = { ...activities[activityIndex], [field]: value }
      newSchedule[dayIndex] = {
        ...newSchedule[dayIndex],
        activities,
      }
      return newSchedule
    })
  }, [])

  // 取得住宿狀態（AI 排行程前置條件）
  const getAccommodationStatus = useCallback(() => {
    const requiredDays = dailySchedule.length - 1 // 最後一天不需要住宿
    let filledCount = 0
    const accommodations: string[] = []

    for (let i = 0; i < requiredDays; i++) {
      const day = dailySchedule[i]
      if (day.accommodation || day.sameAsPrevious) {
        filledCount++
        // 取得實際住宿名稱
        if (day.sameAsPrevious) {
          accommodations.push(accommodations[accommodations.length - 1] || '')
        } else {
          accommodations.push(day.accommodation)
        }
      } else {
        accommodations.push('')
      }
    }

    return {
      isComplete: filledCount >= requiredDays,
      filledCount,
      requiredDays,
      accommodations,
    }
  }, [dailySchedule])

  // 設定整個行程表（用於 AI 生成）
  const setSchedule = useCallback((schedule: DaySchedule[]) => {
    setDailySchedule(schedule)
  }, [])

  return {
    // State
    dailySchedule,
    isTimelineMode,
    selectedDayIndex,
    // Setters
    setIsTimelineMode,
    setSelectedDayIndex,
    setSchedule,
    // Actions
    initialize,
    loadFromItinerary,
    updateDay,
    addActivity,
    removeActivity,
    updateActivity,
    getAccommodationStatus,
  }
}
