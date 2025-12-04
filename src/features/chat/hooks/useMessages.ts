'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
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

    // 1. Fetch initial messages
    const fetchInitialMessages = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            author:employees ( id, display_name )
          `)
          .eq('channel_id', channelId)
          .order('created_at', { ascending: true })

        if (error) throw error

        setMessages(data as Message[] || [])
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
          // The payload doesn't contain the author's name, so we fetch it.
          // This is a simplification; a more optimized approach might use a DB function.
          const { data: author, error } = await supabase
            .from('employees')
            .select('id, display_name')
            .eq('id', payload.new.author_id)
            .single()
            
          if (error) {
            logger.error("Failed to fetch author for new message:", error)
          }

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
