/**
 * Theme Types
 * 主題系統的核心類型定義
 *
 * 主題包含兩個主要部分：
 * 1. 風格設定 (Style) - 顏色、字體
 * 2. 版面生成 (Layout) - 各頁面類型的元素佈局
 */

import type { CanvasElement } from '../../canvas-editor/types'
import type { PageTemplateType, PageDataSnapshot, BrochureSettings } from '../types'

// ============================================================================
// 主題風格設定
// ============================================================================

/** 顏色配置 */
export interface ThemeColors {
  /** 主色 - 用於標題、強調元素 */
  primary: string

  /** 主色淺色 - 用於背景、漸層 */
  primaryLight: string

  /** 主色深色 - 用於文字、邊框 */
  primaryDark: string

  /** 強調色 - 用於按鈕、CTA */
  accent: string

  /** 強調色淺色 */
  accentLight: string

  /** 背景色 */
  background: string

  /** 卡片背景色 */
  cardBackground: string

  /** 主文字顏色 */
  textPrimary: string

  /** 次要文字顏色 */
  textSecondary: string

  /** 淺色文字（用於深色背景） */
  textLight: string

  /** 邊框顏色 */
  border: string

  /** 裝飾用漸層 */
  gradients?: {
    header?: { start: string; end: string; angle: number }
    accent?: { start: string; end: string; angle: number }
  }
}

/** 字體配置 */
export interface ThemeFonts {
  /** 主要字體 */
  primary: string

  /** 標題字體 */
  heading: string

  /** 裝飾字體（可選） */
  accent?: string

  /** 字體大小比例 */
  scale: {
    /** 大標題 */
    h1: number
    /** 中標題 */
    h2: number
    /** 小標題 */
    h3: number
    /** 內文 */
    body: number
    /** 小字 */
    small: number
    /** 極小字 */
    xs: number
  }
}

/** 間距配置 */
export interface ThemeSpacing {
  /** 頁面內邊距 */
  pagePadding: number

  /** 區塊間距 */
  sectionGap: number

  /** 元素間距 */
  elementGap: number

  /** 卡片內邊距 */
  cardPadding: number
}

/** 主題風格設定 */
export interface ThemeStyle {
  colors: ThemeColors
  fonts: ThemeFonts
  spacing: ThemeSpacing
}

// ============================================================================
// 版面生成器
// ============================================================================

/** 版面生成器函式簽名 */
export type LayoutGenerator = (
  dataSnapshot: PageDataSnapshot,
  style: ThemeStyle,
  settings: BrochureSettings
) => CanvasElement[]

/** 頁面版面生成器集合 */
export interface ThemeLayouts {
  /** 封面版面 */
  cover: LayoutGenerator

  /** 空白頁版面 */
  blank: LayoutGenerator

  /** 目錄版面 */
  contents: LayoutGenerator

  /** 總攬左版面 */
  'overview-left': LayoutGenerator

  /** 總攬右版面 */
  'overview-right': LayoutGenerator

  /** 每日行程左版面 */
  'day-left': LayoutGenerator

  /** 每日行程右版面 */
  'day-right': LayoutGenerator

  /** 住宿左版面 */
  'accommodation-left': LayoutGenerator

  /** 住宿右版面 */
  'accommodation-right': LayoutGenerator

  /** 自訂頁面版面 */
  custom: LayoutGenerator
}

// ============================================================================
// 主題定義
// ============================================================================

/** 完整的主題定義 */
export interface ThemeDefinition {
  /** 主題 ID（唯一識別碼） */
  id: string

  /** 主題名稱（顯示用） */
  name: string

  /** 主題描述 */
  description: string

  /** 預覽圖片 URL */
  previewImage?: string

  /** 主題標籤 */
  tags?: string[]

  /** 主題版本 */
  version: string

  /** 風格設定 */
  style: ThemeStyle

  /** 版面生成器 */
  layouts: ThemeLayouts
}

// ============================================================================
// 主題元資料（用於列表顯示）
// ============================================================================

/** 主題元資料（不含生成器，用於 UI 顯示） */
export interface ThemeMeta {
  id: string
  name: string
  description: string
  previewImage?: string
  tags?: string[]
  colors: {
    primary: string
    accent: string
    background: string
  }
}

// ============================================================================
// 主題註冊表類型
// ============================================================================

/** 主題註冊表 */
export interface ThemeRegistry {
  /** 所有已註冊的主題 */
  themes: Record<string, ThemeDefinition>

  /** 預設主題 ID */
  defaultThemeId: string

  /** 取得主題定義 */
  getTheme: (themeId: string) => ThemeDefinition | undefined

  /** 取得所有主題元資料（用於選擇器） */
  getAllThemeMetas: () => ThemeMeta[]

  /** 註冊新主題 */
  registerTheme: (theme: ThemeDefinition) => void
}

// ============================================================================
// 工具類型
// ============================================================================

/** 從主題生成元素的選項 */
export interface GenerateFromThemeOptions {
  /** 使用的主題 ID */
  themeId: string

  /** 頁面類型 */
  pageType: PageTemplateType

  /** 資料快照 */
  dataSnapshot: PageDataSnapshot

  /** 手冊設定 */
  settings: BrochureSettings
}

/** 套用主題的選項 */
export interface ApplyThemeOptions {
  /** 目標主題 ID */
  themeId: string

  /** 是否保留用戶覆寫 */
  preserveOverrides?: boolean

  /** 是否保留資料快照 */
  preserveDataSnapshots?: boolean
}
