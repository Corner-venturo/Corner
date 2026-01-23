import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response'
import { getServerAuth } from '@/lib/auth/server-auth'

/**
 * 重設員工密碼 API
 * 只更新 Supabase Auth 密碼（不更新 password_hash）
 */
export async function POST(request: NextRequest) {
  try {
    // 🔒 安全檢查：需要已登入用戶
    const auth = await getServerAuth()
    if (!auth.success) {
      return errorResponse('請先登入', 401, ErrorCode.UNAUTHORIZED)
    }

    const { employee_id, new_password } = await request.json()

    if (!employee_id || !new_password) {
      return errorResponse('缺少必要參數', 400, ErrorCode.MISSING_FIELD)
    }

    if (new_password.length < 8) {
      return errorResponse('密碼至少需要 8 個字元', 400, ErrorCode.VALIDATION_ERROR)
    }

    const supabaseAdmin = getSupabaseAdminClient()

    // 1. 查詢員工的 supabase_user_id
    const { data: employee, error: empError } = await supabaseAdmin
      .from('employees')
      .select('id, supabase_user_id, display_name')
      .eq('id', employee_id)
      .single()

    if (empError || !employee) {
      return errorResponse('找不到此員工', 404, ErrorCode.NOT_FOUND)
    }

    if (!employee.supabase_user_id) {
      return errorResponse('此員工尚未綁定登入帳號', 400, ErrorCode.VALIDATION_ERROR)
    }

    // 2. 更新 Supabase Auth 密碼
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      employee.supabase_user_id,
      { password: new_password }
    )

    if (updateError) {
      logger.error('Update password error:', updateError)
      return errorResponse('重置密碼失敗：' + updateError.message, 500, ErrorCode.OPERATION_FAILED)
    }

    logger.log(`✅ 已重設 ${employee.display_name} 的密碼`)
    return successResponse({ message: '密碼已更新' })
  } catch (error) {
    logger.error('Reset employee password error:', error)
    return errorResponse('伺服器錯誤', 500, ErrorCode.INTERNAL_ERROR)
  }
}
