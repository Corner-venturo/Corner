'use server'

import { logger } from '@/lib/utils/logger'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

// ============================================
// 機場/航空公司名稱快取（統一從資料庫讀取）
// ============================================
interface RefCache {
  airports: Map<string, string>  // iata_code -> name_zh
  airlines: Map<string, string>  // iata_code -> name_zh
  lastFetched: number
}

const CACHE_TTL = 60 * 60 * 1000 // 1 小時
let refCache: RefCache = {
  airports: new Map(),
  airlines: new Map(),
  lastFetched: 0,
}

/**
 * 載入參考資料（機場、航空公司名稱）
 */
async function loadReferenceData(): Promise<void> {
  const now = Date.now()
  if (refCache.lastFetched > 0 && now - refCache.lastFetched < CACHE_TTL) {
    return // 快取有效
  }

  const supabase = getSupabaseAdminClient()

  const [airportsResult, airlinesResult] = await Promise.all([
    supabase.from('ref_airports').select('iata_code, name_zh'),
    supabase.from('ref_airlines').select('iata_code, name_zh').eq('is_active', true),
  ])

  if (airportsResult.data) {
    refCache.airports = new Map(
      airportsResult.data.map(row => [row.iata_code, row.name_zh || row.iata_code])
    )
  }

  if (airlinesResult.data) {
    refCache.airlines = new Map(
      airlinesResult.data.map(row => [row.iata_code, row.name_zh || row.iata_code])
    )
  }

  refCache.lastFetched = now
  logger.log(`✅ 航班參考資料已載入: ${refCache.airports.size} 機場, ${refCache.airlines.size} 航空公司`)
}

// 航班資料介面
export interface FlightData {
  flightNumber: string
  airline: string
  departure: {
    airport: string
    iata: string
    terminal?: string
    gate?: string
    time: string
    scheduledTime?: string
    actualTime?: string
    delay?: number
  }
  arrival: {
    airport: string
    iata: string
    terminal?: string
    gate?: string
    time: string
    scheduledTime?: string
    actualTime?: string
  }
  status: string
  statusText: string
  aircraft?: string
  date: string
  duration?: string
}

// 機場航班列表項目
export interface AirportFlightItem {
  flightNumber: string
  airline: string
  airlineCode: string
  destination: string
  destinationIata: string
  origin?: string
  originIata?: string
  scheduledTime: string
  estimatedTime?: string
  status: string
  terminal?: string
  gate?: string
}

// API 回傳的航班資料格式
interface ApiFlightData {
  number?: string
  airline?: { iata?: string; name?: string }
  departure?: {
    airport?: { iata?: string; name?: string }
    scheduledTime?: { local?: string; utc?: string }
    revisedTime?: { local?: string; utc?: string }
    terminal?: string
    gate?: string
  }
  arrival?: {
    airport?: { iata?: string; name?: string }
    scheduledTime?: { local?: string; utc?: string }
    revisedTime?: { local?: string; utc?: string }
    terminal?: string
    gate?: string
  }
  // Airport Departures/Arrivals API 使用 movement 結構
  movement?: {
    airport?: { iata?: string; name?: string }
    scheduledTime?: { local?: string; utc?: string }
    revisedTime?: { local?: string; utc?: string }
    terminal?: string
    gate?: string
  }
  status?: string
}

/**
 * 取得 AeroDataBox API Key
 */
function getApiKey(): string | null {
  return process.env.AERODATABOX_API_KEY || null
}

/**
 * 格式化時間為 HH:mm
 * API 回傳的 local 時間已經是當地時間（如 "2025-12-09 14:35+09:00"）
 * 直接提取 HH:mm，不做時區轉換
 */
function formatTime(dateString: string | null | undefined): string {
  if (!dateString) return '--:--'
  try {
    // AeroDataBox 格式: "2025-12-09 14:35+09:00" 或 ISO 格式
    // 直接從字串中提取時間部分（當地時間）
    const timeMatch = dateString.match(/(\d{2}):(\d{2})/)
    if (timeMatch) {
      return `${timeMatch[1]}:${timeMatch[2]}`
    }
    // fallback: 如果格式不符，嘗試解析
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '--:--'
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return '--:--'
  }
}

/**
 * 計算飛行時間
 */
function calculateDuration(departure: string, arrival: string): string {
  try {
    const dep = new Date(departure)
    const arr = new Date(arrival)
    const diffMs = arr.getTime() - dep.getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  } catch {
    return ''
  }
}

/**
 * 轉換航班狀態為中文
 */
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    Unknown: '未知',
    Expected: '預計',
    EnRoute: '飛行中',
    CheckIn: '報到中',
    Boarding: '登機中',
    GateClosed: '登機門已關',
    Departed: '已起飛',
    Delayed: '延誤',
    Approaching: '即將抵達',
    Arrived: '已抵達',
    Canceled: '已取消',
    Diverted: '改降',
    CanceledUncertain: '可能取消',
  }
  return statusMap[status] || status
}

/**
 * 機場中文名稱（從快取讀取，統一資料來源）
 */
function getAirportChineseName(iataCode: string, englishName: string): string {
  return refCache.airports.get(iataCode) || englishName
}

/**
 * 航空公司中文名稱（從快取讀取，統一資料來源）
 */
function getAirlineChineseName(iataCode: string, englishName: string): string {
  return refCache.airlines.get(iataCode) || englishName
}

/**
 * 檢查航班資料是否完整
 * 返回缺少的欄位列表
 */
function validateFlightData(flight: ApiFlightData): string[] {
  const missing: string[] = []
  const dep = flight.departure || {}
  const arr = flight.arrival || {}

  if (!dep.scheduledTime?.local && !dep.scheduledTime?.utc) {
    missing.push('出發時間')
  }
  if (!dep.airport?.iata) {
    missing.push('出發機場代碼')
  }
  if (!arr.scheduledTime?.local && !arr.scheduledTime?.utc) {
    missing.push('抵達時間')
  }
  if (!arr.airport?.iata) {
    missing.push('抵達機場代碼')
  }

  return missing
}

/**
 * 將 API 回傳的單筆航班資料轉換為 FlightData 格式
 */
function transformFlightData(flight: ApiFlightData, flightDate: string, cleanFlightNumber: string): FlightData {
  const dep = flight.departure || {}
  const arr = flight.arrival || {}

  // AeroDataBox 時間格式: scheduledTime.local = "2025-12-09 14:35+09:00"
  const depScheduledTime = dep.scheduledTime?.local || dep.scheduledTime?.utc
  const arrScheduledTime = arr.scheduledTime?.local || arr.scheduledTime?.utc
  const depActualTime = dep.revisedTime?.local || dep.revisedTime?.utc
  const arrActualTime = arr.revisedTime?.local || arr.revisedTime?.utc

  const airlineCode = flight.airline?.iata || ''
  const airlineName = getAirlineChineseName(airlineCode, flight.airline?.name || '')
  const depIata = dep.airport?.iata || ''
  const arrIata = arr.airport?.iata || ''

  return {
    flightNumber: flight.number || cleanFlightNumber,
    airline: airlineName,
    departure: {
      airport: getAirportChineseName(depIata, dep.airport?.name || ''),
      iata: depIata,
      terminal: dep.terminal,
      gate: dep.gate,
      time: formatTime(depScheduledTime),
      scheduledTime: formatTime(depScheduledTime),
      actualTime: depActualTime ? formatTime(depActualTime) : undefined,
    },
    arrival: {
      airport: getAirportChineseName(arrIata, arr.airport?.name || ''),
      iata: arrIata,
      terminal: arr.terminal,
      gate: arr.gate,
      time: formatTime(arrScheduledTime),
      scheduledTime: formatTime(arrScheduledTime),
      actualTime: arrActualTime ? formatTime(arrActualTime) : undefined,
    },
    status: flight.status || 'Unknown',
    statusText: getStatusText(flight.status || 'Unknown'),
    aircraft: (flight as ApiFlightData & { aircraft?: { model?: string } }).aircraft?.model,
    date: flightDate,
    duration: depScheduledTime && arrScheduledTime
      ? calculateDuration(depScheduledTime, arrScheduledTime)
      : undefined,
  }
}

/**
 * 查詢單一航班
 * AeroDataBox API: /flights/number/{flightNumber}/{date}
 *
 * 注意：同一航班號可能有多個航段（如 TR874 有 SIN→TPE 和 TPE→NRT）
 * - 單一航段時返回 { data: FlightData }
 * - 多航段時返回 { segments: FlightData[] } 讓 UI 選擇
 */
export async function searchFlightAction(
  flightNumber: string,
  flightDate: string
): Promise<{ data?: FlightData; segments?: FlightData[]; error?: string; warning?: string }> {
  // 載入機場/航空公司參考資料（從資料庫，有快取）
  await loadReferenceData()

  const apiKey = getApiKey()

  if (!apiKey) {
    logger.error('❌ AeroDataBox API key is not configured.')
    return { error: 'API 金鑰未設定，請聯絡管理員。' }
  }

  // 清理航班號碼（移除空格）
  const cleanFlightNumber = flightNumber.replace(/\s/g, '').toUpperCase()

  const url = `https://aerodatabox.p.rapidapi.com/flights/number/${cleanFlightNumber}/${flightDate}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'aerodatabox.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return { error: '找不到該航班的資訊。' }
      }
      if (response.status === 429) {
        return { error: '本月查詢額度已用完，請下個月再試。' }
      }
      logger.error(`AeroDataBox API Error: ${response.status}`)
      return { error: '無法查詢航班資訊，請稍後再試。' }
    }

    const apiData = await response.json()

    if (!apiData || apiData.length === 0) {
      return { error: '找不到該航班的資訊。' }
    }

    // 如果只有一筆結果，直接返回
    if (apiData.length === 1) {
      const missingFields = validateFlightData(apiData[0])
      const transformedData = transformFlightData(apiData[0], flightDate, cleanFlightNumber)
      logger.log(`✅ 航班查詢成功: ${cleanFlightNumber}`)

      // 如果資料不完整，返回警告
      if (missingFields.length > 0) {
        const warning = `航班資料不完整，缺少：${missingFields.join('、')}。可能是日期太遠，建議手動輸入。`
        logger.warn(`⚠️ ${cleanFlightNumber} 資料不完整: ${missingFields.join(', ')}`)
        return { data: transformedData, warning }
      }

      return { data: transformedData }
    }

    // 多航段：返回所有航段讓用戶選擇
    const segments = apiData.map((flight: ApiFlightData) =>
      transformFlightData(flight, flightDate, cleanFlightNumber)
    )

    // 檢查是否有航段資料不完整
    const incompleteSegments = apiData.filter((flight: ApiFlightData) =>
      validateFlightData(flight).length > 0
    )
    const warning = incompleteSegments.length > 0
      ? `部分航段資料不完整，可能是日期太遠，請確認後手動補充。`
      : undefined

    logger.log(`✅ 航班查詢成功: ${cleanFlightNumber}，共 ${segments.length} 個航段`)
    return { segments, warning }
  } catch (error) {
    logger.error('Failed to fetch flight data:', error)
    return { error: '查詢航班時發生網路錯誤。' }
  }
}

/**
 * 查詢機場出發航班
 * AeroDataBox API: /flights/airports/iata/{airportCode}/{fromLocal}/{toLocal}
 */
export async function searchAirportDeparturesAction(
  airportCode: string,
  date: string,
  destinationFilter?: string
): Promise<{ data?: AirportFlightItem[]; error?: string }> {
  // 載入機場/航空公司參考資料（從資料庫，有快取）
  await loadReferenceData()

  const apiKey = getApiKey()

  if (!apiKey) {
    logger.error('❌ AeroDataBox API key is not configured.')
    return { error: 'API 金鑰未設定，請聯絡管理員。' }
  }

  // 驗證日期格式 (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) {
    logger.error(`❌ 日期格式錯誤: ${date}，應為 YYYY-MM-DD`)
    return { error: '日期格式錯誤，請使用 YYYY-MM-DD 格式。' }
  }

  const cleanAirportCode = airportCode.toUpperCase().trim()

  // 驗證機場代碼
  if (!cleanAirportCode || cleanAirportCode.length !== 3) {
    logger.error(`❌ 機場代碼格式錯誤: ${cleanAirportCode}`)
    return { error: '機場代碼應為 3 個字母（如 TPE）。' }
  }

  // API 限制：時間範圍不能超過 12 小時，所以需要分兩次查詢
  const timeRanges = [
    { from: `${date}T00:00`, to: `${date}T11:59` },
    { from: `${date}T12:00`, to: `${date}T23:59` },
  ]

  try {
    logger.log(`🔍 查詢機場出發航班: ${cleanAirportCode} on ${date}`)

    let allDepartures: ApiFlightData[] = []

    for (const range of timeRanges) {
      const url = `https://aerodatabox.p.rapidapi.com/flights/airports/iata/${cleanAirportCode}/${range.from}/${range.to}?direction=Departure&withCancelled=true`
      logger.log(`🔗 API URL: ${url}`)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'aerodatabox.p.rapidapi.com',
          'x-rapidapi-key': apiKey,
        },
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        logger.error(`❌ AeroDataBox API Error: ${response.status} - ${errorText}`)
        logger.error(`❌ Request: ${cleanAirportCode} on ${date}`)

        if (response.status === 400) {
          return { error: `查詢參數錯誤：機場 ${cleanAirportCode}，日期 ${date}。請確認機場代碼正確。` }
        }
        if (response.status === 404) {
          return { error: '找不到該機場的資訊。' }
        }
        if (response.status === 429) {
          return { error: '本月查詢額度已用完，請下個月再試。' }
        }
        if (response.status === 401 || response.status === 403) {
          return { error: 'API 金鑰無效或已過期，請聯絡管理員。' }
        }
        return { error: `查詢失敗 (${response.status})，請稍後再試。` }
      }

      const apiData = await response.json()
      const departures = apiData.departures || []
      allDepartures = allDepartures.concat(departures)
    }

    const departures = allDepartures

    // 轉換資料格式
    // 注意：Airport Departures API 使用 movement 結構，而非 departure/arrival
    let flights: AirportFlightItem[] = departures.map((flight: ApiFlightData) => {
      // 優先使用 movement（Airport API），fallback 到 departure（Flight API）
      const movement = flight.movement || flight.departure
      const depTime = movement?.scheduledTime?.local || movement?.scheduledTime?.utc
      const estTime = movement?.revisedTime?.local || movement?.revisedTime?.utc
      const airlineCode = flight.airline?.iata || ''
      // 目的地：movement.airport 是目的地機場（對於出發航班）
      const destAirport = flight.movement?.airport || flight.arrival?.airport
      const destIata = destAirport?.iata || ''
      return {
        flightNumber: flight.number || '',
        airline: getAirlineChineseName(airlineCode, flight.airline?.name || ''),
        airlineCode: airlineCode,
        destination: getAirportChineseName(destIata, destAirport?.name || ''),
        destinationIata: destIata,
        scheduledTime: formatTime(depTime),
        estimatedTime: estTime ? formatTime(estTime) : undefined,
        status: getStatusText(flight.status || 'Unknown'),
        terminal: movement?.terminal,
        gate: movement?.gate,
      }
    })

    // 如果有指定目的地，過濾結果
    if (destinationFilter) {
      const filterUpper = destinationFilter.toUpperCase()
      flights = flights.filter(
        f =>
          f.destinationIata === filterUpper ||
          f.destination.toUpperCase().includes(filterUpper)
      )
    }

    // 按時間排序
    flights.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))

    logger.log(`✅ 機場航班查詢成功: ${cleanAirportCode}，共 ${flights.length} 班`)
    return { data: flights }
  } catch (error) {
    logger.error('Failed to fetch airport flights:', error)
    return { error: '查詢機場航班時發生網路錯誤。' }
  }
}

/**
 * 查詢機場抵達航班
 */
export async function searchAirportArrivalsAction(
  airportCode: string,
  date: string,
  originFilter?: string
): Promise<{ data?: AirportFlightItem[]; error?: string }> {
  // 載入機場/航空公司參考資料（從資料庫，有快取）
  await loadReferenceData()

  const apiKey = getApiKey()

  if (!apiKey) {
    logger.error('❌ AeroDataBox API key is not configured.')
    return { error: 'API 金鑰未設定，請聯絡管理員。' }
  }

  const fromTime = `${date}T00:00`
  const toTime = `${date}T23:59`
  const cleanAirportCode = airportCode.toUpperCase()

  const url = `https://aerodatabox.p.rapidapi.com/flights/airports/iata/${cleanAirportCode}/${fromTime}/${toTime}?direction=Arrival&withCancelled=true`

  try {
    logger.log(`🔍 查詢機場抵達航班: ${url}`)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'aerodatabox.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      logger.error(`❌ AeroDataBox API Error: ${response.status} - ${errorText}`)

      if (response.status === 404) {
        return { error: '找不到該機場的資訊。' }
      }
      if (response.status === 429) {
        return { error: '本月查詢額度已用完，請下個月再試。' }
      }
      if (response.status === 401 || response.status === 403) {
        return { error: 'API 金鑰無效或已過期，請聯絡管理員。' }
      }
      return { error: `查詢失敗 (${response.status})，請稍後再試。` }
    }

    const apiData = await response.json()
    const arrivals = apiData.arrivals || []

    // 注意：Airport Arrivals API 使用 movement 結構
    // movement.airport 是出發機場（航班從哪裡來）
    // movement.scheduledTime 是抵達時間
    let flights: AirportFlightItem[] = arrivals.map((flight: ApiFlightData) => {
      // 優先使用 movement（Airport API），fallback 到 arrival（Flight API）
      const movement = flight.movement || flight.arrival
      const arrTime = movement?.scheduledTime?.local || movement?.scheduledTime?.utc
      const estTime = movement?.revisedTime?.local || movement?.revisedTime?.utc
      const airlineCode = flight.airline?.iata || ''
      // 出發地：movement.airport 是出發機場（對於抵達航班）
      const originAirport = flight.movement?.airport || flight.departure?.airport
      const originIata = originAirport?.iata || ''
      return {
        flightNumber: flight.number || '',
        airline: getAirlineChineseName(airlineCode, flight.airline?.name || ''),
        airlineCode: airlineCode,
        origin: getAirportChineseName(originIata, originAirport?.name || ''),
        originIata: originIata,
        destination: getAirportChineseName(cleanAirportCode, cleanAirportCode),
        destinationIata: cleanAirportCode,
        scheduledTime: formatTime(arrTime),
        estimatedTime: estTime ? formatTime(estTime) : undefined,
        status: getStatusText(flight.status || 'Unknown'),
        terminal: movement?.terminal,
        gate: movement?.gate,
      }
    })

    // 如果有指定出發地，過濾結果
    if (originFilter) {
      const filterUpper = originFilter.toUpperCase()
      flights = flights.filter(
        f =>
          f.originIata === filterUpper ||
          (f.origin && f.origin.toUpperCase().includes(filterUpper))
      )
    }

    // 按時間排序
    flights.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))

    logger.log(`✅ 機場抵達航班查詢成功: ${cleanAirportCode}，共 ${flights.length} 班`)
    return { data: flights }
  } catch (error) {
    logger.error('Failed to fetch airport arrivals:', error)
    return { error: '查詢機場航班時發生網路錯誤。' }
  }
}
