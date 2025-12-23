import { NextRequest, NextResponse } from 'next/server'
import { reverseVoucher } from '@/features/erp-accounting/services/posting-service'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      workspace_id: string
      user_id: string
      voucher_id: string
      reason: string
    }

    const { workspace_id, user_id, voucher_id, reason } = body

    if (!workspace_id || !user_id) {
      return NextResponse.json(
        { success: false, error: '缺少 workspace_id 或 user_id' },
        { status: 400 }
      )
    }

    if (!voucher_id || !reason) {
      return NextResponse.json(
        { success: false, error: '缺少傳票 ID 或反沖原因' },
        { status: 400 }
      )
    }

    const result = await reverseVoucher(workspace_id, user_id, voucher_id, reason)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    logger.error('反沖傳票失敗:', error)
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}
