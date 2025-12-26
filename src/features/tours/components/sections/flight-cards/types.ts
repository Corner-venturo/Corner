export interface FlightInfo {
  airline?: string | null
  flightNumber?: string | null
  departureAirport?: string | null
  departureTime?: string | null
  departureDate?: string | null
  arrivalAirport?: string | null
  arrivalTime?: string | null
  duration?: string | null
  // 新增欄位
  aircraftType?: string | null
  terminal?: string | null
  arrivalTerminal?: string | null
  hasMeal?: boolean | null // 是否提供機上餐食
}

// 航班卡片風格類型
export type FlightStyleType = 'original' | 'chinese' | 'japanese' | 'luxury' | 'art' | 'none' | 'dreamscape' | 'collage'

export interface TourDisplayData {
  outboundFlight?: FlightInfo | null
  returnFlight?: FlightInfo | null
  coverImage?: string | null // 用於日式風格的目的地圖片
  flightStyle?: FlightStyleType // 航班卡片風格
}

export type CoverStyleType = 'original' | 'gemini' | 'nature' | 'serene' | 'luxury' | 'art' | 'dreamscape' | 'collage'

export interface FlightCardProps {
  flight: FlightInfo | null | undefined
  type: 'outbound' | 'return'
  viewMode: 'desktop' | 'mobile'
}
