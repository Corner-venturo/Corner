'use client'

/**
 * 模板數據編輯面板
 *
 * 提供快速編輯模板數據的輸入框（標題、日期、目的地等）
 */

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useDragSort } from '@/hooks/useDragSort'
import {
  FileText,
  MapPin,
  Calendar,
  Building2,
  Hash,
  ImageIcon,
  Upload,
  Move,
  Clock,
  UserRound,
  Phone,
  Utensils,
  ChevronDown,
  ChevronRight,
  Hotel,
  Plus,
  Trash2,
  Star,
  GripVertical,
} from 'lucide-react'
import { useState } from 'react'
import type { MealIconType, DailyItinerary, TimelineItem, DailyDetailData } from '../templates/definitions/types'

// 餐食圖標選項
const MEAL_ICON_OPTIONS: { value: MealIconType; label: string }[] = [
  { value: 'bakery_dining', label: '麵包/早餐' },
  { value: 'flight_class', label: '機上餐' },
  { value: 'restaurant', label: '一般餐廳' },
  { value: 'ramen_dining', label: '拉麵/日式' },
  { value: 'soup_kitchen', label: '湯品' },
  { value: 'skillet', label: '鍋物' },
  { value: 'bento', label: '便當' },
  { value: 'rice_bowl', label: '飯類' },
  { value: 'coffee', label: '咖啡/輕食' },
  { value: 'dinner_dining', label: '晚餐' },
]

interface TemplateDataPanelProps {
  templateData: Record<string, unknown> | null
  onTemplateDataChange: (newData: Record<string, unknown>) => void
  onUploadCoverImage?: () => void
  onAdjustCoverPosition?: () => void
  onUploadDailyCoverImage?: () => void
  onAdjustDailyCoverPosition?: () => void
  currentPageType?: string // 'cover' | 'toc' | 'itinerary' | 'daily' | 'memo' | 'hotel' | 'attraction'
  currentDayIndex?: number // 當前每日行程的天數索引（0-based）
}

export function TemplateDataPanel({
  templateData,
  onTemplateDataChange,
  onUploadCoverImage,
  onAdjustCoverPosition,
  onUploadDailyCoverImage,
  onAdjustDailyCoverPosition,
  currentPageType = 'cover',
  currentDayIndex,
}: TemplateDataPanelProps) {
  if (!templateData) {
    return (
      <div className="w-64 h-full bg-white border-l border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <h3 className="font-medium text-sm text-morandi-primary">模板數據</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-morandi-secondary text-center">
            請先選擇模板
          </p>
        </div>
      </div>
    )
  }

  const updateField = (field: string, value: string) => {
    onTemplateDataChange({
      ...templateData,
      [field]: value,
    })
  }

  // 展開的天數索引
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set())
  // 集合資訊抽屜
  const [meetingInfoExpanded, setMeetingInfoExpanded] = useState(false)

  const toggleDay = (dayIndex: number) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(dayIndex)) {
        newSet.delete(dayIndex)
      } else {
        newSet.add(dayIndex)
      }
      return newSet
    })
  }

  // 更新每日行程資料
  const updateDailyItinerary = (
    dayIndex: number,
    field: keyof DailyItinerary | 'mealBreakfast' | 'mealLunch' | 'mealDinner' | 'mealIconBreakfast' | 'mealIconLunch' | 'mealIconDinner',
    value: string
  ) => {
    const currentItineraries = (templateData.dailyItineraries as DailyItinerary[]) || []
    const updatedItineraries = currentItineraries.map((day, idx) => {
      if (idx !== dayIndex) return day

      // 處理餐食欄位
      if (field.startsWith('meal') && !field.startsWith('mealIcon')) {
        const mealType = field.replace('meal', '').toLowerCase() as 'breakfast' | 'lunch' | 'dinner'
        return {
          ...day,
          meals: {
            ...day.meals,
            [mealType]: value,
          },
        }
      }

      // 處理餐食圖標欄位
      if (field.startsWith('mealIcon')) {
        const mealType = field.replace('mealIcon', '').toLowerCase() as 'breakfast' | 'lunch' | 'dinner'
        return {
          ...day,
          mealIcons: {
            ...day.mealIcons,
            [mealType]: value as MealIconType,
          },
        }
      }

      // 處理其他欄位
      return {
        ...day,
        [field]: value,
      }
    })

    onTemplateDataChange({
      ...templateData,
      dailyItineraries: updatedItineraries,
    })
  }

  return (
    <div className="w-64 h-full bg-white border-l border-border flex flex-col">
      <div className="p-3 border-b border-border">
        <h3 className="font-medium text-sm text-morandi-primary">模板數據</h3>
        <p className="text-xs text-morandi-secondary mt-1">
          修改後自動更新畫布
        </p>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-4">
        {/* 頁面類型提示 */}
        <div className="text-xs text-morandi-secondary bg-morandi-container/30 rounded px-2 py-1">
          {currentPageType === 'cover' && '封面頁'}
          {currentPageType === 'toc' && '目錄頁'}
          {currentPageType === 'itinerary' && '行程總覽'}
          {currentPageType === 'daily' && '每日行程'}
          {currentPageType === 'memo' && '備忘錄'}
          {currentPageType === 'hotel' && '飯店介紹'}
          {currentPageType === 'hotelMulti' && '飯店介紹'}
          {currentPageType === 'attraction' && '景點介紹'}
        </div>

        {/* 封面圖片 - 只在封面和目錄頁顯示 */}
        {(currentPageType === 'cover' || currentPageType === 'toc') && (
          <>
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <ImageIcon size={12} />
                封面圖片
              </Label>
              {templateData.coverImage ? (
                <div className="space-y-2">
                  <div
                    className="w-full aspect-[495/350] rounded-lg overflow-hidden bg-morandi-container/30 border border-border"
                    style={{
                      backgroundImage: `url(${templateData.coverImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1 text-xs h-7"
                      onClick={onAdjustCoverPosition}
                    >
                      <Move size={12} />
                      調整位置
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1 text-xs h-7"
                      onClick={onUploadCoverImage}
                    >
                      <Upload size={12} />
                      更換
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-20 border-dashed gap-2"
                  onClick={onUploadCoverImage}
                >
                  <Upload size={16} />
                  上傳封面圖片
                </Button>
              )}
            </div>
            <div className="border-t border-border pt-4" />
          </>
        )}

        {/* 主標題 - 封面頁 */}
        {currentPageType === 'cover' && (
          <>
            {/* 主標題 */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <FileText size={12} />
            主標題
          </Label>
          <Input
            value={(templateData.mainTitle as string) || ''}
            onChange={(e) => updateField('mainTitle', e.target.value)}
            placeholder="輸入主標題..."
            className="h-8 text-sm"
          />
        </div>

        {/* 副標題 */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <FileText size={12} />
            副標題
          </Label>
          <Input
            value={(templateData.subtitle as string) || ''}
            onChange={(e) => updateField('subtitle', e.target.value)}
            placeholder="Travel Handbook"
            className="h-8 text-sm"
          />
        </div>

        {/* 目的地 */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <MapPin size={12} />
            目的地
          </Label>
          <Input
            value={(templateData.destination as string) || ''}
            onChange={(e) => updateField('destination', e.target.value)}
            placeholder="JAPAN, OSAKA"
            className="h-8 text-sm"
          />
        </div>

        {/* 旅遊日期 */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <Calendar size={12} />
            旅遊日期
          </Label>
          <Input
            value={(templateData.travelDates as string) || ''}
            onChange={(e) => updateField('travelDates', e.target.value)}
            placeholder="2025.01.15 - 2025.01.20"
            className="h-8 text-sm"
          />
        </div>

        {/* 公司名稱 */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <Building2 size={12} />
            公司名稱
          </Label>
          <Input
            value={(templateData.companyName as string) || ''}
            onChange={(e) => updateField('companyName', e.target.value)}
            placeholder="Corner Travel"
            className="h-8 text-sm"
          />
        </div>

        {/* 團號 */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <Hash size={12} />
            團號
          </Label>
          <Input
            value={(templateData.tourCode as string) || ''}
            onChange={(e) => updateField('tourCode', e.target.value)}
            placeholder="OSA250115A"
            className="h-8 text-sm"
          />
        </div>
          </>
        )}

        {/* 目錄頁 */}
        {currentPageType === 'toc' && (
          <p className="text-xs text-morandi-secondary">
            目錄頁會自動根據行程內容生成
          </p>
        )}

        {/* 行程總覽頁 */}
        {currentPageType === 'itinerary' && (
          <>
            {/* 集合/領隊資訊抽屜 */}
            <div className="rounded border border-border/50 bg-morandi-container/20 overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center gap-2 p-2 text-left hover:bg-morandi-container/30 transition-colors"
                onClick={() => setMeetingInfoExpanded(!meetingInfoExpanded)}
              >
                {meetingInfoExpanded ? (
                  <ChevronDown size={14} className="text-morandi-secondary" />
                ) : (
                  <ChevronRight size={14} className="text-morandi-secondary" />
                )}
                <Clock size={12} className="text-morandi-secondary" />
                <span className="text-xs font-medium text-morandi-primary flex-1">
                  集合 / 領隊資訊
                </span>
              </button>

              {meetingInfoExpanded && (
                <div className="p-2 pt-0 space-y-2 border-t border-border/30">
                  {/* 集合時間 */}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-morandi-secondary">集合時間</Label>
                    <Input
                      value={(templateData.meetingTime as string) || ''}
                      onChange={(e) => updateField('meetingTime', e.target.value)}
                      placeholder="07:30"
                      className="h-7 text-xs"
                    />
                  </div>

                  {/* 集合地點 */}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-morandi-secondary">集合地點</Label>
                    <Input
                      value={(templateData.meetingPlace as string) || ''}
                      onChange={(e) => updateField('meetingPlace', e.target.value)}
                      placeholder="桃園機場第二航廈"
                      className="h-7 text-xs"
                    />
                  </div>

                  {/* 領隊姓名 */}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-morandi-secondary">領隊姓名</Label>
                    <Input
                      value={(templateData.leaderName as string) || ''}
                      onChange={(e) => updateField('leaderName', e.target.value)}
                      placeholder="王小明"
                      className="h-7 text-xs"
                    />
                  </div>

                  {/* 領隊電話 */}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-morandi-secondary">領隊電話</Label>
                    <Input
                      value={(templateData.leaderPhone as string) || ''}
                      onChange={(e) => updateField('leaderPhone', e.target.value)}
                      placeholder="0912-345-678"
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 每日行程（可編輯） */}
            {(templateData.dailyItineraries as DailyItinerary[])?.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1.5">
                  <Calendar size={12} />
                  每日行程
                </Label>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {(templateData.dailyItineraries as DailyItinerary[])?.map((day, idx) => (
                    <div
                      key={idx}
                      className="rounded border border-border/50 bg-morandi-container/20 overflow-hidden"
                    >
                      {/* 天數標題 - 可點擊展開 */}
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 p-2 text-left hover:bg-morandi-container/30 transition-colors"
                        onClick={() => toggleDay(idx)}
                      >
                        {expandedDays.has(idx) ? (
                          <ChevronDown size={14} className="text-morandi-secondary" />
                        ) : (
                          <ChevronRight size={14} className="text-morandi-secondary" />
                        )}
                        <span className="text-xs font-medium text-morandi-primary flex-1">
                          Day {day.dayNumber}
                        </span>
                        <span className="text-xs text-morandi-secondary truncate max-w-[120px]">
                          {day.title}
                        </span>
                      </button>

                      {/* 展開的編輯區域 */}
                      {expandedDays.has(idx) && (
                        <div className="p-2 pt-0 space-y-2 border-t border-border/30">
                          {/* 行程標題 */}
                          <div className="space-y-1">
                            <Label className="text-[10px] text-morandi-secondary">行程標題</Label>
                            <Input
                              value={day.title || ''}
                              onChange={(e) => updateDailyItinerary(idx, 'title', e.target.value)}
                              placeholder="行程標題..."
                              className="h-7 text-xs"
                            />
                          </div>

                          {/* 早餐 */}
                          <div className="space-y-1">
                            <Label className="text-[10px] text-morandi-secondary flex items-center gap-1">
                              <Utensils size={10} />
                              早餐
                            </Label>
                            <div className="flex gap-1">
                              <Input
                                value={day.meals?.breakfast || ''}
                                onChange={(e) => updateDailyItinerary(idx, 'mealBreakfast', e.target.value)}
                                placeholder="早餐..."
                                className="h-7 text-xs flex-1"
                              />
                              <Select
                                value={day.mealIcons?.breakfast || ''}
                                onValueChange={(v) => updateDailyItinerary(idx, 'mealIconBreakfast', v)}
                              >
                                <SelectTrigger className="h-7 w-20 text-[10px]">
                                  <SelectValue placeholder="圖標" />
                                </SelectTrigger>
                                <SelectContent>
                                  {MEAL_ICON_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* 午餐 */}
                          <div className="space-y-1">
                            <Label className="text-[10px] text-morandi-secondary flex items-center gap-1">
                              <Utensils size={10} />
                              午餐
                            </Label>
                            <div className="flex gap-1">
                              <Input
                                value={day.meals?.lunch || ''}
                                onChange={(e) => updateDailyItinerary(idx, 'mealLunch', e.target.value)}
                                placeholder="午餐..."
                                className="h-7 text-xs flex-1"
                              />
                              <Select
                                value={day.mealIcons?.lunch || ''}
                                onValueChange={(v) => updateDailyItinerary(idx, 'mealIconLunch', v)}
                              >
                                <SelectTrigger className="h-7 w-20 text-[10px]">
                                  <SelectValue placeholder="圖標" />
                                </SelectTrigger>
                                <SelectContent>
                                  {MEAL_ICON_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* 晚餐 */}
                          <div className="space-y-1">
                            <Label className="text-[10px] text-morandi-secondary flex items-center gap-1">
                              <Utensils size={10} />
                              晚餐
                            </Label>
                            <div className="flex gap-1">
                              <Input
                                value={day.meals?.dinner || ''}
                                onChange={(e) => updateDailyItinerary(idx, 'mealDinner', e.target.value)}
                                placeholder="晚餐..."
                                className="h-7 text-xs flex-1"
                              />
                              <Select
                                value={day.mealIcons?.dinner || ''}
                                onValueChange={(v) => updateDailyItinerary(idx, 'mealIconDinner', v)}
                              >
                                <SelectTrigger className="h-7 w-20 text-[10px]">
                                  <SelectValue placeholder="圖標" />
                                </SelectTrigger>
                                <SelectContent>
                                  {MEAL_ICON_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* 住宿 */}
                          <div className="space-y-1">
                            <Label className="text-[10px] text-morandi-secondary flex items-center gap-1">
                              <Hotel size={10} />
                              住宿
                            </Label>
                            <Input
                              value={day.accommodation || ''}
                              onChange={(e) => updateDailyItinerary(idx, 'accommodation', e.target.value)}
                              placeholder="住宿飯店..."
                              className="h-7 text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-morandi-secondary">
              航班資訊會自動從行程表帶入
            </p>
          </>
        )}

        {/* 每日行程頁 */}
        {currentPageType === 'daily' && currentDayIndex !== undefined && (
          <DailyPageEditor
            templateData={templateData}
            currentDayIndex={currentDayIndex}
            onTemplateDataChange={onTemplateDataChange}
            onUploadCoverImage={onUploadDailyCoverImage}
            onAdjustCoverPosition={onAdjustDailyCoverPosition}
          />
        )}
        {currentPageType === 'daily' && currentDayIndex === undefined && (
          <p className="text-xs text-morandi-secondary">
            每日行程內容從行程表自動帶入，可在畫布上直接編輯文字
          </p>
        )}

        {/* 備忘錄頁 */}
        {currentPageType === 'memo' && (
          <p className="text-xs text-morandi-secondary">
            備忘錄內容會根據目的地國家自動生成
          </p>
        )}

        {/* 飯店介紹頁 */}
        {(currentPageType === 'hotel' || currentPageType === 'hotelMulti') && (
          <p className="text-xs text-morandi-secondary">
            飯店資訊從行程表自動帶入
          </p>
        )}

        {/* 景點介紹頁 */}
        {currentPageType === 'attraction' && (
          <p className="text-xs text-morandi-secondary">
            景點資訊可在畫布上直接編輯
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * 每日行程頁編輯器
 */
interface DailyPageEditorProps {
  templateData: Record<string, unknown> | null
  currentDayIndex: number
  onTemplateDataChange: (newData: Record<string, unknown>) => void
  onUploadCoverImage?: () => void
  onAdjustCoverPosition?: () => void
}

function DailyPageEditor({
  templateData,
  currentDayIndex,
  onTemplateDataChange,
  onUploadCoverImage,
  onAdjustCoverPosition,
}: DailyPageEditorProps) {
  // 取得當前天的詳細資料
  const dailyDetails = (templateData?.dailyDetails as DailyDetailData[]) || []
  const currentDay = dailyDetails[currentDayIndex]

  // 更新當日行程詳細資料
  const updateDailyDetail = (field: keyof DailyDetailData | string, value: unknown) => {
    const newDailyDetails = [...dailyDetails]

    // 確保有足夠的元素
    while (newDailyDetails.length <= currentDayIndex) {
      newDailyDetails.push({
        dayNumber: newDailyDetails.length + 1,
        date: '',
        title: '',
        timeline: [],
        meals: {},
      })
    }

    // 處理餐食欄位
    if (field.startsWith('meals.')) {
      const mealType = field.replace('meals.', '') as 'breakfast' | 'lunch' | 'dinner'
      newDailyDetails[currentDayIndex] = {
        ...newDailyDetails[currentDayIndex],
        meals: {
          ...newDailyDetails[currentDayIndex].meals,
          [mealType]: value,
        },
      }
    } else {
      newDailyDetails[currentDayIndex] = {
        ...newDailyDetails[currentDayIndex],
        [field]: value,
      }
    }

    onTemplateDataChange({
      ...templateData,
      dailyDetails: newDailyDetails,
    })
  }

  // 更新時間軸項目
  const updateTimelineItem = (index: number, field: keyof TimelineItem, value: unknown) => {
    const currentTimeline = currentDay?.timeline || []
    const newTimeline = [...currentTimeline]
    newTimeline[index] = {
      ...newTimeline[index],
      [field]: value,
    }
    updateDailyDetail('timeline', newTimeline)
  }

  // 新增時間軸項目
  const addTimelineItem = () => {
    const currentTimeline = currentDay?.timeline || []
    const newTimeline = [...currentTimeline, { time: '', activity: '', isHighlight: false }]
    updateDailyDetail('timeline', newTimeline)
  }

  // 刪除時間軸項目
  const removeTimelineItem = (index: number) => {
    const currentTimeline = currentDay?.timeline || []
    const newTimeline = currentTimeline.filter((_, i) => i !== index)
    updateDailyDetail('timeline', newTimeline)
  }

  // 切換重點標記
  const toggleHighlight = (index: number) => {
    const currentTimeline = currentDay?.timeline || []
    const newTimeline = [...currentTimeline]
    newTimeline[index] = {
      ...newTimeline[index],
      isHighlight: !newTimeline[index].isHighlight,
    }
    updateDailyDetail('timeline', newTimeline)
  }

  // 拖曳排序
  const { dragState, dragHandlers } = useDragSort({
    onReorder: (fromIndex, toIndex) => {
      const currentTimeline = currentDay?.timeline || []
      const newTimeline = [...currentTimeline]
      const [removed] = newTimeline.splice(fromIndex, 1)
      newTimeline.splice(toIndex, 0, removed)
      updateDailyDetail('timeline', newTimeline)
    },
  })

  if (!templateData) return null

  return (
    <div className="space-y-4">
      {/* 天數標題 */}
      <div className="p-2 bg-morandi-gold/10 rounded text-sm text-morandi-primary font-medium">
        第 {currentDayIndex + 1} 天
      </div>

      {/* 當日封面圖片 */}
      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1.5">
          <ImageIcon size={12} />
          當日封面圖片
        </Label>
        {currentDay?.coverImage ? (
          <div className="space-y-2">
            <div
              className="w-full aspect-[16/9] rounded-lg overflow-hidden bg-morandi-container/30 border border-border"
              style={{
                backgroundImage: `url(${currentDay.coverImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1 text-xs h-7"
                onClick={onAdjustCoverPosition}
              >
                <Move size={12} />
                調整位置
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1 text-xs h-7"
                onClick={onUploadCoverImage}
              >
                <Upload size={12} />
                更換
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full h-16 border-dashed gap-2 text-xs"
            onClick={onUploadCoverImage}
          >
            <Upload size={14} />
            上傳當日封面
          </Button>
        )}
      </div>

      {/* 當日標題 */}
      <div className="space-y-1.5">
        <Label className="text-xs flex items-center gap-1.5">
          <FileText size={12} />
          當日標題
        </Label>
        <Input
          value={currentDay?.title || ''}
          onChange={(e) => updateDailyDetail('title', e.target.value)}
          placeholder="輸入當日標題..."
          className="h-8 text-sm"
        />
      </div>

      {/* 日期 */}
      <div className="space-y-1.5">
        <Label className="text-xs flex items-center gap-1.5">
          <Calendar size={12} />
          日期
        </Label>
        <Input
          type="date"
          value={currentDay?.date || ''}
          onChange={(e) => updateDailyDetail('date', e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      {/* 時間軸 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs flex items-center gap-1.5">
            <Clock size={12} />
            時間軸
          </Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={addTimelineItem}
            className="h-6 px-2 text-xs gap-1"
          >
            <Plus size={12} />
            新增
          </Button>
        </div>

        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
          {(currentDay?.timeline || []).map((item, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={(e) => dragHandlers.onDragStart(e, idx)}
              onDragOver={(e) => dragHandlers.onDragOver(e, idx)}
              onDragLeave={dragHandlers.onDragLeave}
              onDrop={(e) => dragHandlers.onDrop(e, idx)}
              onDragEnd={dragHandlers.onDragEnd}
              className={cn(
                'p-2 rounded border border-border/50 bg-morandi-container/10 transition-all',
                item.isHighlight && 'border-morandi-gold bg-morandi-gold/5',
                dragState.isDragging(idx) && 'opacity-50',
                dragState.isDragOver(idx) && 'border-morandi-gold border-dashed'
              )}
            >
              <div className="flex items-center gap-1">
                {/* 拖曳手柄 */}
                <div className="cursor-grab active:cursor-grabbing text-morandi-muted hover:text-morandi-primary">
                  <GripVertical size={14} />
                </div>

                <Input
                  value={item.time || ''}
                  onChange={(e) => updateTimelineItem(idx, 'time', e.target.value)}
                  placeholder="09:00"
                  className="w-16 h-7 text-xs"
                />
                <Input
                  value={item.activity || ''}
                  onChange={(e) => updateTimelineItem(idx, 'activity', e.target.value)}
                  placeholder="活動內容..."
                  className="flex-1 h-7 text-xs"
                />
                <button
                  type="button"
                  onClick={() => toggleHighlight(idx)}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    item.isHighlight
                      ? 'text-morandi-gold bg-morandi-gold/10'
                      : 'text-morandi-muted hover:text-morandi-gold hover:bg-morandi-gold/10'
                  )}
                  title="標記為重點"
                >
                  <Star size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => removeTimelineItem(idx)}
                  className="p-1.5 rounded text-morandi-muted hover:text-morandi-red hover:bg-morandi-red/10 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}

          {(!currentDay?.timeline || currentDay.timeline.length === 0) && (
            <p className="text-xs text-morandi-secondary text-center py-4">
              尚未新增時間軸項目
            </p>
          )}
        </div>
      </div>

      {/* 餐食 */}
      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1.5">
          <Utensils size={12} />
          餐食
        </Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-morandi-secondary w-8">早餐</span>
            <Input
              value={currentDay?.meals?.breakfast || ''}
              onChange={(e) => updateDailyDetail('meals.breakfast', e.target.value)}
              placeholder="早餐..."
              className="flex-1 h-7 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-morandi-secondary w-8">午餐</span>
            <Input
              value={currentDay?.meals?.lunch || ''}
              onChange={(e) => updateDailyDetail('meals.lunch', e.target.value)}
              placeholder="午餐..."
              className="flex-1 h-7 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-morandi-secondary w-8">晚餐</span>
            <Input
              value={currentDay?.meals?.dinner || ''}
              onChange={(e) => updateDailyDetail('meals.dinner', e.target.value)}
              placeholder="晚餐..."
              className="flex-1 h-7 text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
