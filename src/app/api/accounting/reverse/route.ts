import { NextRequest } from 'next/server'
import { reverseVoucher } from '@/features/erp-accounting/services/posting-service'
import { logger } from '@/lib/utils/logger'
import { getServerAuth } from '@/lib/auth/server-auth'
import { successResponse, errorResponse, ApiError, ErrorCode } from '@/lib/api/response'

export async function POST(request: NextRequest) {
  try {
    // 🔒 認證：從 session 取得 workspaceId 和 employeeId
    const auth = await getServerAuth()
    if (!auth.success) {
      return errorResponse(auth.error.error, 401, ErrorCode.UNAUTHORIZED)
    }
    const { workspaceId, employeeId } = auth.data

    const body = await request.json() as {
      voucher_id: string
      reason: string
    }

    const { voucher_id, reason } = body

    if (!voucher_id || !reason) {
      return ApiError.validation('缺少傳票 ID 或反沖原因')
    }

    const result = await reverseVoucher(workspaceId, employeeId, voucher_id, reason)

    if (!result.success) {
      return errorResponse(result.error || '反沖失敗', 400, ErrorCode.OPERATION_FAILED)
    }

    return successResponse({
      eventId: result.eventId,
      voucherId: result.voucherId,
      voucherNo: result.voucherNo,
    })
  } catch (error) {
    logger.error('反沖傳票失敗:', error)
    return ApiError.internal('伺服器錯誤')
  }
}
