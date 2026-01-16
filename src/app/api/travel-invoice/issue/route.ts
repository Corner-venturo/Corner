/**
 * 開立代轉發票 API
 * POST /api/travel-invoice/issue
 */

import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { issueInvoice } from '@/lib/newebpay'
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
    const { invoice_date, total_amount, tax_type, buyerInfo, items, order_id, tour_id, created_by } = body

    // 驗證必要欄位
    if (!invoice_date || !total_amount || !buyerInfo?.buyerName || !items?.length) {
      return ApiError.validation('缺少必要欄位')
    }

    // 呼叫藍新 API
    const result = await issueInvoice({
      invoiceDate: invoice_date,
      totalAmount: total_amount,
      taxType: tax_type || 'dutiable',
      buyerInfo,
      items,
    })

    if (!result.success) {
      return errorResponse(result.message || '開立失敗', 400, ErrorCode.EXTERNAL_API_ERROR)
    }

    // 儲存到資料庫（使用單例）
    const supabase = getSupabaseAdminClient()

    const invoiceData = {
      transaction_no: result.data!.transactionNo,
      invoice_number: result.data!.invoiceNumber,
      invoice_date,
      total_amount,
      tax_type: tax_type || 'dutiable',
      buyer_name: buyerInfo.buyerName,
      buyer_ubn: buyerInfo.buyerUBN || null,
      buyer_email: buyerInfo.buyerEmail || null,
      buyer_mobile: buyerInfo.buyerMobile || null,
      buyer_info: buyerInfo,
      items,
      status: 'issued',
      random_num: result.data!.randomNum,
      barcode: result.data!.barcode || null,
      qrcode_l: result.data!.qrcodeL || null,
      qrcode_r: result.data!.qrcodeR || null,
      order_id: order_id || null,
      tour_id: tour_id || null,
      created_by,
    }

    const { data, error } = await supabase
      .from('travel_invoices')
      .insert(invoiceData)
      .select()
      .single()

    if (error) {
      logger.error('儲存發票失敗:', error)
      // 發票已開立但儲存失敗，仍返回成功但記錄警告
      return successResponse({
        ...result.data,
        warning: '發票已開立，但儲存時發生錯誤，請手動記錄此發票資訊',
      })
    }

    return successResponse({
      id: data.id,
      transactionNo: result.data!.transactionNo,
      invoiceNumber: result.data!.invoiceNumber,
      randomNum: result.data!.randomNum,
    })
  } catch (error) {
    logger.error('開立發票錯誤:', error)
    return ApiError.internal(error instanceof Error ? error.message : '開立失敗')
  }
}
