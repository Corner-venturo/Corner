// src/features/timebox/hooks/useTimeboxData.ts
import { createCloudHook } from '@/hooks/createCloudHook'
import type { BaseEntity } from '@/types'

// ============================================
// 型別定義
// ============================================

export interface TimeboxBox extends BaseEntity {
  name: string
  color: string | null
  type: string | null
  user_id: string
  default_content: Record<string, unknown> | null
  equipment?: string | null
  default_duration?: number | null // 預設時長（分鐘）
}

export interface TimeboxWeek extends BaseEntity {
  user_id: string
  week_start: string // date string YYYY-MM-DD
  name: string | null
  archived: boolean | null
  review_notes?: string | null // 週回顧筆記
  next_week_goals?: string | null // 下週目標
}

export interface TimeboxScheduledBox extends BaseEntity {
  user_id: string
  box_id: string
  week_id: string
  day_of_week: number // 0-6 (Sun-Sat)
  start_time: string // "HH:mm:ss"
  duration: number // in minutes
  completed: boolean
  data: Record<string, unknown> | null
}

// 重訓動作
export interface WorkoutExercise {
  id: string
  equipment: string
  weight: number
  reps: number
  sets: number
  setsCompleted: boolean[]
  completedSetsTime: (string | null)[]
}

// 重訓資料
export interface WorkoutData {
  exercises: WorkoutExercise[]
  totalVolume?: number
}

// 提醒資料
export interface ReminderData {
  text: string
  lastUpdated: string
}

// 訓練模板
export interface WorkoutTemplate extends BaseEntity {
  user_id: string
  name: string
  exercises: WorkoutExercise[]
}

// ============================================
// Hooks
// ============================================

export const useTimeboxBoxes = createCloudHook<TimeboxBox>('timebox_boxes', {
  orderBy: { column: 'name', ascending: true },
})

export const useTimeboxWeeks = createCloudHook<TimeboxWeek>('timebox_weeks', {
  orderBy: { column: 'week_start', ascending: false },
})

export const useTimeboxScheduledBoxes = createCloudHook<TimeboxScheduledBox>('timebox_scheduled_boxes', {
  orderBy: { column: 'start_time', ascending: true },
})

export const useWorkoutTemplates = createCloudHook<WorkoutTemplate>('timebox_workout_templates', {
  orderBy: { column: 'name', ascending: true },
})

// ============================================
// 工具函數
// ============================================

// 莫蘭迪配色
export const morandiColors = [
  { name: '柔霧粉', value: '#E2C4C4' },
  { name: '晨露綠', value: '#C4D6C4' },
  { name: '雲石灰', value: '#D4D4D4' },
  { name: '奶茶棕', value: '#D6C4B8' },
  { name: '薰衣草', value: '#D0C4D6' },
  { name: '杏仁黃', value: '#E0D6B8' },
  { name: '海霧藍', value: '#C4D0D6' },
  { name: '珊瑚橘', value: '#E0C8B8' },
  { name: '鼠尾草', value: '#B8C8B8' },
  { name: '暮色紫', value: '#C4B8D0' },
  { name: '燕麥米', value: '#D6D0C4' },
  { name: '石墨藍', value: '#B8C4D0' },
]

// 取得週一（週的開始）
export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 週一為起始
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// 取得週日（週的結束）
export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

// 格式化日期為 YYYY-MM-DD
export function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

// 格式化時間為 HH:mm
export function formatTime(time: string): string {
  // 如果是 HH:mm:ss 格式，取前 5 個字元
  if (time.length > 5) {
    return time.substring(0, 5)
  }
  return time
}

// 星期名稱
export const weekDayNames = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
export const weekDayNamesShort = ['日', '一', '二', '三', '四', '五', '六']

// 時間槽（每小時）
export const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0')
  return `${hour}:00`
})
