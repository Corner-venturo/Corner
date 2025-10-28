"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ResponsiveHeader } from "@/components/layout/responsive-header";
import { TourForm } from "@/components/editor/TourForm";
import { TourPreview } from "@/components/editor/TourPreview";
import { PublishButton } from "@/components/editor/PublishButton";
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

export default function NewItineraryPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const mobileContentRef = useRef<HTMLDivElement>(null);
  const [tourData, setTourData] = useState({
    // 封面資訊
    tagline: "Corner Travel 2025",
    title: "漫遊福岡",
    subtitle: "半自由行",
    description: "2日市區自由活動 · 保證入住溫泉飯店 · 柳川遊船 · 阿蘇火山",
    departureDate: "2025/10/21",
    tourCode: "25JFO21CIG",
    coverImage: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=1200&q=75&auto=format&fit=crop",
    country: "日本",
    city: "福岡",
    status: "草稿",

    // 航班資訊
    outboundFlight: {
      airline: "中華航空",
      flightNumber: "CI110",
      departureAirport: "TPE",
      departureTime: "06:50",
      departureDate: "10/21",
      arrivalAirport: "FUK",
      arrivalTime: "09:55",
      duration: "2小時5分",
    },
    returnFlight: {
      airline: "中華航空",
      flightNumber: "CI111",
      departureAirport: "FUK",
      departureTime: "11:00",
      departureDate: "10/25",
      arrivalAirport: "TPE",
      arrivalTime: "12:30",
      duration: "2小時30分",
    },

    // 行程特色
    features: [
      {
        icon: "IconBuilding",
        title: "溫泉飯店體驗",
        description: "保證入住阿蘇溫泉飯店，享受日式溫泉文化",
      },
      {
        icon: "IconToolsKitchen2",
        title: "美食饗宴",
        description: "博多拉麵、柳川鰻魚飯、長腳蟹自助餐",
      },
      {
        icon: "IconSparkles",
        title: "精選體驗",
        description: "柳川遊船、阿蘇火山、太宰府天滿宮",
      },
      {
        icon: "IconCalendar",
        title: "自由活動時間",
        description: "2日福岡市區自由探索，彈性安排個人行程",
      },
      {
        icon: "IconPlane",
        title: "直飛航班",
        description: "中華航空桃園直飛福岡，省時便利",
      },
      {
        icon: "IconMapPin",
        title: "專業領隊",
        description: "經驗豐富的領隊全程陪同，貼心服務",
      },
    ],

    // 精選景點
    focusCards: [
      {
        title: "由布院溫泉街",
        src: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&q=75&auto=format",
      },
      {
        title: "阿蘇火山口",
        src: "https://images.unsplash.com/photo-1578469550956-0e16b69c6a3d?w=400&q=75&auto=format",
      },
      {
        title: "柳川水鄉",
        src: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=75&auto=format",
      },
      {
        title: "太宰府神社",
        src: "https://images.unsplash.com/photo-1624253321033-c4eb104e7462?w=400&q=75&auto=format",
      },
    ],

    // 領隊資訊
    leader: {
      name: "鍾惠如 小姐",
      domesticPhone: "+886 0928402897",
      overseasPhone: "+81 08074371189",
    },

    // 集合資訊
    meetingInfo: {
      time: "2025/10/21 04:50",
      location: "桃園機場華航第二航廈 7號櫃台",
    },

    // 行程副標題
    itinerarySubtitle: "5天4夜精彩旅程規劃",

    // 逐日行程
    dailyItinerary: [
      {
        dayLabel: "Day 1",
        date: "10/21 (二)",
        title: "台北 ✈ 福岡空港 → 由布院 · 金麟湖 → 阿蘇溫泉",
        highlight: "✨ 特別安排：由布院 · 金麟湖 ～ 日本 OL 人氣 NO.1 散策地",
        description: "集合於台灣桃園國際機場，由專人辦理出境手續，搭乘豪華客機，飛往日本九州玄關──福岡。",
        images: [
          "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80",
          "https://images.unsplash.com/photo-1526481280695-3c46997ceda7?auto=format&fit=crop&w=1600&q=80",
        ],
        activities: [],
        recommendations: [],
        meals: {
          breakfast: "溫暖的家",
          lunch: "博多拉麵 (¥1000)",
          dinner: "長腳蟹自助餐",
        },
        accommodation: "ASO RESORT GRANDVRIO HOTEL",
      },
      {
        dayLabel: "Day 2",
        date: "10/22 (三)",
        title: "阿蘇火山 → 柳川遊船 → 旅人列車 → 太宰府天滿宮",
        highlight: "",
        description: "",
        images: [
          "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1600&q=80",
          "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80",
          "https://images.unsplash.com/photo-1549692520-acc6669e2f0c?auto=format&fit=crop&w=1600&q=80",
        ],
        activities: [
          {
            icon: "🌋",
            title: "阿蘇火山",
            description: "近距離觀賞活火山壯麗景觀",
            image: "https://images.unsplash.com/photo-1523419409543-0c1df022bddb?auto=format&fit=crop&w=1200&q=80",
          },
          {
            icon: "🚣",
            title: "柳川遊船",
            description: "乘船遊覽水鄉風情",
            image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
          },
          {
            icon: "🚃",
            title: "旅人列車",
            description: "體驗日式風情列車",
            image: "https://images.unsplash.com/photo-1526481280695-3c46997ceda7?auto=format&fit=crop&w=1200&q=80",
          },
          {
            icon: "⛩️",
            title: "太宰府天滿宮",
            description: "參拜學問之神",
            image: "https://images.unsplash.com/photo-1549692520-acc6669e2f0c?auto=format&fit=crop&w=1200&q=80",
          },
        ],
        recommendations: [],
        meals: {
          breakfast: "飯店內早餐",
          lunch: "柳川鰻魚飯 (¥2400)",
          dinner: "涮涮鍋吃到飽",
        },
        accommodation: "QUINTESSA HOTEL FUKUOKA TENJIN MINAMI",
      },
      {
        dayLabel: "Day 3-4",
        date: "10/23-10/24",
        title: "福岡全日自由活動",
        highlight: "",
        description: "",
        images: [
          "https://images.unsplash.com/photo-1526481280695-3c46997ceda7?auto=format&fit=crop&w=1600&q=80",
          "https://images.unsplash.com/photo-1549692520-acc6669e2f0c?auto=format&fit=crop&w=1600&q=80",
        ],
        activities: [],
        recommendations: [
          "天神商圈購物",
          "福岡塔",
          "雅虎巨蛋",
          "鳥栖 PREMIUM OUTLET",
          "門司港懷舊街道",
        ],
        meals: {
          breakfast: "飯店內早餐",
          lunch: "敬請自理",
          dinner: "敬請自理",
        },
        accommodation: "QUINTESSA HOTEL FUKUOKA TENJIN MINAMI",
      },
      {
        dayLabel: "Day 5",
        date: "10/25 (六)",
        title: "福岡空港 ✈ 台北",
        highlight: "",
        description: "享受一個沒有 MORNING CALL 的早晨，悠閒的飯店用完早餐後，接著前往福岡空港，搭乘豪華客機返回台北，結束了愉快的九州之旅。",
        images: [
          "https://images.unsplash.com/photo-1502920514313-52581002a659?auto=format&fit=crop&w=1600&q=80",
        ],
        activities: [],
        recommendations: [],
        meals: {
          breakfast: "飯店內早餐",
          lunch: "機上餐食",
          dinner: "溫暖的家",
        },
        accommodation: "",
      },
    ],
  });

  // Convert icon strings to components for preview
  const processedData = {
    ...tourData,
    features: tourData.features.map((f) => ({
      ...f,
      iconComponent: iconMap[f.icon] || IconSparkles,
    })),
  };

  // 計算縮放比例
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // 調整目標尺寸（含手機框架）
      const targetWidth = viewMode === 'mobile' ? 410 : 1200;  // 390 + 邊框
      const targetHeight = viewMode === 'mobile' ? 880 : 800;  // 844 + 邊框

      // 計算縮放，留一些邊距
      const scaleX = (containerWidth - 40) / targetWidth;
      const scaleY = (containerHeight - 40) / targetHeight;

      const finalScale = Math.min(scaleX, scaleY, 0.9); // 最大 0.9 避免太大

      setScale(finalScale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [viewMode]);

  // 切換到手機模式時，滾動到標題區域
  useEffect(() => {
    if (viewMode === 'mobile' && mobileContentRef.current) {
      // 延遲執行確保內容已渲染
      setTimeout(() => {
        if (mobileContentRef.current) {
          // 滾動到讓「探索」按鈕剛好在底部可見
          const heroHeight = window.innerHeight * 0.7; // 預估 hero 區域高度
          mobileContentRef.current.scrollTop = heroHeight - 400;
        }
      }, 100);
    }
  }, [viewMode]);

  return (
    <div className="h-full flex flex-col">
      {/* ========== 頁面頂部區域 ========== */}
      <ResponsiveHeader
        title="新增行程"
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '行程管理', href: '/itinerary' },
          { label: '新增行程', href: '#' }
        ]}
        showBackButton={true}
        onBack={() => router.push('/itinerary')}
        actions={<PublishButton data={tourData} />}
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
              <TourForm data={tourData} onChange={setTourData} />
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
                      {/* iPhone 14 Pro 尺寸 */}
                      <div className="bg-black rounded-[45px] p-[8px] shadow-2xl">
                        {/* 頂部凹槽 (Dynamic Island) */}
                        <div className="absolute top-[20px] left-1/2 -translate-x-1/2 z-10">
                          <div className="bg-black w-[120px] h-[34px] rounded-full"></div>
                        </div>

                        {/* 螢幕 */}
                        <div
                          className="bg-black rounded-[37px] overflow-hidden relative"
                          style={{
                            width: '390px',
                            height: '844px'
                          }}
                        >
                          {/* 狀態列安全區 */}
                          <div className="absolute top-0 left-0 right-0 h-[50px] bg-transparent z-10"></div>

                          {/* 內容區域 */}
                          <div
                            className="w-full h-full overflow-y-auto"
                            ref={mobileContentRef}
                            style={{
                              scrollBehavior: 'smooth'
                            }}
                          >
                            <TourPreview data={processedData} viewMode="mobile" />
                          </div>

                          {/* 底部指示條 */}
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
                            <div className="w-32 h-1 bg-black/30 rounded-full"></div>
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
