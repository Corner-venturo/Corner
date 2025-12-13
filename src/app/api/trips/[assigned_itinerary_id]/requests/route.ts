import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用 service role 來繞過 RLS（API 端會自己驗證權限）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RequestBody {
  request_text: string
}

interface RouteParams {
  params: Promise<{
    assigned_itinerary_id: string
  }>
}

/**
 * POST /api/trips/[assigned_itinerary_id]/requests
 *
 * 建立客製化需求
 * - 驗證使用者是否為該指派行程的擁有者或旅伴
 * - 將請求寫入 customization_requests 表
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

    // 3. 解析 request body
    const body: RequestBody = await request.json()

    if (!body.request_text || body.request_text.trim() === '') {
      return NextResponse.json(
        { error: '請提供客製化需求內容' },
        { status: 400 }
      )
    }

    // 4. 驗證 assigned_itinerary_id 存在，並取得相關資訊
    const { data: assignedItinerary, error: itineraryError } = await supabase
      .from('customer_assigned_itineraries')
      .select('id, customer_id, workspace_id')
      .eq('id', assigned_itinerary_id)
      .single()

    if (itineraryError || !assignedItinerary) {
      return NextResponse.json(
        { error: '找不到指定的行程指派記錄' },
        { status: 404 }
      )
    }

    // 5. 驗證使用者權限
    // 方式 A: 使用者是行程的客戶本人
    // 方式 B: 使用者是行程的旅伴成員
    const customerId = assignedItinerary.customer_id

    // 檢查是否為客戶本人（透過 customers 表的 user_id 或 email 比對）
    const { data: customer } = await supabase
      .from('customers')
      .select('id, email')
      .eq('id', customerId)
      .single()

    let isAuthorized = false

    // 比對 email（假設 App 使用者的 email 與 customers 表一致）
    if (customer && customer.email === user.email) {
      isAuthorized = true
    }

    // 如果不是客戶本人，檢查是否為旅伴
    if (!isAuthorized) {
      const { data: tripMember } = await supabase
        .from('trip_members')
        .select('id')
        .eq('assigned_itinerary_id', assigned_itinerary_id)
        .eq('status', 'active')
        .or(`customer_id.eq.${customerId},app_user_id.eq.${user.id}`)
        .single()

      if (tripMember) {
        isAuthorized = true
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: '您沒有權限對此行程提出客製化需求' },
        { status: 403 }
      )
    }

    // 6. 建立客製化需求
    const { data: newRequest, error: insertError } = await supabase
      .from('customization_requests')
      .insert({
        customer_id: customerId,
        assigned_itinerary_id: assigned_itinerary_id,
        request_text: body.request_text.trim(),
        status: 'new',
        workspace_id: assignedItinerary.workspace_id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('建立客製化需求失敗:', insertError)
      return NextResponse.json(
        { error: '建立客製化需求失敗', details: insertError.message },
        { status: 500 }
      )
    }

    // 7. 回傳成功結果
    return NextResponse.json({
      success: true,
      message: '客製化需求已送出',
      data: {
        id: newRequest.id,
        request_text: newRequest.request_text,
        status: newRequest.status,
        created_at: newRequest.created_at,
      }
    }, { status: 201 })

  } catch (error) {
    console.error('API 錯誤:', error)
    return NextResponse.json(
      { error: '伺服器錯誤', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/trips/[assigned_itinerary_id]/requests
 *
 * 取得該行程的所有客製化需求（給客戶查看自己的請求）
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { assigned_itinerary_id } = await context.params

    // 1. 驗證 token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未提供認證 token' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: '認證失敗' },
        { status: 401 }
      )
    }

    // 2. 取得行程資訊
    const { data: assignedItinerary, error: itineraryError } = await supabase
      .from('customer_assigned_itineraries')
      .select('id, customer_id')
      .eq('id', assigned_itinerary_id)
      .single()

    if (itineraryError || !assignedItinerary) {
      return NextResponse.json(
        { error: '找不到指定的行程指派記錄' },
        { status: 404 }
      )
    }

    // 3. 驗證權限（同 POST）
    const { data: customer } = await supabase
      .from('customers')
      .select('id, email')
      .eq('id', assignedItinerary.customer_id)
      .single()

    let isAuthorized = customer?.email === user.email

    if (!isAuthorized) {
      const { data: tripMember } = await supabase
        .from('trip_members')
        .select('id')
        .eq('assigned_itinerary_id', assigned_itinerary_id)
        .eq('status', 'active')
        .single()

      isAuthorized = !!tripMember
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: '您沒有權限查看此行程的客製化需求' },
        { status: 403 }
      )
    }

    // 4. 取得客製化需求列表
    const { data: requests, error: fetchError } = await supabase
      .from('customization_requests')
      .select('id, request_text, status, response_text, created_at, updated_at')
      .eq('assigned_itinerary_id', assigned_itinerary_id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      return NextResponse.json(
        { error: '取得客製化需求失敗' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: requests || []
    })

  } catch (error) {
    console.error('API 錯誤:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}
