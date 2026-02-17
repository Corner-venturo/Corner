/**
 * 元件註冊表
 *
 * 集中管理所有設計元件
 */
import type { DesignComponent, ComponentCategory } from './types'

// 封面
import { fullCover } from './covers/full-cover'
import { minimalCover } from './covers/minimal-cover'

// 行程
import { dailyCard } from './itinerary/daily-card'
import { overviewTable } from './itinerary/overview-table'
import { timelineComponent } from './itinerary/timeline'

// 資訊
import { flightCard } from './info/flight-card'
import { hotelCard } from './info/hotel-card'
import { mealCard } from './info/meal-card'
import { attractionCard } from './info/attraction-card'

// 版面
import { headerComponent } from './layout/header'
import { footerComponent } from './layout/footer'
import { dividerComponent } from './layout/divider'
import { tocComponent } from './layout/toc'

// 工具
import { memoComponent } from './utility/memo'
import { qrcodeComponent } from './utility/qrcode'
import { vehicleInfo } from './utility/vehicle-info'

/** 所有已註冊的元件 */
export const ALL_COMPONENTS: DesignComponent[] = [
  // 封面
  fullCover,
  minimalCover,
  // 行程
  dailyCard,
  overviewTable,
  timelineComponent,
  // 資訊
  flightCard,
  hotelCard,
  mealCard,
  attractionCard,
  // 版面
  headerComponent,
  footerComponent,
  dividerComponent,
  tocComponent,
  // 工具
  memoComponent,
  qrcodeComponent,
  vehicleInfo,
]

/** 依分類取得元件 */
export function getComponentsByCategory(category: ComponentCategory): DesignComponent[] {
  return ALL_COMPONENTS.filter(c => c.category === category)
}

/** 依 ID 取得元件 */
export function getComponentById(id: string): DesignComponent | undefined {
  return ALL_COMPONENTS.find(c => c.id === id)
}

/** 搜尋元件（名稱或說明） */
export function searchComponents(query: string): DesignComponent[] {
  const q = query.toLowerCase()
  return ALL_COMPONENTS.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.description.toLowerCase().includes(q)
  )
}
