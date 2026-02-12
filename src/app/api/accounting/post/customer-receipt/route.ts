import { NextRequest } from 'next/server'
import { postCustomerReceipt } from '@/features/erp-accounting/services/posting-service'
import type { PostCustomerReceiptRequest } from '@/types/accounting.types'
import { logger } from '@/lib/utils/logger'
import { getServerAuth } from '@/lib/auth/server-auth'
import { successResponse, errorResponse, ApiError, ErrorCode } from '@/lib/api/response'

export async function POST(request: NextRequest) {
  try {
    // 🔒 認證：從 session 取得 employeeId
    const auth = await getServerAuth()
    if (!auth.success) {
      return errorResponse(auth.error.error, 401, ErrorCode.UNAUTHORIZED)
    }
    const { employeeId } = auth.data

    const requestData = await request.json() as PostCustomerReceiptRequest

    if (!requestData.receipt_id || !requestData.amount || !requestData.payment_method) {
      return ApiError.validation('缺少必要欄位')
    }

    const result = await postCustomerReceipt(employeeId, requestData)

    if (!result.success) {
      return errorResponse(result.error || '過帳失敗', 400, ErrorCode.OPERATION_FAILED)
    }

    return successResponse({
      eventId: result.eventId,
      voucherId: result.voucherId,
      voucherNo: result.voucherNo,
    })
  } catch (error) {
    logger.error('客戶收款過帳失敗:', error)
    return ApiError.internal('伺服器錯誤')
  }
}
