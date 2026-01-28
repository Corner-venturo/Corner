/**
 * 發送郵件 API
 *
 * POST /api/email/send
 *
 * 目前為 Mock 模式，等 Resend 帳號設定好後接入真實發送
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerAuth } from '@/lib/auth/server-auth'
import { logger } from '@/lib/utils/logger'
import type { SendEmailRequest } from '@/types/email.types'

// TODO: 接入 Resend
// import { Resend } from 'resend'
// const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    // 驗證登入
    const auth = await getServerAuth()
    if (!auth.success) {
      return NextResponse.json({ error: auth.error.error }, { status: 401 })
    }
    const { workspaceId, user } = auth.data

    const body: SendEmailRequest = await request.json()

    // 驗證必要欄位
    if (!body.to || body.to.length === 0) {
      return NextResponse.json({ error: '請指定收件人' }, { status: 400 })
    }
    if (!body.subject) {
      return NextResponse.json({ error: '請輸入主旨' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()

    // 取得預設發送帳戶
    let fromAddress = body.from_address
    let fromName: string | null = null

    if (!fromAddress) {
      const { data: defaultAccount } = await supabase
        .from('email_accounts')
        .select('email_address, display_name')
        .eq('workspace_id', workspaceId)
        .eq('is_default', true)
        .single()

      if (defaultAccount) {
        fromAddress = defaultAccount.email_address
        fromName = defaultAccount.display_name
      } else {
        return NextResponse.json({ error: '請先設定郵件帳戶' }, { status: 400 })
      }
    }

    // 建立郵件記錄
    const { data: email, error: insertError } = await supabase
      .from('emails')
      .insert({
        workspace_id: workspaceId,
        direction: 'outbound',
        status: body.scheduled_at ? 'queued' : 'sending',
        from_address: fromAddress,
        from_name: fromName,
        to_addresses: body.to,
        cc_addresses: body.cc || [],
        bcc_addresses: body.bcc || [],
        reply_to_address: body.reply_to,
        subject: body.subject,
        body_html: body.body_html,
        body_text: body.body_text || stripHtml(body.body_html || ''),
        customer_id: body.customer_id,
        supplier_id: body.supplier_id,
        tour_id: body.tour_id,
        order_id: body.order_id,
        labels: body.labels || [],
        scheduled_at: body.scheduled_at,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      logger.error('[Email Send] Insert error:', insertError)
      return NextResponse.json({ error: '建立郵件記錄失敗' }, { status: 500 })
    }

    // ================================================================
    // TODO: 接入 Resend 發送
    // ================================================================
    // const { data: resendData, error: resendError } = await resend.emails.send({
    //   from: `${fromName} <${fromAddress}>`,
    //   to: body.to.map(t => t.name ? `${t.name} <${t.email}>` : t.email),
    //   cc: body.cc?.map(t => t.name ? `${t.name} <${t.email}>` : t.email),
    //   bcc: body.bcc?.map(t => t.name ? `${t.name} <${t.email}>` : t.email),
    //   reply_to: body.reply_to,
    //   subject: body.subject,
    //   html: body.body_html,
    //   text: body.body_text,
    //   attachments: body.attachments?.map(a => ({
    //     filename: a.filename,
    //     content: Buffer.from(a.content, 'base64'),
    //   })),
    // })

    // if (resendError) {
    //   await supabase.from('emails').update({
    //     status: 'failed',
    //     error_message: resendError.message,
    //   }).eq('id', email.id)
    //   return NextResponse.json({ error: resendError.message }, { status: 500 })
    // }

    // Mock: 模擬發送成功
    const mockExternalId = `mock_${Date.now()}`

    // 更新狀態為已發送
    await supabase
      .from('emails')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        external_id: mockExternalId,
      })
      .eq('id', email.id)

    logger.log('[Email Send] Mock 發送成功:', {
      emailId: email.id,
      to: body.to,
      subject: body.subject,
    })

    return NextResponse.json({
      success: true,
      email_id: email.id,
      external_id: mockExternalId,
      message: '[Mock] 郵件已記錄，等待 Resend 帳號設定後實際發送',
    })
  } catch (error) {
    logger.error('[Email Send] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '發送失敗' },
      { status: 500 }
    )
  }
}

/**
 * 簡單的 HTML 轉純文字
 */
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
