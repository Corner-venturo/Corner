'use client'

import React from 'react'
import { format, differenceInDays } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import {
  ChevronRight,
  MessageCircle,
  Bell,
  Users,
  Calendar,
  Lock,
  Unlock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { TourGroup, TourConversation } from '../types'
import { LABELS } from '../constants/labels'

interface TourListProps {
  tourGroups: TourGroup[]
  selectedConversationId: string | null
  onSelectConversation: (conversationId: string) => void
  onToggleConversation: (tourId: string, isOpen: boolean) => Promise<boolean>
}

export function TourList({
  tourGroups,
  selectedConversationId,
  onSelectConversation,
  onToggleConversation,
}: TourListProps) {
  const [expandedTours, setExpandedTours] = React.useState<Set<string>>(new Set())
  const [toggling, setToggling] = React.useState<string | null>(null)

  const toggleExpand = (tourId: string) => {
    setExpandedTours(prev => {
      const next = new Set(prev)
      if (next.has(tourId)) {
        next.delete(tourId)
      } else {
        next.add(tourId)
      }
      return next
    })
  }

  const handleToggle = async (e: React.MouseEvent, tourId: string, isOpen: boolean) => {
    e.stopPropagation()
    setToggling(tourId)
    await onToggleConversation(tourId, isOpen)
    setToggling(null)
  }

  const getDaysUntilDeparture = (dateStr: string) => {
    const days = differenceInDays(new Date(dateStr), new Date())
    if (days < 0) return LABELS.departed
    if (days === 0) return LABELS.departToday
    if (days === 1) return LABELS.departTomorrow
    return LABELS.departInDays(days)
  }

  if (tourGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-morandi-secondary">
        <MessageCircle size={48} className="mb-4 opacity-50" />
        <p>{LABELS.noConversations}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {tourGroups.map(group => {
          const isExpanded = expandedTours.has(group.tourId)
          const daysText = getDaysUntilDeparture(group.departureDate)
          const isTogglingThis = toggling === group.tourId

          return (
            <div key={group.tourId} className="border-b border-border/50">
              {/* 團標題 */}
              <div
                className={cn(
                  'flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-morandi-container/30 transition-colors',
                  isExpanded && 'bg-morandi-container/20'
                )}
                onClick={() => toggleExpand(group.tourId)}
              >
                <ChevronRight
                  size={16}
                  className={cn(
                    'text-morandi-secondary transition-transform',
                    isExpanded && 'rotate-90'
                  )}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-morandi-primary truncate">
                      {group.tourCode}
                    </span>
                    {group.totalUnread > 0 && (
                      <span className="px-1.5 py-0.5 text-xs font-medium bg-morandi-red text-white rounded-full">
                        {group.totalUnread}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-morandi-secondary truncate">
                    {group.tourName}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-morandi-secondary">
                    {daysText}
                  </span>

                  {/* 開啟/關閉按鈕 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-7 px-2',
                      group.isOpen
                        ? 'text-morandi-green hover:text-morandi-green'
                        : 'text-morandi-secondary hover:text-morandi-primary'
                    )}
                    onClick={(e) => handleToggle(e, group.tourId, !group.isOpen)}
                    disabled={isTogglingThis}
                    title={group.isOpen ? LABELS.closeTravelerChat : LABELS.openTravelerChat}
                  >
                    {isTogglingThis ? (
                      <span className="animate-spin">⏳</span>
                    ) : group.isOpen ? (
                      <Unlock size={14} />
                    ) : (
                      <Lock size={14} />
                    )}
                  </Button>
                </div>
              </div>

              {/* 展開的對話列表 */}
              {isExpanded && (
                <div className="bg-morandi-container/10">
                  {group.conversations.map(conv => (
                    <ConversationItem
                      key={conv.conversation_id}
                      conversation={conv}
                      isSelected={selectedConversationId === conv.conversation_id}
                      onClick={() => onSelectConversation(conv.conversation_id)}
                    />
                  ))}

                  {/* 團資訊 */}
                  <div className="px-4 py-2 text-xs text-morandi-secondary flex items-center gap-4 border-t border-border/30">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {format(new Date(group.departureDate), 'MM/dd (EEE)', { locale: zhTW })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {LABELS.travelerCount(group.conversations[0]?.traveler_count || 0)}
                    </span>
                    {group.openAt && (
                      <span className="flex items-center gap-1">
                        {LABELS.openedAt} {format(new Date(group.openAt), 'MM/dd HH:mm')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface ConversationItemProps {
  conversation: TourConversation
  isSelected: boolean
  onClick: () => void
}

function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
  const isAnnouncement = conversation.conversation_type === 'tour_announcement'

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors',
        isSelected
          ? 'bg-morandi-gold/20 border-l-2 border-morandi-gold'
          : 'hover:bg-morandi-container/30 border-l-2 border-transparent'
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center',
          isAnnouncement ? 'bg-morandi-gold/20' : 'bg-morandi-green/20'
        )}
      >
        {isAnnouncement ? (
          <Bell size={14} className="text-morandi-gold" />
        ) : (
          <MessageCircle size={14} className="text-morandi-green" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-morandi-primary">
            {isAnnouncement ? LABELS.announcement : LABELS.customerService}
          </span>
          {conversation.unread_count > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-medium bg-morandi-red text-white rounded-full">
              {conversation.unread_count}
            </span>
          )}
        </div>
        {conversation.last_message_preview && (
          <p className="text-xs text-morandi-secondary truncate">
            {conversation.last_message_preview}
          </p>
        )}
      </div>

      {conversation.last_message_at && (
        <span className="text-xs text-morandi-secondary shrink-0">
          {format(new Date(conversation.last_message_at), 'HH:mm')}
        </span>
      )}
    </div>
  )
}
