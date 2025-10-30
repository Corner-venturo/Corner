/**
 * Timebox Constants
 * 時間盒相關常數
 */

// Grid Configuration
export const GRID_START_HOUR = 6 // 6 AM
export const GRID_END_HOUR = 24 // Midnight

// Slot Heights (pixels)
export const SLOT_HEIGHT_30MIN = 56
export const SLOT_HEIGHT_60MIN = 96

// Tailwind Classes
export const SLOT_CLASS_30MIN = 'min-h-[3.5rem]'
export const SLOT_CLASS_60MIN = 'min-h-[4.75rem]'

// Default Box Values
export const DEFAULT_BOX_NAME = '日常安排'
export const DEFAULT_BOX_COLOR = '#D4D4D4'
export const BOX_TYPE_BASIC = 'basic'
export const PLACEHOLDER_USER_ID = 'current-user'

// Week View Configuration
export const DAYS_IN_WEEK = 7
export const WEEK_START_OFFSET_SUNDAY = -6
export const WEEK_START_OFFSET_MONDAY = 1
export const WEEK_VIEW_GRID_CLASS = 'grid-cols-8'

export const DAY_LABELS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'] as const
export const DAY_LABELS_SHORT = ['日', '一', '二', '三', '四', '五', '六'] as const

export type DayLabel = (typeof DAY_LABELS)[number]
