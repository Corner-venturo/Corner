/**
 * 預設貼紙/印章 SVG Path 定義
 *
 * 類似 Canva 的裝飾元素庫
 */

export interface StickerDefinition {
  id: string
  name: string
  category: 'frame' | 'decoration' | 'stamp' | 'badge' | 'divider'
  path: string
  viewBox: { width: number; height: number }
  defaultColor?: string
}

// 貼紙路徑定義
export const STICKER_PATHS: Record<string, StickerDefinition> = {
  // === 分隔線 (Dividers) ===
  'divider-simple': {
    id: 'divider-simple',
    name: '簡約分隔線',
    category: 'divider',
    path: 'M0,2 L100,2',
    viewBox: { width: 100, height: 4 },
    defaultColor: '#c9aa7c',
  },
  'divider-dots': {
    id: 'divider-dots',
    name: '點狀分隔線',
    category: 'divider',
    path: 'M5,5 A2,2 0 1,1 5.001,5 M25,5 A2,2 0 1,1 25.001,5 M45,5 A2,2 0 1,1 45.001,5 M65,5 A2,2 0 1,1 65.001,5 M85,5 A2,2 0 1,1 85.001,5',
    viewBox: { width: 90, height: 10 },
    defaultColor: '#c9aa7c',
  },
  'divider-diamond': {
    id: 'divider-diamond',
    name: '菱形分隔線',
    category: 'divider',
    path: 'M0,5 L40,5 M50,0 L55,5 L50,10 L45,5 Z M60,5 L100,5',
    viewBox: { width: 100, height: 10 },
    defaultColor: '#c9aa7c',
  },
  'divider-wave': {
    id: 'divider-wave',
    name: '波浪分隔線',
    category: 'divider',
    path: 'M0,5 Q12.5,0 25,5 T50,5 T75,5 T100,5',
    viewBox: { width: 100, height: 10 },
    defaultColor: '#c9aa7c',
  },
  'divider-ornate': {
    id: 'divider-ornate',
    name: '華麗分隔線',
    category: 'divider',
    path: 'M0,10 L35,10 M40,5 Q45,0 50,5 Q55,10 50,15 Q45,10 40,15 Q35,10 40,5 M65,10 L100,10',
    viewBox: { width: 100, height: 20 },
    defaultColor: '#c9aa7c',
  },

  // === 裝飾框 (Frames) ===
  'frame-simple': {
    id: 'frame-simple',
    name: '簡約框',
    category: 'frame',
    path: 'M5,0 L95,0 L100,5 L100,95 L95,100 L5,100 L0,95 L0,5 Z M10,5 L90,5 L95,10 L95,90 L90,95 L10,95 L5,90 L5,10 Z',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#c9aa7c',
  },
  'frame-rounded': {
    id: 'frame-rounded',
    name: '圓角框',
    category: 'frame',
    path: 'M15,0 L85,0 Q100,0 100,15 L100,85 Q100,100 85,100 L15,100 Q0,100 0,85 L0,15 Q0,0 15,0 M20,5 L80,5 Q95,5 95,20 L95,80 Q95,95 80,95 L20,95 Q5,95 5,80 L5,20 Q5,5 20,5',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#c9aa7c',
  },
  'frame-double': {
    id: 'frame-double',
    name: '雙線框',
    category: 'frame',
    path: 'M0,0 L100,0 L100,100 L0,100 Z M3,3 L97,3 L97,97 L3,97 Z M8,8 L92,8 L92,92 L8,92 Z M11,11 L89,11 L89,89 L11,89 Z',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#c9aa7c',
  },

  // === 裝飾元素 (Decorations) ===
  'deco-corner-tl': {
    id: 'deco-corner-tl',
    name: '左上角花',
    category: 'decoration',
    path: 'M0,30 Q0,0 30,0 L25,5 Q5,5 5,25 Z M0,25 L5,20 Q5,10 15,5 L20,0 Q0,0 0,25',
    viewBox: { width: 30, height: 30 },
    defaultColor: '#c9aa7c',
  },
  'deco-corner-tr': {
    id: 'deco-corner-tr',
    name: '右上角花',
    category: 'decoration',
    path: 'M30,30 Q30,0 0,0 L5,5 Q25,5 25,25 Z M30,25 L25,20 Q25,10 15,5 L10,0 Q30,0 30,25',
    viewBox: { width: 30, height: 30 },
    defaultColor: '#c9aa7c',
  },
  'deco-flourish': {
    id: 'deco-flourish',
    name: '花飾',
    category: 'decoration',
    path: 'M50,0 Q55,20 75,25 Q55,30 50,50 Q45,30 25,25 Q45,20 50,0 M50,10 Q53,20 60,22 Q53,24 50,35 Q47,24 40,22 Q47,20 50,10',
    viewBox: { width: 100, height: 50 },
    defaultColor: '#c9aa7c',
  },
  'deco-star': {
    id: 'deco-star',
    name: '星星',
    category: 'decoration',
    path: 'M25,0 L30,18 L50,18 L34,29 L40,47 L25,36 L10,47 L16,29 L0,18 L20,18 Z',
    viewBox: { width: 50, height: 47 },
    defaultColor: '#c9aa7c',
  },
  'deco-heart': {
    id: 'deco-heart',
    name: '愛心',
    category: 'decoration',
    path: 'M25,45 L5,25 Q0,15 10,10 Q20,5 25,15 Q30,5 40,10 Q50,15 45,25 Z',
    viewBox: { width: 50, height: 50 },
    defaultColor: '#c9aa7c',
  },
  'deco-leaf': {
    id: 'deco-leaf',
    name: '葉子',
    category: 'decoration',
    path: 'M25,0 Q50,25 25,50 Q0,25 25,0 M25,10 L25,40 M15,20 Q25,25 35,20',
    viewBox: { width: 50, height: 50 },
    defaultColor: '#c9aa7c',
  },

  // === 徽章 (Badges) ===
  'badge-circle': {
    id: 'badge-circle',
    name: '圓形徽章',
    category: 'badge',
    path: 'M50,0 A50,50 0 1,1 49.99,0 M50,5 A45,45 0 1,1 49.99,5 M50,10 A40,40 0 1,1 49.99,10',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#c9aa7c',
  },
  'badge-ribbon': {
    id: 'badge-ribbon',
    name: '綬帶徽章',
    category: 'badge',
    path: 'M50,0 A40,40 0 1,0 50,80 A40,40 0 1,0 50,0 M10,60 L0,100 L20,85 L40,100 L30,70 M70,70 L60,100 L80,85 L100,100 L90,60',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#c9aa7c',
  },
  'badge-banner': {
    id: 'badge-banner',
    name: '旗幟',
    category: 'badge',
    path: 'M0,0 L100,0 L90,15 L100,30 L0,30 L10,15 Z',
    viewBox: { width: 100, height: 30 },
    defaultColor: '#c9aa7c',
  },

  // === 印章 (Stamps) ===
  'stamp-circle': {
    id: 'stamp-circle',
    name: '圓形印章',
    category: 'stamp',
    path: 'M50,0 A50,50 0 1,1 49.99,0 M50,8 A42,42 0 1,1 49.99,8',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#c08374',
  },
  'stamp-rect': {
    id: 'stamp-rect',
    name: '方形印章',
    category: 'stamp',
    path: 'M0,0 L100,0 L100,60 L0,60 Z M5,5 L95,5 L95,55 L5,55 Z',
    viewBox: { width: 100, height: 60 },
    defaultColor: '#c08374',
  },
  'stamp-approved': {
    id: 'stamp-approved',
    name: '認證印章',
    category: 'stamp',
    path: 'M50,0 L58,19 L79,19 L63,31 L70,50 L50,38 L30,50 L37,31 L21,19 L42,19 Z M50,15 L54,26 L66,26 L57,33 L61,44 L50,36 L39,44 L43,33 L34,26 L46,26 Z',
    viewBox: { width: 100, height: 50 },
    defaultColor: '#c9aa7c',
  },

  // === 旅遊主題 ===
  'travel-plane': {
    id: 'travel-plane',
    name: '飛機',
    category: 'decoration',
    path: 'M48,0 L52,0 L52,20 L80,35 L80,40 L52,30 L52,45 L60,50 L60,55 L50,52 L40,55 L40,50 L48,45 L48,30 L20,40 L20,35 L48,20 Z',
    viewBox: { width: 100, height: 55 },
    defaultColor: '#c9aa7c',
  },
  'travel-compass': {
    id: 'travel-compass',
    name: '指南針',
    category: 'decoration',
    path: 'M50,0 A50,50 0 1,1 49.99,0 M50,5 A45,45 0 1,1 49.99,5 M50,15 L55,45 L50,55 L45,45 Z M50,15 L45,45 L50,55 L55,45 Z',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#c9aa7c',
  },
  'travel-camera': {
    id: 'travel-camera',
    name: '相機',
    category: 'decoration',
    path: 'M30,10 L40,10 L45,0 L55,0 L60,10 L90,10 Q100,10 100,20 L100,70 Q100,80 90,80 L10,80 Q0,80 0,70 L0,20 Q0,10 10,10 L30,10 M50,25 A20,20 0 1,1 49.99,25 M50,35 A10,10 0 1,1 49.99,35',
    viewBox: { width: 100, height: 80 },
    defaultColor: '#c9aa7c',
  },
}

/**
 * 按分類取得貼紙列表
 */
export function getStickersByCategory(category: StickerDefinition['category']): StickerDefinition[] {
  return Object.values(STICKER_PATHS).filter((s) => s.category === category)
}

/**
 * 取得所有貼紙
 */
export function getAllStickers(): StickerDefinition[] {
  return Object.values(STICKER_PATHS)
}

/**
 * 取得貼紙 viewBox
 */
export function getStickerViewBox(stickerId: string): { width: number; height: number } {
  const sticker = STICKER_PATHS[stickerId]
  return sticker?.viewBox || { width: 100, height: 100 }
}

/**
 * 貼紙分類標籤
 */
export const STICKER_CATEGORIES = {
  divider: '分隔線',
  frame: '裝飾框',
  decoration: '裝飾',
  badge: '徽章',
  stamp: '印章',
} as const
