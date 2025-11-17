/**
 * Timebox Store Selectors
 * 優化的時間盒統計 selector，避免 N² 複雜度
 */

import { useTimeboxStore } from '../timebox-store'
import { useMemo } from 'react'

/**
 * 取得週統計 (優化版本)
 * 使用 Map 避免重複查找，降低 O(n²) 到 O(n)
 */
export function useWeekStatistics() {
  const scheduledBoxes = useTimeboxStore((state: any) => state.scheduledBoxes || [])
  const boxes = useTimeboxStore((state: any) => state.boxes || [])

  return useMemo(() => {
    // 建立 box 查找 Map (O(n))
    const boxMap = new Map(boxes.map((b: any) => [b.id, b]))

    const completedBoxes = scheduledBoxes.filter((box: any) => box.completed)
    const totalBoxes = scheduledBoxes.length

    let totalWorkoutTime = 0
    let totalWorkoutVolume = 0
    let totalWorkoutSessions = 0

    const completedByType: Record<string, number> = {}

    // 單次遍歷完成所有統計 (O(n))
    completedBoxes.forEach((box: any) => {
      const baseBox = boxMap.get(box.boxId) // O(1) 查找
      if (!baseBox) return

      const type = baseBox.type || 'basic'
      completedByType[type] = (completedByType[type] || 0) + 1

      // 計算運動數據
      if (baseBox.category === 'workout' && box.duration) {
        totalWorkoutTime += box.duration
        totalWorkoutSessions += 1

        // 計算訓練量 (如果有的話)
        if (box.sets && box.reps && box.weight) {
          totalWorkoutVolume += box.sets * box.reps * box.weight
        }
      }
    })

    const completionRate =
      totalBoxes > 0 ? Math.round((completedBoxes.length / totalBoxes) * 100) : 0

    return {
      completionRate,
      totalWorkoutTime,
      completedByType,
      totalWorkoutVolume,
      totalWorkoutSessions,
    }
  }, [scheduledBoxes, boxes])
}

/**
 * 取得運動趨勢 (優化版本)
 */
export function useWorkoutTrends(weeks: number = 4) {
  const weekRecords = useTimeboxStore((state: any) => state.weekRecords || [])

  return useMemo(() => {
    return weekRecords.slice(-weeks).map((record: any) => ({
      week: record.weekStart,
      workoutTime: record.totalWorkoutTime || 0,
      completionRate: record.completionRate || 0,
    }))
  }, [weekRecords, weeks])
}

/**
 * 取得今日已排程的 boxes
 */
export function useTodayScheduledBoxes() {
  const scheduledBoxes = useTimeboxStore((state: any) => state.scheduledBoxes || [])

  return useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return scheduledBoxes.filter((box: any) => box.scheduledDate?.startsWith(today))
  }, [scheduledBoxes])
}

/**
 * 取得週視圖的 boxes (依日期分組)
 */
export function useWeekViewBoxes(weekStart: string) {
  const scheduledBoxes = useTimeboxStore((state: any) => state.scheduledBoxes || [])

  return useMemo(() => {
    const weekStartDate = new Date(weekStart)
    const weekEndDate = new Date(weekStartDate)
    weekEndDate.setDate(weekEndDate.getDate() + 7)

    const weekStartStr = weekStartDate.toISOString().split('T')[0]
    const weekEndStr = weekEndDate.toISOString().split('T')[0]

    // 過濾該週的 boxes
    const weekBoxes = scheduledBoxes.filter((box: any) => {
      if (!box.scheduledDate) return false
      const dateStr = box.scheduledDate.split('T')[0]
      return dateStr >= weekStartStr && dateStr < weekEndStr
    })

    // 按日期分組
    const grouped = new Map<string, typeof scheduledBoxes>()
    weekBoxes.forEach((box: any) => {
      const dateKey = box.scheduledDate!.split('T')[0]
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, [])
      }
      grouped.get(dateKey)!.push(box)
    })

    return grouped
  }, [scheduledBoxes, weekStart])
}

/**
 * 取得 box 完成率 (按類型)
 */
export function useBoxCompletionByType() {
  const scheduledBoxes = useTimeboxStore((state: any) => state.scheduledBoxes || [])
  const boxes = useTimeboxStore((state: any) => state.boxes || [])

  return useMemo(() => {
    const boxMap = new Map(boxes.map((b: any) => [b.id, b]))
    const typeStats = new Map<string, { total: number; completed: number }>()

    scheduledBoxes.forEach((sBox: any) => {
      const baseBox = boxMap.get(sBox.boxId)
      if (!baseBox) return

      const type = baseBox.type || 'basic'
      if (!typeStats.has(type)) {
        typeStats.set(type, { total: 0, completed: 0 })
      }

      const stats = typeStats.get(type)!
      stats.total += 1
      if (sBox.completed) stats.completed += 1
    })

    // 轉換為完成率物件
    const result: Record<string, number> = {}
    typeStats.forEach((stats, type) => {
      result[type] = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
    })

    return result
  }, [scheduledBoxes, boxes])
}
