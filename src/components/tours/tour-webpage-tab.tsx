'use client'

/**
 * TourWebpageTab - 旅遊團網頁設計分頁
 *
 * 直接嵌入完整的行程網頁編輯器（左邊設定、右邊預覽）
 * 和 /itinerary/new 頁面一樣的體驗
 * 用於設計 venturo-online 展示用的行程網頁
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Loader2, Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/utils/logger'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores'
import { useTours, useItineraries, useQuotes, createItinerary, updateItinerary, useCountries, useCities } from '@/data'
import { syncHotelsFromItineraryToQuote } from '@/features/quotes/services/quoteItinerarySync'
import { confirm } from '@/lib/ui/alert-dialog'
import { formatDateTW, formatDateCompactPadded } from '@/lib/utils/format-date'
import type { Tour, Itinerary } from '@/stores/types'
import type { TierPricing } from '@/stores/types/quote.types'

// 動態載入編輯器元件
import dynamic from 'next/dynamic'

const ItineraryEditor = dynamic(
  () => import('@/app/(main)/itinerary/new/components/ItineraryEditor').then(m => m.ItineraryEditor),
  { loading: () => <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin" /></div> }
)

const ItineraryPreview = dynamic(
  () => import('@/app/(main)/itinerary/new/components/ItineraryPreview').then(m => m.ItineraryPreview),
  { loading: () => <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin" /></div> }
)

// 從 useItineraryEditor 複製的類型和初始值
import type { LocalTourData, AutoSaveStatus } from '@/app/(main)/itinerary/new/hooks/useItineraryEditor'

function getEmptyTourData(): LocalTourData {
  return {
    tagline: `Corner Travel ${new Date().getFullYear()}`,
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
    meetingPoints: [],
    itinerarySubtitle: '',
    dailyItinerary: [],
    showPricingDetails: false,
    pricingDetails: {
      show_pricing_details: false,
      insurance_amount: '500',
      included_items: [],
      excluded_items: [],
      notes: [],
    },
  }
}

interface TourWebpageTabProps {
  tour: Tour
}

export function TourWebpageTab({ tour }: TourWebpageTabProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const { items: tours } = useTours()
  const { items: itineraries } = useItineraries()
  const { items: quotes } = useQuotes()
  const { items: countries } = useCountries()
  const { items: cities } = useCities()

  // 狀態
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [tourData, setTourData] = useState<LocalTourData>(getEmptyTourData())
  const [isDirty, setIsDirty] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle')
  const [currentItineraryId, setCurrentItineraryId] = useState<string | null>(null)
  const [quoteTierPricings, setQuoteTierPricings] = useState<TierPricing[]>([])

  const tourDataRef = useRef(tourData)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isDirtyRef = useRef(isDirty)
  const performAutoSaveRef = useRef<(() => Promise<void>) | undefined>(undefined)

  // 保持 ref 同步
  useEffect(() => {
    tourDataRef.current = tourData
  }, [tourData])

  useEffect(() => {
    isDirtyRef.current = isDirty
  }, [isDirty])

  // 載入該團的行程表
  useEffect(() => {
    const loadItinerary = async () => {
      setLoading(true)
      try {
        // 用 tour_id 查詢行程表
        const itinerary = itineraries.find(i => i.tour_id === tour.id)

        if (itinerary) {
          setCurrentItineraryId(itinerary.id)
          // 載入行程表資料
          loadItineraryData(itinerary)
        } else {
          // 沒有行程表，從旅遊團帶入基本資料
          setCurrentItineraryId(null)

          // 從旅遊團的 country_id 和 main_city_id 帶入國家城市
          const tourCountry = countries.find(c => c.id === tour.country_id)
          const tourCity = cities.find(c => c.id === tour.main_city_id)

          setTourData(prev => ({
            ...prev,
            title: tour.name || '',
            departureDate: tour.departure_date || '',
            tourCode: tour.code || '',
            country: tourCountry?.id || '',
            city: tourCity?.airport_code || tour.main_city_id || '',
          }))
        }
      } catch (err) {
        logger.error('載入行程表失敗', err)
      } finally {
        setLoading(false)
      }
    }

    if (itineraries.length > 0 || !loading) {
      loadItinerary()
    }
     
  }, [tour.id, tour.country_id, tour.main_city_id, itineraries, countries, cities])

  // 載入行程表資料的函數
  const loadItineraryData = useCallback((itinerary: Itinerary) => {
    // 找到關聯的旅遊團
    const relatedTour = tours.find(t => t.id === tour.id)

    // 找到關聯的報價單
    const relatedQuote = quotes.find(q => q.tour_id === tour.id)

    setTourData({
      tagline: itinerary.tagline || `Corner Travel ${new Date().getFullYear()}`,
      title: itinerary.title || relatedTour?.name || '',
      subtitle: itinerary.subtitle || '',
      description: itinerary.description || '',
      departureDate: itinerary.departure_date || relatedTour?.departure_date || '',
      tourCode: itinerary.tour_code || relatedTour?.code || '',
      coverImage: itinerary.cover_image || '',
      coverStyle: itinerary.cover_style || 'original',
      flightStyle: (itinerary as { flight_style?: string }).flight_style as LocalTourData['flightStyle'] || 'original',
      itineraryStyle: (itinerary as { itinerary_style?: string }).itinerary_style as LocalTourData['itineraryStyle'] || 'original',
      price: itinerary.price || '',
      priceNote: itinerary.price_note || '',
      country: itinerary.country || '',
      city: itinerary.city || '',
      status: itinerary.status || '提案',
      outboundFlight: itinerary.outbound_flight || itinerary.flight_info?.outbound || getEmptyTourData().outboundFlight,
      returnFlight: itinerary.return_flight || itinerary.flight_info?.return || getEmptyTourData().returnFlight,
      features: itinerary.features || [],
      focusCards: itinerary.focus_cards || [],
      leader: itinerary.leader || { name: '', domesticPhone: '', overseasPhone: '' },
      meetingInfo: itinerary.meeting_info || { time: '', location: '' },
      hotels: itinerary.hotels || [],
      showFeatures: itinerary.show_features !== false,
      showLeaderMeeting: itinerary.show_leader_meeting !== false,
      showHotels: itinerary.show_hotels || false,
      showPricingDetails: itinerary.show_pricing_details || false,
      pricingDetails: itinerary.pricing_details || getEmptyTourData().pricingDetails,
      priceTiers: itinerary.price_tiers || [],
      showPriceTiers: itinerary.show_price_tiers || false,
      faqs: itinerary.faqs || [],
      showFaqs: itinerary.show_faqs || false,
      notices: itinerary.notices || [],
      showNotices: itinerary.show_notices || false,
      cancellationPolicy: itinerary.cancellation_policy || [],
      showCancellationPolicy: itinerary.show_cancellation_policy || false,
      itinerarySubtitle: itinerary.itinerary_subtitle || '',
      dailyItinerary: itinerary.daily_itinerary || [],
      version_records: itinerary.version_records || [],
    })

    // 載入報價單檻次表
    if (relatedQuote?.tier_pricings) {
      setQuoteTierPricings(relatedQuote.tier_pricings as TierPricing[])
    }
  }, [tours, quotes, tour.id])

  // 轉換資料格式（camelCase → snake_case）
  const convertDataForSave = useCallback(() => {
    const data = tourDataRef.current
    return {
      tour_id: tour.id,
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
  }, [tour.id])

  // 自動存檔函數
  const performAutoSave = useCallback(async () => {
    if (!isDirtyRef.current) return

    setAutoSaveStatus('saving')
    try {
      const convertedData = convertDataForSave()

      if (currentItineraryId) {
        await updateItinerary(currentItineraryId, convertedData)

        // 同步飯店到報價單
        if (convertedData.daily_itinerary && convertedData.daily_itinerary.length > 0) {
          syncHotelsFromItineraryToQuote(currentItineraryId, convertedData.daily_itinerary as { accommodation?: string }[])
            .catch(err => logger.error('飯店同步錯誤:', err))
        }

        // 同步領隊到 tour_leaders 表
        const leader = convertedData.leader
        if (leader?.name && leader.name.trim()) {
          const { data: existingLeader } = await supabase
            .from('tour_leaders')
            .select('id, name')
            .eq('name', leader.name.trim())
            .maybeSingle()

          if (!existingLeader) {
            const shouldSave = await confirm(
              `要將「${leader.name}」新增到領隊資料庫嗎？\n下次可以直接搜尋選用。`,
              { title: '儲存領隊資料', type: 'info' }
            )

            if (shouldSave) {
              await supabase.from('tour_leaders').insert({
                name: leader.name.trim(),
                english_name: leader.englishName || null,
                photo: leader.photo || null,
                domestic_phone: leader.domesticPhone || null,
                overseas_phone: leader.overseasPhone || null,
                status: 'active',
              })
            }
          }
        }
      } else {
        // 新建行程表
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
  }, [currentItineraryId, convertDataForSave, user?.id])

  // 保持 performAutoSave 的最新引用
  useEffect(() => {
    performAutoSaveRef.current = performAutoSave
  }, [performAutoSave])

  // 30 秒自動存檔
  useEffect(() => {
    if (isDirty) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
      autoSaveTimerRef.current = setTimeout(() => {
        performAutoSaveRef.current?.()
      }, 30000)
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [isDirty])

  // 更新行程資料
  const handleChange = useCallback((newData: LocalTourData) => {
    setTourData(newData)
    setIsDirty(true)
  }, [])

  // 建立行程表
  const handleCreateItinerary = async () => {
    setCreating(true)
    try {
      // 從旅遊團資料初始化
      const relatedTour = tours.find(t => t.id === tour.id)

      const newTourData: LocalTourData = {
        ...getEmptyTourData(),
        title: relatedTour?.name || tour.name || '',
        tourCode: relatedTour?.code || tour.code || '',
        departureDate: relatedTour?.departure_date || tour.departure_date || '',
        country: relatedTour?.location || tour.location || '',
      }

      setTourData(newTourData)

      // 立即建立行程表
      const convertedData = {
        tour_id: tour.id,
        tagline: newTourData.tagline,
        title: newTourData.title,
        subtitle: newTourData.subtitle,
        description: newTourData.description,
        departure_date: newTourData.departureDate,
        tour_code: newTourData.tourCode,
        cover_image: newTourData.coverImage,
        country: newTourData.country,
        city: newTourData.city,
        status: '提案' as const,
        daily_itinerary: [],
        features: [],
        focus_cards: [],
        leader: { name: '', domesticPhone: '', overseasPhone: '' },
        meeting_info: { time: '', location: '' },
      }

      const newItinerary = await createItinerary({
        ...convertedData,
        created_by: user?.id || undefined,
      } as Parameters<typeof createItinerary>[0])

      if (newItinerary?.id) {
        setCurrentItineraryId(newItinerary.id)
        toast.success('行程表已建立')
      }
    } catch (error) {
      logger.error('建立行程表失敗:', error)
      toast.error('建立行程表失敗')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    )
  }

  // 沒有行程表 - 顯示建立按鈕
  if (!currentItineraryId) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-center">
        <FileText className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-morandi-primary mb-2">尚未建立行程表</h3>
        <p className="text-sm text-muted-foreground mb-6">
          建立行程表以展示旅遊行程內容
        </p>
        <Button onClick={handleCreateItinerary} disabled={creating}>
          {creating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          建立行程表
        </Button>
      </div>
    )
  }

  // 有行程表 - 顯示編輯器（左右分欄）
  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[600px] -mx-4 -my-4">
      {/* 左邊：編輯表單 */}
      <ItineraryEditor
        tourData={tourData}
        autoSaveStatus={autoSaveStatus}
        isDirty={isDirty}
        quoteTierPricings={quoteTierPricings}
        onChange={handleChange}
      />

      {/* 右邊：預覽 */}
      <ItineraryPreview
        tourData={tourData}
        isDirty={isDirty}
        autoSaveStatus={autoSaveStatus}
        onSave={performAutoSave}
      />
    </div>
  )
}
