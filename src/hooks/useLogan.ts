/**
 * Logan AI Hook
 * 用於與 Logan 對話
 */

'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'

interface LoganMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface LoganState {
  messages: LoganMessage[]
  isLoading: boolean
  error: string | null
  conversationId: string | null
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useLogan() {
  const [state, setState] = useState<LoganState>({
    messages: [],
    isLoading: false,
    error: null,
    conversationId: null,
  })

  // 檢查 Logan 狀態
  const { data: status } = useSWR('/api/logan/chat', fetcher, {
    refreshInterval: 30000, // 每 30 秒檢查一次
  })

  const isAvailable = status?.available ?? false

  // 發送訊息
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return

    const userMessage: LoganMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    }

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }))

    try {
      const response = await fetch('/api/logan/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, action: 'chat' }),
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: LoganMessage = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
        }

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          isLoading: false,
          conversationId: data.conversationId,
        }))
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: data.error || '發送失敗',
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: '網路錯誤，請稍後再試',
      }))
    }
  }, [])

  // 教導 Logan
  const teach = useCallback(async (title: string, content: string, options?: {
    type?: 'knowledge' | 'procedure' | 'preference'
    tags?: string[]
    importance?: number
  }) => {
    try {
      const response = await fetch('/api/logan/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'teach',
          title,
          content,
          ...options,
        }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      return { success: false, error: '網路錯誤' }
    }
  }, [])

  // 清除對話
  const clearMessages = useCallback(() => {
    setState({
      messages: [],
      isLoading: false,
      error: null,
      conversationId: null,
    })
  }, [])

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    isAvailable,
    model: status?.model,
    sendMessage,
    teach,
    clearMessages,
  }
}
