/**
 * Message Store (使用 createStore)
 * 管理 messages 表格資料
 * 自動繼承快取優先、Realtime 同步等功能
 */

import { createStore } from '../core/create-store'
import type { Message } from './types'
import type { BaseEntity } from '@/types'

/**
 * Message 擴展型別（符合 BaseEntity）
 */
type MessageEntity = Omit<Message, 'edited_at'> &
  Pick<BaseEntity, 'updated_at'> & {
    edited_at?: string
  }

/**
 * Message Store
 * 表格: messages
 * 快取策略: 時間範圍快取 (最近 1000 則訊息)
 *
 * 原因：
 * - 聊天訊息會不斷增長
 * - 通常只需要查看最近的訊息
 * - 歷史訊息可以按需載入
 */
export const useMessageStore = createStore<MessageEntity>({
  tableName: 'messages' as any,
  cacheStrategy: 'time_range',
  cacheConfig: {
    limit: 1000, // 最近 1000 則訊息
    sortBy: 'created_at',
    order: 'desc',
  },
  enableRealtime: true,
} as any)

/**
 * Hook 型別（方便使用）
 */
export type MessageStoreType = ReturnType<typeof useMessageStore>
