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

    // 判斷是 UUID 還是 tourCode
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    // 查詢行程資料（支援 id 或 tour_code）
    const { data: itinerary, error } = await supabaseAdmin
      .from('itineraries')
      .select('*')
      .eq(isUUID ? 'id' : 'tour_code', id)
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
      coverStyle: itinerary.cover_style,
      flightStyle: itinerary.flight_style,
      itineraryStyle: itinerary.itinerary_style,
      price: itinerary.price,
      priceNote: itinerary.price_note,
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
      // 詳細團費
      showPricingDetails: itinerary.show_pricing_details,
      pricingDetails: itinerary.pricing_details,
      // 價格方案
      priceTiers: itinerary.price_tiers,
      showPriceTiers: itinerary.show_price_tiers,
      // 常見問題
      faqs: itinerary.faqs,
      showFaqs: itinerary.show_faqs,
      // 提醒事項
      notices: itinerary.notices,
      showNotices: itinerary.show_notices,
      // 取消政策
      cancellationPolicy: itinerary.cancellation_policy,
      showCancellationPolicy: itinerary.show_cancellation_policy,
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
