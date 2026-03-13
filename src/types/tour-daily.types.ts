/**
 * tour-daily.types.ts
 * 旅遊團每日資料類型定義
 * 
 * 組合來源：
 * - tour_daily_display (展示層資料)
 * - tour_itinerary_items (核心表資料)
 */

// tour_daily_display 表類型
export interface TourDailyDisplay {
  id: string
  tour_id: string
  day: number
  day_label: string | null
  title: string | null
  highlight: string | null
  description: string | null
  images: any // JSONB
  date: string | null
  is_hidden: boolean | null
  workspace_id: string
  created_at: string | null
  updated_at: string | null
  created_by: string | null
}

export type TourDailyDisplayInsert = Omit<TourDailyDisplay, 'id' | 'created_at' | 'updated_at'>
export type TourDailyDisplayUpdate = Partial<TourDailyDisplayInsert>

// tour_itinerary_items 類型（從核心表讀取）
export interface TourItineraryItem {
  id: string
  tour_id: string
  day: number
  category: string
  resource_type: string | null
  resource_id: string | null
  title: string
  description: string | null
  estimated_cost: number | null
  actual_cost: number | null
  order_index: number
  workspace_id: string
  created_at: string | null
  updated_at: string | null
  [key: string]: any // 其他可能的欄位
}

/**
 * 每日完整資料（組合後）
 */
export interface DayData {
  // === 展示層資料（from tour_daily_display） ===
  day: number // 第幾天
  dayLabel: string // 例如："Day 1" 或 "第一天"
  title: string // 當日標題，例如："抵達福岡"
  highlight: string // 當日亮點，例如："入住天神日航飯店"
  description: string // 當日詳細說明
  images: ImageData[] // 當日圖片
  date?: string | null // 實際日期（如果是開團才有）
  isHidden?: boolean // 是否在手冊中隱藏
  
  // === 核心表資料（from tour_itinerary_items） ===
  accommodations: TourItineraryItem[] // 飯店
  meals: TourItineraryItem[] // 餐食
  activities: TourItineraryItem[] // 行程
  transportation: TourItineraryItem[] // 交通
  
  // === 統計資訊 ===
  totalEstimatedCost: number // 預估總成本
  totalActualCost: number // 實際總成本
  itemCount: number // 項目總數
}

/**
 * 圖片資料
 */
export interface ImageData {
  url: string
  caption?: string
}

/**
 * useTourDailyData 回傳值
 */
export interface UseTourDailyDataResult {
  days: DayData[] // 所有天數的資料
  totalDays: number // 總天數
  isLoading: boolean // 載入中
  error: Error | null // 錯誤
  refetch: () => Promise<void> // 重新載入
  
  // === 輔助方法 ===
  getDayByNumber: (day: number) => DayData | undefined
  getItemsByDay: (day: number, category?: string) => TourItineraryItem[]
  getTotalCost: () => { estimated: number; actual: number }
}

/**
 * 更新每日展示資料的參數
 */
export interface UpdateDayDisplayParams {
  day: number
  title?: string
  highlight?: string
  description?: string
  images?: ImageData[]
  isHidden?: boolean
}
