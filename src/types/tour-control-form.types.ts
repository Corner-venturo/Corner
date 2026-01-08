/**
 * 團控表類型定義
 * Tour Control Form Types
 */

// ============================================
// 團控表資料結構
// ============================================

/**
 * 聯絡人資訊
 */
export interface TourControlContact {
  name: string
  phone?: string
}

/**
 * 遊覽車公司資訊
 */
export interface TourControlBusCompany {
  name: string
  contact?: string
  confirmTime?: string
}

/**
 * 飯店確認明細
 */
export interface TourControlHotel {
  date: string          // 住宿日期
  hotelName: string     // 飯店名稱
  phone?: string        // 電話
  contact?: string      // 聯絡人
  confirmTime?: string  // 確認時間
  deposit?: string      // 訂金
  agreement?: string    // 協議
  remarks?: string      // 備註
}

/**
 * 預約景點門票
 */
export interface TourControlAttraction {
  date: string          // 日期
  name: string          // 名稱
  phone?: string        // 電話
  contact?: string      // 連絡人
  status?: string       // 預約狀況
  price?: string        // 價格
  agreement?: string    // 協議
  remarks?: string      // 備註
}

/**
 * 餐食資訊
 */
export interface TourControlMeal {
  date: string          // 日期
  lunch?: string        // 午餐
  dinner?: string       // 晚餐
  dailyItinerary?: string // 本日行程
}

/**
 * 航班資訊
 */
export interface TourControlFlight {
  airline?: string      // 航空公司
  flightNumber?: string // 航班編號
  departure?: string    // 起飛地點
  arrival?: string      // 抵達地點
  departureTime?: string // 起飛時間
  arrivalTime?: string  // 抵達時間
}

/**
 * 火車/船舶資訊
 */
export interface TourControlTrain {
  outbound?: string     // 去程
  return?: string       // 回程
}

/**
 * 人數資訊 - 每車領隊配置
 */
export interface TourControlPaxPerBus {
  total?: number        // 總人數
  business?: number     // 公司業務
  leader?: number       // 總領
  nurse?: number        // 護士
  tourLeader?: number   // 領隊
}

/**
 * 人數資訊 - 公司領團配置
 */
export interface TourControlPaxCompany {
  leader?: number       // 總領
  nurse?: number        // 護士
  tourLeader?: number   // 領隊
}

/**
 * 人數資訊
 */
export interface TourControlPax {
  total: number         // 總人數（舊版相容）
  business?: number     // 公司業務（舊版相容）
  leader?: number       // 總領（舊版相容）
  nurse?: number        // 護士（舊版相容）
  tourLeader?: number   // 領隊（舊版相容）
  // 新版：每車領隊配置
  perBus?: TourControlPaxPerBus
  // 新版：公司領團配置
  company?: TourControlPaxCompany
}

/**
 * 團控表完整資料
 */
export interface TourControlFormData {
  // 基本資訊
  date: string                          // 日期
  tourCode: string                      // 團號
  tourName?: string                     // 車條名稱/團名

  // 聯絡人
  bidContact?: TourControlContact       // 標案聯絡人
  itineraryContact?: TourControlContact // 行程聯絡人

  // 人數
  pax?: TourControlPax

  // 航班
  outboundFlight?: TourControlFlight    // 去程
  returnFlight?: TourControlFlight      // 回程

  // 其他交通
  train?: TourControlTrain              // 火車
  ship?: TourControlTrain               // 船

  // 遊覽車
  busCompanies?: TourControlBusCompany[]

  // 活動廠商
  activityVendor?: string

  // 飯店
  hotels?: TourControlHotel[]

  // 預約景點門票
  attractions?: TourControlAttraction[]

  // 餐食
  meals?: TourControlMeal[]

  // 注意事項
  remarks?: string
}
