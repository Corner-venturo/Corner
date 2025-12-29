/**
 * 行程自動生成器模組
 * 提供一鍵生成行程草稿功能
 */

// 主要生成器
export { generateItinerary } from './generator'

// 類型定義
export type {
  GenerateItineraryRequest,
  GenerateItineraryResult,
  FlightConstraint,
  DailyTimeSlot,
  SchedulingConfig,
  AttractionWithDistance,
} from './types'

export { DEFAULT_SCHEDULING_CONFIG } from './types'

// 工具函數
export {
  calculateDistance,
  estimateTravelTime,
  filterNearbyAttractions,
  optimizeAttractionOrder,
  calculateTotalDistance,
} from './geo-utils'

export {
  timeToMinutes,
  minutesToTime,
  calculateDailyTimeSlots,
  calculateUsableTime,
  formatDisplayDate,
} from './time-utils'
