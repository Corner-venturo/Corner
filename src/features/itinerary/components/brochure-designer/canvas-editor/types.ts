/**
 * Brochure Canvas Types - V2 Architecture
 *
 * A robust, declarative data model for the new canvas editor.
 */

import type { Object as FabricObject } from 'fabric'

// ============================================================================
// Base & Generic Types
// ============================================================================

/** The foundational properties for every element on the canvas. */
export interface BaseElement {
  id: string
  type: ElementType
  name: string // For the layers panel
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

/** Supported element types. */
export type ElementType = 'shape' | 'text' | 'image' | 'group'

// ============================================================================
// Atomic Element Types
// ============================================================================

// ---------- Shape Element ----------

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
  // V2 Architecture: Declarative alignment. The renderer will calculate the final position.
  align?: {
    horizontal?: HorizontalAlign
    vertical?: VerticalAlign
  }
}

// ---------- Text Element ----------

export interface TextStyle {
  fontFamily: string
  fontSize: number
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
  fontStyle: 'normal' | 'italic'
  textAlign: 'left' | 'center' | 'right' // This is for text alignment WITHIN the box
  lineHeight: number
  letterSpacing: number
  color: string
}

export interface TextElement extends BaseElement {
  type: 'text'
  content: string
  style: TextStyle
}

// ---------- Image Element ----------

export type ObjectFit = 'cover' | 'contain' | 'fill'

export interface ImageElement extends BaseElement {
  type: 'image'
  src: string
  // V2 Architecture: Declarative object fit, to be handled by the renderer.
  objectFit: ObjectFit
}

// ============================================================================
// Group Element Type
// ============================================================================

/** A group of other elements, allowing for composite objects. */
export interface GroupElement extends BaseElement {
  type: 'group'
  children: CanvasElement[]
}

// ============================================================================
// Union & Page Types
// ============================================================================

/** A union of all possible canvas elements. */
export type CanvasElement = ShapeElement | TextElement | ImageElement | GroupElement

/** Defines a single page in the brochure. */
export interface CanvasPage {
  id: string
  name: string
  width: number
  height: number
  backgroundColor: string
  elements: CanvasElement[]
}

// ============================================================================
// Fabric.js Integration Types
// ============================================================================

/** Custom data attached to every Fabric object to link it back to our schema. */
export interface FabricElementData {
  elementId: string
  elementType: ElementType
}

/** An extended FabricObject type that includes our custom data. */
export type FabricObjectWithData = FabricObject & {
  data: FabricElementData
}
