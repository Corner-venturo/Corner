import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface HomeSettingsState {
  // 選中的小工具 ID
  selectedWidgets: string[];
  // 選中的統計資料 ID
  selectedStats: string[];

  // 更新小工具設定
  setSelectedWidgets: (widgets: string[]) => void;
  // 更新統計資料設定
  setSelectedStats: (stats: string[]) => void;
  // 同時更新兩者
  updateSettings: (widgets: string[], stats: string[]) => void;
}

/**
 * 首頁設定 Store
 * - 儲存使用者選擇的小工具和統計資料
 * - 使用 localStorage 持久化
 */
export const useHomeSettingsStore = create<HomeSettingsState>()(
  persist(
    (set) => ({
      // 預設顯示所有小工具
      selectedWidgets: ['calculator', 'currency'],
      // 預設顯示所有統計資料
      selectedStats: ['tours', 'orders', 'customers', 'todos', 'revenue', 'payments'],

      setSelectedWidgets: (widgets) => set({ selectedWidgets: widgets }),

      setSelectedStats: (stats) => set({ selectedStats: stats }),

      updateSettings: (widgets, stats) =>
        set({ selectedWidgets: widgets, selectedStats: stats }),
    }),
    {
      name: 'home-settings-storage',
    }
  )
);
