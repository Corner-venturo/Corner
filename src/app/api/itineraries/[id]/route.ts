import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 檢查環境變數
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 優先使用 service role key，fallback 到 anon key
// 注意：RLS 已在 Venturo 專案中禁用，所以 anon key 也可以查詢
const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceKey || supabaseAnonKey || ''
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 檢查 Supabase 配置
    if (!supabaseUrl) {
      console.error('缺少 NEXT_PUBLIC_SUPABASE_URL 環境變數')
      return NextResponse.json(
        { error: '伺服器配置錯誤' },
        { status: 500 }
      )
    }

    if (!supabaseServiceKey && !supabaseAnonKey) {
      console.error('缺少 Supabase API key 環境變數')
      return NextResponse.json(
        { error: '伺服器配置錯誤' },
        { status: 500 }
      )
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: '缺少行程 ID' },
        { status: 400 }
      )
    }

    // 查詢行程資料
    const { data: itinerary, error } = await supabaseAdmin
      .from('itineraries')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('查詢行程失敗:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '找不到此行程' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: '查詢行程失敗' },
        { status: 500 }
      )
    }

    if (!itinerary) {
      return NextResponse.json(
        { error: '找不到此行程' },
        { status: 404 }
      )
    }

    // 轉換資料格式（snake_case → camelCase）
    const formattedItinerary = {
      id: itinerary.id,
      tourId: itinerary.tour_id,
      tagline: itinerary.tagline,
      title: itinerary.title,
      subtitle: itinerary.subtitle,
      description: itinerary.description,
      departureDate: itinerary.departure_date,
      tourCode: itinerary.tour_code,
      coverImage: itinerary.cover_image,
      country: itinerary.country,
      city: itinerary.city,
      status: itinerary.status,
      outboundFlight: itinerary.outbound_flight,
      returnFlight: itinerary.return_flight,
      features: itinerary.features,
      focusCards: itinerary.focus_cards,
      leader: itinerary.leader,
      meetingInfo: itinerary.meeting_info,
      hotels: itinerary.hotels,
      showFeatures: itinerary.show_features,
      showLeaderMeeting: itinerary.show_leader_meeting,
      showHotels: itinerary.show_hotels,
      itinerarySubtitle: itinerary.itinerary_subtitle,
      dailyItinerary: itinerary.daily_itinerary,
      versionRecords: itinerary.version_records,
      createdAt: itinerary.created_at,
      updatedAt: itinerary.updated_at,
    }

    return NextResponse.json(formattedItinerary)
  } catch (error) {
    console.error('API 錯誤:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}
