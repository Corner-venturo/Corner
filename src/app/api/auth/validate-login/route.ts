import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import bcrypt from 'bcryptjs'
import { logger } from '@/lib/utils/logger'
import { ApiError, successResponse } from '@/lib/api/response'
import { checkRateLimit } from '@/lib/rate-limit'

interface ValidateLoginRequest {
  username: string
  password: string
  code: string
}

export async function POST(request: NextRequest) {
  try {
    // 🔒 Rate limiting: 10 requests per minute (login attempts)
    const rateLimited = checkRateLimit(request, 'validate-login', 10, 60_000)
    if (rateLimited) return rateLimited

    const body: ValidateLoginRequest = await request.json()
    const { username, password, code } = body

    if (!username || !password || !code) {
      return ApiError.validation('請填寫所有欄位')
    }

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

    // 4. 檢查密碼
    if (!employee.password_hash) {
      return ApiError.unauthorized('請先設定密碼')
    }

    const isValidPassword = await bcrypt.compare(password, employee.password_hash)
    if (!isValidPassword) {
      return ApiError.unauthorized('帳號或密碼錯誤')
    }

    // 5. 回傳員工資料（不含密碼）
    const { password_hash: _, ...employeeData } = employee

    return successResponse({
      employee: employeeData,
      workspaceId: workspace.id,
      workspaceCode: workspace.code,
    })
  } catch (error) {
    logger.error('Validate login error:', error)
    return ApiError.internal('系統錯誤')
  }
}
