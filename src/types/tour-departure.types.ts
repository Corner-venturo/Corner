/**
 * 出團資料表型別定義
 */

// 出團資料表主表（基本資訊）
export interface TourDepartureData {
  id: string
  tour_id: string

  // 基本資訊
  tour_leader?: string | null           // 隨團領隊
  tour_leader_contact?: string | null   // 領隊聯絡方式
  sales_person?: string | null          // 承辦業務
  sales_contact?: string | null         // 業務聯絡方式
  assistant_person?: string | null      // 助理人員
  assistant_contact?: string | null     // 助理聯絡方式
  flight_info?: string | null           // 航班資訊

  // 其他費用
  service_fee_per_person?: number       // 領隊服務費（每人）
  petty_cash?: number                   // 零用金

  created_at?: string
  updated_at?: string
}

// 餐食表
export interface TourDepartureMeal {
  id: string
  departure_data_id: string

  date: string                          // 用餐日期
  restaurant_name?: string | null       // 餐廳名稱
  reservation_time?: string | null      // 預訂時間
  reservation_name?: string | null      // 訂位名稱
  reservation_count?: number | null     // 訂位人數
  unit_price?: number | null            // 商品單價
  quantity?: number | null              // 數量
  subtotal?: number | null              // 小計
  expected_amount?: number | null       // 預計支出
  actual_amount?: number | null         // 實際支出
  address?: string | null               // 地址
  phone?: string | null                 // 電話
  notes?: string | null                 // 說明/備註
  display_order?: number

  created_at?: string
  updated_at?: string
}

// 住宿表
export interface TourDepartureAccommodation {
  id: string
  departure_data_id: string

  date: string                          // 入住日期
  hotel_name?: string | null            // 飯店名稱
  room_type?: string | null             // 需求房型
  bed_type?: string | null              // 床型安排
  unit_price?: number | null            // 商品單價
  quantity?: number | null              // 數量
  subtotal?: number | null              // 小計
  expected_amount?: number | null       // 預計支出
  actual_amount?: number | null         // 實際支出
  address?: string | null               // 地址
  phone?: string | null                 // 電話
  notes?: string | null                 // 說明/備註
  display_order?: number

  created_at?: string
  updated_at?: string
}

// 活動表（門票、景點）
export interface TourDepartureActivity {
  id: string
  departure_data_id: string

  date: string                          // 活動日期
  venue_name?: string | null            // 場地名稱
  unit_price?: number | null            // 商品單價
  quantity?: number | null              // 數量
  subtotal?: number | null              // 小計
  expected_amount?: number | null       // 預計支出
  actual_amount?: number | null         // 實際支出
  notes?: string | null                 // 說明/備註
  display_order?: number

  created_at?: string
  updated_at?: string
}

// 其他費用表
export interface TourDepartureOther {
  id: string
  departure_data_id: string

  date: string                          // 日期
  item_name?: string | null             // 商品名稱
  unit_price?: number | null            // 商品單價
  quantity?: number | null              // 數量
  subtotal?: number | null              // 小計
  expected_amount?: number | null       // 預計支出
  actual_amount?: number | null         // 實際支出
  notes?: string | null                 // 說明/備註
  display_order?: number

  created_at?: string
  updated_at?: string
}

// 完整的出團資料表（包含所有子項目）
export interface CompleteTourDepartureData extends TourDepartureData {
  meals: TourDepartureMeal[]
  accommodations: TourDepartureAccommodation[]
  activities: TourDepartureActivity[]
  others: TourDepartureOther[]
}
