'use client'

import { cn } from '@/lib/utils'
import { useEmailStore } from '@/stores/email-store'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import {
  ArrowLeft,
  Reply,
  ReplyAll,
  Forward,
  Star,
  Archive,
  Trash2,
  MoreHorizontal,
  Paperclip,
  Download,
  User,
  Building2,
  MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

interface MailDetailProps {
  onBack?: () => void
}

export function MailDetail({ onBack }: MailDetailProps) {
  const {
    selectedEmail,
    loadingDetail,
    toggleStar,
    archive,
    moveToTrash,
    markAsUnread,
    replyTo,
    openCompose,
  } = useEmailStore()

  if (!selectedEmail) {
    return (
      <div className="h-full flex items-center justify-center text-morandi-secondary">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-morandi-container/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-morandi-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p>選擇一封郵件來閱讀</p>
        </div>
      </div>
    )
  }

  if (loadingDetail) {
    return (
      <div className="h-full flex items-center justify-center text-morandi-secondary">
        載入中...
      </div>
    )
  }

  const email = selectedEmail
  const senderName = email.from_name || email.from_address.split('@')[0]
  const dateStr = format(new Date(email.created_at), 'yyyy/MM/dd HH:mm', { locale: zhTW })

  const handleReply = () => replyTo(email, false)
  const handleReplyAll = () => replyTo(email, true)
  const handleForward = () => {
    openCompose({
      subject: `Fwd: ${email.subject || ''}`,
      body_html: `
        <br/><br/>
        <div style="border-left: 2px solid #ccc; padding-left: 12px; color: #666;">
          <p>---------- 轉寄的郵件 ----------</p>
          <p>寄件人: ${email.from_name || ''} &lt;${email.from_address}&gt;</p>
          <p>日期: ${dateStr}</p>
          <p>主旨: ${email.subject || ''}</p>
          <br/>
          ${email.body_html || email.body_text || ''}
        </div>
      `,
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* 頂部工具列 */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        {/* 手機版返回按鈕 */}
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="lg:hidden">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}

        <div className="flex-1" />

        {/* 操作按鈕 */}
        <Button variant="ghost" size="sm" onClick={handleReply}>
          <Reply className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">回覆</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={handleReplyAll}>
          <ReplyAll className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">全部回覆</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={handleForward}>
          <Forward className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">轉寄</span>
        </Button>

        <div className="w-px h-5 bg-border mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleStar(email.id)}
        >
          <Star
            className={cn(
              'w-4 h-4',
              email.is_starred ? 'fill-morandi-gold text-morandi-gold' : ''
            )}
          />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => markAsUnread([email.id])}>
              標記為未讀
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => archive([email.id])}>
              <Archive className="w-4 h-4 mr-2" />
              封存
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => moveToTrash([email.id])}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              刪除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 郵件內容 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {/* 主旨 */}
          <h1 className="text-xl font-semibold text-morandi-primary mb-4">
            {email.subject || '(無主旨)'}
          </h1>

          {/* 寄件人資訊 */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-morandi-gold/20 flex items-center justify-center text-morandi-gold font-medium shrink-0">
              {senderName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-morandi-primary">{senderName}</span>
                <span className="text-sm text-morandi-secondary">
                  &lt;{email.from_address}&gt;
                </span>
              </div>
              <div className="text-sm text-morandi-secondary">
                收件人: {email.to_addresses.map((a) => a.name || a.email).join(', ')}
              </div>
              {email.cc_addresses.length > 0 && (
                <div className="text-sm text-morandi-secondary">
                  副本: {email.cc_addresses.map((a) => a.name || a.email).join(', ')}
                </div>
              )}
              <div className="text-xs text-morandi-muted mt-1">{dateStr}</div>
            </div>
          </div>

          {/* 關聯資訊 */}
          {(email.customer || email.supplier || email.tour_id) && (
            <div className="mb-4 p-3 bg-morandi-container/30 rounded-lg space-y-1">
              {email.customer && (
                <Link
                  href={`/customers?id=${email.customer.id}`}
                  className="flex items-center gap-2 text-sm text-morandi-secondary hover:text-morandi-gold"
                >
                  <User className="w-4 h-4" />
                  客戶: {email.customer.chinese_name || email.customer.email}
                </Link>
              )}
              {email.supplier && (
                <Link
                  href={`/database/suppliers?id=${email.supplier.id}`}
                  className="flex items-center gap-2 text-sm text-morandi-secondary hover:text-morandi-gold"
                >
                  <Building2 className="w-4 h-4" />
                  供應商: {email.supplier.name}
                </Link>
              )}
              {email.tour_id && (
                <Link
                  href={`/tours?id=${email.tour_id}`}
                  className="flex items-center gap-2 text-sm text-morandi-secondary hover:text-morandi-gold"
                >
                  <MapPin className="w-4 h-4" />
                  相關旅遊團
                </Link>
              )}
            </div>
          )}

          {/* 附件 */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="mb-4 p-3 border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-morandi-primary">
                <Paperclip className="w-4 h-4" />
                附件 ({email.attachments.length})
              </div>
              <div className="space-y-1">
                {email.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 px-2 py-1.5 bg-morandi-container/30 rounded text-sm"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-morandi-secondary" />
                    <span className="flex-1 truncate">{att.filename}</span>
                    {att.size_bytes && (
                      <span className="text-xs text-morandi-muted">
                        {formatFileSize(att.size_bytes)}
                      </span>
                    )}
                    {(att.storage_path || att.external_url) && (
                      <a
                        href={att.external_url || `/api/storage/${att.storage_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-morandi-container rounded"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 郵件本文 */}
          <div className="prose prose-sm max-w-none">
            {email.body_html ? (
              <div
                dangerouslySetInnerHTML={{ __html: email.body_html }}
                className="email-content"
              />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-morandi-primary">
                {email.body_text || '(無內容)'}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
