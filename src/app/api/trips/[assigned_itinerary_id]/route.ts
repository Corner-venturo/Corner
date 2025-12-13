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
 * GET /api/trips/[assigned_itinerary_id]
 *
 * 獲取單一行程的完整詳情（深度查詢）
 * 包含：
 * - 指派資訊
 * - 行程主資訊
 * - 每日行程 (itinerary_days)
 * - 行程項目 (itinerary_items)
 * - 旅伴成員 (trip_members) 及其個人資料
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     assigned_itinerary_id: string,
 *     assigned_date: string,
 *     status: string,
 *     notes: string | null,
 *     itinerary: {
 *       id: string,
 *       title: string,
 *       summary: string | null,
 *       cover_image: string | null,
 *       departure_date: string | null,
 *       duration_days: number | null,
 *       country: string | null,
 *       city: string | null,
 *       status: string | null,
 *       tagline: string | null,
 *       subtitle: string | null,
 *       description: string | null,
 *       outbound_flight: object | null,
 *       return_flight: object | null,
 *       features: array | null,
 *       leader: object | null,
 *       meeting_info: object | null,
 *       hotels: array | null,
 *       faqs: array | null,
 *       notices: array | null,
 *       cancellation_policy: array | null,
 *       days: [
 *         {
 *           id: string,
 *           day_number: number,
 *           title: string | null,
 *           description: string | null,
 *           items: [
 *             {
 *               id: string,
 *               item_order: number,
 *               item_type: string,
 *               name: string,
 *               description: string | null,
 *               location: string | null,
 *               latitude: number | null,
 *               longitude: number | null,
 *               start_time: string | null,
 *               end_time: string | null,
 *               duration_minutes: number | null,
 *               image_url: string | null,
 *               booking_details: object | null,
 *             }
 *           ]
 *         }
 *       ]
 *     },
 *     trip_members: [
 *       {
 *         id: string,
 *         name: string,
 *         email: string | null,
 *         phone: string | null,
 *         role: string,
 *         status: string,
 *         customer: {
 *           id: string,
 *           nickname: string | null,
 *           name: string | null,
 *           avatar_url: string | null,
 *         } | null
 *       }
 *     ]
 *   }
 * }
 */
export async function GET(request: NextRequest, context: RouteParams) {
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

    // 3. 取得 assigned_itinerary 資訊
    const { data: assignedItinerary, error: assignedError } = await supabase
      .from('customer_assigned_itineraries')
      .select(`
        id,
        customer_id,
        itinerary_id,
        assigned_date,
        status,
        notes
      `)
      .eq('id', assigned_itinerary_id)
      .single()

    if (assignedError || !assignedItinerary) {
      return NextResponse.json(
        { error: '找不到指定的行程指派記錄' },
        { status: 404 }
      )
    }

    // 4. 權限驗證：確認使用者是擁有者或旅伴成員

    // 4a. 透過 email 找到對應的 customer
    const { data: userCustomer } = await supabase
      .from('customers')
      .select('id, email')
      .eq('email', user.email)
      .single()

    let isAuthorized = false

    // 4b. 檢查是否為行程擁有者
    if (userCustomer && userCustomer.id === assignedItinerary.customer_id) {
      isAuthorized = true
    }

    // 4c. 檢查是否為旅伴成員
    if (!isAuthorized) {
      const { data: tripMember } = await supabase
        .from('trip_members')
        .select('id')
        .eq('assigned_itinerary_id', assigned_itinerary_id)
        .eq('status', 'active')
        .or(`customer_id.eq.${userCustomer?.id || ''},app_user_id.eq.${user.id}`)
        .maybeSingle()

      if (tripMember) {
        isAuthorized = true
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: '您沒有權限查看此行程' },
        { status: 403 }
      )
    }

    // 5. 深度查詢：取得完整行程資訊
    const { data: itinerary, error: itineraryError } = await supabase
      .from('itineraries')
      .select(`
        id,
        title,
        summary,
        cover_image,
        departure_date,
        duration_days,
        country,
        city,
        status,
        tagline,
        subtitle,
        description,
        outbound_flight,
        return_flight,
        features,
        leader,
        meeting_info,
        hotels,
        faqs,
        notices,
        cancellation_policy
      `)
      .eq('id', assignedItinerary.itinerary_id)
      .single()

    if (itineraryError || !itinerary) {
      return NextResponse.json(
        { error: '找不到行程資料', details: itineraryError?.message },
        { status: 404 }
      )
    }

    // 6. 取得每日行程及其項目
    const { data: itineraryDays, error: daysError } = await supabase
      .from('itinerary_days')
      .select(`
        id,
        day_number,
        title,
        description
      `)
      .eq('itinerary_id', itinerary.id)
      .order('day_number', { ascending: true })

    if (daysError) {
      console.error('查詢每日行程失敗:', daysError)
    }

    // 7. 為每一天取得行程項目
    const daysWithItems = await Promise.all(
      (itineraryDays || []).map(async (day) => {
        const { data: items, error: itemsError } = await supabase
          .from('itinerary_items')
          .select(`
            id,
            item_order,
            item_type,
            name,
            description,
            location,
            latitude,
            longitude,
            start_time,
            end_time,
            duration_minutes,
            image_url,
            booking_details
          `)
          .eq('itinerary_day_id', day.id)
          .order('item_order', { ascending: true })

        if (itemsError) {
          console.error(`查詢第 ${day.day_number} 天的項目失敗:`, itemsError)
        }

        return {
          ...day,
          items: items || [],
        }
      })
    )

    // 8. 取得旅伴成員及其個人資料
    const { data: tripMembers, error: membersError } = await supabase
      .from('trip_members')
      .select(`
        id,
        name,
        email,
        phone,
        role,
        status,
        customer_id
      `)
      .eq('assigned_itinerary_id', assigned_itinerary_id)
      .order('role', { ascending: true })

    if (membersError) {
      console.error('查詢旅伴成員失敗:', membersError)
    }

    // 9. 為每個成員取得客戶資料（如有關聯）
    const membersWithCustomerInfo = await Promise.all(
      (tripMembers || []).map(async (member) => {
        let customerInfo = null

        if (member.customer_id) {
          const { data: customer } = await supabase
            .from('customers')
            .select('id, nickname, name, passport_image_url')
            .eq('id', member.customer_id)
            .single()

          if (customer) {
            customerInfo = {
              id: customer.id,
              nickname: customer.nickname,
              name: customer.name,
              avatar_url: customer.passport_image_url, // 暫時用護照照片作為 avatar
            }
          }
        }

        return {
          id: member.id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          role: member.role,
          status: member.status,
          customer: customerInfo,
        }
      })
    )

    // 10. 組合完整回應
    const response = {
      assigned_itinerary_id: assignedItinerary.id,
      assigned_date: assignedItinerary.assigned_date,
      status: assignedItinerary.status,
      notes: assignedItinerary.notes,
      itinerary: {
        ...itinerary,
        days: daysWithItems,
      },
      trip_members: membersWithCustomerInfo,
    }

    return NextResponse.json({
      success: true,
      data: response,
    })

  } catch (error) {
    console.error('API 錯誤:', error)
    return NextResponse.json(
      { error: '伺服器錯誤', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    )
  }
}
