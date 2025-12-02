import React, { useState } from 'react'
import { TourFormData, DailyItinerary, Activity } from '../types'
import { AttractionSelector } from '../../AttractionSelector'
import { Attraction } from '@/features/attractions/types'
import { ArrowRight, Minus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

// 擴展型別（與 AttractionSelector 一致）
interface AttractionWithCity extends Attraction {
  city_name?: string
}
interface DailyItinerarySectionProps {
  data: TourFormData
  updateField: (field: string, value: unknown) => void
  addDailyItinerary: () => void
  updateDailyItinerary: (index: number, field: string, value: unknown) => void
  removeDailyItinerary: (index: number) => void
  addActivity: (dayIndex: number) => void
  updateActivity: (dayIndex: number, actIndex: number, field: string, value: string) => void
  removeActivity: (dayIndex: number, actIndex: number) => void
  addDayImage: (dayIndex: number) => void
  updateDayImage: (dayIndex: number, imageIndex: number, value: string) => void
  removeDayImage: (dayIndex: number, imageIndex: number) => void
  addRecommendation: (dayIndex: number) => void
  updateRecommendation: (dayIndex: number, recIndex: number, value: string) => void
  removeRecommendation: (dayIndex: number, recIndex: number) => void
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
  const [showAttractionSelector, setShowAttractionSelector] = useState(false)
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(-1)
  // 開啟景點選擇器
  const handleOpenAttractionSelector = (dayIndex: number) => {
    setCurrentDayIndex(dayIndex)
    setShowAttractionSelector(true)
  }
  // 處理景點選擇
  const handleSelectAttractions = (attractions: AttractionWithCity[]) => {
    if (currentDayIndex === -1) return
    // 將選擇的景點轉換為活動
    attractions.forEach(attraction => {
      // 先取得當前索引（新增前的長度）
      const day = data.dailyItinerary[currentDayIndex]
      const newActivityIndex = day.activities.length
      // 再新增活動
      addActivity(currentDayIndex)
      // ✅ 設定活動資料（包含 attraction_id）
      updateActivity(currentDayIndex, newActivityIndex, 'attraction_id', attraction.id) // 保留景點關聯
      updateActivity(currentDayIndex, newActivityIndex, 'icon', '📍')
      updateActivity(currentDayIndex, newActivityIndex, 'title', attraction.name)
      updateActivity(
        currentDayIndex,
        newActivityIndex,
        'description',
        attraction.description || ''
      )
      // 設定圖片（如果有的話）
      updateActivity(currentDayIndex, newActivityIndex, 'image', attraction.thumbnail || '')
    })
    setCurrentDayIndex(-1)
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b-2 border-morandi-gold pb-2">
        <h2 className="text-lg font-bold text-morandi-primary">逐日行程</h2>
        <button
          onClick={addDailyItinerary}
          className="px-3 py-1 bg-morandi-gold text-white rounded-lg text-sm hover:bg-morandi-gold/90"
        >
          + 新增天數
        </button>
      </div>

      {data.dailyItinerary?.map((day: DailyItinerary, dayIndex: number) => (
        <div
          key={dayIndex}
          className="p-6 border border-morandi-container rounded-2xl space-y-5 bg-gradient-to-br from-morandi-container/20 via-white to-morandi-container/10 shadow-sm"
        >
          <div className="flex justify-end items-start">
            {dayIndex === data.dailyItinerary.length - 1 && (
              <button
                onClick={() => removeDailyItinerary(dayIndex)}
                className="text-morandi-red hover:text-morandi-red/80 text-sm font-medium transition-colors"
              >
                刪除此天
              </button>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-morandi-primary">行程標題</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const input = document.querySelector(
                      `#title-input-${dayIndex}`
                    ) as HTMLInputElement
                    if (input) {
                      const cursorPos = input.selectionStart || day.title.length
                      const newValue =
                        day.title.slice(0, cursorPos) + ' → ' + day.title.slice(cursorPos)
                      updateDailyItinerary(dayIndex, 'title', newValue)
                      setTimeout(() => {
                        input.focus()
                        input.setSelectionRange(cursorPos + 3, cursorPos + 3)
                      }, 0)
                    }
                  }}
                  className="p-1 bg-morandi-container hover:bg-morandi-gold/20 rounded transition-colors"
                  title="插入箭頭"
                >
                  <ArrowRight size={14} className="text-morandi-primary" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const input = document.querySelector(
                      `#title-input-${dayIndex}`
                    ) as HTMLInputElement
                    if (input) {
                      const cursorPos = input.selectionStart || day.title.length
                      const newValue =
                        day.title.slice(0, cursorPos) + ' · ' + day.title.slice(cursorPos)
                      updateDailyItinerary(dayIndex, 'title', newValue)
                      setTimeout(() => {
                        input.focus()
                        input.setSelectionRange(cursorPos + 3, cursorPos + 3)
                      }, 0)
                    }
                  }}
                  className="px-2 py-0.5 text-xs bg-morandi-container hover:bg-morandi-gold/20 rounded transition-colors"
                  title="插入間隔點"
                >
                  ·
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const input = document.querySelector(
                      `#title-input-${dayIndex}`
                    ) as HTMLInputElement
                    if (input) {
                      const cursorPos = input.selectionStart || day.title.length
                      const newValue =
                        day.title.slice(0, cursorPos) + ' | ' + day.title.slice(cursorPos)
                      updateDailyItinerary(dayIndex, 'title', newValue)
                      setTimeout(() => {
                        input.focus()
                        input.setSelectionRange(cursorPos + 3, cursorPos + 3)
                      }, 0)
                    }
                  }}
                  className="p-1 bg-morandi-container hover:bg-morandi-gold/20 rounded transition-colors"
                  title="插入直線"
                >
                  <Minus size={14} className="text-morandi-primary" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const input = document.querySelector(
                      `#title-input-${dayIndex}`
                    ) as HTMLInputElement
                    if (input) {
                      const cursorPos = input.selectionStart || day.title.length
                      const newValue =
                        day.title.slice(0, cursorPos) + ' ⭐ ' + day.title.slice(cursorPos)
                      updateDailyItinerary(dayIndex, 'title', newValue)
                      setTimeout(() => {
                        input.focus()
                        input.setSelectionRange(cursorPos + 3, cursorPos + 3)
                      }, 0)
                    }
                  }}
                  className="p-1 bg-morandi-container hover:bg-morandi-gold/20 rounded transition-colors"
                  title="插入星號"
                >
                  <Sparkles size={14} className="text-morandi-gold" />
                </button>
              </div>
            </div>
            <input
              id={`title-input-${dayIndex}`}
              type="text"
              value={day.title}
              onChange={e => updateDailyItinerary(dayIndex, 'title', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="台北 ✈ 福岡空港 → 由布院 · 金麟湖 → 阿蘇溫泉"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">
              特別安排 (highlight)
            </label>
            <input
              type="text"
              value={day.highlight || ''}
              onChange={e => updateDailyItinerary(dayIndex, 'highlight', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="✨ 特別安排：由布院 · 金麟湖 ～ 日本 OL 人氣 NO.1 散策地"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">描述</label>
            <textarea
              value={day.description || ''}
              onChange={e => updateDailyItinerary(dayIndex, 'description', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="集合於台灣桃園國際機場..."
            />
          </div>

          {/* 每日圖片 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-morandi-primary">每日圖片</label>
                <p className="text-xs text-morandi-secondary mt-1">
                  建議尺寸 1600 × 900 以上，可依序新增多張照片
                </p>
              </div>
              <button
                onClick={() => addDayImage(dayIndex)}
                className="px-2.5 py-1 bg-morandi-gold text-white rounded text-xs shadow hover:bg-morandi-gold/90"
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
                    onChange={e => updateDayImage(dayIndex, imageIndex, e.target.value)}
                    className="flex-1 px-3 py-2 border border-morandi-container rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold"
                    placeholder="https://images.unsplash.com/..."
                  />
                  <button
                    onClick={() => removeDayImage(dayIndex, imageIndex)}
                    className="px-2 py-1 text-morandi-red hover:text-morandi-red/80 text-xs transition-colors"
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
              <label className="text-sm font-medium text-morandi-primary">景點活動</label>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleOpenAttractionSelector(dayIndex)}
                  size="xs"
                  variant="default"
                  className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                >
                  從景點庫選擇
                </Button>
                <Button
                  onClick={() => addActivity(dayIndex)}
                  size="xs"
                  variant="secondary"
                >
                  + 手動新增
                </Button>
              </div>
            </div>
            {day.activities?.map((activity: Activity, actIndex: number) => (
              <div
                key={actIndex}
                className="space-y-2 bg-white/90 p-3 rounded-lg border border-morandi-container"
              >
                <div>
                  <input
                    type="text"
                    value={activity.title}
                    onChange={e => updateActivity(dayIndex, actIndex, 'title', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="阿蘇火山"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
                  <input
                    type="text"
                    value={activity.description}
                    onChange={e =>
                      updateActivity(dayIndex, actIndex, 'description', e.target.value)
                    }
                    className="px-3 py-2 border rounded text-sm"
                    placeholder="描述"
                  />
                  <input
                    type="text"
                    value={activity.image || ''}
                    onChange={e => updateActivity(dayIndex, actIndex, 'image', e.target.value)}
                    className="px-3 py-2 border rounded text-sm"
                    placeholder="圖片網址（選填）"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => removeActivity(dayIndex, actIndex)}
                    className="px-2 py-1 text-morandi-red hover:text-morandi-red/80 text-xs transition-colors"
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
              <label className="text-sm font-medium text-morandi-primary">推薦行程</label>
              <Button
                onClick={() => addRecommendation(dayIndex)}
                size="xs"
                variant="secondary"
              >
                + 新增推薦
              </Button>
            </div>
            {day.recommendations?.map((rec: string, recIndex: number) => (
              <div key={recIndex} className="flex gap-2">
                <input
                  type="text"
                  value={rec}
                  onChange={e => updateRecommendation(dayIndex, recIndex, e.target.value)}
                  className="flex-1 px-2 py-1 border rounded text-sm bg-white"
                  placeholder="天神商圈購物"
                />
                <button
                  onClick={() => removeRecommendation(dayIndex, recIndex)}
                  className="px-2 text-morandi-red hover:text-morandi-red/80 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* 餐食 */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-morandi-secondary mb-1">早餐</label>
              <input
                type="text"
                value={day.meals?.breakfast || ''}
                onChange={e =>
                  updateDailyItinerary(dayIndex, 'meals', {
                    ...day.meals,
                    breakfast: e.target.value,
                  })
                }
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="飯店內早餐"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-morandi-secondary mb-1">午餐</label>
              <input
                type="text"
                value={day.meals?.lunch || ''}
                onChange={e =>
                  updateDailyItinerary(dayIndex, 'meals', { ...day.meals, lunch: e.target.value })
                }
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="博多拉麵 (¥1000)"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-morandi-secondary mb-1">晚餐</label>
              <input
                type="text"
                value={day.meals?.dinner || ''}
                onChange={e =>
                  updateDailyItinerary(dayIndex, 'meals', { ...day.meals, dinner: e.target.value })
                }
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="長腳蟹自助餐"
              />
            </div>
          </div>

          {/* 住宿 */}
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">住宿</label>
            <input
              type="text"
              value={day.accommodation || ''}
              onChange={e => updateDailyItinerary(dayIndex, 'accommodation', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="ASO RESORT GRANDVRIO HOTEL"
            />
          </div>
        </div>
      ))}

      {/* 景點選擇器 */}
      <AttractionSelector
        isOpen={showAttractionSelector}
        onClose={() => {
          setShowAttractionSelector(false)
          setCurrentDayIndex(-1)
        }}
        tourCountries={data.countries}
        onSelect={handleSelectAttractions}
      />
    </div>
  )
}
