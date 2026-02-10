/**
 * PackageItineraryDialog 類型定義
 */

import type { FlightInfo } from '@/types/flight.types'
import type { ProposalPackage, Proposal } from '@/types/proposal.types'

/** 行程表表單資料 */
export interface ItineraryFormData {
  title: string
  description: string
  outboundFlight: FlightInfo | null
  returnFlight: FlightInfo | null
}

/** 簡化版活動（時間軸用） */
export interface SimpleActivity {
  id: string
  title: string
  startTime?: string  // 格式 "0900"
  endTime?: string    // 格式 "1030"
}

/** 每日行程項目 */
export interface DailyScheduleItem {
  day: number
  route: string
  meals: {
    breakfast: string
    lunch: string
    dinner: string
  }
  accommodation: string
  sameAsPrevious: boolean
  hotelBreakfast: boolean
  lunchSelf: boolean
  dinnerSelf: boolean
  activities?: SimpleActivity[]
}

/** AI 主題選項 */
export interface AiThemeOption {
  value: string
  label: string
  description: string
}

/** AI 主題列表 */
export const AI_THEMES: AiThemeOption[] = [
  { value: 'classic', label: '經典景點', description: '必訪名勝、熱門打卡點' },
  { value: 'foodie', label: '美食探索', description: '在地美食、特色餐廳' },
  { value: 'culture', label: '文青之旅', description: '文化體驗、藝術展覽' },
  { value: 'nature', label: '自然風光', description: '山林步道、自然景觀' },
  { value: 'family', label: '親子同樂', description: '適合全家的輕鬆行程' },
  { value: 'relax', label: '悠閒慢旅', description: '不趕行程、深度體驗' },
]

/** 預覽模式每日資料 */
export interface PreviewDayData {
  dayLabel: string
  date: string
  title: string
  meals: {
    breakfast: string
    lunch: string
    dinner: string
  }
  accommodation: string
}

/** Dialog Props */
export interface PackageItineraryDialogProps {
  isOpen: boolean
  onClose: () => void
  pkg: ProposalPackage
  proposal: Proposal
  onItineraryCreated?: (itineraryId?: string) => void
}

/** 住宿狀態 */
export interface AccommodationStatus {
  isComplete: boolean
  filledCount: number
  requiredDays: number
  accommodations: string[]
}
