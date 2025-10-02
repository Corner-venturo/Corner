import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateId } from '@/lib/persistent-store'

// 基礎類型定義
export interface BaseBox {
  id: string
  name: string
  color: string
  type: 'workout' | 'reminder' | 'basic'
  userId: string
  createdAt: Date
  updatedAt: Date
  // 重訓專用欄位
  equipment?: string // 器材
  weight?: number    // 重量 (kg)
  reps?: number      // 次數
  sets?: number      // 組數
}

// 重訓資料 - 簡化為單一運動項目
export interface WorkoutData {
  // 組別完成狀態追蹤 (點擊即完成)
  setsCompleted: boolean[] // 每組的完成狀態 [true, true, false, false] = 前兩組完成
  completedSetsTime: Date[] // 每組完成的時間
  totalVolume?: number     // 總訓練量 (重量 × 次數 × 組數)
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
  dayOfWeek: number // 0-6 (週日到週六)
  startTime: string // "HH:mm" 格式
  duration: number // 分鐘數
  completed: boolean
  completedAt?: Date
  data?: WorkoutData | ReminderData
  // 重訓組別進度追蹤
  setsProgress?: {
    completed: number // 已完成組數
    total: number     // 總組數
  }
}

// 週記錄
export interface WeekRecord {
  id: string
  userId: string
  weekStart: Date
  weekEnd: Date
  name?: string
  archived: boolean
  scheduledBoxes: ScheduledBox[]
  statistics: {
    completionRate: number
    totalWorkoutVolume?: number
    totalWorkoutSessions?: number
    completedCount: number
    totalCount: number
  }
  review?: {
    notes: string
    createdAt: Date
  }
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

// 趨勢資料
export interface WorkoutTrend {
  week: string
  volume: number
  sessions: number
  completionRate: number
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
  // 箱子管理
  boxes: BaseBox[]
  createBox: (box: Omit<BaseBox, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateBox: (id: string, updates: Partial<BaseBox>) => void
  deleteBox: (id: string) => void

  // 週排程
  currentWeek: WeekRecord | null
  scheduledBoxes: ScheduledBox[]
  addScheduledBox: (box: Omit<ScheduledBox, 'id'>) => void
  updateScheduledBox: (id: string, updates: Partial<ScheduledBox>) => void
  removeScheduledBox: (id: string) => void
  toggleBoxCompletion: (id: string) => void

  // 重訓資料
  updateWorkoutData: (boxId: string, data: WorkoutData) => void
  toggleSetCompletion: (boxId: string, setIndex: number) => void

  // 文字提示資料
  updateReminderData: (boxId: string, data: ReminderData) => void

  // 週記錄
  weekRecords: WeekRecord[]
  archiveCurrentWeek: (name: string) => void
  loadWeekRecord: (id: string) => void
  copyToNextWeek: (recordId: string) => void

  // 統計
  getWeekStatistics: () => WeekStatistics
  getWorkoutTrends: (weeks: number) => WorkoutTrend[]

  // 初始化
  initializeCurrentWeek: (weekStart: Date) => void
}

// 輔助函數
const getWeekStart = (date: Date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 調整為週一開始
  return new Date(d.setDate(diff))
}

const getWeekEnd = (date: Date) => {
  const start = getWeekStart(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return end
}

export const useTimeboxStore = create<TimeboxState>()(
  persist(
    (set, get) => ({
      // 初始狀態
      boxes: [],
      currentWeek: null,
      scheduledBoxes: [],
      weekRecords: [],

      // 箱子管理
      createBox: (boxData) => {
        const newBox: BaseBox = {
          ...boxData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        set((state) => ({
          boxes: [...state.boxes, newBox]
        }))
      },

      updateBox: (id, updates) => {
        set((state) => ({
          boxes: state.boxes.map((box) =>
            box.id === id ? { ...box, ...updates, updatedAt: new Date() } : box
          )
        }))
      },

      deleteBox: (id) => {
        set((state) => ({
          boxes: state.boxes.filter((box) => box.id !== id),
          scheduledBoxes: state.scheduledBoxes.filter((sb) => sb.boxId !== id)
        }))
      },

      // 週排程
      addScheduledBox: (boxData) => {
        const newScheduledBox: ScheduledBox = {
          ...boxData,
          id: generateId(),
        }
        set((state) => ({
          scheduledBoxes: [...state.scheduledBoxes, newScheduledBox]
        }))
      },

      updateScheduledBox: (id, updates) => {
        set((state) => ({
          scheduledBoxes: state.scheduledBoxes.map((box) =>
            box.id === id ? { ...box, ...updates } : box
          )
        }))
      },

      removeScheduledBox: (id) => {
        set((state) => ({
          scheduledBoxes: state.scheduledBoxes.filter((box) => box.id !== id)
        }))
      },

      toggleBoxCompletion: (id) => {
        set((state) => ({
          scheduledBoxes: state.scheduledBoxes.map((box) =>
            box.id === id
              ? {
                  ...box,
                  completed: !box.completed,
                  completedAt: !box.completed ? new Date() : undefined
                }
              : box
          )
        }))
      },

      // 重訓資料
      updateWorkoutData: (boxId, data) => {
        set((state) => ({
          scheduledBoxes: state.scheduledBoxes.map((box) =>
            box.id === boxId ? { ...box, data } : box
          )
        }))
      },

      toggleSetCompletion: (boxId, setIndex) => {
        set((state) => ({
          scheduledBoxes: state.scheduledBoxes.map((box) => {
            if (box.id !== boxId) return box

            const currentData = box.data as WorkoutData
            if (!currentData) {
              // 初始化 WorkoutData，獲取組數資訊
              const baseBox = state.boxes.find(b => b.id === box.boxId)
              const totalSets = baseBox?.sets || 3

              const newData: WorkoutData = {
                setsCompleted: Array(totalSets).fill(false),
                completedSetsTime: Array(totalSets).fill(null)
              }
              newData.setsCompleted[setIndex] = true
              newData.completedSetsTime[setIndex] = new Date()

              // 計算總訓練量
              if (baseBox?.weight && baseBox?.reps) {
                newData.totalVolume = baseBox.weight * baseBox.reps * totalSets
              }

              return { ...box, data: newData }
            }

            const updatedSetsCompleted = [...currentData.setsCompleted]
            const updatedCompletedTime = [...currentData.completedSetsTime]

            // 切換該組的完成狀態
            updatedSetsCompleted[setIndex] = !updatedSetsCompleted[setIndex]
            updatedCompletedTime[setIndex] = updatedSetsCompleted[setIndex] ? new Date() : null

            const updatedData: WorkoutData = {
              ...currentData,
              setsCompleted: updatedSetsCompleted,
              completedSetsTime: updatedCompletedTime
            }

            return { ...box, data: updatedData }
          })
        }))
      },

      // 文字提示資料
      updateReminderData: (boxId, data) => {
        set((state) => ({
          scheduledBoxes: state.scheduledBoxes.map((box) =>
            box.id === boxId ? { ...box, data } : box
          )
        }))
      },

      // 週記錄
      archiveCurrentWeek: (name) => {
        const { currentWeek, scheduledBoxes } = get()
        if (!currentWeek) return

        const completedCount = scheduledBoxes.filter((box) => box.completed).length
        const totalCount = scheduledBoxes.length
        const completionRate = totalCount > 0 ? completedCount / totalCount : 0

        const workoutBoxes = scheduledBoxes.filter((box) => {
          const baseBox = get().boxes.find((b) => b.id === box.boxId)
          return baseBox?.type === 'workout' && box.completed
        })

        const totalWorkoutVolume = workoutBoxes.reduce((total, box) => {
          const baseBox = get().boxes.find((b) => b.id === box.boxId)
          if (!baseBox) return total

          if (box.data) {
            const workoutData = box.data as WorkoutData
            if (workoutData.totalVolume) {
              return total + workoutData.totalVolume
            } else if (workoutData.setsCompleted && baseBox.weight && baseBox.reps) {
              const completedSets = workoutData.setsCompleted.filter(Boolean).length
              return total + (completedSets * baseBox.weight * baseBox.reps)
            }
          } else if (baseBox.weight && baseBox.reps && baseBox.sets) {
            // 如果沒有詳細資料，假設全部完成
            return total + (baseBox.weight * baseBox.reps * baseBox.sets)
          }

          return total
        }, 0)

        const archivedWeek: WeekRecord = {
          ...currentWeek,
          name,
          archived: true,
          scheduledBoxes,
          statistics: {
            completionRate,
            totalWorkoutVolume,
            totalWorkoutSessions: workoutBoxes.length,
            completedCount,
            totalCount,
          }
        }

        set((state) => ({
          weekRecords: [...state.weekRecords, archivedWeek]
        }))
      },

      loadWeekRecord: (id) => {
        const { weekRecords } = get()
        const record = weekRecords.find((r) => r.id === id)
        if (record) {
          set({
            currentWeek: record,
            scheduledBoxes: record.scheduledBoxes
          })
        }
      },

      copyToNextWeek: (recordId) => {
        const { weekRecords } = get()
        const record = weekRecords.find((r) => r.id === recordId)
        if (!record) return

        const nextWeekStart = new Date(record.weekEnd)
        nextWeekStart.setDate(nextWeekStart.getDate() + 1)

        get().initializeCurrentWeek(nextWeekStart)

        // 複製排程但清除完成狀態
        const copiedBoxes = record.scheduledBoxes.map((box) => ({
          ...box,
          id: generateId(),
          weekId: get().currentWeek!.id,
          completed: false,
          completedAt: undefined,
        }))

        set({
          scheduledBoxes: copiedBoxes
        })
      },

      // 統計
      getWeekStatistics: () => {
        const { scheduledBoxes, boxes } = get()
        const completedBoxes = scheduledBoxes.filter((box) => box.completed)
        const totalBoxes = scheduledBoxes.length

        const completedByType = {
          workout: 0,
          reminder: 0,
          basic: 0,
        }

        let totalWorkoutTime = 0
        let totalWorkoutVolume = 0
        let totalWorkoutSessions = 0

        completedBoxes.forEach((box) => {
          const baseBox = boxes.find((b) => b.id === box.boxId)
          if (baseBox) {
            completedByType[baseBox.type]++

            if (baseBox.type === 'workout') {
              totalWorkoutTime += box.duration
              totalWorkoutSessions++

              // 計算重訓量：從 box.data 或 baseBox 獲取資料
              if (box.data) {
                const workoutData = box.data as WorkoutData
                // 如果有儲存的總量，使用它
                if (workoutData.totalVolume) {
                  totalWorkoutVolume += workoutData.totalVolume
                } else if (workoutData.setsCompleted && baseBox.weight && baseBox.reps) {
                  // 否則根據完成組數計算
                  const completedSets = workoutData.setsCompleted.filter(Boolean).length
                  totalWorkoutVolume += completedSets * baseBox.weight * baseBox.reps
                }
              } else if (baseBox.weight && baseBox.reps && baseBox.sets) {
                // 如果沒有 workout data，假設全部完成
                totalWorkoutVolume += baseBox.weight * baseBox.reps * baseBox.sets
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

      getWorkoutTrends: (weeks) => {
        const { weekRecords } = get()
        return weekRecords
          .slice(-weeks)
          .map((record) => ({
            week: `${record.weekStart.getMonth() + 1}/${record.weekStart.getDate()}`,
            volume: record.statistics.totalWorkoutVolume || 0,
            sessions: record.statistics.totalWorkoutSessions || 0,
            completionRate: record.statistics.completionRate,
          }))
      },

      // 初始化
      initializeCurrentWeek: (weekStart) => {
        const weekEnd = getWeekEnd(weekStart)
        const newWeek: WeekRecord = {
          id: generateId(),
          userId: 'current-user', // TODO: 實際用戶ID
          weekStart: getWeekStart(weekStart),
          weekEnd,
          archived: false,
          scheduledBoxes: [],
          statistics: {
            completionRate: 0,
            completedCount: 0,
            totalCount: 0,
          },
        }

        set({
          currentWeek: newWeek,
          scheduledBoxes: [],
        })
      },
    }),
    {
      name: 'timebox-storage',
      version: 1,
    }
  )
)