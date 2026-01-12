import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import bcrypt from 'bcryptjs'
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
 * 🔒 安全說明 2026-01-12：此 API 透過驗證目前密碼來確認身份
 * 因為用戶可能在首次登入被要求更改密碼，此時尚未完成認證流程
 * 所以不使用 getServerAuth()，而是透過 current_password 驗證
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

    // 1. 查詢員工資料
    let query = supabaseAdmin
      .from('employees')
      .select('id, employee_number, password_hash, workspace_id')
      .ilike('employee_number', employee_number)

    // 如果有 workspace_code，先查詢 workspace_id
    if (workspace_code) {
      const { data: workspace } = await supabaseAdmin
        .from('workspaces')
        .select('id')
        .eq('code', workspace_code.toLowerCase())
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

    // 2. 驗證目前密碼
    if (!employee.password_hash) {
      return errorResponse('帳號尚未設定密碼', 400, ErrorCode.VALIDATION_ERROR)
    }

    const isValidPassword = await bcrypt.compare(current_password, employee.password_hash)
    if (!isValidPassword) {
      return errorResponse('目前密碼錯誤', 401, ErrorCode.UNAUTHORIZED)
    }

    // 3. Hash 新密碼
    const newPasswordHash = await bcrypt.hash(new_password, 10)

    // 4. 更新 employees 表（密碼 + must_change_password）
    const { error: updateError } = await supabaseAdmin
      .from('employees')
      .update({
        password_hash: newPasswordHash,
        must_change_password: false, // 重要：設為 false
      })
      .eq('id', employee.id)

    if (updateError) {
      logger.error('Failed to update employee password:', updateError)
      return errorResponse('更新密碼失敗', 500, ErrorCode.DATABASE_ERROR)
    }

    // 5. 同步更新 Supabase Auth 密碼
    // 嘗試新格式和舊格式的 email
    const newFormatEmail = workspace_code
      ? `${workspace_code.toLowerCase()}_${employee_number.toLowerCase()}@venturo.com`
      : `${employee_number.toLowerCase()}@venturo.com`
    const oldFormatEmail = `${employee_number.toLowerCase()}@venturo.com`

    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      logger.warn('Failed to list auth users:', listError)
      // 不阻止流程，因為 employees 表已更新
    } else {
      // 找到對應的 auth user
      let authUser = users.users.find(
        u => u.email && u.email.toLowerCase() === newFormatEmail.toLowerCase()
      )

      if (!authUser && newFormatEmail !== oldFormatEmail) {
        authUser = users.users.find(
          u => u.email && u.email.toLowerCase() === oldFormatEmail.toLowerCase()
        )
      }

      if (authUser) {
        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
          authUser.id,
          { password: new_password }
        )

        if (authUpdateError) {
          logger.warn('Failed to update Supabase Auth password:', authUpdateError)
          // 不阻止流程，因為 employees 表已更新
        } else {
          logger.log('✅ Supabase Auth password synced for:', authUser.email)
        }
      } else {
        logger.warn('No auth user found for:', newFormatEmail, 'or', oldFormatEmail)
      }
    }

    logger.log('✅ Password changed for employee:', employee_number)
    return successResponse({ message: '密碼更新成功' })
  } catch (error) {
    logger.error('Change password error:', error)
    return errorResponse('伺服器錯誤', 500, ErrorCode.INTERNAL_ERROR)
  }
}
