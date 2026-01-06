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

export type ElementType = 'shape' | 'text' | 'image' | 'group'

export type ShapeVariant = 'rectangle' | 'circle' | 'line'
export type HorizontalAlign = 'left' | 'center' | 'right'
export type VerticalAlign = 'top' | 'center' | 'bottom'

export interface ShapeElement extends BaseElement {
  type: 'shape'
  variant: ShapeVariant
  fill?: string
  stroke?: string
  strokeWidth?: number
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

export interface ImageElement extends BaseElement {
  type: 'image'
  src: string
  objectFit: ObjectFit
}

export interface GroupElement extends BaseElement {
  type: 'group'
  children: CanvasElement[]
}

export type CanvasElement = ShapeElement | TextElement | ImageElement | GroupElement

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
