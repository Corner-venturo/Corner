/**
 * Channel Realtime 訂閱 Hook
 * 自動管理 channels 的 Realtime 訂閱生命週期
 * 使用 createRealtimeHook 工廠函數創建
 */

'use client'

import { createRealtimeHook } from '@/lib/realtime/createRealtimeHook'
import { useChannelStore } from '@/stores/workspace/channel-store'
import { IndexedDBAdapter } from '@/stores/adapters/indexeddb-adapter'
import type { Channel } from '@/stores/workspace/types'

// @ts-expect-error - Type compatibility with createRealtimeHook
const channelIndexedDB = new IndexedDBAdapter<Channel>('channels')

/**
 * Channels Realtime Hook
 * 使用時機：進入工作空間頁面
 *
 * 會自動：
 * 1. 在組件掛載時訂閱 channels 表格
 * 2. 在組件卸載時取消訂閱
 * 3. 即時同步所有 channel 變更（新增/修改/刪除）
 *
 * @example
 * ```tsx
 * function Workspace() {
 *   useChannelsRealtime();
 *
 *   const { items: channels } = useChannelStore();
 *   // channels 會自動即時更新
 * }
 * ```
 */
export const useChannelsRealtime = createRealtimeHook<Channel>({
  tableName: 'channels',
  indexedDB: channelIndexedDB,
  store: useChannelStore as any,
})
