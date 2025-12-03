'use server'

import { logger } from '@/lib/utils/logger'

interface WeatherData {
  temperature: number
  humidity: number
  windSpeed: number
  weatherCode: number
  date: string
}

interface City {
  name: string
  lat: number
  lon: number
}

export async function getWeatherAction(
  date: string,
  isPast: boolean,
  city: City
): Promise<{ data?: WeatherData; error?: string }> {
  try {
    const { lat, lon } = city

    let url: string
    if (isPast) {
      url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${date}&end_date=${date}&daily=temperature_2m_max,temperature_2m_min,weathercode,relative_humidity_2m_max,windspeed_10m_max&timezone=Asia/Taipei`
    } else {
      url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode,relative_humidity_2m_max,windspeed_10m_max&timezone=Asia/Taipei&forecast_days=16`
    }

    const response = await fetch(url, { next: { revalidate: 3600 } }) // Cache for 1 hour
    const data = await response.json()

    if (!data.daily) {
      throw new Error('無法取得天氣資料')
    }

    let index = 0
    if (!isPast) {
      index = data.daily.time.findIndex((t: string) => t === date)
      if (index === -1) {
        throw new Error('所選日期超出預報範圍')
      }
    }

    const maxTemp = data.daily.temperature_2m_max[index]
    const minTemp = data.daily.temperature_2m_min[index]
    const avgTemp = (maxTemp + minTemp) / 2

    const transformedData: WeatherData = {
      temperature: Math.round(avgTemp * 10) / 10,
      humidity: data.daily.relative_humidity_2m_max[index] || 0,
      windSpeed: data.daily.windspeed_10m_max[index] || 0,
      weatherCode: data.daily.weathercode[index] || 0,
      date: data.daily.time[index],
    }
    return { data: transformedData }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '獲取天氣資料失敗'
    logger.error('getWeatherAction Error:', errorMessage)
    return { error: errorMessage }
  }
}
