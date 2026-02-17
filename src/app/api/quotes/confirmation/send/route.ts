/**
 * 發送報價確認連結 API
 * POST /api/quotes/confirmation/send
 */

import { logger } from '@/lib/utils/logger'
import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getServerAuth } from '@/lib/auth/server-auth'
import type { ConfirmationResult } from '@/types/quote.types'
import { successResponse, errorResponse, ApiError, ErrorCode } from '@/lib/api/response'
import { validateBody } from '@/lib/api/validation'
import { sendQuoteConfirmationSchema } from '@/lib/validations/api-schemas'

export async function POST(request: NextRequest) {
  try {
    // 🔒 安全檢查：驗證用戶身份
    const auth = await getServerAuth()
    if (!auth.success) {
      return errorResponse('請先登入', 401, ErrorCode.UNAUTHORIZED)
    }

    const validation = await validateBody(request, sendQuoteConfirmationSchema)
    if (!validation.success) return validation.error
    const { quote_id, expires_in_days, staff_id } = validation.data

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
