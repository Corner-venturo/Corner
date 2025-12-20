/**
 * 區塊編輯器模組
 *
 * 提供區塊式行程編輯功能
 *
 * @example
 * ```tsx
 * import { BlockEditor } from '@/components/editor/block-editor'
 *
 * function ItineraryPage() {
 *   const [data, setData] = useState<TourFormData>(initialData)
 *
 *   return (
 *     <BlockEditor
 *       initialData={data}
 *       onDataChange={setData}
 *     />
 *   )
 * }
 * ```
 */

// 主組件
export { BlockEditor, useBlockEditor } from './components'
export type { UseBlockEditorOptions, UseBlockEditorReturn } from './components'

// 子組件
export { BlockCanvas, BlockWrapper, BlockToolbox } from './components'

// 類型
export type {
  BlockType,
  BlockMeta,
  Block,
  AnyBlock,
  BlockDataMap,
  BlockConfig,
  BlockEditorState,
  BlockEditorAction,
  CoverBlockData,
  FlightBlockData,
  FeaturesBlockData,
  FocusCardsBlockData,
  LeaderMeetingBlockData,
  HotelsBlockData,
  DailyItineraryBlockData,
  PricingBlockData,
  PriceTiersBlockData,
  FAQsBlockData,
  NoticesBlockData,
  CancellationBlockData,
} from './types'

// 工具函數
export {
  createBlock,
  getBlockLabel,
  getBlockIcon,
  canAddBlock,
  BLOCK_CONFIGS,
  tourDataToBlocks,
  blocksToTourData,
  createDefaultBlocks,
  reorderBlocks,
} from './types'
