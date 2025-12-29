/**
 * 發送報價確認連結 API
 * POST /api/quotes/confirmation/send
 */

import { logger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import type { SendConfirmationLinkParams, ConfirmationResult } from '@/types/quote.types'

export async function POST(request: NextRequest) {
  try {
    const body: SendConfirmationLinkParams = await request.json()
    const { quote_id, expires_in_days = 7, staff_id } = body

    if (!quote_id) {
      return NextResponse.json<ConfirmationResult>(
        { success: false, error: '缺少報價單 ID' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdminClient()

    // 呼叫資料庫函數
    const { data, error } = await supabase.rpc('send_quote_confirmation', {
      p_quote_id: quote_id,
      p_expires_in_days: expires_in_days,
      p_staff_id: staff_id || undefined,
    })

    if (error) {
      logger.error('發送確認連結失敗:', error)
      return NextResponse.json<ConfirmationResult>(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    const result = data as unknown as ConfirmationResult

    if (!result.success) {
      return NextResponse.json<ConfirmationResult>(result, { status: 400 })
    }

    logger.log('確認連結已發送:', result.quote_code)
    return NextResponse.json<ConfirmationResult>(result)
  } catch (error) {
    logger.error('發送確認連結錯誤:', error)
    return NextResponse.json<ConfirmationResult>(
      { success: false, error: '系統錯誤' },
      { status: 500 }
    )
  }
}
