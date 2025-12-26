'use client'

import { useMessages } from '../hooks/useMessages'
import { Loader2, AlertCircle } from 'lucide-react'
import type { Channel } from '@/stores/workspace/types'

interface MessageViewProps {
  channel: Channel | null;
}

export function MessageView({ channel }: MessageViewProps) {
  const { messages, loading, error } = useMessages(channel?.id || '')

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center text-morandi-secondary bg-muted">
        Select a channel to start chatting.
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Channel Header */}
      <div className="p-4 border-b bg-white shadow-sm z-10">
        <h3 className="font-bold text-xl">#{channel.name}</h3>
        {channel.description && <p className="text-morandi-secondary text-sm">{channel.description}</p>}
      </div>

      {/* Message List */}
      <div className="flex-1 p-4 overflow-y-auto bg-muted">
        {loading && (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-morandi-muted" />
          </div>
        )}

        {error && (
          <div className="flex justify-center items-center h-full text-status-danger">
            <AlertCircle className="w-6 h-6 mr-2" />
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {messages.map(message => (
              <div key={message.id} className="flex items-start gap-3">
                <div className="w-10 h-10 bg-border rounded-full flex-shrink-0 flex items-center justify-center font-bold">
                  {message.author?.display_name?.[0] || '?'}
                </div>
                <div>
                  <p className="font-bold">
                    {message.author?.display_name || 'Unknown User'}
                    <span className="text-xs text-morandi-secondary font-normal ml-2">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </span>
                  </p>
                  <p>{message.content}</p>
                </div>
              </div>
            ))}
             {messages.length === 0 && (
              <div className="text-center text-morandi-secondary pt-8">
                Be the first to say something in #{channel.name}!
              </div>
             )}
          </div>
        )}
      </div>
    </div>
  )
}
