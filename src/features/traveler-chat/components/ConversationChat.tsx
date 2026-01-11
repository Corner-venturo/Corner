'use client'

import React, { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import {
  Send,
  Image as ImageIcon,
  Paperclip,
  Bell,
  MessageCircle,
  User,
  Briefcase,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ConversationDetail, ConversationMessage } from '../types'

interface ConversationChatProps {
  detail: ConversationDetail | undefined
  isLoading: boolean
  isSending: boolean
  onSendMessage: (content: string) => Promise<boolean>
}

export function ConversationChat({
  detail,
  isLoading,
  isSending,
  onSendMessage,
}: ConversationChatProps) {
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 滾動到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [detail?.messages])

  const handleSend = async () => {
    if (!message.trim() || isSending) return

    const content = message.trim()
    setMessage('')
    await onSendMessage(content)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 找到發送者名稱
  const getSenderName = (msg: ConversationMessage) => {
    if (!msg.sender_id) return '系統'

    // 檢查是員工還是旅伴
    if (msg.metadata?.sender_type === 'employee' && msg.metadata?.employee_id) {
      const emp = detail?.employees.find(e => e.id === msg.metadata?.employee_id)
      return emp?.display_name || '員工'
    }

    const traveler = detail?.travelers.find(t => t.id === msg.sender_id)
    return traveler?.name || '旅伴'
  }

  const getSenderAvatar = (msg: ConversationMessage) => {
    if (!msg.sender_id) return null

    if (msg.metadata?.sender_type === 'employee' && msg.metadata?.employee_id) {
      const emp = detail?.employees.find(e => e.id === msg.metadata?.employee_id)
      return emp?.avatar_url
    }

    const traveler = detail?.travelers.find(t => t.id === msg.sender_id)
    return traveler?.avatar_url
  }

  const isEmployee = (msg: ConversationMessage) => {
    return msg.metadata?.sender_type === 'employee'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-morandi-gold" size={32} />
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-morandi-secondary">
        <MessageCircle size={48} className="mb-4 opacity-50" />
        <p>選擇一個對話開始聊天</p>
      </div>
    )
  }

  const isAnnouncement = detail.conversation.type === 'tour_announcement'
  const tour = detail.conversation.tours

  return (
    <div className="flex flex-col h-full">
      {/* 標題列 */}
      <div className="h-14 px-4 border-b border-border/50 flex items-center gap-3 shrink-0 bg-card">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            isAnnouncement ? 'bg-morandi-gold/20' : 'bg-morandi-green/20'
          )}
        >
          {isAnnouncement ? (
            <Bell size={18} className="text-morandi-gold" />
          ) : (
            <MessageCircle size={18} className="text-morandi-green" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-morandi-primary">
            {tour?.tour_code} - {isAnnouncement ? '公告' : '客服'}
          </h3>
          <p className="text-xs text-morandi-secondary truncate">
            {tour?.name} · {detail.travelers.length} 位旅伴
          </p>
        </div>
        {!detail.conversation.is_open && (
          <span className="px-2 py-1 text-xs bg-morandi-container text-morandi-secondary rounded">
            尚未開啟
          </span>
        )}
      </div>

      {/* 訊息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-morandi-container/10">
        {detail.messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            senderName={getSenderName(msg)}
            senderAvatar={getSenderAvatar(msg)}
            isEmployee={isEmployee(msg)}
            isSystem={msg.type === 'system'}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 輸入區 */}
      <div className="p-4 border-t border-border/50 bg-card shrink-0">
        {!detail.conversation.is_open ? (
          <div className="text-center text-sm text-morandi-secondary py-2">
            對話尚未開啟，無法發送訊息
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isAnnouncement ? '發送公告給所有旅伴...' : '回覆旅伴訊息...'}
                className="w-full min-h-[40px] max-h-[120px] px-3 py-2 pr-20 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-morandi-gold/50"
                rows={1}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <button
                  className="p-1 text-morandi-secondary hover:text-morandi-primary transition-colors"
                  title="上傳圖片"
                >
                  <ImageIcon size={16} />
                </button>
                <button
                  className="p-1 text-morandi-secondary hover:text-morandi-primary transition-colors"
                  title="上傳檔案"
                >
                  <Paperclip size={16} />
                </button>
              </div>
            </div>
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isSending}
              className="h-10 px-4 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              {isSending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

interface MessageBubbleProps {
  message: ConversationMessage
  senderName: string
  senderAvatar: string | null | undefined
  isEmployee: boolean
  isSystem: boolean
}

function MessageBubble({
  message,
  senderName,
  senderAvatar,
  isEmployee,
  isSystem,
}: MessageBubbleProps) {
  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="px-3 py-1.5 text-xs text-morandi-secondary bg-morandi-container/50 rounded-full">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex gap-3', isEmployee && 'flex-row-reverse')}>
      {/* 頭像 */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
          isEmployee ? 'bg-morandi-gold/20' : 'bg-morandi-green/20'
        )}
      >
        {senderAvatar ? (
          <img
            src={senderAvatar}
            alt={senderName}
            className="w-full h-full rounded-full object-cover"
          />
        ) : isEmployee ? (
          <Briefcase size={14} className="text-morandi-gold" />
        ) : (
          <User size={14} className="text-morandi-green" />
        )}
      </div>

      {/* 訊息內容 */}
      <div className={cn('max-w-[70%]', isEmployee && 'items-end')}>
        <div className={cn('flex items-center gap-2 mb-1', isEmployee && 'flex-row-reverse')}>
          <span className="text-xs font-medium text-morandi-primary">{senderName}</span>
          <span className="text-xs text-morandi-secondary">
            {format(new Date(message.created_at), 'HH:mm')}
          </span>
        </div>
        <div
          className={cn(
            'px-3 py-2 rounded-lg text-sm',
            isEmployee
              ? 'bg-morandi-gold text-white rounded-tr-none'
              : 'bg-card border border-border/50 rounded-tl-none'
          )}
        >
          {message.content}

          {/* 附件 */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((att, idx) => (
                <div key={idx} className="text-xs opacity-80">
                  📎 {att.name || att.url}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
