'use server'

import { logger } from '@/lib/utils/logger'

// This interface should ideally be shared in a types file
interface FlightData {
  flightNumber: string
  airline: string
  departure: {
    airport: string
    iata: string
    terminal?: string
    gate?: string
    time: string
  }
  arrival: {
    airport: string
    iata: string
    terminal?: string
    time: string
  }
  status: string
  aircraft?: string
  date: string
}

/**
 * 取得 API Keys 列表（支援多 Key 輪換）
 */
function getApiKeys(): string[] {
  // 優先使用多 Key 設定
  const multiKeys = process.env.AVIATIONSTACK_API_KEYS
  if (multiKeys) {
    return multiKeys.split(',').map(k => k.trim()).filter(Boolean)
  }
  // 向後相容：使用單一 Key
  const singleKey = process.env.NEXT_PUBLIC_AVIATIONSTACK_KEY
  if (singleKey) {
    return [singleKey]
  }
  return []
}

/**
 * 嘗試使用單一 API Key 查詢航班
 */
async function tryFetchWithKey(
  apiKey: string,
  flightNumber: string,
  flightDate: string
): Promise<{ success: boolean; data?: FlightData; error?: string; quotaExceeded?: boolean }> {
  const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_number=${flightNumber}&flight_date=${flightDate}`

  try {
    const response = await fetch(url)
    const apiData = await response.json()

    if (apiData.error) {
      // 檢查是否為額度用完
      const errorCode = apiData.error.code
      const errorMessage = apiData.error.message || ''

      if (
        errorCode === 'usage_limit_reached' ||
        errorCode === 104 ||
        errorMessage.includes('limit') ||
        errorMessage.includes('quota')
      ) {
        logger.log(`⚠️ API Key ${apiKey.slice(0, 8)}... 額度已用完，嘗試下一個`)
        return { success: false, quotaExceeded: true }
      }

      logger.error('Aviationstack API Error:', apiData.error)
      return { success: false, error: apiData.error.message || '無法查詢航班資訊。' }
    }

    if (!apiData.data || apiData.data.length === 0) {
      return { success: false, error: '找不到該航班的資訊。' }
    }

    const flight = apiData.data[0]

    const transformedData: FlightData = {
      flightNumber: flight.flight.number,
      airline: flight.airline.name,
      departure: {
        airport: flight.departure.airport,
        iata: flight.departure.iata,
        terminal: flight.departure.terminal,
        gate: flight.departure.gate,
        time: new Date(flight.departure.scheduled).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
      },
      arrival: {
        airport: flight.arrival.airport,
        iata: flight.arrival.iata,
        terminal: flight.arrival.terminal,
        time: new Date(flight.arrival.scheduled).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
      },
      status: flight.flight_status,
      aircraft: flight.aircraft?.registration,
      date: flight.flight_date,
    }

    logger.log(`✅ 航班查詢成功 (Key: ${apiKey.slice(0, 8)}...)`)
    return { success: true, data: transformedData }
  } catch (error) {
    logger.error('Failed to fetch flight data:', error)
    return { success: false, error: '查詢航班時發生網路錯誤。' }
  }
}

export async function searchFlightAction(
  flightNumber: string,
  flightDate: string
): Promise<{ data?: FlightData; error?: string }> {
  const apiKeys = getApiKeys()

  if (apiKeys.length === 0) {
    logger.error('❌ Aviationstack API key is not configured.')
    return { error: 'API 金鑰未設定，請聯絡管理員。' }
  }

  // 嘗試每個 API Key，直到成功或全部失敗
  for (let i = 0; i < apiKeys.length; i++) {
    const result = await tryFetchWithKey(apiKeys[i], flightNumber, flightDate)

    if (result.success) {
      return { data: result.data }
    }

    // 如果不是額度問題，直接返回錯誤
    if (!result.quotaExceeded) {
      return { error: result.error }
    }

    // 額度用完，繼續嘗試下一個 Key
  }

  // 所有 Key 都用完了
  logger.error('❌ 所有 API Key 額度都已用完')
  return { error: '本月航班查詢額度已用完，請下個月再試。' }
}
