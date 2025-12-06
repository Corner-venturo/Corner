export interface FlightInfo {
  airline: string
  flightNumber: string
  departureAirport: string
  departureTime: string
  departureDate: string
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

export interface Activity {
  icon: string
  title: string
  description: string
  image?: string
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

export interface TourCountry {
  country_id: string
  country_name: string
  country_code?: string
  main_city_id?: string
  main_city_name?: string
  is_primary: boolean // 是否為主要國家
}

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
