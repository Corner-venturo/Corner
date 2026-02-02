/**
 * 手冊模板共用類型
 */

// 尺寸
export interface PageSize {
  width: number   // mm
  height: number  // mm
  name: string
}

export const PAGE_SIZES = {
  A5: { width: 148, height: 210, name: 'A5' },
  A4: { width: 210, height: 297, name: 'A4' },
  Letter: { width: 216, height: 279, name: 'Letter' },
} as const

// 主題
export interface Theme {
  name: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
    textMuted: string
    border: string
  }
  fonts: {
    heading: string
    body: string
    accent?: string
  }
  spacing: {
    page: string      // 頁面邊距
    section: string   // 區塊間距
    element: string   // 元素間距
  }
}

// 行程資料
export interface DailyItinerary {
  dayNumber: number
  date?: string
  title: string
  activities?: string[]
  meals?: {
    breakfast?: string
    lunch?: string
    dinner?: string
  }
  accommodation?: string
}

export interface HotelInfo {
  name: string
  nameEn?: string
  address?: string
  phone?: string
  checkIn?: string
  checkOut?: string
  image?: string
  nights?: number
}

export interface FlightInfo {
  direction: 'outbound' | 'return'
  airline?: string
  flightNo?: string
  departure?: string
  arrival?: string
  departureTime?: string
  arrivalTime?: string
}

// 手冊資料
export interface BrochureData {
  // 基本
  destination?: string
  mainTitle?: string
  subTitle?: string
  travelDates?: string
  tourCode?: string
  
  // 封面
  coverImage?: string
  
  // 公司
  companyName?: string
  companyAddress?: string
  companyPhone?: string
  companyFax?: string
  lineQrCode?: string
  
  // 領隊
  leaderName?: string
  leaderPhone?: string
  
  // 航班
  flights?: FlightInfo[]
  
  // 行程
  dailyItineraries?: DailyItinerary[]
  
  // 飯店
  hotels?: HotelInfo[]
}

// 頁面 Props
export interface PageProps {
  data: BrochureData
  theme: Theme
  size?: PageSize
  pageNumber?: number
  className?: string
}

// 區塊 Props
export interface BlockProps {
  theme: Theme
  className?: string
}
