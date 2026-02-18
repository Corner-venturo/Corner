import { captureException } from '@/lib/error-tracking'
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
import { validateBody } from '@/lib/api/validation'
import { issueInvoiceSchema } from '@/lib/validations/api-schemas'

export async function POST(request: NextRequest) {
  // 認證檢查
  const auth = await getServerAuth()
  if (!auth.success) {
    return ApiError.unauthorized('請先登入')
  }

  try {
    const validation = await validateBody(request, issueInvoiceSchema)
    if (!validation.success) return validation.error
    const { invoice_date, total_amount, tax_type, buyerInfo, items, order_id, orders, tour_id, created_by, workspace_id } = validation.data

    // 支援向後兼容：如果只有 order_id，轉換為 orders 格式
    const orderItems = orders || (order_id ? [{ order_id, amount: total_amount }] : [])

    // 取得 Supabase client
    const supabase = getSupabaseAdminClient()

    // 如果沒有 workspace_id，從 tour 取得
    let finalWorkspaceId = workspace_id
    if (!finalWorkspaceId && tour_id) {
      const { data: tourData } = await supabase
        .from('tours')
        .select('workspace_id')
        .eq('id', tour_id)
        .single()
      finalWorkspaceId = tourData?.workspace_id
    }

    // 記錄訂單可開金額（僅供追蹤，不阻擋開立）
    for (const orderItem of orderItems) {
      // 計算訂單可開金額
      const { data: orderData, error: orderError } = await supabase
        .rpc('get_order_invoiceable_amount', { p_order_id: orderItem.order_id })

      if (orderError) {
        logger.warn('查詢訂單可開金額失敗，繼續開立:', orderError)
      } else {
        const invoiceableAmount = orderData as number
        if (orderItem.amount > invoiceableAmount) {
          const { data: order } = await supabase
            .from('orders')
            .select('order_number')
            .eq('id', orderItem.order_id)
            .single()

          // 僅記錄警告，不阻擋開立（前端已確認）
          logger.warn(
            `[超開發票] 訂單 ${order?.order_number || orderItem.order_id} ` +
            `可開金額 ${invoiceableAmount}，實際開立 ${orderItem.amount}`
          )
        }
      }
    }

    // 檢查總金額是否一致
    const totalFromOrders = orderItems.reduce((sum: number, o: { amount: number }) => sum + o.amount, 0)
    if (Math.abs(totalFromOrders - total_amount) > 0.01) {
      return ApiError.validation('總金額與訂單分攤金額不符')
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

    // 儲存到資料庫
    // 預約開立的發票狀態為 'scheduled'，即時開立為 'issued'
    const isScheduled = result.data!.isScheduled || false
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
      status: isScheduled ? 'scheduled' : 'issued',
      random_num: result.data!.randomNum,
      barcode: result.data!.barcode || null,
      qrcode_l: result.data!.qrcodeL || null,
      qrcode_r: result.data!.qrcodeR || null,
      order_id: order_id || null, // 向後兼容
      tour_id: tour_id || null,
      workspace_id: finalWorkspaceId || null,
      is_batch: orderItems.length > 1,
      created_by: created_by || auth.data.employeeId,
    }

    const { data: invoiceRecord, error } = await supabase
      .from('travel_invoices')
      .insert(invoiceData)
      .select()
      .single()

    if (error) {
      logger.error('儲存發票失敗:', error)
    captureException(error, { module: 'travel-invoice.issue' })
      return successResponse({
        ...result.data,
        warning: '發票已開立，但儲存時發生錯誤，請手動記錄此發票資訊',
      })
    }

    // 建立發票-訂單關聯
    if (orderItems.length > 0 && finalWorkspaceId) {
        const invoiceOrdersData = orderItems.map((o: { order_id: string; amount: number }) => ({
          invoice_id: invoiceRecord.id,
          order_id: o.order_id,
          amount: o.amount,
          workspace_id: finalWorkspaceId!,
          created_by: created_by || auth.data.employeeId,
        }))

        const { error: ioError } = await supabase
          .from('invoice_orders')
          .insert(invoiceOrdersData)

        if (ioError) {
        logger.error('建立發票-訂單關聯失敗:', ioError)
      }
    } else if (orderItems.length > 0) {
      logger.warn('無法取得 workspace_id，跳過建立發票-訂單關聯')
    }

    return successResponse({
      id: invoiceRecord.id,
      transactionNo: result.data!.transactionNo,
      invoiceNumber: result.data!.invoiceNumber,
      randomNum: result.data!.randomNum,
      isScheduled,
      message: result.message,
    })
  } catch (error) {
    logger.error('開立發票錯誤:', error)
    captureException(error, { module: 'travel-invoice.issue' })
    return ApiError.internal(error instanceof Error ? error.message : '開立失敗')
  }
}
