/**
 * 發送報價確認連結 API
 * POST /api/quotes/confirmation/send
 */

import { logger } from '@/lib/utils/logger'
import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import type { SendConfirmationLinkParams, ConfirmationResult } from '@/types/quote.types'
import { successResponse, errorResponse, ApiError, ErrorCode } from '@/lib/api/response'

export async function POST(request: NextRequest) {
  try {
    const body: SendConfirmationLinkParams = await request.json()
    const { quote_id, expires_in_days = 7, staff_id } = body

    if (!quote_id) {
      return ApiError.missingField('quote_id')
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
      return errorResponse(error.message, 400, ErrorCode.OPERATION_FAILED)
    }

    const result = data as unknown as ConfirmationResult

    if (!result.success) {
      return errorResponse(result.error || '發送失敗', 400, ErrorCode.OPERATION_FAILED)
    }

    logger.log('確認連結已發送:', result.quote_code)
    return successResponse(result)
  } catch (error) {
    logger.error('發送確認連結錯誤:', error)
    return ApiError.internal('系統錯誤')
  }
}
