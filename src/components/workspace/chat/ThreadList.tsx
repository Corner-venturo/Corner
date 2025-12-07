'use client'

import { useState } from 'react'
import { Plus, MessageSquare, ChevronRight, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ChannelThread } from '@/stores/workspace/types'

interface ThreadListProps {
  threads: ChannelThread[]
  selectedThreadId: string | null
  onSelectThread: (thread: ChannelThread | null) => void
  onCreateThread: (name: string) => void
  onDeleteThread: (threadId: string) => void
  isLoading?: boolean
}

export function ThreadList({
  threads,
  selectedThreadId,
  onSelectThread,
  onCreateThread,
  onDeleteThread,
  isLoading,
}: ThreadListProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newThreadName, setNewThreadName] = useState('')

  const handleCreate = () => {
    if (!newThreadName.trim()) return
    onCreateThread(newThreadName.trim())
    setNewThreadName('')
    setIsCreating(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate()
    } else if (e.key === 'Escape') {
      setIsCreating(false)
      setNewThreadName('')
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center text-morandi-secondary text-sm">
        載入討論串...
      </div>
    )
  }

  return (
    <div className="border-b border-border bg-morandi-bg/30">
      {/* 標題列 */}
      <div className="px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-medium text-morandi-secondary uppercase tracking-wider">
          討論串
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setIsCreating(true)}
        >
          <Plus size={14} />
        </Button>
      </div>

      {/* 新增討論串輸入框 */}
      {isCreating && (
        <div className="px-4 pb-2">
          <input
            type="text"
            value={newThreadName}
            onChange={e => setNewThreadName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!newThreadName.trim()) {
                setIsCreating(false)
              }
            }}
            placeholder="討論串名稱..."
            className="w-full px-2 py-1 text-sm border border-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-morandi-gold"
            autoFocus
          />
        </div>
      )}

      {/* 討論串列表 */}
      <div className="max-h-[200px] overflow-y-auto">
        {/* 主頻道選項 */}
        <button
          onClick={() => onSelectThread(null)}
          className={cn(
            'w-full px-4 py-2 flex items-center gap-2 text-sm hover:bg-morandi-container/20 transition-colors',
            selectedThreadId === null && 'bg-morandi-container/30 text-morandi-primary font-medium'
          )}
        >
          <MessageSquare size={14} />
          <span>主頻道</span>
        </button>

        {/* 討論串項目 */}
        {threads.map(thread => (
          <div
            key={thread.id}
            className={cn(
              'group w-full px-4 py-2 flex items-center justify-between text-sm hover:bg-morandi-container/20 transition-colors cursor-pointer',
              selectedThreadId === thread.id && 'bg-morandi-container/30'
            )}
            onClick={() => onSelectThread(thread)}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <ChevronRight size={14} className="shrink-0 text-morandi-secondary" />
              <span className={cn(
                'truncate',
                selectedThreadId === thread.id && 'text-morandi-primary font-medium'
              )}>
                {thread.name}
              </span>
              {(thread.reply_count ?? 0) > 0 && (
                <span className="text-xs text-morandi-secondary">
                  ({thread.reply_count})
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {thread.last_reply_at && (
                <span className="text-xs text-morandi-secondary">
                  {formatDistanceToNow(new Date(thread.last_reply_at), {
                    addSuffix: true,
                    locale: zhTW,
                  })}
                </span>
              )}
              <button
                onClick={e => {
                  e.stopPropagation()
                  if (confirm(`確定要刪除討論串「${thread.name}」嗎？`)) {
                    onDeleteThread(thread.id)
                  }
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
              >
                <Trash2 size={12} className="text-red-500" />
              </button>
            </div>
          </div>
        ))}

        {threads.length === 0 && !isCreating && (
          <div className="px-4 py-3 text-center text-morandi-secondary text-xs">
            尚無討論串，點擊 + 建立
          </div>
        )}
      </div>
    </div>
  )
}
