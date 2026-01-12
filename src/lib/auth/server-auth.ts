/**
 * 統一的 Server 端認證服務
 *
 * 所有 Server Actions 都應該使用這個服務來取得認證資訊
 * 內建 fallback 機制：優先從 user_metadata 讀取，否則從 employees 表查詢
 */

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { User } from '@supabase/supabase-js'

export interface ServerAuthResult {
  user: User
  workspaceId: string
  employeeId: string
}

export interface ServerAuthError {
  error: string
  code: 'NOT_AUTHENTICATED' | 'NO_WORKSPACE' | 'EMPLOYEE_NOT_FOUND'
}

type AuthResult =
  | { success: true; data: ServerAuthResult }
  | { success: false; error: ServerAuthError }

/**
 * 取得當前登入用戶的認證資訊
 *
 * 使用方式：
 * ```ts
 * const auth = await getServerAuth()
 * if (!auth.success) {
 *   return { error: auth.error.error }
 * }
 * const { user, workspaceId, employeeId } = auth.data
 * ```
 */
export async function getServerAuth(): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient()

  // 1. 取得 Supabase Auth 用戶
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: {
        error: '請先登入',
        code: 'NOT_AUTHENTICATED'
      }
    }
  }

  // 記錄 auth user 資訊以便除錯
  const { logger } = await import('@/lib/utils/logger')
  logger.log('🔍 getServerAuth - auth user:', {
    auth_uid: user.id?.substring(0, 8),
    auth_email: user.email,
    metadata: user.user_metadata,
  })

  // 2. 嘗試從 user_metadata 取得 workspace_id（快速路徑）
  let workspaceId = user.user_metadata?.workspace_id as string | undefined
  let employeeId = user.user_metadata?.employee_id as string | undefined

  // 3. 如果 user_metadata 沒有，從 employees 表查詢（fallback）
  // 使用 admin client 繞過 RLS，確保能查到員工資料
  if (!workspaceId || !employeeId) {
    const adminClient = getSupabaseAdminClient()

    // 先用 supabase_user_id 查
    let { data: employee } = await adminClient
      .from('employees')
      .select('id, workspace_id, supabase_user_id')
      .eq('supabase_user_id', user.id)
      .single()

    // 如果找不到，用 id 查（有些系統 employee.id = auth.uid）
    if (!employee) {
      const { data: emp2 } = await adminClient
        .from('employees')
        .select('id, workspace_id, supabase_user_id')
        .eq('id', user.id)
        .single()
      employee = emp2
    }

    // 如果還是找不到，用 email 查（最後的備用方案）
    if (!employee && user.email) {
      // 方案 A: 用個人 email 查
      const { data: emp3 } = await adminClient
        .from('employees')
        .select('id, workspace_id, supabase_user_id')
        .eq('personal_info->>email', user.email)
        .single()

      if (emp3) {
        employee = emp3
      } else {
        // 方案 B: 解析 auth email 格式 ({workspace}_{employee_number}@venturo.com 或 {employee_number}@venturo.com)
        const emailMatch = user.email.match(/^(?:([A-Z]+)_)?([A-Z]\d+)@venturo\.com$/i)
        if (emailMatch) {
          const [, workspaceCode, employeeNumber] = emailMatch

          let query = adminClient
            .from('employees')
            .select('id, workspace_id, supabase_user_id')
            .eq('employee_number', employeeNumber.toUpperCase())

          // 如果有 workspace code，加入 workspace 過濾
          if (workspaceCode) {
            const { data: workspace } = await adminClient
              .from('workspaces')
              .select('id')
              .eq('code', workspaceCode.toUpperCase())
              .single()

            if (workspace) {
              query = query.eq('workspace_id', workspace.id)
            }
          }

          const { data: emp4 } = await query.single()
          if (emp4) {
            employee = emp4
          }
        }
      }

      // 如果找到了，自動更新 supabase_user_id
      if (employee) {
        await adminClient
          .from('employees')
          .update({ supabase_user_id: user.id })
          .eq('id', employee.id)
      }
    }

    if (!employee) {
      // 記錄詳細資訊以便除錯
      const { logger } = await import('@/lib/utils/logger')

      // 額外查詢：列出所有員工以便除錯
      const { data: allEmployees } = await adminClient
        .from('employees')
        .select('id, employee_number, supabase_user_id, workspace_id')
        .limit(10)

      logger.error('找不到員工資料', {
        auth_uid: user.id,
        auth_email: user.email,
        user_metadata: user.user_metadata,
        sample_employees: allEmployees?.map(e => ({
          id: e.id.substring(0, 8),
          num: e.employee_number,
          uid: e.supabase_user_id?.substring(0, 8),
        })),
      })
      return {
        success: false,
        error: {
          error: '找不到員工資料',
          code: 'EMPLOYEE_NOT_FOUND'
        }
      }
    }

    workspaceId = employee.workspace_id ?? undefined
    employeeId = employee.id
  }

  if (!workspaceId) {
    return {
      success: false,
      error: {
        error: '找不到工作空間',
        code: 'NO_WORKSPACE'
      }
    }
  }

  return {
    success: true,
    data: {
      user,
      workspaceId,
      employeeId: employeeId || user.id
    }
  }
}

/**
 * 簡化版：只檢查是否已登入，不需要 workspace
 * 用於不需要 workspace 隔離的操作（如發送訊息）
 */
export async function getServerUser(): Promise<{ user: User } | { error: string }> {
  const supabase = await createSupabaseServerClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { error: '請先登入' }
  }

  return { user }
}

/**
 * 取得 Supabase Server Client（已認證）
 * 方便 Server Actions 使用
 */
export async function getAuthenticatedSupabase() {
  return createSupabaseServerClient()
}
