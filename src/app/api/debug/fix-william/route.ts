/**
 * Debug API - 直接修復 William 的 supabase_user_id
 * 注意：這是臨時 debug API，不需要登入
 */

import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/api/response'

// 也支援 GET 方便測試
export async function GET(request: NextRequest) {
  return fixWilliam()
}

export async function POST(request: NextRequest) {
  return fixWilliam()
}

async function fixWilliam() {
  try {
    const adminClient = getSupabaseAdminClient()

    // 1. 找到 William 的員工記錄
    const { data: william, error: findError } = await adminClient
      .from('employees')
      .select('id, employee_number, display_name, supabase_user_id')
      .eq('employee_number', 'E001')
      .eq('display_name', 'William')
      .single()

    if (findError || !william) {
      return errorResponse('找不到 William: ' + (findError?.message || 'not found'), 404)
    }

    // 2. 更新 supabase_user_id
    const correctSupabaseUid = '099a709d-ba03-4bcf-afa9-d6c332d7c052'

    const { error: updateError } = await adminClient
      .from('employees')
      .update({ supabase_user_id: correctSupabaseUid })
      .eq('id', william.id)

    if (updateError) {
      return errorResponse('更新失敗: ' + updateError.message, 500)
    }

    // 3. 驗證更新結果
    const { data: updated } = await adminClient
      .from('employees')
      .select('id, employee_number, display_name, supabase_user_id')
      .eq('id', william.id)
      .single()

    return successResponse({
      message: '更新成功',
      before: {
        id: william.id,
        supabase_user_id: william.supabase_user_id,
      },
      after: {
        id: updated?.id,
        supabase_user_id: updated?.supabase_user_id,
      },
    })
  } catch (error) {
    return errorResponse(String(error), 500)
  }
}
