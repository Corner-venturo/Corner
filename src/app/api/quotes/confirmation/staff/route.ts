/**
 * 業務確認報價單 API
 * POST /api/quotes/confirmation/staff
 */

import { logger } from '@/lib/utils/logger'
import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getServerAuth } from '@/lib/auth/server-auth'
import type { ConfirmationResult } from '@/types/quote.types'
import { successResponse, errorResponse, ApiError, ErrorCode } from '@/lib/api/response'
import { validateBody } from '@/lib/api/validation'
import { staffConfirmQuoteSchema } from '@/lib/validations/api-schemas'

export async function POST(request: NextRequest) {
  try {
    // 🔒 安全檢查：驗證用戶身份
    const auth = await getServerAuth()
    if (!auth.success) {
      return errorResponse('請先登入', 401, ErrorCode.UNAUTHORIZED)
    }

    const validation = await validateBody(request, staffConfirmQuoteSchema)
    if (!validation.success) return validation.error
    const { quote_id, staff_id, staff_name, notes } = validation.data

    const supabase = getSupabaseAdminClient()

    // 呼叫資料庫函數
    const { data, error } = await supabase.rpc('confirm_quote_by_staff', {
      p_quote_id: quote_id,
      p_staff_id: staff_id,
      p_staff_name: staff_name,
      p_notes: notes || undefined,
    })

    if (error) {
      logger.error('業務確認失敗:', error)
      return errorResponse(error.message, 400, ErrorCode.OPERATION_FAILED)
    }

    const result = data as unknown as ConfirmationResult

    if (!result.success) {
      return errorResponse(result.error || '確認失敗', 400, ErrorCode.OPERATION_FAILED)
    }

    logger.log('業務已確認報價單:', result.quote_code)
    return successResponse(result)
  } catch (error) {
    logger.error('業務確認錯誤:', error)
    return ApiError.internal('系統錯誤')
  }
}
