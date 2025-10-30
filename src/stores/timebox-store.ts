/**
 * Timebox Store - 整合 Supabase 版本
 * 使用 Offline-First 架構：Supabase（雲端）+ IndexedDB（快取）
 */

import { create } from 'zustand';
import { BaseEntity } from '@/types';
import { TABLES } from '@/lib/db/schemas';
import { createStore } from './core/create-store-new';
import { generateUUID } from '@/lib/utils/uuid';

const generateId = () => generateUUID();

// ============================================
// 型別定義
// ============================================

// 基礎箱子類型
export interface BaseBox extends BaseEntity {
  name: string;
  color: string;
  type: 'workout' | 'reminder' | 'basic';
  user_id: string;
}

// 單個重訓動作
export interface WorkoutExercise {
  id: string;
  equipment: string; // 器材/動作名稱
  weight: number;    // 重量 (kg)
  reps: number;      // 次數
  sets: number;      // 組數
  setsCompleted: boolean[]; // 每組的完成狀態
  completedSetsTime: (string | null)[]; // 每組完成的時間（ISO string）
}

// 重訓資料
export interface WorkoutData {
  exercises: WorkoutExercise[]; // 多個動作
  totalVolume?: number;     // 總訓練量
}

// 提醒資料
export interface ReminderData {
  text: string;
  lastUpdated: string; // ISO string
}

// 排程箱子實例
export interface ScheduledBox extends BaseEntity {
  box_id: string;
  week_id: string;
  day_of_week: number; // 0-6
  start_time: string; // "HH:mm"
  duration: number; // 分鐘數
  completed: boolean;
  completed_at?: string; // ISO string
  data?: WorkoutData | ReminderData;
}

// 週記錄
export interface WeekRecord extends BaseEntity {
  user_id: string;
  week_start: string; // ISO date string
  week_end: string; // ISO date string
  name?: string;
  archived: boolean;
  review_notes?: string;
  review_created_at?: string; // ISO string
}

// 統計資料
export interface WeekStatistics {
  completionRate: number;
  totalWorkoutTime: number;
  completedByType: {
    workout: number;
    reminder: number;
    basic: number;
  };
  totalWorkoutVolume?: number;
  totalWorkoutSessions?: number;
}

// 趨勢資料
export interface WorkoutTrend {
  week: string;
  volume: number;
  sessions: number;
  completionRate: number;
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
];

// ============================================
// 基礎 Stores（使用 createStore）
// ============================================

// 箱子 Store
export const useBoxesStore = createStore<BaseBox>(
  TABLES.TIMEBOX_BOXES,
  undefined,
  true // enableSupabase
);

// 週記錄 Store
export const useWeeksStore = createStore<WeekRecord>(
  TABLES.TIMEBOX_WEEKS,
  undefined,
  true // enableSupabase
);

// 排程箱子 Store
export const useScheduledBoxesStore = createStore<ScheduledBox>(
  TABLES.TIMEBOX_SCHEDULED_BOXES,
  undefined,
  true // enableSupabase
);

// ============================================
// 組合 Store（高階 API）
// ============================================

interface TimeboxState {
  // 當前週記錄
  currentWeekId: string | null;
  setCurrentWeekId: (weekId: string | null) => void;

  // 初始化當前週
  initializeCurrentWeek: (weekStart: Date, userId: string) => Promise<void>;

  // 獲取當前週的排程箱子
  getCurrentWeekScheduledBoxes: () => ScheduledBox[];

  // 獲取週統計
  getWeekStatistics: (weekId: string) => Promise<WeekStatistics>;

  // 獲取訓練趨勢
  getWorkoutTrends: (weeks: number, userId: string) => Promise<WorkoutTrend[]>;
}

// 輔助函數
const getWeekStart = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getWeekEnd = (date: Date) => {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

// 組合 Store
export const useTimeboxStore = create<TimeboxState>((set, get) => ({
  currentWeekId: null,

  setCurrentWeekId: (weekId) => set({ currentWeekId: weekId }),

  initializeCurrentWeek: async (weekStart, userId) => {
    const start = getWeekStart(weekStart);
    const end = getWeekEnd(weekStart);

    // 檢查是否已存在該週記錄
    const weeks = useWeeksStore.getState().items;
    const existingWeek = weeks.find(
      w => w.week_start === start.toISOString().split('T')[0] && w.user_id === userId
    );

    if (existingWeek) {
      set({ currentWeekId: existingWeek.id });
      return;
    }

    // 創建新週記錄
    const newWeek: Omit<WeekRecord, 'id' | 'created_at' | 'updated_at' | 'is_active' | 'sync_status'> = {
      user_id: userId,
      week_start: start.toISOString().split('T')[0],
      week_end: end.toISOString().split('T')[0],
      archived: false,
    };

    const createdWeek = await useWeeksStore.getState().create(newWeek as any);
    if (createdWeek) {
      set({ currentWeekId: createdWeek.id });
    }
  },

  getCurrentWeekScheduledBoxes: () => {
    const { currentWeekId } = get();
    if (!currentWeekId) return [];

    const scheduledBoxes = useScheduledBoxesStore.getState().items;
    return scheduledBoxes.filter(sb => sb.week_id === currentWeekId);
  },

  getWeekStatistics: async (weekId) => {
    const scheduledBoxes = useScheduledBoxesStore.getState().items.filter(
      sb => sb.week_id === weekId
    );
    const boxes = useBoxesStore.getState().items;

    const totalBoxes = scheduledBoxes.length;
    const completedBoxes = scheduledBoxes.filter(sb => sb.completed);

    const completedByType = {
      workout: 0,
      reminder: 0,
      basic: 0,
    };

    let totalWorkoutTime = 0;
    let totalWorkoutVolume = 0;
    let totalWorkoutSessions = 0;

    scheduledBoxes.forEach(sb => {
      if (sb.completed) {
        const box = boxes.find(b => b.id === sb.box_id);
        if (box) {
          completedByType[box.type]++;
          totalWorkoutTime += sb.duration;

          if (box.type === 'workout' && sb.data) {
            const workoutData = sb.data as WorkoutData;
            if (workoutData.totalVolume) {
              totalWorkoutVolume += workoutData.totalVolume;
            }
            totalWorkoutSessions++;
          }
        }
      }
    });

    return {
      completionRate: totalBoxes > 0 ? completedBoxes.length / totalBoxes : 0,
      totalWorkoutTime,
      completedByType,
      totalWorkoutVolume,
      totalWorkoutSessions,
    };
  },

  getWorkoutTrends: async (weeks, userId) => {
    const weekRecords = useWeeksStore.getState().items
      .filter(w => w.user_id === userId && !w.archived)
      .sort((a, b) => new Date(a.week_start).getTime() - new Date(b.week_start).getTime())
      .slice(-weeks);

    const trends: WorkoutTrend[] = [];

    for (const record of weekRecords) {
      const stats = await get().getWeekStatistics(record.id);
      const weekStart = new Date(record.week_start);

      trends.push({
        week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
        volume: stats.totalWorkoutVolume || 0,
        sessions: stats.totalWorkoutSessions || 0,
        completionRate: stats.completionRate,
      });
    }

    return trends;
  },
}));

// ============================================
// Helper Functions
// ============================================

export const timeboxHelpers = {
  /**
   * 創建箱子並返回 ID
   */
  createBox: async (boxData: Omit<BaseBox, 'id' | 'created_at' | 'updated_at' | 'is_active' | 'sync_status'>) => {
    return await useBoxesStore.getState().create(boxData as any);
  },

  /**
   * 添加排程箱子
   */
  addScheduledBox: async (data: Omit<ScheduledBox, 'id' | 'created_at' | 'updated_at' | 'is_active' | 'sync_status'>) => {
    return await useScheduledBoxesStore.getState().create(data as any);
  },

  /**
   * 切換箱子完成狀態
   */
  toggleBoxCompletion: async (scheduledBoxId: string) => {
    const box = useScheduledBoxesStore.getState().items.find(b => b.id === scheduledBoxId);
    if (!box) return;

    await useScheduledBoxesStore.getState().update(scheduledBoxId, {
      completed: !box.completed,
      completed_at: !box.completed ? new Date().toISOString() : undefined,
    } as any);
  },

  /**
   * 更新重訓資料
   */
  updateWorkoutData: async (scheduledBoxId: string, data: WorkoutData) => {
    await useScheduledBoxesStore.getState().update(scheduledBoxId, {
      data: data as any,
    } as any);
  },

  /**
   * 歸檔當前週
   */
  archiveWeek: async (weekId: string, name: string) => {
    await useWeeksStore.getState().update(weekId, {
      archived: true,
      name,
    } as any);
  },

  /**
   * 複製週記錄到下一週
   */
  copyToNextWeek: async (weekId: string, userId: string) => {
    const sourceWeek = useWeeksStore.getState().items.find(w => w.id === weekId);
    if (!sourceWeek) return;

    const sourceScheduled = useScheduledBoxesStore.getState().items.filter(
      sb => sb.week_id === weekId
    );

    // 創建新週（下週）
    const nextWeekStart = new Date(sourceWeek.week_start);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);

    await useTimeboxStore.getState().initializeCurrentWeek(nextWeekStart, userId);
    const newWeekId = useTimeboxStore.getState().currentWeekId;

    if (!newWeekId) return;

    // 複製排程箱子
    for (const scheduled of sourceScheduled) {
      await timeboxHelpers.addScheduledBox({
        box_id: scheduled.box_id,
        week_id: newWeekId,
        day_of_week: scheduled.day_of_week,
        start_time: scheduled.start_time,
        duration: scheduled.duration,
        completed: false,
      });
    }
  },
};
