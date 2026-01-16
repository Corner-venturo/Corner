/**
 * 查詢代轉發票 API
 * GET /api/travel-invoice/query
 */

import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { successResponse, ApiError } from '@/lib/api/response'
import { getServerAuth } from '@/lib/auth/server-auth'

export async function GET(request: NextRequest) {
  // 認證檢查
  const auth = await getServerAuth()
  if (!auth.success) {
    return ApiError.unauthorized('請先登入')
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const status = searchParams.get('status')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const supabase = getSupabaseAdminClient()

    let query = supabase
      .from('travel_invoices')
      .select('*', { count: 'exact' })

    // 單筆查詢
    if (id) {
      query = query.eq('id', id)
    }

    // 狀態篩選
    if (status) {
      query = query.eq('status', status)
    }

    // 日期範圍
    if (startDate) {
      query = query.gte('invoice_date', startDate)
    }
    if (endDate) {
      query = query.lte('invoice_date', endDate)
    }

    // 排序和分頁
    query = query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    const { data, error, count } = await query

    if (error) {
      logger.error('查詢發票失敗:', error)
      return ApiError.database('查詢失敗')
    }

    // 轉換資料格式以符合前端期望
    const formattedData = (data || []).map(invoice => ({
      id: invoice.id,
      transactionNo: invoice.transaction_no,
      merchantId: invoice.merchant_id || '',
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.invoice_date,
      total_amount: invoice.total_amount,
      tax_type: invoice.tax_type,
      buyerInfo: invoice.buyer_info || {
        buyerName: invoice.buyer_name,
        buyerUBN: invoice.buyer_ubn,
        buyerEmail: invoice.buyer_email,
        buyerMobile: invoice.buyer_mobile,
      },
      items: invoice.items || [],
      status: invoice.status,
      randomNum: invoice.random_num,
      barcode: invoice.barcode,
      qrcodeL: invoice.qrcode_l,
      qrcodeR: invoice.qrcode_r,
      voidDate: invoice.void_date,
      voidReason: invoice.void_reason,
      allowanceDate: invoice.allowance_date,
      allowanceAmount: invoice.allowance_amount,
      allowanceItems: invoice.allowance_items,
      order_id: invoice.order_id,
      tour_id: invoice.tour_id,
      created_by: invoice.created_by,
      created_at: invoice.created_at,
      updated_at: invoice.updated_at,
    }))

    return successResponse({
      data: formattedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    logger.error('查詢發票錯誤:', error)
    return ApiError.internal(error instanceof Error ? error.message : '查詢失敗')
  }
}
