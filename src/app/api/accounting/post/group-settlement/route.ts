import { NextRequest, NextResponse } from 'next/server'
import { postGroupSettlement } from '@/features/erp-accounting/services/posting-service'
import type { PostGroupSettlementRequest } from '@/types/accounting.types'
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

    const requestData = await request.json() as PostGroupSettlementRequest

    if (!requestData.tour_id || !requestData.bank_account_id) {
      return NextResponse.json(
        { success: false, error: '缺少必要欄位' },
        { status: 400 }
      )
    }

    const result = await postGroupSettlement(workspaceId, employeeId, requestData)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    logger.error('結團過帳失敗:', error)
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}
