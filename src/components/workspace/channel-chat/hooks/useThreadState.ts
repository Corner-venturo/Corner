import { useState, useEffect, useMemo, useCallback } from 'react'
import { useChannelThreadStore } from '@/stores/workspace/channel-thread-store'
import { useAuthStore } from '@/stores/auth-store'
import type { ChannelThread, Message } from '@/stores/workspace/types'

/**
 * 管理討論串狀態
 */
export function useThreadState(channelId: string | null) {
  const { user } = useAuthStore()
  const threadStore = useChannelThreadStore()
  const [selectedThread, setSelectedThread] = useState<ChannelThread | null>(null)
  const [isThreadsLoading, setIsThreadsLoading] = useState(false)

  // 取得頻道的討論串
  const threads = useMemo(() => {
    if (!channelId) return []
    return threadStore.items
      .filter(t => t.channel_id === channelId && !t._deleted)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [channelId, threadStore.items])

  // 載入討論串
  useEffect(() => {
    if (!channelId) return

    const loadThreads = async () => {
      setIsThreadsLoading(true)
      try {
        await threadStore.fetchAll({ channel_id: channelId })
      } finally {
        setIsThreadsLoading(false)
      }
    }

    loadThreads()
  }, [channelId])

  // 切換頻道時清除選中的討論串
  useEffect(() => {
    setSelectedThread(null)
  }, [channelId])

  // 建立討論串
  const createThread = useCallback(async (name: string) => {
    if (!channelId || !user?.id) return null

    const newThread = await threadStore.create({
      channel_id: channelId,
      name,
      created_by: user.id,
      is_archived: false,
      reply_count: 0,
      last_reply_at: null,
    })

    if (newThread) {
      setSelectedThread(newThread as ChannelThread)
    }

    return newThread
  }, [channelId, user?.id, threadStore])

  // 刪除討論串
  const deleteThread = useCallback(async (threadId: string) => {
    await threadStore.delete(threadId)
    if (selectedThread?.id === threadId) {
      setSelectedThread(null)
    }
  }, [threadStore, selectedThread])

  // 過濾訊息（根據選中的討論串）
  const filterMessagesByThread = useCallback((messages: Message[]) => {
    if (selectedThread) {
      // 只顯示該討論串的訊息
      return messages.filter(m => m.thread_id === selectedThread.id)
    }
    // 主頻道：只顯示沒有 thread_id 的訊息
    return messages.filter(m => !m.thread_id)
  }, [selectedThread])

  return {
    threads,
    selectedThread,
    setSelectedThread,
    isThreadsLoading,
    createThread,
    deleteThread,
    filterMessagesByThread,
  }
}
