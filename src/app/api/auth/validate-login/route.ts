import { captureException } from '@/lib/error-tracking'
import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { ApiError, successResponse } from '@/lib/api/response'
import { checkRateLimit } from '@/lib/rate-limit'
import { validateBody } from '@/lib/api/validation'
import { validateLoginSchema } from '@/lib/validations/api-schemas'

export async function POST(request: NextRequest) {
  try {
    // 🔒 Rate limiting: 10 requests per minute (login attempts)
    const rateLimited = checkRateLimit(request, 'validate-login', 10, 60_000)
    if (rateLimited) return rateLimited

    const validation = await validateBody(request, validateLoginSchema)
    if (!validation.success) return validation.error
    const { username, password, code } = validation.data

    const supabase = getSupabaseAdminClient()

    // 1. 查詢 workspace（統一大寫）
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id, code')
      .eq('code', code.trim().toUpperCase())
      .maybeSingle()

    if (wsError) {
      logger.error('Workspace query error:', wsError)
      return ApiError.internal('系統錯誤')
    }

    if (!workspace) {
      return ApiError.validation('找不到此代號')
    }

    // 2. 查詢員工（大小寫不敏感）
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('*')
      .ilike('employee_number', username)
      .eq('workspace_id', workspace.id)
      .maybeSingle()

    if (empError) {
      logger.error('Employee query error:', empError)
      return ApiError.internal('系統錯誤')
    }

    if (!employee) {
      return ApiError.unauthorized('帳號或密碼錯誤')
    }

    // 3. 檢查帳號狀態
    if (employee.status === 'terminated') {
      return ApiError.unauthorized('此帳號已停用')
    }

    // 4. 查詢 auth email（優先從 auth.users 取，fallback 用 employees.email）
    let authEmail: string | undefined

    if (employee.supabase_user_id) {
      const { data: authUser } = await supabase.auth.admin.getUserById(
        employee.supabase_user_id
      )
      authEmail = authUser?.user?.email ?? undefined
    }

    if (!authEmail && employee.email) {
      authEmail = employee.email
    }

    // fallback：向後兼容舊帳號
    if (!authEmail) {
      authEmail = `${code.toLowerCase()}_${username.toLowerCase()}@venturo.com`
    }

    // 5. 用 Supabase Auth 驗證密碼
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password,
    })

    if (signInError) {
      return ApiError.unauthorized('帳號或密碼錯誤')
    }

    // 6. 回傳員工資料（不含密碼）+ auth email
    const { password_hash: _, ...employeeData } = employee

    return successResponse({
      employee: employeeData,
      workspaceId: workspace.id,
      workspaceCode: workspace.code,
      authEmail,
    })
  } catch (error) {
    logger.error('Validate login error:', error)
    captureException(error, { module: 'auth.validate-login' })
    return ApiError.internal('系統錯誤')
  }
}
