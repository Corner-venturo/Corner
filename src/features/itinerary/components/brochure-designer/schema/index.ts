/**
 * Brochure Schema Module
 * 導出所有 Schema 相關的類型和函數
 */

// 類型導出
export type {
  PageTemplateType,
  PageDataSnapshot,
  CoverDataSnapshot,
  DayDataSnapshot,
  AccommodationSnapshot,
  FlightDataSnapshot,
  MeetingDataSnapshot,
  SourceReference,
  ElementOverride,
  PageSchema,
  BrochureSettings,
  BrochureSchema,
  GenerateElementsOptions,
  SchemaChangeType,
} from './types'

// 常數導出
export {
  DEFAULT_PAGE_SIZE,
  DEFAULT_BLEED,
  DEFAULT_BROCHURE_SETTINGS,
} from './types'

// 函數導出
export {
  generatePageElements,
  createDataSnapshotFromItinerary,
  createTextElement,
  createImageElement,
  createShapeElement,
  resetIdCounter,
} from './generateElements'
