'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Users, MapPin, CircleDollarSign, ExternalLink, MessageCircle, Megaphone } from 'lucide-react'
import { useQuotes } from '@/data'
import { cn } from '@/lib/utils'
import type { ChatMode, TravelerConversationType } from './useTravelerMode'
import { stripHtml } from '@/lib/utils/string-utils'
import { COMP_WORKSPACE_LABELS } from '../constants/labels'

interface ChatHeaderProps {
  showMemberSidebar: boolean
  onToggleMemberSidebar: () => void
  tourId?: string | null
  // 旅伴模式相關
  mode?: ChatMode
  onModeChange?: (mode: ChatMode) => void
  activeConversationType?: TravelerConversationType
  onConversationTypeChange?: (type: TravelerConversationType) => void
  unreadCount?: number
  isConversationOpen?: boolean
}

export function ChatHeader({
  showMemberSidebar,
  onToggleMemberSidebar,
  tourId,
  mode = 'internal',
  onModeChange,
  activeConversationType = 'tour_announcement',
  onConversationTypeChange,
  unreadCount = 0,
  isConversationOpen = false,
}: ChatHeaderProps) {
  const router = useRouter()
  const { items: quotes } = useQuotes()

  // 篩選該旅遊團的報價單
  const linkedQuotes = useMemo(() => {
    if (!tourId) return []
    return quotes.filter(q => q.tour_id === tourId && !(q as { _deleted?: boolean })._deleted)
  }, [quotes, tourId])

  return (
    <div className="flex items-center gap-1">
      {/* 模式切換按鈕 - 只在有 tourId 時顯示 */}
      {tourId && onModeChange && (
        <div className="flex items-center gap-1 mr-2 border-r border-border pr-2">
          <Button
            variant={mode === 'internal' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onModeChange('internal')}
            className={cn(
              'h-7 px-2 text-xs',
              mode === 'internal'
                ? 'bg-morandi-gold hover:bg-morandi-gold-hover text-white'
                : 'text-morandi-secondary hover:text-morandi-primary'
            )}
          >
            內部
          </Button>
          <Button
            variant={mode === 'traveler' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onModeChange('traveler')}
            className={cn(
              'h-7 px-2 text-xs relative',
              mode === 'traveler'
                ? 'bg-violet-500 hover:bg-violet-600 text-white'
                : 'text-morandi-secondary hover:text-violet-500 hover:bg-violet-50'
            )}
          >
            <Users size={12} className="mr-1" />
            旅伴
            {unreadCount > 0 && mode !== 'traveler' && (
              <Badge
                variant="destructive"
                className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 text-[10px]"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </div>
      )}

      {/* 旅伴模式下的對話類型切換 */}
      {mode === 'traveler' && tourId && onConversationTypeChange && (
        <div className="flex items-center gap-1 mr-2 border-r border-violet-500/30 pr-2">
          <Button
            variant={activeConversationType === 'tour_announcement' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onConversationTypeChange('tour_announcement')}
            className={cn(
              'h-7 px-2 text-xs',
              activeConversationType === 'tour_announcement'
                ? 'bg-violet-500/20 text-violet-200 hover:bg-violet-500/30'
                : 'text-violet-400 hover:text-violet-200'
            )}
          >
            <Megaphone size={12} className="mr-1" />
            公告
          </Button>
          <Button
            variant={activeConversationType === 'tour_support' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onConversationTypeChange('tour_support')}
            className={cn(
              'h-7 px-2 text-xs',
              activeConversationType === 'tour_support'
                ? 'bg-violet-500/20 text-violet-200 hover:bg-violet-500/30'
                : 'text-violet-400 hover:text-violet-200'
            )}
          >
            <MessageCircle size={12} className="mr-1" />
            客服
          </Button>
        </div>
      )}

      {/* 跳轉到旅遊團詳情 */}
      {tourId && (
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-morandi-gold hover:text-morandi-gold/80 hover:bg-morandi-gold/10"
          onClick={() => router.push(`/tours?highlight=${tourId}`)}
          title={COMP_WORKSPACE_LABELS.前往旅遊團詳情}
        >
          <MapPin size={16} />
        </Button>
      )}

      {/* 關聯報價單 */}
      {tourId && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-morandi-gold hover:text-morandi-gold/80 hover:bg-morandi-gold/10 relative"
              title={COMP_WORKSPACE_LABELS.關聯報價單}
            >
              <CircleDollarSign size={16} />
              {linkedQuotes.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-morandi-gold text-white text-[10px] rounded-full flex items-center justify-center">
                  {linkedQuotes.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="end">
            <div className="text-sm font-medium text-morandi-primary mb-2">關聯報價單</div>
            {linkedQuotes.length > 0 ? (
              <div className="space-y-1">
                {linkedQuotes.map(quote => (
                  <button
                    key={quote.id}
                    onClick={() => {
                      // 根據報價單類型跳轉到對應路由
                      if (quote.quote_type === 'quick') {
                        router.push(`/quotes/quick/${quote.id}`)
                      } else {
                        router.push(`/quotes/${quote.id}`)
                      }
                    }}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-morandi-container/30 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-morandi-gold">{quote.code}</span>
                        <span className="text-sm text-morandi-text truncate">
                          {stripHtml(quote.name) || stripHtml(quote.destination) || COMP_WORKSPACE_LABELS.未命名}
                        </span>
                      </div>
                      {quote.total_cost && (
                        <div className="text-xs text-morandi-secondary mt-0.5">
                          NT$ {quote.total_cost.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <ExternalLink size={14} className="text-morandi-secondary shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm text-morandi-secondary text-center py-4">
                尚未關聯報價單
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}

      <Button variant="ghost" size="icon" className="w-8 h-8" onClick={onToggleMemberSidebar}>
        <Users size={16} />
      </Button>
    </div>
  )
}
