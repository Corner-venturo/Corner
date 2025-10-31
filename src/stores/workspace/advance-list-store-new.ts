/**
 * Advance List Store (使用 createStore)
 * 管理 advance_lists 表格資料
 * 自動繼承離線優先、Realtime 同步等功能
 */

import { createStore } from '../core/create-store-new'
import type { AdvanceList } from './types'
import type { BaseEntity } from '@/types'

/**
 * Advance List 擴展型別（符合 BaseEntity）
 */
type AdvanceListEntity = AdvanceList & Pick<BaseEntity, 'updated_at'>

/**
 * Advance List Store
 * 表格: advance_lists
 * 快取策略: 時間範圍快取 (最近 3 個月)
 *
 * 原因：
 * - 墊款清單會隨時間累積
 * - 通常只需要查看最近的墊款
 * - 歷史墊款可以按需載入
 */
export const useAdvanceListStore = createStore<AdvanceListEntity>('advance_lists', {
  cacheStrategy: 'time_range',
  cacheConfig: {
    months: 3,
  },
  enableRealtime: true,
})

/**
 * Hook 型別（方便使用）
 */
export type AdvanceListStoreType = ReturnType<typeof useAdvanceListStore>
