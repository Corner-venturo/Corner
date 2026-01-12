'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores'
import { createItinerary, updateItinerary } from '@/data'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'
import type {
  FlightInfo,
  Feature,
  FocusCard,
  LeaderInfo,
  MeetingPoint,
  DailyItinerary,
  HotelInfo,
} from '@/components/editor/tour-form/types'
import type { ItineraryVersionRecord, PricingDetails, PriceTier, FAQ } from '@/stores/types'
import type { TierPricing } from '@/stores/types/quote.types'

// Local tour data interface
export interface LocalTourData {
  tagline: string
  title: string
  subtitle: string
  description: string
  departureDate: string
  tourCode: string
  coverImage?: string
  coverStyle?: 'original' | 'gemini' | 'nature' | 'luxury' | 'art' | 'dreamscape' | 'collage'
  flightStyle?: 'original' | 'chinese' | 'japanese' | 'luxury' | 'art' | 'none' | 'dreamscape' | 'collage'
  itineraryStyle?: 'original' | 'luxury' | 'art' | 'dreamscape'
  price?: string | null
  priceNote?: string | null
  country: string
  city: string
  status: string
  outboundFlight: FlightInfo
  returnFlight: FlightInfo
  features: Feature[]
  focusCards: FocusCard[]
  leader: LeaderInfo
  meetingInfo: MeetingPoint
  hotels?: HotelInfo[]
  itinerarySubtitle: string
  dailyItinerary: DailyItinerary[]
  showFeatures?: boolean
  showLeaderMeeting?: boolean
  showHotels?: boolean
  showPricingDetails?: boolean
  pricingDetails?: PricingDetails
  priceTiers?: PriceTier[]
  showPriceTiers?: boolean
  faqs?: FAQ[]
  showFaqs?: boolean
  notices?: string[]
  showNotices?: boolean
  cancellationPolicy?: string[]
  showCancellationPolicy?: boolean
  version_records?: ItineraryVersionRecord[]
}

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useItineraryEditor() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const itineraryId = searchParams.get('itinerary_id')

  const [tourData, setTourData] = useState<LocalTourData>(getEmptyTourData())
  const [isDirty, setIsDirty] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle')
  const [currentItineraryId, setCurrentItineraryId] = useState<string | null>(itineraryId)
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1)
  const [quoteTierPricings, setQuoteTierPricings] = useState<TierPricing[]>([])

  const { user } = useAuthStore()
  const tourDataRef = useRef(tourData)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 保持 ref 同步
  useEffect(() => {
    tourDataRef.current = tourData
  }, [tourData])

  // 轉換資料格式（camelCase → snake_case）
  const convertDataForSave = useCallback(() => {
    const data = tourDataRef.current
    logger.log('[ItineraryEditor] convertDataForSave - features:', data.features?.length || 0, data.features)
    return {
      tour_id: undefined,
      tagline: data.tagline,
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      departure_date: data.departureDate,
      tour_code: data.tourCode,
      cover_image: data.coverImage,
      cover_style: data.coverStyle || 'original',
      flight_style: data.flightStyle || 'original',
      itinerary_style: data.itineraryStyle || 'original',
      price: data.price || null,
      price_note: data.priceNote || null,
      country: data.country,
      city: data.city,
      status: (data.status || '提案') as '提案' | '進行中',
      outbound_flight: data.outboundFlight,
      return_flight: data.returnFlight,
      features: data.features,
      focus_cards: data.focusCards,
      leader: data.leader,
      meeting_info: data.meetingInfo as { time: string; location: string } | undefined,
      show_features: data.showFeatures,
      show_leader_meeting: data.showLeaderMeeting,
      hotels: data.hotels || [],
      show_hotels: data.showHotels,
      show_pricing_details: data.showPricingDetails,
      pricing_details: data.pricingDetails,
      price_tiers: data.priceTiers || null,
      show_price_tiers: data.showPriceTiers || false,
      faqs: data.faqs || null,
      show_faqs: data.showFaqs || false,
      notices: data.notices || null,
      show_notices: data.showNotices || false,
      cancellation_policy: data.cancellationPolicy || null,
      show_cancellation_policy: data.showCancellationPolicy || false,
      itinerary_subtitle: data.itinerarySubtitle,
      daily_itinerary: data.dailyItinerary,
      version_records: data.version_records || [],
    }
  }, [])

  // 自動存檔函數
  const performAutoSave = useCallback(async () => {
    if (!isDirty) return

    setAutoSaveStatus('saving')
    try {
      const convertedData = convertDataForSave()
      logger.log('[ItineraryEditor] 準備存檔 - features:', convertedData.features?.length || 0)
      logger.log('[ItineraryEditor] 準備存檔 - daily_itinerary:', convertedData.daily_itinerary?.length || 0)

      if (currentItineraryId) {
        logger.log('[ItineraryEditor] 更新行程:', currentItineraryId)
        await updateItinerary(currentItineraryId, convertedData)
        logger.log('[ItineraryEditor] 更新完成')
      } else {
        if (!convertedData.title) {
          setAutoSaveStatus('idle')
          return
        }
        const newItinerary = await createItinerary({
          ...convertedData,
          created_by: user?.id || undefined,
        } as Parameters<typeof createItinerary>[0])

        if (newItinerary?.id) {
          setCurrentItineraryId(newItinerary.id)
          window.history.replaceState(null, '', `/itinerary/new?itinerary_id=${newItinerary.id}`)
        }
      }

      setIsDirty(false)
      setAutoSaveStatus('saved')
      setTimeout(() => setAutoSaveStatus('idle'), 3000)
    } catch (error) {
      logger.error('自動存檔失敗:', error)
      setAutoSaveStatus('error')
      toast.error('自動存檔失敗，請手動儲存')
    }
  }, [isDirty, currentItineraryId, convertDataForSave, updateItinerary, createItinerary, user?.id])

  // 保持 performAutoSave 的最新引用
  const performAutoSaveRef = useRef(performAutoSave)
  useEffect(() => {
    performAutoSaveRef.current = performAutoSave
  }, [performAutoSave])

  // 30 秒自動存檔 - 只依賴 isDirty，避免 tourData/performAutoSave 變化觸發無限迴圈
  useEffect(() => {
    if (isDirty) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
      autoSaveTimerRef.current = setTimeout(() => {
        performAutoSaveRef.current()
      }, 30000)
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [isDirty])

  // 保持 isDirty 的最新引用（用於 beforeunload）
  const isDirtyRef = useRef(isDirty)
  useEffect(() => {
    isDirtyRef.current = isDirty
  }, [isDirty])

  // 離開頁面前存檔 - 使用 ref 避免頻繁重新綁定事件
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        performAutoSaveRef.current()
        e.preventDefault()
        e.returnValue = '您有未儲存的變更，確定要離開嗎？'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // 版本切換處理
  const handleVersionChange = useCallback((index: number, versionData?: ItineraryVersionRecord) => {
    setCurrentVersionIndex(index)
    // 版本切換邏輯在主組件處理
  }, [])

  // 更新行程資料
  const updateTourData = useCallback((newData: Partial<LocalTourData>) => {
    setTourData(prev => ({ ...prev, ...newData }))
    setIsDirty(true)
  }, [])

  return {
    tourData,
    setTourData,
    updateTourData,
    isDirty,
    setIsDirty,
    autoSaveStatus,
    currentItineraryId,
    currentVersionIndex,
    setCurrentVersionIndex,
    handleVersionChange,
    performAutoSave,
    quoteTierPricings,
    setQuoteTierPricings,
  }
}

function getEmptyTourData(): LocalTourData {
  return {
    tagline: 'Corner Travel 2025',
    title: '',
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
    itinerarySubtitle: '',
    dailyItinerary: [],
    showPricingDetails: false,
    pricingDetails: {
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
  }
}
