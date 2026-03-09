import { captureException } from '@/lib/error-tracking'
/**
 * 建立員工 Supabase Auth 帳號的 API Route
 * 使用 Service Role Key 建立 Supabase Auth 用戶
 *
 * 🔒 安全修復 2026-01-12：需要已登入用戶才能建立新帳號
 * 🔒 安全修復 2026-02-19：需要管理員權限
 */

import { logger } from '@/lib/utils/logger'
import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response'
import { getServerAuth } from '@/lib/auth/server-auth'
import { validateBody } from '@/lib/api/validation'
import { createEmployeeAuthSchema } from '@/lib/validations/api-schemas'

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
  return roles?.some(r => r === 'admin' || r === 'super_admin') ?? false
}

export async function POST(request: NextRequest) {
  try {
    const validation = await validateBody(request, createEmployeeAuthSchema)
    if (!validation.success) return validation.error
    const { employee_number, password, workspace_code, email: providedEmail } = validation.data

    const supabaseAdmin = getSupabaseAdminClient()

    // 🔒 安全檢查：判斷是否為系統初始化（建立第一個租戶管理員）
    let isSystemInit = false
    
    // 檢查該 workspace 是否已有員工
    if (workspace_code) {
      const { data: workspace } = await supabaseAdmin
        .from('workspaces')
        .select('id')
        .eq('code', workspace_code)
        .single()

      if (workspace) {
        const { count } = await supabaseAdmin
          .from('employees')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id)

        // 如果該 workspace 沒有任何員工，視為系統初始化
        isSystemInit = (count ?? 0) === 0
      }
    }

    // 已登入用戶建立員工：需要管理員權限
    const auth = await getServerAuth()
    if (auth.success && !isSystemInit) {
      const { data: employee } = await supabaseAdmin
        .from('employees')
        .select('roles')
        .eq('id', auth.data.employeeId)
        .single()

      const roles = employee?.roles as string[] | null
      const isSuperAdmin = roles?.includes('super_admin') ?? false
      const isAdmin = roles?.includes('admin') ?? false

      if (!isSuperAdmin && !isAdmin) {
        return errorResponse('需要管理員權限', 403, ErrorCode.FORBIDDEN)
      }
    }

    // 未登入且非系統初始化：拒絕請求
    if (!auth.success && !isSystemInit) {
      return errorResponse('請先登入才能建立員工帳號', 401, ErrorCode.UNAUTHORIZED)
    }

    // 優先使用前端傳入的真實 email；若無則使用自動生成的格式（向後兼容）
    const email = providedEmail
      ? providedEmail.toLowerCase()
      : workspace_code
        ? `${workspace_code.toLowerCase()}_${employee_number.toLowerCase()}@venturo.com`
        : `${employee_number.toLowerCase()}@venturo.com`

    // 使用 Admin API 建立用戶
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 自動確認 email
    })

    if (error) {
      // 如果用戶已存在，嘗試更新密碼
      if (error.message.includes('already been registered')) {
        logger.log('Auth 用戶已存在，嘗試更新密碼:', email)

        const { data: users } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = users?.users.find(u => u.email === email)

        if (existingUser) {
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            existingUser.id,
            { password }
          )

          if (updateError) {
            logger.error('更新密碼失敗:', updateError)
            return errorResponse(updateError.message, 400, ErrorCode.OPERATION_FAILED)
          }

          logger.log('Auth 密碼已更新:', email)
          return successResponse({ user: existingUser, updated: true })
        }
      }

      logger.error('建立 Auth 用戶失敗:', error)
      return errorResponse(error.message, 400, ErrorCode.OPERATION_FAILED)
    }

    logger.log('Auth 用戶已建立:', email)
    return successResponse({ user: data.user })
  } catch (error) {
    logger.error('建立 Auth 用戶錯誤:', error)
    return errorResponse('Internal server error', 500, ErrorCode.INTERNAL_ERROR)
  }
}
