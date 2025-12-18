'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Users, MapPin, CircleDollarSign, ExternalLink } from 'lucide-react'
import { useQuoteStore } from '@/stores'

// 去除 HTML 標籤
function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

interface ChatHeaderProps {
  showMemberSidebar: boolean
  onToggleMemberSidebar: () => void
  tourId?: string | null
}

export function ChatHeader({ showMemberSidebar, onToggleMemberSidebar, tourId }: ChatHeaderProps) {
  const router = useRouter()
  const { items: quotes, fetchAll: fetchQuotes } = useQuoteStore()

  // 載入報價單
  useEffect(() => {
    if (tourId) {
      fetchQuotes()
    }
  }, [tourId, fetchQuotes])

  // 篩選該旅遊團的報價單
  const linkedQuotes = useMemo(() => {
    if (!tourId) return []
    return quotes.filter(q => q.tour_id === tourId && !(q as { _deleted?: boolean })._deleted)
  }, [quotes, tourId])

  return (
    <div className="flex items-center gap-1">
      {/* 跳轉到旅遊團詳情 */}
      {tourId && (
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-morandi-gold hover:text-morandi-gold/80 hover:bg-morandi-gold/10"
          onClick={() => router.push(`/tours/${tourId}`)}
          title="前往旅遊團詳情"
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
              title="關聯報價單"
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
                    onClick={() => router.push(`/quotes/${quote.id}`)}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-morandi-container/30 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-morandi-gold">{quote.code}</span>
                        <span className="text-sm text-morandi-text truncate">
                          {stripHtml(quote.name) || stripHtml(quote.destination) || '未命名'}
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
