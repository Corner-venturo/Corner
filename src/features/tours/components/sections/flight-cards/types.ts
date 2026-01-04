// 從 tour-form 統一匯出風格類型，避免重複定義
export type { FlightStyleType, CoverStyleType } from '@/components/editor/tour-form/types'

// FlightInfo 用於顯示層，所有欄位都是可選的（不同於 tour-form 的輸入類型）
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

import type { FlightStyleType } from '@/components/editor/tour-form/types'

export interface TourDisplayData {
  outboundFlight?: FlightInfo | null
  returnFlight?: FlightInfo | null
  coverImage?: string | null // 用於日式風格的目的地圖片
  flightStyle?: FlightStyleType // 航班卡片風格
}

export interface FlightCardProps {
  flight: FlightInfo | null | undefined
  type: 'outbound' | 'return'
  viewMode: 'desktop' | 'mobile'
}
