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

export type ElementType = 'shape' | 'text' | 'image' | 'icon' | 'group'

export type ShapeVariant = 'rectangle' | 'circle' | 'ellipse' | 'line'
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
  cornerRadius?: number
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

export interface ImageElement extends BaseElement {
  type: 'image'
  src: string
  objectFit: ObjectFit
  borderRadius?: ImageBorderRadius // 自訂圓角（支援圓拱形狀）
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

export interface GroupElement extends BaseElement {
  type: 'group'
  children: CanvasElement[]
}

export type CanvasElement = ShapeElement | TextElement | ImageElement | IconElement | GroupElement

export interface CanvasPage {
  id: string
  name: string
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
