'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'

interface DailyItineraryDay {
  accommodation?: string
  [key: string]: unknown
}

export interface NightHotel {
  nightNumber: number
  hotelName: string
  isContinue: boolean  // 續住（與前一晚相同）
}

interface UseItineraryHotelsProps {
  tourId: string
  open: boolean
}

/**
 * 從行程表載入每晚的飯店資訊
 * 用於分房管理自動帶入飯店名稱
 */
export function useItineraryHotels({ tourId, open }: UseItineraryHotelsProps) {
  const [nightHotels, setNightHotels] = useState<NightHotel[]>([])
  const [loading, setLoading] = useState(false)

  const loadHotels = async () => {
    if (!tourId) return
    setLoading(true)
    
    try {
      // 1. 取得 tour 的 itinerary_id
      const { data: tour, error: tourError } = await supabase
        .from('tours')
        .select('itinerary_id')
        .eq('id', tourId)
        .single()

      if (tourError || !tour?.itinerary_id) {
        logger.warn('找不到關聯的行程表')
        setNightHotels([])
        return
      }

      // 2. 取得行程表的 daily_itinerary
      const { data: itinerary, error: itineraryError } = await supabase
        .from('itineraries')
        .select('daily_itinerary')
        .eq('id', tour.itinerary_id)
        .single()

      if (itineraryError || !itinerary) {
        logger.warn('無法載入行程表')
        setNightHotels([])
        return
      }

      // 3. 解析每天的住宿
      const dailyItinerary = (itinerary.daily_itinerary || []) as DailyItineraryDay[]
      const hotels: NightHotel[] = []

      // 最後一天通常不住宿（回程日），所以只處理 n-1 天
      for (let i = 0; i < dailyItinerary.length - 1; i++) {
        const day = dailyItinerary[i]
        const hotelName = day.accommodation || ''
        const prevHotel = i > 0 ? dailyItinerary[i - 1].accommodation : ''
        
        hotels.push({
          nightNumber: i + 1,
          hotelName,
          isContinue: hotelName !== '' && hotelName === prevHotel,
        })
      }

      setNightHotels(hotels)
    } catch (error) {
      logger.error('載入行程表飯店失敗:', error)
      setNightHotels([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadHotels()
    }
  }, [open, tourId])

  // 取得特定晚的飯店名稱
  const getHotelForNight = (nightNumber: number): string => {
    return nightHotels.find(h => h.nightNumber === nightNumber)?.hotelName || ''
  }

  // 取得特定晚是否續住
  const isContinueNight = (nightNumber: number): boolean => {
    return nightHotels.find(h => h.nightNumber === nightNumber)?.isContinue || false
  }

  return {
    nightHotels,
    loading,
    getHotelForNight,
    isContinueNight,
    reload: loadHotels,
  }
}
