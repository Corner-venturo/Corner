import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用 service role 來繞過 RLS（API 端會自己驗證權限）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/my/trips
 *
 * 獲取當前登入使用者被指派的所有行程列表
 *
 * Response:
 * {
 *   success: true,
 *   data: [
 *     {
 *       assigned_itinerary_id: string,
 *       assigned_date: string,
 *       status: string,
 *       notes: string | null,
 *       itinerary: {
 *         id: string,
 *         title: string,
 *         summary: string | null,
 *         cover_image: string | null,
 *         departure_date: string | null,
 *         duration_days: number | null,
 *         country: string | null,
 *         city: string | null,
 *         status: string | null,
 *       },
 *       trip_members_count: number,
 *     }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
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

    // 3. 透過 email 找到對應的 customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('email', user.email)
      .single()

    if (customerError || !customer) {
      // 使用者不在 customers 表中，回傳空列表
      return NextResponse.json({
        success: true,
        data: [],
        message: '找不到對應的客戶資料'
      })
    }

    // 4. 查詢該客戶被指派的所有行程
    const { data: assignedItineraries, error: fetchError } = await supabase
      .from('customer_assigned_itineraries')
      .select(`
        id,
        assigned_date,
        status,
        notes,
        itinerary:itineraries (
          id,
          title,
          summary,
          cover_image,
          departure_date,
          duration_days,
          country,
          city,
          status
        )
      `)
      .eq('customer_id', customer.id)
      .order('assigned_date', { ascending: false })

    if (fetchError) {
      console.error('查詢行程列表失敗:', fetchError)
      return NextResponse.json(
        { error: '查詢行程列表失敗', details: fetchError.message },
        { status: 500 }
      )
    }

    // 5. 為每個行程取得旅伴人數
    const tripsWithMemberCount = await Promise.all(
      (assignedItineraries || []).map(async (assigned) => {
        const { count } = await supabase
          .from('trip_members')
          .select('id', { count: 'exact', head: true })
          .eq('assigned_itinerary_id', assigned.id)
          .eq('status', 'active')

        return {
          assigned_itinerary_id: assigned.id,
          assigned_date: assigned.assigned_date,
          status: assigned.status,
          notes: assigned.notes,
          itinerary: assigned.itinerary,
          trip_members_count: count || 0,
        }
      })
    )

    // 6. 回傳結果
    return NextResponse.json({
      success: true,
      data: tripsWithMemberCount,
    })

  } catch (error) {
    console.error('API 錯誤:', error)
    return NextResponse.json(
      { error: '伺服器錯誤', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    )
  }
}
