/**
 * 作廢代轉發票 API
 * POST /api/travel-invoice/void
 */

import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { voidInvoice } from '@/lib/newebpay'
import { logger } from '@/lib/utils/logger'
import { successResponse, errorResponse, ApiError, ErrorCode } from '@/lib/api/response'
import { getServerAuth } from '@/lib/auth/server-auth'
import { validateBody } from '@/lib/api/validation'
import { voidInvoiceSchema } from '@/lib/validations/api-schemas'

export async function POST(request: NextRequest) {
  // 認證檢查
  const auth = await getServerAuth()
  if (!auth.success) {
    return ApiError.unauthorized('請先登入')
  }

  try {
    const validation = await validateBody(request, voidInvoiceSchema)
    if (!validation.success) return validation.error
    const { invoiceId, voidReason, operatedBy } = validation.data

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
      return ApiError.validation('只能作廢已開立的發票')
    }

    // 確保必要欄位存在
    if (!invoice.invoice_number || !invoice.invoice_date) {
      return ApiError.validation('發票資料不完整')
    }

    // 呼叫藍新 API
    const result = await voidInvoice({
      invoiceNumber: invoice.invoice_number,
      invoiceDate: invoice.invoice_date,
      voidReason,
    })

    if (!result.success) {
      return errorResponse(result.message || '作廢失敗', 400, ErrorCode.EXTERNAL_API_ERROR)
    }

    // 更新資料庫
    const { data, error: updateError } = await supabase
      .from('travel_invoices')
      .update({
        status: 'voided',
        void_date: new Date().toISOString(),
        void_reason: voidReason,
        voided_by: operatedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .select()
      .single()

    if (updateError) {
      logger.error('更新發票狀態失敗:', updateError)
      return successResponse({
        warning: '發票已作廢，但更新狀態時發生錯誤，請手動更新發票狀態',
      })
    }

    return successResponse(data)
  } catch (error) {
    logger.error('作廢發票錯誤:', error)
    return ApiError.internal(error instanceof Error ? error.message : '作廢失敗')
  }
}
