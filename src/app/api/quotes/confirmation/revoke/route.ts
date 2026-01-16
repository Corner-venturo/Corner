/**
 * 撤銷報價確認 API
 * POST /api/quotes/confirmation/revoke
 */

import { logger } from '@/lib/utils/logger'
import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getServerAuth } from '@/lib/auth/server-auth'
import type { ConfirmationResult } from '@/types/quote.types'
import { successResponse, errorResponse, ApiError, ErrorCode } from '@/lib/api/response'

interface RevokeParams {
  quote_id: string
  staff_id: string
  staff_name: string
  reason: string
}

export async function POST(request: NextRequest) {
  try {
    // 🔒 安全檢查：驗證用戶身份
    const auth = await getServerAuth()
    if (!auth.success) {
      return errorResponse('請先登入', 401, ErrorCode.UNAUTHORIZED)
    }

    const body: RevokeParams = await request.json()
    const { quote_id, staff_id, staff_name, reason } = body

    if (!quote_id || !staff_id || !staff_name || !reason) {
      return ApiError.validation('缺少必要參數（包含撤銷原因）')
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
      return errorResponse(error.message, 400, ErrorCode.OPERATION_FAILED)
    }

    const result = data as unknown as ConfirmationResult

    if (!result.success) {
      return errorResponse(result.error || '撤銷失敗', 400, ErrorCode.OPERATION_FAILED)
    }

    logger.log('報價確認已撤銷')
    return successResponse(result)
  } catch (error) {
    logger.error('撤銷確認錯誤:', error)
    return ApiError.internal('系統錯誤')
  }
}
