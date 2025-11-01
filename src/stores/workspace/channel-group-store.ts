/**
 * Channel Group Store (使用 createStore)
 * 管理 channel_groups 表格資料
 * 自動繼承 Realtime 即時同步等功能
 */

import { createStore } from '../core/create-store-new'
import type { ChannelGroup } from './types'
import type { BaseEntity } from '@/types'

/**
 * Channel Group 擴展型別（符合 BaseEntity）
 */
type ChannelGroupEntity = Omit<ChannelGroup, 'created_at' | 'updated_at'> & BaseEntity

/**
 * Channel Group Store
 * 表格: channel_groups
 * 快取策略: 全量快取 (數量少，經常使用)
 */
export const useChannelGroupStore = createStore<ChannelGroupEntity>('channel_groups', {
  cacheStrategy: 'full',
  enableRealtime: true,
})

/**
 * Hook 型別（方便使用）
 */
export type ChannelGroupStoreType = ReturnType<typeof useChannelGroupStore>
