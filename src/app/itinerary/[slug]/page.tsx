'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { TourForm } from '@/components/editor/TourForm'
import { TourPreview } from '@/components/editor/TourPreview'
import { PublishButton } from '@/components/editor/PublishButton'
import { useItineraryStore } from '@/stores'
import {
  IconBuilding,
  IconToolsKitchen2,
  IconSparkles,
  IconCalendar,
  IconPlane,
  IconMapPin,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconClock,
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

export default function EditItineraryPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { fetchById } = useItineraryStore()

  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [scale, setScale] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const [itineraryData, setItineraryData] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // 載入行程資料或從旅遊團建立
  useEffect(() => {
    const loadOrCreateItinerary = async () => {
      try {
        // 1. 先嘗試載入行程
        const itinerary = await fetchById(slug)
        if (itinerary) {
          setItineraryData(itinerary)
          setLoading(false)
          return
        }

        // 2. 找不到行程，嘗試從旅遊團載入
        const { useTourStore } = await import('@/stores')
        const tourStore = useTourStore.getState() as any
        await tourStore.fetchAll()
        const tour = tourStore.items.find((t: any) => t.id === slug)

        if (tour) {
          // 從旅遊團建立行程資料
          const { useRegionsStore } = await import('@/stores')
          const regionsStore = (useRegionsStore as any).getState()
          await regionsStore.fetchAll()
          const { countries, cities } = regionsStore as any

          // 找到國家和城市名稱
          const country = tour.country_id ? countries.find((c: any) => c.id === tour.country_id) : null
          const city = tour.main_city_id ? cities.find((c: any) => c.id === tour.main_city_id) : null

          // 計算天數
          const departureDate = new Date(tour.departure_date)
          const returnDate = new Date(tour.return_date)
          const days =
            Math.ceil((returnDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

          // 建立預設行程資料
          const newItinerary = {
            id: slug,
            tour_id: slug,
            tagline: 'Corner Travel 2025',
            title: tour.name,
            subtitle: '精緻旅遊',
            description: tour.description || '',
            departureDate: departureDate.toLocaleDateString('zh-TW'),
            tourCode: tour.code,
            coverImage:
              (city as any)?.background_image_url ||
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
              arrivalAirport: (city as any)?.airport_code || '',
              arrivalTime: '',
              duration: '',
            },
            returnFlight: {
              airline: '',
              flightNumber: '',
              departureAirport: (city as any)?.airport_code || '',
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
            meetingPoints: [{
              time: '',
              location: '',
            }],
            hotels: [],
            itinerarySubtitle: `${days}天${days - 1}夜精彩旅程規劃`,
            dailyItinerary: Array.from({ length: days }, (_, i) => ({
              dayLabel: `Day ${i + 1}`,
              date: new Date(departureDate.getTime() + i * 24 * 60 * 60 * 1000).toLocaleDateString(
                'zh-TW',
                { month: '2-digit', day: '2-digit' }
              ),
              title:
                i === 0
                  ? `台北 ✈ ${city?.name || tour.location}`
                  : i === days - 1
                    ? `${city?.name || tour.location} ✈ 台北`
                    : `${city?.name || tour.location} 自由活動`,
              highlight: '',
              description: '',
              activities: [],
              recommendations: [],
              meals: {
                breakfast: i === 0 ? '溫暖的家' : '飯店內早餐',
                lunch: '敬請自理',
                dinner: i === days - 1 ? '溫暖的家' : '敬請自理',
              },
              accommodation: i === days - 1 ? '' : '待安排',
            })),
          }

          setItineraryData(newItinerary)
          setLoading(false)
          return
        }

        // 3. 都找不到，顯示錯誤
        setNotFound(true)
        setLoading(false)
      } catch (error) {
        setNotFound(true)
        setLoading(false)
      }
    }

    loadOrCreateItinerary()
  }, [slug, fetchById, router])

  // Convert icon strings to components for preview
  const processedData = itineraryData
    ? {
        ...(itineraryData as any),
        features:
          (itineraryData as any).features?.map((f: { icon: string }) => ({
            ...f,
            iconComponent: iconMap[f.icon] || IconSparkles,
          })) || [],
      }
    : null

  const typedItinerary = useMemo(() => itineraryData as any, [itineraryData])
  const totalDays = useMemo(
    () =>
      Array.isArray(typedItinerary?.dailyItinerary) ? typedItinerary.dailyItinerary.length : 0,
    [typedItinerary]
  )
  const featureCount = useMemo(
    () => (Array.isArray(typedItinerary?.features) ? typedItinerary.features.length : 0),
    [typedItinerary]
  )
  const travelRange = useMemo(() => {
    if (!typedItinerary?.departureDate || !typedItinerary?.returnFlight?.departureDate) return null
    return `${typedItinerary.departureDate} - ${typedItinerary.returnFlight.departureDate}`
  }, [typedItinerary])
  const locationLabel = useMemo(
    () => typedItinerary?.city || typedItinerary?.country || '',
    [typedItinerary]
  )
  const statusLabel = typedItinerary?.status ?? '草稿'
  const previewSubtitle =
    typedItinerary?.subtitle || typedItinerary?.tagline || '隨時查看最新行程預覽'

  // 計算縮放比例
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return

      const container = containerRef.current
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      // 目標尺寸
      const targetWidth = viewMode === 'mobile' ? 400 : 1200 // 手機含框架
      const targetHeight = viewMode === 'mobile' ? 850 : 800

      // 計算縮放比例（寬高都要考慮）
      const scaleX = containerWidth / targetWidth
      const scaleY = containerHeight / targetHeight

      // 取較小值確保完全顯示
      const finalScale = Math.min(scaleX, scaleY, 1)

      setScale(finalScale)
    }

    // 延遲計算，確保 DOM 已完全更新
    const timer = setTimeout(() => {
      calculateScale()
    }, 100)

    window.addEventListener('resize', calculateScale)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', calculateScale)
    }
  }, [viewMode])

  // 載入中狀態
  if (loading) {
    return (
      <div className="relative flex h-full min-h-[480px] items-center justify-center overflow-hidden bg-gradient-to-br from-[#f4f9ff] via-[#fef9f3] to-[#e8f7ff]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%)]" />
        <div className="relative z-10 rounded-3xl border border-white/60 bg-white/80 px-10 py-8 text-center shadow-2xl backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.4em] text-morandi-muted">Loading</p>
          <p className="mt-3 text-lg font-semibold text-morandi-primary">行程資料載入中...</p>
          <p className="mt-2 text-morandi-secondary">
            我們正在為您整理每一個旅遊細節，請稍候片刻。
          </p>
        </div>
      </div>
    )
  }

  // 找不到行程
  if (notFound || !itineraryData) {
    return (
      <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-br from-[#f4f9ff] via-[#fef9f3] to-[#e8f7ff]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(56,189,248,0.25),_transparent_65%)] blur-3xl" />
          <div className="absolute bottom-0 right-10 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(34,211,238,0.18),_transparent_70%)] blur-3xl" />
        </div>
        <ResponsiveHeader
          title="行程不存在"
          breadcrumb={[
            { label: '首頁', href: '/' },
            { label: '行程管理', href: '/itinerary' },
            { label: '錯誤', href: '#' },
          ]}
          showBackButton={true}
          onBack={() => router.push('/itinerary')}
        />
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-xl rounded-3xl border border-white/60 bg-white/85 p-10 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0f6eea]/10 text-[#0f6eea]">
              <IconSparkles size={32} stroke={1.6} />
            </div>
            <h2 className="text-2xl font-semibold text-morandi-primary">找不到此行程</h2>
            <p className="mt-3 text-morandi-secondary">
              行程可能已被刪除，或是您輸入的網址不正確。
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={() => router.push('/itinerary')} className="btn-morandi-secondary">
                返回行程列表
              </button>
              <button onClick={() => router.push('/itinerary/new')} className="btn-morandi-primary">
                建立新行程
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-gradient-to-br from-[#f4f9ff] via-[#fef9f3] to-[#e8f7ff]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-28 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(56,189,248,0.25),_transparent_65%)] blur-3xl" />
        <div className="absolute top-1/4 right-[-120px] h-96 w-96 rounded-full bg-[radial-gradient(circle,_rgba(34,211,238,0.2),_transparent_70%)] blur-3xl" />
        <div className="absolute bottom-[-140px] left-1/3 h-96 w-96 rounded-full bg-[radial-gradient(circle,_rgba(14,165,233,0.22),_transparent_70%)] blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-full flex-col">
        {/* ========== 頁面頂部區域 ========== */}
        <ResponsiveHeader
          title="編輯行程"
          breadcrumb={[
            { label: '首頁', href: '/' },
            { label: '行程管理', href: '/itinerary' },
            { label: '編輯行程', href: '#' },
          ]}
          showBackButton={true}
          onBack={() => router.push('/itinerary')}
          actions={<PublishButton data={itineraryData} />}
        />

        {/* ========== 主要內容區域 ========== */}
        <div className="flex-1 overflow-y-auto px-6 pb-10 pt-6">
          <div className="mx-auto flex max-w-[1680px] flex-col gap-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-2xl shadow-[#9ad6ff]/30 backdrop-blur-lg">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-morandi-muted">
                      Itinerary overview
                    </p>
                    <h1 className="mt-3 text-2xl font-semibold text-morandi-primary">
                      {typedItinerary?.title || '尚未命名的旅程'}
                    </h1>
                    <p className="mt-1 text-sm text-morandi-secondary">{previewSubtitle}</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#22c55e]/15 px-4 py-2 text-sm font-medium text-[#0f5132]">
                    <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                    {statusLabel}
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-morandi-secondary">
                  {typedItinerary?.tourCode && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#0f6eea]/10 px-3 py-1 font-medium text-[#0f3d5c]">
                      <IconSparkles size={16} stroke={1.6} />
                      {typedItinerary.tourCode}
                    </span>
                  )}
                  {locationLabel && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1">
                      <IconMapPin size={16} stroke={1.6} />
                      {locationLabel}
                    </span>
                  )}
                  {travelRange && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1">
                      <IconCalendar size={16} stroke={1.6} />
                      {travelRange}
                    </span>
                  )}
                  {totalDays > 0 && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1">
                      <IconClock size={16} stroke={1.6} />
                      {totalDays} 天行程 · {Math.max(totalDays - 1, 0)} 晚
                    </span>
                  )}
                  {featureCount > 0 && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1">
                      <IconSparkles size={16} stroke={1.6} />
                      精選亮點 {featureCount} 項
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-center gap-3">
                <div className="rounded-2xl border border-white/60 bg-white/60 px-5 py-4 shadow-lg shadow-[#9ad6ff]/40 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.4em] text-morandi-muted">
                    Preview sync
                  </p>
                  <p className="mt-2 text-sm text-morandi-secondary">
                    左側修改會即時反映於右側預覽，協助團隊快速確認呈現效果。
                  </p>
                </div>
                <div className="rounded-2xl border border-[#0f6eea]/10 bg-[#0f6eea]/10 px-5 py-4 text-[#0f3d5c] shadow-lg shadow-[#9ad6ff]/40">
                  <p className="text-xs uppercase tracking-[0.4em]">Corner Travel Style</p>
                  <p className="mt-2 text-sm">
                    採用 Corner 旅遊的海洋天空配色，營造清新且專業的品牌體驗。
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {/* 左側：輸入表單 */}
              <div className="flex min-h-[720px] flex-col overflow-hidden rounded-[32px] border border-white/60 bg-white/90 shadow-2xl shadow-[#9ad6ff]/25 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/50 px-8 py-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-morandi-muted">
                      Itinerary designer
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-morandi-primary">
                      行程編輯表單
                    </h2>
                  </div>
                  <div className="hidden items-center gap-2 text-sm text-morandi-secondary xl:flex">
                    <IconSparkles size={18} stroke={1.6} />
                    即時儲存預覽
                  </div>
                </div>
                <div className="scrollable-content flex-1 overflow-y-auto px-6 py-6">
                  <TourForm data={itineraryData as any} onChange={setItineraryData} />
                </div>
              </div>

              {/* 右側：即時預覽 */}
              <div className="relative flex min-h-[720px] flex-col overflow-hidden rounded-[32px] border border-white/40 bg-gradient-to-br from-white/85 via-[#f0f9ff]/80 to-[#dff3ff]/90 shadow-2xl shadow-[#9ad6ff]/25 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/50 px-8 py-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-morandi-muted">
                      Live preview
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-morandi-primary">即時預覽</h2>
                    <p className="mt-1 text-sm text-morandi-secondary">
                      切換裝置尺寸，檢視行程於不同介面的呈現。
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-white/70 p-1 shadow-inner shadow-white/60">
                    <button
                      onClick={() => setViewMode('desktop')}
                      className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        viewMode === 'desktop'
                          ? 'bg-[#0f6eea] text-white shadow-lg shadow-[#0f6eea]/30'
                          : 'text-morandi-secondary hover:text-morandi-primary hover:bg-white/80'
                      }`}
                    >
                      <IconDeviceDesktop size={18} stroke={1.6} />
                      桌機
                    </button>
                    <button
                      onClick={() => setViewMode('mobile')}
                      className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        viewMode === 'mobile'
                          ? 'bg-[#0f6eea] text-white shadow-lg shadow-[#0f6eea]/30'
                          : 'text-morandi-secondary hover:text-morandi-primary hover:bg-white/80'
                      }`}
                    >
                      <IconDeviceMobile size={18} stroke={1.6} />
                      手機
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden px-6 pb-8 pt-6" ref={containerRef}>
                  <div className="flex h-full w-full items-center justify-center">
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
                          <div className="rounded-[46px] bg-[#0f172a] p-4 shadow-[0_30px_80px_rgba(15,110,234,0.25)]">
                            <div className="rounded-[36px] bg-[#0b1120] p-3">
                              <div
                                className="relative overflow-hidden rounded-[28px] bg-white"
                                style={{ width: '375px', height: '812px' }}
                              >
                                {/* iPhone 動態島 */}
                                <div className="pointer-events-none absolute left-1/2 top-0 z-50 -translate-x-1/2">
                                  <div className="mt-2 h-[30px] w-[120px] rounded-full bg-[#0b1120]" />
                                </div>

                                <div className="h-full w-full overflow-y-auto">
                                  <TourPreview data={processedData} viewMode="mobile" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // 電腦版
                        <div
                          className="overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_40px_120px_rgba(15,110,234,0.18)]"
                          style={{
                            width: '1200px',
                            height: '800px',
                          }}
                        >
                          <div className="h-full w-full overflow-y-auto">
                            <TourPreview data={processedData} viewMode="desktop" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 transform rounded-full bg-white/80 px-5 py-2 text-xs font-medium text-morandi-secondary shadow-lg shadow-[#9ad6ff]/25 sm:flex">
                  即時預覽將同步顯示最新內容，建議在發佈前於桌機與手機雙重檢視。
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
