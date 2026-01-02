/**
 * 同步員工的 supabase_user_id 和 workspace 到 metadata
 * 使用 Admin Client 繞過 RLS 限制
 *
 * 這個 API 解決登入時的雞生蛋問題：
 * - 更新 employees.supabase_user_id 需要 RLS 檢查 workspace
 * - 但 RLS 需要 supabase_user_id 才能找到 workspace
 * - 所以用 admin client 繞過 RLS
 */

import { logger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { employee_id, supabase_user_id, workspace_id } = await request.json()

    if (!employee_id || !supabase_user_id) {
      return NextResponse.json(
        { error: 'Missing employee_id or supabase_user_id' },
        { status: 400 }
      )
    }

    // 驗證請求者身份：確認 supabase_user_id 對應的用戶已登入
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.id !== supabase_user_id) {
      return NextResponse.json(
        { error: 'Unauthorized: user mismatch' },
        { status: 401 }
      )
    }

    const supabaseAdmin = getSupabaseAdminClient()

    // 1. 更新 employees.supabase_user_id（繞過 RLS）
    const { error: updateError } = await supabaseAdmin
      .from('employees')
      .update({ supabase_user_id })
      .eq('id', employee_id)

    if (updateError) {
      logger.error('❌ 更新 supabase_user_id 失敗:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    logger.log('✅ 已更新 employees.supabase_user_id:', supabase_user_id)

    // 2. 更新 auth.users 的 metadata（使用 admin）
    if (workspace_id) {
      const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
        supabase_user_id,
        {
          user_metadata: {
            workspace_id,
            employee_id,
          },
        }
      )

      if (metadataError) {
        logger.warn('⚠️ 更新 user_metadata 失敗:', metadataError)
        // 不回傳錯誤，因為 supabase_user_id 已經設好了
      } else {
        logger.log('✅ 已更新 user_metadata:', { workspace_id, employee_id })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('💥 sync-employee 錯誤:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
