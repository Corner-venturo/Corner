/**
 * TourPageData - 行程展示頁面統一類型
 *
 * 解決技術債：多個 section 組件各自定義 TourDisplayData
 * 此類型整合 TourFormData 並加入展示層所需的欄位
 *
 * 🔧 技術債說明：
 * - 39 個 section 元件各自定義 TourDisplayData
 * - 逐一修改所有元件改用此統一類型需要大量工作
 * - 目前使用 `& Record<string, unknown>` 保持相容性
 * - TODO: 逐步將 section 元件改用此統一類型
 */

// 從 tour-form 統一匯出基礎類型
export type {
  FlightInfo,
  Feature,
  FocusCard,
  DailyItinerary,
  Activity,
  Meals,
  MeetingPoint,
  PricingDetails,
  PriceTier,
  FAQ,
  HeroStatCard,
  ImagePositionSettings,
  CoverStyleType,
  FlightStyleType,
  ItineraryStyleType,
  FeaturesStyleType,
} from '@/components/editor/tour-form/types'

// 從 stores 匯出共用類型
export type {
  LeaderInfo,
  HotelInfo,
} from '@/stores/types/tour.types'

import type {
  FlightInfo,
  Feature,
  FocusCard,
  DailyItinerary,
  MeetingPoint,
  PricingDetails,
  PriceTier,
  FAQ,
  HeroStatCard,
  ImagePositionSettings,
  CoverStyleType,
  FlightStyleType,
  ItineraryStyleType,
  FeaturesStyleType,
  TourCountry,
} from '@/components/editor/tour-form/types'

import type { LeaderInfo, HotelInfo } from '@/stores/types/tour.types'

/**
 * TourPageData - TourPage 和 TourPreview 使用的資料結構
 *
 * 大部分欄位為可選，因為：
 * 1. 資料可能來自不同來源（編輯器、API、資料庫）
 * 2. 各 section 只需要部分欄位
 * 3. 向後相容現有程式碼
 */
export interface TourPageData {
  // === 基本資訊 ===
  tagline?: string
  title?: string
  subtitle?: string
  description?: string
  country?: string
  city?: string
  countries?: TourCountry[]
  departureDate?: string
  tourCode?: string

  // === 封面 ===
  coverImage?: string | null
  coverImagePosition?: ImagePositionSettings
  coverStyle?: CoverStyleType
  heroStatCard2?: HeroStatCard
  heroStatCard3?: HeroStatCard
  price?: string | null
  priceNote?: string | null

  // === 航班 ===
  outboundFlight?: FlightInfo | null
  returnFlight?: FlightInfo | null
  flightStyle?: FlightStyleType

  // === 行程特色 ===
  features?: Feature[]
  featuresStyle?: FeaturesStyleType
  showFeatures?: boolean
  focusCards?: FocusCard[]

  // === 每日行程 ===
  dailyItinerary?: DailyItinerary[]
  itineraryStyle?: ItineraryStyleType
  itinerarySubtitle?: string

  // === 領隊與集合 ===
  leader?: LeaderInfo | null
  meetingInfo?: MeetingPoint | null // 單一集合點（向後相容）
  meetingPoints?: MeetingPoint[] // 多集合點
  showLeaderMeeting?: boolean

  // === 飯店 ===
  hotels?: HotelInfo[]
  showHotels?: boolean

  // === 價格 ===
  pricingDetails?: PricingDetails
  showPricingDetails?: boolean
  priceTiers?: PriceTier[] | null
  showPriceTiers?: boolean

  // === FAQ ===
  faqs?: FAQ[] | null
  showFaqs?: boolean

  // === 須知與政策 ===
  notices?: string[] | null
  showNotices?: boolean
  cancellationPolicy?: string[] | null
  showCancellationPolicy?: boolean
}

/**
 * TourPageProps - TourPage 組件的 props
 *
 * @remarks
 * 🔧 技術債：data 使用 any（待統一 39 個 section 元件的類型後改用 TourPageData）
 *
 * 原因：39 個 section 元件各自定義不同的 TourDisplayData
 * - TourHeroSection 需要 title: string (必填)
 * - TourFlightSection 需要不同的 FlightInfo 格式
 * - 其他元件也有各自的類型要求
 *
 * 解決方案：逐步將所有 section 改用統一的 TourPageData
 * 追蹤：TODO.md「Tour Section 類型統一」
 *
 * @see TourPageData 完整欄位定義（供參考）
 */
export interface TourPageProps {
  /** 技術債：待統一 section 類型後改用 TourPageData */
  data: any
  isPreview?: boolean
  viewMode?: 'desktop' | 'mobile'
}

/**
 * TourPreviewProps - TourPreview 組件的 props
 * @see TourPageProps
 */
export interface TourPreviewProps {
  /** 技術債：待統一 section 類型後改用 TourPageData */
  data: any
  viewMode?: 'desktop' | 'mobile'
}
