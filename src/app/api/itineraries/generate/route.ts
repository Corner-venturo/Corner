/**
 * POST /api/itineraries/generate
 * 一鍵生成行程草稿 API
 *
 * 根據城市、天數、航班資訊自動生成行程
 * 優先使用規則引擎，景點不足時自動切換到 Gemini AI
 */

import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getServerAuth } from '@/lib/auth/server-auth'
import { logger } from '@/lib/utils/logger'
import {
  generateItinerary,
  generateItineraryWithGemini,
  convertToGeminiRequest,
  type GenerateItineraryRequest,
  type AccommodationPlan,
  type ItineraryStyle,
} from '@/lib/itinerary-generator'
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response'
import type { Attraction } from '@/features/attractions/types'

// 每天最少需要的景點數量，低於此值會切換到 Gemini
const MIN_ATTRACTIONS_PER_DAY = 2

interface RequestBody {
  // 城市：支持 ID 或名稱
  cityId?: string
  countryId?: string        // 國家 ID
  destination?: string      // 目的地名稱（向後兼容）
  numDays: number
  departureDate: string
  // 航班時間：支持兩種格式
  outboundFlight?: {
    arrivalTime: string     // HH:mm
  }
  returnFlight?: {
    departureTime: string   // HH:mm
  }
  arrivalTime?: string      // 向後兼容：直接的時間
  departureTime?: string    // 向後兼容：直接的時間
  // 住宿安排和風格
  accommodations?: AccommodationPlan[] | string[]  // 支持 AccommodationPlan[] 或字串陣列（住宿名稱）
  style?: ItineraryStyle
  theme?: string            // 向後兼容：舊版本用 theme
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
    const supabase = getSupabaseAdminClient()

    // 2. 處理城市 ID（支持 UUID、城市代碼、或名稱）
    let cityId = body.cityId
    let countryId = body.countryId
    let resolvedCityName = ''
    let resolvedCountryName = ''

    // 檢查 cityId 是否為 UUID 格式
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

    // 如果 cityId 不是 UUID，可能是機場代碼（如 FUK）
    if (cityId && !isUUID(cityId)) {
      logger.log(`[Itinerary] cityId "${cityId}" 不是 UUID，嘗試作為機場代碼查詢`)
      const { data: cityByCode } = await supabase
        .from('cities')
        .select('id, name, country_id')
        .eq('airport_code', cityId.toUpperCase())
        .single()

      if (cityByCode) {
        resolvedCityName = cityByCode.name
        cityId = cityByCode.id
        // 同時取得國家
        if (cityByCode.country_id) {
          const { data: country } = await supabase
            .from('countries')
            .select('id, name')
            .eq('id', cityByCode.country_id)
            .single()
          if (country) {
            countryId = country.id
            resolvedCountryName = country.name
          }
        }
      } else {
        // 找不到，清空 cityId，後續會用其他方式處理
        logger.log(`[Itinerary] 找不到城市代碼 "${cityId}"`)
        cityId = undefined
      }
    }

    // 如果 countryId 不是 UUID，可能是國家名稱（如「日本」）
    if (countryId && !isUUID(countryId)) {
      logger.log(`[Itinerary] countryId "${countryId}" 不是 UUID，嘗試作為國家名稱查詢`)
      const { data: countryByName } = await supabase
        .from('countries')
        .select('id, name')
        .ilike('name', `%${countryId}%`)
        .limit(1)
        .single()

      if (countryByName) {
        resolvedCountryName = countryByName.name
        countryId = countryByName.id
      } else {
        // 找不到，保留原始名稱用於 Gemini
        resolvedCountryName = countryId
        countryId = undefined
      }
    }

    // 如果沒有 cityId，嘗試其他方式找到城市
    if (!cityId) {
      // 先嘗試用目的地名稱查詢城市
      if (body.destination) {
        const { data: cityData } = await supabase
          .from('cities')
          .select('id, name')
          .ilike('name', `%${body.destination}%`)
          .limit(1)
          .single()

        if (cityData) {
          cityId = cityData.id
          resolvedCityName = cityData.name
        }
      }

      // 如果還是沒找到，嘗試用目的地名稱模糊匹配景點的城市
      if (!cityId && body.destination) {
        const { data: attractionCity } = await supabase
          .from('attractions')
          .select('city_id')
          .or(`name.ilike.%${body.destination}%,address.ilike.%${body.destination}%`)
          .limit(1)
          .single()

        if (attractionCity?.city_id) {
          cityId = attractionCity.city_id
        }
      }

      // 如果有 countryId 但沒有 cityId，取該國家的第一個城市
      if (!cityId && countryId) {
        const { data: firstCity } = await supabase
          .from('cities')
          .select('id, name')
          .eq('country_id', countryId)
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .limit(1)
          .single()

        if (firstCity) {
          cityId = firstCity.id
          resolvedCityName = firstCity.name
        }
      }
    }

    // 3. 處理航班時間（支持兩種格式）
    const arrivalTime = body.outboundFlight?.arrivalTime || body.arrivalTime || '11:00'
    const departureTime = body.returnFlight?.departureTime || body.departureTime || '14:00'

    // 4. 處理風格（支持 style 或 theme）
    const style = body.style || (body.theme as ItineraryStyle | undefined)

    // 5. 驗證必要參數
    if (!body.numDays || body.numDays < 1 || body.numDays > 30) {
      return errorResponse('天數必須在 1-30 天之間', 400, ErrorCode.VALIDATION_ERROR)
    }

    if (!body.departureDate) {
      return errorResponse('請提供出發日期', 400, ErrorCode.MISSING_FIELD)
    }

    // 如果沒有城市 ID，使用一個預設邏輯或返回特殊結果
    if (!cityId) {
      logger.warn('無法找到城市 ID，使用目的地名稱:', body.destination)
      // 不阻擋生成，後續會根據情況處理
    }

    // 6. 收集所有涉及的城市 ID
    const involvedCityIds = new Set<string>()
    if (cityId) {
      involvedCityIds.add(cityId) // 入境城市
    }
    if (body.accommodations && Array.isArray(body.accommodations)) {
      body.accommodations.forEach(acc => {
        // 支持 AccommodationPlan 物件或字串
        if (typeof acc === 'object' && acc.cityId) {
          involvedCityIds.add(acc.cityId)
        }
      })
    }
    const cityIdArray = Array.from(involvedCityIds)

    // 7. 查詢景點（根據城市或國家）
    let attractionsQuery = supabase
      .from('attractions')
      .select(`
        id,
        name,
        english_name,
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
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    // 如果有城市 ID，按城市查詢；否則如果有國家 ID，按國家查詢
    if (cityIdArray.length > 0) {
      attractionsQuery = attractionsQuery.in('city_id', cityIdArray)
    } else if (countryId) {
      attractionsQuery = attractionsQuery.eq('country_id', countryId)
    }

    const { data: attractions, error: attractionsError } = await attractionsQuery

    if (attractionsError) {
      logger.error('查詢景點失敗:', attractionsError)
      return errorResponse('查詢景點資料失敗', 500, ErrorCode.DATABASE_ERROR)
    }

    // 8. 查詢城市與國家資訊（用於顯示和 Gemini）
    // 優先使用已解析的名稱
    let cityName = resolvedCityName || body.destination || '未知城市'
    let countryName = resolvedCountryName || ''

    // 如果還沒有名稱，嘗試從 ID 查詢
    if (cityId && !resolvedCityName) {
      const { data: city } = await supabase
        .from('cities')
        .select('id, name, country_id')
        .eq('id', cityId)
        .single()
      if (city) {
        cityName = city.name
        // 查詢國家名稱
        if (city.country_id && !resolvedCountryName) {
          const { data: country } = await supabase
            .from('countries')
            .select('name')
            .eq('id', city.country_id)
            .single()
          if (country) {
            countryName = country.name
          }
        }
      }
    } else if (countryId && !resolvedCountryName) {
      // 如果只有國家 ID，也查詢國家名稱
      const { data: country } = await supabase
        .from('countries')
        .select('name')
        .eq('id', countryId)
        .single()
      if (country) {
        countryName = country.name
      }
    }

    // 如果還是沒有城市名稱，嘗試從 ref_airports 表查詢（統一資料來源）
    if (cityName === '未知城市' && body.cityId) {
      const { data: airportData } = await supabase
        .from('ref_airports')
        .select('city_name_zh, name_zh')
        .eq('iata_code', body.cityId.toUpperCase())
        .single()

      if (airportData) {
        cityName = airportData.city_name_zh || airportData.name_zh || body.cityId
      } else {
        // 資料庫沒有此機場代碼，使用原始輸入
        logger.warn(`[Itinerary] 機場代碼 "${body.cityId}" 不在 ref_airports 表中`)
        cityName = body.cityId
      }
    }

    logger.log(`[Itinerary] 解析結果: cityName=${cityName}, countryName=${countryName}`)

    // 9. 檢查景點是否足夠，不足則使用 Gemini AI
    const minRequiredAttractions = body.numDays * MIN_ATTRACTIONS_PER_DAY
    const hasEnoughAttractions = (attractions?.length || 0) >= minRequiredAttractions

    logger.log(`[Itinerary] 景點查詢結果: ${attractions?.length || 0} 個, 需要: ${minRequiredAttractions} 個`)
    logger.log(`[Itinerary] cityId=${cityId}, countryId=${countryId}, cityName=${cityName}, countryName=${countryName}`)

    if (!hasEnoughAttractions) {
      logger.log(`[Itinerary] 🤖 景點不足，切換到 Gemini AI 生成`)

      // 使用 Gemini 生成
      const geminiRequest = convertToGeminiRequest(
        {
          cityId: cityId || '',
          numDays: body.numDays,
          departureDate: body.departureDate,
          outboundFlight: {
            arrivalTime: arrivalTime,
            departureTime: '',
          },
          returnFlight: {
            arrivalTime: '',
            departureTime: departureTime,
          },
          accommodations: body.accommodations && Array.isArray(body.accommodations) && typeof body.accommodations[0] === 'object'
            ? body.accommodations as AccommodationPlan[]
            : undefined,
          style: style,
        },
        cityName,
        countryName
      )

      const geminiResult = await generateItineraryWithGemini(geminiRequest)
      logger.log(`[Itinerary] Gemini 結果: success=${geminiResult.success}, error=${geminiResult.error || 'none'}`)

      if (geminiResult.success) {
        logger.log(`[Itinerary] ✅ Gemini 生成成功，共 ${geminiResult.dailyItinerary.length} 天`)
        return successResponse({
          dailyItinerary: geminiResult.dailyItinerary,
          city: cityName,
          stats: {
            totalAttractions: geminiResult.dailyItinerary.reduce((sum, day) => sum + day.activities.length, 0),
            totalDuration: 0,
            attractionsInDb: attractions?.length || 0,
            suggestedRelaxDays: 0,
          },
          warnings: [],
          generatedBy: 'gemini',  // 標記由 Gemini 生成
        })
      } else {
        logger.warn('[Itinerary] Gemini 生成失敗，回退到規則引擎:', geminiResult.error)
        // Gemini 失敗，繼續用規則引擎
      }
    }

    // 10. 準備生成請求（規則引擎）
    // 處理 accommodations：如果是字串陣列，保持原樣（generator 會處理）
    let accommodationPlans: AccommodationPlan[] | undefined
    if (body.accommodations && Array.isArray(body.accommodations)) {
      if (typeof body.accommodations[0] === 'object') {
        accommodationPlans = body.accommodations as AccommodationPlan[]
      }
      // 如果是字串陣列（住宿名稱），暫不轉換，讓 generator 處理
    }

    const generateRequest: GenerateItineraryRequest = {
      cityId: cityId || '',
      numDays: body.numDays,
      departureDate: body.departureDate,
      outboundFlight: {
        arrivalTime: arrivalTime,
        departureTime: '', // 去程不需要
      },
      returnFlight: {
        arrivalTime: '', // 回程不需要
        departureTime: departureTime,
      },
      // 住宿安排和風格
      accommodations: accommodationPlans,
      style: style,
    }

    // 11. 生成行程（規則引擎）
    logger.log(`[Itinerary] 📋 使用規則引擎生成，景點數: ${attractions?.length || 0}`)
    const result = await generateItinerary(
      generateRequest,
      (attractions || []) as Attraction[]
    )

    // 12. 返回結果
    logger.log(`[Itinerary] ✅ 規則引擎生成完成，共 ${result.dailyItinerary.length} 天`)
    return successResponse({
      dailyItinerary: result.dailyItinerary,
      city: cityName,
      stats: result.stats,
      warnings: result.warnings,
      generatedBy: 'rules',  // 標記由規則引擎生成
    })

  } catch (error) {
    logger.error('生成行程失敗:', error)
    return errorResponse('生成行程失敗，請稍後再試', 500, ErrorCode.INTERNAL_ERROR)
  }
}
