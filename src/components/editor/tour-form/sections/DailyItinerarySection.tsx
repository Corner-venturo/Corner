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
            {day.activities?.map((activity: Activity, actIndex: number) => (
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
  );
}
