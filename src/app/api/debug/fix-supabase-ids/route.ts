/**
 * Debug API - 檢查並顯示需要修復的 supabase_user_id
 * 僅供開發階段使用
 */

import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const adminClient = getSupabaseAdminClient()

    // 1. 取得所有員工
    const { data: employees, error: empError } = await adminClient
      .from('employees')
      .select('id, employee_number, display_name, workspace_id, supabase_user_id')
      .neq('employee_number', 'BOT001')
      .order('employee_number')

    if (empError) {
      return errorResponse(empError.message, 500)
    }

    // 2. 取得所有 auth users
    const { data: { users }, error: authError } = await adminClient.auth.admin.listUsers()

    if (authError) {
      return errorResponse(authError.message, 500)
    }

    // 3. 分析問題
    const problems: {
      employee_id: string
      employee_number: string | null
      display_name: string | null
      current_supabase_uid: string | null
      issue: string
    }[] = []

    const matches: {
      employee_id: string
      employee_number: string | null
      display_name: string | null
      supabase_user_id: string
      auth_email: string
    }[] = []

    for (const emp of employees || []) {
      // 檢查 supabase_user_id 是否等於 employee.id（錯誤情況）
      if (emp.supabase_user_id === emp.id) {
        problems.push({
          employee_id: emp.id,
          employee_number: emp.employee_number,
          display_name: emp.display_name,
          current_supabase_uid: emp.supabase_user_id,
          issue: 'supabase_user_id 等於 employee.id（應該是 Auth User ID）',
        })
      }

      // 檢查是否有對應的 auth user
      if (emp.supabase_user_id) {
        const authUser = users.find(u => u.id === emp.supabase_user_id)
        if (authUser) {
          matches.push({
            employee_id: emp.id,
            employee_number: emp.employee_number,
            display_name: emp.display_name,
            supabase_user_id: emp.supabase_user_id,
            auth_email: authUser.email || 'N/A',
          })
        } else if (emp.supabase_user_id !== emp.id) {
          // supabase_user_id 不等於 employee.id 但找不到對應 auth user
          problems.push({
            employee_id: emp.id,
            employee_number: emp.employee_number,
            display_name: emp.display_name,
            current_supabase_uid: emp.supabase_user_id,
            issue: '找不到對應的 Auth User',
          })
        }
      }
    }

    return successResponse({
      total_employees: employees?.length || 0,
      total_auth_users: users.length,
      problems,
      correct_matches: matches,
    })
  } catch (error) {
    return errorResponse(String(error), 500)
  }
}
