/**
 * ERP Design System - Morandi Color Palette
 * 基於 Design System Showcase 的完整色彩系統
 */
export const morandiColors = {
  // 主色系 (Primary Colors)
  primary: '#E8D5C4',     // Morandi Beige - 主色
  secondary: '#A8B4A5',   // Morandi Gray-Green - 次要色
  accent: '#C3B5A7',      // Morandi Milk Tea - 強調色
  gold: '#C9A961',        // Soft Gold - 金色
  goldLight: '#E5D4A6',   // 淺金色 - 金色背景
  goldHover: '#B89850',   // 金色 hover 狀態

  // 文字色系 (Text Colors)
  text: {
    primary: '#3D2914',   // Dark Text - 主要文字
    secondary: '#8B5D52', // Medium Text - 次要文字
    light: '#9E8F81',     // Light Text - 輔助文字
    muted: '#AFA598',     // 極淺 - 輕度文字
  },

  // 背景色系 (Background Colors)
  background: {
    main: '#FAF8F5',      // Main Background - 主背景
    cream: '#F5F0EB',     // Secondary Background - 次要背景
    white: '#FEFEFE',     // Background White - 白色背景
    lightGold: '#F9F5ED', // 淺金背景
  },

  // 邊框色系 (Border Colors)
  border: {
    light: '#EDE8E0',     // Light Border - 淺邊框
    medium: '#E0D8CC',    // Medium Border - 中等邊框
    gold: '#D4C5A8',      // Gold Border - 金色邊框
  },

  // 卡片陰影 (Shadows)
  shadow: {
    soft: 'rgba(61, 41, 20, 0.08)',    // 柔和陰影
    medium: 'rgba(61, 41, 20, 0.12)',  // 中等陰影
    strong: 'rgba(61, 41, 20, 0.16)',  // 強陰影
  },

  // 狀態色系 (Status Colors)
  status: {
    success: '#A8B4A5',     // 成功 - 灰綠
    successText: '#FFFFFF',
    warning: '#C9A961',     // 警告 - 金色
    warningText: '#FFFFFF',
    error: '#C47D7D',       // 錯誤 - 柔紅
    errorText: '#FFFFFF',
    processing: '#8B5D52',  // 處理中 - 棕色
    processingText: '#FFFFFF',
    info: '#B4C5D1',        // 資訊 - 靜謐藍
    infoText: '#3D2914',
  },

  // 按鈕色系 (Button Colors)
  button: {
    primary: '#C9A961',
    primaryHover: '#B89850',
    primaryText: '#FFFFFF',
    secondary: '#A8B4A5',
    secondaryHover: '#97A394',
    secondaryText: '#FFFFFF',
    outline: 'transparent',
    outlineBorder: '#C9A961',
    outlineText: '#C9A961',
  },

  // 輔助色系 (Support Colors)
  support: {
    warmGray: '#D9CFC3',  // 暖灰色
    coolGray: '#B8C4C2',  // 冷灰色
    softPink: '#E8D5D5',  // 柔粉色
    mutedBlue: '#B4C5D1', // 靜謐藍
    sage: '#C8D5C8',      // 鼠尾草綠
  },
} as const

/**
 * 獲取顏色的輔助函數
 */
export function getMonandiColor(path: string): string {
  const keys = path.split('.')
  let value: unknown = morandiColors

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key]
    } else {
      return morandiColors.primary
    }
  }

  return value as string
}

/**
 * Tailwind CSS 類名映射
 * 與 Design System 對應
 */
export const morandiColorClasses = {
  // 背景色
  'bg-morandi-primary': 'bg-[#E8D5C4]',
  'bg-morandi-secondary': 'bg-[#A8B4A5]',
  'bg-morandi-accent': 'bg-[#C3B5A7]',
  'bg-morandi-gold': 'bg-[#C9A961]',
  'bg-morandi-main': 'bg-[#FAF8F5]',
  'bg-morandi-cream': 'bg-[#F5F0EB]',
  'bg-morandi-white': 'bg-[#FEFEFE]',

  // 文字色
  'text-morandi-dark': 'text-[#3D2914]',
  'text-morandi-medium': 'text-[#8B5D52]',
  'text-morandi-light': 'text-[#9E8F81]',
  'text-morandi-gold': 'text-[#C9A961]',

  // 邊框色
  'border-morandi-light': 'border-[#EDE8E0]',
  'border-morandi-medium': 'border-[#E0D8CC]',
  'border-morandi-gold': 'border-[#D4C5A8]',

  // 狀態色
  'bg-status-success': 'bg-[#A8B4A5]',
  'bg-status-warning': 'bg-[#C9A961]',
  'bg-status-error': 'bg-[#C47D7D]',
  'bg-status-processing': 'bg-[#8B5D52]',
} as const
