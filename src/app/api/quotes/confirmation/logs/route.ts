/**
 * 報價確認歷史記錄 API
 * GET /api/quotes/confirmation/logs?quote_id=xxx
 */

import { logger } from '@/lib/utils/logger'
import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const quoteId = searchParams.get('quote_id')

    if (!quoteId) {
      return errorResponse('缺少報價單 ID', 400, ErrorCode.MISSING_FIELD)
    }

    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase
      .from('quote_confirmation_logs')
      .select('*')
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('取得確認記錄失敗:', error)
      return errorResponse(error.message, 400, ErrorCode.DATABASE_ERROR)
    }

    return successResponse({ logs: data || [] })
  } catch (error) {
    logger.error('取得確認記錄錯誤:', error)
    return errorResponse('系統錯誤', 500, ErrorCode.INTERNAL_ERROR)
  }
}
