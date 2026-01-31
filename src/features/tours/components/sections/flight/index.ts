/**
 * Flight Section 統一模組
 *
 * 保留所有風格的完整實作，但統一入口：
 * - TourFlightSectionUnified — 統一路由，根據風格選擇對應元件
 * - UnifiedFlightCard — 卡片式風格（Original, Art, Nature）
 * - LuxuryFlightSection — 表格式風格
 * - DreamscapeFlightSection — 時間軸式風格
 * - CollageFlightSection — 登機證式風格
 */

export { TourFlightSectionUnified } from './TourFlightSectionUnified'
export { UnifiedFlightCard, parseFlightDate, extractCityName } from './UnifiedFlightCard'
export { LuxuryFlightSection } from './LuxuryFlightSection'
export { DreamscapeFlightSection } from './DreamscapeFlightSection'
export { CollageFlightSection } from './CollageFlightSection'
export type { FormattedDate } from './UnifiedFlightCard'
