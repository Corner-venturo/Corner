/**
 * POST /api/itineraries/generate
 * 一鍵生成行程草稿 API
 *
 * 根據城市、天數、航班資訊自動生成行程
 * 使用規則引擎，不呼叫外部 AI 服務
 */

import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getServerAuth } from '@/lib/auth/server-auth'
import { logger } from '@/lib/utils/logger'
import { generateItinerary, type GenerateItineraryRequest } from '@/lib/itinerary-generator'
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response'
import type { Attraction } from '@/features/attractions/types'

interface RequestBody {
  cityId: string
  numDays: number
  departureDate: string
  outboundFlight: {
    arrivalTime: string     // HH:mm
  }
  returnFlight: {
    departureTime: string   // HH:mm
  }
}

export async function POST(request: NextRequest) {
  try {
    // 🔒 安全檢查：驗證用戶身份
    const auth = await getServerAuth()
    if (!auth.success) {
      return errorResponse('請先登入', 401, ErrorCode.UNAUTHORIZED)
    }

    // 1. 解析請求
    const body: RequestBody = await request.json()

    // 2. 驗證必要參數
    if (!body.cityId) {
      return errorResponse('請提供城市 ID', 400, ErrorCode.MISSING_FIELD)
    }

    if (!body.numDays || body.numDays < 1 || body.numDays > 30) {
      return errorResponse('天數必須在 1-30 天之間', 400, ErrorCode.VALIDATION_ERROR)
    }

    if (!body.departureDate) {
      return errorResponse('請提供出發日期', 400, ErrorCode.MISSING_FIELD)
    }

    if (!body.outboundFlight?.arrivalTime || !body.returnFlight?.departureTime) {
      return errorResponse('請提供航班時間資訊', 400, ErrorCode.MISSING_FIELD)
    }

    // 3. 查詢該城市的景點
    const supabase = getSupabaseAdminClient()
    const { data: attractions, error: attractionsError } = await supabase
      .from('attractions')
      .select(`
        id,
        name,
        name_en,
        description,
        country_id,
        region_id,
        city_id,
        category,
        tags,
        duration_minutes,
        opening_hours,
        address,
        phone,
        website,
        latitude,
        longitude,
        google_maps_url,
        images,
        thumbnail,
        is_active,
        display_order,
        notes,
        ticket_price,
        data_verified,
        created_at,
        updated_at
      `)
      .eq('city_id', body.cityId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (attractionsError) {
      logger.error('查詢景點失敗:', attractionsError)
      return errorResponse('查詢景點資料失敗', 500, ErrorCode.DATABASE_ERROR)
    }

    // 4. 查詢城市資訊（用於顯示）
    const { data: city } = await supabase
      .from('cities')
      .select('id, name, country_id')
      .eq('id', body.cityId)
      .single()

    // 5. 準備生成請求
    const generateRequest: GenerateItineraryRequest = {
      cityId: body.cityId,
      numDays: body.numDays,
      departureDate: body.departureDate,
      outboundFlight: {
        arrivalTime: body.outboundFlight.arrivalTime,
        departureTime: '', // 去程不需要
      },
      returnFlight: {
        arrivalTime: '', // 回程不需要
        departureTime: body.returnFlight.departureTime,
      },
    }

    // 6. 生成行程
    const result = await generateItinerary(
      generateRequest,
      (attractions || []) as Attraction[]
    )

    // 7. 返回結果
    return successResponse({
      dailyItinerary: result.dailyItinerary,
      city: city?.name || '未知城市',
      stats: result.stats,
      warnings: result.warnings,
    })

  } catch (error) {
    logger.error('生成行程失敗:', error)
    return errorResponse('生成行程失敗，請稍後再試', 500, ErrorCode.INTERNAL_ERROR)
  }
}
