import { useState, useCallback, useMemo } from 'react'
import type { Message } from '@/stores/workspace/types'

/**
 * Slack 風格討論串狀態管理
 * - 點擊訊息的「回覆」按鈕，開啟右側討論串面板
 * - 討論串面板顯示父訊息 + 所有回覆
 * - parent_message_id 指向被回覆的訊息
 */
export function useThreadState(allMessages: Message[]) {
  // 當前開啟的討論串（父訊息）
  const [activeThreadMessage, setActiveThreadMessage] = useState<Message | null>(null)

  // 開啟討論串面板
  const openThread = useCallback((parentMessage: Message) => {
    setActiveThreadMessage(parentMessage)
  }, [])

  // 關閉討論串面板
  const closeThread = useCallback(() => {
    setActiveThreadMessage(null)
  }, [])

  // 取得討論串中的回覆訊息
  const threadReplies = useMemo(() => {
    if (!activeThreadMessage) return []
    return allMessages
      .filter(m => m.parent_message_id === activeThreadMessage.id && !m._deleted)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }, [allMessages, activeThreadMessage])

  // 主頻道顯示的訊息（只顯示沒有 parent_message_id 的主訊息）
  const mainChannelMessages = useMemo(() => {
    return allMessages
      .filter(m => !m.parent_message_id && !m._deleted)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }, [allMessages])

  // 取得特定訊息的回覆數量（用於 UI 顯示「X 則回覆」）
  const getReplyCount = useCallback((messageId: string): number => {
    // 優先使用 reply_count 欄位（資料庫觸發器維護）
    const message = allMessages.find(m => m.id === messageId)
    if (message?.reply_count !== undefined) {
      return message.reply_count
    }
    // 備用：手動計算
    return allMessages.filter(m => m.parent_message_id === messageId && !m._deleted).length
  }, [allMessages])

  // 取得特定訊息的最後回覆時間
  const getLastReplyAt = useCallback((messageId: string): string | null => {
    const message = allMessages.find(m => m.id === messageId)
    return message?.last_reply_at || null
  }, [allMessages])

  // 取得特定訊息的回覆者（用於顯示頭像）
  const getReplyUsers = useCallback((messageId: string): string[] => {
    const replies = allMessages
      .filter(m => m.parent_message_id === messageId && !m._deleted)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // 取得最近 3 位不重複的回覆者
    const uniqueUsers: string[] = []
    for (const reply of replies) {
      if (!uniqueUsers.includes(reply.author_id) && uniqueUsers.length < 3) {
        uniqueUsers.push(reply.author_id)
      }
    }
    return uniqueUsers
  }, [allMessages])

  return {
    // 討論串面板狀態
    activeThreadMessage,
    threadReplies,
    isThreadPanelOpen: !!activeThreadMessage,

    // 主頻道訊息
    mainChannelMessages,

    // 操作
    openThread,
    closeThread,

    // 工具函數
    getReplyCount,
    getLastReplyAt,
    getReplyUsers,
  }
}
