/**
 * Corner Travel 手冊模板類型定義
 */

export interface DailyItinerary {
  dayNumber: number
  title: string
  meals?: {
    breakfast?: string
    lunch?: string
    dinner?: string
  }
  accommodation?: string
}

export interface BrochureData {
  // 基本資訊
  destination?: string        // e.g. "東京, 日本"
  mainTitle?: string          // e.g. "日本東京行程手冊"
  travelDates?: string        // e.g. "2026.02.09 - 02.15"
  
  // 封面圖片
  coverImage?: string
  
  // 公司資訊
  companyName?: string
  companyAddress?: string
  companyPhone?: string
  companyFax?: string
  lineQrCode?: string
  
  // 領隊資訊
  leaderName?: string
  leaderPhone?: string
  
  // 航班資訊
  outboundFlight?: string
  returnFlight?: string
  
  // 行程
  dailyItineraries?: DailyItinerary[]
}

export interface PageProps {
  data: BrochureData
  pageNumber?: number
  className?: string
}
