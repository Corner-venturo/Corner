/**
 * 診斷認證問題的 API
 * 僅用於開發環境
 */

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const adminClient = getSupabaseAdminClient()

    // 1. 取得當前 Auth 用戶
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        step: 'auth',
        error: authError?.message || '未登入',
      })
    }

    // 2. 檢查 user_metadata
    const metadata = {
      workspace_id: user.user_metadata?.workspace_id,
      employee_id: user.user_metadata?.employee_id,
    }

    // 3. 用 admin client 查詢 employees（用 supabase_user_id）
    const { data: employeeBySupabaseId, error: err1 } = await adminClient
      .from('employees')
      .select('id, employee_number, display_name, workspace_id, supabase_user_id')
      .eq('supabase_user_id', user.id)
      .single()

    // 4. 用 admin client 查詢 employees（用 id，舊方式）
    const { data: employeeById, error: err2 } = await adminClient
      .from('employees')
      .select('id, employee_number, display_name, workspace_id, supabase_user_id')
      .eq('id', user.id)
      .single()

    // 5. 列出所有員工的 supabase_user_id
    const { data: allEmployees } = await adminClient
      .from('employees')
      .select('id, employee_number, display_name, supabase_user_id')
      .limit(20)

    return NextResponse.json({
      success: true,
      auth_user_id: user.id,
      auth_email: user.email,
      user_metadata: metadata,
      employee_by_supabase_user_id: employeeBySupabaseId || null,
      employee_by_supabase_user_id_error: err1?.message,
      employee_by_id: employeeById || null,
      employee_by_id_error: err2?.message,
      all_employees_sample: allEmployees?.map(e => ({
        id: e.id,
        employee_number: e.employee_number,
        display_name: e.display_name,
        supabase_user_id: e.supabase_user_id,
        matches_auth: e.supabase_user_id === user.id,
      })),
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    })
  }
}
