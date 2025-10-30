import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const generateId = () => crypto.randomUUID()

// 基礎類型定義
export interface BaseBox {
  id: string
  name: string
  color: string
  type: 'workout' | 'reminder' | 'basic'
  user_id: string
  created_at: Date
  updated_at: Date
  // 重訓專用欄位
  equipment?: string // 器材
  weight?: number    // 重量 (kg)
  reps?: number      // 次數
  sets?: number      // 組數
}

// 單個重訓動作
export interface WorkoutExercise {
  id: string
  equipment: string // 器材/動作名稱
  weight: number    // 重量 (kg)
  reps: number      // 次數
  sets: number      // 組數
  setsCompleted: boolean[] // 每組的完成狀態
  completedSetsTime: (Date | null)[] // 每組完成的時間
}

// 重訓資料 - 支援多個動作
export interface WorkoutData {
  exercises: WorkoutExercise[] // 多個動作
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
  start_time: string // "HH:mm" 格式
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
  user_id: string
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
    created_at: Date
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
  createBox: (box: Omit<BaseBox, 'id' | 'created_at' | 'updated_at'>) => void
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
  addWorkoutExercise: (boxId: string, exercise: Omit<WorkoutExercise, 'id'>) => void
  removeWorkoutExercise: (boxId: string, exerciseId: string) => void
  updateWorkoutExercise: (boxId: string, exerciseId: string, updates: Partial<WorkoutExercise>) => void
  toggleSetCompletion: (boxId: string, exerciseId: string, setIndex: number) => void

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
          created_at: new Date(),
          updated_at: new Date(),
        }
        set((state) => ({
          boxes: [...state.boxes, newBox]
        }))
      },

      updateBox: (id, updates) => {
        set((state) => ({
          boxes: state.boxes.map((box) =>
            box.id === id ? { ...box, ...updates, updated_at: new Date() } : box
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

      addWorkoutExercise: (boxId, exercise) => {
        set((state) => ({
          scheduledBoxes: state.scheduledBoxes.map((box) => {
            if (box.id !== boxId) return box

            const currentData = (box.data as WorkoutData) || { exercises: [] }
            const newExercise: WorkoutExercise = {
              ...exercise,
              id: generateId(),
              setsCompleted: Array(exercise.sets).fill(false),
              completedSetsTime: Array(exercise.sets).fill(null),
            }

            return {
              ...box,
              data: {
                ...currentData,
                exercises: [...currentData.exercises, newExercise]
              }
            }
          })
        }))
      },

      removeWorkoutExercise: (boxId, exerciseId) => {
        set((state) => ({
          scheduledBoxes: state.scheduledBoxes.map((box) => {
            if (box.id !== boxId) return box

            const currentData = box.data as WorkoutData
            if (!currentData) return box

            return {
              ...box,
              data: {
                ...currentData,
                exercises: currentData.exercises.filter(ex => ex.id !== exerciseId)
              }
            }
          })
        }))
      },

      updateWorkoutExercise: (boxId, exerciseId, updates) => {
        set((state) => ({
          scheduledBoxes: state.scheduledBoxes.map((box) => {
            if (box.id !== boxId) return box

            const currentData = box.data as WorkoutData
            if (!currentData) return box

            return {
              ...box,
              data: {
                ...currentData,
                exercises: currentData.exercises.map(ex => {
                  if (ex.id !== exerciseId) return ex

                  // 如果修改了組數，需要調整陣列長度
                  const newSets = updates.sets ?? ex.sets
                  let newSetsCompleted = ex.setsCompleted
                  let newCompletedTime = ex.completedSetsTime

                  if (newSets !== ex.sets) {
                    if (newSets > ex.sets) {
                      // 增加組數，補充 false 和 null
                      newSetsCompleted = [...ex.setsCompleted, ...Array(newSets - ex.sets).fill(false)]
                      newCompletedTime = [...ex.completedSetsTime, ...Array(newSets - ex.sets).fill(null)]
                    } else {
                      // 減少組數，截斷陣列
                      newSetsCompleted = ex.setsCompleted.slice(0, newSets)
                      newCompletedTime = ex.completedSetsTime.slice(0, newSets)
                    }
                  }

                  return {
                    ...ex,
                    ...updates,
                    setsCompleted: newSetsCompleted,
                    completedSetsTime: newCompletedTime
                  }
                })
              }
            }
          })
        }))
      },

      toggleSetCompletion: (boxId, exerciseId, setIndex) => {
        set((state) => ({
          scheduledBoxes: state.scheduledBoxes.map((box) => {
            if (box.id !== boxId) return box

            const currentData = box.data as WorkoutData
            if (!currentData) return box

            return {
              ...box,
              data: {
                ...currentData,
                exercises: currentData.exercises.map(ex => {
                  if (ex.id !== exerciseId) return ex

                  const updatedSetsCompleted = [...ex.setsCompleted]
                  const updatedCompletedTime = [...ex.completedSetsTime]

                  // 切換該組的完成狀態
                  updatedSetsCompleted[setIndex] = !updatedSetsCompleted[setIndex]
                  updatedCompletedTime[setIndex] = updatedSetsCompleted[setIndex] ? new Date() : null

                  return {
                    ...ex,
                    setsCompleted: updatedSetsCompleted,
                    completedSetsTime: updatedCompletedTime
                  }
                })
              }
            }
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
          if (box.data) {
            const workoutData = box.data as WorkoutData
            // 新格式：計算所有動作的訓練量
            if (workoutData.exercises && workoutData.exercises.length > 0) {
              return total + workoutData.exercises.reduce((exerciseTotal, exercise) => {
                const completedSets = exercise.setsCompleted.filter(Boolean).length
                return exerciseTotal + (completedSets * exercise.weight * exercise.reps)
              }, 0)
            }
            // 舊格式相容（已廢棄）
            if (workoutData.totalVolume) {
              return total + workoutData.totalVolume
            }
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

              // 計算重訓量：從 box.data 獲取所有動作的資料
              if (box.data) {
                const workoutData = box.data as WorkoutData
                // 新格式：計算所有動作的訓練量
                if (workoutData.exercises && workoutData.exercises.length > 0) {
                  totalWorkoutVolume += workoutData.exercises.reduce((exerciseTotal, exercise) => {
                    const completedSets = exercise.setsCompleted.filter(Boolean).length
                    return exerciseTotal + (completedSets * exercise.weight * exercise.reps)
                  }, 0)
                }
                // 舊格式相容（已廢棄）
                else if (workoutData.totalVolume) {
                  totalWorkoutVolume += workoutData.totalVolume
                }
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
          user_id: 'current-user', // 注意: 需要實際用戶ID
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