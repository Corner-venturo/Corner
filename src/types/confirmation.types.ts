/**
 * 確認單類型定義
 */

export type ConfirmationType = 'accommodation' | 'flight'

export type ConfirmationStatus = 'draft' | 'confirmed' | 'sent' | 'cancelled'

// ========== 住宿確認單資料結構 ==========
export interface AccommodationData {
  // 飯店資訊
  hotelName: string
  hotelAddress: string
  hotelPhone: string[]

  // 入住資訊
  checkInDate: string
  checkInTime: string
  checkOutDate: string
  checkOutTime: string
  roomCount: number
  nightCount: number

  // 房型資訊
  roomType: string
  guestName: string
  guestCapacity: string

  // 餐點資訊
  meals: Array<{
    date: string
    description: string
  }>

  // 備註
  importantNotes?: string
}

// ========== 機票確認單資料結構 ==========
export interface FlightPassenger {
  nameEn: string
  nameZh?: string
  cabin: string // 艙等
  ticketNumber: string
  bookingCode: string
}

export interface FlightSegment {
  route: string // 例如：台北 - 上海
  departureDate: string
  departureTime: string
  departureAirport: string
  departureTerminal?: string
  arrivalDate: string
  arrivalTime: string
  arrivalAirport: string
  arrivalTerminal?: string
  airline: string
  flightNumber: string
}

export interface BaggageAllowance {
  passengerName: string
  personalItem: string
  carryOn: string
  checked: string
}

export interface FlightData {
  // 旅客資訊
  passengers: FlightPassenger[]

  // 航班資訊
  segments: FlightSegment[]

  // 行李資訊
  baggage: BaggageAllowance[]

  // 重要資訊
  importantNotes: string[]

  // 行李詳細資訊
  baggageDetails?: Array<{
    route: string
    carryOnDetail: string
    checkedDetail: string
    personalItemDetail: string
  }>
}

// ========== 確認單主資料結構 ==========
export interface Confirmation {
  id: string
  workspace_id: string
  type: ConfirmationType

  // 基本資訊
  booking_number: string
  confirmation_number?: string

  // 資料內容（根據 type 不同，儲存不同的資料）
  data: AccommodationData | FlightData

  // 狀態
  status: ConfirmationStatus

  // 備註
  notes?: string

  // 時間戳記
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

// ========== 前端表單用的型別 ==========
export interface ConfirmationFormData {
  type: ConfirmationType
  booking_number: string
  confirmation_number?: string
  data: Partial<AccommodationData> | Partial<FlightData>
  status: ConfirmationStatus
  notes?: string
}
