'use client'

import React from 'react'
import { RefreshCw, MessageCircle, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTravelerChat } from '../hooks/useTravelerChat'
import { TourList } from './TourList'
import { ConversationChat } from './ConversationChat'

/**
 * 旅伴通訊中心 - 主組件
 */
export function TravelerChatCenter() {
  const {
    tourGroups,
    conversationDetail,
    selectedConversationId,
    isLoadingConversations,
    isLoadingDetail,
    isSending,
    selectConversation,
    toggleConversation,
    sendMessage,
    refresh,
  } = useTravelerChat()

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId) return false
    return sendMessage(selectedConversationId, content)
  }

  // 計算總未讀
  const totalUnread = tourGroups.reduce((sum, g) => sum + g.totalUnread, 0)
  const totalTravelers = tourGroups.reduce((sum, g) => {
    const conv = g.conversations[0]
    return sum + (conv?.traveler_count || 0)
  }, 0)

  return (
    <div className="flex h-full bg-card rounded-lg border border-border overflow-hidden">
      {/* 左側 - 團列表 */}
      <div className="w-80 border-r border-border flex flex-col shrink-0">
        {/* 標題 */}
        <div className="h-14 px-4 border-b border-border/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle size={20} className="text-morandi-gold" />
            <h2 className="font-semibold text-morandi-primary">旅伴通訊</h2>
            {totalUnread > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-medium bg-morandi-red text-white rounded-full">
                {totalUnread}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refresh()}
            disabled={isLoadingConversations}
            className="h-8 w-8 p-0"
          >
            <RefreshCw
              size={14}
              className={isLoadingConversations ? 'animate-spin' : ''}
            />
          </Button>
        </div>

        {/* 統計 */}
        <div className="px-4 py-2 border-b border-border/30 bg-morandi-container/20 flex items-center gap-4 text-xs text-morandi-secondary">
          <span className="flex items-center gap-1">
            <MessageCircle size={12} />
            {tourGroups.length} 團
          </span>
          <span className="flex items-center gap-1">
            <Users size={12} />
            {totalTravelers} 位旅伴
          </span>
        </div>

        {/* 團列表 */}
        <div className="flex-1 overflow-hidden">
          <TourList
            tourGroups={tourGroups}
            selectedConversationId={selectedConversationId}
            onSelectConversation={selectConversation}
            onToggleConversation={toggleConversation}
          />
        </div>
      </div>

      {/* 右側 - 聊天區 */}
      <div className="flex-1">
        <ConversationChat
          detail={conversationDetail}
          isLoading={isLoadingDetail}
          isSending={isSending}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  )
}
