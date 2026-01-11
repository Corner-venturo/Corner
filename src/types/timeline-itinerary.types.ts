/**
 * 時間軸行程編輯器類型定義
 * Timeline Itinerary Editor Types
 */

/**
 * 景點照片
 */
export interface TimelineImage {
  id: string
  url: string
  caption?: string
}

/**
 * 餐食類型
 */
export type MealType = 'none' | 'breakfast' | 'lunch' | 'dinner'

/**
 * 時間軸景點
 */
export interface TimelineAttraction {
  id: string
  name: string
  description?: string
  startTime?: string  // "0900"
  endTime?: string    // "1000"
  mealType?: MealType  // 餐食類型（無/早餐/午餐/晚餐）
  menu?: string        // 菜色（當 mealType 不是 none 時使用）
  images: TimelineImage[]
  color?: string       // 文字顏色（如：#3b82f6 藍色）
}

/**
 * 每日餐食資料（對應需求單）
 */
export interface TimelineDayMeals {
  breakfast: boolean
  lunch: boolean
  dinner: boolean
  breakfastMenu?: string  // 早餐菜色
  lunchMenu?: string      // 午餐菜色
  dinnerMenu?: string     // 晚餐菜色
}

/**
 * 時間軸每日行程
 */
export interface TimelineDay {
  id: string
  dayNumber: number
  date: string
  title?: string  // 每日大標題（如：台北市區觀光）
  attractions: TimelineAttraction[]
  meals: TimelineDayMeals  // 每日餐食統計
  accommodation?: string   // 當晚住宿飯店名稱
}

/**
 * 時間軸行程資料
 */
export interface TimelineItineraryData {
  title: string           // 行程標題
  subtitle?: string       // 副標題
  days: TimelineDay[]
  startDate?: string
}

/**
 * 產生唯一 ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

/**
 * 建立空白景點
 */
export function createEmptyAttraction(): TimelineAttraction {
  return {
    id: generateId(),
    name: '',
    description: '',
    images: [],
  }
}

/**
 * 建立空白一天
 */
export function createEmptyDay(dayNumber: number, date?: string): TimelineDay {
  return {
    id: generateId(),
    dayNumber,
    date: date || '',
    attractions: [createEmptyAttraction()],
    meals: {
      breakfast: false,
      lunch: false,
      dinner: false,
    },
  }
}
