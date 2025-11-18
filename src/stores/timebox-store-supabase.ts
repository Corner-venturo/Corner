/**
 * ⚠️ EXPERIMENTAL - NOT IN USE ⚠️
 *
 * 這是實驗性的 Supabase 版時間箱 Store，目前未被使用。
 *
 * 現況：
 * - 所有頁面使用 timebox-store.ts（本地 persist 版本）
 * - 此檔案採用 VenturoAPI + currentUserId 非同步流程
 * - 欄位結構與 timebox-store.ts 不同（user_id vs 無用戶欄位）
 * - 沒有任何地方載入此模組
 *
 * 使用中的版本：src/stores/timebox-store.ts
 *
 * 決策待定：
 * 1. 如要啟用 Supabase 版，需同步更新所有 UI 為非同步流程
 * 2. 如不啟用，建議重新命名或搬移到 experimental/ 目錄
 *
 * 此檔案保留作為未來整合 Supabase 的參考實作。
 */

import { create } from 'zustand'

import { VenturoAPI } from '@/lib/supabase/api'
import { logger } from '@/lib/utils/logger'

// 基礎類型定義
export interface BaseBox {
  id: string
  user_id: string
  name: string
  color: string
  type: 'workout' | 'reminder' | 'basic'
  created_at: Date
  updated_at: Date
  // 重訓專用欄位
  equipment?: string
  weight?: number
  reps?: number
  sets?: number
}

// 重訓資料
export interface WorkoutData {
  setsCompleted: boolean[]
  completedSetsTime: Date[]
  totalVolume?: number
}

// 提醒資料
export interface ReminderData {
  text: string
  lastUpdated: Date
}

// 排程箱子實例
export interface ScheduledBox {
  id: string
  boxId: string
  weekId: string
  user_id: string
  dayOfWeek: number
  start_time: string
  duration: number
  completed: boolean
  completedAt?: Date
  workoutData?: WorkoutData
  reminderData?: ReminderData
}

// 週記錄
export interface WeekRecord {
  id: string
  user_id: string
  weekStart: Date
  weekEnd: Date
  name?: string
  archived: boolean
  completionRate: number
  totalWorkoutVolume?: number
  totalWorkoutSessions?: number
  completedCount: number
  totalCount: number
  reviewNotes?: string
  reviewCreatedAt?: Date
}

// 統計資料
export interface WeekStatistics {
  completionRate: number
  totalWorkoutTime: number
  completedByType: {
    workout: number
    reminder: number
    basic: number
  }
  totalWorkoutVolume?: number
  totalWorkoutSessions?: number
}

// 莫蘭迪配色選項
export const morandiColors = [
  { name: '柔霧粉', value: '#E2C4C4', hover: '#D9B3B3' },
  { name: '晨露綠', value: '#C4D6C4', hover: '#B3CAB3' },
  { name: '雲石灰', value: '#D4D4D4', hover: '#C4C4C4' },
  { name: '奶茶棕', value: '#D6C4B8', hover: '#CAB3A5' },
  { name: '薰衣草', value: '#D0C4D6', hover: '#C3B3CA' },
  { name: '杏仁黃', value: '#E0D6B8', hover: '#D6CAA5' },
  { name: '海霧藍', value: '#C4D0D6', hover: '#B3C3CA' },
  { name: '珊瑚橘', value: '#E0C8B8', hover: '#D6B9A5' },
  { name: '鼠尾草', value: '#B8C8B8', hover: '#A5B9A5' },
  { name: '暮色紫', value: '#C4B8D0', hover: '#B3A5C3' },
  { name: '燕麥米', value: '#D6D0C4', hover: '#CAC3B3' },
  { name: '石墨藍', value: '#B8C4D0', hover: '#A5B3C3' },
  { name: '楓葉紅', value: '#D0B8B8', hover: '#C3A5A5' },
  { name: '苔蘚綠', value: '#B8C4B8', hover: '#A5B3A5' },
  { name: '砂岩褐', value: '#C8B8B0', hover: '#B9A59C' },
  { name: '月光白', value: '#E8E8E8', hover: '#DEDEDE' },
]

interface TimeboxState {
  // 當前使用者 ID
  currentUserId: string | null
  setCurrentUserId: (user_id: string) => void

  // 狀態
  boxes: BaseBox[]
  currentWeek: WeekRecord | null
  scheduledBoxes: ScheduledBox[]
  weekRecords: WeekRecord[]
  loading: boolean
  error: string | null

  // 箱子管理
  loadBoxes: () => Promise<void>
  createBox: (box: Omit<BaseBox, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateBox: (id: string, updates: Partial<BaseBox>) => Promise<void>
  deleteBox: (id: string) => Promise<void>

  // 週記錄
  loadCurrentWeek: () => Promise<void>
  loadWeekRecords: () => Promise<void>
  initializeCurrentWeek: (weekStart: Date) => Promise<void>
  archiveCurrentWeek: (name: string) => Promise<void>

  // 排程管理
  loadScheduledBoxes: (weekId: string) => Promise<void>
  addScheduledBox: (box: Omit<ScheduledBox, 'id' | 'user_id'>) => Promise<void>
  updateScheduledBox: (id: string, updates: Partial<ScheduledBox>) => Promise<void>
  removeScheduledBox: (id: string) => Promise<void>
  toggleBoxCompletion: (id: string) => Promise<void>
  toggleSetCompletion: (boxId: string, setIndex: number) => Promise<void>

  // 統計
  getWeekStatistics: () => WeekStatistics
}

// 輔助函數
const getWeekStart = (date: Date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

const getWeekEnd = (date: Date) => {
  const start = getWeekStart(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return end
}

export const useTimeboxStore = create<TimeboxState>((set, get) => ({
  // 初始狀態
  currentUserId: null,
  boxes: [],
  currentWeek: null,
  scheduledBoxes: [],
  weekRecords: [],
  loading: false,
  error: null,

  setCurrentUserId: user_id => {
    set({ currentUserId: user_id })
  },

  // 載入箱子
  loadBoxes: async () => {
    const { currentUserId } = get()
    if (!currentUserId) return

    set({ loading: true, error: null })
    try {
      const boxes = await VenturoAPI.read<BaseBox>('timebox_boxes', {
        filters: { user_id: currentUserId },
        orderBy: { column: 'created_at', ascending: false },
      })
      set({ boxes, loading: false })
    } catch (error) {
      logger.error('載入箱子失敗:', error)
      set({ error: '載入箱子失敗', loading: false })
    }
  },

  // 建立箱子
  createBox: async boxData => {
    const { currentUserId } = get()
    if (!currentUserId) return

    try {
      const newBox = await VenturoAPI.create<BaseBox>('timebox_boxes', {
        ...boxData,
        user_id: currentUserId,
      })
      set(state => ({ boxes: [newBox, ...state.boxes] }))
    } catch (error) {
      logger.error('建立箱子失敗:', error)
      set({ error: '建立箱子失敗' })
    }
  },

  // 更新箱子
  updateBox: async (id, updates) => {
    try {
      const updatedBox = await VenturoAPI.update<BaseBox>('timebox_boxes', id, updates)
      set(state => ({
        boxes: state.boxes.map(box => (box.id === id ? updatedBox : box)),
      }))
    } catch (error) {
      logger.error('更新箱子失敗:', error)
      set({ error: '更新箱子失敗' })
    }
  },

  // 刪除箱子
  deleteBox: async id => {
    try {
      await VenturoAPI.delete('timebox_boxes', id)
      set(state => ({
        boxes: state.boxes.filter(box => box.id !== id),
        scheduledBoxes: state.scheduledBoxes.filter(sb => sb.boxId !== id),
      }))
    } catch (error) {
      logger.error('刪除箱子失敗:', error)
      set({ error: '刪除箱子失敗' })
    }
  },

  // 載入當前週
  loadCurrentWeek: async () => {
    const { currentUserId } = get()
    if (!currentUserId) return

    set({ loading: true })
    try {
      const today = new Date()
      const weekStart = getWeekStart(today)

      // 查詢當前週
      const weeks = await VenturoAPI.read<WeekRecord>('timebox_weeks', {
        filters: {
          user_id: currentUserId,
          weekStart: weekStart.toISOString().split('T')[0],
          archived: false,
        },
      })

      if (weeks.length > 0) {
        const currentWeek = weeks[0]
        set({ currentWeek, loading: false })
        await get().loadScheduledBoxes(currentWeek.id)
      } else {
        // 自動初始化當前週
        await get().initializeCurrentWeek(weekStart)
      }
    } catch (error) {
      logger.error('載入當前週失敗:', error)
      set({ error: '載入當前週失敗', loading: false })
    }
  },

  // 載入週記錄
  loadWeekRecords: async () => {
    const { currentUserId } = get()
    if (!currentUserId) return

    try {
      const records = await VenturoAPI.read<WeekRecord>('timebox_weeks', {
        filters: { user_id: currentUserId, archived: true },
        orderBy: { column: 'weekStart', ascending: false },
      })
      set({ weekRecords: records })
    } catch (error) {
      logger.error('載入週記錄失敗:', error)
      set({ error: '載入週記錄失敗' })
    }
  },

  // 初始化當前週
  initializeCurrentWeek: async weekStart => {
    const { currentUserId } = get()
    if (!currentUserId) return

    try {
      const weekEnd = getWeekEnd(weekStart)
      const newWeek = await VenturoAPI.create<WeekRecord>('timebox_weeks', {
        user_id: currentUserId,
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        archived: false,
        completionRate: 0,
        completedCount: 0,
        totalCount: 0,
      })

      set({ currentWeek: newWeek, scheduledBoxes: [] })
    } catch (error) {
      logger.error('初始化當前週失敗:', error)
      set({ error: '初始化當前週失敗' })
    }
  },

  // 封存當前週
  archiveCurrentWeek: async name => {
    const { currentWeek, scheduledBoxes } = get()
    if (!currentWeek) return

    try {
      // 計算統計資料
      const completedCount = scheduledBoxes.filter(box => box.completed).length
      const totalCount = scheduledBoxes.length
      const completionRate = totalCount > 0 ? completedCount / totalCount : 0

      await VenturoAPI.update('timebox_weeks', currentWeek.id, {
        name,
        archived: true,
        completionRate,
        completedCount,
        totalCount,
      })

      // 重新載入
      await get().loadWeekRecords()
      await get().loadCurrentWeek()
    } catch (error) {
      logger.error('封存週記錄失敗:', error)
      set({ error: '封存週記錄失敗' })
    }
  },

  // 載入排程
  loadScheduledBoxes: async weekId => {
    try {
      const schedules = await VenturoAPI.read<ScheduledBox>('timebox_schedules', {
        filters: { weekId },
        orderBy: { column: 'dayOfWeek', ascending: true },
      })
      set({ scheduledBoxes: schedules })
    } catch (error) {
      logger.error('載入排程失敗:', error)
      set({ error: '載入排程失敗' })
    }
  },

  // 新增排程
  addScheduledBox: async boxData => {
    const { currentUserId } = get()
    if (!currentUserId) return

    try {
      const newSchedule = await VenturoAPI.create<ScheduledBox>('timebox_schedules', {
        ...boxData,
        user_id: currentUserId,
      })
      set(state => ({
        scheduledBoxes: [...state.scheduledBoxes, newSchedule],
      }))
    } catch (error) {
      logger.error('新增排程失敗:', error)
      set({ error: '新增排程失敗' })
    }
  },

  // 更新排程
  updateScheduledBox: async (id, updates) => {
    try {
      const updated = await VenturoAPI.update<ScheduledBox>('timebox_schedules', id, updates)
      set(state => ({
        scheduledBoxes: state.scheduledBoxes.map(box => (box.id === id ? updated : box)),
      }))
    } catch (error) {
      logger.error('更新排程失敗:', error)
      set({ error: '更新排程失敗' })
    }
  },

  // 刪除排程
  removeScheduledBox: async id => {
    try {
      await VenturoAPI.delete('timebox_schedules', id)
      set(state => ({
        scheduledBoxes: state.scheduledBoxes.filter(box => box.id !== id),
      }))
    } catch (error) {
      logger.error('刪除排程失敗:', error)
      set({ error: '刪除排程失敗' })
    }
  },

  // 切換完成狀態
  toggleBoxCompletion: async id => {
    const box = get().scheduledBoxes.find(b => b.id === id)
    if (!box) return

    await get().updateScheduledBox(id, {
      completed: !box.completed,
      completedAt: !box.completed ? new Date() : undefined,
    })
  },

  // 切換組別完成
  toggleSetCompletion: async (boxId, setIndex) => {
    const box = get().scheduledBoxes.find(b => b.id === boxId)
    if (!box) return

    const currentData = box.workoutData || {
      setsCompleted: [],
      completedSetsTime: [],
      totalVolume: 0,
    }

    const updated = { ...currentData }
    updated.setsCompleted[setIndex] = !updated.setsCompleted[setIndex]
    updated.completedSetsTime[setIndex] = updated.setsCompleted[setIndex]
      ? (new Date() as any)
      : (null as any)

    await get().updateScheduledBox(boxId, { workoutData: updated })
  },

  // 統計
  getWeekStatistics: () => {
    const { scheduledBoxes, boxes } = get()
    const completedBoxes = scheduledBoxes.filter(box => box.completed)
    const totalBoxes = scheduledBoxes.length

    const completedByType = {
      workout: 0,
      reminder: 0,
      basic: 0,
    }

    let totalWorkoutTime = 0
    let totalWorkoutVolume = 0
    let totalWorkoutSessions = 0

    completedBoxes.forEach(box => {
      const baseBox = boxes.find(b => b.id === box.boxId)
      if (baseBox) {
        completedByType[baseBox.type]++

        if (baseBox.type === 'workout') {
          totalWorkoutTime += box.duration
          totalWorkoutSessions++

          if (box.workoutData?.totalVolume) {
            totalWorkoutVolume += box.workoutData.totalVolume
          }
        }
      }
    })

    return {
      completionRate: totalBoxes > 0 ? completedBoxes.length / totalBoxes : 0,
      totalWorkoutTime,
      completedByType,
      totalWorkoutVolume,
      totalWorkoutSessions,
    }
  },
}))
