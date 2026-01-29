'use client'

import { useState, useEffect } from 'react'
import { useEmailStore } from '@/stores/email-store'
import type { SendEmailRequest, EmailAddress } from '@/types/email.types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Send,
  X,
  Paperclip,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface ComposeDialogProps {
  open: boolean
  onClose: () => void
}

export function ComposeDialog({ open, onClose }: ComposeDialogProps) {
  const { draftEmail, defaultAccount, sendEmail, replyToEmail } = useEmailStore()

  const [to, setTo] = useState('')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [showCcBcc, setShowCcBcc] = useState(false)
  const [sending, setSending] = useState(false)

  // 初始化表單
  useEffect(() => {
    if (open && draftEmail) {
      setTo(formatAddresses(draftEmail.to || []))
      setCc(formatAddresses(draftEmail.cc || []))
      setBcc(formatAddresses(draftEmail.bcc || []))
      setSubject(draftEmail.subject || '')
      setBody(draftEmail.body_text || stripHtml(draftEmail.body_html || ''))
      if (draftEmail.cc?.length || draftEmail.bcc?.length) {
        setShowCcBcc(true)
      }
    } else if (open) {
      // 清空
      setTo('')
      setCc('')
      setBcc('')
      setSubject('')
      setBody('')
      setShowCcBcc(false)
    }
  }, [open, draftEmail])

  const handleSend = async () => {
    if (!to.trim()) {
      toast.error('請輸入收件人')
      return
    }
    if (!subject.trim()) {
      toast.error('請輸入主旨')
      return
    }

    setSending(true)

    const request: SendEmailRequest = {
      to: parseAddresses(to),
      cc: cc ? parseAddresses(cc) : undefined,
      bcc: bcc ? parseAddresses(bcc) : undefined,
      subject: subject.trim(),
      body_text: body,
      body_html: `<div style="font-family: sans-serif; white-space: pre-wrap;">${escapeHtml(body)}</div>`,
      customer_id: draftEmail?.customer_id,
      supplier_id: draftEmail?.supplier_id,
      tour_id: draftEmail?.tour_id,
      order_id: draftEmail?.order_id,
    }

    const result = await sendEmail(request)

    setSending(false)

    if (result.success) {
      toast.success('郵件已發送')
      onClose()
    } else {
      toast.error(result.error || '發送失敗')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl" level={1}>
        <DialogHeader>
          <DialogTitle>
            {replyToEmail ? '回覆郵件' : '撰寫新郵件'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 寄件人 */}
          <div>
            <Label className="text-xs text-morandi-primary">寄件人</Label>
            <div className="mt-1 px-3 py-2 bg-morandi-container/30 rounded-lg text-sm">
              {defaultAccount?.display_name && (
                <span className="mr-1">{defaultAccount.display_name}</span>
              )}
              <span className="text-morandi-secondary">
                &lt;{defaultAccount?.email_address || '(未設定郵件帳戶)'}&gt;
              </span>
            </div>
          </div>

          {/* 收件人 */}
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="to">收件人</Label>
              <button
                type="button"
                onClick={() => setShowCcBcc(!showCcBcc)}
                className="text-xs text-morandi-gold hover:underline flex items-center gap-1"
              >
                副本/密件
                {showCcBcc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
            <Input
              id="to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="email@example.com, ..."
              className="mt-1"
            />
          </div>

          {/* 副本/密件 */}
          {showCcBcc && (
            <>
              <div>
                <Label htmlFor="cc">副本 (CC)</Label>
                <Input
                  id="cc"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="email@example.com, ..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bcc">密件副本 (BCC)</Label>
                <Input
                  id="bcc"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="email@example.com, ..."
                  className="mt-1"
                />
              </div>
            </>
          )}

          {/* 主旨 */}
          <div>
            <Label htmlFor="subject">主旨</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="郵件主旨"
              className="mt-1"
            />
          </div>

          {/* 本文 */}
          <div>
            <Label htmlFor="body">內容</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="輸入郵件內容..."
              rows={12}
              className="mt-1 resize-none"
            />
          </div>

          {/* TODO: 附件上傳 */}
          {/* <div>
            <Button variant="outline" size="sm">
              <Paperclip className="w-4 h-4 mr-2" />
              附加檔案
            </Button>
          </div> */}
        </div>

        {/* 底部按鈕 */}
        <div className="flex items-center justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={onClose} disabled={sending}>
            <X className="w-4 h-4 mr-2" />
            取消
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || !defaultAccount}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                發送中...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                發送
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// 輔助函式
// ============================================================================

function formatAddresses(addresses: EmailAddress[]): string {
  return addresses
    .map((a) => (a.name ? `${a.name} <${a.email}>` : a.email))
    .join(', ')
}

function parseAddresses(input: string): EmailAddress[] {
  if (!input.trim()) return []

  return input.split(',').map((s) => {
    const match = s.trim().match(/^(?:(.+?)\s*)?<?([^\s<>]+@[^\s<>]+)>?$/)
    if (match) {
      return {
        email: match[2],
        name: match[1]?.replace(/^["']|["']$/g, ''),
      }
    }
    return { email: s.trim() }
  }).filter((a) => a.email)
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br/>')
}
