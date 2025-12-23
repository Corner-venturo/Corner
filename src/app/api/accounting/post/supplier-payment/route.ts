import { NextRequest, NextResponse } from 'next/server'
import { postSupplierPayment } from '@/features/erp-accounting/services/posting-service'
import type { PostSupplierPaymentRequest } from '@/types/accounting.types'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as PostSupplierPaymentRequest & {
      workspace_id: string
      user_id: string
    }

    const { workspace_id, user_id, ...requestData } = body

    if (!workspace_id || !user_id) {
      return NextResponse.json(
        { success: false, error: '缺少 workspace_id 或 user_id' },
        { status: 400 }
      )
    }

    if (!requestData.payout_id || !requestData.amount || !requestData.bank_account_id) {
      return NextResponse.json(
        { success: false, error: '缺少必要欄位' },
        { status: 400 }
      )
    }

    const result = await postSupplierPayment(workspace_id, user_id, requestData)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    logger.error('供應商付款過帳失敗:', error)
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}
