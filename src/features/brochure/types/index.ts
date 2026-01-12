/**
 * Brochure Types
 * 電子手冊設計器型別定義
 */

import type { CanvasPage, CanvasElement } from '@/features/designer/components/types'
import type { TemplateData, MemoSettings, HotelData, AttractionData, CountryCode } from '@/features/designer/templates/definitions/types'
import type { Json } from '@/lib/supabase/types'

/**
 * 頁面類型
 * cover: 封面, toc: 目錄, itinerary: 行程總覽
 * daily-N: 每日行程, memo-N: 備忘錄, hotel-N: 飯店介紹, attraction-N: 景點介紹
 */
export type PageType =
  | 'cover'
  | 'toc'
  | 'itinerary'
  | `daily-${number}`
  | `memo-${number}`
  | `hotel-${number}`
  | `attraction-${number}`

/**
 * 草稿資料結構
 */
export interface BrochureDraft {
  id: string
  name: string
  updated_at: string
  style_id: string
  template_data: Json
  trip_days: number
  memo_settings: Json
  hotels: Json
  attractions: Json
  country_code: string | null
  edited_elements: Json
}

/**
 * 手冊狀態
 */
export interface BrochureState {
  // 風格與頁面
  selectedStyleId: string | null
  currentPageType: PageType
  templateData: TemplateData | null
  pages: Record<string, CanvasPage | null>

  // 元素編輯
  selectedElementId: string | null
  editedElements: Record<string, CanvasElement>

  // UI 狀態
  showPositionEditor: boolean
  isLoading: boolean
  isUploading: boolean
  expandedDays: number[]
  tripDays: number
  showPrintPreview: boolean
  printImages: string[]
  isGeneratingPrint: boolean
  showPageDrawer: boolean

  // 備忘錄
  memoSettings: MemoSettings | null
  selectedCountryCode: CountryCode

  // 飯店與景點
  hotels: HotelData[]
  attractions: AttractionData[]
  uploadingHotelIndex: number | null
  uploadingAttractionIndex: number | null
  uploadingDayIndex: number | null

  // 草稿
  isSavingDraft: boolean
  lastSavedAt: Date | null
  draftId: string | null
  isLoadedFromDraft: boolean
  pendingDraft: BrochureDraft | null

  // 歷史 (Undo)
  templateDataHistory: TemplateData[]

  // 拖拉
  draggingTimelineItem: { dayIndex: number; itemIndex: number } | null
}

/**
 * 頁面類型判斷工具
 */
export function isDailyPage(pageType: PageType): boolean {
  return pageType.startsWith('daily-')
}

export function isMemoPage(pageType: PageType): boolean {
  return pageType.startsWith('memo-')
}

export function isHotelPage(pageType: PageType): boolean {
  return pageType.startsWith('hotel-')
}

export function isAttractionPage(pageType: PageType): boolean {
  return pageType.startsWith('attraction-')
}

export function getDayIndex(pageType: PageType): number {
  if (!isDailyPage(pageType)) return -1
  return parseInt(pageType.replace('daily-', ''), 10)
}

export function getMemoPageIndex(pageType: PageType): number {
  if (!isMemoPage(pageType)) return -1
  return parseInt(pageType.replace('memo-', ''), 10)
}

export function getHotelIndex(pageType: PageType): number {
  if (!isHotelPage(pageType)) return -1
  return parseInt(pageType.replace('hotel-', ''), 10)
}

export function getAttractionPageIndex(pageType: PageType): number {
  if (!isAttractionPage(pageType)) return -1
  return parseInt(pageType.replace('attraction-', ''), 10)
}

/**
 * 餐食圖標選項
 */
export const MEAL_ICON_OPTIONS = [
  { value: 'bakery_dining', label: '🥐 麵包' },
  { value: 'coffee', label: '☕ 咖啡' },
  { value: 'restaurant', label: '🍽️ 餐廳' },
  { value: 'ramen_dining', label: '🍜 拉麵' },
  { value: 'bento', label: '🍱 便當' },
  { value: 'rice_bowl', label: '🍚 飯' },
  { value: 'soup_kitchen', label: '🍲 湯' },
  { value: 'skillet', label: '🍳 鍋' },
  { value: 'dinner_dining', label: '🍖 晚餐' },
  { value: 'flight_class', label: '✈️ 機上' },
] as const

export type MealIconOption = (typeof MEAL_ICON_OPTIONS)[number]
