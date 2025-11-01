/**
 * Chat Store Facade
 * 整合 Message Store (createStore)，提供統一接口
 * 保持與舊版 chat-store 相同的 API
 */

import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/lib/supabase/client'
import { useMessageStore } from './message-store'
import type { Message } from './types'
import { ensureMessageAttachments, normalizeMessage } from './utils'

/**
 * Chat UI 狀態 (不需要同步到 Supabase 的狀態)
 */
interface ChatUIState {
  // 按 channel 分組的訊息 (從 MessageStore 過濾而來)
  channelMessages: Record<string, Message[]>
  messagesLoading: Record<string, boolean>
  currentChannelId: string | null

  // Internal state management
  setCurrentChannelMessages: (channelId: string, messages: Message[]) => void
  setMessagesLoading: (channelId: string, loading: boolean) => void
  setCurrentChannelId: (channelId: string | null) => void
  clearMessages: () => void
}

/**
 * UI 狀態 Store (純前端狀態)
 */
const useChatUIStore = create<ChatUIState>(set => ({
  channelMessages: {},
  messagesLoading: {},
  currentChannelId: null,

  setCurrentChannelMessages: (channelId, messages) => {
    set(state => ({
      channelMessages: {
        ...state.channelMessages,
        [channelId]: messages,
      },
    }))
  },

  setMessagesLoading: (channelId, loading) => {
    set(state => ({
      messagesLoading: {
        ...state.messagesLoading,
        [channelId]: loading,
      },
    }))
  },

  setCurrentChannelId: channelId => {
    set({ currentChannelId: channelId })
  },

  clearMessages: () => {
    set({ channelMessages: {}, currentChannelId: null })
  },
}))

// ============================================
// 訊息過濾+排序緩存（效能優化）
// ============================================
let cachedChannelId: string | null = null
let cachedMessages: Message[] = []
let cachedAllMessagesLength = 0

/**
 * 獲取指定頻道的訊息（帶緩存）
 * 只在 channelId 或訊息數量變化時重新計算
 */
function getChannelMessages(
  allMessages: Message[],
  channelId: string,
  includeDeleted: boolean = false
): Message[] {
  // 緩存檢查：channelId 和訊息數量都沒變 → 返回緩存
  if (
    cachedChannelId === channelId &&
    cachedAllMessagesLength === allMessages.length &&
    cachedMessages.length > 0
  ) {
    return cachedMessages
  }

  // 過濾 + 排序（只在必要時執行）
  cachedMessages = allMessages
    .filter(m =>
      m.channel_id === channelId &&
      (includeDeleted || !m._deleted)
    )
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  cachedChannelId = channelId
  cachedAllMessagesLength = allMessages.length

  return cachedMessages
}

/**
 * Chat Store Facade
 * 整合 Message Store (createStore)
 * 保持與舊版相同的 API
 */
export const useChatStore = () => {
  const messageStore = useMessageStore()
  const uiStore = useChatUIStore()

  return {
    // ============================================
    // 資料 (來自 MessageStore)
    // ============================================
    messages: messageStore.items,
    channelMessages: uiStore.channelMessages,
    messagesLoading: uiStore.messagesLoading,
    currentChannelId: uiStore.currentChannelId,

    // ============================================
    // Loading 和 Error
    // ============================================
    loading: messageStore.loading,
    error: messageStore.error,

    // ============================================
    // 訊息載入 (使用 createStore 的 fetchAll)
    // ============================================
    loadMessages: async (channelId: string) => {
      uiStore.setCurrentChannelId(channelId)
      uiStore.setMessagesLoading(channelId, true)

      try {
        // 使用 createStore 的 fetchAll（自動處理快取優先）
        await messageStore.fetchAll()

        // 🔥 使用緩存函數（避免重複計算）
        const channelMessages = getChannelMessages(messageStore.items, channelId)

        uiStore.setCurrentChannelMessages(channelId, channelMessages)
        uiStore.setMessagesLoading(channelId, false)
      } catch (error) {
        uiStore.setMessagesLoading(channelId, false)
      }
    },

    // ============================================
    // 訊息操作 (使用 createStore 的 CRUD)
    // ============================================
    sendMessage: async (message: Omit<Message, 'id' | 'created_at' | 'reactions'>) => {
      const attachments = ensureMessageAttachments(message.attachments)

      const newMessage: Message = {
        ...message,
        id: uuidv4(),
        reactions: {},
        created_at: new Date().toISOString(),
        attachments: attachments.length > 0 ? attachments : [],
      }

      // 使用 createStore 的 create 方法（自動處理離線/線上）
      await messageStore.create(newMessage)

      // 🔥 使用緩存函數（避免重複計算）
      const channelMessages = getChannelMessages(messageStore.items, newMessage.channel_id)

      uiStore.setCurrentChannelMessages(newMessage.channel_id, channelMessages)
    },

    addMessage: async (message: Omit<Message, 'id' | 'created_at' | 'reactions'>) => {
      // addMessage 與 sendMessage 相同
      const attachments = ensureMessageAttachments(message.attachments)

      const newMessage: Message = {
        ...message,
        id: uuidv4(),
        reactions: {},
        created_at: new Date().toISOString(),
        attachments: attachments.length > 0 ? attachments : [],
      }

      await messageStore.create(newMessage)

      // 🔥 使用緩存函數（避免重複計算）
      const channelMessages = getChannelMessages(messageStore.items, newMessage.channel_id)

      uiStore.setCurrentChannelMessages(newMessage.channel_id, channelMessages)
    },

    updateMessage: async (messageId: string, updates: Partial<Message>) => {
      await messageStore.update(messageId, updates)

      // 更新 UI 狀態
      if (uiStore.currentChannelId) {
        // 🔥 使用緩存函數（避免重複計算）
        const channelMessages = getChannelMessages(messageStore.items, uiStore.currentChannelId)

        uiStore.setCurrentChannelMessages(uiStore.currentChannelId, channelMessages)
      }
    },

    deleteMessage: async (messageId: string) => {
      await messageStore.delete(messageId)

      // 更新 UI 狀態
      if (uiStore.currentChannelId) {
        // 🔥 使用緩存函數（避免重複計算）
        const channelMessages = getChannelMessages(messageStore.items, uiStore.currentChannelId)

        uiStore.setCurrentChannelMessages(uiStore.currentChannelId, channelMessages)
      }
    },

    softDeleteMessage: async (messageId: string) => {
      // 軟刪除：標記為已刪除而不實際刪除
      await messageStore.update(messageId, { _deleted: true })

      // 更新 UI 狀態（過濾掉已刪除的訊息）
      if (uiStore.currentChannelId) {
        // 🔥 使用緩存函數（避免重複計算）
        const channelMessages = getChannelMessages(messageStore.items, uiStore.currentChannelId)

        uiStore.setCurrentChannelMessages(uiStore.currentChannelId, channelMessages)
      }
    },

    // ============================================
    // 訊息互動
    // ============================================
    togglePinMessage: async (messageId: string) => {
      const message = messageStore.items.find(m => m.id === messageId)
      if (!message) return

      await messageStore.update(messageId, { is_pinned: !message.is_pinned })
    },

    addReaction: async (messageId: string, emoji: string, userId: string) => {
      const message = messageStore.items.find(m => m.id === messageId)
      if (!message) return

      const reactions = { ...message.reactions }
      if (!reactions[emoji]) {
        reactions[emoji] = []
      }
      if (!reactions[emoji].includes(userId)) {
        reactions[emoji].push(userId)
      }

      await messageStore.update(messageId, { reactions })
    },

    updateMessageReactions: async (messageId: string, reactions: Record<string, string[]>) => {
      await messageStore.update(messageId, { reactions })
    },

    // ============================================
    // Internal state management
    // ============================================
    setCurrentChannelMessages: uiStore.setCurrentChannelMessages,
    clearMessages: uiStore.clearMessages,

    // ============================================
    // Realtime 訂閱 (createStore 自動處理)
    // ============================================
    subscribeToMessages: (channelId: string) => {
      // createStore handles subscriptions automatically
    },

    unsubscribeFromMessages: () => {
      // createStore handles unsubscriptions automatically
    },
  }
}

/**
 * Hook 型別（方便使用）
 */
export type ChatStoreType = ReturnType<typeof useChatStore>
