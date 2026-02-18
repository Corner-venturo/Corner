'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTours, useItineraries, useQuotes, invalidateItineraries, useCountries, useCities } from '@/data'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { formatDateTW, formatDateCompactPadded } from '@/lib/utils/format-date'
import type { LocalTourData } from './useItineraryEditor'
import type { DailyItinerary, HotelInfo, FlightInfo } from '@/components/editor/tour-form/types'
import type { TierPricing } from '@/stores/types/quote.types'
import type { Itinerary } from '@/stores/types'
import { ITINERARY_DATA_LOADER_LABELS } from '../../constants/labels'

interface UseItineraryDataLoaderProps {
  setTourData: (data: LocalTourData) => void
  setLoading: (loading: boolean) => void
  setCurrentVersionIndex: (index: number) => void
  setQuoteTierPricings?: (tierPricings: TierPricing[]) => void
  setIsHandedOff?: (isHandedOff: boolean) => void
  setHasLinkedQuote?: (hasLinkedQuote: boolean) => void
}

export function useItineraryDataLoader({
  setTourData,
  setLoading,
  setCurrentVersionIndex,
  setQuoteTierPricings,
  setIsHandedOff,
  setHasLinkedQuote,
}: UseItineraryDataLoaderProps) {
  const searchParams = useSearchParams()
  const tourId = searchParams.get('tour_id')
  const itineraryId = searchParams.get('itinerary_id')

  // 從報價單匯入參數
  const isFromQuote = searchParams.get('from_quote') === 'true'
  const quoteName = searchParams.get('quote_name')
  const daysFromQuote = parseInt(searchParams.get('days') || '0')
  const mealsFromQuote = searchParams.get('meals') ? JSON.parse(searchParams.get('meals') || '[]') : []
  const hotelsFromQuote = searchParams.get('hotels') ? JSON.parse(searchParams.get('hotels') || '[]') : []
  const activitiesFromQuote = searchParams.get('activities')
    ? JSON.parse(searchParams.get('activities') || '[]')
    : []

  const { items: tours } = useTours()
  const { items: itineraries } = useItineraries()
  const { items: quotes } = useQuotes()
  const { items: countries } = useCountries()
  const { items: cities } = useCities()

  const hasInitializedRef = useRef(false)
  const lastIdRef = useRef<string | null>(null)
  const isFetchingRef = useRef(false)

  // 載入行程表資料的輔助函數
  const loadItineraryData = useCallback((itinerary: Itinerary) => {
    logger.log('[ItineraryDataLoader] 載入行程表資料:', itinerary.id)
    logger.log('[ItineraryDataLoader] 行程 daily_itinerary 長度:', (itinerary.daily_itinerary as unknown[] | null)?.length || 0)
    logger.log('[ItineraryDataLoader] 行程資料 - features:', itinerary.features, 'daily_itinerary:', (itinerary.daily_itinerary as unknown[])?.length || 0)

    setTourData({
      tagline: itinerary.tagline || `Corner Travel ${new Date().getFullYear()}`,
      title: itinerary.title || '',
      subtitle: itinerary.subtitle || '',
      description: itinerary.description || '',
      departureDate: itinerary.departure_date || '',
      tourCode: itinerary.tour_code || '',
      coverImage: itinerary.cover_image || '',
      coverStyle: itinerary.cover_style || 'original',
      flightStyle:
        ((itinerary as { flight_style?: string }).flight_style || 'original') as LocalTourData['flightStyle'],
      itineraryStyle:
        ((itinerary as { itinerary_style?: string }).itinerary_style ||
          'original') as LocalTourData['itineraryStyle'],
      price: itinerary.price || '',
      priceNote: itinerary.price_note || '',
      country: itinerary.country || '',
      city: itinerary.city || '',
      status: itinerary.status || ITINERARY_DATA_LOADER_LABELS.STATUS_PROPOSAL,
      outboundFlight: itinerary.outbound_flight || itinerary.flight_info?.outbound || {
        airline: '',
        flightNumber: '',
        departureAirport: 'TPE',
        departureTime: '',
        departureDate: '',
        arrivalAirport: '',
        arrivalTime: '',
        duration: '',
      },
      returnFlight: itinerary.return_flight || itinerary.flight_info?.return || {
        airline: '',
        flightNumber: '',
        departureAirport: '',
        departureTime: '',
        departureDate: '',
        arrivalAirport: 'TPE',
        arrivalTime: '',
        duration: '',
      },
      features: (() => {
        const f = itinerary.features || []
        logger.log('[ItineraryDataLoader] 載入 features:', Array.isArray(f) ? f.length : 'not array', f)
        return f
      })(),
      showFeatures: itinerary.show_features !== false,
      focusCards: itinerary.focus_cards || [],
      leader: itinerary.leader || {
        name: '',
        domesticPhone: '',
        overseasPhone: '',
      },
      showLeaderMeeting: itinerary.show_leader_meeting !== false,
      meetingInfo: itinerary.meeting_info || {
        time: '',
        location: '',
      },
      hotels: (itinerary.hotels as HotelInfo[]) || [],
      showHotels: itinerary.show_hotels || false,
      itinerarySubtitle: itinerary.itinerary_subtitle || '',
      dailyItinerary: (itinerary.daily_itinerary || []).map((day) => {
        const d = day as DailyItinerary
        return {
          ...d,
          activities: Array.isArray(d.activities) ? d.activities : [],
          recommendations: Array.isArray(d.recommendations) ? d.recommendations : [],
          images: Array.isArray(d.images) ? d.images : [],
          meals: d.meals || { breakfast: '', lunch: '', dinner: '' },
        }
      }),
      showPricingDetails: itinerary.pricing_details?.show_pricing_details || false,
      pricingDetails: itinerary.pricing_details || {
        show_pricing_details: false,
        insurance_amount: '500',
        included_items: [
          { text: ITINERARY_DATA_LOADER_LABELS.TRANSPORT_COST, included: true },
          { text: ITINERARY_DATA_LOADER_LABELS.ACCOMMODATION_COST, included: true },
          { text: ITINERARY_DATA_LOADER_LABELS.MEAL_COST, included: true },
          { text: ITINERARY_DATA_LOADER_LABELS.TICKET_COST, included: true },
          { text: ITINERARY_DATA_LOADER_LABELS.GUIDE_SERVICE, included: true },
          { text: ITINERARY_DATA_LOADER_LABELS.INSURANCE, included: true },
        ],
        excluded_items: [
          { text: ITINERARY_DATA_LOADER_LABELS.PASSPORT_VISA, included: false },
          { text: ITINERARY_DATA_LOADER_LABELS.OPTIONAL_TOUR, included: false },
          { text: ITINERARY_DATA_LOADER_LABELS.PERSONAL_EXPENSE, included: false },
          { text: ITINERARY_DATA_LOADER_LABELS.LUGGAGE_OVERWEIGHT, included: false },
          { text: ITINERARY_DATA_LOADER_LABELS.SINGLE_ROOM, included: false },
        ],
        notes: [],
      },
      priceTiers: itinerary.price_tiers || [],
      showPriceTiers: itinerary.show_price_tiers || false,
      faqs: itinerary.faqs || [],
      showFaqs: itinerary.show_faqs || false,
      notices: itinerary.notices || [],
      showNotices: itinerary.show_notices || false,
      cancellationPolicy: itinerary.cancellation_policy || [],
      showCancellationPolicy: itinerary.show_cancellation_policy || false,
      version_records: itinerary.version_records || [],
    })
    setCurrentVersionIndex(-1)

    // 載入關聯報價單的砍次表
    if (setQuoteTierPricings && itinerary.quote_id) {
      const quote = quotes.find(q => q.id === itinerary.quote_id)
      if (quote?.tier_pricings && quote.tier_pricings.length > 0) {
        setQuoteTierPricings(quote.tier_pricings as TierPricing[])
      }
    }
    
    // 設定是否有關聯報價單（用於鎖定住宿編輯）
    if (setHasLinkedQuote) {
      setHasLinkedQuote(!!itinerary.quote_id)
    }

    setLoading(false)
    hasInitializedRef.current = true
    lastIdRef.current = itinerary.id
  }, [setTourData, setCurrentVersionIndex, setQuoteTierPricings, setLoading, quotes])

  useEffect(() => {
    const initializeTourData = async () => {
      logger.log('[ItineraryDataLoader] === 開始初始化 ===')
      logger.log('[ItineraryDataLoader] URL 參數 - itineraryId:', itineraryId, 'tourId:', tourId)
      logger.log('[ItineraryDataLoader] itineraries 數量:', itineraries.length)

      const currentId = itineraryId || tourId

      // 如果 ID 沒變，且已經初始化過，就不要重新載入
      if (hasInitializedRef.current && lastIdRef.current === currentId) {
        logger.log('[ItineraryDataLoader] 已初始化過，跳過')
        return
      }

      // 優先從 itineraries 載入（編輯現有行程）
      if (itineraryId && !tourId) {
        logger.log('[ItineraryDataLoader] 嘗試載入行程, itineraryId:', itineraryId)

        // 總是從資料庫載入最新資料（避免 SWR 快取過期問題）
        if (!isFetchingRef.current) {
          isFetchingRef.current = true
          logger.log('[ItineraryDataLoader] 直接從資料庫載入最新資料...')

          try {
            const { data, error } = await supabase
              .from('itineraries')
              .select('*')
              .eq('id', itineraryId)
              .single()

            if (error) {
              logger.error('[ItineraryDataLoader] 從資料庫載入失敗:', error)
              setLoading(false)
            } else if (data) {
              logger.log('[ItineraryDataLoader] 從資料庫載入成功')
              logger.log('[ItineraryDataLoader] daily_itinerary 長度:', (data.daily_itinerary as unknown[])?.length || 0)
              logger.log('[ItineraryDataLoader] country:', data.country, 'city:', data.city)
              const itinerary = data as unknown as Itinerary
              loadItineraryData(itinerary)

              // 檢查交接狀態（如果有關聯的 tour）
              if (setIsHandedOff && itinerary.tour_id) {
                const { data: confirmSheet } = await supabase
                  .from('tour_confirmation_sheets')
                  .select('status')
                  .eq('tour_id', itinerary.tour_id)
                  .eq('status', 'completed')
                  .maybeSingle()
                
                if (confirmSheet) {
                  logger.log('[ItineraryDataLoader] 行程已交接，設為唯讀')
                  setIsHandedOff(true)
                }
              }

              // 重新整理 SWR 快取
              void invalidateItineraries()
            } else {
              logger.warn('[ItineraryDataLoader] 找不到行程表:', itineraryId)
              setLoading(false)
            }
          } catch (err) {
            logger.error('[ItineraryDataLoader] 載入錯誤:', err)
            setLoading(false)
          } finally {
            isFetchingRef.current = false
          }
        }
        return
      }

      if (!tourId) {
        // 檢查是否從報價單匯入
        if (isFromQuote && daysFromQuote > 0) {
          const dailyItinerary = createDailyItineraryFromQuote(
            daysFromQuote,
            mealsFromQuote,
            hotelsFromQuote,
            activitiesFromQuote
          )

          setTourData({
            tagline: `Corner Travel ${new Date().getFullYear()}`,
            title: quoteName || '',
            subtitle: '',
            description: '',
            departureDate: '',
            tourCode: '',
            coverImage: '',
            country: '',
            city: '',
            status: ITINERARY_DATA_LOADER_LABELS.STATUS_PROPOSAL,
            outboundFlight: {
              airline: '',
              flightNumber: '',
              departureAirport: 'TPE',
              departureTime: '',
              departureDate: '',
              arrivalAirport: '',
              arrivalTime: '',
              duration: '',
            },
            returnFlight: {
              airline: '',
              flightNumber: '',
              departureAirport: '',
              departureTime: '',
              departureDate: '',
              arrivalAirport: 'TPE',
              arrivalTime: '',
              duration: '',
            },
            features: [],
            focusCards: [],
            leader: {
              name: '',
              domesticPhone: '',
              overseasPhone: '',
            },
            meetingInfo: {
              time: '',
              location: '',
            },
            itinerarySubtitle: `${daysFromQuote}天${daysFromQuote - 1}夜精彩旅程規劃`,
            dailyItinerary,
          })
          setLoading(false)
          hasInitializedRef.current = true
          lastIdRef.current = currentId
          return
        }

        // 沒有任何 ID，使用空白資料（已在 useItineraryEditor 初始化）
        setLoading(false)
        hasInitializedRef.current = true
        lastIdRef.current = currentId
        return
      }

      // 有 tour_id，從旅遊團載入基本資料
      const tour = tours.find((t) => t.id === tourId)
      if (!tour) {
        setLoading(false)
        return
      }

      const country = tour.country_id ? countries.find((c) => c.id === tour.country_id) : null
      const city = tour.main_city_id ? cities.find((c) => c.id === tour.main_city_id) : null

      const departureDate = new Date(tour.departure_date)
      const returnDate = new Date(tour.return_date)
      const days = Math.ceil((returnDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

      const tourData = tour as typeof tour & { outbound_flight?: FlightInfo; return_flight?: FlightInfo }
      const tourOutboundFlight = tourData.outbound_flight ?? null
      const tourReturnFlight = tourData.return_flight ?? null

      // 台灣團預設使用國內模式（無航班）
      const isTaiwan = country?.name === '台灣'

      setTourData({
        tagline: `Corner Travel ${new Date().getFullYear()}`,
        title: tour.name,
        subtitle: '精緻旅遊',
        description: tour.description || '',
        departureDate: formatDateTW(departureDate),
        tourCode: tour.code,
        flightStyle: isTaiwan ? 'none' : undefined,
        coverImage: '', // 封面圖片由 AirportImageLibrary 從 airport_images 表選擇
        country: country?.name || tour.location || '',
        city: city?.name || tour.location || '',
        status: ITINERARY_DATA_LOADER_LABELS.STATUS_PROPOSAL,
        outboundFlight: {
          airline: tourOutboundFlight?.airline || '',
          flightNumber: tourOutboundFlight?.flightNumber || '',
          departureAirport: tourOutboundFlight?.departureAirport || 'TPE',
          departureTime: tourOutboundFlight?.departureTime || '',
          departureDate:
            tourOutboundFlight?.departureDate ||
            formatDateCompactPadded(departureDate),
          arrivalAirport: tourOutboundFlight?.arrivalAirport || city?.airport_code || '',
          arrivalTime: tourOutboundFlight?.arrivalTime || '',
          duration: tourOutboundFlight?.duration || '',
        },
        returnFlight: {
          airline: tourReturnFlight?.airline || '',
          flightNumber: tourReturnFlight?.flightNumber || '',
          departureAirport: tourReturnFlight?.departureAirport || city?.airport_code || '',
          departureTime: tourReturnFlight?.departureTime || '',
          departureDate:
            tourReturnFlight?.departureDate ||
            formatDateCompactPadded(returnDate),
          arrivalAirport: tourReturnFlight?.arrivalAirport || 'TPE',
          arrivalTime: tourReturnFlight?.arrivalTime || '',
          duration: tourReturnFlight?.duration || '',
        },
        features: [],
        focusCards: [],
        leader: {
          name: '',
          domesticPhone: '',
          overseasPhone: '',
        },
        meetingInfo: {
          time: isTaiwan ? formatDateTW(departureDate) + ' 08:00' : formatDateTW(departureDate) + ' 04:50',
          location: isTaiwan ? '' : '桃園機場第二航廈',
        },
        itinerarySubtitle: `${days}天${days - 1}夜精彩旅程規劃`,
        dailyItinerary: [],
      })

      setLoading(false)
      hasInitializedRef.current = true
      lastIdRef.current = currentId
    }

    initializeTourData()
  }, [
    tourId,
    itineraryId,
    tours,
    itineraries,
    quotes,
    countries,
    cities,
    isFromQuote,
    daysFromQuote,
    loadItineraryData,
    invalidateItineraries,
    setTourData,
    setLoading,
  ])
}

function createDailyItineraryFromQuote(
  daysFromQuote: number,
  mealsFromQuote: { day: number; type: string; name: string; note?: string }[],
  hotelsFromQuote: { day: number; name: string; note?: string }[],
  activitiesFromQuote: { day: number; title: string; description?: string }[]
): DailyItinerary[] {
  const dailyItinerary: DailyItinerary[] = []

  for (let i = 0; i < daysFromQuote; i++) {
    const dayNum = i + 1
    dailyItinerary.push({
      dayLabel: `Day ${dayNum}`,
      date: '',
      title: '',
      highlight: '',
      description: '',
      images: [],
      activities: [],
      recommendations: [],
      meals: {
        breakfast: dayNum === 1 ? '溫暖的家' : '飯店內早餐',
        lunch: '敬請自理',
        dinner: '敬請自理',
      },
      accommodation: dayNum === daysFromQuote ? '' : '待確認',
    })
  }

  // 匯入餐食資料
  mealsFromQuote.forEach((meal: { day: number; type: string; name: string; note?: string }) => {
    const dayIndex = meal.day - 1
    if (dayIndex >= 0 && dayIndex < dailyItinerary.length) {
      const mealName = meal.name + (meal.note ? ` (${meal.note})` : '')
      switch (meal.type) {
        case '早餐':
          dailyItinerary[dayIndex].meals.breakfast = mealName
          break
        case '午餐':
          dailyItinerary[dayIndex].meals.lunch = mealName
          break
        case '晚餐':
          dailyItinerary[dayIndex].meals.dinner = mealName
          break
      }
    }
  })

  // 匯入住宿資料
  hotelsFromQuote.forEach((hotel: { day: number; name: string; note?: string }) => {
    const dayIndex = hotel.day - 1
    if (dayIndex >= 0 && dayIndex < dailyItinerary.length) {
      dailyItinerary[dayIndex].accommodation = hotel.name + (hotel.note ? ` (${hotel.note})` : '')
    }
  })

  // 匯入活動資料
  activitiesFromQuote.forEach((activity: { day: number; title: string; description?: string }) => {
    const dayIndex = activity.day - 1
    if (dayIndex >= 0 && dayIndex < dailyItinerary.length) {
      dailyItinerary[dayIndex].activities.push({
        icon: '🎯',
        title: activity.title,
        description: activity.description || '',
        image: '',
      })
    }
  })

  return dailyItinerary
}
