'use server'

import { logger } from '@/lib/utils/logger'

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
 */
function formatTime(dateString: string | null | undefined): string {
  if (!dateString) return '--:--'
  try {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Taipei',
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
 * 機場中文名稱對照表
 */
function getAirportChineseName(iataCode: string, englishName: string): string {
  const airportMap: Record<string, string> = {
    // 台灣機場
    TPE: '桃園國際機場',
    TSA: '台北松山機場',
    KHH: '高雄小港機場',
    RMQ: '台中清泉崗機場',
    TNN: '台南機場',
    // 日本機場
    NRT: '東京成田機場',
    HND: '東京羽田機場',
    KIX: '大阪關西機場',
    ITM: '大阪伊丹機場',
    NGO: '名古屋中部機場',
    CTS: '札幌新千歲機場',
    FUK: '福岡機場',
    OKA: '沖繩那霸機場',
    KMQ: '小松機場',
    SDJ: '仙台機場',
    HIJ: '廣島機場',
    KOJ: '鹿兒島機場',
    // 韓國機場
    ICN: '仁川國際機場',
    GMP: '首爾金浦機場',
    PUS: '釜山金海機場',
    CJU: '濟州機場',
    // 中國機場
    PVG: '上海浦東機場',
    SHA: '上海虹橋機場',
    PEK: '北京首都機場',
    PKX: '北京大興機場',
    CAN: '廣州白雲機場',
    SZX: '深圳寶安機場',
    CTU: '成都天府機場',
    // 香港/澳門
    HKG: '香港國際機場',
    MFM: '澳門機場',
    // 東南亞機場
    SIN: '新加坡樟宜機場',
    BKK: '曼谷素萬那普機場',
    DMK: '曼谷廊曼機場',
    SGN: '胡志明市機場',
    HAN: '河內機場',
    DPS: '峇里島機場',
    MNL: '馬尼拉機場',
    KUL: '吉隆坡機場',
    // 其他常見機場
    LAX: '洛杉磯機場',
    SFO: '舊金山機場',
    JFK: '紐約乍甘迺迪機場',
    LHR: '倫敦希斯洛機場',
    CDG: '巴黎戴高樂機場',
    FRA: '法蘭克福機場',
    SYD: '雪梨機場',
    AKL: '奧克蘭機場',
  }
  return airportMap[iataCode] || englishName
}

/**
 * 航空公司中文名稱對照表
 */
function getAirlineChineseName(iataCode: string, englishName: string): string {
  const airlineMap: Record<string, string> = {
    // 台灣航空公司
    CI: '中華航空',
    BR: '長榮航空',
    IT: '台灣虎航',
    JX: '星宇航空',
    B7: '立榮航空',
    AE: '華信航空',
    // 日本航空公司
    JL: '日本航空',
    NH: '全日空',
    MM: '樂桃航空',
    GK: '捷星日本',
    BC: '天馬航空',
    // 韓國航空公司
    KE: '大韓航空',
    OZ: '韓亞航空',
    TW: '德威航空',
    LJ: '真航空',
    ZE: '易斯達航空',
    // 中國航空公司
    CA: '中國國際航空',
    MU: '中國東方航空',
    CZ: '中國南方航空',
    HU: '海南航空',
    SC: '山東航空',
    FM: '上海航空',
    // 香港/澳門航空公司
    CX: '國泰航空',
    HX: '香港航空',
    UO: '香港快運',
    NX: '澳門航空',
    // 東南亞航空公司
    SQ: '新加坡航空',
    TR: '酷航',
    TG: '泰國航空',
    VN: '越南航空',
    VJ: '越捷航空',
    MH: '馬來西亞航空',
    AK: '亞洲航空',
    PR: '菲律賓航空',
    // 歐美航空公司
    AA: '美國航空',
    UA: '聯合航空',
    DL: '達美航空',
    BA: '英國航空',
    AF: '法國航空',
    LH: '漢莎航空',
    EK: '阿聯酋航空',
    QR: '卡達航空',
    TK: '土耳其航空',
  }
  return airlineMap[iataCode] || englishName
}

/**
 * 查詢單一航班
 * AeroDataBox API: /flights/number/{flightNumber}/{date}
 */
export async function searchFlightAction(
  flightNumber: string,
  flightDate: string
): Promise<{ data?: FlightData; error?: string }> {
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

    // 取第一筆結果
    const flight = apiData[0]
    const dep = flight.departure || {}
    const arr = flight.arrival || {}

    // AeroDataBox 時間格式: scheduledTime.local = "2025-12-09 14:35+09:00"
    const depScheduledTime = dep.scheduledTime?.local || dep.scheduledTime?.utc
    const arrScheduledTime = arr.scheduledTime?.local || arr.scheduledTime?.utc
    const depActualTime = dep.actualTime?.local || dep.actualTime?.utc
    const arrActualTime = arr.actualTime?.local || arr.actualTime?.utc

    const airlineCode = flight.airline?.iata || ''
    const airlineName = getAirlineChineseName(airlineCode, flight.airline?.name || '')
    const depIata = dep.airport?.iata || ''
    const arrIata = arr.airport?.iata || ''

    const transformedData: FlightData = {
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
        delay: dep.delay,
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
      aircraft: flight.aircraft?.model,
      date: flightDate,
      duration: depScheduledTime && arrScheduledTime
        ? calculateDuration(depScheduledTime, arrScheduledTime)
        : undefined,
    }

    logger.log(`✅ 航班查詢成功: ${cleanFlightNumber}`)
    return { data: transformedData }
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
    let flights: AirportFlightItem[] = departures.map((flight: ApiFlightData) => {
      const depTime = flight.departure?.scheduledTime?.local || flight.departure?.scheduledTime?.utc
      const estTime = flight.departure?.revisedTime?.local || flight.departure?.revisedTime?.utc
      const airlineCode = flight.airline?.iata || ''
      const destIata = flight.arrival?.airport?.iata || ''
      return {
        flightNumber: flight.number || '',
        airline: getAirlineChineseName(airlineCode, flight.airline?.name || ''),
        airlineCode: airlineCode,
        destination: getAirportChineseName(destIata, flight.arrival?.airport?.name || ''),
        destinationIata: destIata,
        scheduledTime: formatTime(depTime),
        estimatedTime: estTime ? formatTime(estTime) : undefined,
        status: getStatusText(flight.status || 'Unknown'),
        terminal: flight.departure?.terminal,
        gate: flight.departure?.gate,
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

    let flights: AirportFlightItem[] = arrivals.map((flight: ApiFlightData) => {
      const arrTime = flight.arrival?.scheduledTime?.local || flight.arrival?.scheduledTime?.utc
      const estTime = flight.arrival?.revisedTime?.local || flight.arrival?.revisedTime?.utc
      const airlineCode = flight.airline?.iata || ''
      const originIata = flight.departure?.airport?.iata || ''
      return {
        flightNumber: flight.number || '',
        airline: getAirlineChineseName(airlineCode, flight.airline?.name || ''),
        airlineCode: airlineCode,
        origin: getAirportChineseName(originIata, flight.departure?.airport?.name || ''),
        originIata: originIata,
        destination: getAirportChineseName(cleanAirportCode, cleanAirportCode),
        destinationIata: cleanAirportCode,
        scheduledTime: formatTime(arrTime),
        estimatedTime: estTime ? formatTime(estTime) : undefined,
        status: getStatusText(flight.status || 'Unknown'),
        terminal: flight.arrival?.terminal,
        gate: flight.arrival?.gate,
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
