/**
 * 業務確認報價單 API
 * POST /api/quotes/confirmation/staff
 */

import { logger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import type { StaffConfirmParams, ConfirmationResult } from '@/types/quote.types'

export async function POST(request: NextRequest) {
  try {
    const body: StaffConfirmParams = await request.json()
    const { quote_id, staff_id, staff_name, notes } = body

    if (!quote_id || !staff_id || !staff_name) {
      return NextResponse.json<ConfirmationResult>(
        { success: false, error: '缺少必要參數' },
        { status: 400 }
      )
    }

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
      return NextResponse.json<ConfirmationResult>(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    const result = data as unknown as ConfirmationResult

    if (!result.success) {
      return NextResponse.json<ConfirmationResult>(result, { status: 400 })
    }

    logger.log('業務已確認報價單:', result.quote_code)
    return NextResponse.json<ConfirmationResult>(result)
  } catch (error) {
    logger.error('業務確認錯誤:', error)
    return NextResponse.json<ConfirmationResult>(
      { success: false, error: '系統錯誤' },
      { status: 500 }
    )
  }
}
