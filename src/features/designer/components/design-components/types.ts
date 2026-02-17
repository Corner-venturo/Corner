/**
 * 設計元件型別定義
 *
 * 元件 = 複合元素（一組 CanvasElement 組合成有意義的區塊）
 */
import type { CanvasElement } from '../types'

/** 元件分類 */
export type ComponentCategory = 'cover' | 'itinerary' | 'info' | 'layout' | 'utility'

/** 色盤 */
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

/** 中性預設色盤（使用者可在屬性面板自行調整） */
export const DEFAULT_PALETTE: StylePalette = {
  primary: '#333333',
  secondary: '#666666',
  accent: '#c9aa7c',
  background: '#ffffff',
  lightBg: '#f5f5f5',
  border: '#e0e0e0',
  muted: '#999999',
  fontFamily: 'Noto Sans TC',
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
