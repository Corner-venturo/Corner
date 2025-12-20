'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { getChannelMessages, getMessageAuthor } from '@/lib/data/messages'
import { logger } from '@/lib/utils/logger'
import type { Message } from '@/stores/workspace/types'

export function useMessages(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    if (!channelId) {
      setMessages([])
      setLoading(false)
      return
    }

    // 1. Fetch initial messages (使用 DAL)
    const fetchInitialMessages = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getChannelMessages({ channelId, limit: 50 })
        setMessages(data as unknown as Message[])
      } catch (err) {
        logger.error('Error fetching initial messages:', err)
        setError('Failed to load messages.')
      } finally {
        setLoading(false)
      }
    }

    fetchInitialMessages()

    // 2. Subscribe to real-time updates
    const channel = supabase
      .channel(`realtime:messages:channel=${channelId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `channel_id=eq.${channelId}`
        },
        async (payload) => {
          // 使用 DAL 獲取作者資訊
          const author = await getMessageAuthor(payload.new.author_id)

          const newMessage = {
            ...payload.new,
            author: author || { id: payload.new.author_id, display_name: 'Unknown User' }
          } as Message
          setMessages(currentMessages => [...currentMessages, newMessage])
        }
      )
      .subscribe()

    // 3. Cleanup subscription on component unmount or channelId change
    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelId, supabase])

  return { messages, loading, error }
}
