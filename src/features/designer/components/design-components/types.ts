/**
 * 設計元件型別定義
 *
 * 元件 = 複合元素（一組 CanvasElement 組合成有意義的區塊）
 */
import type { CanvasElement } from '../types'

/** 元件分類 */
export type ComponentCategory = 'cover' | 'itinerary' | 'info' | 'layout' | 'utility'

/** 元件風格 */
export type ComponentStyle = 'japanese' | 'modern'

/** 風格色盤 */
export interface StylePalette {
  primary: string
  secondary: string
  accent: string
  background: string
  lightBg: string
  border: string
  muted: string
  fontFamily: string
}

/** 日系風格色盤 */
export const JAPANESE_PALETTE: StylePalette = {
  primary: '#181511',
  secondary: '#666666',
  accent: '#c9aa7c',
  background: '#faf8f5',
  lightBg: '#f0ebe4',
  border: '#e8e4df',
  muted: '#999999',
  fontFamily: 'Noto Sans TC',
}

/** 現代簡約風格色盤 */
export const MODERN_PALETTE: StylePalette = {
  primary: '#1a1a1a',
  secondary: '#666666',
  accent: '#2563eb',
  background: '#ffffff',
  lightBg: '#f8fafc',
  border: '#e2e8f0',
  muted: '#94a3b8',
  fontFamily: 'Noto Sans TC',
}

/** 取得風格色盤 */
export function getStylePalette(style?: ComponentStyle): StylePalette {
  return style === 'modern' ? MODERN_PALETTE : JAPANESE_PALETTE
}

/** 元件生成選項 */
export interface ComponentGenerateOptions {
  /** 可用寬度 */
  width: number
  /** 起始 X */
  x: number
  /** 起始 Y */
  y: number
  /** 行程資料（可選） */
  data?: Record<string, unknown>
  /** 風格（可選，預設 japanese） */
  style?: ComponentStyle
}

/** 設計元件定義 */
export interface DesignComponent {
  /** 唯一 ID */
  id: string
  /** 顯示名稱 */
  name: string
  /** 分類 */
  category: ComponentCategory
  /** Lucide 圖示名稱 */
  icon: string
  /** 簡短說明 */
  description: string
  /** 生成函數 — 產生一組 CanvasElement */
  generate: (options: ComponentGenerateOptions) => CanvasElement[]
  /** 預設寬度 */
  defaultWidth: number
  /** 預設高度 */
  defaultHeight: number
}

/** 分類定義 */
export interface CategoryDefinition {
  id: ComponentCategory
  name: string
  icon: string
}

export const COMPONENT_CATEGORIES: CategoryDefinition[] = [
  { id: 'cover', name: '封面', icon: 'BookOpen' },
  { id: 'itinerary', name: '行程', icon: 'Calendar' },
  { id: 'info', name: '資訊', icon: 'Info' },
  { id: 'layout', name: '版面', icon: 'Layout' },
  { id: 'utility', name: '工具', icon: 'Wrench' },
]
