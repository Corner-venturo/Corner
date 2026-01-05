/**
 * Theme Registry - 主題註冊表
 * 統一管理所有可用的主題
 */

import type { ThemeDefinition, ThemeMeta, ThemeRegistry } from './types'
import { classicTheme } from './classic'
import { modernTheme } from './modern'

// ============================================================================
// 主題註冊表
// ============================================================================

/** 所有已註冊的主題 */
const themes: Record<string, ThemeDefinition> = {
  [classicTheme.id]: classicTheme,
  [modernTheme.id]: modernTheme,
}

/** 預設主題 ID */
const defaultThemeId = 'classic'

/**
 * 取得主題定義
 * @param themeId 主題 ID
 * @returns 主題定義或 undefined
 */
function getTheme(themeId: string): ThemeDefinition | undefined {
  return themes[themeId]
}

/**
 * 取得所有主題元資料（用於選擇器 UI）
 * @returns 主題元資料陣列
 */
function getAllThemeMetas(): ThemeMeta[] {
  return Object.values(themes).map((theme) => ({
    id: theme.id,
    name: theme.name,
    description: theme.description,
    previewImage: theme.previewImage,
    tags: theme.tags,
    colors: {
      primary: theme.style.colors.primary,
      accent: theme.style.colors.accent,
      background: theme.style.colors.background,
    },
  }))
}

/**
 * 註冊新主題（用於動態載入或第三方主題）
 * @param theme 主題定義
 */
function registerTheme(theme: ThemeDefinition): void {
  if (themes[theme.id]) {
    console.warn(`[ThemeRegistry] Theme "${theme.id}" already exists, overwriting...`)
  }
  themes[theme.id] = theme
}

/**
 * 主題註冊表實例
 */
export const themeRegistry: ThemeRegistry = {
  themes,
  defaultThemeId,
  getTheme,
  getAllThemeMetas,
  registerTheme,
}

// ============================================================================
// 匯出
// ============================================================================

// 類型
export type {
  ThemeDefinition,
  ThemeStyle,
  ThemeColors,
  ThemeFonts,
  ThemeSpacing,
  ThemeLayouts,
  LayoutGenerator,
  ThemeMeta,
  ThemeRegistry,
  GenerateFromThemeOptions,
  ApplyThemeOptions,
} from './types'

// 主題
export { classicTheme } from './classic'
export { modernTheme } from './modern'

// 預設匯出
export default themeRegistry
