import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response'

interface UnlockRequest {
  password: string
  reason?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tourId } = await params
    const body: UnlockRequest = await request.json()
    const { password, reason } = body

    if (!password) {
      return errorResponse('請輸入密碼', 400, ErrorCode.MISSING_FIELD)
    }

    // 從 cookie 取得當前用戶 session
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse('未登入', 401, ErrorCode.UNAUTHORIZED)
    }

    const token = authHeader.split(' ')[1]
    const supabaseAdmin = getSupabaseAdminClient()

    // 驗證 token 並取得用戶資訊
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return errorResponse('無效的認證', 401, ErrorCode.UNAUTHORIZED)
    }

    // 使用用戶的 email 和輸入的密碼進行驗證
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email!,
      password: password,
    })

    if (signInError) {
      return errorResponse('密碼錯誤', 403, ErrorCode.FORBIDDEN)
    }

    // 檢查用戶對此團的權限 (從 Itinerary_Permissions 或 employees 表)
    // 這裡簡化處理，實際可以加入更複雜的權限檢查
    const { data: tour, error: tourError } = await supabaseAdmin
      .from('tours')
      .select('id, status')
      .eq('id', tourId)
      .single()

    if (tourError || !tour) {
      return errorResponse('找不到此團', 404, ErrorCode.NOT_FOUND)
    }

    // 檢查團是否已鎖定（進行中）
    if (tour.status !== '進行中') {
      return errorResponse('此團未處於鎖定狀態', 400, ErrorCode.VALIDATION_ERROR)
    }

    // 解鎖：更新狀態為「提案」
    const { error: updateError } = await supabaseAdmin
      .from('tours')
      .update({
        status: '提案',
        last_unlocked_at: new Date().toISOString(),
        last_unlocked_by: user.id,
        modification_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tourId)

    if (updateError) {
      logger.error('Error unlocking tour:', updateError)
      return errorResponse('解鎖失敗', 500, ErrorCode.DATABASE_ERROR)
    }

    return successResponse({ message: '已解鎖，可進行修改' })
  } catch (error) {
    logger.error('Unlock API error:', error)
    return errorResponse('伺服器錯誤', 500, ErrorCode.INTERNAL_ERROR)
  }
}
