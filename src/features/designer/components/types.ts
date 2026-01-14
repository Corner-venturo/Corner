// venturo-erp/src/features/designer/components/types.ts
import type { Object as FabricObject } from 'fabric'

export interface BaseElement {
  id: string
  type: ElementType
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  locked: boolean
  visible: boolean
  zIndex: number
}

export type ElementType = 'shape' | 'text' | 'image' | 'icon' | 'group' | 'line' | 'sticker'

export type ShapeVariant = 'rectangle' | 'circle' | 'ellipse'
export type HorizontalAlign = 'left' | 'center' | 'right'
export type VerticalAlign = 'top' | 'center' | 'bottom'

// 漸層定義
export interface GradientColorStop {
  offset: number  // 0-1
  color: string
}

export interface GradientFill {
  type: 'linear' | 'radial'
  direction?: 'horizontal' | 'vertical'  // 簡化版方向
  colorStops: GradientColorStop[]
}

export interface ShapeElement extends BaseElement {
  type: 'shape'
  variant: ShapeVariant
  fill?: string
  gradient?: GradientFill  // 漸層填充（優先於 fill）
  stroke?: string
  strokeWidth?: number
  strokeDashArray?: number[] // 虛線樣式，如 [8, 4] 表示 8px 實線 + 4px 空白
  cornerRadius?: number // 統一圓角
  borderRadius?: ImageBorderRadius // 四角不同圓角（用於圓拱形狀）
  align?: {
    horizontal?: HorizontalAlign
    vertical?: VerticalAlign
  }
}

export interface TextStyle {
  fontFamily: string
  fontSize: number
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
  fontStyle: 'normal' | 'italic'
  textAlign: 'left' | 'center' | 'right'
  lineHeight: number
  letterSpacing: number
  color: string
}

export interface TextElement extends BaseElement {
  type: 'text'
  content: string
  style: TextStyle
}

export type ObjectFit = 'cover' | 'contain' | 'fill'

export interface ImageBorderRadius {
  topLeft?: number
  topRight?: number
  bottomLeft?: number
  bottomRight?: number
}

/**
 * 圖片色彩調整設定（Lightroom 風格）
 * 所有數值範圍為 -100 到 100，0 為預設值
 */
export interface ImageAdjustments {
  exposure: number      // 曝光度
  contrast: number      // 對比度
  highlights: number    // 高光
  shadows: number       // 陰影
  clarity: number       // 銳利度/清晰度
  saturation: number    // 飽和度
  temperature: number   // 色溫
  tint: number          // 色調
  vignette: number      // 暈影 (0 to 100)
}

/**
 * 圖片位置設定
 */
export interface ImagePositionSettings {
  x: number      // 水平位置 0-100 (百分比，50 = 置中)
  y: number      // 垂直位置 0-100 (百分比，50 = 置中)
  scale: number  // 縮放比例 1-3 (1 = 原始大小)
}

/**
 * 預設圖片調整值
 */
export const DEFAULT_IMAGE_ADJUSTMENTS: ImageAdjustments = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  clarity: 0,
  saturation: 0,
  temperature: 0,
  tint: 0,
  vignette: 0,
}

/**
 * 預設圖片位置值
 */
export const DEFAULT_IMAGE_POSITION: ImagePositionSettings = {
  x: 50,
  y: 50,
  scale: 1,
}

export interface ImageElement extends BaseElement {
  type: 'image'
  src: string
  originalSrc?: string // 原始圖片 URL（套用調整前），用於重新處理
  objectFit: ObjectFit
  borderRadius?: ImageBorderRadius // 自訂圓角（支援圓拱形狀）
  // 新增：圖片編輯設定
  adjustments?: ImageAdjustments   // 色彩調整
  position?: ImagePositionSettings // 位置/縮放調整
}

// Material Symbols 圖標名稱
export type MaterialIconName =
  | 'schedule'
  | 'badge'
  | 'bakery_dining'
  | 'flight_class'
  | 'restaurant'
  | 'ramen_dining'
  | 'soup_kitchen'
  | 'skillet'
  | 'bento'
  | 'rice_bowl'
  | 'coffee'
  | 'dinner_dining'
  | 'hotel'
  | 'bed'
  | 'image'
  | 'location_on'
  | 'local_florist'
  | 'wb_sunny'
  | 'spa'
  | 'ac_unit'
  | 'wifi'
  | 'emergency'
  | 'info'
  | 'campaign'
  | 'assignment'
  | 'currency_yen'
  | 'airlines'
  | 'luggage'
  | 'flight_takeoff'

export interface IconElement extends BaseElement {
  type: 'icon'
  icon: MaterialIconName
  size: number // 圖標尺寸
  color: string
}

// 線條元素
export type LineStyle = 'solid' | 'dashed' | 'dotted'
export type LineEndpoint = 'none' | 'arrow' | 'circle' | 'diamond'

export interface LineElement extends BaseElement {
  type: 'line'
  // 起點和終點座標（相對於 x, y）
  x1: number
  y1: number
  x2: number
  y2: number
  stroke: string
  strokeWidth: number
  lineStyle: LineStyle
  startEndpoint?: LineEndpoint
  endEndpoint?: LineEndpoint
}

// 印章/貼紙元素
export type StickerCategory = 'frame' | 'decoration' | 'stamp' | 'badge' | 'divider'

export interface StickerElement extends BaseElement {
  type: 'sticker'
  category: StickerCategory
  stickerId: string  // 預設貼紙 ID
  primaryColor?: string   // 主色（可自訂）
  secondaryColor?: string // 副色（可自訂）
}

export interface GroupElement extends BaseElement {
  type: 'group'
  children: CanvasElement[]
}

export type CanvasElement = ShapeElement | TextElement | ImageElement | IconElement | GroupElement | LineElement | StickerElement

export interface CanvasPage {
  id: string
  name: string
  templateKey?: string // 模板 key（cover, toc, itinerary 等）
  width: number
  height: number
  backgroundColor: string
  elements: CanvasElement[]
}

export interface FabricElementData {
  elementId: string
  elementType: ElementType
}

export type FabricObjectWithData = FabricObject & {
  data: FabricElementData
}
