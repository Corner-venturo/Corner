'use client'

import { useState, useTransition } from 'react'
import { sendMessageAction } from '../actions/message-actions'
import { Send } from 'lucide-react'
import type { Channel } from '@/stores/workspace/types'
import { alert } from '@/lib/ui/alert-dialog'

interface MessageInputProps {
  channel: Channel | null;
}

export function MessageInput({ channel }: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSendMessage = async () => {
    if (!content.trim() || !channel) return

    startTransition(async () => {
      const result = await sendMessageAction({
        channelId: channel.id,
        content: content,
      })

      if (result?.error) {
        // In a real app, show a toast notification
        void alert(result.error, 'error')
      } else {
        setContent('') // Clear input on successful send
      }
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!channel) {
    return null // Don't show input if no channel is selected
  }

  return (
    <div className="p-4 border-t bg-white">
      <div className="relative">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={`Message #${channel.name}`}
          className="w-full p-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold"
          disabled={isPending}
        />
        <button
          onClick={handleSendMessage}
          disabled={isPending || !content.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-morandi-gold text-white hover:bg-morandi-gold-hover disabled:bg-border"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
