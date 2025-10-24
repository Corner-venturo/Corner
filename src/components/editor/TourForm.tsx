"use client";

import React from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useRegionStore } from "@/stores";
import {
  IconBuilding,
  IconToolsKitchen2,
  IconSparkles,
  IconCalendar,
  IconPlane,
  IconMapPin,
} from "@tabler/icons-react";

const iconOptions = [
  { value: "IconBuilding", label: "🏨 建築/飯店", component: IconBuilding },
  { value: "IconToolsKitchen2", label: "🍽️ 餐食", component: IconToolsKitchen2 },
  { value: "IconSparkles", label: "✨ 特色", component: IconSparkles },
  { value: "IconCalendar", label: "📅 行程", component: IconCalendar },
  { value: "IconPlane", label: "✈️ 航班", component: IconPlane },
  { value: "IconMapPin", label: "📍 景點", component: IconMapPin },
];

// 城市圖片對照表（擴充版）
const cityImages: Record<string, string> = {
  // 日本
  "東京": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=75&auto=format&fit=crop",
  "京都": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=75&auto=format&fit=crop",
  "大阪": "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=1200&q=75&auto=format&fit=crop",
  "札幌": "https://images.unsplash.com/photo-1560932124-d6095cd5d5d7?w=1200&q=75&auto=format&fit=crop",
  "沖繩": "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=75&auto=format&fit=crop",
  "名古屋": "https://images.unsplash.com/photo-1583499976516-20fdb6a0d463?w=1200&q=75&auto=format&fit=crop",
  "福岡": "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&q=75&auto=format&fit=crop",
  "廣島": "https://images.unsplash.com/photo-1578469550956-0e16b69c6a3d?w=1200&q=75&auto=format&fit=crop",

  // 中國大陸
  "北京": "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1200&q=75&auto=format&fit=crop",
  "上海": "https://images.unsplash.com/photo-1545893835-abaa50cbe628?w=1200&q=75&auto=format&fit=crop",
  "廣州": "https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=1200&q=75&auto=format&fit=crop",
  "深圳": "https://images.unsplash.com/photo-1548919973-5cef591cdbc9?w=1200&q=75&auto=format&fit=crop",
  "廈門": "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=1200&q=75&auto=format&fit=crop",
  "杭州": "https://images.unsplash.com/photo-1581481615985-ba4775734a9b?w=1200&q=75&auto=format&fit=crop",
  "南京": "https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?w=1200&q=75&auto=format&fit=crop",
  "成都": "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=1200&q=75&auto=format&fit=crop",

  // 泰國
  "曼谷": "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&q=75&auto=format&fit=crop",
  "清邁": "https://images.unsplash.com/photo-1563492065213-4c4bb194eefc?w=1200&q=75&auto=format&fit=crop",
  "普吉": "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200&q=75&auto=format&fit=crop",
  "蘇美島": "https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=1200&q=75&auto=format&fit=crop",
  "甲米": "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1200&q=75&auto=format&fit=crop",
  "烏隆": "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=1200&q=75&auto=format&fit=crop",

  // 越南
  "河內": "https://images.unsplash.com/photo-1509030458710-f24f3682df0d?w=1200&q=75&auto=format&fit=crop",
  "胡志明": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&q=75&auto=format&fit=crop",
  "峴港": "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&q=75&auto=format&fit=crop",
  "富國島": "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=75&auto=format&fit=crop",
  "順化": "https://images.unsplash.com/photo-1555881675-d8d8d7b1c157?w=1200&q=75&auto=format&fit=crop",
  "大叻": "https://images.unsplash.com/photo-1578469550956-0e16b69c6a3d?w=1200&q=75&auto=format&fit=crop",

  // 韓國
  "首爾": "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=1200&q=75&auto=format&fit=crop",
  "釜山": "https://images.unsplash.com/photo-1541996861-12e48df50bf5?w=1200&q=75&auto=format&fit=crop",
  "濟州": "https://images.unsplash.com/photo-1598973621853-f9a8a6e9a592?w=1200&q=75&auto=format&fit=crop",
  "仁川": "https://images.unsplash.com/photo-1585124804253-3e34e05c9120?w=1200&q=75&auto=format&fit=crop",
  "大邱": "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=1200&q=75&auto=format&fit=crop",

  // 馬來西亞
  "吉隆坡": "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200&q=75&auto=format&fit=crop",
  "檳城": "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=75&auto=format&fit=crop",
  "新山": "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1200&q=75&auto=format&fit=crop",
  "古晉": "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=1200&q=75&auto=format&fit=crop",
  "蘭卡威": "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200&q=75&auto=format&fit=crop",
  "沙巴": "https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=1200&q=75&auto=format&fit=crop",

  // 新加坡
  "新加坡": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&q=75&auto=format&fit=crop",

  // 印尼
  "雅加達": "https://images.unsplash.com/photo-1555333145-4acf190da336?w=1200&q=75&auto=format&fit=crop",
  "峇里島": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=75&auto=format&fit=crop",
  "日惹": "https://images.unsplash.com/photo-1558007652-8e8f7238e978?w=1200&q=75&auto=format&fit=crop",
  "梭羅": "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1200&q=75&auto=format&fit=crop",

  // 菲律賓
  "馬尼拉": "https://images.unsplash.com/photo-1542704792-e30daa0f905e?w=1200&q=75&auto=format&fit=crop",
  "宿霧": "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=75&auto=format&fit=crop",
  "達沃": "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1200&q=75&auto=format&fit=crop",
  "怡朗": "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200&q=75&auto=format&fit=crop",

  // 美國
  "洛杉磯": "https://images.unsplash.com/photo-1534190239940-9ba8944ea261?w=1200&q=75&auto=format&fit=crop",
  "紐約": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=75&auto=format&fit=crop",
  "拉斯維加斯": "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=1200&q=75&auto=format&fit=crop",
  "舊金山": "https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?w=1200&q=75&auto=format&fit=crop",
  "西雅圖": "https://images.unsplash.com/photo-1555883006-0f5a0915a80f?w=1200&q=75&auto=format&fit=crop",
  "芝加哥": "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&q=75&auto=format&fit=crop",

  // 加拿大
  "溫哥華": "https://images.unsplash.com/photo-1559511260-66a654ae982a?w=1200&q=75&auto=format&fit=crop",
  "多倫多": "https://images.unsplash.com/photo-1517935706615-2717063c2225?w=1200&q=75&auto=format&fit=crop",
  "蒙特婁": "https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=1200&q=75&auto=format&fit=crop",
  "卡加利": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1200&q=75&auto=format&fit=crop",

  // 澳洲
  "雪梨": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&q=75&auto=format&fit=crop",
  "墨爾本": "https://images.unsplash.com/photo-1514395462725-fb4566210144?w=1200&q=75&auto=format&fit=crop",
  "布里斯本": "https://images.unsplash.com/photo-1524168272322-bf73616d9cb5?w=1200&q=75&auto=format&fit=crop",
  "伯斯": "https://images.unsplash.com/photo-1591695287818-5f5d1e0bf9d3?w=1200&q=75&auto=format&fit=crop",
  "阿德萊德": "https://images.unsplash.com/photo-1585779034823-7e9ac8faec70?w=1200&q=75&auto=format&fit=crop",

  // 紐西蘭
  "奧克蘭": "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=1200&q=75&auto=format&fit=crop",
  "基督城": "https://images.unsplash.com/photo-1568454537842-d933259bb258?w=1200&q=75&auto=format&fit=crop",
  "威靈頓": "https://images.unsplash.com/photo-1589690810328-8bc609bb749c?w=1200&q=75&auto=format&fit=crop",
  "皇后鎮": "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=1200&q=75&auto=format&fit=crop",

  // 歐洲
  "倫敦": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=75&auto=format&fit=crop",
  "巴黎": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=75&auto=format&fit=crop",
  "羅馬": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=75&auto=format&fit=crop",
  "巴塞隆納": "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&q=75&auto=format&fit=crop",
  "柏林": "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=1200&q=75&auto=format&fit=crop",
  "阿姆斯特丹": "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=1200&q=75&auto=format&fit=crop",
  "蘇黎世": "https://images.unsplash.com/photo-1565530844911-ec9e0d0cd81b?w=1200&q=75&auto=format&fit=crop",
  "維也納": "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1200&q=75&auto=format&fit=crop",

  // 土耳其
  "伊斯坦堡": "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200&q=75&auto=format&fit=crop",
  "安塔利亞": "https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=1200&q=75&auto=format&fit=crop",
  "安卡拉": "https://images.unsplash.com/photo-1611415008993-8a88f0d67e67?w=1200&q=75&auto=format&fit=crop",
};

// 時差對照表（相對於台灣 UTC+8）
const timezoneOffset: Record<string, number> = {
  "中國大陸": 0,  // UTC+8 (與台灣相同)
  "日本": 1,      // UTC+9
  "韓國": 1,      // UTC+9
  "泰國": -1,     // UTC+7
  "越南": -1,     // UTC+7
  "馬來西亞": 0,  // UTC+8
  "新加坡": 0,    // UTC+8
  "印尼": 0,      // UTC+8 (雅加達)
  "菲律賓": 0,    // UTC+8
  "美國": -16,    // UTC-8 (洛杉磯) - 注意：美國跨多個時區
  "加拿大": -16,  // UTC-8 (溫哥華) - 注意：加拿大跨多個時區
  "澳洲": 2,      // UTC+10 (雪梨) - 注意：澳洲跨多個時區
  "紐西蘭": 4,    // UTC+12
  "歐洲": -7,     // UTC+1 (倫敦) - 注意：歐洲跨多個時區
  "土耳其": -5,   // UTC+3
};

// 計算飛行時間
function calculateFlightDuration(
  departureTime: string,  // 格式: "06:50"
  arrivalTime: string,    // 格式: "09:55" (當地時間)
  timeDiff: number        // 時差（小時）
): string {
  if (!departureTime || !arrivalTime) return "";

  const [depH, depM] = departureTime.split(":").map(Number);
  const [arrH, arrM] = arrivalTime.split(":").map(Number);

  const depMinutes = depH * 60 + depM;
  const arrMinutes = arrH * 60 + arrM - (timeDiff * 60); // 轉換為台灣時間

  let duration = arrMinutes - depMinutes;
  if (duration < 0) duration += 24 * 60; // 跨日

  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  return `${hours}小時${minutes}分`;
}

export function TourForm({ data, onChange }: { data: unknown; onChange: (data) => void }) {
  const [selectedCountry, setSelectedCountry] = React.useState<string>(data.country || "");
  const [selectedCountryCode, setSelectedCountryCode] = React.useState<string>("");
  const { user } = useAuthStore();
  const { items: regions, fetchAll } = useRegionStore();

  // 懶載入：進入表單時載入 regions
  React.useEffect(() => {
    if (regions.length === 0) {
      fetchAll();
    }
  }, [regions.length, fetchAll]);

  // 從 regions 取得所有國家列表
  const allDestinations = React.useMemo(() => {
    return regions
      .filter(r => r.type === 'country' && r.status === 'active' && !r._deleted)
      .map(r => ({ code: r.code, name: r.name }));
  }, [regions]);

  // 建立國家名稱到代碼的對照
  const countryNameToCode = React.useMemo(() => {
    const map: Record<string, string> = {};
    allDestinations.forEach(dest => {
      map[dest.name] = dest.code;
    });
    return map;
  }, [allDestinations]);

  // 根據選中的國家代碼取得城市列表
  const availableCities = React.useMemo(() => {
    if (!selectedCountryCode) return [];
    return regions
      .filter(r => r.type === 'city' && r.country_code === selectedCountryCode && r.status === 'active' && !r._deleted)
      .map(r => ({ code: r.code, name: r.name }));
  }, [selectedCountryCode, regions]);

  // 只在 data.country 從外部改變時同步（不要包含 selectedCountry 依賴！）
  React.useEffect(() => {
    if (data.country && data.country !== selectedCountry) {
      setSelectedCountry(data.country);
      // 同時更新 country code
      const code = countryNameToCode[data.country];
      if (code) {
        setSelectedCountryCode(code);
      }
    }
  }, [data.country, countryNameToCode, selectedCountry]);

  const updateField = (field: string, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  // 更新城市時自動設定封面圖片
  const updateCity = (city: string) => {
    onChange({
      ...data,
      city,
      coverImage: cityImages[city] || data.coverImage
    });
  };

  const updateNestedField = (parent: string, field: string, value: unknown) => {
    onChange({
      ...data,
      [parent]: { ...data[parent], [field]: value }
    });
  };

  // 航班資訊更新（自動計算飛行時間）
  const updateFlightField = (flightType: 'outboundFlight' | 'returnFlight', field: string, value: string) => {
    const updatedFlight = { ...data[flightType], [field]: value };

    // 自動計算飛行時間
    const timeDiff = timezoneOffset[selectedCountry] || 0;
    if (field === 'departureTime' || field === 'arrivalTime') {
      const depTime = field === 'departureTime' ? value : updatedFlight.departureTime;
      const arrTime = field === 'arrivalTime' ? value : updatedFlight.arrivalTime;
      updatedFlight.duration = calculateFlightDuration(depTime, arrTime, timeDiff);
    }

    onChange({
      ...data,
      [flightType]: updatedFlight
    });
  };

  // 特色管理
  const addFeature = () => {
    onChange({
      ...data,
      features: [...(data.features || []), { icon: "IconSparkles", title: "", description: "" }]
    });
  };

  const updateFeature = (index: number, field: string, value: string) => {
    const newFeatures = [...data.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    onChange({ ...data, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    const newFeatures = data.features.filter((_: any, i: number) => i !== index);
    onChange({ ...data, features: newFeatures });
  };

  // 景點管理
  const addFocusCard = () => {
    onChange({
      ...data,
      focusCards: [...(data.focusCards || []), { title: "", src: "" }]
    });
  };

  const updateFocusCard = (index: number, field: string, value: string) => {
    const newCards = [...data.focusCards];
    newCards[index] = { ...newCards[index], [field]: value };
    onChange({ ...data, focusCards: newCards });
  };

  const removeFocusCard = (index: number) => {
    const newCards = data.focusCards.filter((_: any, i: number) => i !== index);
    onChange({ ...data, focusCards: newCards });
  };

  // 逐日行程管理
  const addDailyItinerary = () => {
    onChange({
      ...data,
      dailyItinerary: [...(data.dailyItinerary || []), {
        dayLabel: `Day ${(data.dailyItinerary?.length || 0) + 1}`,
        date: "",
        title: "",
        highlight: "",
        description: "",
        activities: [],
        recommendations: [],
        meals: { breakfast: "", lunch: "", dinner: "" },
        accommodation: ""
      }]
    });
  };

  const updateDailyItinerary = (index: number, field: string, value: unknown) => {
    const newItinerary = [...data.dailyItinerary];
    newItinerary[index] = { ...newItinerary[index], [field]: value };
    onChange({ ...data, dailyItinerary: newItinerary });
  };

  const removeDailyItinerary = (index: number) => {
    const newItinerary = data.dailyItinerary
      .filter((_: any, i: number) => i !== index)
      .map((day: any, i: number) => ({
        ...day,
        dayLabel: `Day ${i + 1}` // 自動更新 dayLabel
      }));
    onChange({ ...data, dailyItinerary: newItinerary });
  };

  // 活動管理
  const addActivity = (dayIndex: number) => {
    const newItinerary = [...data.dailyItinerary];
    newItinerary[dayIndex].activities = [
      ...(newItinerary[dayIndex].activities || []),
      { icon: "🌋", title: "", description: "" }
    ];
    onChange({ ...data, dailyItinerary: newItinerary });
  };

  const updateActivity = (dayIndex: number, actIndex: number, field: string, value: string) => {
    const newItinerary = [...data.dailyItinerary];
    newItinerary[dayIndex].activities[actIndex] = {
      ...newItinerary[dayIndex].activities[actIndex],
      [field]: value
    };
    onChange({ ...data, dailyItinerary: newItinerary });
  };

  const removeActivity = (dayIndex: number, actIndex: number) => {
    const newItinerary = [...data.dailyItinerary];
    newItinerary[dayIndex].activities = newItinerary[dayIndex].activities.filter(
      (_: any, i: number) => i !== actIndex
    );
    onChange({ ...data, dailyItinerary: newItinerary });
  };

  // 推薦行程管理
  const addRecommendation = (dayIndex: number) => {
    const newItinerary = [...data.dailyItinerary];
    newItinerary[dayIndex].recommendations = [
      ...(newItinerary[dayIndex].recommendations || []),
      ""
    ];
    onChange({ ...data, dailyItinerary: newItinerary });
  };

  const updateRecommendation = (dayIndex: number, recIndex: number, value: string) => {
    const newItinerary = [...data.dailyItinerary];
    newItinerary[dayIndex].recommendations[recIndex] = value;
    onChange({ ...data, dailyItinerary: newItinerary });
  };

  const removeRecommendation = (dayIndex: number, recIndex: number) => {
    const newItinerary = [...data.dailyItinerary];
    newItinerary[dayIndex].recommendations = newItinerary[dayIndex].recommendations.filter(
      (_: any, i: number) => i !== recIndex
    );
    onChange({ ...data, dailyItinerary: newItinerary });
  };

  return (
    <div className="p-6 space-y-8">
      {/* 封面資訊 */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800 border-b-2 border-amber-500 pb-2">📸 封面設定</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">標籤文字</label>
          <input
            type="text"
            value={data.tagline || ""}
            onChange={(e) => updateField("tagline", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
            placeholder="Venturo Travel 2025 秋季精選"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">主標題</label>
            <input
              type="text"
              value={data.title || ""}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
              placeholder="漫遊福岡"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">副標題</label>
            <input
              type="text"
              value={data.subtitle || ""}
              onChange={(e) => updateField("subtitle", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
              placeholder="半自由行"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
          <input
            type="text"
            value={data.description || ""}
            onChange={(e) => updateField("description", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
            placeholder="2日市區自由活動 · 保證入住溫泉飯店 · 柳川遊船 · 阿蘇火山"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">國家</label>
            <select
              value={selectedCountry}
              onChange={(e) => {
                const newCountry = e.target.value;
                setSelectedCountry(newCountry);
                // 更新國家代碼
                const code = countryNameToCode[newCountry];
                setSelectedCountryCode(code || "");
                // 同時更新國家和清空城市，避免 data 覆蓋問題
                onChange({
                  ...data,
                  country: newCountry,
                  city: "",
                });
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
            >
              <option value="">請選擇國家</option>
              {allDestinations.map(dest => (
                <option key={dest.code} value={dest.name}>{dest.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
            <select
              value={data.city || ""}
              onChange={(e) => updateCity(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
              disabled={!selectedCountry}
            >
              <option value="">請選擇城市</option>
              {availableCities.map(city => (
                <option key={city.code} value={city.name}>{city.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">出發日期</label>
            <input
              type="text"
              value={data.departureDate || ""}
              onChange={(e) => updateField("departureDate", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
              placeholder="2025/10/21"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">行程代碼</label>
            <input
              type="text"
              value={data.tourCode || ""}
              onChange={(e) => updateField("tourCode", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
              placeholder="25JFO21CIG"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">作者</label>
          <div className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-600">
            {user?.display_name || user?.english_name || '未登入'} ({user?.employee_number || '-'})
          </div>
          <p className="text-xs text-gray-500 mt-1">自動取得當前登入用戶資訊</p>
        </div>
      </div>

      {/* 航班資訊 */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800 border-b-2 border-blue-500 pb-2">✈️ 航班資訊</h2>

        <div className="bg-blue-50 p-4 rounded-lg space-y-3">
          <h3 className="font-bold text-blue-900">去程航班</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">航空公司</label>
              <input
                type="text"
                value={data.outboundFlight?.airline || ""}
                onChange={(e) => updateFlightField("outboundFlight", "airline", e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="中華航空"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">航班號碼</label>
              <input
                type="text"
                value={data.outboundFlight?.flightNumber || ""}
                onChange={(e) => updateFlightField("outboundFlight", "flightNumber", e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="CI110"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">出發機場</label>
              <input
                type="text"
                value={data.outboundFlight?.departureAirport || ""}
                onChange={(e) => updateFlightField("outboundFlight", "departureAirport", e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="TPE"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">出發時間</label>
              <input
                type="text"
                value={data.outboundFlight?.departureTime || ""}
                onChange={(e) => updateFlightField("outboundFlight", "departureTime", e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="06:50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">出發日期</label>
              <input
                type="text"
                value={data.outboundFlight?.departureDate || ""}
                onChange={(e) => updateFlightField("outboundFlight", "departureDate", e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="10/21"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">抵達機場</label>
              <input
                type="text"
                value={data.outboundFlight?.arrivalAirport || ""}
                onChange={(e) => updateFlightField("outboundFlight", "arrivalAirport", e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="FUK"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">抵達時間</label>
              <input
                type="text"
                value={data.outboundFlight?.arrivalTime || ""}
                onChange={(e) => updateFlightField("outboundFlight", "arrivalTime", e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="09:55"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">飛行時間（自動計算）</label>
              <div className="w-full px-2 py-1 border rounded text-sm bg-gray-100 text-gray-700">
                {data.outboundFlight?.duration || "請輸入出發/抵達時間"}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 p-4 rounded-lg space-y-3">
          <h3 className="font-bold text-indigo-900">回程航班</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">航空公司</label>
              <input
                type="text"
                value={data.returnFlight?.airline || ""}
                onChange={(e) => updateFlightField("returnFlight", "airline", e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="中華航空"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">航班號碼</label>
              <input
                type="text"
                value={data.returnFlight?.flightNumber || ""}
                onChange={(e) => updateFlightField("returnFlight", "flightNumber", e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="CI111"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">出發機場</label>
              <input
                type="text"
                value={data.returnFlight?.departureAirport || ""}
                onChange={(e) => updateFlightField("returnFlight", "departureAirport", e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="FUK"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">出發時間</label>
              <input
                type="text"
                value={data.returnFlight?.departureTime || ""}
                onChange={(e) => updateFlightField("returnFlight", "departureTime", e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="11:00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">出發日期</label>
              <input
                type="text"
                value={data.returnFlight?.departureDate || ""}
                onChange={(e) => updateFlightField("returnFlight", "departureDate", e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="10/25"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">抵達機場</label>
              <input
                type="text"
                value={data.returnFlight?.arrivalAirport || ""}
                onChange={(e) => updateFlightField("returnFlight", "arrivalAirport", e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="TPE"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">抵達時間</label>
              <input
                type="text"
                value={data.returnFlight?.arrivalTime || ""}
                onChange={(e) => updateFlightField("returnFlight", "arrivalTime", e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="12:30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">飛行時間（自動計算）</label>
              <div className="w-full px-2 py-1 border rounded text-sm bg-gray-100 text-gray-700">
                {data.returnFlight?.duration || "請輸入出發/抵達時間"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 行程特色 */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b-2 border-orange-500 pb-2">
          <h2 className="text-lg font-bold text-gray-800">✨ 行程特色</h2>
          <button
            onClick={addFeature}
            className="px-3 py-1 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
          >
            + 新增特色
          </button>
        </div>

        {data.features?.map((feature: any, index: number) => (
          <div key={index} className="p-4 border-2 border-orange-200 rounded-lg space-y-3 bg-orange-50">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-orange-700">特色 {index + 1}</span>
              <button
                onClick={() => removeFeature(index)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                刪除
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">圖標</label>
              <select
                value={feature.icon}
                onChange={(e) => updateFeature(index, "icon", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                {iconOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">標題</label>
              <input
                type="text"
                value={feature.title}
                onChange={(e) => updateFeature(index, "title", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="溫泉飯店體驗"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <input
                type="text"
                value={feature.description}
                onChange={(e) => updateFeature(index, "description", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="保證入住阿蘇溫泉飯店，享受日式溫泉文化"
              />
            </div>
          </div>
        ))}
      </div>

      {/* 精選景點 */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b-2 border-green-500 pb-2">
          <h2 className="text-lg font-bold text-gray-800">📍 精選景點</h2>
          <button
            onClick={addFocusCard}
            className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
          >
            + 新增景點
          </button>
        </div>

        {data.focusCards?.map((card: any, index: number) => (
          <div key={index} className="p-4 border-2 border-green-200 rounded-lg space-y-3 bg-green-50">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-green-700">景點 {index + 1}</span>
              <button
                onClick={() => removeFocusCard(index)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                刪除
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">景點名稱</label>
              <input
                type="text"
                value={card.title}
                onChange={(e) => updateFocusCard(index, "title", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="由布院溫泉街"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">圖片網址</label>
              <input
                type="text"
                value={card.src}
                onChange={(e) => updateFocusCard(index, "src", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="https://images.unsplash.com/..."
              />
            </div>
          </div>
        ))}
      </div>

      {/* 領隊 & 集合資訊 */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800 border-b-2 border-purple-500 pb-2">👤 領隊與集合資訊</h2>

        <div className="bg-purple-50 p-4 rounded-lg space-y-3">
          <h3 className="font-bold text-purple-900">領隊資訊</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">領隊姓名</label>
            <input
              type="text"
              value={data.leader?.name || ""}
              onChange={(e) => updateNestedField("leader", "name", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="鍾惠如 小姐"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">國內電話</label>
              <input
                type="text"
                value={data.leader?.domesticPhone || ""}
                onChange={(e) => updateNestedField("leader", "domesticPhone", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="+886 0928402897"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">國外電話</label>
              <input
                type="text"
                value={data.leader?.overseasPhone || ""}
                onChange={(e) => updateNestedField("leader", "overseasPhone", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="+81 08074371189"
              />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg space-y-3">
          <h3 className="font-bold text-blue-900">集合資訊</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">集合時間</label>
            <input
              type="text"
              value={data.meetingInfo?.time || ""}
              onChange={(e) => updateNestedField("meetingInfo", "time", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="2025/10/21 04:50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">集合地點</label>
            <input
              type="text"
              value={data.meetingInfo?.location || ""}
              onChange={(e) => updateNestedField("meetingInfo", "location", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="桃園機場華航第二航廈 7號櫃台"
            />
          </div>
        </div>
      </div>

      {/* 逐日行程 */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b-2 border-red-500 pb-2">
          <h2 className="text-lg font-bold text-gray-800">📅 逐日行程</h2>
          <button
            onClick={addDailyItinerary}
            className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
          >
            + 新增天數
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">行程副標題</label>
          <input
            type="text"
            value={data.itinerarySubtitle || ""}
            onChange={(e) => updateField("itinerarySubtitle", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
            placeholder="5天4夜精彩旅程規劃"
          />
        </div>

        {data.dailyItinerary?.map((day: any, dayIndex: number) => (
          <div key={dayIndex} className="p-6 border-2 border-red-200 rounded-xl space-y-4 bg-red-50">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <span className="bg-red-500 text-white px-3 py-1 rounded-full font-bold text-sm">
                  {day.dayLabel}
                </span>
                <span className="text-gray-600 text-sm">{day.date}</span>
              </div>
              <button
                onClick={() => removeDailyItinerary(dayIndex)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                刪除此天
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Day 標籤</label>
                <input
                  type="text"
                  value={day.dayLabel}
                  onChange={(e) => updateDailyItinerary(dayIndex, "dayLabel", e.target.value)}
                  className="w-full px-2 py-1 border rounded text-sm"
                  placeholder="Day 1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">日期</label>
                <input
                  type="text"
                  value={day.date}
                  onChange={(e) => updateDailyItinerary(dayIndex, "date", e.target.value)}
                  className="w-full px-2 py-1 border rounded text-sm"
                  placeholder="10/21 (二)"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">行程標題</label>
              <input
                type="text"
                value={day.title}
                onChange={(e) => updateDailyItinerary(dayIndex, "title", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="台北 ✈ 福岡空港 → 由布院 · 金麟湖 → 阿蘇溫泉"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">特別安排 (highlight)</label>
              <input
                type="text"
                value={day.highlight || ""}
                onChange={(e) => updateDailyItinerary(dayIndex, "highlight", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="✨ 特別安排：由布院 · 金麟湖 ～ 日本 OL 人氣 NO.1 散策地"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea
                value={day.description || ""}
                onChange={(e) => updateDailyItinerary(dayIndex, "description", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="集合於台灣桃園國際機場..."
              />
            </div>

            {/* 活動 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">景點活動</label>
                <button
                  onClick={() => addActivity(dayIndex)}
                  className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                >
                  + 新增活動
                </button>
              </div>
              {day.activities?.map((activity: any, actIndex: number) => (
                <div key={actIndex} className="grid grid-cols-3 gap-2 bg-white p-2 rounded">
                  <input
                    type="text"
                    value={activity.icon}
                    onChange={(e) => updateActivity(dayIndex, actIndex, "icon", e.target.value)}
                    className="px-2 py-1 border rounded text-sm"
                    placeholder="🌋"
                  />
                  <input
                    type="text"
                    value={activity.title}
                    onChange={(e) => updateActivity(dayIndex, actIndex, "title", e.target.value)}
                    className="px-2 py-1 border rounded text-sm"
                    placeholder="阿蘇火山"
                  />
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={activity.description}
                      onChange={(e) => updateActivity(dayIndex, actIndex, "description", e.target.value)}
                      className="flex-1 px-2 py-1 border rounded text-sm"
                      placeholder="描述"
                    />
                    <button
                      onClick={() => removeActivity(dayIndex, actIndex)}
                      className="px-2 text-red-500 hover:text-red-700 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 推薦行程 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">推薦行程</label>
                <button
                  onClick={() => addRecommendation(dayIndex)}
                  className="px-2 py-1 bg-green-500 text-white rounded text-xs"
                >
                  + 新增推薦
                </button>
              </div>
              {day.recommendations?.map((rec: string, recIndex: number) => (
                <div key={recIndex} className="flex gap-2">
                  <input
                    type="text"
                    value={rec}
                    onChange={(e) => updateRecommendation(dayIndex, recIndex, e.target.value)}
                    className="flex-1 px-2 py-1 border rounded text-sm bg-white"
                    placeholder="天神商圈購物"
                  />
                  <button
                    onClick={() => removeRecommendation(dayIndex, recIndex)}
                    className="px-2 text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* 餐食 */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">早餐</label>
                <input
                  type="text"
                  value={day.meals?.breakfast || ""}
                  onChange={(e) => updateDailyItinerary(dayIndex, "meals", { ...day.meals, breakfast: e.target.value })}
                  className="w-full px-2 py-1 border rounded text-sm"
                  placeholder="飯店內早餐"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">午餐</label>
                <input
                  type="text"
                  value={day.meals?.lunch || ""}
                  onChange={(e) => updateDailyItinerary(dayIndex, "meals", { ...day.meals, lunch: e.target.value })}
                  className="w-full px-2 py-1 border rounded text-sm"
                  placeholder="博多拉麵 (¥1000)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">晚餐</label>
                <input
                  type="text"
                  value={day.meals?.dinner || ""}
                  onChange={(e) => updateDailyItinerary(dayIndex, "meals", { ...day.meals, dinner: e.target.value })}
                  className="w-full px-2 py-1 border rounded text-sm"
                  placeholder="長腳蟹自助餐"
                />
              </div>
            </div>

            {/* 住宿 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">住宿</label>
              <input
                type="text"
                value={day.accommodation || ""}
                onChange={(e) => updateDailyItinerary(dayIndex, "accommodation", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="ASO RESORT GRANDVRIO HOTEL"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
