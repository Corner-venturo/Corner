/**
 * Venturo CIS Color Palette v2.1
 * 企業識別色系（原莫蘭迪色系）
 */
export const morandiColors = {
  // 主色系 - Venturo CIS v2.1
  primary: '#333333', // Charcoal - 主要文字
  secondary: '#8C8C8C', // Text Sub - 次要文字
  accent: '#B8A99A', // Taupe - 強調色/主色
  gold: '#B8A99A', // Taupe - 主色（保持相容性）
  goldLight: '#C6B9AC', // Taupe Light - 淺主色
  goldDark: '#9E8C7A', // Taupe Dark - 深主色/hover

  // 文字色系
  text: {
    primary: '#333333', // Charcoal - 主要文字
    secondary: '#8C8C8C', // Text Sub - 次要文字
    light: '#8C8C8C', // Text Sub - 輔助文字
    muted: '#8C8C8C', // Text Sub - 輕度文字
  },

  // 背景色系
  background: {
    main: '#F9F8F6', // Off-White - 主背景
    cream: '#F9F8F6', // Off-White
    white: '#FFFFFF', // Surface - 純白
    lightGold: '#F9F8F6', // Off-White
  },

  // 邊框色系
  border: {
    light: '#E8E4E0', // Beige - 淺邊框
    medium: '#E8E4E0', // Beige - 中等邊框
    gold: '#B8A99A', // Taupe - 主色邊框
  },

  // 卡片陰影
  shadow: {
    soft: 'rgba(51, 51, 51, 0.08)', // 柔和陰影
    medium: 'rgba(51, 51, 51, 0.12)', // 中等陰影
    strong: 'rgba(51, 51, 51, 0.16)', // 強陰影
  },

  // 語意色系
  semantic: {
    success: '#8FA38F', // Fern - 成功
    warning: '#D4B483', // Warm - 警告
    error: '#C77D7D', // Muted Red - 錯誤
    info: '#8FA9C2', // Cool Blue - 資訊
  },

  // 輔助色系
  support: {
    warmGray: '#E8E4E0', // Beige
    coolGray: '#C9D4C5', // Sage
    softPink: '#C77D7D', // Muted Red（淺化）
    mutedBlue: '#8FA9C2', // Cool Blue
    sage: '#C9D4C5', // Sage Green
  },
} as const

/**
 * 獲取顏色的輔助函數
 */
export function getMonandiColor(path: string): string {
  const keys = path.split('.')
  let value: Record<string, unknown> | string = morandiColors as Record<string, unknown>

  for (const key of keys) {
    if (typeof value === 'string') break
    value = value[key] as Record<string, unknown> | string
    if (value === undefined) {
      // Fallback to primary color if path not found
      return morandiColors.primary
    }
  }

  return value as string
}

/**
 * Tailwind CSS 類名映射 - Venturo CIS v2.1
 */
export const morandiColorClasses = {
  // 背景色
  'bg-morandi-primary': 'bg-[#333333]',
  'bg-morandi-secondary': 'bg-[#8C8C8C]',
  'bg-morandi-accent': 'bg-[#B8A99A]',
  'bg-morandi-gold': 'bg-[#B8A99A]',
  'bg-morandi-light': 'bg-[#F9F8F6]',

  // 文字色
  'text-morandi-primary': 'text-[#333333]',
  'text-morandi-secondary': 'text-[#8C8C8C]',
  'text-morandi-light': 'text-[#8C8C8C]',
  'text-morandi-gold': 'text-[#B8A99A]',

  // 邊框色
  'border-morandi-primary': 'border-[#E8E4E0]',
  'border-morandi-gold': 'border-[#B8A99A]',
} as const
