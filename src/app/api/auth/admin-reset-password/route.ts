import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response'
import { getServerAuth } from '@/lib/auth/server-auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { validateBody } from '@/lib/api/validation'
import { adminResetPasswordSchema } from '@/lib/validations/api-schemas'

/**
 * 檢查員工是否為管理員或超級管理員
 */
async function checkIsAdmin(employeeId: string): Promise<boolean> {
  const adminClient = getSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('employees')
    .select('roles')
    .eq('id', employeeId)
    .single()

  if (error || !data) return false

  const roles = data.roles as string[] | null
  return roles?.some((r) => r === 'admin' || r === 'super_admin') ?? false
}

/**
 * 管理員重置會員密碼
 * 🔒 安全修復 2026-01-12：需要已登入用戶
 * 🔒 安全修復 2026-02-18：恢復管理員權限檢查
 */
export async function POST(request: NextRequest) {
  try {
    // 🔒 Rate limiting: 5 requests per minute
    const rateLimited = checkRateLimit(request, 'admin-reset-password', 5, 60_000)
    if (rateLimited) return rateLimited

    // 🔒 安全檢查：需要已登入用戶
    const auth = await getServerAuth()
    if (!auth.success) {
      return errorResponse('請先登入', 401, ErrorCode.UNAUTHORIZED)
    }

    // 🔒 管理員權限檢查
    const isAdmin = await checkIsAdmin(auth.data.employeeId)
    if (!isAdmin) {
      return errorResponse('需要管理員權限', 403, ErrorCode.FORBIDDEN)
    }

    const validation = await validateBody(request, adminResetPasswordSchema)
    if (!validation.success) return validation.error
    const { email, new_password } = validation.data

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
