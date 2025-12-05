import React, { useState, useRef } from 'react'
import { TourFormData, DailyItinerary, Activity } from '../types'
import { AttractionSelector } from '../../AttractionSelector'
import { Attraction } from '@/features/attractions/types'
import { ArrowRight, Minus, Sparkles, Upload, Loader2, ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'

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
  const [uploadingImage, setUploadingImage] = useState<{ dayIndex: number; imageIndex: number } | null>(null)
  const [uploadingActivityImage, setUploadingActivityImage] = useState<{ dayIndex: number; actIndex: number } | null>(null)
  const [dragOver, setDragOver] = useState<{ dayIndex: number; imageIndex: number } | null>(null)
  const [activityDragOver, setActivityDragOver] = useState<{ dayIndex: number; actIndex: number } | null>(null)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const activityFileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  // 上傳每日圖片
  const handleImageUpload = async (
    dayIndex: number,
    imageIndex: number,
    file: File
  ) => {
    if (!file.type.startsWith('image/')) {
      alert('請選擇圖片檔案')
      return
    }

    setUploadingImage({ dayIndex, imageIndex })

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `day-${dayIndex + 1}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
      const filePath = `tour-daily-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('workspace-files')
        .upload(filePath, file)

      if (uploadError) {
        console.error('上傳失敗:', uploadError)
        alert('圖片上傳失敗')
        return
      }

      const { data } = supabase.storage
        .from('workspace-files')
        .getPublicUrl(filePath)

      updateDayImage(dayIndex, imageIndex, data.publicUrl)
    } catch (error) {
      console.error('上傳錯誤:', error)
      alert('上傳過程發生錯誤')
    } finally {
      setUploadingImage(null)
    }
  }

  // 上傳活動圖片
  const handleActivityImageUpload = async (
    dayIndex: number,
    actIndex: number,
    file: File
  ) => {
    if (!file.type.startsWith('image/')) {
      alert('請選擇圖片檔案')
      return
    }

    setUploadingActivityImage({ dayIndex, actIndex })

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `activity-${dayIndex + 1}-${actIndex + 1}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
      const filePath = `tour-activity-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('workspace-files')
        .upload(filePath, file)

      if (uploadError) {
        console.error('上傳失敗:', uploadError)
        alert('圖片上傳失敗')
        return
      }

      const { data } = supabase.storage
        .from('workspace-files')
        .getPublicUrl(filePath)

      updateActivity(dayIndex, actIndex, 'image', data.publicUrl)
    } catch (error) {
      console.error('上傳錯誤:', error)
      alert('上傳過程發生錯誤')
    } finally {
      setUploadingActivityImage(null)
    }
  }

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
      // 設定圖片（優先使用 thumbnail，沒有則取 images 第一張）
      const imageUrl = attraction.thumbnail || (attraction.images && attraction.images.length > 0 ? attraction.images[0] : '')
      updateActivity(currentDayIndex, newActivityIndex, 'image', imageUrl)
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
          {/* Day 標籤與刪除按鈕 */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-morandi-gold text-white text-sm font-bold rounded-full">
                Day {dayIndex + 1}
              </span>
              <span className="text-sm text-morandi-secondary">
                {day.title || '尚未設定行程標題'}
              </span>
            </div>
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
              {(day.images || []).map((image: string, imageIndex: number) => {
                const inputKey = `${dayIndex}-${imageIndex}`
                const isUploading = uploadingImage?.dayIndex === dayIndex && uploadingImage?.imageIndex === imageIndex
                const isDragOver = dragOver?.dayIndex === dayIndex && dragOver?.imageIndex === imageIndex

                return (
                  <div
                    key={imageIndex}
                    className={`flex items-center gap-2 p-2 rounded-lg border-2 border-dashed transition-colors ${
                      isDragOver
                        ? 'border-morandi-gold bg-morandi-gold/10'
                        : 'border-transparent'
                    }`}
                    onDragOver={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      setDragOver({ dayIndex, imageIndex })
                    }}
                    onDragLeave={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      setDragOver(null)
                    }}
                    onDrop={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      setDragOver(null)
                      const file = e.dataTransfer.files?.[0]
                      if (file && file.type.startsWith('image/')) {
                        handleImageUpload(dayIndex, imageIndex, file)
                      }
                    }}
                  >
                    <input
                      type="text"
                      value={image}
                      onChange={e => updateDayImage(dayIndex, imageIndex, e.target.value)}
                      className="flex-1 px-3 py-2 border border-morandi-container rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold"
                      placeholder={isUploading ? '上傳中...' : '貼上網址或拖曳圖片到此...'}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      ref={el => { fileInputRefs.current[inputKey] = el }}
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleImageUpload(dayIndex, imageIndex, file)
                        }
                        e.target.value = ''
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[inputKey]?.click()}
                      disabled={isUploading}
                      className="px-2 py-1.5 bg-morandi-container hover:bg-morandi-gold/20 rounded-lg text-morandi-primary transition-colors disabled:opacity-50"
                      title="上傳圖片"
                    >
                      {isUploading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Upload size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => removeDayImage(dayIndex, imageIndex)}
                      className="px-2 py-1 text-morandi-red hover:text-morandi-red/80 text-xs transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
              {(!day.images || day.images.length === 0) && (
                <p className="text-xs text-gray-400">
                  暫無圖片，點擊「新增圖片」可填入網址、拖曳或上傳照片。
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
            {day.activities?.map((activity: Activity, actIndex: number) => {
              const activityInputKey = `activity-${dayIndex}-${actIndex}`
              const isActivityUploading = uploadingActivityImage?.dayIndex === dayIndex && uploadingActivityImage?.actIndex === actIndex
              const isActivityDragOver = activityDragOver?.dayIndex === dayIndex && activityDragOver?.actIndex === actIndex

              return (
                <div
                  key={actIndex}
                  className="bg-white/90 p-3 rounded-lg border border-morandi-container"
                >
                  <div className="flex gap-3">
                    {/* 圖片區域 */}
                    <div
                      className={`relative w-24 h-24 flex-shrink-0 rounded-lg border-2 border-dashed overflow-hidden transition-colors ${
                        isActivityDragOver
                          ? 'border-morandi-gold bg-morandi-gold/10'
                          : activity.image
                            ? 'border-transparent'
                            : 'border-morandi-container bg-morandi-container/20'
                      }`}
                      onDragOver={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        setActivityDragOver({ dayIndex, actIndex })
                      }}
                      onDragLeave={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        setActivityDragOver(null)
                      }}
                      onDrop={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        setActivityDragOver(null)
                        const file = e.dataTransfer.files?.[0]
                        if (file && file.type.startsWith('image/')) {
                          handleActivityImageUpload(dayIndex, actIndex, file)
                        }
                      }}
                    >
                      {activity.image ? (
                        <>
                          <img
                            src={activity.image}
                            alt={activity.title || '活動圖片'}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => updateActivity(dayIndex, actIndex, 'image', '')}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                            title="移除圖片"
                          >
                            <X size={12} />
                          </button>
                        </>
                      ) : (
                        <label
                          className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-morandi-container/30 transition-colors"
                        >
                          {isActivityUploading ? (
                            <Loader2 size={20} className="text-morandi-secondary animate-spin" />
                          ) : (
                            <>
                              <ImageIcon size={20} className="text-morandi-secondary/50 mb-1" />
                              <span className="text-[10px] text-morandi-secondary/50">點擊或拖曳</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            ref={el => { activityFileInputRefs.current[activityInputKey] = el }}
                            onChange={e => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleActivityImageUpload(dayIndex, actIndex, file)
                              }
                              e.target.value = ''
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* 文字區域 */}
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={activity.title}
                        onChange={e => updateActivity(dayIndex, actIndex, 'title', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        placeholder="景點名稱"
                      />
                      <textarea
                        value={activity.description}
                        onChange={e =>
                          updateActivity(dayIndex, actIndex, 'description', e.target.value)
                        }
                        className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                        rows={2}
                        placeholder="描述（選填）"
                      />
                    </div>
                  </div>

                  {/* 底部操作區 */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-morandi-container/50">
                    <div className="flex items-center gap-2">
                      {!activity.image && (
                        <button
                          type="button"
                          onClick={() => activityFileInputRefs.current[activityInputKey]?.click()}
                          disabled={isActivityUploading}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/50 rounded transition-colors disabled:opacity-50"
                        >
                          <Upload size={12} />
                          上傳圖片
                        </button>
                      )}
                      <input
                        type="text"
                        value={activity.image || ''}
                        onChange={e => updateActivity(dayIndex, actIndex, 'image', e.target.value)}
                        className="w-48 px-2 py-1 border border-morandi-container rounded text-xs bg-transparent focus:outline-none focus:ring-1 focus:ring-morandi-gold/50"
                        placeholder="或貼上圖片網址..."
                      />
                    </div>
                    <button
                      onClick={() => removeActivity(dayIndex, actIndex)}
                      className="px-2 py-1 text-morandi-red hover:text-morandi-red/80 text-xs transition-colors"
                    >
                      ✕ 刪除
                    </button>
                  </div>
                </div>
              )
            })}
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
