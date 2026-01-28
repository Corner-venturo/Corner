'use client'

import { cn } from '@/lib/utils'
import { useEmailStore } from '@/stores/email-store'
import type { EmailFolder } from '@/types/email.types'
import {
  Inbox,
  Send,
  FileText,
  Star,
  Archive,
  Trash2,
  Mail,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const FOLDERS: { id: EmailFolder; label: string; icon: typeof Inbox }[] = [
  { id: 'inbox', label: '收件匣', icon: Inbox },
  { id: 'sent', label: '寄件備份', icon: Send },
  { id: 'drafts', label: '草稿', icon: FileText },
  { id: 'starred', label: '已加星號', icon: Star },
  { id: 'archived', label: '封存', icon: Archive },
  { id: 'trash', label: '垃圾桶', icon: Trash2 },
  { id: 'all', label: '全部郵件', icon: Mail },
]

export function MailSidebar() {
  const {
    currentFolder,
    setFolder,
    stats,
    openCompose,
    fetchEmails,
    loading,
  } = useEmailStore()

  return (
    <div className="h-full flex flex-col">
      {/* 撰寫按鈕 */}
      <div className="p-3">
        <Button
          onClick={() => openCompose()}
          className="w-full bg-morandi-gold hover:bg-morandi-gold-hover text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          撰寫郵件
        </Button>
      </div>

      {/* 資料夾列表 */}
      <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
        {FOLDERS.map((folder) => {
          const Icon = folder.icon
          const isActive = currentFolder === folder.id
          const count = folder.id === 'inbox' ? stats?.unread_count : undefined

          return (
            <button
              key={folder.id}
              onClick={() => setFolder(folder.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-morandi-gold/10 text-morandi-gold font-medium'
                  : 'text-morandi-secondary hover:bg-morandi-container/50'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left truncate">{folder.label}</span>
              {count !== undefined && count > 0 && (
                <span
                  className={cn(
                    'px-2 py-0.5 text-xs rounded-full',
                    isActive
                      ? 'bg-morandi-gold text-white'
                      : 'bg-morandi-container text-morandi-secondary'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* 底部統計 */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center justify-between text-xs text-morandi-secondary">
          <span>今日收信: {stats?.received_today || 0}</span>
          <button
            onClick={() => fetchEmails()}
            disabled={loading}
            className="p-1 hover:bg-morandi-container rounded"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </button>
        </div>
      </div>
    </div>
  )
}
