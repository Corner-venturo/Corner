/**
 * Channel Thread Store (使用 createStore)
 * 管理 channel_threads 表格資料
 * 自動繼承快取優先、Realtime 同步等功能
 */

import { createStore } from '../core/create-store'
import type { BaseEntity } from '@/types'

/**
 * Channel Thread 基礎型別（對應 Supabase 表格）
 */
export interface ChannelThreadBase {
  id: string
  channel_id: string
  name: string
  created_by: string
  is_archived: boolean
  reply_count: number
  last_reply_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Channel Thread Store
 * 表格: channel_threads
 * 快取策略: 按頻道快取
 */
export const useChannelThreadStore = createStore<ChannelThreadBase & BaseEntity>(
  'channel_threads',
  undefined,
  true
)

/**
 * Hook 型別（方便使用）
 */
export type ChannelThreadStoreType = ReturnType<typeof useChannelThreadStore>
