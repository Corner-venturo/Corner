/**
 * Personal Canvas Store (使用 createStore)
 * 管理 personal_canvases 表格資料
 * 自動繼承快取優先、Realtime 同步等功能
 */

import { createStore } from '../core/create-store'
import type { PersonalCanvas } from './types'
import type { BaseEntity } from '@/types'

/**
 * Personal Canvas 擴展型別（符合 BaseEntity）
 */
type PersonalCanvasEntity = PersonalCanvas &
  Pick<BaseEntity, 'updated_at'> & {
    created_at: string
    updated_at: string
  }

/**
 * Personal Canvas Store
 * 表格: personal_canvases
 * 快取策略: 全量快取 (數量不多，經常使用)
 *
 * 原因：
 * - 白板畫布數量通常不多
 * - 經常需要快速切換查看
 * - 全量快取提升使用體驗
 */
export const usePersonalCanvasStore = createStore<PersonalCanvasEntity>({
  tableName: 'personal_canvases',
  workspaceScoped: true, // 🔒 2026-01-12: 啟用 Workspace 隔離
})

/**
 * Hook 型別（方便使用）
 */
export type PersonalCanvasStoreType = ReturnType<typeof usePersonalCanvasStore>
