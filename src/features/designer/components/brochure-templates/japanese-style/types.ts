/**
 * 日系風格手冊模板類型
 */

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

export interface AttractionInfo {
  name: string
  description?: string
  image?: string
}

export interface BrochureData {
  // 基本資訊
  destination?: string
  mainTitle?: string
  subTitle?: string
  travelDates?: string
  
  // 封面
  coverImage?: string
  companyName?: string
  
  // 領隊
  leaderName?: string
  leaderPhone?: string
  
  // 航班
  outboundFlight?: string
  returnFlight?: string
  
  // 行程
  dailyItineraries?: DailyItinerary[]
  
  // 飯店
  hotels?: HotelInfo[]
  
  // 景點
  attractions?: AttractionInfo[]
}

export interface PageProps {
  data: BrochureData
  pageNumber?: number
  className?: string
}

// 尺寸設定
export interface PageSize {
  width: number   // mm
  height: number  // mm
  name: string
}

export const PAGE_SIZES: Record<string, PageSize> = {
  A5: { width: 148, height: 210, name: 'A5' },
  A4: { width: 210, height: 297, name: 'A4' },
  Letter: { width: 216, height: 279, name: 'Letter' },
}
