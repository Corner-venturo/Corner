import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response'

interface ChangePasswordRequest {
  employee_number: string
  workspace_code: string
  current_password: string
  new_password: string
}

/**
 * 用戶自行更改密碼
 * 使用 Supabase Auth 驗證當前密碼，並更新 Supabase Auth 密碼
 * 不再更新 employees.password_hash（已棄用）
 */
export async function POST(request: NextRequest) {
  try {
    const body: ChangePasswordRequest = await request.json()
    const { employee_number, workspace_code, current_password, new_password } = body

    if (!employee_number || !current_password || !new_password) {
      return errorResponse('缺少必要參數', 400, ErrorCode.MISSING_FIELD)
    }

    if (new_password.length < 8) {
      return errorResponse('密碼至少需要 8 個字元', 400, ErrorCode.VALIDATION_ERROR)
    }

    const supabaseAdmin = getSupabaseAdminClient()

    // 1. 查詢員工資料（取得 ID 和 supabase_user_id）
    let query = supabaseAdmin
      .from('employees')
      .select('id, employee_number, supabase_user_id, workspace_id')
      .ilike('employee_number', employee_number)

    // 如果有 workspace_code，先查詢 workspace_id
    if (workspace_code) {
      const { data: workspace } = await supabaseAdmin
        .from('workspaces')
        .select('id')
        .ilike('code', workspace_code)
        .single()

      if (workspace) {
        query = query.eq('workspace_id', workspace.id)
      }
    }

    const { data: employee, error: empError } = await query.single()

    if (empError || !employee) {
      logger.error('Employee not found:', empError)
      return errorResponse('找不到此員工', 404, ErrorCode.NOT_FOUND)
    }

    // 2. 用 Supabase Auth 驗證當前密碼
    const authEmail = workspace_code
      ? `${workspace_code.toLowerCase()}_${employee_number.toLowerCase()}@venturo.com`
      : `${employee_number.toLowerCase()}@venturo.com`

    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: authEmail,
      password: current_password,
    })

    if (signInError) {
      return errorResponse('目前密碼錯誤', 401, ErrorCode.UNAUTHORIZED)
    }

    // 3. 更新 Supabase Auth 密碼
    if (!employee.supabase_user_id) {
      return errorResponse('此帳號尚未綁定登入系統', 400, ErrorCode.VALIDATION_ERROR)
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      employee.supabase_user_id,
      { password: new_password }
    )

    if (updateError) {
      logger.error('Failed to update password:', updateError)
      return errorResponse('更新密碼失敗', 500, ErrorCode.OPERATION_FAILED)
    }

    // 4. 更新 must_change_password 標記
    await supabaseAdmin
      .from('employees')
      .update({ must_change_password: false })
      .eq('id', employee.id)

    logger.log('✅ Password changed for employee:', employee_number)
    return successResponse({ message: '密碼更新成功' })
  } catch (error) {
    logger.error('Change password error:', error)
    return errorResponse('伺服器錯誤', 500, ErrorCode.INTERNAL_ERROR)
  }
}
