export interface FlightInfo {
  airline: string
  flightNumber: string
  departureAirport: string
  departureTime: string
  departureDate?: string // 與 stores/types.ts 一致，出發日期為可選
  arrivalAirport: string
  arrivalTime: string
  duration?: string
}

export interface Feature {
  icon: string
  title: string
  description: string
  images?: string[] // 圖片陣列（支援任意數量）
}

export interface FocusCard {
  title: string
  src: string
}

// 圖片位置設定（支援位置+縮放）
export interface ImagePositionSettings {
  x: number      // 水平位置 0-100 (百分比，50 = 置中)
  y: number      // 垂直位置 0-100 (百分比，50 = 置中)
  scale: number  // 縮放比例 1-3 (1 = 原始大小)
}

export interface Activity {
  icon: string
  title: string
  description: string
  image?: string
  imagePosition?: string | ImagePositionSettings // 圖片顯示位置（支援舊字串格式和新物件格式）
  attraction_id?: string // 關聯的景點 ID（從景點選擇器選擇時會設定）
}

export interface Meals {
  breakfast: string
  lunch: string
  dinner: string
}

// 每日圖片（支援位置調整）
export interface DailyImage {
  url: string
  position?: string // object-position 值，如 "center", "center top", "center 30%"
}

export interface DailyItinerary {
  dayLabel: string
  date: string
  title: string
  highlight?: string
  description?: string
  activities: Activity[]
  recommendations: string[]
  meals: Meals
  accommodation: string
  images?: (string | DailyImage)[] // 支援舊格式 string 和新格式 DailyImage
  isAlternative?: boolean // 是否為建議方案（替代行程），如 Day 3-B, Day 3-C
}

export interface LeaderInfo {
  name: string
  domesticPhone: string
  overseasPhone: string
}

export interface MeetingPoint {
  time: string
  location: string
}

export interface HotelInfo {
  name: string
  description: string
  image?: string
}

// 費用包含/不含項目
export interface PricingItem {
  text: string // 項目文字
  included: boolean // 是否包含
}

// 詳細團費資訊
export interface PricingDetails {
  show_pricing_details?: boolean // 是否顯示詳細團費
  insurance_amount?: '250' | '300' | '500' | string // 旅遊責任險金額（萬元），可選擇或自訂
  included_items: PricingItem[] // 費用包含項目
  excluded_items: PricingItem[] // 費用不含項目
  notes: string[] // 注意事項
}

// 價格方案（如 4人包團、6人包團、8人包團）
export interface PriceTier {
  label: string // 如「4人包團」、「6人包團」
  sublabel?: string // 如「每人」
  price: string // 如「34,500」
  priceNote?: string // 如「起」
  addon?: string // 如「加購1日包車 / 每人+NT$900」
}

// 常見問題
export interface FAQ {
  question: string // 問題
  answer: string // 答案
}

export interface TourCountry {
  country_id: string
  country_name: string
  country_code?: string
  main_city_id?: string
  main_city_name?: string
  is_primary: boolean // 是否為主要國家
}

export type CoverStyleType = 'original' | 'gemini'

export interface TourFormData {
  tagline: string
  title: string
  subtitle: string
  description: string
  country: string
  city: string
  countries?: TourCountry[] // 新增：行程涵蓋的國家清單
  departureDate: string
  tourCode: string
  coverImage?: string
  coverImagePosition?: ImagePositionSettings // 封面圖片位置設定
  coverStyle?: CoverStyleType // 封面風格：original（原版）或 gemini（Gemini 風格）
  price?: string | null // 價格（如：39,800）
  priceNote?: string | null // 價格備註（如：起、/人）
  outboundFlight: FlightInfo
  returnFlight: FlightInfo
  features: Feature[]
  focusCards: FocusCard[]
  leader: LeaderInfo
  meetingPoints: MeetingPoint[] // 改為陣列支援多個集合地點
  hotels: HotelInfo[] // 新增飯店資訊陣列
  showFeatures?: boolean // 是否顯示行程特色區塊
  showLeaderMeeting?: boolean // 是否顯示領隊與集合資訊
  showHotels?: boolean // 是否顯示飯店資訊
  showPricingDetails?: boolean // 是否顯示詳細團費
  pricingDetails?: PricingDetails // 詳細團費資訊
  priceTiers?: PriceTier[] | null // 價格方案（多種人數價格）
  showPriceTiers?: boolean // 是否顯示價格方案區塊
  faqs?: FAQ[] | null // 常見問題
  showFaqs?: boolean // 是否顯示常見問題區塊
  notices?: string[] | null // 提醒事項
  showNotices?: boolean // 是否顯示提醒事項區塊
  cancellationPolicy?: string[] | null // 取消政策
  showCancellationPolicy?: boolean // 是否顯示取消政策區塊
  itinerarySubtitle: string
  dailyItinerary: DailyItinerary[]
}

export interface IconOption {
  value: string
  label: string
  component: React.ComponentType<{ className?: string }>
}

export interface CityOption {
  id: string
  code: string
  name: string
}
