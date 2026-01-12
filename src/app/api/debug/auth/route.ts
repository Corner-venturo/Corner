/**
 * Debug API - 檢查認證狀態
 * 僅供開發階段使用
 */

import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const adminClient = getSupabaseAdminClient()

    // 1. 取得 auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return successResponse({
        status: 'not_authenticated',
        error: authError?.message || 'No user',
      })
    }

    // 2. 查詢員工 - by supabase_user_id
    const { data: empByUid } = await adminClient
      .from('employees')
      .select('id, employee_number, display_name, workspace_id, supabase_user_id')
      .eq('supabase_user_id', user.id)
      .maybeSingle()

    // 3. 查詢員工 - by id
    const { data: empById } = await adminClient
      .from('employees')
      .select('id, employee_number, display_name, workspace_id, supabase_user_id')
      .eq('id', user.id)
      .maybeSingle()

    // 4. 列出所有員工的 supabase_user_id
    const { data: allEmps } = await adminClient
      .from('employees')
      .select('id, employee_number, display_name, workspace_id, supabase_user_id')
      .limit(20)

    return successResponse({
      auth_user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
      },
      employee_by_supabase_user_id: empByUid,
      employee_by_id: empById,
      all_employees: allEmps?.map(e => ({
        id: e.id.substring(0, 8) + '...',
        num: e.employee_number,
        name: e.display_name,
        workspace: e.workspace_id?.substring(0, 8) + '...',
        supabase_uid: e.supabase_user_id ? e.supabase_user_id.substring(0, 8) + '...' : null,
      })),
    })
  } catch (error) {
    return errorResponse(String(error), 500)
  }
}
