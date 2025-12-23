import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseAdmin = getSupabaseAdminClient()

    if (!id) {
      return NextResponse.json(
        { error: '缺少行程 ID' },
        { status: 400 }
      )
    }

    // 判斷查詢類型：
    // 1. 完整 UUID（36 字元，含連字號）
    // 2. 短碼（8 個十六進位字元，是 UUID 前 8 碼去掉連字號）
    // 3. tour_code（其他格式）
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    const isShortId = /^[0-9a-f]{8}$/i.test(id) // 8 個十六進位字元

    let itinerary = null
    let error = null

    if (isUUID) {
      // 用完整 UUID 查詢
      const result = await supabaseAdmin
        .from('itineraries')
        .select('*')
        .eq('id', id)
        .single()
      itinerary = result.data
      error = result.error
    } else if (isShortId) {
      // 用短碼查詢（ID 前 8 碼，需要用 like 查詢）
      // 將短碼轉換成 UUID 前綴格式：xxxxxxxx-
      const uuidPrefix = `${id.substring(0, 8)}`
      const result = await supabaseAdmin
        .from('itineraries')
        .select('*')
        .ilike('id', `${uuidPrefix}%`)
        .limit(1)
        .single()
      itinerary = result.data
      error = result.error
    } else {
      // 用 tour_code 查詢
      const result = await supabaseAdmin
        .from('itineraries')
        .select('*')
        .eq('tour_code', id)
        .single()
      itinerary = result.data
      error = result.error
    }

    if (error) {
      logger.error('查詢行程失敗:', error)
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
    logger.error('API 錯誤:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}
