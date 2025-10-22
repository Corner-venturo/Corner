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
  const [itineraryData, setItineraryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 載入行程資料
  useEffect(() => {
    const loadItinerary = async () => {
      try {
        const itinerary = await fetchById(slug);
        if (itinerary) {
          setItineraryData(itinerary);
        } else {
          alert('找不到此行程');
          router.push('/itinerary');
        }
      } catch (error) {
        console.error('載入行程失敗:', error);
        alert('載入行程失敗');
        router.push('/itinerary');
      } finally {
        setLoading(false);
      }
    };

    loadItinerary();
  }, [slug, fetchById, router]);

  // Convert icon strings to components for preview
  const processedData = itineraryData ? {
    ...itineraryData,
    features: itineraryData.features?.map((f: any) => ({
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
  if (loading || !itineraryData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-morandi-secondary">載入中...</p>
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
