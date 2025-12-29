/**
 * PNR Reference Data Service
 * 從資料庫載入並快取航空公司、機場、SSR 等參考資料
 */

import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'

// 類型定義
export interface Airline {
  iata_code: string
  icao_code: string | null
  name_en: string | null
  name_zh: string | null
  country: string | null
  alliance: string | null
}

export interface Airport {
  iata_code: string
  icao_code: string | null
  name_en: string | null
  name_zh: string | null
  city_code: string | null
  city_name_zh: string | null
  country_code: string | null
  timezone: string | null
}

export interface BookingClass {
  code: string
  cabin_type: string | null
  description: string | null
  priority: number | null
}

export interface SSRCode {
  code: string
  category: string | null
  description_en: string | null
  description_zh: string | null
}

export interface StatusCode {
  code: string
  category: string | null
  description_en: string | null
  description_zh: string | null
}

export interface ReferenceData {
  airlines: Map<string, Airline>
  airports: Map<string, Airport>
  bookingClasses: Map<string, BookingClass>
  ssrCodes: Map<string, SSRCode>
  statusCodes: Map<string, StatusCode>
  lastFetched: Date | null
  isLoading: boolean
  error: string | null
}

// 快取時間（毫秒）- 1 小時
const CACHE_TTL = 60 * 60 * 1000

// 全域快取
let cachedData: ReferenceData = {
  airlines: new Map(),
  airports: new Map(),
  bookingClasses: new Map(),
  ssrCodes: new Map(),
  statusCodes: new Map(),
  lastFetched: null,
  isLoading: false,
  error: null,
}

// 正在進行的請求 Promise（避免重複請求）
let fetchPromise: Promise<ReferenceData> | null = null

/**
 * 檢查快取是否有效
 */
function isCacheValid(): boolean {
  if (!cachedData.lastFetched) return false
  const age = Date.now() - cachedData.lastFetched.getTime()
  return age < CACHE_TTL
}

/**
 * 從 Supabase 載入所有參考資料
 */
async function fetchAllReferenceData(): Promise<ReferenceData> {
  logger.log('📚 載入 PNR 參考資料...')

  try {
    // 並行載入所有參考資料
    const [
      airlinesResult,
      airportsResult,
      bookingClassesResult,
      ssrCodesResult,
      statusCodesResult,
    ] = await Promise.all([
      supabase.from('ref_airlines').select('*').eq('is_active', true),
      supabase.from('ref_airports').select('*'),
      supabase.from('ref_booking_classes').select('*').order('priority'),
      supabase.from('ref_ssr_codes').select('*'),
      supabase.from('ref_status_codes').select('*'),
    ])

    // 轉換為 Map
    const airlines = new Map<string, Airline>()
    if (airlinesResult.data) {
      for (const row of airlinesResult.data) {
        airlines.set(row.iata_code, row as Airline)
      }
    }

    const airports = new Map<string, Airport>()
    if (airportsResult.data) {
      for (const row of airportsResult.data) {
        airports.set(row.iata_code, row as Airport)
      }
    }

    const bookingClasses = new Map<string, BookingClass>()
    if (bookingClassesResult.data) {
      for (const row of bookingClassesResult.data) {
        bookingClasses.set(row.code, row as BookingClass)
      }
    }

    const ssrCodes = new Map<string, SSRCode>()
    if (ssrCodesResult.data) {
      for (const row of ssrCodesResult.data) {
        ssrCodes.set(row.code, row as SSRCode)
      }
    }

    const statusCodes = new Map<string, StatusCode>()
    if (statusCodesResult.data) {
      for (const row of statusCodesResult.data) {
        statusCodes.set(row.code, row as StatusCode)
      }
    }

    logger.log(`✅ 參考資料載入完成: ${airlines.size} 航空公司, ${airports.size} 機場, ${ssrCodes.size} SSR 代碼`)

    cachedData = {
      airlines,
      airports,
      bookingClasses,
      ssrCodes,
      statusCodes,
      lastFetched: new Date(),
      isLoading: false,
      error: null,
    }

    return cachedData
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '未知錯誤'
    logger.error('❌ 載入參考資料失敗:', errorMessage)
    cachedData.error = errorMessage
    cachedData.isLoading = false
    throw err
  }
}

/**
 * 取得參考資料（使用快取）
 */
export async function getReferenceData(): Promise<ReferenceData> {
  // 如果快取有效，直接返回
  if (isCacheValid()) {
    return cachedData
  }

  // 如果正在載入中，等待現有請求
  if (fetchPromise) {
    return fetchPromise
  }

  // 開始新的請求
  cachedData.isLoading = true
  fetchPromise = fetchAllReferenceData().finally(() => {
    fetchPromise = null
  })

  return fetchPromise
}

/**
 * 強制重新載入參考資料
 */
export async function refreshReferenceData(): Promise<ReferenceData> {
  cachedData.lastFetched = null
  return getReferenceData()
}

/**
 * 取得航空公司資訊
 */
export function getAirline(code: string): Airline | undefined {
  return cachedData.airlines.get(code.toUpperCase())
}

/**
 * 取得航空公司中文名稱
 */
export function getAirlineName(code: string, preferChinese = true): string {
  const airline = getAirline(code)
  if (!airline) return code
  if (preferChinese && airline.name_zh) return airline.name_zh
  return airline.name_en || code
}

/**
 * 取得機場資訊
 */
export function getAirport(code: string): Airport | undefined {
  return cachedData.airports.get(code.toUpperCase())
}

/**
 * 取得機場中文名稱
 */
export function getAirportName(code: string, preferChinese = true): string {
  const airport = getAirport(code)
  if (!airport) return code
  if (preferChinese && airport.name_zh) return airport.name_zh
  return airport.name_en || code
}

/**
 * 取得城市中文名稱
 */
export function getCityName(airportCode: string): string {
  const airport = getAirport(airportCode)
  return airport?.city_name_zh || airportCode
}

/**
 * 取得艙等資訊
 */
export function getBookingClass(code: string): BookingClass | undefined {
  return cachedData.bookingClasses.get(code.toUpperCase())
}

/**
 * 取得艙等描述
 */
export function getBookingClassDescription(code: string): string {
  const bc = getBookingClass(code)
  if (!bc) return code
  return bc.description || `${bc.cabin_type} - ${code}`
}

/**
 * 取得 SSR 代碼資訊
 */
export function getSSRCode(code: string): SSRCode | undefined {
  return cachedData.ssrCodes.get(code.toUpperCase())
}

/**
 * 取得 SSR 代碼描述
 */
export function getSSRDescription(code: string, preferChinese = true): string {
  const ssr = getSSRCode(code)
  if (!ssr) return code
  if (preferChinese && ssr.description_zh) return ssr.description_zh
  return ssr.description_en || code
}

/**
 * 取得 SSR 類別
 */
export function getSSRCategory(code: string): string | null {
  const ssr = getSSRCode(code)
  return ssr?.category || null
}

/**
 * 取得狀態碼資訊
 */
export function getStatusCode(code: string): StatusCode | undefined {
  return cachedData.statusCodes.get(code.toUpperCase())
}

/**
 * 取得狀態碼描述
 */
export function getStatusDescription(code: string, preferChinese = true): string {
  const status = getStatusCode(code)
  if (!status) return code
  if (preferChinese && status.description_zh) return status.description_zh
  return status.description_en || code
}

/**
 * 取得狀態碼類別
 */
export function getStatusCategory(code: string): string | null {
  const status = getStatusCode(code)
  return status?.category || null
}

/**
 * 判斷狀態是否為確認
 */
export function isConfirmedStatus(code: string): boolean {
  const category = getStatusCategory(code)
  return category === 'Confirmed'
}

/**
 * 判斷狀態是否為候補
 */
export function isWaitlistStatus(code: string): boolean {
  const category = getStatusCategory(code)
  return category === 'Waitlist'
}

/**
 * 判斷狀態是否為取消
 */
export function isCancelledStatus(code: string): boolean {
  const category = getStatusCategory(code)
  return category === 'Cancelled'
}

/**
 * 取得快取狀態（用於調試）
 */
export function getCacheStatus(): {
  isValid: boolean
  lastFetched: Date | null
  counts: {
    airlines: number
    airports: number
    bookingClasses: number
    ssrCodes: number
    statusCodes: number
  }
} {
  return {
    isValid: isCacheValid(),
    lastFetched: cachedData.lastFetched,
    counts: {
      airlines: cachedData.airlines.size,
      airports: cachedData.airports.size,
      bookingClasses: cachedData.bookingClasses.size,
      ssrCodes: cachedData.ssrCodes.size,
      statusCodes: cachedData.statusCodes.size,
    },
  }
}
