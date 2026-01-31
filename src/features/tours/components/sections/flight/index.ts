/**
 * Flight Section 統一模組
 *
 * 整合前：5 個獨立 Section 元件 + 3 個卡片元件 = 1,990 行
 * 整合後：1 個統一 Section + 1 個統一卡片 + 主題系統
 */

export { TourFlightSectionUnified } from './TourFlightSectionUnified'
export { UnifiedFlightCard, parseFlightDate, extractCityName } from './UnifiedFlightCard'
export type { FormattedDate } from './UnifiedFlightCard'
