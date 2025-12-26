/**
 * Chat Store Facade
 * 整合 Message Store (createStore)，提供統一接口
 * 保持與舊版 chat-store 相同的 API
 */

import { logger } from '@/lib/utils/logger'
import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/lib/supabase/client'
import { useMessageStore } from './message-store'
import type { Message } from './types'
import { ensureMessageAttachments, normalizeMessage } from './utils'
import type { Json } from '@/lib/supabase/types'

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
    .filter(m => m.channel_id === channelId && (includeDeleted || !m._deleted))
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
    // 訊息載入 (只載入當前頻道的訊息，不載入所有訊息)
    // ============================================
    loadMessages: async (channelId: string) => {
      uiStore.setCurrentChannelId(channelId)
      uiStore.setMessagesLoading(channelId, true)

      try {
        // 🔥 效能優化：使用 Supabase 查詢只載入當前頻道的訊息
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('channel_id', channelId)
          .order('created_at', { ascending: true })

        if (error) throw error

        // 更新 store 中該頻道的訊息（不影響其他頻道）
        const channelMessages = (data || []) as unknown as Message[]
        uiStore.setCurrentChannelMessages(channelId, channelMessages)
        uiStore.setMessagesLoading(channelId, false)
      } catch (error) {
        logger.error('Failed to load messages:', error)
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
        // 保留 parent_message_id（討論串回覆用）
        parent_message_id: message.parent_message_id || null,
      }

      // 🔥 樂觀更新：先更新 UI
      const currentMessages = uiStore.channelMessages[newMessage.channel_id] || []
      const optimisticMessages = [...currentMessages, newMessage]
      uiStore.setCurrentChannelMessages(newMessage.channel_id, optimisticMessages)

      try {
        // 直接寫入 Supabase（不透過 messageStore 避免重複更新）
        const { error } = await supabase
          .from('messages')
          .insert({
            id: newMessage.id,
            channel_id: newMessage.channel_id,
            author_id: newMessage.author_id,
            content: newMessage.content,
            author: newMessage.author as unknown as Json,
            attachments: newMessage.attachments as unknown as Json,
            reactions: newMessage.reactions as unknown as Json,
            parent_message_id: newMessage.parent_message_id,
            created_at: newMessage.created_at,
          })

        if (error) {
          // 回滾樂觀更新
          logger.error('sendMessage 失敗:', error)
          uiStore.setCurrentChannelMessages(newMessage.channel_id, currentMessages)
          throw error
        }

        logger.log('✅ 訊息發送成功:', newMessage.id)
      } catch (error) {
        // 回滾樂觀更新
        logger.error('sendMessage 例外:', error)
        uiStore.setCurrentChannelMessages(newMessage.channel_id, currentMessages)
        throw error
      }
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
        // 保留 parent_message_id（討論串回覆用）
        parent_message_id: message.parent_message_id || null,
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
      // 🔥 先找到訊息，取得 channel_id 和附件路徑
      // 從所有頻道的訊息中找
      let message: Message | undefined
      let channelId: string | null = null

      for (const [cId, messages] of Object.entries(uiStore.channelMessages)) {
        const found = messages.find(m => m.id === messageId)
        if (found) {
          message = found
          channelId = cId
          break
        }
      }

      // 也檢查 currentChannelId 作為備選
      if (!channelId) {
        channelId = uiStore.currentChannelId
      }

      const currentMessages = channelId ? (uiStore.channelMessages[channelId] || []) : []

      logger.log('🗑️ 準備刪除訊息:', { messageId, channelId, found: !!message })

      // 🔥 樂觀更新：先從 UI 移除
      if (channelId) {
        const filteredMessages = currentMessages.filter(m => m.id !== messageId)
        uiStore.setCurrentChannelMessages(channelId, filteredMessages)
        logger.log('✅ UI 已更新，剩餘訊息數:', filteredMessages.length)
      }

      try {
        // 刪除 Storage 上的附件檔案
        if (message?.attachments && message.attachments.length > 0) {
          const paths = message.attachments
            .map(att => att.path)
            .filter((path): path is string => !!path)

          if (paths.length > 0) {
            const { error } = await supabase.storage
              .from('workspace-files')
              .remove(paths)

            if (error) {
              logger.warn('刪除附件檔案失敗:', error)
            } else {
              logger.log(`✅ 已刪除 ${paths.length} 個附件檔案`)
            }
          }
        }

        // 直接從 Supabase 刪除
        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('id', messageId)

        if (error) {
          // 回滾樂觀更新
          logger.error('deleteMessage 失敗:', error)
          if (channelId) {
            uiStore.setCurrentChannelMessages(channelId, currentMessages)
          }
          throw error
        }

        logger.log('✅ 訊息刪除成功:', messageId)
      } catch (error) {
        // 回滾樂觀更新
        logger.error('deleteMessage 例外:', error)
        if (channelId) {
          uiStore.setCurrentChannelMessages(channelId, currentMessages)
        }
        throw error
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
    // Realtime Subscription
    // ============================================
    subscribeToMessages: () => {
      // Placeholder: Realtime subscription could be added here if needed
      // For now, the store uses SWR for data fetching
    },

    unsubscribeFromMessages: () => {
      // Placeholder: Realtime unsubscription could be added here if needed
    },
  }
}

/**
 * Hook 型別（方便使用）
 */
export type ChatStoreType = ReturnType<typeof useChatStore>
