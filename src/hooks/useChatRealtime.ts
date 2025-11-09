/**
 * Chat Realtime 訂閱 Hook
 * 自動管理 messages 的 Realtime 訂閱生命週期
 * 使用 createRealtimeHook 工廠函數創建
 */

'use client'

import { createRealtimeHook } from '@/lib/realtime/createRealtimeHook'
import { useMessageStore } from '@/stores/workspace/message-store'
import { IndexedDBAdapter } from '@/stores/adapters/indexeddb-adapter'
import type { Message } from '@/stores/workspace/types'
import type { BaseEntity } from '@/types'

// Message Entity 型別（與 message-store.ts 一致）
type MessageEntity = Omit<Message, 'edited_at'> &
  Pick<BaseEntity, 'updated_at'> & {
    edited_at?: string
  }

/**
 * Messages Realtime Hook
 * 使用時機：進入頻道聊天頁面
 *
 * 會自動：
 * 1. 在組件掛載時訂閱 messages 表格
 * 2. 在組件卸載時取消訂閱
 * 3. 即時同步所有 message 變更（新增/修改/刪除）
 *
 * @example
 * ```tsx
 * function ChannelChat({ channelId }) {
 *   useChatRealtime();
 *
 *   const { items: messages } = useMessageStore();
 *   const channelMessages = messages.filter(m => m.channel_id === channelId);
 *   // messages 會自動即時更新
 * }
 * ```
 */
export const useChatRealtime = createRealtimeHook<MessageEntity>({
  tableName: 'messages',
  indexedDB: new IndexedDBAdapter<MessageEntity>('messages'),
  store: useMessageStore,
})
