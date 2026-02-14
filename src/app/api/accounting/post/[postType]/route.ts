import { NextRequest } from 'next/server'
import { postCustomerReceipt } from '@/features/erp-accounting/services/posting-service'
import { postGroupSettlement } from '@/features/erp-accounting/services/posting-service'
import { postSupplierPayment } from '@/features/erp-accounting/services/posting-service'
import type {
  PostCustomerReceiptRequest,
  PostGroupSettlementRequest,
  PostSupplierPaymentRequest,
} from '@/types/accounting.types'
import { logger } from '@/lib/utils/logger'
import { getServerAuth } from '@/lib/auth/server-auth'
import { successResponse, errorResponse, ApiError, ErrorCode } from '@/lib/api/response'

const VALID_POST_TYPES = ['customer-receipt', 'group-settlement', 'supplier-payment'] as const
type PostType = (typeof VALID_POST_TYPES)[number]

function validateRequest(postType: PostType, data: Record<string, unknown>): string | null {
  switch (postType) {
    case 'customer-receipt':
      if (!data['receipt_id'] || !data['amount'] || !data['payment_method']) return '缺少必要欄位'
      return null
    case 'group-settlement':
      if (!data['tour_id'] || !data['bank_account_id']) return '缺少必要欄位'
      return null
    case 'supplier-payment':
      if (!data['payout_id'] || !data['amount'] || !data['bank_account_id']) return '缺少必要欄位'
      return null
  }
}

async function dispatchPost(postType: PostType, employeeId: string, data: unknown) {
  switch (postType) {
    case 'customer-receipt':
      return postCustomerReceipt(employeeId, data as unknown as PostCustomerReceiptRequest)
    case 'group-settlement':
      return postGroupSettlement(employeeId, data as unknown as PostGroupSettlementRequest)
    case 'supplier-payment':
      return postSupplierPayment(employeeId, data as unknown as PostSupplierPaymentRequest)
  }
}

const LOG_LABELS: Record<PostType, string> = {
  'customer-receipt': '客戶收款過帳失敗',
  'group-settlement': '結團過帳失敗',
  'supplier-payment': '供應商付款過帳失敗',
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postType: string }> },
) {
  const { postType } = await params

  if (!VALID_POST_TYPES.includes(postType as PostType)) {
    return errorResponse('Invalid post type', 404, ErrorCode.NOT_FOUND)
  }

  const validPostType = postType as PostType

  try {
    const auth = await getServerAuth()
    if (!auth.success) {
      return errorResponse(auth.error.error, 401, ErrorCode.UNAUTHORIZED)
    }
    const { employeeId } = auth.data

    const requestData: unknown = await request.json()

    const validationError = validateRequest(validPostType, requestData as Record<string, unknown>)
    if (validationError) {
      return ApiError.validation(validationError)
    }

    const result = await dispatchPost(validPostType, employeeId, requestData)

    if (!result.success) {
      return errorResponse(result.error || '過帳失敗', 400, ErrorCode.OPERATION_FAILED)
    }

    return successResponse({
      eventId: result.eventId,
      voucherId: result.voucherId,
      voucherNo: result.voucherNo,
    })
  } catch (error) {
    logger.error(`${LOG_LABELS[validPostType]}:`, error)
    return ApiError.internal('伺服器錯誤')
  }
}
