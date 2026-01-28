'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useEmailStore } from '@/stores/email-store'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import {
  Star,
  Paperclip,
  Search,
  MoreHorizontal,
  Archive,
  Trash2,
  Mail,
  MailOpen,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'

export function MailList() {
  const {
    emails,
    total,
    loading,
    selectedEmailId,
    selectEmail,
    toggleStar,
    markAsRead,
    markAsUnread,
    archive,
    moveToTrash,
    filter,
    setFilter,
    page,
    pageSize,
    setPage,
    fetchEmails,
    currentFolder,
  } = useEmailStore()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchValue, setSearchValue] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilter({ search: searchValue || undefined })
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const selectAll = () => {
    if (selectedIds.size === emails.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(emails.map((e) => e.id)))
    }
  }

  const handleBulkAction = async (action: 'read' | 'unread' | 'archive' | 'trash') => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    switch (action) {
      case 'read':
        await markAsRead(ids)
        break
      case 'unread':
        await markAsUnread(ids)
        break
      case 'archive':
        await archive(ids)
        break
      case 'trash':
        await moveToTrash(ids)
        break
    }
    setSelectedIds(new Set())
  }

  const totalPages = Math.ceil(total / pageSize)

  const getFolderTitle = () => {
    const titles: Record<string, string> = {
      inbox: '收件匣',
      sent: '寄件備份',
      drafts: '草稿',
      starred: '已加星號',
      archived: '封存',
      trash: '垃圾桶',
      all: '全部郵件',
    }
    return titles[currentFolder] || '郵件'
  }

  return (
    <div className="h-full flex flex-col">
      {/* 標題列 */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-morandi-primary">{getFolderTitle()}</h2>
          <button
            onClick={() => fetchEmails()}
            disabled={loading}
            className="p-1.5 hover:bg-morandi-container rounded-lg"
          >
            <RefreshCw className={cn('w-4 h-4 text-morandi-secondary', loading && 'animate-spin')} />
          </button>
        </div>

        {/* 搜尋 */}
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-morandi-secondary" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="搜尋郵件..."
            className="pl-9 h-9"
          />
        </form>
      </div>

      {/* 批次操作列 */}
      {selectedIds.size > 0 && (
        <div className="px-4 py-2 border-b border-border bg-morandi-container/30 flex items-center gap-2">
          <span className="text-sm text-morandi-secondary">
            已選取 {selectedIds.size} 封
          </span>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleBulkAction('read')}
          >
            <MailOpen className="w-4 h-4 mr-1" />
            已讀
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleBulkAction('unread')}
          >
            <Mail className="w-4 h-4 mr-1" />
            未讀
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleBulkAction('archive')}
          >
            <Archive className="w-4 h-4 mr-1" />
            封存
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleBulkAction('trash')}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            刪除
          </Button>
        </div>
      )}

      {/* 郵件列表 */}
      <div className="flex-1 overflow-y-auto">
        {loading && emails.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-morandi-secondary">
            載入中...
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-morandi-secondary">
            <Mail className="w-10 h-10 mb-2 opacity-50" />
            <span>沒有郵件</span>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {emails.map((email) => {
              const isSelected = selectedEmailId === email.id
              const isChecked = selectedIds.has(email.id)
              const displayName = email.direction === 'inbound'
                ? (email.from_name || email.from_address.split('@')[0])
                : (email.to_addresses[0]?.name || email.to_addresses[0]?.email?.split('@')[0] || '(無收件人)')

              return (
                <li
                  key={email.id}
                  className={cn(
                    'group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-morandi-gold/10'
                      : 'hover:bg-morandi-container/30',
                    !email.is_read && 'bg-white'
                  )}
                  onClick={() => selectEmail(email.id)}
                >
                  {/* 勾選框 */}
                  <div
                    className="pt-0.5"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleSelect(email.id)
                    }}
                  >
                    <Checkbox checked={isChecked} />
                  </div>

                  {/* 星號 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleStar(email.id)
                    }}
                    className="pt-0.5"
                  >
                    <Star
                      className={cn(
                        'w-4 h-4',
                        email.is_starred
                          ? 'fill-morandi-gold text-morandi-gold'
                          : 'text-morandi-muted hover:text-morandi-gold'
                      )}
                    />
                  </button>

                  {/* 內容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'truncate',
                          !email.is_read ? 'font-semibold text-morandi-primary' : 'text-morandi-secondary'
                        )}
                      >
                        {displayName}
                      </span>
                      {email.attachments && email.attachments.length > 0 && (
                        <Paperclip className="w-3.5 h-3.5 text-morandi-secondary shrink-0" />
                      )}
                    </div>
                    <div
                      className={cn(
                        'text-sm truncate',
                        !email.is_read ? 'text-morandi-primary' : 'text-morandi-secondary'
                      )}
                    >
                      {email.subject || '(無主旨)'}
                    </div>
                    <div className="text-xs text-morandi-muted truncate mt-0.5">
                      {email.body_text?.slice(0, 80) || '(無內容)'}
                    </div>
                  </div>

                  {/* 時間 */}
                  <div className="text-xs text-morandi-muted shrink-0">
                    {formatDistanceToNow(new Date(email.created_at), {
                      addSuffix: true,
                      locale: zhTW,
                    })}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* 分頁 */}
      {totalPages > 1 && (
        <div className="px-4 py-2 border-t border-border flex items-center justify-between text-sm">
          <span className="text-morandi-secondary">
            共 {total} 封，第 {page}/{totalPages} 頁
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
