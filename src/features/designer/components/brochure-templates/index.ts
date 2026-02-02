/**
 * 手冊模板元件
 * 
 * 使用方式：
 * ```tsx
 * import { CornerTravel, JapaneseStyle } from '@/features/designer/components/brochure-templates'
 * 
 * // Corner Travel 風格
 * <CornerTravel.Cover data={data} />
 * <CornerTravel.Daily data={data} day={day} dayIndex={0} />
 * 
 * // 日系風格
 * <JapaneseStyle.Cover data={data} />
 * <JapaneseStyle.Daily data={data} day={day} dayIndex={0} />
 * 
 * // 混搭
 * <CornerTravel.Cover data={data} />
 * <JapaneseStyle.Daily data={data} day={day} dayIndex={0} />
 * ```
 */

import * as CornerTravel from './corner-travel'
import * as JapaneseStyle from './japanese-style'

export { CornerTravel, JapaneseStyle }

// 共用類型
export type { PageSize } from './japanese-style/types'
export { PAGE_SIZES } from './japanese-style/types'
