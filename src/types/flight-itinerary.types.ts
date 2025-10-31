/**
 * 航班行程單相關型別定義
 */

import { BaseEntity } from './base.types'

// ============================================
// 航班行程單資料結構
// ============================================

/**
 * FlightPassenger - 旅客資訊
 */
export interface FlightPassenger {
  id?: string
  lastName: string // 姓氏（英文）
  firstName: string // 名字（英文）
  chineseName?: string // 中文姓名
  cabin: 'economy' | 'business' | 'first' // 艙等
  eTicketNumber: string // 電子機票號
  bookingReference: string // 航空公司訂位代號
  passportNumber?: string // 護照號碼
  dateOfBirth?: string // 出生日期
}

/**
 * FlightSegment - 航段資訊
 */
export interface FlightSegment {
  id?: string
  direction: string // 航段名稱（例：台北 - 上海）
  departure: {
    dateTime: string // ISO 8601 格式
    airport: string // 機場名稱
    terminal?: string // 航廈
  }
  arrival: {
    dateTime: string // ISO 8601 格式
    airport: string // 機場名稱
    terminal?: string // 航廈
  }
  airline: string // 航空公司名稱
  flightNumber: string // 航班號
  duration?: string // 飛行時間
  aircraft?: string // 機型
}

/**
 * BaggageAllowance - 行李額度
 */
export interface BaggageAllowance {
  personalItem: string // 個人物品
  carryOn: {
    pieces: number // 件數
    weight: number // 重量（公斤）
    dimensions?: string // 尺寸限制
  }
  checked: {
    pieces: number // 件數
    weight: number // 重量（公斤）
    dimensions?: string // 尺寸限制
  }
}

/**
 * FlightItinerary - 航班行程單主資料
 */
export interface FlightItinerary extends BaseEntity {
  bookingNumber: string // 訂單編號
  tour_id?: string // 關聯的團體 ID
  order_id?: string // 關聯的訂單 ID

  // 旅客資訊
  passengers: FlightPassenger[]

  // 航班資訊
  flights: FlightSegment[]

  // 行李額度（按航段）
  baggageBySegment: Record<string, BaggageAllowance>

  // 重要資訊
  notes?: string[] // 重要提醒事項

  // 狀態
  status: 'draft' | 'confirmed' | 'cancelled'

  // 元數據
  issued_date?: string // 開票日期
  issuer?: string // 開票人
}

/**
 * CreateFlightItineraryData - 建立航班行程單所需資料
 */
export interface CreateFlightItineraryData {
  bookingNumber: string
  tour_id?: string
  order_id?: string
  passengers: FlightPassenger[]
  flights: FlightSegment[]
  baggageBySegment: Record<string, BaggageAllowance>
  notes?: string[]
}

/**
 * PrintableItineraryData - 可列印的行程單資料（完整資訊）
 */
export interface PrintableItineraryData {
  // 基本資訊
  bookingNumber: string
  issuedDate: string

  // 旅客與航班
  passengers: FlightPassenger[]
  flights: FlightSegment[]

  // 行李額度
  baggageBySegment: Record<string, BaggageAllowance>

  // 重要資訊
  notes: string[]

  // 公司資訊（可選）
  companyInfo?: {
    name: string
    logo?: string
    phone?: string
    address?: string
  }
}
