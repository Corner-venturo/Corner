import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用 service role 來繞過 RLS（API 端會自己驗證權限）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RouteParams {
  params: Promise<{
    assigned_itinerary_id: string
  }>
}

/**
 * POST /api/join-trip/[assigned_itinerary_id]
 *
 * 讓使用者透過分享連結加入一個行程
 *
 * 邏輯：
 * 1. 驗證使用者已登入（透過 Bearer Token）
 * 2. 檢查行程是否存在
 * 3. 檢查使用者是否已是 trip_members 的一員，避免重複加入
 * 4. 在 trip_members 表中，為這位新成員新增一筆紀錄，role 設為 member
 *
 * Response (成功):
 * {
 *   success: true,
 *   data: {
 *     member_id: string,
 *     role: 'member',
 *     message: string
 *   }
 * }
 *
 * Response (已是成員):
 * {
 *   success: true,
 *   data: {
 *     already_member: true,
 *     member_id: string,
 *     role: string,
 *     message: string
 *   }
 * }
 */
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { assigned_itinerary_id } = await context.params

    // 1. 從 Authorization header 取得 token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未提供認證 token' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // 2. 驗證 token 並取得使用者資訊
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: '認證失敗', details: authError?.message },
        { status: 401 }
      )
    }

    // 3. 檢查行程是否存在
    const { data: assignedItinerary, error: itineraryError } = await supabase
      .from('customer_assigned_itineraries')
      .select('id, customer_id, itinerary_id, status')
      .eq('id', assigned_itinerary_id)
      .single()

    if (itineraryError || !assignedItinerary) {
      return NextResponse.json(
        { error: '找不到指定的行程' },
        { status: 404 }
      )
    }

    // 4. 透過 email 找到對應的 customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name, email, phone')
      .eq('email', user.email)
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        { error: '找不到對應的客戶資料，請先完成帳號綁定' },
        { status: 404 }
      )
    }

    // 5. 檢查是否為行程擁有者（擁有者不需要加入）
    if (customer.id === assignedItinerary.customer_id) {
      return NextResponse.json({
        success: true,
        data: {
          already_member: true,
          is_owner: true,
          role: 'owner',
          message: '您是此行程的擁有者'
        }
      })
    }

    // 6. 檢查使用者是否已是 trip_members 的一員
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('trip_members')
      .select('id, role, status')
      .eq('assigned_itinerary_id', assigned_itinerary_id)
      .or(`customer_id.eq.${customer.id},app_user_id.eq.${user.id}`)
      .maybeSingle()

    if (memberCheckError) {
      console.error('檢查成員失敗:', memberCheckError)
    }

    // 如果已經是成員
    if (existingMember) {
      return NextResponse.json({
        success: true,
        data: {
          already_member: true,
          member_id: existingMember.id,
          role: existingMember.role,
          status: existingMember.status,
          message: '您已經是此行程的成員'
        }
      })
    }

    // 7. 新增成員記錄
    const { data: newMember, error: insertError } = await supabase
      .from('trip_members')
      .insert({
        assigned_itinerary_id: assigned_itinerary_id,
        customer_id: customer.id,
        app_user_id: user.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        role: 'member',
        status: 'active'
      })
      .select('id, role, status')
      .single()

    if (insertError) {
      console.error('新增成員失敗:', insertError)
      return NextResponse.json(
        { error: '加入行程失敗', details: insertError.message },
        { status: 500 }
      )
    }

    // 8. 回傳成功訊息
    return NextResponse.json({
      success: true,
      data: {
        member_id: newMember.id,
        role: newMember.role,
        status: newMember.status,
        message: '成功加入行程！'
      }
    })

  } catch (error) {
    console.error('API 錯誤:', error)
    return NextResponse.json(
      { error: '伺服器錯誤', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    )
  }
}
