/**
 * 同步 auth.users 密碼的 API Route
 * 使用 Service Role Key 更新 Supabase Auth 密碼
 */

import { logger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ✅ 延遲初始化，避免建置時錯誤
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json()

    if (!userId || !password) {
      return NextResponse.json({ error: 'Missing userId or password' }, { status: 400 })
    }

    // ✅ 執行時才初始化 Supabase Admin
    const supabaseAdmin = getSupabaseAdmin()

    // 使用 Admin API 更新密碼
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: password,
    })

    if (error) {
      logger.error('❌ 同步密碼失敗:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    logger.log('✅ auth.users 密碼已同步:', userId)
    return NextResponse.json({ success: true, user: data.user })
  } catch (error) {
    logger.error('💥 同步密碼錯誤:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
