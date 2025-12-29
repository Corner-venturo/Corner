'use client'

import { useState, useCallback, useMemo } from 'react'
import useSWR from 'swr'
import { logger } from '@/lib/utils/logger'
import type {
  TourConversation,
  TourGroup,
  ConversationDetail,
} from '../types'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

/**
 * 旅伴通訊中心 Hook
 */
export function useTravelerChat() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  // 取得對話列表
  const {
    data: conversationsData,
    error: conversationsError,
    isLoading: isLoadingConversations,
    mutate: mutateConversations,
  } = useSWR<{ conversations: TourConversation[] }>('/api/traveler-chat', fetcher, {
    refreshInterval: 30000, // 每 30 秒刷新
  })

  // 取得選中對話的詳情
  const {
    data: conversationDetail,
    error: detailError,
    isLoading: isLoadingDetail,
    mutate: mutateDetail,
  } = useSWR<ConversationDetail>(
    selectedConversationId ? `/api/traveler-chat/${selectedConversationId}` : null,
    fetcher,
    {
      refreshInterval: 5000, // 聊天視窗 5 秒刷新
    }
  )

  // 按團分組
  const tourGroups = useMemo<TourGroup[]>(() => {
    const conversations = conversationsData?.conversations || []
    const groupMap = new Map<string, TourGroup>()

    for (const conv of conversations) {
      if (!groupMap.has(conv.tour_id)) {
        groupMap.set(conv.tour_id, {
          tourId: conv.tour_id,
          tourCode: conv.tour_code,
          tourName: conv.tour_name,
          departureDate: conv.departure_date,
          isOpen: conv.is_open,
          openAt: conv.open_at,
          conversations: [],
          totalUnread: 0,
        })
      }
      const group = groupMap.get(conv.tour_id)!
      group.conversations.push(conv)
      group.totalUnread += conv.unread_count
    }

    // 按出發日期排序
    return Array.from(groupMap.values()).sort((a, b) =>
      new Date(b.departureDate).getTime() - new Date(a.departureDate).getTime()
    )
  }, [conversationsData])

  // 開啟/關閉團對話
  const toggleConversation = useCallback(async (tourId: string, isOpen: boolean) => {
    try {
      const res = await fetch('/api/traveler-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle',
          tourId,
          isOpen,
        }),
      })

      if (!res.ok) throw new Error('Failed to toggle conversation')

      await mutateConversations()
      return true
    } catch (error) {
      logger.error('Error toggling conversation:', error)
      return false
    }
  }, [mutateConversations])

  // 發送訊息
  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    type: 'text' | 'image' | 'file' = 'text',
    attachments: Array<{ type: string; url: string; name?: string }> = []
  ) => {
    setIsSending(true)
    try {
      const res = await fetch('/api/traveler-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          conversationId,
          content,
          type,
          attachments,
        }),
      })

      if (!res.ok) throw new Error('Failed to send message')

      await mutateDetail()
      await mutateConversations()
      return true
    } catch (error) {
      logger.error('Error sending message:', error)
      return false
    } finally {
      setIsSending(false)
    }
  }, [mutateDetail, mutateConversations])

  // 標記已讀
  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      await fetch('/api/traveler-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          conversationId,
        }),
      })
      await mutateConversations()
    } catch (error) {
      logger.error('Error marking as read:', error)
    }
  }, [mutateConversations])

  // 選擇對話
  const selectConversation = useCallback((conversationId: string | null) => {
    setSelectedConversationId(conversationId)
    if (conversationId) {
      markAsRead(conversationId)
    }
  }, [markAsRead])

  return {
    // 資料
    tourGroups,
    conversationDetail,
    selectedConversationId,

    // 狀態
    isLoadingConversations,
    isLoadingDetail,
    isSending,
    error: conversationsError || detailError,

    // 操作
    selectConversation,
    toggleConversation,
    sendMessage,
    markAsRead,
    refresh: mutateConversations,
  }
}
