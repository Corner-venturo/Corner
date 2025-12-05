/**
 * Morandi Color Palette
 * 優雅的莫蘭迪色系，適合旅遊行程手冊
 */
export const morandiColors = {
  // 主色系
  primary: '#E8D5C4', // 米色 - 主要背景色
  secondary: '#A8B4A5', // 灰綠色 - 次要元素
  accent: '#C3B5A7', // 奶茶色 - 強調色
  gold: '#C9A961', // 柔和金色 - 重點裝飾（降低飽和度）
  goldLight: '#E5D4A6', // 淺金色 - 金色背景

  // 文字色系
  text: {
    primary: '#3D2914', // 深咖啡色 - 主要文字
    secondary: '#6B5D52', // 中咖啡色 - 次要文字
    light: '#9E8F81', // 淺咖啡色 - 輔助文字
    muted: '#AFA598', // 極淺咖啡 - 輕度文字
  },

  // 背景色系
  background: {
    main: '#FAF8F5', // 主背景
    cream: '#F5F0EB', // 奶油色背景
    white: '#FEFEFE', // 柔白背景
    lightGold: '#F9F5ED', // 淺金背景
  },

  // 邊框色系
  border: {
    light: '#EDE8E0', // 淺邊框
    medium: '#E0D8CC', // 中等邊框
    gold: '#D4C5A8', // 金色邊框
  },

  // 卡片陰影
  shadow: {
    soft: 'rgba(61, 41, 20, 0.08)', // 柔和陰影
    medium: 'rgba(61, 41, 20, 0.12)', // 中等陰影
    strong: 'rgba(61, 41, 20, 0.16)', // 強陰影
  },

  // 輔助色系
  support: {
    warmGray: '#D9CFC3', // 暖灰色
    coolGray: '#B8C4C2', // 冷灰色
    softPink: '#E8D5D5', // 柔粉色
    mutedBlue: '#B4C5D1', // 靜謐藍
    sage: '#C8D5C8', // 鼠尾草綠
  },
} as const

/**
 * 獲取顏色的輔助函數
 */
export function getMonandiColor(path: string): string {
  const keys = path.split('.')
  let value: any = morandiColors

  for (const key of keys) {
    value = value[key]
    if (value === undefined) {
      // Fallback to primary color if path not found
      return morandiColors.primary
    }
  }

  return value as string
}

/**
 * Tailwind CSS 類名映射
 */
export const morandiColorClasses = {
  // 背景色
  'bg-morandi-primary': 'bg-[#E8D5C4]',
  'bg-morandi-secondary': 'bg-[#A8B4A5]',
  'bg-morandi-accent': 'bg-[#C3B5A7]',
  'bg-morandi-gold': 'bg-[#D4AF37]',
  'bg-morandi-light': 'bg-[#FAF8F5]',

  // 文字色
  'text-morandi-primary': 'text-[#3D2914]',
  'text-morandi-secondary': 'text-[#6B5D52]',
  'text-morandi-light': 'text-[#9E8F81]',
  'text-morandi-gold': 'text-[#D4AF37]',

  // 邊框色
  'border-morandi-primary': 'border-[#E8D5C4]',
  'border-morandi-gold': 'border-[#D4AF37]',
} as const
