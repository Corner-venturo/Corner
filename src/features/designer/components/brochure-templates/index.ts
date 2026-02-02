/**
 * 手冊模板系統
 * 
 * 結構：
 * - primitives: 基礎元素（Text, Image, Divider...）
 * - blocks: 區塊元件（Header, DaySchedule, HotelCard...）
 * - pages: 頁面元件（Cover, Toc, Daily...）
 * - themes: 主題設定（cornerTravel, japanese...）
 * 
 * 使用方式：
 * ```tsx
 * import { pages, themes, PAGE_SIZES } from '@/features/designer/components/brochure-templates'
 * 
 * const theme = themes.cornerTravelTheme
 * 
 * <pages.Cover data={data} theme={theme} size={PAGE_SIZES.A5} />
 * <pages.Toc data={data} theme={theme} />
 * <pages.Daily data={data} theme={theme} day={day} image={img} />
 * ```
 */

// 基礎元素
export * as primitives from './primitives'

// 區塊元件
export * as blocks from './blocks'

// 頁面元件
export * as pages from './pages'

// 主題
export * as themes from './themes'

// 類型
export * from './types'
