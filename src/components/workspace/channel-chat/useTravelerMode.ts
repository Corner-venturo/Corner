'use client'

import { useState, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import { logger } from '@/lib/utils/logger'

export type ChatMode = 'internal' | 'traveler'
export type TravelerConversationType = 'tour_announcement' | 'tour_support'

interface TourConversation {
  id: string
  type: TravelerConversationType
  name: string
  tour_id: string
  is_open: boolean
  open_at: string | null
  unread_count?: number
  last_message?: {
    content: string
    created_at: string
    sender_name?: string
  }
}

interface TravelerMessage {
  id: string
  sender_id: string
  type: string
  content: string
  attachments: unknown[] | null
  reply_to_id: string | null
  reactions: Record<string, string[]> | null
  metadata: Record<string, unknown> | null
  created_at: string
  edited_at: string | null
  deleted_at: string | null
}

interface ConversationData {
  conversation: {
    id: string
    type: TravelerConversationType
    name: string
    tour_id: string
    is_open: boolean
    tours?: {
      id: string
      tour_code: string
      name: string
      departure_date: string
    }
  }
  messages: TravelerMessage[]
  members: unknown[]
  travelers: Array<{ id: string; name: string; avatar_url?: string }>
  employees: Array<{ id: string; display_name: string; avatar_url?: string }>
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useTravelerMode(tourId: string | null) {
  const [mode, setMode] = useState<ChatMode>('internal')
  const [activeConversationType, setActiveConversationType] = useState<TravelerConversationType>('tour_announcement')
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  // 取得所有團對話列表
  const { data: conversationsData, error: conversationsError, mutate: refreshConversations } = useSWR(
    mode === 'traveler' ? '/api/traveler-chat' : null,
    fetcher,
    { refreshInterval: 30000 } // 30 秒輪詢
  )

  // 過濾出該 tour 的對話
  const tourConversations = (conversationsData?.conversations || []).filter(
    (conv: TourConversation) => conv.tour_id === tourId
  )

  const announcementConversation = tourConversations.find(
    (conv: TourConversation) => conv.type === 'tour_announcement'
  )
  const supportConversation = tourConversations.find(
    (conv: TourConversation) => conv.type === 'tour_support'
  )

  // 根據選擇的類型確定當前對話 ID
  useEffect(() => {
    if (mode === 'traveler' && tourId) {
      const targetConv = activeConversationType === 'tour_announcement'
        ? announcementConversation
        : supportConversation
      setSelectedConversationId(targetConv?.id || null)
    } else {
      setSelectedConversationId(null)
    }
  }, [mode, tourId, activeConversationType, announcementConversation, supportConversation])

  // 取得選中對話的訊息
  const { data: conversationData, error: messagesError, mutate: refreshMessages } = useSWR<ConversationData>(
    selectedConversationId ? `/api/traveler-chat/${selectedConversationId}` : null,
    fetcher,
    { refreshInterval: 5000 } // 5 秒輪詢訊息
  )

  // 發送訊息
  const sendMessage = useCallback(async (content: string) => {
    if (!selectedConversationId) {
      logger.error('No conversation selected')
      return { success: false, error: 'No conversation selected' }
    }

    try {
      const response = await fetch('/api/traveler-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          conversationId: selectedConversationId,
          content,
          type: 'text',
        }),
      })

      const result = await response.json()

      if (result.success) {
        // 刷新訊息列表
        refreshMessages()
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      logger.error('Error sending traveler message:', error)
      return { success: false, error: 'Failed to send message' }
    }
  }, [selectedConversationId, refreshMessages])

  // 開啟/關閉團對話
  const toggleConversation = useCallback(async (isOpen: boolean) => {
    if (!tourId) return { success: false, error: 'No tour selected' }

    try {
      const response = await fetch('/api/traveler-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle',
          tourId,
          isOpen,
          sendWelcome: true,
        }),
      })

      const result = await response.json()

      if (result.success) {
        refreshConversations()
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      logger.error('Error toggling conversation:', error)
      return { success: false, error: 'Failed to toggle conversation' }
    }
  }, [tourId, refreshConversations])

  // 計算未讀數
  const totalUnreadCount = (announcementConversation?.unread_count || 0) + (supportConversation?.unread_count || 0)

  return {
    // 模式狀態
    mode,
    setMode,

    // 對話類型切換
    activeConversationType,
    setActiveConversationType,

    // 對話資料
    tourConversations,
    announcementConversation,
    supportConversation,
    selectedConversationId,

    // 訊息資料
    messages: conversationData?.messages || [],
    travelers: conversationData?.travelers || [],
    employees: conversationData?.employees || [],
    conversation: conversationData?.conversation,

    // 未讀數
    totalUnreadCount,

    // 操作
    sendMessage,
    toggleConversation,
    refreshMessages,
    refreshConversations,

    // 載入狀態
    isLoading: mode === 'traveler' && !conversationsData && !conversationsError,
    isMessagesLoading: !!selectedConversationId && !conversationData && !messagesError,
    error: conversationsError || messagesError,
  }
}
