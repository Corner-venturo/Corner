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

  // === 更多旅遊元素 ===
  'travel-suitcase': {
    id: 'travel-suitcase',
    name: '行李箱',
    category: 'decoration',
    path: 'M35,10 L35,5 Q35,0 40,0 L60,0 Q65,0 65,5 L65,10 M20,10 L80,10 Q90,10 90,20 L90,80 Q90,90 80,90 L20,90 Q10,90 10,80 L10,20 Q10,10 20,10 M30,25 L30,75 M70,25 L70,75 M40,50 L60,50',
    viewBox: { width: 100, height: 90 },
    defaultColor: '#c9aa7c',
  },
  'travel-passport': {
    id: 'travel-passport',
    name: '護照',
    category: 'decoration',
    path: 'M15,0 L85,0 Q95,0 95,10 L95,90 Q95,100 85,100 L15,100 Q5,100 5,90 L5,10 Q5,0 15,0 M50,20 A15,15 0 1,1 49.99,20 M30,55 L70,55 M30,65 L70,65 M30,75 L50,75',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#c9aa7c',
  },
  'travel-map': {
    id: 'travel-map',
    name: '地圖',
    category: 'decoration',
    path: 'M5,10 L35,0 L65,10 L95,0 L95,90 L65,100 L35,90 L5,100 Z M35,0 L35,90 M65,10 L65,100',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#c9aa7c',
  },
  'travel-pin': {
    id: 'travel-pin',
    name: '定位標記',
    category: 'decoration',
    path: 'M50,0 A30,30 0 0,1 50,60 Q50,80 50,100 Q50,80 50,60 A30,30 0 0,1 50,0 M50,20 A10,10 0 1,1 49.99,20',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#c08374',
  },
  'travel-mountain': {
    id: 'travel-mountain',
    name: '山景',
    category: 'decoration',
    path: 'M0,80 L25,30 L40,50 L60,20 L100,80 Z M60,20 L70,35 L80,25',
    viewBox: { width: 100, height: 80 },
    defaultColor: '#9fa68f',
  },
  'travel-sun': {
    id: 'travel-sun',
    name: '太陽',
    category: 'decoration',
    path: 'M50,30 A20,20 0 1,1 49.99,30 M50,0 L50,15 M50,85 L50,100 M0,50 L15,50 M85,50 L100,50 M15,15 L25,25 M75,75 L85,85 M85,15 L75,25 M25,75 L15,85',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#c9aa7c',
  },
  'travel-palm': {
    id: 'travel-palm',
    name: '棕櫚樹',
    category: 'decoration',
    path: 'M50,100 L50,40 M50,40 Q30,20 10,25 M50,40 Q40,15 25,10 M50,40 Q50,10 50,5 M50,40 Q60,15 75,10 M50,40 Q70,20 90,25',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#9fa68f',
  },
  'travel-wave': {
    id: 'travel-wave',
    name: '海浪',
    category: 'decoration',
    path: 'M0,50 Q15,30 30,50 T60,50 T90,50 T120,50 M0,70 Q15,50 30,70 T60,70 T90,70 T120,70',
    viewBox: { width: 120, height: 100 },
    defaultColor: '#a8c0b9',
  },
  'travel-temple': {
    id: 'travel-temple',
    name: '神社鳥居',
    category: 'decoration',
    path: 'M10,30 L90,30 M20,30 L20,100 M80,30 L80,100 M5,25 L95,25 Q95,15 90,10 L10,10 Q5,15 5,25 M30,60 L70,60 L70,100 L30,100 Z',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#c08374',
  },

  // === 食物元素 ===
  'food-utensils': {
    id: 'food-utensils',
    name: '餐具',
    category: 'decoration',
    path: 'M20,0 L20,40 Q20,50 30,50 L30,100 L40,100 L40,50 Q50,50 50,40 L50,0 M35,0 L35,20 M60,0 Q70,0 70,20 L70,100 L80,100 L80,20 Q80,0 90,0 L90,30 Q90,40 80,45 L80,100',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#c9aa7c',
  },
  'food-coffee': {
    id: 'food-coffee',
    name: '咖啡杯',
    category: 'decoration',
    path: 'M10,20 L70,20 L65,80 Q65,90 55,90 L25,90 Q15,90 15,80 Z M70,30 Q90,30 90,50 Q90,70 70,70',
    viewBox: { width: 100, height: 90 },
    defaultColor: '#c9aa7c',
  },

  // === 箭頭指示 ===
  'arrow-curved': {
    id: 'arrow-curved',
    name: '彎曲箭頭',
    category: 'decoration',
    path: 'M20,80 Q20,20 80,20 M60,5 L80,20 L60,35',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#c9aa7c',
  },
  'arrow-hand': {
    id: 'arrow-hand',
    name: '手指箭頭',
    category: 'decoration',
    path: 'M0,50 L70,50 M50,30 L70,50 L50,70 M80,35 Q90,35 90,45 L90,55 Q90,65 80,65 L75,65 L75,35 Z',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#c9aa7c',
  },

  // === 標籤/標記 ===
  'tag-price': {
    id: 'tag-price',
    name: '價格標籤',
    category: 'badge',
    path: 'M95,5 L95,45 L50,90 L5,45 L5,5 L95,5 M25,25 A8,8 0 1,1 24.99,25',
    viewBox: { width: 100, height: 95 },
    defaultColor: '#c9aa7c',
  },
  'tag-new': {
    id: 'tag-new',
    name: 'NEW 標籤',
    category: 'badge',
    path: 'M50,0 L61,35 L98,35 L68,57 L79,92 L50,70 L21,92 L32,57 L2,35 L39,35 Z',
    viewBox: { width: 100, height: 95 },
    defaultColor: '#c08374',
  },

  // === 對話框 ===
  'bubble-round': {
    id: 'bubble-round',
    name: '圓形對話框',
    category: 'frame',
    path: 'M50,10 Q90,10 90,40 Q90,70 50,70 L40,70 L30,85 L35,70 Q10,70 10,40 Q10,10 50,10',
    viewBox: { width: 100, height: 90 },
    defaultColor: '#e8e5e0',
  },
  'bubble-cloud': {
    id: 'bubble-cloud',
    name: '雲朵對話框',
    category: 'frame',
    path: 'M25,60 Q5,60 5,45 Q5,30 20,30 Q20,15 40,15 Q55,10 70,20 Q90,20 90,40 Q95,55 75,60 L60,60 L50,75 L55,60 Z',
    viewBox: { width: 100, height: 80 },
    defaultColor: '#e8e5e0',
  },

  // === 筆記/書寫區域 ===
  'note-lines-3': {
    id: 'note-lines-3',
    name: '3行書寫線',
    category: 'frame',
    path: 'M0,20 L100,20 M0,50 L100,50 M0,80 L100,80',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#d4c4b0',
  },
  'note-lines-5': {
    id: 'note-lines-5',
    name: '5行書寫線',
    category: 'frame',
    path: 'M0,15 L100,15 M0,32 L100,32 M0,49 L100,49 M0,66 L100,66 M0,83 L100,83',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#d4c4b0',
  },
  'note-box': {
    id: 'note-box',
    name: '筆記框',
    category: 'frame',
    path: 'M0,0 L100,0 L100,100 L0,100 Z M5,25 L95,25 M5,45 L95,45 M5,65 L95,65 M5,85 L95,85',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#d4c4b0',
  },
  'note-travel': {
    id: 'note-travel',
    name: '旅遊筆記',
    category: 'frame',
    path: 'M5,0 L95,0 L100,5 L100,95 L95,100 L5,100 L0,95 L0,5 Z M10,18 L90,18 M10,36 L90,36 M10,54 L90,54 M10,72 L90,72 M10,90 L90,90 M0,0 L15,0 L15,15 L0,15 Z',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#c9aa7c',
  },
  'note-memo': {
    id: 'note-memo',
    name: '備忘錄',
    category: 'frame',
    path: 'M10,0 L90,0 Q100,0 100,10 L100,90 Q100,100 90,100 L10,100 Q0,100 0,90 L0,10 Q0,0 10,0 M15,25 L85,25 M15,45 L85,45 M15,65 L85,65 M15,85 L60,85',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#e8e5e0',
  },
  'note-checklist': {
    id: 'note-checklist',
    name: '清單框',
    category: 'frame',
    path: 'M0,0 L100,0 L100,100 L0,100 Z M8,18 L18,18 L18,28 L8,28 Z M25,23 L95,23 M8,43 L18,43 L18,53 L8,53 Z M25,48 L95,48 M8,68 L18,68 L18,78 L8,78 Z M25,73 L95,73',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#d4c4b0',
  },

  // === 日期/時間框 ===
  'date-box': {
    id: 'date-box',
    name: '日期框',
    category: 'frame',
    path: 'M10,0 L90,0 Q100,0 100,10 L100,90 Q100,100 90,100 L10,100 Q0,100 0,90 L0,10 Q0,0 10,0 M0,25 L100,25',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#c9aa7c',
  },
  'calendar-icon': {
    id: 'calendar-icon',
    name: '日曆圖標',
    category: 'decoration',
    path: 'M20,10 L20,0 M80,10 L80,0 M10,10 L90,10 Q100,10 100,20 L100,90 Q100,100 90,100 L10,100 Q0,100 0,90 L0,20 Q0,10 10,10 M0,35 L100,35 M25,55 L40,55 L40,70 L25,70 Z M60,55 L75,55 L75,70 L60,70 Z',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#c9aa7c',
  },

  // === 標題裝飾 ===
  'title-banner': {
    id: 'title-banner',
    name: '標題橫幅',
    category: 'frame',
    path: 'M0,20 L15,0 L85,0 L100,20 L100,80 L85,100 L15,100 L0,80 Z',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#c9aa7c',
  },
  'title-ribbon': {
    id: 'title-ribbon',
    name: '緞帶標題',
    category: 'frame',
    path: 'M0,30 L10,20 L10,30 L90,30 L90,20 L100,30 L100,70 L90,80 L90,70 L10,70 L10,80 L0,70 Z',
    viewBox: { width: 100, height: 100 },
    defaultColor: '#c9aa7c',
  },
  'title-underline': {
    id: 'title-underline',
    name: '標題底線',
    category: 'divider',
    path: 'M0,5 L100,5 M0,12 L60,12',
    viewBox: { width: 100, height: 15 },
    defaultColor: '#c9aa7c',
  },
  'title-bracket': {
    id: 'title-bracket',
    name: '括號裝飾',
    category: 'frame',
    path: 'M15,0 Q0,0 0,20 L0,80 Q0,100 15,100 M85,0 Q100,0 100,20 L100,80 Q100,100 85,100',
    viewBox: { width: 100, height: 100 },
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
