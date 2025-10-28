import React from "react";
import { TourFormData, DailyItinerary, Activity } from "../types";

interface DailyItinerarySectionProps {
  data: TourFormData;
  updateField: (field: string, value: unknown) => void;
  addDailyItinerary: () => void;
  updateDailyItinerary: (index: number, field: string, value: unknown) => void;
  removeDailyItinerary: (index: number) => void;
  addActivity: (dayIndex: number) => void;
  updateActivity: (dayIndex: number, actIndex: number, field: string, value: string) => void;
  removeActivity: (dayIndex: number, actIndex: number) => void;
  addDayImage: (dayIndex: number) => void;
  updateDayImage: (dayIndex: number, imageIndex: number, value: string) => void;
  removeDayImage: (dayIndex: number, imageIndex: number) => void;
  addRecommendation: (dayIndex: number) => void;
  updateRecommendation: (dayIndex: number, recIndex: number, value: string) => void;
  removeRecommendation: (dayIndex: number, recIndex: number) => void;
}

export function DailyItinerarySection({
  data,
  updateField,
  addDailyItinerary,
  updateDailyItinerary,
  removeDailyItinerary,
  addActivity,
  updateActivity,
  removeActivity,
  addDayImage,
  updateDayImage,
  removeDayImage,
  addRecommendation,
  updateRecommendation,
  removeRecommendation,
}: DailyItinerarySectionProps) {
  return (
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

      {data.dailyItinerary?.map((day: DailyItinerary, dayIndex: number) => (
        <div key={dayIndex} className="p-6 border border-red-100 rounded-2xl space-y-5 bg-gradient-to-br from-red-50/80 via-white to-red-50/40 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <span className="bg-red-500 text-white px-3 py-1.5 rounded-full font-semibold text-sm tracking-wide">
                {day.dayLabel}
              </span>
              <span className="text-gray-500 text-sm">{day.date}</span>
            </div>
            <button
              onClick={() => removeDailyItinerary(dayIndex)}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
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

          {/* 每日圖片 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">每日圖片</label>
                <p className="text-xs text-gray-500 mt-1">建議尺寸 1600 × 900 以上，可依序新增多張照片</p>
              </div>
              <button
                onClick={() => addDayImage(dayIndex)}
                className="px-2.5 py-1 bg-amber-500 text-white rounded text-xs shadow hover:bg-amber-600"
              >
                + 新增圖片
              </button>
            </div>
            <div className="space-y-2">
              {(day.images || []).map((image: string, imageIndex: number) => (
                <div key={imageIndex} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => updateDayImage(dayIndex, imageIndex, e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500"
                    placeholder="https://images.unsplash.com/..."
                  />
                  <button
                    onClick={() => removeDayImage(dayIndex, imageIndex)}
                    className="px-2 py-1 text-red-500 hover:text-red-700 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {(!day.images || day.images.length === 0) && (
                <p className="text-xs text-gray-400">
                  暫無圖片，點擊「新增圖片」填入第一張每日精選照片網址。
                </p>
              )}
            </div>
          </div>

          {/* 活動 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">景點活動</label>
              <button
                onClick={() => addActivity(dayIndex)}
                className="px-2.5 py-1 bg-blue-500 text-white rounded text-xs shadow hover:bg-blue-600"
              >
                + 新增活動
              </button>
            </div>
            {day.activities?.map((activity: Activity, actIndex: number) => (
              <div key={actIndex} className="space-y-2 bg-white/90 p-3 rounded-lg border border-blue-100">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={activity.icon}
                    onChange={(e) => updateActivity(dayIndex, actIndex, "icon", e.target.value)}
                    className="px-2 py-1 border rounded text-sm"
                  style={{ width: `${Math.max(3, activity.icon.length + 1)}ch` }}
                  placeholder="🌋"
                />
                  <input
                    type="text"
                    value={activity.title}
                    onChange={(e) => updateActivity(dayIndex, actIndex, "title", e.target.value)}
                    className="px-2 py-1 border rounded text-sm"
                    style={{ width: `${Math.max(8, activity.title.length + 2)}ch` }}
                    placeholder="阿蘇火山"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
                  <input
                    type="text"
                    value={activity.description}
                    onChange={(e) => updateActivity(dayIndex, actIndex, "description", e.target.value)}
                    className="px-3 py-2 border rounded text-sm"
                    placeholder="描述"
                  />
                  <input
                    type="text"
                    value={activity.image || ""}
                    onChange={(e) => updateActivity(dayIndex, actIndex, "image", e.target.value)}
                    className="px-3 py-2 border rounded text-sm"
                    placeholder="圖片網址（選填）"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => removeActivity(dayIndex, actIndex)}
                    className="px-2 py-1 text-red-500 hover:text-red-700 text-xs"
                  >
                    ✕ 刪除活動
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
  );
}
