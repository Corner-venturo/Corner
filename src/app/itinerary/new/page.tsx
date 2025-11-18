'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { TourForm } from '@/components/editor/TourForm'
import { TourPreview } from '@/components/editor/TourPreview'
import { PublishButton } from '@/components/editor/PublishButton'
import { useTourStore, useRegionsStore } from '@/stores'
import {
  IconBuilding,
  IconToolsKitchen2,
  IconSparkles,
  IconCalendar,
  IconPlane,
  IconMapPin,
} from '@tabler/icons-react'

// Icon mapping
const iconMap: any = {
  IconBuilding,
  IconToolsKitchen2,
  IconSparkles,
  IconCalendar,
  IconPlane,
  IconMapPin,
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
  const { items: tours } = useTourStore()
  const { countries, cities } = useRegionsStore()

  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [scale, setScale] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const mobileContentRef = useRef<HTMLDivElement>(null)
  const [tourData, setTourData] = useState(getDefaultTourData())
  const [loading, setLoading] = useState(true)

  // 使用 ref 追蹤是否已初始化，避免使用者編輯被覆蓋
  const hasInitializedRef = useRef(false)
  const lastTourIdRef = useRef<string | null>(null)

  // 從旅遊團載入資料（如果有 tour_id）
  // 只在首次載入或 tourId 改變時執行，避免覆蓋使用者編輯
  useEffect(() => {
    const initializeTourData = () => {
      // 如果 tourId 沒變，且已經初始化過，就不要重新載入
      if (hasInitializedRef.current && lastTourIdRef.current === tourId) {
        return
      }

      if (!tourId) {
        // 沒有 tour_id，使用空白資料
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
        lastTourIdRef.current = tourId
        return
      }

      // 有 tour_id,從旅遊團載入資料
      const tour = tours.find((t: any) => t.id === tourId)
      if (!tour) {
        setLoading(false)
        return
      }

      // 找到國家和城市名稱
      const country = tour.country_id ? countries.find((c: any) => c.id === tour.country_id) : null
      const city = tour.main_city_id ? cities.find((c: any) => c.id === tour.main_city_id) : null

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
      lastTourIdRef.current = tourId
    }

    initializeTourData()
  }, [tourId, tours, countries, cities])

  // 計算縮放比例（必須在 early return 之前）
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return

      const container = containerRef.current
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      // 調整目標尺寸（含手機框架）
      const targetWidth = viewMode === 'mobile' ? 410 : 1200 // 390 + 邊框
      const targetHeight = viewMode === 'mobile' ? 880 : 800 // 844 + 邊框

      // 計算縮放，留一些邊距
      const scaleX = (containerWidth - 40) / targetWidth
      const scaleY = (containerHeight - 40) / targetHeight

      const finalScale = Math.min(scaleX, scaleY, 0.9) // 最大 0.9 避免太大

      setScale(finalScale)
    }

    calculateScale()
    window.addEventListener('resize', calculateScale)
    return () => window.removeEventListener('resize', calculateScale)
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

  // Convert icon strings to components for preview
  // 使用 useMemo 穩定 processedData 引用，避免無限循環
  const processedData = React.useMemo(
    () => ({
      ...tourData,
      features: (tourData.features || []).map((f: any) => ({
        ...f,
        iconComponent: iconMap[f.icon] || IconSparkles,
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

  return (
    <div className="h-full flex flex-col">
      {/* ========== 頁面頂部區域 ========== */}
      <ResponsiveHeader
        title="新增行程"
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '行程管理', href: '/itinerary' },
          { label: '新增行程', href: '#' },
        ]}
        showBackButton={true}
        onBack={() => router.push('/itinerary')}
        actions={<PublishButton data={tourData} />}
      />

      {/* ========== 主要內容區域 ========== */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* 左側：輸入表單 */}
          <div className="w-1/2 bg-morandi-container/30 border-r border-morandi-container flex flex-col">
            <div className="h-14 bg-morandi-gold/90 text-white px-6 flex items-center border-b border-morandi-container">
              <h2 className="text-lg font-semibold">編輯表單</h2>
            </div>
            <div className="flex-1 overflow-y-auto bg-white">
              <TourForm data={tourData as any} onChange={setTourData as any} />
            </div>
          </div>

          {/* 右側：即時預覽 */}
          <div className="w-1/2 bg-gray-100 flex flex-col">
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
