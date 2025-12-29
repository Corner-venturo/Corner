/**
 * 報價確認歷史記錄 API
 * GET /api/quotes/confirmation/logs?quote_id=xxx
 */

import { logger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const quoteId = searchParams.get('quote_id')

    if (!quoteId) {
      return NextResponse.json(
        { success: false, error: '缺少報價單 ID' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase
      .from('quote_confirmation_logs')
      .select('*')
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('取得確認記錄失敗:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      logs: data || [],
    })
  } catch (error) {
    logger.error('取得確認記錄錯誤:', error)
    return NextResponse.json(
      { success: false, error: '系統錯誤' },
      { status: 500 }
    )
  }
}
