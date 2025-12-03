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

export async function searchFlightAction(
  flightNumber: string,
  flightDate: string
): Promise<{ data?: FlightData; error?: string }> {
  const apiKey = process.env.NEXT_PUBLIC_AVIATIONSTACK_KEY

  if (!apiKey) {
    logger.error('❌ Aviationstack API key is not configured.')
    return { error: 'API 金鑰未設定，請聯絡管理員。' }
  }

  const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_number=${flightNumber}&flight_date=${flightDate}`

  try {
    const response = await fetch(url)
    const apiData = await response.json()

    if (apiData.error) {
      logger.error('Aviationstack API Error:', apiData.error)
      return { error: apiData.error.message || '無法查詢航班資訊。' }
    }

    if (!apiData.data || apiData.data.length === 0) {
      return { error: '找不到該航班的資訊。' }
    }

    const flight = apiData.data[0]

    // Transform the API data into our component's expected FlightData shape
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

    return { data: transformedData }
  } catch (error) {
    logger.error('Failed to fetch flight data:', error)
    return { error: '查詢航班時發生網路錯誤。' }
  }
}
