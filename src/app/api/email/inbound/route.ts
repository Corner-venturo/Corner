/**
 * 接收郵件 Webhook API
 *
 * POST /api/email/inbound
 *
 * 當 Resend 收到寄到您網域的郵件時，會呼叫此 Webhook
 *
 * Resend Inbound Webhook 格式:
 * {
 *   "type": "email.received",
 *   "created_at": "2024-01-01T00:00:00.000Z",
 *   "data": {
 *     "from": "sender@example.com",
 *     "to": ["info@yourdomain.com"],
 *     "cc": [],
 *     "bcc": [],
 *     "reply_to": null,
 *     "subject": "Hello",
 *     "text": "Plain text body",
 *     "html": "<p>HTML body</p>",
 *     "headers": {...},
 *     "attachments": [{
 *       "filename": "file.pdf",
 *       "content_type": "application/pdf",
 *       "content": "base64...",
 *       "size": 12345
 *     }]
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'

// 使用 Service Role 跳過 RLS（Webhook 沒有用戶 session）
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// TODO: Resend Webhook 簽名驗證
// import crypto from 'crypto'
// const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET

interface ResendInboundPayload {
  type: 'email.received'
  created_at: string
  data: {
    from: string
    to: string[]
    cc?: string[]
    bcc?: string[]
    reply_to?: string
    subject?: string
    text?: string
    html?: string
    headers?: Record<string, string>
    attachments?: {
      filename: string
      content_type: string
      content: string // base64
      size: number
    }[]
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: 驗證 Resend 簽名
    // const signature = request.headers.get('resend-signature')
    // if (!verifySignature(signature, body)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }

    const payload: ResendInboundPayload = await request.json()

    logger.log('[Email Inbound] 收到郵件:', {
      from: payload.data.from,
      to: payload.data.to,
      subject: payload.data.subject,
    })

    if (payload.type !== 'email.received') {
      return NextResponse.json({ message: 'Ignored event type' })
    }

    const { data } = payload

    // 解析收件地址，找到對應的 workspace
    const toAddress = data.to[0]
    if (!toAddress) {
      logger.warn('[Email Inbound] 無收件地址')
      return NextResponse.json({ error: 'No recipient' }, { status: 400 })
    }

    // 查找對應的郵件帳戶
    const { data: emailAccount, error: accountError } = await supabaseAdmin
      .from('email_accounts')
      .select('workspace_id, email_address')
      .eq('email_address', toAddress.toLowerCase())
      .single()

    if (accountError || !emailAccount) {
      logger.warn('[Email Inbound] 找不到對應的郵件帳戶:', toAddress)
      // 返回 200 避免 Resend 重試
      return NextResponse.json({ message: 'Unknown recipient, ignored' })
    }

    // 解析寄件人
    const fromMatch = data.from.match(/^(?:(.+?)\s*)?<?([^\s<>]+@[^\s<>]+)>?$/)
    const fromName = fromMatch?.[1]?.replace(/^["']|["']$/g, '') || null
    const fromAddress = fromMatch?.[2] || data.from

    // 生成 Message-ID（如果 Resend 沒提供）
    const messageId = data.headers?.['message-id'] || `${Date.now()}.${Math.random().toString(36).substr(2, 9)}@inbound`

    // 插入郵件記錄
    const { data: email, error: insertError } = await supabaseAdmin
      .from('emails')
      .insert({
        workspace_id: emailAccount.workspace_id,
        message_id: messageId,
        thread_id: data.headers?.['thread-id'] || null,
        in_reply_to: data.headers?.['in-reply-to'] || null,
        direction: 'inbound',
        status: 'received',
        from_address: fromAddress,
        from_name: fromName,
        to_addresses: data.to.map((email) => ({ email })),
        cc_addresses: (data.cc || []).map((email) => ({ email })),
        bcc_addresses: [],
        reply_to_address: data.reply_to || null,
        subject: data.subject || '(無主旨)',
        body_text: data.text || null,
        body_html: data.html || null,
        is_read: false,
        received_at: payload.created_at || new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      logger.error('[Email Inbound] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save email' }, { status: 500 })
    }

    // 處理附件
    if (data.attachments && data.attachments.length > 0) {
      const attachments = data.attachments.map((att) => ({
        email_id: email.id,
        workspace_id: emailAccount.workspace_id,
        filename: att.filename,
        content_type: att.content_type,
        size_bytes: att.size,
        // TODO: 上傳到 Supabase Storage
        // storage_path: await uploadToStorage(att.content, att.filename)
        external_url: null,
      }))

      const { error: attError } = await supabaseAdmin
        .from('email_attachments')
        .insert(attachments)

      if (attError) {
        logger.error('[Email Inbound] Attachment insert error:', attError)
      }
    }

    logger.log('[Email Inbound] 郵件已儲存:', {
      id: email.id,
      from: fromAddress,
      subject: data.subject,
    })

    // TODO: 發送通知給相關員工
    // await notifyNewEmail(email)

    return NextResponse.json({
      success: true,
      email_id: email.id,
    })
  } catch (error) {
    logger.error('[Email Inbound] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}

/**
 * GET: 健康檢查
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Email inbound webhook is ready',
  })
}
