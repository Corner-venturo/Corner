/**
 * Canvas-based Brochure Editor Types
 * Canva-like 手冊設計器類型定義
 */

import type { Object as FabricObject } from 'fabric'

// ============= 基礎元素類型 =============

/** 原子元素類型 - 最小積木單位 */
export type AtomicElementType =
  | 'text'           // 文字
  | 'image'          // 圖片
  | 'shape'          // 形狀 (矩形、圓形、線條)
  | 'decoration'     // 裝飾 (印章、貼紙、花紋)
  | 'icon'           // 圖標

/** 複合元素類型 - 由原子元素組成 */
export type CompoundElementType =
  | 'spot-card'          // 景點卡片
  | 'itinerary-item'     // 行程項目
  | 'flight-info'        // 航班資訊
  | 'accommodation-card' // 住宿卡片
  | 'day-header'         // 日期標題

export type ElementType = AtomicElementType | CompoundElementType

// ============= 元素基礎屬性 =============

export interface BaseElementProps {
  id: string
  type: ElementType
  name: string           // 圖層名稱
  x: number              // 左上角 X 座標
  y: number              // 左上角 Y 座標
  width: number
  height: number
  rotation: number       // 旋轉角度
  opacity: number        // 透明度 0-1
  locked: boolean        // 是否鎖定
  visible: boolean       // 是否可見
  zIndex: number         // 層級
}

// ============= 文字元素 =============

export interface TextStyle {
  fontFamily: string
  fontSize: number
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
  fontStyle: 'normal' | 'italic'
  textAlign: 'left' | 'center' | 'right'
  lineHeight: number
  letterSpacing: number
  color: string
  textDecoration: 'none' | 'underline' | 'line-through'
}

export interface TextElement extends BaseElementProps {
  type: 'text'
  content: string
  style: TextStyle
}

// ============= 圖片元素 =============

export interface ImageElement extends BaseElementProps {
  type: 'image'
  src: string
  cropX: number
  cropY: number
  cropWidth: number
  cropHeight: number
  filters: {
    brightness: number
    contrast: number
    saturation: number
    blur: number
  }
  objectFit: 'cover' | 'contain' | 'fill'
}

// ============= 形狀元素 =============

export type ShapeVariant = 'rectangle' | 'circle' | 'ellipse' | 'line' | 'triangle' | 'polygon'

// 漸層色標
export interface GradientColorStop {
  offset: number  // 0-1
  color: string
}

// 漸層定義
export interface GradientFill {
  type: 'linear' | 'radial'
  angle?: number  // linear gradient angle in degrees (0 = to bottom, 90 = to right)
  colorStops: GradientColorStop[]
}

export interface ShapeElement extends BaseElementProps {
  type: 'shape'
  variant: ShapeVariant
  fill: string
  stroke: string
  strokeWidth: number
  cornerRadius: number   // 圓角
  points?: number[]      // 多邊形頂點
  gradient?: GradientFill  // 漸層填充（優先於 fill）
}

// ============= 裝飾元素 =============

export type DecorationCategory =
  | 'stamp'      // 印章
  | 'sticker'    // 貼紙
  | 'pattern'    // 花紋
  | 'frame'      // 相框
  | 'ribbon'     // 緞帶
  | 'arrow'      // 箭頭
  | 'divider'    // 分隔線

export interface DecorationElement extends BaseElementProps {
  type: 'decoration'
  category: DecorationCategory
  assetId: string        // 素材庫 ID
  assetUrl: string       // 素材 URL
  tintColor?: string     // 染色（可選）
}

// ============= 圖標元素 =============

export interface IconElement extends BaseElementProps {
  type: 'icon'
  iconName: string       // lucide 圖標名稱
  color: string
  strokeWidth: number
}

// ============= 複合元素 =============

/** 景點卡片 */
export interface SpotCardElement extends BaseElementProps {
  type: 'spot-card'
  spotName: string
  spotDescription: string
  spotImage?: string
  layout: 'horizontal' | 'vertical' | 'compact'
  children: CanvasElement[]  // 子元素
}

/** 行程項目 */
export interface ItineraryItemElement extends BaseElementProps {
  type: 'itinerary-item'
  dayNumber: number
  title: string
  activities: string[]
  children: CanvasElement[]
}

/** 航班資訊 */
export interface FlightInfoElement extends BaseElementProps {
  type: 'flight-info'
  departure: string
  arrival: string
  flightNumber: string
  time: string
  children: CanvasElement[]
}

/** 住宿卡片 */
export interface AccommodationCardElement extends BaseElementProps {
  type: 'accommodation-card'
  hotelName: string
  address: string
  checkIn: string
  checkOut: string
  image?: string
  children: CanvasElement[]
}

/** 日期標題 */
export interface DayHeaderElement extends BaseElementProps {
  type: 'day-header'
  dayNumber: number
  date: string
  dayOfWeek: string
  children: CanvasElement[]
}

// ============= 聯合類型 =============

export type CanvasElement =
  | TextElement
  | ImageElement
  | ShapeElement
  | DecorationElement
  | IconElement
  | SpotCardElement
  | ItineraryItemElement
  | FlightInfoElement
  | AccommodationCardElement
  | DayHeaderElement

// ============= 頁面與畫布 =============

export interface CanvasPage {
  id: string
  name: string
  width: number          // mm
  height: number         // mm
  background: string     // 背景顏色或圖片
  elements: CanvasElement[]
}

export interface BrochureCanvas {
  id: string
  name: string
  pages: CanvasPage[]
  pageSize: 'A5' | 'A4' | 'custom'
  orientation: 'portrait' | 'landscape'
}

// ============= 智慧參考線 =============

export interface GuideLine {
  id: string
  type: 'horizontal' | 'vertical'
  position: number       // px
  isSnapping: boolean    // 是否正在吸附
}

export interface SnapGuide {
  type: 'edge' | 'center' | 'spacing'
  direction: 'horizontal' | 'vertical'
  position: number
  sourceId: string
  targetId?: string
}

// ============= 碰撞檢測 =============

export interface OverlapInfo {
  element1Id: string
  element2Id: string
  overlapArea: number    // 重疊面積
  overlapPercent: number // 重疊百分比
}

// ============= 圖層操作 =============

export type LayerOperation =
  | 'bring-to-front'
  | 'send-to-back'
  | 'bring-forward'
  | 'send-backward'
  | 'lock'
  | 'unlock'
  | 'show'
  | 'hide'
  | 'duplicate'
  | 'delete'
  | 'group'
  | 'ungroup'

// ============= 歷史記錄 =============

export interface HistoryAction {
  type: 'add' | 'remove' | 'update' | 'reorder'
  elementId: string
  previousState?: Partial<CanvasElement>
  newState?: Partial<CanvasElement>
  timestamp: number
}

// ============= 編輯器狀態 =============

export interface EditorState {
  selectedIds: string[]
  hoveredId: string | null
  isMultiSelect: boolean
  isPanning: boolean
  isZooming: boolean
  zoom: number
  panOffset: { x: number; y: number }
  showGrid: boolean
  showGuides: boolean
  showOverlapWarning: boolean
  snapToGuide: boolean
  snapThreshold: number  // px
}

// ============= 素材庫 =============

export interface LibraryAsset {
  id: string
  name: string
  category: DecorationCategory | 'image' | 'template'
  url: string
  thumbnailUrl: string
  tags: string[]
  isWorkspaceShared: boolean  // 是否公司共用
  uploadedBy?: string
  uploadedAt?: string
}

export interface LibraryCategory {
  id: string
  name: string
  icon: string
  assets: LibraryAsset[]
}

// ============= Fabric.js 擴展 =============

export interface FabricElementData {
  elementId: string
  elementType: ElementType
  customData?: Record<string, unknown>
}

export type FabricObjectWithData = FabricObject & {
  data?: FabricElementData
}

// ============= 事件 =============

export interface CanvasEventMap {
  'element:select': { elementId: string }
  'element:deselect': { elementId: string }
  'element:move': { elementId: string; x: number; y: number }
  'element:resize': { elementId: string; width: number; height: number }
  'element:rotate': { elementId: string; angle: number }
  'element:add': { element: CanvasElement }
  'element:remove': { elementId: string }
  'element:update': { elementId: string; changes: Partial<CanvasElement> }
  'guide:snap': { guide: SnapGuide }
  'overlap:detected': { overlaps: OverlapInfo[] }
  'zoom:change': { zoom: number }
  'page:change': { pageId: string }
}

export type CanvasEventHandler<K extends keyof CanvasEventMap> = (
  event: CanvasEventMap[K]
) => void
