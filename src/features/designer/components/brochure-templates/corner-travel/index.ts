/**
 * Corner Travel 手冊模板元件
 * 
 * 使用方式：
 * ```tsx
 * import { BackCover, FrontCover, TocLeft, TocRight } from './corner-travel'
 * 
 * <BackCover data={brochureData} />
 * <FrontCover data={brochureData} />
 * ```
 */

// 完整手冊元件
export { Brochure } from './Brochure'

// 頁面元件
export { BackCover } from './BackCover'
export { FrontCover } from './FrontCover'
export { TocLeft } from './TocLeft'
export { TocRight } from './TocRight'
export { DailyLeft } from './DailyLeft'
export { DailyRight } from './DailyRight'
export { MemoLeft } from './MemoLeft'
export { MemoRight } from './MemoRight'

// 類型
export type { BrochureData, DailyItinerary, PageProps } from './types'

// 樣式常數
export { COLORS, A5_WIDTH_MM, A5_HEIGHT_MM, pageStyle } from './styles'
