/**
 * 開立折讓 API
 * POST /api/travel-invoice/allowance
 */

import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { issueAllowance } from '@/lib/newebpay'
import { logger } from '@/lib/utils/logger'
import { successResponse, errorResponse, ApiError, ErrorCode } from '@/lib/api/response'
import { getServerAuth } from '@/lib/auth/server-auth'

export async function POST(request: NextRequest) {
  // 認證檢查
  const auth = await getServerAuth()
  if (!auth.success) {
    return ApiError.unauthorized('請先登入')
  }

  try {
    const body = await request.json()
    const { invoiceId, allowanceAmount, allowanceItems, operatedBy } = body

    // 驗證必要欄位
    if (!invoiceId || !allowanceAmount || !allowanceItems?.length) {
      return ApiError.validation('缺少必要欄位')
    }

    const supabase = getSupabaseAdminClient()

    // 取得發票資訊
    const { data: invoice, error: fetchError } = await supabase
      .from('travel_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (fetchError || !invoice) {
      return ApiError.notFound('發票')
    }

    if (invoice.status !== 'issued') {
      return ApiError.validation('只能對已開立的發票開立折讓')
    }

    // 確保必要欄位存在
    if (!invoice.invoice_number || !invoice.invoice_date) {
      return ApiError.validation('發票資料不完整')
    }

    // 呼叫藍新 API
    const result = await issueAllowance({
      invoiceNumber: invoice.invoice_number,
      invoiceDate: invoice.invoice_date,
      allowanceAmount,
      items: allowanceItems,
    })

    if (!result.success) {
      return errorResponse(result.message || '開立折讓失敗', 400, ErrorCode.EXTERNAL_API_ERROR)
    }

    // 更新資料庫
    const { data, error: updateError } = await supabase
      .from('travel_invoices')
      .update({
        status: 'allowance',
        allowance_date: new Date().toISOString(),
        allowance_amount: allowanceAmount,
        allowance_items: allowanceItems,
        allowance_no: result.data?.allowanceNo,
        allowanced_by: operatedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .select()
      .single()

    if (updateError) {
      logger.error('更新發票狀態失敗:', updateError)
      return successResponse({
        ...result.data,
        warning: '折讓已開立，但更新狀態時發生錯誤，請手動更新發票狀態',
      })
    }

    return successResponse(data)
  } catch (error) {
    logger.error('開立折讓錯誤:', error)
    return ApiError.internal(error instanceof Error ? error.message : '開立折讓失敗')
  }
}
