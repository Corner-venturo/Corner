'use client'

import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { TourForm } from '@/components/editor/TourForm'
import { TourPreview } from '@/components/editor/TourPreview'
import { PublishButton } from '@/components/editor/PublishButton'
import { CreateQuoteFromItineraryButton } from '@/components/editor/CreateQuoteFromItineraryButton'
import { PrintItineraryForm } from '@/features/itinerary/components/PrintItineraryForm'
import { PrintItineraryPreview } from '@/features/itinerary/components/PrintItineraryPreview'
import { GeminiItineraryForm, type GeminiItineraryData } from '@/features/itinerary/components/GeminiItineraryForm'
import { GeminiItineraryPreview } from '@/features/itinerary/components/GeminiItineraryPreview'
import { Button } from '@/components/ui/button'
import { useTourStore, useRegionsStore, useItineraryStore, useAuthStore } from '@/stores'
import { useItineraries } from '@/hooks/cloud-hooks'
import { toast } from 'sonner'
import { Cloud, CloudOff } from 'lucide-react'
import { EditingWarningBanner } from '@/components/EditingWarningBanner'
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
import {
  Building2,
  UtensilsCrossed,
  Sparkles,
  Calendar,
  Plane,
  MapPin,
  Printer,
  Wand2,
} from 'lucide-react'

// Local tour data interface (uses meetingInfo instead of meetingPoints array)
interface LocalTourData {
  tagline: string
  title: string
  subtitle: string
  description: string
  departureDate: string
  tourCode: string
  coverImage?: string
  coverStyle?: 'original' | 'gemini' | 'nature' | 'serene' | 'luxury' | 'art' // 封面風格
  price?: string | null // 價格
  priceNote?: string | null // 價格備註
  country: string
  city: string
  status: string
  outboundFlight: FlightInfo
  returnFlight: FlightInfo
  features: Feature[]
  focusCards: FocusCard[]
  leader: LeaderInfo
  meetingInfo: MeetingPoint
  hotels?: HotelInfo[] // 飯店資訊
  itinerarySubtitle: string
  dailyItinerary: DailyItinerary[]
  showFeatures?: boolean
  showLeaderMeeting?: boolean
  showHotels?: boolean
  showPricingDetails?: boolean // 是否顯示詳細團費
  pricingDetails?: PricingDetails // 詳細團費
  // 價格方案
  priceTiers?: PriceTier[]
  showPriceTiers?: boolean
  // 常見問題
  faqs?: FAQ[]
  showFaqs?: boolean
  // 提醒事項
  notices?: string[]
  showNotices?: boolean
  // 取消政策
  cancellationPolicy?: string[]
  showCancellationPolicy?: boolean
  version_records?: ItineraryVersionRecord[]
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  IconBuilding: Building2,
  IconToolsKitchen2: UtensilsCrossed,
  IconSparkles: Sparkles,
  IconCalendar: Calendar,
  IconPlane: Plane,
  IconMapPin: MapPin,
}

// 預設的空白行程資料
const getDefaultTourData = () => ({
  // 封面資訊
  tagline: 'Corner Travel 2025',
  title: '漫遊福岡',
  subtitle: '半自由行',
  description: '2日市區自由活動 · 保證入住溫泉飯店 · 柳川遊船 · 阿蘇火山',
  departureDate: '2025/10/21',
  tourCode: '25JFO21CIG',
  coverImage:
    'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=1200&q=75&auto=format&fit=crop',
  country: '日本',
  city: '福岡',
  status: '草稿',

  // 航班資訊
  outboundFlight: {
    airline: '中華航空',
    flightNumber: 'CI110',
    departureAirport: 'TPE',
    departureTime: '06:50',
    departureDate: '10/21',
    arrivalAirport: 'FUK',
    arrivalTime: '09:55',
    duration: '2小時5分',
  },
  returnFlight: {
    airline: '中華航空',
    flightNumber: 'CI111',
    departureAirport: 'FUK',
    departureTime: '11:00',
    departureDate: '10/25',
    arrivalAirport: 'TPE',
    arrivalTime: '12:30',
    duration: '2小時30分',
  },

  // 行程特色
  features: [
    {
      icon: 'IconBuilding',
      title: '溫泉飯店體驗',
      description: '保證入住阿蘇溫泉飯店，享受日式溫泉文化',
    },
    {
      icon: 'IconToolsKitchen2',
      title: '美食饗宴',
      description: '博多拉麵、柳川鰻魚飯、長腳蟹自助餐',
    },
    {
      icon: 'IconSparkles',
      title: '精選體驗',
      description: '柳川遊船、阿蘇火山、太宰府天滿宮',
    },
    {
      icon: 'IconCalendar',
      title: '自由活動時間',
      description: '2日福岡市區自由探索，彈性安排個人行程',
    },
    {
      icon: 'IconPlane',
      title: '直飛航班',
      description: '中華航空桃園直飛福岡，省時便利',
    },
    {
      icon: 'IconMapPin',
      title: '專業領隊',
      description: '經驗豐富的領隊全程陪同，貼心服務',
    },
  ],

  // 精選景點
  focusCards: [
    {
      title: '由布院溫泉街',
      src: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&q=75&auto=format',
    },
    {
      title: '阿蘇火山口',
      src: 'https://images.unsplash.com/photo-1578469550956-0e16b69c6a3d?w=400&q=75&auto=format',
    },
    {
      title: '柳川水鄉',
      src: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=75&auto=format',
    },
    {
      title: '太宰府神社',
      src: 'https://images.unsplash.com/photo-1624253321033-c4eb104e7462?w=400&q=75&auto=format',
    },
  ],

  // 領隊資訊
  leader: {
    name: '鍾惠如 小姐',
    domesticPhone: '+886 0928402897',
    overseasPhone: '+81 08074371189',
  },

  // 集合資訊
  meetingInfo: {
    time: '2025/10/21 04:50',
    location: '桃園機場華航第二航廈 7號櫃台',
  },

  // 行程副標題
  itinerarySubtitle: '5天4夜精彩旅程規劃',

  // 逐日行程
  dailyItinerary: [
    {
      dayLabel: 'Day 1',
      date: '10/21 (二)',
      title: '台北 ✈ 福岡空港 → 由布院 · 金麟湖 → 阿蘇溫泉',
      highlight: '✨ 特別安排：由布院 · 金麟湖 ～ 日本 OL 人氣 NO.1 散策地',
      description:
        '集合於台灣桃園國際機場，由專人辦理出境手續，搭乘豪華客機，飛往日本九州玄關──福岡。',
      images: [
        'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1526481280695-3c46997ceda7?auto=format&fit=crop&w=1600&q=80',
      ],
      activities: [],
      recommendations: [],
      meals: {
        breakfast: '溫暖的家',
        lunch: '博多拉麵 (¥1000)',
        dinner: '長腳蟹自助餐',
      },
      accommodation: 'ASO RESORT GRANDVRIO HOTEL',
    },
    {
      dayLabel: 'Day 2',
      date: '10/22 (三)',
      title: '阿蘇火山 → 柳川遊船 → 旅人列車 → 太宰府天滿宮',
      highlight: '',
      description: '',
      images: [
        'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1549692520-acc6669e2f0c?auto=format&fit=crop&w=1600&q=80',
      ],
      activities: [
        {
          icon: '🌋',
          title: '阿蘇火山',
          description: '近距離觀賞活火山壯麗景觀',
          image:
            'https://images.unsplash.com/photo-1523419409543-0c1df022bddb?auto=format&fit=crop&w=1200&q=80',
        },
        {
          icon: '🚣',
          title: '柳川遊船',
          description: '乘船遊覽水鄉風情',
          image:
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        },
        {
          icon: '🚃',
          title: '旅人列車',
          description: '體驗日式風情列車',
          image:
            'https://images.unsplash.com/photo-1526481280695-3c46997ceda7?auto=format&fit=crop&w=1200&q=80',
        },
        {
          icon: '⛩️',
          title: '太宰府天滿宮',
          description: '參拜學問之神',
          image:
            'https://images.unsplash.com/photo-1549692520-acc6669e2f0c?auto=format&fit=crop&w=1200&q=80',
        },
      ],
      recommendations: [],
      meals: {
        breakfast: '飯店內早餐',
        lunch: '柳川鰻魚飯 (¥2400)',
        dinner: '涮涮鍋吃到飽',
      },
      accommodation: 'QUINTESSA HOTEL FUKUOKA TENJIN MINAMI',
    },
    {
      dayLabel: 'Day 3-4',
      date: '10/23-10/24',
      title: '福岡全日自由活動',
      highlight: '',
      description: '',
      images: [
        'https://images.unsplash.com/photo-1526481280695-3c46997ceda7?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1549692520-acc6669e2f0c?auto=format&fit=crop&w=1600&q=80',
      ],
      activities: [],
      recommendations: [
        '天神商圈購物',
        '福岡塔',
        '雅虎巨蛋',
        '鳥栖 PREMIUM OUTLET',
        '門司港懷舊街道',
      ],
      meals: {
        breakfast: '飯店內早餐',
        lunch: '敬請自理',
        dinner: '敬請自理',
      },
      accommodation: 'QUINTESSA HOTEL FUKUOKA TENJIN MINAMI',
    },
    {
      dayLabel: 'Day 5',
      date: '10/25 (六)',
      title: '福岡空港 ✈ 台北',
      highlight: '',
      description:
        '享受一個沒有 MORNING CALL 的早晨，悠閒的飯店用完早餐後，接著前往福岡空港，搭乘豪華客機返回台北，結束了愉快的九州之旅。',
      images: [
        'https://images.unsplash.com/photo-1502920514313-52581002a659?auto=format&fit=crop&w=1600&q=80',
      ],
      activities: [],
      recommendations: [],
      meals: {
        breakfast: '飯店內早餐',
        lunch: '機上餐食',
        dinner: '溫暖的家',
      },
      accommodation: '',
    },
  ],
})

function NewItineraryPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tourId = searchParams.get('tour_id')
  const itineraryId = searchParams.get('itinerary_id') // 編輯現有行程
  const type = searchParams.get('type') // 'print' or null (web)

  // 從報價單匯入參數
  const isFromQuote = searchParams.get('from_quote') === 'true'
  const quoteId = searchParams.get('quote_id')
  const quoteName = searchParams.get('quote_name')
  const daysFromQuote = parseInt(searchParams.get('days') || '0')
  const mealsFromQuote = searchParams.get('meals') ? JSON.parse(searchParams.get('meals') || '[]') : []
  const hotelsFromQuote = searchParams.get('hotels') ? JSON.parse(searchParams.get('hotels') || '[]') : []
  const activitiesFromQuote = searchParams.get('activities') ? JSON.parse(searchParams.get('activities') || '[]') : []
  const { items: tours } = useTourStore()
  const { items: itineraries } = useItineraries()
  const { countries, cities } = useRegionsStore()

  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [scale, setScale] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const mobileContentRef = useRef<HTMLDivElement>(null)
  // 版本控制：-1 表示主版本，0+ 表示 version_records 的索引
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1)
  const [tourData, setTourData] = useState<LocalTourData>({
    tagline: 'Corner Travel 2025',
    title: '',
    subtitle: '',
    description: '',
    departureDate: '',
    tourCode: '',
    coverImage: '',
    country: '',
    city: '',
    status: '草稿',
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
  })
  const [loading, setLoading] = useState(true)

  // 自動存檔相關狀態
  const [isDirty, setIsDirty] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [currentItineraryId, setCurrentItineraryId] = useState<string | null>(itineraryId)
  const { create: createItinerary, update: updateItinerary } = useItineraryStore()
  const { user } = useAuthStore()
  const tourDataRef = useRef(tourData)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 保持 ref 同步
  useEffect(() => {
    tourDataRef.current = tourData
  }, [tourData])

  // 轉換資料格式（camelCase → snake_case）- 與 PublishButton 一致
  const convertDataForSave = useCallback(() => {
    const data = tourDataRef.current
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
      price: data.price || null,
      price_note: data.priceNote || null,
      country: data.country,
      city: data.city,
      status: (data.status || 'draft') as 'draft' | 'published',
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

      if (currentItineraryId) {
        // 更新現有行程
        await updateItinerary(currentItineraryId, convertedData)
      } else {
        // 第一次建立（需要有標題才存）
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
          // 更新 URL（不刷新頁面）
          window.history.replaceState(null, '', `/itinerary/new?itinerary_id=${newItinerary.id}`)
        }
      }

      setIsDirty(false)
      setAutoSaveStatus('saved')
      // 3 秒後恢復 idle 狀態
      setTimeout(() => setAutoSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('自動存檔失敗:', error)
      setAutoSaveStatus('error')
      toast.error('自動存檔失敗，請手動儲存')
    }
  }, [isDirty, currentItineraryId, convertDataForSave, updateItinerary, createItinerary, user?.id])

  // 30 秒自動存檔
  useEffect(() => {
    if (isDirty) {
      // 清除舊的計時器
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
      // 設置新的 30 秒計時器
      autoSaveTimerRef.current = setTimeout(() => {
        performAutoSave()
      }, 30000) // 30 秒
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [isDirty, tourData, performAutoSave])

  // 離開頁面前存檔
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        // 嘗試存檔
        performAutoSave()
        // 顯示離開確認
        e.preventDefault()
        e.returnValue = '您有未儲存的變更，確定要離開嗎？'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty, performAutoSave])

  // Print itinerary data
  const [printData, setPrintData] = useState({
    // 封面
    coverImage: '',
    tagline: '角落嚴選行程',
    taglineEn: 'EXPLORE EVERY CORNER OF THE WORLD',
    title: '越南峴港經典五日',
    subtitle: '峴港的晨曦喚醒沉睡的古城，海風捎來遠方的故事\n在黃牆老屋與法式城堡之間，找到屬於自己的越式慢時光',
    price: '35,500',
    priceNote: '8人包團',
    country: '越南',
    city: '峴港',

    // 每日行程
    dailySchedule: [
      {
        day: 'D1',
        route: '桃園國際機場 > 峴港國際機場 > 五行山（含上下電梯）> 會安古鎮 > 飯店休憩',
        meals: { breakfast: '機上餐食', lunch: 'Bep Cuon', dinner: 'HOME Hoi An' },
        accommodation: '日出大宮殿飯店 Grand Sunrise Palace Hoi An 或 同級',
      },
      {
        day: 'D2',
        route: '晨喚 > 迦南島（竹筏體驗）> 美山聖地 > 越式按摩（2hrs）> 飯店休憩',
        meals: { breakfast: '飯店用餐', lunch: '海鮮火鍋', dinner: 'Morning Glory Original' },
        accommodation: '日出大宮殿飯店 Grand Sunrise Palace Hoi An 或 同級',
      },
      {
        day: 'D3',
        route: '晨喚 > 南會安珍珠奇幻樂園 > 會安印象主題公園 > 會安印象秀 > 飯店休憩',
        meals: { breakfast: '飯店用餐', lunch: '敬請自理', dinner: 'Non La 斗笠餐廳' },
        accommodation: '日出大宮殿飯店 Grand Sunrise Palace Hoi An 或 同級',
      },
      {
        day: 'D4',
        route: '晨喚 > 巴拿山（登山纜車、黃金佛手橋、法式莊園、奇幻樂園）> 飯店休憩 > 山茶夜市（自由前往）',
        meals: { breakfast: '飯店用餐', lunch: '園區自助餐', dinner: 'All Seasons 四季餐廳' },
        accommodation: '峴港M飯店 M Hotel Danang 或 同級',
      },
      {
        day: 'D5',
        route: '晨喚 > 美溪沙灘（自由前往）> 峴港大教堂（外觀不入內）> 峴港國際機場 > 桃園國際機場',
        meals: { breakfast: '飯店用餐', lunch: '法國麵包+飲品', dinner: '機上餐食' },
        accommodation: '',
      },
    ],

    // 航班
    flightOptions: [
      {
        airline: '長榮航空',
        outbound: { code: 'BR-383', from: '桃園國際機場', fromCode: 'TPE', time: '09:45', to: '峴港國際機場', toCode: 'DAD', arrivalTime: '11:40' },
        return: { code: 'BR-384', from: '峴港國際機場', fromCode: 'DAD', time: '13:30', to: '桃園國際機場', toCode: 'TPE', arrivalTime: '16:50' },
      },
      {
        airline: '中華航空',
        outbound: { code: 'CI-787', from: '桃園國際機場', fromCode: 'TPE', time: '07:15', to: '峴港國際機場', toCode: 'DAD', arrivalTime: '09:10' },
        return: { code: 'CI-790', from: '峴港國際機場', fromCode: 'DAD', time: '17:35', to: '桃園國際機場', toCode: 'TPE', arrivalTime: '21:20' },
      },
    ],

    // 行程特色
    highlightImages: ['', '', ''],
    highlightSpots: [
      {
        name: '會安古鎮',
        nameEn: 'Hoi An Ancient Town',
        tags: ['特色景點', '必訪景點'],
        description: '會安古鎮是越南世界文化遺產，黃牆古厝與絲綢燈籠交織，夜晚倒映河面如夢似幻，是體驗越南古典韻味的絕佳去處。',
      },
      {
        name: '美山聖地',
        nameEn: 'My Son Sanctuary',
        tags: ['必訪景點', '特色景點'],
        description: '美山聖地是占婆王國遺址，紅磚聖殿群見證4至13世紀文明，精緻雕刻展現印度教文化影響，是越南的吳哥窟世界遺產。',
      },
      {
        name: '美溪沙灘',
        nameEn: 'My Khe Beach',
        tags: ['必訪景點', '特色景點'],
        description: '美溪沙灘綿延10公里潔白細沙，2005年獲選世界六大最美海灘，碧藍海水柔軟沙灘，適合衝浪戲水品嚐海鮮的度假天堂。',
      },
    ],

    // 景點介紹
    sights: [
      {
        name: '五行山',
        nameEn: 'Marble Mountains',
        description: '五行山是峴港最具靈性的自然奇景，由五座石灰岩山峰組成，分別代表金、木、水、火、土五行元素。山中遍布神秘洞穴、古老佛寺與精緻石雕，其中華嚴洞和玄空洞最為壯觀，陽光從洞頂灑落的景象令人屏息。登上山頂可俯瞰峴港市區與美溪沙灘的絕美全景。這裡不僅是重要的佛教聖地，山腳下的石雕村更展現精湛的大理石工藝，是感受越南文化與自然之美的必訪之地。',
      },
      {
        name: '迦南島',
        nameEn: 'Cam Thanh',
        description: '迦南島是會安近郊的水椰林秘境，這片原始生態村落以茂密的水椰樹林聞名，搭乘傳統竹籃船穿梭其間，是最受歡迎的體驗。船夫會展示精湛的划船技巧，讓竹籃船在水道中旋轉，充滿歡樂與驚喜。島上居民世代以捕魚為生，遊客可親自體驗撒網捕魚、製作椰葉工藝品，感受純樸的鄉村生活。這裡遠離都市喧囂，是探索越南田園風光的絕佳去處。',
      },
      {
        name: '南會安珍珠奇幻樂園',
        nameEn: 'VinWonders Nam Hoi An',
        description: '南會安珍珠奇幻樂園是越南最大的主題樂園之一，結合陸地遊樂設施與水上樂園雙重體驗。園區擁有刺激的雲霄飛車、夢幻旋轉木馬等多樣設施，水上樂園更設有巨型滑水道與漂漂河。特色越南文化表演與河內水上木偶戲讓遊客深度認識越南傳統。',
        note: '圖片取自VinWonders Nam Hoi An官方網站，僅作為行程示意使用，版權歸原網站所有',
      },
    ],
  })

  // Gemini AI 行程資料
  const [geminiData, setGeminiData] = useState<GeminiItineraryData>({
    coverImage: '',
    tagline: '角落嚴選行程',
    taglineEn: 'EXPLORE EVERY CORNER OF THE WORLD',
    title: '',
    subtitle: '',
    price: '',
    priceNote: '',
    country: '',
    city: '',
    dailySchedule: [],
    flightOptions: [],
    highlightImages: [],
    highlightSpots: [],
    sights: [],
  })

  // 使用 ref 追蹤是否已初始化，避免使用者編輯被覆蓋
  const hasInitializedRef = useRef(false)
  const lastIdRef = useRef<string | null>(null)

  // 從行程或旅遊團載入資料
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
        if (itinerary) {
          // 從 itinerary 載入完整資料
          setTourData({
            tagline: itinerary.tagline || 'Corner Travel 2025',
            title: itinerary.title || '',
            subtitle: itinerary.subtitle || '',
            description: itinerary.description || '',
            departureDate: itinerary.departure_date || '',
            tourCode: itinerary.tour_code || '',
            coverImage: itinerary.cover_image || '',
            coverStyle: itinerary.cover_style || 'original',
            price: itinerary.price || '',
            priceNote: itinerary.price_note || '',
            country: itinerary.country || '',
            city: itinerary.city || '',
            status: itinerary.status || '草稿',
            outboundFlight: itinerary.outbound_flight || {
              airline: '',
              flightNumber: '',
              departureAirport: 'TPE',
              departureTime: '',
              departureDate: '',
              arrivalAirport: '',
              arrivalTime: '',
              duration: '',
            },
            returnFlight: itinerary.return_flight || {
              airline: '',
              flightNumber: '',
              departureAirport: '',
              departureTime: '',
              departureDate: '',
              arrivalAirport: 'TPE',
              arrivalTime: '',
              duration: '',
            },
            features: itinerary.features || [],
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
            hotels: (itinerary.hotels as typeof tourData.hotels) || [],
            showHotels: itinerary.show_hotels || false,
            itinerarySubtitle: itinerary.itinerary_subtitle || '',
            dailyItinerary: itinerary.daily_itinerary || [],
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
            // 價格方案
            priceTiers: itinerary.price_tiers || [],
            showPriceTiers: itinerary.show_price_tiers || false,
            // 常見問題
            faqs: itinerary.faqs || [],
            showFaqs: itinerary.show_faqs || false,
            // 提醒事項
            notices: itinerary.notices || [],
            showNotices: itinerary.show_notices || false,
            // 取消政策
            cancellationPolicy: itinerary.cancellation_policy || [],
            showCancellationPolicy: itinerary.show_cancellation_policy || false,
            version_records: itinerary.version_records || [],
          })
          // 重置版本索引到主版本
          setCurrentVersionIndex(-1)
          setLoading(false)
          hasInitializedRef.current = true
          lastIdRef.current = currentId
          return
        } else {
          // 有 itineraryId 但找不到資料，可能 store 還沒載入完成，繼續等待
          // 不要跳到空白表單
          return
        }
      }

      if (!tourId) {
        // 檢查是否從報價單匯入
        if (isFromQuote && daysFromQuote > 0) {
          // 建立每日行程的骨架
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
            status: '草稿',
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

        // 沒有任何 ID，使用空白資料
        setTourData({
          tagline: 'Corner Travel 2025',
          title: '',
          subtitle: '',
          description: '',
          departureDate: '',
          tourCode: '',
          coverImage: '',
          country: '',
          city: '',
          status: '草稿',
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
        })
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

      // 找到國家和城市名稱
      const country = tour.country_id ? countries.find((c) => c.id === tour.country_id) : null
      const city = tour.main_city_id ? cities.find((c) => c.id === tour.main_city_id) : null

      // 計算天數
      const departureDate = new Date(tour.departure_date)
      const returnDate = new Date(tour.return_date)
      const days =
        Math.ceil((returnDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

      // 建立從旅遊團帶入的行程資料
      setTourData({
        tagline: 'Corner Travel 2025',
        title: tour.name,
        subtitle: '精緻旅遊',
        description: tour.description || '',
        departureDate: departureDate.toLocaleDateString('zh-TW'),
        tourCode: tour.code,
        coverImage:
          city?.background_image_url ||
          'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=1200&q=75&auto=format&fit=crop',
        country: country?.name || tour.location || '',
        city: city?.name || tour.location || '',
        status: '草稿',
        outboundFlight: {
          airline: '',
          flightNumber: '',
          departureAirport: 'TPE',
          departureTime: '',
          departureDate: departureDate.toLocaleDateString('zh-TW', {
            month: '2-digit',
            day: '2-digit',
          }),
          arrivalAirport: city?.airport_code || '',
          arrivalTime: '',
          duration: '',
        },
        returnFlight: {
          airline: '',
          flightNumber: '',
          departureAirport: city?.airport_code || '',
          departureTime: '',
          departureDate: returnDate.toLocaleDateString('zh-TW', {
            month: '2-digit',
            day: '2-digit',
          }),
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
          time: departureDate.toLocaleDateString('zh-TW') + ' 04:50',
          location: '桃園機場第二航廈',
        },
        itinerarySubtitle: `${days}天${days - 1}夜精彩旅程規劃`,
        dailyItinerary: [],
      })

      setLoading(false)
      hasInitializedRef.current = true
      lastIdRef.current = currentId
    }

    initializeTourData()
     
  }, [tourId, itineraryId, tours, itineraries, countries, cities, isFromQuote, daysFromQuote])

  // 計算縮放比例（必須在 early return 之前）
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return

      const container = containerRef.current
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      // 容器尺寸還沒準備好時跳過
      if (containerWidth === 0 || containerHeight === 0) return

      // 調整目標尺寸（含手機框架）
      const targetWidth = viewMode === 'mobile' ? 410 : 1200 // 390 + 邊框
      const targetHeight = viewMode === 'mobile' ? 880 : 800 // 844 + 邊框

      // 計算縮放，留一些邊距
      const scaleX = (containerWidth - 40) / targetWidth
      const scaleY = (containerHeight - 40) / targetHeight

      const finalScale = Math.min(scaleX, scaleY, 0.9) // 最大 0.9 避免太大

      setScale(finalScale)
    }

    // 使用 ResizeObserver 監聽容器尺寸變化
    const resizeObserver = new ResizeObserver(() => {
      calculateScale()
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    // 初次計算延遲執行，確保 DOM 已渲染
    const timer = setTimeout(calculateScale, 100)

    window.addEventListener('resize', calculateScale)
    return () => {
      clearTimeout(timer)
      resizeObserver.disconnect()
      window.removeEventListener('resize', calculateScale)
    }
  }, [viewMode])

  // 切換到手機模式時，滾動到標題區域
  useEffect(() => {
    if (viewMode === 'mobile' && mobileContentRef.current) {
      // 延遲執行確保內容已渲染
      setTimeout(() => {
        if (mobileContentRef.current) {
          // 滾動到讓「探索」按鈕剛好在底部可見
          const heroHeight = window.innerHeight * 0.7 // 預估 hero 區域高度
          mobileContentRef.current.scrollTop = heroHeight - 400
        }
      }, 100)
    }
  }, [viewMode])

  // 版本切換處理：從 version_records 載入資料到表單
  const handleVersionChange = (index: number, versionData?: ItineraryVersionRecord) => {
    setCurrentVersionIndex(index)

    if (index === -1) {
      // 切回主版本：從 store 重新載入原始資料
      if (itineraryId) {
        const itinerary = itineraries.find((i) => i.id === itineraryId)
        if (itinerary) {
          setTourData(prev => ({
            ...prev,
            dailyItinerary: itinerary.daily_itinerary || [],
            features: itinerary.features || [],
            focusCards: itinerary.focus_cards || [],
            leader: itinerary.leader || { name: '', domesticPhone: '', overseasPhone: '' },
            meetingInfo: itinerary.meeting_info || { time: '', location: '' },
          }))
        }
      }
    } else if (versionData) {
      // 切換到特定版本：載入該版本的資料
      setTourData(prev => ({
        ...prev,
        dailyItinerary: versionData.daily_itinerary || [],
        features: versionData.features || [],
        focusCards: versionData.focus_cards || [],
        leader: versionData.leader || { name: '', domesticPhone: '', overseasPhone: '' },
        meetingInfo: versionData.meeting_info || { time: '', location: '' },
      }))
    }
  }

  // Convert icon strings to components for preview
  // 使用 useMemo 穩定 processedData 引用，避免無限循環
  const processedData = React.useMemo(
    () => ({
      ...tourData,
      features: (tourData.features || []).map((f) => ({
        ...f,
        iconComponent: iconMap[f.icon] || Sparkles,
      })),
    }),
    [tourData]
  )

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-morandi-secondary">載入中...</div>
      </div>
    )
  }

  // 列印版行程表
  if (type === 'print') {
    return (
      <div className="h-full flex flex-col">
        {/* 頁面頂部區域 */}
        <ResponsiveHeader
          title="新增紙本行程表"
          breadcrumb={[
            { label: '首頁', href: '/' },
            { label: '行程管理', href: '/itinerary' },
            { label: '新增紙本行程表', href: '#' },
          ]}
          showBackButton={true}
          onBack={() => router.push('/itinerary')}
          actions={
            <Button
              onClick={() => window.print()}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              <Printer size={16} className="mr-2" />
              列印
            </Button>
          }
        />

        {/* 主要內容區域 */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* 左側：輸入表單 */}
            <div className="w-1/2 bg-morandi-container/30 border-r border-morandi-container flex flex-col print:hidden">
              <div className="h-14 bg-morandi-green/90 text-white px-6 flex items-center border-b border-morandi-container">
                <h2 className="text-lg font-semibold">編輯表單</h2>
              </div>
              <div className="flex-1 overflow-y-auto bg-white">
                <PrintItineraryForm data={printData} onChange={setPrintData} />
              </div>
            </div>

            {/* 右側：即時預覽 */}
            <div className="w-1/2 bg-gray-100 flex flex-col print:w-full">
              <div className="h-14 bg-white border-b px-6 flex items-center justify-between print:hidden">
                <h2 className="text-lg font-semibold text-morandi-primary">列印預覽</h2>
                <div className="text-sm text-gray-600">A4 尺寸 (210mm × 297mm)</div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 print:p-0">
                <PrintItineraryPreview data={printData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Gemini AI 行程表
  if (type === 'gemini') {
    return (
      <div className="h-full flex flex-col">
        {/* 頁面頂部區域 */}
        <ResponsiveHeader
          title="Gemini AI 行程表"
          breadcrumb={[
            { label: '首頁', href: '/' },
            { label: '行程管理', href: '/itinerary' },
            { label: 'Gemini AI 行程表', href: '#' },
          ]}
          showBackButton={true}
          onBack={() => router.push('/itinerary')}
          actions={
            <Button
              onClick={() => window.print()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              <Wand2 size={16} className="mr-2" />
              儲存行程
            </Button>
          }
        />

        {/* 主要內容區域 */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* 左側：輸入表單 */}
            <div className="w-1/2 bg-morandi-container/30 border-r border-morandi-container flex flex-col print:hidden">
              <div className="h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 flex items-center border-b border-morandi-container">
                <Sparkles size={18} className="mr-2" />
                <h2 className="text-lg font-semibold">AI 智慧編輯</h2>
              </div>
              <div className="flex-1 overflow-y-auto bg-white">
                <GeminiItineraryForm data={geminiData} onChange={setGeminiData} />
              </div>
            </div>

            {/* 右側：即時預覽 */}
            <div className="w-1/2 bg-gray-100 flex flex-col print:w-full">
              <div className="h-14 bg-white border-b px-6 flex items-center justify-between print:hidden">
                <h2 className="text-lg font-semibold text-morandi-primary">即時預覽</h2>
                <div className="text-sm text-gray-500">AI 生成內容會即時顯示</div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 print:p-0">
                <GeminiItineraryPreview data={geminiData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 網頁版行程表（原本的）
  return (
    <div className="h-full flex flex-col">
      {/* ========== 頁面頂部區域 ========== */}
      <ResponsiveHeader
        title={tourData.tourCode ? `編輯行程 - ${tourData.tourCode}` : "新增網頁行程"}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '行程管理', href: '/itinerary' },
          { label: tourData.tourCode ? `編輯 - ${tourData.tourCode}` : '新增網頁行程', href: '#' },
        ]}
        showBackButton={true}
        onBack={() => router.push('/itinerary')}
        actions={
          <div className="flex items-center gap-3">
            <CreateQuoteFromItineraryButton
              tourData={tourData}
              itineraryId={itineraryId}
            />
            <PublishButton
              data={{ ...tourData, id: itineraryId || undefined, version_records: tourData.version_records }}
              currentVersionIndex={currentVersionIndex}
              onVersionChange={handleVersionChange}
            />
          </div>
        }
      />

      {/* 編輯衝突警告 */}
      {currentItineraryId && (
        <EditingWarningBanner
          resourceType="itinerary"
          resourceId={currentItineraryId}
          resourceName="此行程"
        />
      )}

      {/* ========== 主要內容區域 ========== */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* 左側：輸入表單 */}
          <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
            <div className="h-14 bg-morandi-gold/90 text-white px-6 flex items-center justify-between border-b border-gray-200">
              <h2 className="text-lg font-semibold">編輯表單</h2>
              {/* 自動存檔狀態指示 */}
              <div className="flex items-center gap-2 text-sm">
                {autoSaveStatus === 'saving' && (
                  <span className="flex items-center gap-1.5 text-white/80">
                    <Cloud size={14} className="animate-pulse" />
                    存檔中...
                  </span>
                )}
                {autoSaveStatus === 'saved' && (
                  <span className="flex items-center gap-1.5 text-white/80">
                    <Cloud size={14} />
                    已儲存
                  </span>
                )}
                {autoSaveStatus === 'error' && (
                  <span className="flex items-center gap-1.5 text-red-200">
                    <CloudOff size={14} />
                    存檔失敗
                  </span>
                )}
                {autoSaveStatus === 'idle' && isDirty && (
                  <span className="flex items-center gap-1.5 text-white/60">
                    <Cloud size={14} />
                    未儲存
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-white">
              <TourForm
                data={{
                  ...tourData,
                  meetingPoints: tourData.meetingInfo ? [tourData.meetingInfo] : [],
                  hotels: tourData.hotels || [],
                  countries: [],
                  showFeatures: tourData.showFeatures !== false,
                  showLeaderMeeting: tourData.showLeaderMeeting !== false,
                  showHotels: tourData.showHotels || false,
                  showPricingDetails: tourData.showPricingDetails || false,
                  pricingDetails: tourData.pricingDetails,
                  // 價格方案
                  priceTiers: tourData.priceTiers,
                  showPriceTiers: tourData.showPriceTiers || false,
                  // 常見問題
                  faqs: tourData.faqs,
                  showFaqs: tourData.showFaqs || false,
                  // 提醒事項
                  notices: tourData.notices,
                  showNotices: tourData.showNotices || false,
                  // 取消政策
                  cancellationPolicy: tourData.cancellationPolicy,
                  showCancellationPolicy: tourData.showCancellationPolicy || false,
                }}
                onChange={(newData) => {
                   
                  const { meetingPoints, countries, ...restData } = newData;
                  setTourData({
                    ...restData,
                    status: tourData.status,
                    meetingInfo: meetingPoints?.[0] || { time: '', location: '' },
                    hotels: newData.hotels || [],
                    showPricingDetails: newData.showPricingDetails,
                    pricingDetails: newData.pricingDetails,
                    // 價格方案
                    priceTiers: newData.priceTiers ?? undefined,
                    showPriceTiers: newData.showPriceTiers,
                    // 常見問題
                    faqs: newData.faqs ?? undefined,
                    showFaqs: newData.showFaqs,
                    // 提醒事項
                    notices: newData.notices ?? undefined,
                    showNotices: newData.showNotices,
                    // 取消政策
                    cancellationPolicy: newData.cancellationPolicy ?? undefined,
                    showCancellationPolicy: newData.showCancellationPolicy,
                  });
                  // 標記有變更，觸發自動存檔
                  setIsDirty(true);
                }}
              />
            </div>
          </div>

          {/* 右側：即時預覽 */}
          <div className="w-1/2 bg-white flex flex-col">
            {/* 標題列 */}
            <div className="h-14 bg-white border-b px-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-morandi-primary">即時預覽</h2>
                <div className="flex gap-2 bg-morandi-container/30 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('desktop')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'desktop'
                        ? 'bg-morandi-gold text-white'
                        : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/50'
                    }`}
                  >
                    💻 電腦
                  </button>
                  <button
                    onClick={() => setViewMode('mobile')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'mobile'
                        ? 'bg-morandi-gold text-white'
                        : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/50'
                    }`}
                  >
                    📱 手機
                  </button>
                </div>
              </div>
            </div>

            {/* 預覽容器 */}
            <div className="flex-1 overflow-hidden p-8" ref={containerRef}>
              <div className="w-full h-full flex items-center justify-center">
                {/* 縮放容器 */}
                <div
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                  }}
                >
                  {viewMode === 'mobile' ? (
                    // 手機框架和內容
                    <div className="relative">
                      {/* iPhone 14 Pro 尺寸 */}
                      <div className="bg-black rounded-[45px] p-[8px] shadow-2xl">
                        {/* 頂部凹槽 (Dynamic Island) */}
                        <div className="absolute top-[20px] left-1/2 -translate-x-1/2 z-10">
                          <div className="bg-black w-[120px] h-[34px] rounded-full"></div>
                        </div>

                        {/* 螢幕 */}
                        <div
                          className="bg-white rounded-[37px] overflow-hidden relative"
                          style={{
                            width: '390px',
                            height: '844px',
                          }}
                        >
                          {/* 內容區域 */}
                          <div
                            className="w-full h-full overflow-y-auto"
                            ref={mobileContentRef}
                            style={{
                              scrollBehavior: 'smooth',
                            }}
                          >
                            <TourPreview data={processedData} viewMode="mobile" />
                          </div>

                          {/* 底部指示條 */}
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
                            <div className="w-32 h-1 bg-gray-300 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // 電腦版
                    <div
                      className="bg-white shadow-2xl rounded-lg overflow-hidden"
                      style={{
                        width: '1200px',
                        height: '800px',
                      }}
                    >
                      <div className="w-full h-full overflow-y-auto">
                        <TourPreview data={processedData} viewMode="desktop" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NewItineraryPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morandi-gold mx-auto mb-4"></div>
            <p className="text-morandi-secondary">載入中...</p>
          </div>
        </div>
      }
    >
      <NewItineraryPageContent />
    </Suspense>
  )
}
