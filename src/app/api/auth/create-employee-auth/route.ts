/**
 * 建立員工 Supabase Auth 帳號的 API Route
 * 使用 Service Role Key 建立 Supabase Auth 用戶
 */

import { logger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { employee_number, password } = await request.json()

    if (!employee_number || !password) {
      return NextResponse.json({ error: 'Missing employee_number or password' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdminClient()
    const email = `${employee_number}@venturo.com`

    // 使用 Admin API 建立用戶
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 自動確認 email
    })

    if (error) {
      // 如果用戶已存在，嘗試更新密碼
      if (error.message.includes('already been registered')) {
        logger.log('ℹ️ Auth 用戶已存在，嘗試更新密碼:', email)

        const { data: users } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = users?.users.find(u => u.email === email)

        if (existingUser) {
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            existingUser.id,
            { password }
          )

          if (updateError) {
            logger.error('❌ 更新密碼失敗:', updateError)
            return NextResponse.json({ error: updateError.message }, { status: 400 })
          }

          logger.log('✅ Auth 密碼已更新:', email)
          return NextResponse.json({ success: true, user: existingUser, updated: true })
        }
      }

      logger.error('❌ 建立 Auth 用戶失敗:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    logger.log('✅ Auth 用戶已建立:', email)
    return NextResponse.json({ success: true, user: data.user })
  } catch (error) {
    logger.error('💥 建立 Auth 用戶錯誤:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
