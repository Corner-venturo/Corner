/**
 * 撤銷報價確認 API
 * POST /api/quotes/confirmation/revoke
 */

import { logger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import type { ConfirmationResult } from '@/types/quote.types'

interface RevokeParams {
  quote_id: string
  staff_id: string
  staff_name: string
  reason: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RevokeParams = await request.json()
    const { quote_id, staff_id, staff_name, reason } = body

    if (!quote_id || !staff_id || !staff_name || !reason) {
      return NextResponse.json<ConfirmationResult>(
        { success: false, error: '缺少必要參數（包含撤銷原因）' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdminClient()

    // 呼叫資料庫函數
    const { data, error } = await supabase.rpc('revoke_quote_confirmation', {
      p_quote_id: quote_id,
      p_staff_id: staff_id,
      p_staff_name: staff_name,
      p_reason: reason,
    })

    if (error) {
      logger.error('撤銷確認失敗:', error)
      return NextResponse.json<ConfirmationResult>(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    const result = data as unknown as ConfirmationResult

    if (!result.success) {
      return NextResponse.json<ConfirmationResult>(result, { status: 400 })
    }

    logger.log('報價確認已撤銷')
    return NextResponse.json<ConfirmationResult>(result)
  } catch (error) {
    logger.error('撤銷確認錯誤:', error)
    return NextResponse.json<ConfirmationResult>(
      { success: false, error: '系統錯誤' },
      { status: 500 }
    )
  }
}
