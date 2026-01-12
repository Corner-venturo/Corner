import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response'
import { getServerAuth } from '@/lib/auth/server-auth'

/**
 * 管理員重置會員密碼
 * 🔒 安全修復 2026-01-12：需要已登入用戶（未來應限制為管理員）
 */
export async function POST(request: NextRequest) {
  try {
    // 🔒 安全檢查：需要已登入用戶
    const auth = await getServerAuth()
    if (!auth.success) {
      return errorResponse('請先登入', 401, ErrorCode.UNAUTHORIZED)
    }

    // [Planned] 管理員權限檢查 - 待 RBAC 模組完成後啟用
    // const isAdmin = await checkIsAdmin(auth.data.employeeId)
    // if (!isAdmin) {
    //   return errorResponse('需要管理員權限', 403, ErrorCode.FORBIDDEN)
    // }

    const { email, new_password } = await request.json()

    if (!email || !new_password) {
      return errorResponse('缺少必要參數', 400, ErrorCode.MISSING_FIELD)
    }

    if (new_password.length < 6) {
      return errorResponse('密碼至少需要 6 個字元', 400, ErrorCode.VALIDATION_ERROR)
    }

    const supabaseAdmin = getSupabaseAdminClient()

    // 先透過 email 找到使用者
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      logger.error('List users error:', listError)
      return errorResponse('查詢使用者失敗', 500, ErrorCode.DATABASE_ERROR)
    }

    const user = users.users.find((u) => u.email === email)

    if (!user) {
      return errorResponse('找不到此電子郵件的使用者', 404, ErrorCode.NOT_FOUND)
    }

    // 使用 admin API 更新密碼
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: new_password }
    )

    if (updateError) {
      logger.error('Update password error:', updateError)
      return errorResponse('重置密碼失敗：' + updateError.message, 500, ErrorCode.OPERATION_FAILED)
    }

    return successResponse({ message: '密碼已重置成功' })
  } catch (error) {
    logger.error('Admin reset password error:', error)
    return errorResponse('伺服器錯誤', 500, ErrorCode.INTERNAL_ERROR)
  }
}
