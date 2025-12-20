import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用 Service Role Key 進行密碼驗證
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface UnlockRequest {
  password: string
  reason?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tourId } = await params
    const body: UnlockRequest = await request.json()
    const { password, reason } = body

    if (!password) {
      return NextResponse.json(
        { error: '請輸入密碼' },
        { status: 400 }
      )
    }

    // 從 cookie 取得當前用戶 session
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未登入' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]

    // 驗證 token 並取得用戶資訊
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json(
        { error: '無效的認證' },
        { status: 401 }
      )
    }

    // 使用用戶的 email 和輸入的密碼進行驗證
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email!,
      password: password,
    })

    if (signInError) {
      return NextResponse.json(
        { error: '密碼錯誤' },
        { status: 403 }
      )
    }

    // 檢查用戶對此團的權限 (從 Itinerary_Permissions 或 employees 表)
    // 這裡簡化處理，實際可以加入更複雜的權限檢查
    const { data: tour, error: tourError } = await supabaseAdmin
      .from('tours')
      .select('id, status, locked_by')
      .eq('id', tourId)
      .single()

    if (tourError || !tour) {
      return NextResponse.json(
        { error: '找不到此團' },
        { status: 404 }
      )
    }

    // 檢查團是否已鎖定
    if (tour.status !== '已確認') {
      return NextResponse.json(
        { error: '此團未處於鎖定狀態' },
        { status: 400 }
      )
    }

    // 解鎖：更新狀態為「修改中」
    const { error: updateError } = await supabaseAdmin
      .from('tours')
      .update({
        status: '修改中',
        last_unlocked_at: new Date().toISOString(),
        last_unlocked_by: user.id,
        modification_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tourId)

    if (updateError) {
      console.error('Error unlocking tour:', updateError)
      return NextResponse.json(
        { error: '解鎖失敗' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '已解鎖，可進行修改',
    })
  } catch (error) {
    console.error('Unlock API error:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}
