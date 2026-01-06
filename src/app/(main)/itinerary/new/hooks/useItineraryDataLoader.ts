'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTourStore, useRegionsStore, useQuoteStore } from '@/stores'
import { useItineraries } from '@/hooks/cloud-hooks'
import { logger } from '@/lib/utils/logger'
import { formatDateTW, formatDateCompactPadded } from '@/lib/utils/format-date'
import type { LocalTourData } from './useItineraryEditor'
import type { DailyItinerary, HotelInfo, FlightInfo } from '@/components/editor/tour-form/types'
import type { TierPricing } from '@/stores/types/quote.types'

interface UseItineraryDataLoaderProps {
  setTourData: (data: LocalTourData) => void
  setLoading: (loading: boolean) => void
  setCurrentVersionIndex: (index: number) => void
  setQuoteTierPricings?: (tierPricings: TierPricing[]) => void
}

export function useItineraryDataLoader({
  setTourData,
  setLoading,
  setCurrentVersionIndex,
  setQuoteTierPricings,
}: UseItineraryDataLoaderProps) {
  const searchParams = useSearchParams()
  const tourId = searchParams.get('tour_id')
  const itineraryId = searchParams.get('itinerary_id')

  // 從報價單匯入參數
  const isFromQuote = searchParams.get('from_quote') === 'true'
  const quoteId = searchParams.get('quote_id')
  const quoteName = searchParams.get('quote_name')
  const daysFromQuote = parseInt(searchParams.get('days') || '0')
  const mealsFromQuote = searchParams.get('meals') ? JSON.parse(searchParams.get('meals') || '[]') : []
  const hotelsFromQuote = searchParams.get('hotels') ? JSON.parse(searchParams.get('hotels') || '[]') : []
  const activitiesFromQuote = searchParams.get('activities')
    ? JSON.parse(searchParams.get('activities') || '[]')
    : []

  const { items: tours } = useTourStore()
  const { items: itineraries } = useItineraries()
  const { items: quotes } = useQuoteStore()
  const { countries, cities } = useRegionsStore()

  const hasInitializedRef = useRef(false)
  const lastIdRef = useRef<string | null>(null)

  useEffect(() => {
    const initializeTourData = () => {
      const currentId = itineraryId || tourId

      // 如果 ID 沒變，且已經初始化過，就不要重新載入
      if (hasInitializedRef.current && lastIdRef.current === currentId) {
        return
      }

      // 優先從 itineraries 載入（編輯現有行程）
      if (itineraryId && !tourId) {
        const itinerary = itineraries.find((i) => i.id === itineraryId)
        logger.log('[ItineraryDataLoader] 尋找行程:', itineraryId, '找到:', !!itinerary)
        if (itinerary) {
          logger.log('[ItineraryDataLoader] 行程資料 - features:', itinerary.features, 'daily_itinerary:', (itinerary.daily_itinerary as unknown[])?.length || 0)
          setTourData({
            tagline: itinerary.tagline || 'Corner Travel 2025',
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
            status: itinerary.status || '提案',
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
                { text: '行程表所列之交通費用', included: true },
                { text: '行程表所列之住宿費用', included: true },
                { text: '行程表所列之餐食費用', included: true },
                { text: '行程表所列之門票費用', included: true },
                { text: '專業導遊服務', included: true },
                { text: '旅遊責任險 500 萬元', included: true },
              ],
              excluded_items: [
                { text: '個人護照及簽證費用', included: false },
                { text: '行程外之自費行程', included: false },
                { text: '個人消費及小費', included: false },
                { text: '行李超重費用', included: false },
                { text: '單人房差價', included: false },
              ],
              notes: [
                '本報價單有效期限至 2026/1/6，逾期請重新報價。',
                '最終價格以確認訂單時之匯率及費用為準。',
                '如遇旺季或特殊節日，價格可能會有調整。',
                '出發前 30 天內取消，需支付團費 30% 作為取消費。',
                '出發前 14 天內取消，需支付團費 50% 作為取消費。',
                '出發前 7 天內取消，需支付團費 100% 作為取消費。',
              ],
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

          setLoading(false)
          hasInitializedRef.current = true
          lastIdRef.current = currentId
          return
        } else {
          // 有 itineraryId 但找不到資料，繼續等待
          return
        }
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
            tagline: 'Corner Travel 2025',
            title: quoteName || '',
            subtitle: '',
            description: '',
            departureDate: '',
            tourCode: '',
            coverImage: '',
            country: '',
            city: '',
            status: '提案',
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
        tagline: 'Corner Travel 2025',
        title: tour.name,
        subtitle: '精緻旅遊',
        description: tour.description || '',
        departureDate: formatDateTW(departureDate),
        tourCode: tour.code,
        flightStyle: isTaiwan ? 'none' : undefined,
        coverImage:
          city?.background_image_url ||
          'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=1200&q=75&auto=format&fit=crop',
        country: country?.name || tour.location || '',
        city: city?.name || tour.location || '',
        status: '提案',
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
    setTourData,
    setLoading,
    setCurrentVersionIndex,
    setQuoteTierPricings,
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
