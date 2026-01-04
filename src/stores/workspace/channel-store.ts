/**
 * Channel Store (使用 createStore)
 * 管理 channels 表格資料
 * 自動繼承快取優先、Realtime 同步等功能
 */

import { createStore } from '../core/create-store'
import type { Channel } from './types'
import type { BaseEntity } from '@/types'

/**
 * Channel 擴展型別（符合 BaseEntity）
 */
type ChannelEntity = Channel & Pick<BaseEntity, 'updated_at'>

/**
 * Channel Store
 * 表格: channels
 * 快取策略: 全量快取 (Workspace 核心功能)
 * 注意：channels 不使用 code 欄位
 * 🔒 啟用 Workspace 隔離
 */
export const useChannelStore = createStore<ChannelEntity>({
  tableName: 'channels',
  workspaceScoped: true,
})

/**
 * Hook 型別（方便使用）
 */
export type ChannelStoreType = ReturnType<typeof useChannelStore>
