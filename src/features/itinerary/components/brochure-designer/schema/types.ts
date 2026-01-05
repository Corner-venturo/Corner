/**
 * Brochure Schema Types
 * Single Source of Truth 架構的核心類型定義
 *
 * 設計原則：
 * 1. 資料快照 + 來源參考 + 手動刷新
 * 2. 預設整體編輯 + 可選深度編輯 (styleOverrides)
 * 3. Content → Layout 單向資料流
 */

import type { CanvasElement } from '../canvas-editor/types'
import type { BrochureCoverData } from '../types'
import type { Itinerary, DailyItineraryDay } from '@/stores/types'

// ============================================================================
// 頁面類型定義
// ============================================================================

/** 頁面模板類型 */
export type PageTemplateType =
  | 'cover'              // 封面
  | 'blank'              // 空白頁
  | 'contents'           // 目錄
  | 'overview-left'      // 總攬左
  | 'overview-right'     // 總攬右
  | 'day-left'           // 每日行程左
  | 'day-right'          // 每日行程右
  | 'accommodation-left' // 住宿左
  | 'accommodation-right'// 住宿右
  | 'custom'             // 自訂頁面

// ============================================================================
// 資料快照類型
// ============================================================================

/** 封面資料快照 */
export interface CoverDataSnapshot {
  clientName?: string
  country?: string
  city?: string
  airportCode?: string
  travelDates?: string
  coverImage?: string
  companyName?: string
  emergencyContact?: string
  emergencyEmail?: string
  overviewImage?: string
}

/** 每日行程資料快照 */
export interface DayDataSnapshot {
  dayIndex: number
  title?: string
  highlight?: string
  activities?: Array<{
    title: string
    description?: string
    image?: string
  }>
  images?: Array<string | { url: string; caption?: string }>
}

/** 住宿資料快照 */
export interface AccommodationSnapshot {
  name: string
  image?: string
  address?: string
  phone?: string
  checkIn?: string
  checkOut?: string
  days?: number[]
}

/** 航班資料快照 */
export interface FlightDataSnapshot {
  outbound?: {
    airline?: string
    flightNumber?: string
    departureTime?: string
    departureAirport?: string
    arrivalTime?: string
    arrivalAirport?: string
  }
  return?: {
    airline?: string
    flightNumber?: string
    departureTime?: string
    departureAirport?: string
    arrivalTime?: string
    arrivalAirport?: string
  }
}

/** 領隊/集合資料快照 */
export interface MeetingDataSnapshot {
  leaderName?: string
  leaderPhone?: string
  meetingTime?: string
  meetingLocation?: string
  departureDate?: string
}

// ============================================================================
// 頁面 Schema
// ============================================================================

/** 頁面資料快照 - 根據頁面類型包含不同資料 */
export interface PageDataSnapshot {
  // 封面/目錄/總攬共用
  cover?: CoverDataSnapshot

  // 每日行程專用
  day?: DayDataSnapshot

  // 住宿專用
  accommodations?: AccommodationSnapshot[]

  // 總攬專用
  flight?: FlightDataSnapshot
  meeting?: MeetingDataSnapshot

  // 行程總覽專用
  dailyOverview?: Array<{
    dayIndex: number
    title: string
    activities: string[]
  }>
}

/** 來源參考資訊 */
export interface SourceReference {
  /** 關聯的行程表 ID */
  itineraryId: string

  /** 最後同步時間 */
  lastSyncAt: string

  /** 同步版本號（用於偵測變更） */
  syncVersion?: number
}

/** 元素覆寫 - 用戶對特定元素的樣式修改 */
export interface ElementOverride {
  /** 要覆寫的屬性 */
  x?: number
  y?: number
  width?: number
  height?: number
  rotation?: number
  opacity?: number

  /** 文字專用覆寫 */
  content?: string
  style?: {
    fontSize?: number
    fontWeight?: string
    color?: string
    textAlign?: 'left' | 'center' | 'right'
  }

  /** 圖片專用覆寫 */
  src?: string
  objectFit?: 'cover' | 'contain' | 'fill'

  /** 形狀專用覆寫 */
  fill?: string
  stroke?: string
  strokeWidth?: number
}

/** 頁面 Schema - 單一頁面的完整定義 */
export interface PageSchema {
  /** 頁面唯一識別碼 */
  id: string

  /** 頁面模板類型 */
  type: PageTemplateType

  /** 頁面顯示名稱 */
  name: string

  /** 頁面順序（用於排序） */
  order: number

  /** 資料快照 - 從行程表複製的資料 */
  dataSnapshot: PageDataSnapshot

  /** 來源參考 - 可選，用於手動刷新 */
  sourceRef?: SourceReference

  /**
   * 元素列表 - 由 generateElements 生成
   * 這是 Schema 驅動渲染的核心
   */
  elements: CanvasElement[]

  /**
   * 元素覆寫 - 用戶對特定元素的修改
   * Key 為元素的 name（如 '封面背景圖'、'城市'）
   * 合併時 override 優先於原始元素
   */
  overrides: Record<string, ElementOverride>

  /** 頁面是否鎖定（鎖定後不可編輯） */
  locked: boolean

  /** 頁面是否可見 */
  visible: boolean
}

// ============================================================================
// 手冊 Schema
// ============================================================================

/** 手冊設定 */
export interface BrochureSettings {
  /** 頁面尺寸 */
  pageSize: {
    width: number   // A5: 559
    height: number  // A5: 794
  }

  /** 出血區域 */
  bleed: {
    top: number
    right: number
    bottom: number
    left: number
  }

  /** 當前使用的主題 ID */
  themeId?: string

  /** 主題設定（快取用，切換主題時會更新） */
  theme?: {
    primaryColor?: string
    accentColor?: string
    fontFamily?: string
  }
}

/** 手冊 Schema - 整本手冊的完整定義 */
export interface BrochureSchema {
  /** 手冊唯一識別碼 */
  id: string

  /** 手冊名稱 */
  name: string

  /** 關聯的行程表 ID */
  itineraryId?: string

  /** 手冊設定 */
  settings: BrochureSettings

  /** 頁面列表 */
  pages: PageSchema[]

  /** 當前選中的頁面 ID */
  currentPageId?: string

  /** 建立時間 */
  createdAt: string

  /** 更新時間 */
  updatedAt: string

  /** 版本號 */
  version: number
}

// ============================================================================
// 預設值
// ============================================================================

/** A5 尺寸預設值 (px @ 96 DPI) */
export const DEFAULT_PAGE_SIZE = {
  width: 559,
  height: 794,
}

/** 預設出血設定 */
export const DEFAULT_BLEED = {
  top: 3,
  right: 3,
  bottom: 3,
  left: 3,
}

/** 預設手冊設定 */
export const DEFAULT_BROCHURE_SETTINGS: BrochureSettings = {
  pageSize: DEFAULT_PAGE_SIZE,
  bleed: DEFAULT_BLEED,
  themeId: 'classic',
  theme: {
    primaryColor: '#0d9488', // teal-600
    accentColor: '#f97316',  // orange-500
    fontFamily: 'Noto Sans TC',
  },
}

// ============================================================================
// 工具類型
// ============================================================================

/** 從 Itinerary 提取 BrochureCoverData 的輔助類型 */
export type CoverDataFromItinerary = Pick<
  Itinerary,
  | 'title'
  | 'subtitle'
  | 'country'
  | 'city'
  | 'departure_date'
  | 'tour_code'
  | 'cover_image'
  | 'outbound_flight'
  | 'return_flight'
  | 'leader'
  | 'meeting_info'
>

/** 生成元素的選項 */
export interface GenerateElementsOptions {
  /** 頁面類型 */
  pageType: PageTemplateType

  /** 資料快照 */
  dataSnapshot: PageDataSnapshot

  /** 元素覆寫（可選） */
  overrides?: Record<string, ElementOverride>

  /** 頁面設定 */
  settings?: BrochureSettings

  /** 主題 ID（如提供則使用主題系統生成，否則使用舊版硬編碼版面） */
  themeId?: string
}

/** Schema 變更事件類型 */
export type SchemaChangeType =
  | 'page-add'
  | 'page-remove'
  | 'page-update'
  | 'page-reorder'
  | 'element-update'
  | 'override-update'
  | 'refresh-from-source'
