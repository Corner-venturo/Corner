import { NextRequest, NextResponse } from 'next/server'
import { reverseVoucher } from '@/features/erp-accounting/services/posting-service'
import { logger } from '@/lib/utils/logger'
import { getServerAuth } from '@/lib/auth/server-auth'

export async function POST(request: NextRequest) {
  try {
    // 🔒 認證：從 session 取得 workspaceId 和 employeeId
    const auth = await getServerAuth()
    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: auth.error.error },
        { status: 401 }
      )
    }
    const { workspaceId, employeeId } = auth.data

    const body = await request.json() as {
      voucher_id: string
      reason: string
    }

    const { voucher_id, reason } = body

    if (!voucher_id || !reason) {
      return NextResponse.json(
        { success: false, error: '缺少傳票 ID 或反沖原因' },
        { status: 400 }
      )
    }

    const result = await reverseVoucher(workspaceId, employeeId, voucher_id, reason)

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
