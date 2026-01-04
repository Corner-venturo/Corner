/**
 * 手冊編輯器類型定義
 * Brochure Editor Type Definitions
 */

import type { Attraction } from '@/features/attractions/types'

// ============= 元素基礎類型 =============

// 資料綁定來源
export type DataSource =
  | 'itinerary'      // 行程表
  | 'flight'         // 航班資訊
  | 'accommodation'  // 住宿資訊
  | 'attraction'     // 景點資料庫
  | 'manual'         // 手動輸入

// 元素基礎屬性
export interface BaseElement {
  id: string
  type: ElementType
  name: string

  // 位置與尺寸
  x: number
  y: number
  width: number
  height: number
  rotation: number

  // 狀態
  locked: boolean
  visible: boolean
  selected?: boolean

  // 圖層
  zIndex: number

  // 資料綁定
  dataSource: DataSource
  dataBinding?: DataBinding
}

// 資料綁定資訊
export interface DataBinding {
  source: DataSource
  sourceId?: string        // 來源 ID（如景點 ID）
  field?: string           // 綁定欄位
  originalValue?: string   // 原始值（用於比對是否已修改）
  isUnbound?: boolean      // 是否已解除綁定
}

// ============= 元素類型 =============

export type ElementType =
  | 'text'
  | 'image'
  | 'shape'
  | 'attraction-card'  // 景點卡片（組合元素）
  | 'flight-info'      // 航班資訊
  | 'accommodation'    // 住宿資訊
  | 'day-header'       // 日期標題
  | 'sticker'          // 貼紙裝飾

// 文字元素
export interface TextElement extends BaseElement {
  type: 'text'
  content: string
  style: TextStyle
}

export interface TextStyle {
  fontFamily: string
  fontSize: number
  fontWeight: 'normal' | 'bold' | '500' | '600'
  fontStyle: 'normal' | 'italic'
  color: string
  textAlign: 'left' | 'center' | 'right'
  lineHeight: number
  letterSpacing: number
  textDecoration: 'none' | 'underline' | 'line-through'
}

// 圖片元素
export interface ImageElement extends BaseElement {
  type: 'image'
  src: string
  objectFit: 'cover' | 'contain' | 'fill'
  borderRadius: number
  // 裁切
  cropX: number
  cropY: number
  cropWidth: number
  cropHeight: number
}

// 形狀元素
export interface ShapeElement extends BaseElement {
  type: 'shape'
  variant: 'rectangle' | 'circle' | 'line'
  fill: string
  stroke: string
  strokeWidth: number
  cornerRadius: number
}

// 景點卡片元素（組合元素）
export interface AttractionCardElement extends BaseElement {
  type: 'attraction-card'
  attractionId: string
  attraction?: Attraction
  layout: 'vertical' | 'horizontal' | 'compact'
  showImage: boolean
  showDescription: boolean
  showDuration: boolean
}

// 航班資訊元素
export interface FlightInfoElement extends BaseElement {
  type: 'flight-info'
  flightNumber: string
  departure: string
  arrival: string
  departureTime: string
  arrivalTime: string
  date: string
}

// 住宿資訊元素
export interface AccommodationElement extends BaseElement {
  type: 'accommodation'
  hotelName: string
  address?: string
  checkIn?: string
  checkOut?: string
  rating?: number
  image?: string
}

// 日期標題元素
export interface DayHeaderElement extends BaseElement {
  type: 'day-header'
  dayNumber: number
  date: string
  title: string
}

// 貼紙元素
export interface StickerElement extends BaseElement {
  type: 'sticker'
  stickerId: string
  category: 'stamp' | 'decoration' | 'icon' | 'frame'
}

// 聯合類型
export type BrochureElement =
  | TextElement
  | ImageElement
  | ShapeElement
  | AttractionCardElement
  | FlightInfoElement
  | AccommodationElement
  | DayHeaderElement
  | StickerElement

// ============= 頁面與手冊 =============

export interface BrochurePage {
  id: string
  name: string
  pageNumber: number
  elements: BrochureElement[]
  background?: string
}

export interface Brochure {
  id: string
  name: string
  itineraryId: string
  themeId: string
  pages: BrochurePage[]
  createdAt: string
  updatedAt: string
}

// ============= 編輯器狀態 =============

export interface EditorState {
  // 當前狀態
  currentPageIndex: number
  selectedElementIds: string[]
  hoveredElementId: string | null

  // 工具狀態
  activeTool: 'select' | 'text' | 'shape' | 'pan'
  zoom: number

  // 面板狀態
  showLeftPanel: boolean
  showRightPanel: boolean
  rightPanelTab: 'attractions' | 'stickers' | 'library' | 'layers'

  // 歷史
  canUndo: boolean
  canRedo: boolean
}

// ============= 素材庫 =============

export interface StickerCategory {
  id: string
  name: string
  nameEn: string
  stickers: Sticker[]
}

export interface Sticker {
  id: string
  name: string
  src: string
  category: 'stamp' | 'decoration' | 'icon' | 'frame'
  tags: string[]
}

// ============= 畫布設定 =============

export const CANVAS_CONFIG = {
  // A5 尺寸 (像素，96dpi)
  pageWidth: 559,
  pageHeight: 794,

  // 畫布外暫存區
  workspaceWidth: 900,
  workspaceHeight: 1000,

  // 縮放範圍
  minZoom: 0.25,
  maxZoom: 2,
  defaultZoom: 0.8,

  // 網格
  gridSize: 10,
  snapThreshold: 5,
} as const

// ============= 預設樣式 =============

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'Noto Sans TC',
  fontSize: 14,
  fontWeight: 'normal',
  fontStyle: 'normal',
  color: '#3a3633',
  textAlign: 'left',
  lineHeight: 1.5,
  letterSpacing: 0,
  textDecoration: 'none',
}

export const DEFAULT_SHAPE_STYLE = {
  fill: '#ffffff',
  stroke: '#d4c4b0',
  strokeWidth: 1,
  cornerRadius: 8,
}
