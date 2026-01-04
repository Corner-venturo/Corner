/**
 * 開票狀態檢查 Cron Job
 * 每天早上 10:00 (UTC+8) 執行
 * Vercel Cron: 0 2 * * * (UTC)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  try {
    logger.info('開始執行開票狀態檢查 Cron Job')

    // 呼叫開票狀態 API，發送給各業務
    const baseUrl = request.nextUrl.origin
    const response = await fetch(`${baseUrl}/api/bot/ticket-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notify_sales: true,
      }),
    })

    const result = await response.json()

    if (!result.success) {
      logger.error('開票狀態檢查失敗:', result)
      return NextResponse.json(result, { status: 500 })
    }

    // 記錄執行結果
    const supabase = getSupabaseAdminClient()
    await supabase.from('cron_execution_logs').insert({
      job_name: 'ticket_status_check',
      result: result.data,
      success: true,
    })

    logger.info('開票狀態檢查完成', result.data)

    return NextResponse.json({
      success: true,
      message: 'Ticket status check completed',
      data: result.data,
    })

  } catch (error) {
    logger.error('開票狀態檢查 Cron 錯誤:', error)

    // 記錄錯誤
    try {
      const supabase = getSupabaseAdminClient()
      await supabase.from('cron_execution_logs').insert({
        job_name: 'ticket_status_check',
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
    } catch {
      // 忽略記錄失敗
    }

    return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 })
  }
}
