"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ResponsiveHeader } from "@/components/layout/responsive-header";
import { TourForm } from "@/components/editor/TourForm";
import { TourPreview } from "@/components/editor/TourPreview";
import { PublishButton } from "@/components/editor/PublishButton";
import { useItineraryStore } from "@/stores";
import {
  IconBuilding,
  IconToolsKitchen2,
  IconSparkles,
  IconCalendar,
  IconPlane,
  IconMapPin,
} from "@tabler/icons-react";

// Icon mapping
const iconMap: any = {
  IconBuilding,
  IconToolsKitchen2,
  IconSparkles,
  IconCalendar,
  IconPlane,
  IconMapPin,
};

export default function EditItineraryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { fetchById } = useItineraryStore();

  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [itineraryData, setItineraryData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // 載入行程資料或從旅遊團建立
  useEffect(() => {
    const loadOrCreateItinerary = async () => {
      try {
        // 1. 先嘗試載入行程
        const itinerary = await fetchById(slug);
        if (itinerary) {
          setItineraryData(itinerary);
          setLoading(false);
          return;
        }

        // 2. 找不到行程，嘗試從旅遊團載入
        const { useTourStore } = await import('@/stores');
        const tour = useTourStore.getState().items.find(t => t.id === slug);

        if (tour) {
          // 從旅遊團建立行程資料
          const { useRegionStoreNew } = await import('@/stores');
          const { countries, cities } = useRegionStoreNew.getState();

          // 找到國家和城市名稱
          const country = tour.country_id ? countries.find(c => c.id === tour.country_id) : null;
          const city = tour.main_city_id ? cities.find(c => c.id === tour.main_city_id) : null;

          // 計算天數
          const departureDate = new Date(tour.departure_date);
          const returnDate = new Date(tour.return_date);
          const days = Math.ceil((returnDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

          // 建立預設行程資料
          const newItinerary = {
            id: slug,
            tour_id: slug,
            tagline: "Corner Travel 2025",
            title: tour.name,
            subtitle: "精緻旅遊",
            description: tour.description || "",
            departureDate: departureDate.toLocaleDateString('zh-TW'),
            tourCode: tour.code,
            coverImage: city?.background_image_url || "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=1200&q=75&auto=format&fit=crop",
            country: country?.name || tour.location || "",
            city: city?.name || tour.location || "",
            status: "草稿",
            outboundFlight: {
              airline: "",
              flightNumber: "",
              departureAirport: "TPE",
              departureTime: "",
              departureDate: departureDate.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }),
              arrivalAirport: city?.airport_code || "",
              arrivalTime: "",
              duration: "",
            },
            returnFlight: {
              airline: "",
              flightNumber: "",
              departureAirport: city?.airport_code || "",
              departureTime: "",
              departureDate: returnDate.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }),
              arrivalAirport: "TPE",
              arrivalTime: "",
              duration: "",
            },
            features: [],
            focusCards: [],
            leader: {
              name: "",
              domesticPhone: "",
              overseasPhone: "",
            },
            meetingInfo: {
              time: "",
              location: "",
            },
            itinerarySubtitle: `${days}天${days - 1}夜精彩旅程規劃`,
            dailyItinerary: Array.from({ length: days }, (_, i) => ({
              dayLabel: `Day ${i + 1}`,
              date: new Date(departureDate.getTime() + i * 24 * 60 * 60 * 1000).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }),
              title: i === 0 ? `台北 ✈ ${city?.name || tour.location}` :
                     i === days - 1 ? `${city?.name || tour.location} ✈ 台北` :
                     `${city?.name || tour.location} 自由活動`,
              highlight: "",
              description: "",
              activities: [],
              recommendations: [],
              meals: {
                breakfast: i === 0 ? "溫暖的家" : "飯店內早餐",
                lunch: "敬請自理",
                dinner: i === days - 1 ? "溫暖的家" : "敬請自理",
              },
              accommodation: i === days - 1 ? "" : "待安排",
            })),
          };

          setItineraryData(newItinerary);
          setLoading(false);
          return;
        }

        // 3. 都找不到，顯示錯誤
        setNotFound(true);
        setLoading(false);
      } catch (error) {
        console.error('載入或建立行程失敗:', error);
        setNotFound(true);
        setLoading(false);
      }
    };

    loadOrCreateItinerary();
  }, [slug, fetchById, router]);

  // Convert icon strings to components for preview
  const processedData = itineraryData ? {
    ...itineraryData,
    features: itineraryData.features?.map((f) => ({
      ...f,
      iconComponent: iconMap[f.icon] || IconSparkles,
    })) || [],
  } : null;

  // 計算縮放比例
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // 目標尺寸
      const targetWidth = viewMode === 'mobile' ? 400 : 1200; // 手機含框架
      const targetHeight = viewMode === 'mobile' ? 850 : 800;

      // 計算縮放比例（寬高都要考慮）
      const scaleX = containerWidth / targetWidth;
      const scaleY = containerHeight / targetHeight;

      // 取較小值確保完全顯示
      const finalScale = Math.min(scaleX, scaleY, 1);

      setScale(finalScale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [viewMode]);

  // 載入中狀態
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-morandi-secondary">載入中...</p>
        </div>
      </div>
    );
  }

  // 找不到行程
  if (notFound || !itineraryData) {
    return (
      <div className="h-full flex flex-col">
        <ResponsiveHeader
          title="行程不存在"
          breadcrumb={[
            { label: '首頁', href: '/' },
            { label: '行程管理', href: '/itinerary' },
            { label: '錯誤', href: '#' }
          ]}
          showBackButton={true}
          onBack={() => router.push('/itinerary')}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-2xl font-bold text-morandi-primary mb-2">找不到此行程</h2>
            <p className="text-morandi-secondary mb-6">
              行程可能已被刪除，或是您輸入的網址不正確。
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/itinerary')}
                className="px-6 py-2 border border-border rounded-lg hover:bg-morandi-container/20 transition-colors"
              >
                返回列表
              </button>
              <button
                onClick={() => router.push('/itinerary/new')}
                className="px-6 py-2 bg-morandi-gold text-white rounded-lg hover:bg-morandi-gold-hover transition-colors"
              >
                建立新行程
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* ========== 頁面頂部區域 ========== */}
      <ResponsiveHeader
        title="編輯行程"
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '行程管理', href: '/itinerary' },
          { label: '編輯行程', href: '#' }
        ]}
        showBackButton={true}
        onBack={() => router.push('/itinerary')}
        actions={<PublishButton data={itineraryData} />}
      />

      {/* ========== 主要內容區域 ========== */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* 左側：輸入表單 */}
          <div className="w-1/2 bg-white border-r border-border flex flex-col">
            <div className="h-14 bg-morandi-gold text-white px-6 flex items-center border-b border-border">
              <h2 className="text-lg font-semibold">編輯表單</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <TourForm data={itineraryData} onChange={setItineraryData} />
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
                    transformOrigin: 'center center'
                  }}
                >
                  {viewMode === 'mobile' ? (
                    // 手機框架和內容
                    <div className="relative">
                      <div className="bg-black rounded-[40px] p-2 shadow-2xl">
                        <div className="bg-black rounded-[32px] p-2">
                          <div
                            className="bg-white rounded-[28px] overflow-hidden relative"
                            style={{ width: '375px', height: '812px' }}
                          >
                            {/* iPhone 動態島 */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50">
                              <div className="bg-black rounded-full w-[120px] h-[30px] mt-2" />
                            </div>

                            <div className="w-full h-full overflow-y-auto">
                              <TourPreview data={processedData} viewMode="mobile" />
                            </div>
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
                        height: '800px'
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
  );
}
