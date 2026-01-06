/**
 * 手冊主題風格定義
 * Brochure Theme Definitions
 */

export interface ThemeColors {
  primary: string       // 主色
  secondary: string     // 次要色
  accent: string        // 強調色
  background: string    // 背景色
  surface: string       // 卡片/區塊背景
  text: string          // 主要文字
  textMuted: string     // 次要文字
  border: string        // 邊框
}

export interface ThemeFonts {
  title: string         // 標題字型
  subtitle: string      // 副標題字型
  body: string          // 內文字型
  accent: string        // 裝飾字型
}

export interface ThemeDecorations {
  patterns: string[]    // 背景圖案 ID
  stamps: string[]      // 印章 ID
  dividers: string[]    // 分隔線 ID
  frames: string[]      // 相框 ID
  icons: string[]       // 圖標風格
}

export interface ThemeLayout {
  coverStyle: 'full-bleed' | 'framed' | 'minimal' | 'split'
  contentDensity: 'spacious' | 'balanced' | 'compact'
  imageStyle: 'rounded' | 'sharp' | 'polaroid' | 'circle'
  cardStyle: 'flat' | 'elevated' | 'bordered' | 'glass'
}

export interface BrochureTheme {
  id: string
  name: string
  nameEn: string
  description: string
  region: 'japan' | 'korea' | 'europe' | 'southeast-asia' | 'oceania' | 'americas' | 'universal'
  preview: string       // 預覽圖 URL
  colors: ThemeColors
  fonts: ThemeFonts
  decorations: ThemeDecorations
  layout: ThemeLayout
}

// ============= 預設主題 =============

export const THEME_JAPAN_TRADITIONAL: BrochureTheme = {
  id: 'japan-traditional',
  name: '日本和風',
  nameEn: 'Japanese Traditional',
  description: '典雅的和風設計，適合京都、奈良等傳統文化之旅',
  region: 'japan',
  preview: '/themes/japan-traditional.jpg',
  colors: {
    primary: '#2d4a3e',      // 深綠
    secondary: '#8b7355',     // 褐色
    accent: '#c9aa7c',        // 金色
    background: '#f6f4f1',    // 米白
    surface: '#ffffff',
    text: '#3a3633',
    textMuted: '#8b8680',
    border: '#e5e0d8',
  },
  fonts: {
    title: 'Noto Serif JP',
    subtitle: 'Noto Sans JP',
    body: 'Noto Sans JP',
    accent: 'Zen Maru Gothic',
  },
  decorations: {
    patterns: ['seigaiha', 'asanoha', 'sakura-scatter'],
    stamps: ['hanko-circle', 'torii-stamp', 'sakura-stamp'],
    dividers: ['wave-line', 'bamboo-line', 'cloud-line'],
    frames: ['shoji-frame', 'round-window', 'gold-border'],
    icons: ['japanese-style'],
  },
  layout: {
    coverStyle: 'full-bleed',
    contentDensity: 'spacious',
    imageStyle: 'rounded',
    cardStyle: 'bordered',
  },
}

export const THEME_JAPAN_MODERN: BrochureTheme = {
  id: 'japan-modern',
  name: '日本現代',
  nameEn: 'Japanese Modern',
  description: '簡約現代風格，適合東京、大阪等都市旅行',
  region: 'japan',
  preview: '/themes/japan-modern.jpg',
  colors: {
    primary: '#1a1a2e',      // 深藍黑
    secondary: '#4a4e69',     // 灰紫
    accent: '#e94560',        // 粉紅
    background: '#f8f9fa',
    surface: '#ffffff',
    text: '#212529',
    textMuted: '#6c757d',
    border: '#dee2e6',
  },
  fonts: {
    title: 'Noto Sans JP',
    subtitle: 'Noto Sans JP',
    body: 'Noto Sans JP',
    accent: 'M PLUS Rounded 1c',
  },
  decorations: {
    patterns: ['dots-grid', 'line-pattern', 'geometric'],
    stamps: ['circle-stamp', 'square-stamp'],
    dividers: ['thin-line', 'dot-line'],
    frames: ['minimal-frame', 'shadow-frame'],
    icons: ['minimal-style'],
  },
  layout: {
    coverStyle: 'minimal',
    contentDensity: 'balanced',
    imageStyle: 'sharp',
    cardStyle: 'elevated',
  },
}

export const THEME_EUROPE_ELEGANT: BrochureTheme = {
  id: 'europe-elegant',
  name: '歐洲典雅',
  nameEn: 'European Elegant',
  description: '優雅歐式設計，適合法國、義大利等文化之旅',
  region: 'europe',
  preview: '/themes/europe-elegant.jpg',
  colors: {
    primary: '#1a365d',      // 深藍
    secondary: '#4a5568',     // 灰色
    accent: '#d69e2e',        // 金色
    background: '#fffdf7',    // 象牙白
    surface: '#ffffff',
    text: '#2d3748',
    textMuted: '#718096',
    border: '#e2e8f0',
  },
  fonts: {
    title: 'Playfair Display',
    subtitle: 'Lato',
    body: 'Lato',
    accent: 'Great Vibes',
  },
  decorations: {
    patterns: ['damask', 'fleur-de-lis', 'marble'],
    stamps: ['wax-seal', 'postmark', 'royal-crest'],
    dividers: ['ornament-line', 'scroll-divider'],
    frames: ['ornate-frame', 'vintage-frame', 'gold-frame'],
    icons: ['classic-style'],
  },
  layout: {
    coverStyle: 'framed',
    contentDensity: 'spacious',
    imageStyle: 'polaroid',
    cardStyle: 'bordered',
  },
}

export const THEME_TROPICAL: BrochureTheme = {
  id: 'tropical',
  name: '熱帶海島',
  nameEn: 'Tropical Paradise',
  description: '活力繽紛設計，適合峇里島、馬爾地夫等海島之旅',
  region: 'southeast-asia',
  preview: '/themes/tropical.jpg',
  colors: {
    primary: '#0d9488',      // 青綠
    secondary: '#059669',     // 翠綠
    accent: '#f59e0b',        // 橙黃
    background: '#f0fdfa',    // 淺青
    surface: '#ffffff',
    text: '#134e4a',
    textMuted: '#5eead4',
    border: '#99f6e4',
  },
  fonts: {
    title: 'Pacifico',
    subtitle: 'Poppins',
    body: 'Poppins',
    accent: 'Satisfy',
  },
  decorations: {
    patterns: ['palm-leaves', 'waves', 'tropical-flowers'],
    stamps: ['sun-stamp', 'shell-stamp', 'hibiscus'],
    dividers: ['wave-divider', 'leaf-divider'],
    frames: ['bamboo-frame', 'shell-frame'],
    icons: ['tropical-style'],
  },
  layout: {
    coverStyle: 'full-bleed',
    contentDensity: 'balanced',
    imageStyle: 'rounded',
    cardStyle: 'glass',
  },
}

export const THEME_MINIMAL: BrochureTheme = {
  id: 'minimal',
  name: '簡約素雅',
  nameEn: 'Minimal Clean',
  description: '極簡設計風格，適合任何目的地',
  region: 'universal',
  preview: '/themes/minimal.jpg',
  colors: {
    primary: '#18181b',      // 黑
    secondary: '#3f3f46',     // 深灰
    accent: '#a1a1aa',        // 灰
    background: '#fafafa',
    surface: '#ffffff',
    text: '#27272a',
    textMuted: '#71717a',
    border: '#e4e4e7',
  },
  fonts: {
    title: 'Inter',
    subtitle: 'Inter',
    body: 'Inter',
    accent: 'Inter',
  },
  decorations: {
    patterns: ['none'],
    stamps: ['circle-outline'],
    dividers: ['thin-line'],
    frames: ['simple-border'],
    icons: ['outline-style'],
  },
  layout: {
    coverStyle: 'minimal',
    contentDensity: 'spacious',
    imageStyle: 'sharp',
    cardStyle: 'flat',
  },
}

export const THEME_KOREA_MODERN: BrochureTheme = {
  id: 'korea-modern',
  name: '韓國時尚',
  nameEn: 'Korean Modern',
  description: '韓系時尚設計，適合首爾、釜山等韓國之旅',
  region: 'korea',
  preview: '/themes/korea-modern.jpg',
  colors: {
    primary: '#3730a3',      // 紫藍
    secondary: '#6366f1',     // 紫
    accent: '#ec4899',        // 粉紅
    background: '#fdf4ff',
    surface: '#ffffff',
    text: '#1e1b4b',
    textMuted: '#a78bfa',
    border: '#e9d5ff',
  },
  fonts: {
    title: 'Noto Sans KR',
    subtitle: 'Noto Sans KR',
    body: 'Noto Sans KR',
    accent: 'Black Han Sans',
  },
  decorations: {
    patterns: ['hanbok-pattern', 'korean-cloud'],
    stamps: ['korean-seal', 'heart-stamp'],
    dividers: ['gradient-line', 'dot-line'],
    frames: ['soft-frame', 'gradient-frame'],
    icons: ['korean-style'],
  },
  layout: {
    coverStyle: 'split',
    contentDensity: 'balanced',
    imageStyle: 'rounded',
    cardStyle: 'glass',
  },
}

// ============= 主題集合 =============

export const ALL_THEMES: BrochureTheme[] = [
  THEME_JAPAN_TRADITIONAL,
  THEME_JAPAN_MODERN,
  THEME_KOREA_MODERN,
  THEME_EUROPE_ELEGANT,
  THEME_TROPICAL,
  THEME_MINIMAL,
]

// 根據地區篩選主題
export function getThemesByRegion(region: BrochureTheme['region']): BrochureTheme[] {
  if (region === 'universal') return ALL_THEMES
  return ALL_THEMES.filter(t => t.region === region || t.region === 'universal')
}

// 根據國家/城市推薦主題
export function recommendTheme(country: string, city?: string): BrochureTheme {
  const countryLower = country.toLowerCase()
  const cityLower = city?.toLowerCase() || ''

  // 日本
  if (countryLower.includes('japan') || countryLower.includes('日本')) {
    if (cityLower.includes('tokyo') || cityLower.includes('osaka') || cityLower.includes('東京') || cityLower.includes('大阪')) {
      return THEME_JAPAN_MODERN
    }
    return THEME_JAPAN_TRADITIONAL
  }

  // 韓國
  if (countryLower.includes('korea') || countryLower.includes('韓國')) {
    return THEME_KOREA_MODERN
  }

  // 歐洲
  if (['france', 'italy', 'spain', 'germany', 'uk', 'england', '法國', '義大利', '西班牙', '德國', '英國']
      .some(c => countryLower.includes(c))) {
    return THEME_EUROPE_ELEGANT
  }

  // 東南亞海島
  if (['bali', 'thailand', 'vietnam', 'philippines', 'maldives', '峇里', '泰國', '越南', '菲律賓', '馬爾地夫']
      .some(c => countryLower.includes(c) || cityLower.includes(c))) {
    return THEME_TROPICAL
  }

  // 預設
  return THEME_MINIMAL
}

// 取得主題 by ID
export function getThemeById(id: string): BrochureTheme | undefined {
  return ALL_THEMES.find(t => t.id === id)
}
