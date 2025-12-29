/**
 * PNR 模組入口
 * 匯出所有 PNR 相關功能
 */

// 參考資料服務
export {
  getReferenceData,
  refreshReferenceData,
  getAirline,
  getAirlineName,
  getAirport,
  getAirportName,
  getCityName,
  getBookingClass,
  getBookingClassDescription,
  getSSRCode,
  getSSRDescription,
  getSSRCategory,
  getStatusCode,
  getStatusDescription,
  getStatusCategory,
  isConfirmedStatus,
  isWaitlistStatus,
  isCancelledStatus,
  getCacheStatus,
  type Airline,
  type Airport,
  type BookingClass,
  type SSRCode,
  type StatusCode,
  type ReferenceData,
} from './reference-data'

// React Hook
export { useReferenceData } from './use-reference-data'

// 解析器（從原有位置重新匯出）
export {
  parseAmadeusPNR,
  parseHTMLConfirmation,
  parseFlightConfirmation,
  validateAmadeusPNR,
  formatSegment,
  extractImportantDates,
  isUrgent,
  SSRCategory,
  OSICategory,
  type ParsedPNR,
  type FlightSegment,
  type EnhancedSSR,
  type EnhancedOSI,
  type ValidationResult,
  type ParsedHTMLConfirmation,
} from '@/lib/pnr-parser'
