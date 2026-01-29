'use client'

/**
 * 模板數據編輯面板
 *
 * 提供快速編輯模板數據的輸入框（標題、日期、目的地等）
 */

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ImageUploader } from '@/components/ui/image-uploader'
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
  Plane,
  Camera,
  ShoppingBag,
  Info,
  Mountain,
  TreePine,
  Compass,
  Check,
  RefreshCw,
  Bus,
  Car,
  Users,
  Download,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useState } from 'react'
import type { MealIconType, DailyItinerary, TimelineItem, DailyDetailData, VehicleData, VehicleMemberData, GroupType, CountryCode, VehicleColumnSettings, HotelData } from '../templates/definitions/types'
import { getMemoSettingsByCountry, countryNames } from '../templates/definitions/country-presets'
import { calculatePageNumberForToc } from '../utils/page-number'

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

// 目錄項目類型
export interface TocItem {
  pageId: string       // 對應的頁面 ID
  displayName: string  // 顯示名稱（空則用頁面名稱）
  icon: string         // 圖標 ID
  enabled: boolean     // 是否顯示在目錄
  pageNumber: number   // 頁碼（自動計算）
}

// 目錄圖標選項
const TOC_ICON_OPTIONS: { value: string; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { value: 'plane', label: '飛機', Icon: Plane },
  { value: 'calendar', label: '行程', Icon: Calendar },
  { value: 'hotel', label: '飯店', Icon: Hotel },
  { value: 'mappin', label: '景點', Icon: MapPin },
  { value: 'camera', label: '觀光', Icon: Camera },
  { value: 'utensils', label: '餐廳', Icon: Utensils },
  { value: 'shopping', label: '購物', Icon: ShoppingBag },
  { value: 'mountain', label: '自然', Icon: Mountain },
  { value: 'tree', label: '公園', Icon: TreePine },
  { value: 'compass', label: '探索', Icon: Compass },
  { value: 'info', label: '資訊', Icon: Info },
  { value: 'bus', label: '分車', Icon: Bus },
]

// 簡易頁面資訊（給目錄編輯用）
export interface SimplePage {
  id: string
  name: string
  templateKey?: string
}

interface TemplateDataPanelProps {
  templateData: Record<string, unknown> | null
  onTemplateDataChange: (newData: Record<string, unknown>) => void
  onUploadCoverImage?: () => void
  onAdjustCoverPosition?: () => void
  onUploadDailyCoverImage?: () => void
  onAdjustDailyCoverPosition?: () => void
  currentPageType?: string // 'cover' | 'toc' | 'itinerary' | 'daily' | 'memo' | 'hotel' | 'attraction' | 'vehicle' | 'table'
  currentDayIndex?: number // 當前每日行程的天數索引（0-based）
  // 目錄編輯用
  pages?: SimplePage[]     // 所有頁面列表
  onApplyToc?: () => void  // 套用目錄變更到頁面
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
  pages,
  onApplyToc,
}: TemplateDataPanelProps) {
  if (!templateData) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-3 border-b border-border flex-shrink-0">
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
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border flex-shrink-0">
        <h3 className="font-medium text-sm text-morandi-primary">模板數據</h3>
        <p className="text-xs text-morandi-secondary mt-1">
          修改後自動更新畫布
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
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
          {currentPageType === 'vehicle' && '分車名單'}
          {currentPageType === 'table' && '分桌名單'}
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
        {currentPageType === 'toc' && pages && (
          <TocEditor
            templateData={templateData}
            pages={pages}
            onTemplateDataChange={onTemplateDataChange}
            onApplyToc={onApplyToc}
          />
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
                    <Label className="text-[10px] text-morandi-primary">集合時間</Label>
                    <Input
                      value={(templateData.meetingTime as string) || ''}
                      onChange={(e) => updateField('meetingTime', e.target.value)}
                      placeholder="07:30"
                      className="h-7 text-xs"
                    />
                  </div>

                  {/* 集合地點 */}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-morandi-primary">集合地點</Label>
                    <Input
                      value={(templateData.meetingPlace as string) || ''}
                      onChange={(e) => updateField('meetingPlace', e.target.value)}
                      placeholder="桃園機場第二航廈"
                      className="h-7 text-xs"
                    />
                  </div>

                  {/* 領隊姓名 */}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-morandi-primary">領隊姓名</Label>
                    <Input
                      value={(templateData.leaderName as string) || ''}
                      onChange={(e) => updateField('leaderName', e.target.value)}
                      placeholder="王小明"
                      className="h-7 text-xs"
                    />
                  </div>

                  {/* 領隊電話 */}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-morandi-primary">領隊電話</Label>
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
                <div className="space-y-2">
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
                            <Label className="text-[10px] text-morandi-primary">行程標題</Label>
                            <Input
                              value={day.title || ''}
                              onChange={(e) => updateDailyItinerary(idx, 'title', e.target.value)}
                              placeholder="行程標題..."
                              className="h-7 text-xs"
                            />
                          </div>

                          {/* 早餐 */}
                          <div className="space-y-1">
                            <Label className="text-[10px] text-morandi-primary flex items-center gap-1">
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
                            <Label className="text-[10px] text-morandi-primary flex items-center gap-1">
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
                            <Label className="text-[10px] text-morandi-primary flex items-center gap-1">
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
                            <Label className="text-[10px] text-morandi-primary flex items-center gap-1">
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
          <MemoEditor
            templateData={templateData}
            onTemplateDataChange={onTemplateDataChange}
          />
        )}

        {/* 飯店介紹頁 */}
        {(currentPageType === 'hotel' || currentPageType === 'hotelMulti') && (
          <HotelEditor
            templateData={templateData}
            onTemplateDataChange={onTemplateDataChange}
            currentHotelIndex={templateData.currentHotelIndex as number | undefined}
          />
        )}

        {/* 景點介紹頁 */}
        {currentPageType === 'attraction' && (
          <p className="text-xs text-morandi-secondary">
            景點資訊可在畫布上直接編輯
          </p>
        )}

        {/* 分車/分桌名單頁 */}
        {(currentPageType === 'vehicle' || currentPageType === 'table') && (
          <VehicleEditor
            templateData={templateData}
            onTemplateDataChange={onTemplateDataChange}
            currentVehicleIndex={templateData.currentVehiclePageIndex as number | undefined}
            pageType={currentPageType}
          />
        )}
      </div>
    </div>
  )
}

/**
 * 目錄編輯器
 */
interface TocEditorProps {
  templateData: Record<string, unknown>
  pages: SimplePage[]
  onTemplateDataChange: (newData: Record<string, unknown>) => void
  onApplyToc?: () => void
}

function TocEditor({
  templateData,
  pages,
  onTemplateDataChange,
  onApplyToc,
}: TocEditorProps) {
  // 取得現有的 TOC 項目
  const tocItems = (templateData.tocItems as TocItem[]) || []

  // 過濾掉封面和目錄本身
  const availablePages = pages.filter(
    (p) => p.templateKey !== 'cover' && p.templateKey !== 'toc' && p.templateKey !== 'blank'
  )

  // 根據頁面類型自動選擇預設圖標
  const getDefaultIcon = (templateKey?: string): string => {
    switch (templateKey) {
      case 'itinerary':
        return 'plane'
      case 'daily':
        return 'calendar'
      case 'hotel':
      case 'hotelMulti':
        return 'hotel'
      case 'attraction':
        return 'mappin'
      case 'memo':
        return 'info'
      case 'vehicle':
        return 'bus'
      default:
        return 'calendar'
    }
  }

  // 初始化 TOC 項目（如果還沒有）
  const initializeTocItems = () => {
    const newTocItems: TocItem[] = availablePages.map((page) => {
      // 尋找現有項目
      const existingItem = tocItems.find((item) => item.pageId === page.id)
      if (existingItem) {
        // 更新頁碼（使用新的頁碼計算邏輯）
        const pageNumber = calculatePageNumberForToc(page.id, pages)
        return { ...existingItem, pageNumber }
      }
      // 建立新項目
      const pageNumber = calculatePageNumberForToc(page.id, pages)
      return {
        pageId: page.id,
        displayName: page.name,
        icon: getDefaultIcon(page.templateKey),
        enabled: true,
        pageNumber,
      }
    })

    onTemplateDataChange({
      ...templateData,
      tocItems: newTocItems,
    })
  }

  // 如果沒有 TOC 項目，顯示初始化按鈕
  if (tocItems.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-morandi-secondary">
          設定要顯示在目錄中的頁面
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={initializeTocItems}
          className="w-full gap-2"
        >
          <RefreshCw size={14} />
          載入頁面列表
        </Button>
      </div>
    )
  }

  // 更新單一項目
  const updateTocItem = (pageId: string, field: keyof TocItem, value: unknown) => {
    const newTocItems = tocItems.map((item) => {
      if (item.pageId !== pageId) return item
      return { ...item, [field]: value }
    })
    onTemplateDataChange({
      ...templateData,
      tocItems: newTocItems,
    })
  }

  // 切換啟用狀態
  const toggleEnabled = (pageId: string) => {
    const item = tocItems.find((i) => i.pageId === pageId)
    if (item) {
      updateTocItem(pageId, 'enabled', !item.enabled)
    }
  }

  // 重新排序
  const { dragState, dragHandlers } = useDragSort({
    onReorder: (fromIndex, toIndex) => {
      const newTocItems = [...tocItems]
      const [removed] = newTocItems.splice(fromIndex, 1)
      newTocItems.splice(toIndex, 0, removed)
      onTemplateDataChange({
        ...templateData,
        tocItems: newTocItems,
      })
    },
  })

  // 刷新頁碼（使用新的頁碼計算邏輯）
  const refreshPageNumbers = () => {
    const newTocItems = tocItems.map((item) => {
      const pageNumber = calculatePageNumberForToc(item.pageId, pages)
      return { ...item, pageNumber }
    })
    onTemplateDataChange({
      ...templateData,
      tocItems: newTocItems,
    })
  }

  // 統計啟用的項目數
  const enabledCount = tocItems.filter((i) => i.enabled).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs">目錄項目 ({enabledCount})</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshPageNumbers}
          className="h-6 px-2 text-[10px] gap-1"
          title="刷新頁碼"
        >
          <RefreshCw size={10} />
          刷新
        </Button>
      </div>

      <div className="space-y-1.5">
        {tocItems.map((item, idx) => {
          const page = pages.find((p) => p.id === item.pageId)
          if (!page) return null

          const iconOption = TOC_ICON_OPTIONS.find((o) => o.value === item.icon)
          const IconComponent = iconOption?.Icon || Calendar

          return (
            <div
              key={item.pageId}
              draggable
              onDragStart={(e) => dragHandlers.onDragStart(e, idx)}
              onDragOver={(e) => dragHandlers.onDragOver(e, idx)}
              onDragLeave={dragHandlers.onDragLeave}
              onDrop={(e) => dragHandlers.onDrop(e, idx)}
              onDragEnd={dragHandlers.onDragEnd}
              className={cn(
                'p-2 rounded border border-border/50 bg-morandi-container/10 transition-all',
                !item.enabled && 'opacity-50',
                dragState.isDragging(idx) && 'opacity-30',
                dragState.isDragOver(idx) && 'border-morandi-gold border-dashed'
              )}
            >
              <div className="flex items-center gap-1.5">
                {/* 拖曳手柄 */}
                <div className="cursor-grab active:cursor-grabbing text-morandi-muted hover:text-morandi-primary shrink-0">
                  <GripVertical size={12} />
                </div>

                {/* 勾選 */}
                <Checkbox
                  checked={item.enabled}
                  onCheckedChange={() => toggleEnabled(item.pageId)}
                  className="shrink-0"
                />

                {/* 圖標選擇 */}
                <Select
                  value={item.icon}
                  onValueChange={(v) => updateTocItem(item.pageId, 'icon', v)}
                >
                  <SelectTrigger className="h-7 w-9 p-0 justify-center shrink-0">
                    <IconComponent size={14} className="text-morandi-gold" />
                  </SelectTrigger>
                  <SelectContent>
                    {TOC_ICON_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <opt.Icon size={14} />
                          <span className="text-xs">{opt.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 名稱 */}
                <Input
                  value={item.displayName}
                  onChange={(e) => updateTocItem(item.pageId, 'displayName', e.target.value)}
                  placeholder={page.name}
                  className="flex-1 h-7 text-xs"
                />

                {/* 頁碼 */}
                <span className="text-xs text-morandi-secondary w-6 text-right shrink-0">
                  {item.pageNumber}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 套用按鈕 */}
      {onApplyToc && (
        <Button
          size="sm"
          onClick={onApplyToc}
          className="w-full gap-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
        >
          <Check size={14} />
          套用到目錄頁
        </Button>
      )}
    </div>
  )
}

/**
 * 備忘錄編輯器 - 扁平化可排序列表
 *
 * 將一般項目、天氣季節、緊急聯絡整合到同一個列表
 */
interface MemoEditorProps {
  templateData: Record<string, unknown>
  onTemplateDataChange: (newData: Record<string, unknown>) => void
}

// 統一項目類型（用於扁平化顯示）
type UnifiedMemoItem = {
  type: 'item' | 'season' | 'info'
  id: string
  label: string // 顯示名稱
  enabled: boolean
  originalIndex: number // 原陣列中的索引
}

function MemoEditor({
  templateData,
  onTemplateDataChange,
}: MemoEditorProps) {
  // 取得備忘錄設定
  const memoSettings = templateData.memoSettings as {
    title?: string
    subtitle?: string
    items?: Array<{
      id: string
      category: string
      icon: string
      title: string
      titleZh?: string
      content: string
      enabled: boolean
    }>
    seasons?: Array<{
      season: string
      icon: string
      iconColor?: string
      months: string
      description: string
      enabled: boolean
    }>
    infoItems?: Array<{
      id: string
      icon: string
      iconColor?: string
      title: string
      content: string
      enabled: boolean
    }>
    // 儲存統一排序
    unifiedOrder?: string[] // 儲存所有項目的 ID，決定顯示順序
  } | undefined

  // 季節名稱對照
  const seasonLabels: Record<string, string> = {
    spring: '🌸 春季氣候',
    summer: '☀️ 夏季氣候',
    autumn: '🍂 秋季氣候',
    winter: '❄️ 冬季氣候',
  }

  // 建立統一列表
  const buildUnifiedList = (): UnifiedMemoItem[] => {
    const list: UnifiedMemoItem[] = []

    // 一般項目
    memoSettings?.items?.forEach((item, idx) => {
      list.push({
        type: 'item',
        id: item.id,
        label: item.titleZh || item.title,
        enabled: item.enabled,
        originalIndex: idx,
      })
    })

    // 季節項目（每個季節獨立）
    memoSettings?.seasons?.forEach((season, idx) => {
      list.push({
        type: 'season',
        id: `season-${season.season}`,
        label: seasonLabels[season.season] || season.season,
        enabled: season.enabled,
        originalIndex: idx,
      })
    })

    // 緊急聯絡項目
    memoSettings?.infoItems?.forEach((info, idx) => {
      list.push({
        type: 'info',
        id: info.id,
        label: `📞 ${info.title}`,
        enabled: info.enabled,
        originalIndex: idx,
      })
    })

    // 如果有儲存的排序，按照排序調整
    if (memoSettings?.unifiedOrder && memoSettings.unifiedOrder.length > 0) {
      const orderMap = new Map(memoSettings.unifiedOrder.map((id, idx) => [id, idx]))
      list.sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? 999
        const orderB = orderMap.get(b.id) ?? 999
        return orderA - orderB
      })
    }

    return list
  }

  const unifiedList = buildUnifiedList()

  // 切換項目啟用狀態
  const toggleItem = (item: UnifiedMemoItem) => {
    if (!memoSettings) return

    if (item.type === 'item') {
      const newItems = memoSettings.items?.map((i, idx) => {
        if (idx !== item.originalIndex) return i
        return { ...i, enabled: !i.enabled }
      })
      onTemplateDataChange({
        ...templateData,
        memoSettings: { ...memoSettings, items: newItems },
      })
    } else if (item.type === 'season') {
      const newSeasons = memoSettings.seasons?.map((s, idx) => {
        if (idx !== item.originalIndex) return s
        return { ...s, enabled: !s.enabled }
      })
      onTemplateDataChange({
        ...templateData,
        memoSettings: { ...memoSettings, seasons: newSeasons },
      })
    } else if (item.type === 'info') {
      const newInfoItems = memoSettings.infoItems?.map((i, idx) => {
        if (idx !== item.originalIndex) return i
        return { ...i, enabled: !i.enabled }
      })
      onTemplateDataChange({
        ...templateData,
        memoSettings: { ...memoSettings, infoItems: newInfoItems },
      })
    }
  }

  // 拖曳排序（統一列表）
  const { dragState, dragHandlers } = useDragSort({
    onReorder: (fromIndex, toIndex) => {
      const newList = [...unifiedList]
      const [removed] = newList.splice(fromIndex, 1)
      newList.splice(toIndex, 0, removed)

      // 儲存新的排序
      const newOrder = newList.map((item) => item.id)
      onTemplateDataChange({
        ...templateData,
        memoSettings: { ...memoSettings, unifiedOrder: newOrder },
      })
    },
  })

  // 國家選項（可選擇的國家）
  const countryOptions: { value: CountryCode; label: string }[] = [
    { value: 'JP', label: '🇯🇵 日本' },
    { value: 'TH', label: '🇹🇭 泰國' },
    { value: 'KR', label: '🇰🇷 韓國' },
    { value: 'VN', label: '🇻🇳 越南' },
    { value: 'CN', label: '🇨🇳 中國' },
    { value: 'HK', label: '🇭🇰 香港' },
    { value: 'OTHER', label: '🌍 其他' },
  ]

  // 當前選擇的國家代碼
  const currentCountryCode = (templateData.countryCode as CountryCode) || ''

  // 選擇國家後載入對應的備忘錄設定
  const handleCountryChange = (countryCode: CountryCode) => {
    const settings = getMemoSettingsByCountry(countryCode)
    onTemplateDataChange({
      ...templateData,
      countryCode,
      memoSettings: settings,
    })
  }

  // 如果沒有選擇國家或沒有 memoSettings，顯示國家選擇器
  if (!memoSettings || !memoSettings.items) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-morandi-secondary">
          選擇目的地國家以載入對應的旅遊提醒內容
        </p>
        <div className="space-y-2">
          <Label className="text-xs">選擇國家</Label>
          <Select
            value={currentCountryCode}
            onValueChange={(v) => handleCountryChange(v as CountryCode)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="選擇目的地國家..." />
            </SelectTrigger>
            <SelectContent>
              {countryOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-sm">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  // 計算頁數（統一列表中啟用的項目）
  const enabledItemCount = unifiedList.filter((i) => i.enabled).length
  const totalPages = Math.max(1, Math.ceil(enabledItemCount / 7)) // 每頁 7 個項目

  return (
    <div className="space-y-3">
      {/* 國家選擇 */}
      <div className="space-y-1.5">
        <Label className="text-xs">目的地國家</Label>
        <Select
          value={currentCountryCode}
          onValueChange={(v) => handleCountryChange(v as CountryCode)}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="選擇國家..." />
          </SelectTrigger>
          <SelectContent>
            {countryOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-sm">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 頁數預估 */}
      <div className="p-2 bg-morandi-gold/10 rounded text-xs text-morandi-primary">
        已選 <span className="font-bold">{enabledItemCount}</span> 項，
        預計 <span className="font-bold">{totalPages}</span> 頁
      </div>

      {/* 提示文字 */}
      <p className="text-[10px] text-morandi-muted">
        拖曳調整順序，勾選即顯示。每頁最多 7 項，超過自動分頁。
      </p>

      {/* 扁平化項目列表（一般項目 + 天氣季節 + 緊急聯絡） */}
      <div className="space-y-1">
        {unifiedList.map((item, idx) => (
          <label
            key={item.id}
            draggable
            onDragStart={(e) => dragHandlers.onDragStart(e, idx)}
            onDragOver={(e) => dragHandlers.onDragOver(e, idx)}
            onDragLeave={dragHandlers.onDragLeave}
            onDrop={(e) => dragHandlers.onDrop(e, idx)}
            onDragEnd={dragHandlers.onDragEnd}
            className={cn(
              'flex items-center gap-1.5 p-2 rounded border border-border/50 bg-morandi-container/10 cursor-pointer transition-all',
              !item.enabled && 'opacity-50',
              dragState.isDragging(idx) && 'opacity-30',
              dragState.isDragOver(idx) && 'border-morandi-gold border-dashed',
              // 不同類型可選擇不同背景色
              item.type === 'season' && 'bg-blue-50/30',
              item.type === 'info' && 'bg-amber-50/30'
            )}
          >
            {/* 拖曳手柄 */}
            <div className="cursor-grab active:cursor-grabbing text-morandi-muted hover:text-morandi-primary shrink-0">
              <GripVertical size={12} />
            </div>

            {/* 勾選框 */}
            <Checkbox
              checked={item.enabled}
              onCheckedChange={() => toggleItem(item)}
              className="shrink-0"
            />

            {/* 標題 */}
            <span className="flex-1 text-xs text-morandi-primary truncate">
              {item.label}
            </span>

            {/* 類型標籤（可選） */}
            {item.type === 'season' && (
              <span className="text-[10px] text-blue-500 shrink-0">氣候</span>
            )}
            {item.type === 'info' && (
              <span className="text-[10px] text-amber-600 shrink-0">聯絡</span>
            )}
          </label>
        ))}
      </div>

      <p className="text-[10px] text-morandi-muted">
        每頁最多 7 項，超過自動新增頁面。
      </p>
    </div>
  )
}

/**
 * 飯店編輯器
 *
 * 支援從行程自動帶入飯店，並辨識續住（連續住同一間飯店只算一間）
 */
interface HotelEditorProps {
  templateData: Record<string, unknown>
  onTemplateDataChange: (newData: Record<string, unknown>) => void
  currentHotelIndex?: number
}

function HotelEditor({
  templateData,
  onTemplateDataChange,
  currentHotelIndex = 0,
}: HotelEditorProps) {
  // 取得飯店列表
  const hotels = (templateData.hotels as HotelData[]) || []
  const dailyItineraries = (templateData.dailyItineraries as DailyItinerary[]) || []

  // 展開狀態
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  // 從行程表提取不重複的飯店（辨識續住）
  const extractHotelsFromItinerary = (): { name: string; nights: number; days: string }[] => {
    const result: { name: string; nights: number; days: string }[] = []
    let currentHotel = ''
    let nightCount = 0
    let startDay = 0

    dailyItineraries.forEach((day, idx) => {
      const hotelName = day.accommodation?.trim() || ''

      if (!hotelName) return

      if (hotelName === currentHotel) {
        // 續住，增加晚數
        nightCount++
      } else {
        // 新飯店，保存前一間
        if (currentHotel) {
          result.push({
            name: currentHotel,
            nights: nightCount,
            days: nightCount > 1 ? `Day ${startDay}-${startDay + nightCount - 1}` : `Day ${startDay}`,
          })
        }
        currentHotel = hotelName
        nightCount = 1
        startDay = idx + 1
      }
    })

    // 保存最後一間
    if (currentHotel) {
      result.push({
        name: currentHotel,
        nights: nightCount,
        days: nightCount > 1 ? `Day ${startDay}-${startDay + nightCount - 1}` : `Day ${startDay}`,
      })
    }

    return result
  }

  const extractedHotels = extractHotelsFromItinerary()

  // 從行程帶入飯店
  const importHotelsFromItinerary = () => {
    const newHotels: HotelData[] = extractedHotels.map((h, idx) => ({
      id: `hotel-${Date.now()}-${idx}`,
      nameZh: h.name,
      nameEn: '',
      location: '',
      description: '',
      tags: [],
      enabled: true,
    }))

    onTemplateDataChange({
      ...templateData,
      hotels: newHotels,
      currentHotelIndex: 0,
    })
  }

  // 新增飯店
  const addHotel = () => {
    const newHotel: HotelData = {
      id: `hotel-${Date.now()}`,
      nameZh: '新飯店',
      nameEn: '',
      location: '',
      description: '',
      tags: [],
      enabled: true,
    }
    onTemplateDataChange({
      ...templateData,
      hotels: [...hotels, newHotel],
    })
  }

  // 更新飯店欄位
  const updateHotelField = (hotelIndex: number, field: keyof HotelData, value: string | string[] | boolean) => {
    const newHotels = hotels.map((hotel, idx) => {
      if (idx !== hotelIndex) return hotel
      return { ...hotel, [field]: value }
    })
    onTemplateDataChange({
      ...templateData,
      hotels: newHotels,
    })
  }

  // 刪除飯店
  const deleteHotel = (hotelIndex: number) => {
    const newHotels = hotels.filter((_, idx) => idx !== hotelIndex)
    onTemplateDataChange({
      ...templateData,
      hotels: newHotels,
      currentHotelIndex: Math.min(currentHotelIndex, Math.max(0, newHotels.length - 1)),
    })
  }

  // 切換當前顯示的飯店
  const setCurrentHotel = (index: number) => {
    onTemplateDataChange({
      ...templateData,
      currentHotelIndex: index,
    })
  }

  // 計算啟用的飯店數量
  const enabledCount = hotels.filter(h => h.enabled !== false).length

  return (
    <div className="space-y-3">
      {/* 從行程帶入區塊 */}
      {extractedHotels.length > 0 && hotels.length === 0 && (
        <div className="p-3 bg-morandi-gold/10 border border-morandi-gold/30 rounded-lg">
          <p className="text-xs text-morandi-primary mb-2">
            偵測到行程中有 <span className="font-bold text-morandi-gold">{extractedHotels.length}</span> 間不同的飯店：
          </p>
          <ul className="text-[11px] text-morandi-secondary space-y-1 mb-3">
            {extractedHotels.map((h, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <Hotel size={12} className="text-morandi-gold shrink-0" />
                <span className="flex-1 truncate">{h.name}</span>
                <span className="text-morandi-muted text-[10px]">
                  {h.nights > 1 ? `${h.nights}晚` : ''} {h.days}
                </span>
              </li>
            ))}
          </ul>
          <Button
            size="sm"
            onClick={importHotelsFromItinerary}
            className="w-full gap-1.5 text-xs bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            <Download size={12} />
            從行程帶入飯店
          </Button>
        </div>
      )}

      {/* 已有飯店時的提示 */}
      {extractedHotels.length > 0 && hotels.length > 0 && (
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-morandi-secondary">
            已選擇 <span className="font-medium text-morandi-gold">{enabledCount}</span> / {hotels.length} 間飯店介紹
          </span>
          <button
            type="button"
            onClick={importHotelsFromItinerary}
            className="text-morandi-gold hover:underline"
          >
            重新帶入
          </button>
        </div>
      )}

      <p className="text-xs text-morandi-secondary">
        勾選要介紹的飯店，點擊名稱可編輯詳細資訊
      </p>

      {/* 飯店列表 */}
      <div className="space-y-2">
        {hotels.length === 0 ? (
          <div className="p-3 text-center text-xs text-morandi-muted border border-dashed border-border rounded">
            {extractedHotels.length > 0 ? '請點擊上方按鈕從行程帶入飯店' : '尚無飯店資料，請手動新增'}
          </div>
        ) : (
          hotels.map((hotel, idx) => (
            <div
              key={hotel.id}
              className={cn(
                'rounded border overflow-hidden transition-all',
                hotel.enabled === false
                  ? 'border-border/30 bg-morandi-container/5 opacity-60'
                  : idx === currentHotelIndex
                    ? 'border-morandi-gold bg-morandi-gold/5'
                    : 'border-border/50 bg-morandi-container/10'
              )}
            >
              {/* 飯店標題列 */}
              <div className="flex items-center gap-2 p-2">
                {/* 啟用/停用勾選 */}
                <button
                  type="button"
                  onClick={() => updateHotelField(idx, 'enabled', hotel.enabled === false ? true : false)}
                  className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                    hotel.enabled !== false
                      ? 'border-morandi-gold bg-morandi-gold text-white'
                      : 'border-border hover:border-morandi-gold'
                  )}
                >
                  {hotel.enabled !== false && <Check size={10} />}
                </button>

                {/* 飯店名稱（可點擊展開編輯） */}
                <button
                  type="button"
                  className={cn(
                    'flex-1 text-left text-xs font-medium truncate',
                    hotel.enabled !== false
                      ? 'text-morandi-primary hover:text-morandi-gold'
                      : 'text-morandi-muted'
                  )}
                  onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                >
                  <Hotel size={12} className="inline mr-1.5" />
                  {hotel.nameZh || '未命名飯店'}
                </button>

                {/* 目前顯示標記 */}
                {hotel.enabled !== false && idx === currentHotelIndex && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-morandi-gold/20 text-morandi-gold rounded shrink-0">
                    目前顯示
                  </span>
                )}

                {/* 設為目前顯示 */}
                {hotel.enabled !== false && idx !== currentHotelIndex && (
                  <button
                    type="button"
                    onClick={() => setCurrentHotel(idx)}
                    className="text-[9px] text-morandi-secondary hover:text-morandi-gold shrink-0"
                  >
                    切換
                  </button>
                )}

                {/* 展開/收合指示 */}
                {expandedIndex === idx ? (
                  <ChevronDown size={12} className="text-morandi-secondary shrink-0" />
                ) : (
                  <ChevronRight size={12} className="text-morandi-secondary shrink-0" />
                )}

                {/* 刪除按鈕 */}
                <button
                  type="button"
                  onClick={() => deleteHotel(idx)}
                  className="text-morandi-muted hover:text-morandi-red shrink-0 p-1"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* 展開的編輯區域 */}
              {expandedIndex === idx && (
                <div className="px-2 pb-2 space-y-2 border-t border-border/30 pt-2">
                  {/* 中文名稱 */}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-morandi-primary">飯店名稱（中文）</Label>
                    <Input
                      value={hotel.nameZh || ''}
                      onChange={(e) => updateHotelField(idx, 'nameZh', e.target.value)}
                      className="h-7 text-xs"
                      placeholder="例：星野集團 界 由布院"
                    />
                  </div>

                  {/* 英文名稱 */}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-morandi-primary">飯店名稱（英文）</Label>
                    <Input
                      value={hotel.nameEn || ''}
                      onChange={(e) => updateHotelField(idx, 'nameEn', e.target.value)}
                      className="h-7 text-xs"
                      placeholder="例：Hoshino Resorts KAI Yufuin"
                    />
                  </div>

                  {/* 地點 */}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-morandi-primary">地點</Label>
                    <Input
                      value={hotel.location || ''}
                      onChange={(e) => updateHotelField(idx, 'location', e.target.value)}
                      className="h-7 text-xs"
                      placeholder="例：大分縣由布市湯布院町川上"
                    />
                  </div>

                  {/* 描述 */}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-morandi-primary">飯店介紹</Label>
                    <Textarea
                      value={hotel.description || ''}
                      onChange={(e) => updateHotelField(idx, 'description', e.target.value)}
                      className="text-xs min-h-[80px] resize-none"
                      placeholder="飯店特色介紹..."
                    />
                  </div>

                  {/* 設施標籤 */}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-morandi-primary">設施標籤（逗號分隔）</Label>
                    <Input
                      value={(hotel.tags || []).join(', ')}
                      onChange={(e) => updateHotelField(idx, 'tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                      className="h-7 text-xs"
                      placeholder="例：露天溫泉, 懷石料理, 梯田景觀"
                    />
                  </div>

                  {/* 飯店圖片 */}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-morandi-primary">飯店圖片</Label>
                    <ImageUploader
                      value={hotel.image}
                      onChange={(url) => updateHotelField(idx, 'image', url || '')}
                      bucket="brochure-images"
                      filePrefix="hotel"
                      previewHeight="80px"
                      aspectRatio={16 / 9}
                      placeholder="上傳飯店圖片"
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 新增飯店按鈕 */}
      <Button
        variant="outline"
        size="sm"
        onClick={addHotel}
        className="w-full gap-1.5 text-xs"
      >
        <Plus size={12} />
        手動新增飯店
      </Button>

      <p className="text-[10px] text-morandi-muted">
        取消勾選可排除不需介紹的飯店（如過境酒店）。續住飯店已自動合併。
      </p>
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

        <div className="space-y-2">
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

/**
 * 分組類型選項
 */
const GROUP_TYPE_OPTIONS: { value: GroupType; label: string; icon: typeof Bus }[] = [
  { value: 'vehicle', label: '分車', icon: Bus },
  { value: 'table', label: '分桌', icon: Users },
]


/**
 * 分車/分桌編輯器
 */
interface VehicleEditorProps {
  templateData: Record<string, unknown>
  onTemplateDataChange: (newData: Record<string, unknown>) => void
  currentVehicleIndex?: number
  pageType?: 'vehicle' | 'table' // 從頁面類型決定預設模式
}

function VehicleEditor({
  templateData,
  onTemplateDataChange,
  currentVehicleIndex = 0,
  pageType = 'vehicle',
}: VehicleEditorProps) {
  const vehicles = (templateData.vehicles as VehicleData[]) || []
  const currentVehicle = vehicles[currentVehicleIndex]

  // 欄位顯示設定（預設：座位顯示、訂單不顯示、目的地顯示、司機不顯示）
  const columnSettings: VehicleColumnSettings = (templateData.vehicleColumnSettings as VehicleColumnSettings) || {
    showSeatNumber: true,
    showOrderCode: false,
    showDestination: true,
    showDriverInfo: false,
  }

  // 當前分組類型（優先從資料取得，否則從頁面類型決定）
  const groupType: GroupType = vehicles[0]?.groupType || pageType
  const isTable = groupType === 'table'

  // 展開的車輛/桌次（記錄哪些是展開的）
  const [expandedVehicles, setExpandedVehicles] = useState<Set<string>>(new Set(vehicles.map(v => v.id)))
  // 快速新增成員輸入（每個車輛一個）
  const [newMemberNames, setNewMemberNames] = useState<Record<string, string>>({})

  // 切換車輛展開狀態
  const toggleVehicleExpanded = (vehicleId: string) => {
    setExpandedVehicles(prev => {
      const next = new Set(prev)
      if (next.has(vehicleId)) {
        next.delete(vehicleId)
      } else {
        next.add(vehicleId)
      }
      return next
    })
  }

  // 更新欄位顯示設定
  const updateColumnSetting = (key: keyof VehicleColumnSettings, value: boolean) => {
    onTemplateDataChange({
      ...templateData,
      vehicleColumnSettings: {
        ...columnSettings,
        [key]: value,
      },
    })
  }

  // 切換分組類型
  const setGroupType = (newType: GroupType) => {
    // 更新所有車輛的 groupType
    const newVehicles = vehicles.map((v, idx) => ({
      ...v,
      groupType: newType,
      // 重新命名
      vehicleName: newType === 'table'
        ? `${idx + 1}桌`
        : `${idx + 1}號車`,
      // 清除不適用的欄位
      ...(newType === 'table' ? {
        vehicleType: undefined,
        licensePlate: undefined,
        driverPhone: undefined,
      } : {}),
    }))
    onTemplateDataChange({
      ...templateData,
      vehicles: newVehicles,
    })
  }

  // 新增車輛/桌次（可指定類型）
  const addVehicle = (type: GroupType = 'vehicle') => {
    const isNewTable = type === 'table'
    // 計算同類型的數量
    const sameTypeCount = vehicles.filter(v => v.groupType === type).length
    const newVehicle: VehicleData = {
      id: `vehicle-${Date.now()}`,
      groupType: type,
      vehicleName: isNewTable ? `${sameTypeCount + 1}桌` : `${sameTypeCount + 1}號車`,
      vehicleType: '',
      capacity: isNewTable ? 10 : 43,
      driverName: '',
      driverPhone: '',
      members: [],
    }
    onTemplateDataChange({
      ...templateData,
      vehicles: [...vehicles, newVehicle],
    })
    // 自動展開新增的項目
    setExpandedVehicles(prev => new Set([...prev, newVehicle.id]))
  }

  // 刪除車輛
  const deleteVehicle = (index: number) => {
    const newVehicles = vehicles.filter((_, i) => i !== index)
    const newIndex = Math.min(currentVehicleIndex, Math.max(0, newVehicles.length - 1))
    onTemplateDataChange({
      ...templateData,
      vehicles: newVehicles,
      currentVehiclePageIndex: newIndex,
    })
  }

  // 選擇車輛
  const selectVehicle = (index: number) => {
    onTemplateDataChange({
      ...templateData,
      currentVehiclePageIndex: index,
    })
  }

  // 更新車輛資料
  const updateVehicle = (field: keyof VehicleData, value: unknown) => {
    const newVehicles = vehicles.map((v, i) => {
      if (i !== currentVehicleIndex) return v
      return { ...v, [field]: value }
    })
    onTemplateDataChange({
      ...templateData,
      vehicles: newVehicles,
    })
  }

  // 新增成員（支援直接帶入姓名，指定車輛索引）
  const addMemberToVehicle = (vehicleIdx: number, name?: string) => {
    const vehicle = vehicles[vehicleIdx]
    if (!vehicle) return
    const memberName = name?.trim() || ''
    if (!memberName) return
    const newMember: VehicleMemberData = {
      id: `member-${Date.now()}`,
      chineseName: memberName,
      seatNumber: (vehicle.members?.length || 0) + 1,
    }
    const newVehicles = vehicles.map((v, i) => {
      if (i !== vehicleIdx) return v
      return { ...v, members: [...(v.members || []), newMember] }
    })
    onTemplateDataChange({ ...templateData, vehicles: newVehicles })
    setNewMemberNames(prev => ({ ...prev, [vehicle.id]: '' }))
  }

  // 批量新增成員（支援貼上多行，指定車輛索引）
  const addMembersBatchToVehicle = (vehicleIdx: number, text: string) => {
    const vehicle = vehicles[vehicleIdx]
    if (!vehicle) return
    const names = text.split(/[\n,，、]/).map(n => n.trim()).filter(n => n.length > 0)
    if (names.length === 0) return
    const existingCount = vehicle.members?.length || 0
    const newMembers = names.map((name, idx) => ({
      id: `member-${Date.now()}-${idx}`,
      chineseName: name,
      seatNumber: existingCount + idx + 1,
    }))
    const newVehicles = vehicles.map((v, i) => {
      if (i !== vehicleIdx) return v
      return { ...v, members: [...(v.members || []), ...newMembers] }
    })
    onTemplateDataChange({ ...templateData, vehicles: newVehicles })
    setNewMemberNames(prev => ({ ...prev, [vehicle.id]: '' }))
  }

  // 更新指定車輛的成員
  const updateMemberInVehicle = (vehicleIdx: number, memberIdx: number, field: keyof VehicleMemberData, value: unknown) => {
    const vehicle = vehicles[vehicleIdx]
    if (!vehicle) return
    const newMembers = vehicle.members.map((m, i) => {
      if (i !== memberIdx) return m
      return { ...m, [field]: value }
    })
    const newVehicles = vehicles.map((v, i) => {
      if (i !== vehicleIdx) return v
      return { ...v, members: newMembers }
    })
    onTemplateDataChange({ ...templateData, vehicles: newVehicles })
  }

  // 刪除指定車輛的成員
  const deleteMemberFromVehicle = (vehicleIdx: number, memberIdx: number) => {
    const vehicle = vehicles[vehicleIdx]
    if (!vehicle) return
    const newMembers = vehicle.members.filter((_, i) => i !== memberIdx)
    const newVehicles = vehicles.map((v, i) => {
      if (i !== vehicleIdx) return v
      return { ...v, members: newMembers }
    })
    onTemplateDataChange({ ...templateData, vehicles: newVehicles })
  }

  // 更新指定車輛的欄位
  const updateVehicleField = (vehicleIdx: number, field: keyof VehicleData, value: unknown) => {
    const newVehicles = vehicles.map((v, i) => {
      if (i !== vehicleIdx) return v
      return { ...v, [field]: value }
    })
    onTemplateDataChange({ ...templateData, vehicles: newVehicles })
  }

  // 更新成員
  const updateMember = (memberIndex: number, field: keyof VehicleMemberData, value: unknown) => {
    if (!currentVehicle) return
    const newMembers = currentVehicle.members.map((m, i) => {
      if (i !== memberIndex) return m
      return { ...m, [field]: value }
    })
    updateVehicle('members', newMembers)
  }

  // 刪除成員
  const deleteMember = (memberIndex: number) => {
    if (!currentVehicle) return
    const newMembers = currentVehicle.members.filter((_, i) => i !== memberIndex)
    updateVehicle('members', newMembers)
  }

  // 拖曳排序成員
  const { dragState, dragHandlers } = useDragSort({
    onReorder: (fromIndex, toIndex) => {
      if (!currentVehicle) return
      const newMembers = [...currentVehicle.members]
      const [removed] = newMembers.splice(fromIndex, 1)
      newMembers.splice(toIndex, 0, removed)
      // 重新編號座位
      const renumberedMembers = newMembers.map((m, i) => ({
        ...m,
        seatNumber: i + 1,
      }))
      updateVehicle('members', renumberedMembers)
    },
  })

  // 沒有車輛時顯示新增按鈕
  if (vehicles.length === 0) {
    return (
      <div className="space-y-3">
        {/* 類型選擇 */}
        <div className="space-y-2">
          <Label className="text-xs">選擇類型</Label>
          <div className="flex gap-2">
            {GROUP_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  // 新增第一個時設定類型
                  const newVehicle: VehicleData = {
                    id: `vehicle-${Date.now()}`,
                    groupType: opt.value,
                    vehicleName: opt.value === 'table' ? '1桌' : '1號車',
                    vehicleType: opt.value === 'table' ? '10人桌' : '43人座大巴',
                    capacity: opt.value === 'table' ? 10 : 43,
                    driverName: '',
                    driverPhone: '',
                    members: [],
                  }
                  onTemplateDataChange({
                    ...templateData,
                    vehicles: [newVehicle],
                    currentVehiclePageIndex: 0,
                  })
                }}
                className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border border-border hover:border-morandi-gold hover:bg-morandi-gold/5 transition-colors"
              >
                <opt.icon size={16} className="text-morandi-gold" />
                <span className="text-sm">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 排版設定 */}
      <div className="rounded border border-border/50 bg-morandi-container/10 p-2.5 space-y-2">
        <Label className="text-xs text-morandi-primary">排版設定</Label>
        {/* 排版模式切換 */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => {
              onTemplateDataChange({
                ...templateData,
                vehicleColumnSettings: { ...columnSettings, layoutMode: 'list' },
              })
            }}
            className={cn(
              'flex-1 px-2 py-1.5 text-xs rounded border transition-colors',
              (columnSettings.layoutMode || 'list') === 'list'
                ? 'bg-morandi-gold text-white border-morandi-gold'
                : 'bg-white border-border hover:border-morandi-gold'
            )}
          >
            列表式
          </button>
          <button
            type="button"
            onClick={() => {
              onTemplateDataChange({
                ...templateData,
                vehicleColumnSettings: { ...columnSettings, layoutMode: 'grid' },
              })
            }}
            className={cn(
              'flex-1 px-2 py-1.5 text-xs rounded border transition-colors',
              columnSettings.layoutMode === 'grid'
                ? 'bg-morandi-gold text-white border-morandi-gold'
                : 'bg-white border-border hover:border-morandi-gold'
            )}
          >
            表格式
          </button>
        </div>
        {/* 列表模式：每行人數設定 */}
        {(columnSettings.layoutMode || 'list') === 'list' && (
          <div className="flex items-center gap-2">
            <span className="text-xs">每行人數</span>
            <Select
              value={String(columnSettings.columnsPerRow || 2)}
              onValueChange={(v) => {
                onTemplateDataChange({
                  ...templateData,
                  vehicleColumnSettings: {
                    ...columnSettings,
                    columnsPerRow: Number(v) as 1 | 2 | 3,
                  },
                })
              }}
            >
              <SelectTrigger className="h-7 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 人</SelectItem>
                <SelectItem value="2">2 人</SelectItem>
                <SelectItem value="3">3 人</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {!isTable && (columnSettings.layoutMode || 'list') === 'list' && (
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={columnSettings.showDriverInfo}
              onCheckedChange={(checked) => updateColumnSetting('showDriverInfo', !!checked)}
            />
            <span className="text-xs">顯示司機資訊</span>
          </label>
        )}
      </div>

      {/* 車輛列表 */}
      {(
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Bus size={14} className="text-morandi-secondary" />
            <span className="text-xs font-medium text-morandi-secondary">車輛</span>
          </div>
          {vehicles.map((vehicle, vehicleIdx) => {
            if (vehicle.groupType === 'table') return null
            const isExpanded = expandedVehicles.has(vehicle.id)
            const memberCount = vehicle.members?.length || 0
            const inputValue = newMemberNames[vehicle.id] || ''
            const vehicleNumber = vehicles.slice(0, vehicleIdx + 1).filter(v => v.groupType !== 'table').length

            return (
              <div key={vehicle.id} className="rounded-lg border border-border/50 overflow-hidden">
                <div className="flex items-center gap-2 p-2 bg-morandi-container/20">
                  <button type="button" onClick={() => toggleVehicleExpanded(vehicle.id)} className="p-0.5 hover:bg-morandi-container/50 rounded">
                    {isExpanded ? <ChevronDown size={14} className="text-morandi-secondary" /> : <ChevronRight size={14} className="text-morandi-secondary" />}
                  </button>
                  <Input
                    value={vehicle.vehicleName || ''}
                    onChange={(e) => updateVehicleField(vehicleIdx, 'vehicleName', e.target.value)}
                    placeholder={`${vehicleNumber}號車`}
                    className="h-7 text-xs font-medium flex-1"
                  />
                  <span className="text-[10px] text-morandi-secondary whitespace-nowrap">{memberCount} 人</span>
                  <button type="button" onClick={() => deleteVehicle(vehicleIdx)} className="p-1 rounded text-morandi-muted hover:text-morandi-red hover:bg-morandi-red/10 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
                {isExpanded && (
                  <div className="p-2 space-y-2 border-t border-border/30">
                    <div className="flex gap-2">
                      <Input value={vehicle.vehicleType || ''} onChange={(e) => updateVehicleField(vehicleIdx, 'vehicleType', e.target.value)} placeholder="車型（選填）" className="h-7 text-xs flex-1" />
                      <Input value={vehicle.notes || ''} onChange={(e) => updateVehicleField(vehicleIdx, 'notes', e.target.value)} placeholder="備註" className="h-7 text-xs flex-1" />
                    </div>
                    {vehicle.members?.map((member, memberIdx) => (
                      <div key={member.id} className="flex items-center gap-1.5 p-1.5 rounded bg-morandi-container/10">
                        <span className="text-[10px] text-morandi-secondary w-5 text-center">{memberIdx + 1}.</span>
                        <Input value={member.chineseName || ''} onChange={(e) => updateMemberInVehicle(vehicleIdx, memberIdx, 'chineseName', e.target.value)} placeholder="姓名" className="flex-1 h-6 text-xs" />
                        <button type="button" onClick={() => deleteMemberFromVehicle(vehicleIdx, memberIdx)} className="p-1 rounded text-morandi-muted hover:text-morandi-red hover:bg-morandi-red/10 transition-colors"><Trash2 size={10} /></button>
                      </div>
                    ))}
                    <div className="flex gap-1">
                      <Input
                        value={inputValue}
                        onChange={(e) => setNewMemberNames(prev => ({ ...prev, [vehicle.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter' && inputValue.trim()) { if (inputValue.includes('\n') || inputValue.includes(',') || inputValue.includes('，')) { addMembersBatchToVehicle(vehicleIdx, inputValue) } else { addMemberToVehicle(vehicleIdx, inputValue) } } }}
                        onPaste={(e) => { const text = e.clipboardData.getData('text'); if (text.includes('\n')) { e.preventDefault(); addMembersBatchToVehicle(vehicleIdx, text) } }}
                        placeholder="輸入姓名或貼上名單..."
                        className="h-7 text-xs flex-1"
                      />
                      <Button variant="outline" size="sm" onClick={() => { if (inputValue.includes('\n') || inputValue.includes(',')) { addMembersBatchToVehicle(vehicleIdx, inputValue) } else { addMemberToVehicle(vehicleIdx, inputValue) } }} disabled={!inputValue.trim()} className="h-7 px-2"><Plus size={14} /></Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          <Button variant="outline" size="sm" onClick={() => addVehicle('vehicle')} className="w-full h-7 text-xs gap-1.5 border-dashed">
            <Plus size={12} /> 新增車
          </Button>
        </div>
      )}

      {/* 桌次列表 */}
      {(
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-morandi-secondary" />
            <span className="text-xs font-medium text-morandi-secondary">桌次</span>
          </div>
          {vehicles.map((vehicle, vehicleIdx) => {
            if (vehicle.groupType !== 'table') return null
            const isExpanded = expandedVehicles.has(vehicle.id)
            const memberCount = vehicle.members?.length || 0
            const inputValue = newMemberNames[vehicle.id] || ''
            const tableNumber = vehicles.slice(0, vehicleIdx + 1).filter(v => v.groupType === 'table').length

            return (
              <div key={vehicle.id} className="rounded-lg border border-border/50 overflow-hidden">
                <div className="flex items-center gap-2 p-2 bg-morandi-container/20">
                  <button type="button" onClick={() => toggleVehicleExpanded(vehicle.id)} className="p-0.5 hover:bg-morandi-container/50 rounded">
                    {isExpanded ? <ChevronDown size={14} className="text-morandi-secondary" /> : <ChevronRight size={14} className="text-morandi-secondary" />}
                  </button>
                  <Input
                    value={vehicle.vehicleName || ''}
                    onChange={(e) => updateVehicleField(vehicleIdx, 'vehicleName', e.target.value)}
                    placeholder={`${tableNumber}桌`}
                    className="h-7 text-xs font-medium flex-1"
                  />
                  <span className="text-[10px] text-morandi-secondary whitespace-nowrap">{memberCount} 人</span>
                  <button type="button" onClick={() => deleteVehicle(vehicleIdx)} className="p-1 rounded text-morandi-muted hover:text-morandi-red hover:bg-morandi-red/10 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
                {isExpanded && (
                  <div className="p-2 space-y-2 border-t border-border/30">
                    <div className="flex gap-2">
                      <Input value={vehicle.vehicleType || ''} onChange={(e) => updateVehicleField(vehicleIdx, 'vehicleType', e.target.value)} placeholder="桌型（選填）" className="h-7 text-xs flex-1" />
                      <Input value={vehicle.notes || ''} onChange={(e) => updateVehicleField(vehicleIdx, 'notes', e.target.value)} placeholder="備註" className="h-7 text-xs flex-1" />
                    </div>
                    {vehicle.members?.map((member, memberIdx) => (
                      <div key={member.id} className="flex items-center gap-1.5 p-1.5 rounded bg-morandi-container/10">
                        <span className="text-[10px] text-morandi-secondary w-5 text-center">{memberIdx + 1}.</span>
                        <Input value={member.chineseName || ''} onChange={(e) => updateMemberInVehicle(vehicleIdx, memberIdx, 'chineseName', e.target.value)} placeholder="姓名" className="flex-1 h-6 text-xs" />
                        <button type="button" onClick={() => deleteMemberFromVehicle(vehicleIdx, memberIdx)} className="p-1 rounded text-morandi-muted hover:text-morandi-red hover:bg-morandi-red/10 transition-colors"><Trash2 size={10} /></button>
                      </div>
                    ))}
                    <div className="flex gap-1">
                      <Input
                        value={inputValue}
                        onChange={(e) => setNewMemberNames(prev => ({ ...prev, [vehicle.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter' && inputValue.trim()) { if (inputValue.includes('\n') || inputValue.includes(',') || inputValue.includes('，')) { addMembersBatchToVehicle(vehicleIdx, inputValue) } else { addMemberToVehicle(vehicleIdx, inputValue) } } }}
                        onPaste={(e) => { const text = e.clipboardData.getData('text'); if (text.includes('\n')) { e.preventDefault(); addMembersBatchToVehicle(vehicleIdx, text) } }}
                        placeholder="輸入姓名或貼上名單..."
                        className="h-7 text-xs flex-1"
                      />
                      <Button variant="outline" size="sm" onClick={() => { if (inputValue.includes('\n') || inputValue.includes(',')) { addMembersBatchToVehicle(vehicleIdx, inputValue) } else { addMemberToVehicle(vehicleIdx, inputValue) } }} disabled={!inputValue.trim()} className="h-7 px-2"><Plus size={14} /></Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          <Button variant="outline" size="sm" onClick={() => addVehicle('table')} className="w-full h-7 text-xs gap-1.5 border-dashed">
            <Plus size={12} /> 新增桌
          </Button>
        </div>
      )}

    </div>
  )
}
