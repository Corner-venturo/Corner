/**
 * 同步 auth.users 密碼的 API Route
 * 使用 Service Role Key 更新 Supabase Auth 密碼
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// 使用 Service Role 創建 admin client
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json()

    if (!userId || !password) {
      return NextResponse.json({ error: 'Missing userId or password' }, { status: 400 })
    }

    // 使用 Admin API 更新密碼
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: password,
    })

    if (error) {
      console.error('❌ 同步密碼失敗:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('✅ auth.users 密碼已同步:', userId)
    return NextResponse.json({ success: true, user: data.user })
  } catch (error) {
    console.error('💥 同步密碼錯誤:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
