/**
 * 模板轉元素工具
 * 將日系風格模板轉換為可編輯的 Canvas 元素
 */

import type {
  CanvasElement,
  TextElement,
  ImageElement,
  ShapeElement,
} from '../canvas-editor/types'
import type { BrochureCoverData } from '../types'
import type { Itinerary, DailyItineraryDay } from '@/stores/types'
import type { AccommodationInfo } from '../BrochureAccommodationLeft'

// 頁面類型
export type TemplatePageType =
  | 'cover'
  | 'blank'
  | 'contents'
  | 'overview-left'
  | 'overview-right'
  | `day-${number}-left`
  | `day-${number}-right`
  | 'accommodation-left'
  | 'accommodation-right'

// 轉換選項
export interface TemplateToElementsOptions {
  coverData?: BrochureCoverData
  itinerary?: Itinerary | null
  dayIndex?: number
  side?: 'left' | 'right'
  accommodations?: AccommodationInfo[]
  pageNumber?: number
}

// A5 尺寸 (px @ 96 DPI)
const A5_WIDTH = 559
const A5_HEIGHT = 794

// 生成唯一 ID
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// 建立文字元素
function createTextElement(
  name: string,
  content: string,
  x: number,
  y: number,
  options: Partial<TextElement['style']> & { width?: number; height?: number; zIndex?: number } = {}
): TextElement {
  const { width = 200, height = 30, zIndex = 0, ...style } = options
  return {
    id: generateId('text'),
    type: 'text',
    name,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    zIndex,
    content,
    style: {
      fontFamily: 'Noto Sans TC',
      fontSize: 16,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      lineHeight: 1.2,
      letterSpacing: 0,
      color: '#333333',
      textDecoration: 'none',
      ...style,
    },
  }
}

// 建立圖片元素
function createImageElement(
  name: string,
  src: string,
  x: number,
  y: number,
  width: number,
  height: number,
  zIndex = 0
): ImageElement {
  return {
    id: generateId('image'),
    type: 'image',
    name,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    zIndex,
    src,
    cropX: 0,
    cropY: 0,
    cropWidth: width,
    cropHeight: height,
    filters: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      blur: 0,
    },
    objectFit: 'cover',
  }
}

// 建立形狀元素
function createShapeElement(
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  options: { fill?: string; stroke?: string; strokeWidth?: number; cornerRadius?: number; zIndex?: number; opacity?: number } = {}
): ShapeElement {
  const { fill = '#e8e5e0', stroke = 'transparent', strokeWidth = 0, cornerRadius = 0, zIndex = 0, opacity = 1 } = options
  return {
    id: generateId('shape'),
    type: 'shape',
    name,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity,
    locked: false,
    visible: true,
    zIndex,
    variant: 'rectangle',
    fill,
    stroke,
    strokeWidth,
    cornerRadius,
  }
}

/**
 * 封面頁轉元素 - 精確對照日系模板
 * 結構：背景圖 + 單一漸層遮罩 + 客戶名 + 國家城市 + 日期 + 底部資訊
 */
export function coverToElements(data: BrochureCoverData): CanvasElement[] {
  const elements: CanvasElement[] = []
  let zIndex = 0
  const padding = 20 // p-5 = 20px

  // === 背景層 ===
  // 1. 背景圖片（全頁覆蓋）
  if (data.coverImage) {
    elements.push(
      createImageElement('封面背景圖', data.coverImage, 0, 0, A5_WIDTH, A5_HEIGHT, zIndex++)
    )
  } else {
    // 沒有圖片時用深色背景
    elements.push(
      createShapeElement('封面背景', 0, 0, A5_WIDTH, A5_HEIGHT, {
        fill: '#1e293b', // slate-800
        zIndex: zIndex++,
      })
    )
  }

  // 2. 單一半透明遮罩（簡化，避免多層遮罩問題）
  elements.push(
    createShapeElement('漸層遮罩', 0, 0, A5_WIDTH, A5_HEIGHT, {
      fill: 'rgba(0, 0, 0, 0.4)',
      zIndex: zIndex++,
    })
  )

  // === 頂部區域：客戶名稱 ===
  // pt-2 = 8px, 加上 p-5 = 20px，所以 top = 28px
  if (data.clientName) {
    // 左邊金色線 (border-l-2 border-amber-500)
    elements.push(
      createShapeElement('客戶名左線', padding, 28, 2, 12, {
        fill: '#f59e0b', // amber-500
        zIndex: zIndex++,
      })
    )
    // 客戶名稱文字 (pl-2 = 8px from line)
    elements.push(
      createTextElement('客戶名稱', data.clientName.toUpperCase(), padding + 8, 28, {
        fontSize: 9,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.9)',
        letterSpacing: 3,
        width: 300,
        height: 14,
        zIndex: zIndex++,
      })
    )
  }

  // === 中央區域：國家 + 城市 + 日期 ===
  // flex-1 居中，計算中心點
  const centerY = A5_HEIGHT / 2

  // 國家名稱 (text-sm=14px, font-light, tracking-[0.4em], mb-1)
  if (data.country) {
    elements.push(
      createTextElement('國家', data.country.toUpperCase(), 0, centerY - 50, {
        fontSize: 14,
        fontWeight: '300',
        color: '#ffffff',
        textAlign: 'center',
        letterSpacing: 10,
        width: A5_WIDTH,
        height: 20,
        zIndex: zIndex++,
      })
    )
  }

  // 城市名稱 (text-3xl=30px, font-extrabold)
  elements.push(
    createTextElement('城市', data.city || 'CITY', 0, centerY - 25, {
      fontSize: 30,
      fontWeight: '800',
      color: '#ffffff',
      textAlign: 'center',
      width: A5_WIDTH,
      height: 40,
      zIndex: zIndex++,
    })
  )

  // 旅遊日期 (mt-3=12px)
  if (data.travelDates) {
    const dateWidth = 180
    const dateX = (A5_WIDTH - dateWidth) / 2
    const dateY = centerY + 25

    // 膠囊背景 (rounded-full)
    elements.push(
      createShapeElement('日期背景', dateX, dateY, dateWidth, 28, {
        fill: 'rgba(255, 255, 255, 0.1)',
        stroke: 'rgba(255, 255, 255, 0.2)',
        strokeWidth: 1,
        cornerRadius: 14,
        zIndex: zIndex++,
      })
    )

    // 日期文字
    elements.push(
      createTextElement('旅遊日期', `✈  ${data.travelDates}`, dateX, dateY + 7, {
        fontSize: 10,
        fontWeight: '500',
        color: '#ffffff',
        textAlign: 'center',
        width: dateWidth,
        height: 16,
        zIndex: zIndex++,
      })
    )
  }

  // === 底部區域 ===
  // flex-none pt-3=12px pb-1=4px，從底部往上算
  const bottomPadding = 20 // p-5
  const bottomContentStart = A5_HEIGHT - bottomPadding - 50 // 給底部內容區域 50px

  // 分隔線 (mb-3=12px before content)
  elements.push(
    createShapeElement('分隔線', padding + 20, bottomContentStart, A5_WIDTH - padding * 2 - 40, 1, {
      fill: 'rgba(255, 255, 255, 0.5)',
      zIndex: zIndex++,
    })
  )

  // 公司 Logo（使用圖片）
  // 原始模板用 <img src="/corner-logo.png" className="h-4">
  // Canvas 中我們改用圖片元素
  elements.push(
    createImageElement('公司Logo', '/corner-logo.png', padding, bottomContentStart + 16, 60, 16, zIndex++)
  )

  // 緊急聯絡資訊 (右下)
  // Emergency Contact 標籤
  elements.push(
    createTextElement('聯絡標籤', 'Emergency Contact', A5_WIDTH - padding - 120, bottomContentStart + 10, {
      fontSize: 7,
      color: 'rgba(139, 134, 128, 0.9)', // morandi-secondary
      textAlign: 'right',
      width: 120,
      height: 10,
      zIndex: zIndex++,
    })
  )

  // 電話號碼
  if (data.emergencyContact) {
    elements.push(
      createTextElement('緊急電話', data.emergencyContact, A5_WIDTH - padding - 120, bottomContentStart + 22, {
        fontSize: 10,
        fontWeight: '600',
        color: '#ffffff',
        textAlign: 'right',
        width: 120,
        height: 14,
        zIndex: zIndex++,
      })
    )
  }

  // 信箱
  if (data.emergencyEmail) {
    elements.push(
      createTextElement('緊急信箱', data.emergencyEmail, A5_WIDTH - padding - 120, bottomContentStart + 38, {
        fontSize: 8,
        color: 'rgba(139, 134, 128, 0.9)',
        textAlign: 'right',
        width: 120,
        height: 12,
        zIndex: zIndex++,
      })
    )
  }

  return elements
}

/**
 * 空白頁轉元素
 */
export function blankToElements(): CanvasElement[] {
  return [
    createShapeElement('空白頁背景', 0, 0, A5_WIDTH, A5_HEIGHT, {
      fill: '#ffffff',
      zIndex: 0,
    }),
    createTextElement('空白頁提示', '空白頁（封面背面）', A5_WIDTH / 2 - 60, A5_HEIGHT / 2 - 10, {
      fontSize: 12,
      color: '#cccccc',
      textAlign: 'center',
      width: 120,
      height: 20,
      zIndex: 1,
    }),
  ]
}

/**
 * 目錄頁轉元素 - 精確對照日系模板
 * 頁面結構：白底 + 點點背景 + 青色裝飾 + Header + 2x3 章節網格 + Footer
 */
export function contentsToElements(
  data: BrochureCoverData,
  itinerary: Itinerary | null
): CanvasElement[] {
  const elements: CanvasElement[] = []
  let zIndex = 0

  // === 背景層 ===
  // 1. 白色背景
  elements.push(
    createShapeElement('白色背景', 0, 0, A5_WIDTH, A5_HEIGHT, {
      fill: '#ffffff',
      zIndex: zIndex++,
    })
  )

  // 2. 頂部青色裝飾條 (h-1.5 = 6px)
  elements.push(
    createShapeElement('頂部裝飾條', 0, 0, A5_WIDTH, 6, {
      fill: '#22d3ee', // cyan-400
      zIndex: zIndex++,
    })
  )

  // 3. 右上角裝飾圓 (right-6=24px, w-12=48px, h-16=64px)
  elements.push(
    createShapeElement('右上角裝飾', A5_WIDTH - 24 - 48, 0, 48, 64, {
      fill: 'rgba(34, 211, 238, 0.1)', // cyan-400/10
      cornerRadius: 24,
      zIndex: zIndex++,
    })
  )

  // === Header 區域 (p-4 = 16px padding) ===
  // 4. Guidebook 標籤 (bg-cyan-400, text-[9px])
  elements.push(
    createShapeElement('Guidebook背景', 16, 16, 58, 16, {
      fill: '#22d3ee',
      cornerRadius: 3,
      zIndex: zIndex++,
    })
  )
  elements.push(
    createTextElement('Guidebook', 'Guidebook', 20, 18, {
      fontSize: 9,
      fontWeight: '700',
      color: '#ffffff',
      width: 50,
      height: 14,
      zIndex: zIndex++,
    })
  )

  // 5. VOL. 01 (text-slate-400, text-[9px])
  elements.push(
    createTextElement('VOL', 'VOL. 01', 80, 18, {
      fontSize: 9,
      fontWeight: '500',
      color: '#94a3b8', // slate-400
      letterSpacing: 2,
      width: 50,
      height: 14,
      zIndex: zIndex++,
    })
  )

  // 6. CONTENTS 標題 (text-2xl=24px, font-extrabold, text-slate-900)
  elements.push(
    createTextElement('CONTENTS', 'CONTENTS', 16, 36, {
      fontSize: 24,
      fontWeight: '800',
      color: '#0f172a', // slate-900
      width: 180,
      height: 32,
      zIndex: zIndex++,
    })
  )

  // 7. 行程標題 (text-cyan-500, text-[10px])
  const tripTitle = `${data.country || ''} ${data.city || ''} Trip`.trim() || 'Trip'
  elements.push(
    createTextElement('行程標題', tripTitle.toUpperCase(), 16, 70, {
      fontSize: 10,
      fontWeight: '500',
      color: '#06b6d4', // cyan-500
      letterSpacing: 2,
      width: 300,
      height: 16,
      zIndex: zIndex++,
    })
  )

  // 8. 日文裝飾 "目録" (vertical, text-lg=18px, text-slate-200)
  elements.push(
    createTextElement('目録', '目 録', A5_WIDTH - 40, 20, {
      fontSize: 18,
      fontWeight: '700',
      color: '#e2e8f0', // slate-200
      width: 20,
      height: 60,
      zIndex: zIndex++,
    })
  )

  // 9. Header 底線 (border-b-2 border-slate-100)
  elements.push(
    createShapeElement('Header底線', 16, 92, A5_WIDTH - 32, 2, {
      fill: '#f1f5f9', // slate-100
      zIndex: zIndex++,
    })
  )

  // === 章節網格 (grid-cols-2 gap-2=8px) ===
  // 計算卡片尺寸
  const gridStartY = 104 // Header 結束後 + mb-3
  const gridPadding = 16
  const gap = 8
  const cardWidth = (A5_WIDTH - gridPadding * 2 - gap) / 2 // ≈ 259px
  const footerHeight = 50
  const availableHeight = A5_HEIGHT - gridStartY - footerHeight - gridPadding
  const cardHeight = (availableHeight - gap * 2) / 3 // 3 rows, 2 gaps

  // 章節資料
  const chapters = [
    { number: '01', title: 'Welcome', titleCn: 'はじめに', page: 3 },
    { number: '02', title: 'Overview', titleCn: '行程總覽', page: 4 },
    { number: '03', title: 'Daily Plan', titleCn: '每日行程', page: 6 },
    { number: '04', title: 'Stay', titleCn: '住宿資訊', page: 12 },
    { number: '05', title: 'Notices', titleCn: '注意事項', page: 14 },
    { number: '06', title: 'Contact', titleCn: '聯絡我們', page: 16 },
  ]

  chapters.forEach((chapter, index) => {
    const col = index % 2
    const row = Math.floor(index / 2)
    const x = gridPadding + col * (cardWidth + gap)
    const y = gridStartY + row * (cardHeight + gap)

    // 卡片背景 (bg-white, border border-slate-100, rounded-lg)
    elements.push(
      createShapeElement(`卡片${chapter.number}背景`, x, y, cardWidth, cardHeight, {
        fill: '#ffffff',
        stroke: '#f1f5f9', // slate-100
        strokeWidth: 1,
        cornerRadius: 8,
        zIndex: zIndex++,
      })
    )

    // 章節編號 (text-2xl=24px, font-black, text-slate-100)
    elements.push(
      createTextElement(`章節${chapter.number}`, chapter.number, x + 10, y + 8, {
        fontSize: 24,
        fontWeight: '900',
        color: '#f1f5f9', // slate-100
        width: 40,
        height: 30,
        zIndex: zIndex++,
      })
    )

    // 圖標背景 (p-1.5=6px, bg-slate-50, rounded-full) - 用矩形代替
    elements.push(
      createShapeElement(`圖標${chapter.number}背景`, x + cardWidth - 36, y + 8, 28, 28, {
        fill: '#f8fafc', // slate-50
        cornerRadius: 14,
        zIndex: zIndex++,
      })
    )

    // 章節標題 (text-sm=14px, font-bold, text-slate-800)
    elements.push(
      createTextElement(`標題${chapter.number}`, chapter.title, x + 10, y + cardHeight - 55, {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b', // slate-800
        width: cardWidth - 20,
        height: 20,
        zIndex: zIndex++,
      })
    )

    // 中文標題 (text-[10px], text-slate-400)
    elements.push(
      createTextElement(`中文${chapter.number}`, chapter.titleCn, x + 10, y + cardHeight - 35, {
        fontSize: 10,
        fontWeight: '500',
        color: '#94a3b8', // slate-400
        letterSpacing: 1,
        width: cardWidth - 20,
        height: 16,
        zIndex: zIndex++,
      })
    )

    // 虛線分隔 (border-t border-dashed border-slate-200)
    elements.push(
      createShapeElement(`虛線${chapter.number}`, x + 10, y + cardHeight - 22, cardWidth - 20, 1, {
        fill: '#e2e8f0', // slate-200
        zIndex: zIndex++,
      })
    )

    // 頁碼 (text-[10px], font-bold, text-slate-400)
    elements.push(
      createTextElement(`頁碼${chapter.number}`, `P. ${String(chapter.page).padStart(2, '0')}`, x + cardWidth - 50, y + cardHeight - 18, {
        fontSize: 10,
        fontWeight: '700',
        color: '#94a3b8', // slate-400
        textAlign: 'right',
        width: 40,
        height: 14,
        zIndex: zIndex++,
      })
    )
  })

  // === Footer ===
  const footerY = A5_HEIGHT - footerHeight

  // 機場代碼圓形 (w-8=32px, h-8=32px, bg-slate-100, border border-slate-200)
  elements.push(
    createShapeElement('機場代碼背景', 16, footerY + 8, 32, 32, {
      fill: '#f1f5f9', // slate-100
      stroke: '#e2e8f0', // slate-200
      strokeWidth: 1,
      cornerRadius: 16,
      zIndex: zIndex++,
    })
  )
  elements.push(
    createTextElement('機場代碼', data.airportCode || '---', 16, footerY + 18, {
      fontSize: 9,
      fontWeight: '700',
      color: '#94a3b8', // slate-400
      textAlign: 'center',
      width: 32,
      height: 14,
      zIndex: zIndex++,
    })
  )

  // 城市國家 (text-xs=12px, text-slate-400)
  elements.push(
    createTextElement('城市國家', `${data.city || ''}, ${data.country || ''}`, 56, footerY + 18, {
      fontSize: 12,
      fontWeight: '500',
      color: '#94a3b8', // slate-400
      width: 200,
      height: 16,
      zIndex: zIndex++,
    })
  )

  // Bon Voyage (text-xs=12px, text-cyan-500, font-bold)
  elements.push(
    createTextElement('Bon Voyage', 'Bon Voyage', A5_WIDTH - 100, footerY + 10, {
      fontSize: 12,
      fontWeight: '700',
      color: '#06b6d4', // cyan-500
      textAlign: 'right',
      letterSpacing: 2,
      width: 84,
      height: 16,
      zIndex: zIndex++,
    })
  )

  // Page 02 (text-[10px], text-slate-400)
  elements.push(
    createTextElement('頁碼', 'Page 02', A5_WIDTH - 70, footerY + 28, {
      fontSize: 10,
      fontWeight: '500',
      color: '#94a3b8', // slate-400
      textAlign: 'right',
      width: 54,
      height: 14,
      zIndex: zIndex++,
    })
  )

  // 底部裝飾 (右下角漸層)
  elements.push(
    createShapeElement('底部裝飾', A5_WIDTH - 64, A5_HEIGHT - 64, 64, 64, {
      fill: 'rgba(34, 211, 238, 0.05)', // cyan-400/5
      cornerRadius: 64,
      zIndex: zIndex++,
    })
  )

  return elements
}

/**
 * 總攬頁（左）轉元素 - 日系風格
 * 結構：上方 50% 青色背景區 + 下方 50% 資訊區（航班/集合/領隊）
 */
export function overviewLeftToElements(
  data: BrochureCoverData,
  itinerary: Itinerary | null
): CanvasElement[] {
  const elements: CanvasElement[] = []
  let zIndex = 0

  const topHeight = Math.floor(A5_HEIGHT * 0.5) // 397px
  const bottomHeight = A5_HEIGHT - topHeight

  // === 上方裝飾區 (50%) - teal-600 背景 ===
  elements.push(
    createShapeElement('上方背景', 0, 0, A5_WIDTH, topHeight, {
      fill: '#0d9488', // teal-600
      zIndex: zIndex++,
    })
  )

  // 背景圖片（如果有）
  if (data.overviewImage) {
    elements.push(
      createImageElement('總攬背景圖', data.overviewImage, 0, 0, A5_WIDTH, topHeight, zIndex++)
    )
    // 漸層遮罩
    elements.push(
      createShapeElement('漸層遮罩上', 0, 0, A5_WIDTH, topHeight / 3, {
        fill: 'rgba(13, 148, 136, 0.6)', // teal-600/60
        zIndex: zIndex++,
      })
    )
    elements.push(
      createShapeElement('漸層遮罩中', 0, topHeight / 3, A5_WIDTH, topHeight / 3, {
        fill: 'rgba(13, 148, 136, 0.4)', // teal-600/40
        zIndex: zIndex++,
      })
    )
    elements.push(
      createShapeElement('漸層遮罩下', 0, (topHeight / 3) * 2, A5_WIDTH, topHeight / 3, {
        fill: 'rgba(13, 148, 136, 0.8)', // teal-600/80
        zIndex: zIndex++,
      })
    )
  }

  // 中央日文標題框
  const titleBoxWidth = 80
  const titleBoxHeight = 120
  const titleBoxX = (A5_WIDTH - titleBoxWidth) / 2
  const titleBoxY = (topHeight - titleBoxHeight) / 2
  elements.push(
    createShapeElement('標題框', titleBoxX, titleBoxY, titleBoxWidth, titleBoxHeight, {
      fill: 'rgba(255, 255, 255, 0.1)',
      stroke: 'rgba(255, 255, 255, 0.2)',
      strokeWidth: 1,
      cornerRadius: 4,
      zIndex: zIndex++,
    })
  )

  // 日文標題
  const getJapaneseTitle = () => {
    const city = data.city?.toLowerCase()
    if (city?.includes('kyoto') || city?.includes('osaka')) return '関西の旅'
    if (city?.includes('tokyo')) return '東京の旅'
    if (city?.includes('hokkaido')) return '北海道の旅'
    if (city?.includes('chiang')) return 'タイの旅'
    return `${data.city || 'Journey'}`
  }
  elements.push(
    createTextElement('日文標題', getJapaneseTitle(), titleBoxX, titleBoxY + 20, {
      fontSize: 18,
      fontWeight: '700',
      color: '#ffffff',
      textAlign: 'center',
      letterSpacing: 3,
      width: titleBoxWidth,
      height: 60,
      zIndex: zIndex++,
    })
  )

  elements.push(
    createTextElement('Travel Guide', 'Travel Guide', titleBoxX, titleBoxY + 85, {
      fontSize: 8,
      fontWeight: '500',
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
      letterSpacing: 2,
      width: titleBoxWidth,
      height: 12,
      zIndex: zIndex++,
    })
  )

  // === 下方資訊區 (50%) ===
  elements.push(
    createShapeElement('下方背景', 0, topHeight, A5_WIDTH, bottomHeight, {
      fill: '#f8fafc', // slate-50/50
      zIndex: zIndex++,
    })
  )

  const infoStartY = topHeight + 16
  const sectionPadding = 16
  let currentY = infoStartY

  // 航班資訊區
  elements.push(
    createTextElement('航班標題', '航班資訊．フライト情報', sectionPadding + 20, currentY, {
      fontSize: 10,
      fontWeight: '500',
      color: '#64748b', // slate-500
      width: 200,
      height: 14,
      zIndex: zIndex++,
    })
  )
  elements.push(
    createTextElement('航班標籤', 'Flight', A5_WIDTH - sectionPadding - 50, currentY, {
      fontSize: 8,
      color: '#94a3b8', // slate-400
      textAlign: 'right',
      letterSpacing: 2,
      width: 50,
      height: 12,
      zIndex: zIndex++,
    })
  )

  currentY += 20

  // 去程
  const outbound = itinerary?.outbound_flight
  if (outbound) {
    elements.push(
      createShapeElement('去程線', sectionPadding + 22, currentY, 2, 40, {
        fill: 'rgba(249, 115, 22, 0.5)', // orange-500/50
        zIndex: zIndex++,
      })
    )
    elements.push(
      createTextElement('去程標籤', '去程', sectionPadding + 30, currentY, {
        fontSize: 8,
        fontWeight: '700',
        color: '#f97316', // orange-500
        width: 30,
        height: 12,
        zIndex: zIndex++,
      })
    )
    elements.push(
      createTextElement('去程航班', `${outbound.airline || ''} ${outbound.flightNumber || ''}`, sectionPadding + 100, currentY, {
        fontSize: 8,
        color: '#64748b',
        width: 150,
        height: 12,
        zIndex: zIndex++,
      })
    )
    elements.push(
      createTextElement('去程時間', `${outbound.departureTime || ''} ${outbound.departureAirport || ''} → ${outbound.arrivalTime || ''} ${outbound.arrivalAirport || ''}`, sectionPadding + 30, currentY + 14, {
        fontSize: 10,
        fontWeight: '600',
        color: '#334155', // slate-700
        width: 300,
        height: 14,
        zIndex: zIndex++,
      })
    )
  }

  currentY += 45

  // 回程
  const returnFlight = itinerary?.return_flight
  if (returnFlight) {
    elements.push(
      createShapeElement('回程線', sectionPadding + 22, currentY, 2, 40, {
        fill: 'rgba(13, 148, 136, 0.5)', // teal-600/50
        zIndex: zIndex++,
      })
    )
    elements.push(
      createTextElement('回程標籤', '回程', sectionPadding + 30, currentY, {
        fontSize: 8,
        fontWeight: '700',
        color: '#0d9488', // teal-600
        width: 30,
        height: 12,
        zIndex: zIndex++,
      })
    )
    elements.push(
      createTextElement('回程航班', `${returnFlight.airline || ''} ${returnFlight.flightNumber || ''}`, sectionPadding + 100, currentY, {
        fontSize: 8,
        color: '#64748b',
        width: 150,
        height: 12,
        zIndex: zIndex++,
      })
    )
    elements.push(
      createTextElement('回程時間', `${returnFlight.departureTime || ''} ${returnFlight.departureAirport || ''} → ${returnFlight.arrivalTime || ''} ${returnFlight.arrivalAirport || ''}`, sectionPadding + 30, currentY + 14, {
        fontSize: 10,
        fontWeight: '600',
        color: '#334155',
        width: 300,
        height: 14,
        zIndex: zIndex++,
      })
    )
  }

  currentY += 55

  // 集合資訊
  elements.push(
    createTextElement('集合標題', '集合資訊．集合のご案内', sectionPadding + 20, currentY, {
      fontSize: 10,
      fontWeight: '500',
      color: '#64748b',
      width: 200,
      height: 14,
      zIndex: zIndex++,
    })
  )
  elements.push(
    createTextElement('集合標籤', 'Meeting', A5_WIDTH - sectionPadding - 50, currentY, {
      fontSize: 8,
      color: '#94a3b8',
      textAlign: 'right',
      letterSpacing: 2,
      width: 50,
      height: 12,
      zIndex: zIndex++,
    })
  )

  currentY += 20
  elements.push(
    createShapeElement('集合框', sectionPadding + 20, currentY, A5_WIDTH - sectionPadding * 2 - 40, 60, {
      fill: '#ffffff',
      stroke: '#e2e8f0', // slate-200
      strokeWidth: 1,
      cornerRadius: 4,
      zIndex: zIndex++,
    })
  )
  elements.push(
    createTextElement('集合時間', itinerary?.meeting_info?.time || itinerary?.departure_date || '', sectionPadding + 30, currentY + 12, {
      fontSize: 10,
      fontWeight: '600',
      color: '#334155',
      width: 200,
      height: 14,
      zIndex: zIndex++,
    })
  )
  elements.push(
    createTextElement('集合地點', itinerary?.meeting_info?.location || '桃園機場第二航廈 團體櫃檯前', sectionPadding + 30, currentY + 32, {
      fontSize: 10,
      color: '#475569', // slate-600
      width: A5_WIDTH - 100,
      height: 20,
      zIndex: zIndex++,
    })
  )

  currentY += 75

  // 領隊資訊
  elements.push(
    createTextElement('領隊標題', '領隊．添乗員', sectionPadding + 20, currentY, {
      fontSize: 10,
      fontWeight: '500',
      color: '#64748b',
      width: 150,
      height: 14,
      zIndex: zIndex++,
    })
  )
  elements.push(
    createTextElement('領隊標籤', 'Guide', A5_WIDTH - sectionPadding - 50, currentY, {
      fontSize: 8,
      color: '#94a3b8',
      textAlign: 'right',
      letterSpacing: 2,
      width: 50,
      height: 12,
      zIndex: zIndex++,
    })
  )

  currentY += 20
  elements.push(
    createShapeElement('領隊框', sectionPadding + 20, currentY, A5_WIDTH - sectionPadding * 2 - 40, 40, {
      fill: 'rgba(13, 148, 136, 0.05)', // teal-600/5
      stroke: 'rgba(13, 148, 136, 0.1)',
      strokeWidth: 1,
      cornerRadius: 4,
      zIndex: zIndex++,
    })
  )
  elements.push(
    createTextElement('領隊名稱', itinerary?.leader?.name || '領隊', sectionPadding + 50, currentY + 12, {
      fontSize: 12,
      fontWeight: '700',
      color: '#334155',
      width: 150,
      height: 16,
      zIndex: zIndex++,
    })
  )
  elements.push(
    createTextElement('領隊電話', itinerary?.leader?.domesticPhone || data.emergencyContact || '', A5_WIDTH - sectionPadding - 150, currentY + 12, {
      fontSize: 10,
      color: '#64748b',
      textAlign: 'right',
      width: 130,
      height: 14,
      zIndex: zIndex++,
    })
  )

  // 頁碼
  elements.push(
    createTextElement('頁碼', '04', sectionPadding, A5_HEIGHT - 20, {
      fontSize: 9,
      color: '#94a3b8',
      width: 20,
      height: 12,
      zIndex: zIndex++,
    })
  )

  return elements
}

/**
 * 總攬頁（右）轉元素 - 日系風格
 * 結構：標題 + 時間軸每日行程
 */
export function overviewRightToElements(
  data: BrochureCoverData,
  itinerary: Itinerary | null
): CanvasElement[] {
  const elements: CanvasElement[] = []
  let zIndex = 0
  const dailyItinerary = itinerary?.daily_itinerary || []
  const departureDate = itinerary?.departure_date || ''

  // 白色背景
  elements.push(
    createShapeElement('總攬右背景', 0, 0, A5_WIDTH, A5_HEIGHT, {
      fill: '#ffffff',
      zIndex: zIndex++,
    })
  )

  // === 標題區 ===
  const headerPadding = 24
  elements.push(
    createTextElement('行程總攬', '行程總攬', headerPadding, 24, {
      fontSize: 20,
      fontWeight: '700',
      color: '#1e293b', // slate-800
      letterSpacing: 4,
      width: 150,
      height: 28,
      zIndex: zIndex++,
    })
  )
  elements.push(
    createTextElement('英文副標', 'Itinerary Overview', headerPadding, 52, {
      fontSize: 9,
      color: '#0d9488', // teal-600
      letterSpacing: 3,
      width: 150,
      height: 14,
      zIndex: zIndex++,
    })
  )

  // 標題底線
  elements.push(
    createShapeElement('標題底線', headerPadding, 72, A5_WIDTH - headerPadding * 2, 2, {
      fill: 'rgba(13, 148, 136, 0.1)', // teal-600/10
      zIndex: zIndex++,
    })
  )

  // 時間軸線
  elements.push(
    createShapeElement('時間軸線', 40, 90, 1, A5_HEIGHT - 140, {
      fill: '#e2e8f0', // slate-200
      zIndex: zIndex++,
    })
  )

  // 格式化日期函數
  const formatDate = (dateStr: string, dayIndex: number) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      date.setDate(date.getDate() + dayIndex)
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${month}/${day} (${weekdays[date.getDay()]})`
    } catch {
      return ''
    }
  }

  // === 每日行程 ===
  const startY = 90
  const totalDays = Math.min(dailyItinerary.length, 6)
  const availableHeight = A5_HEIGHT - startY - 50
  const dayHeight = availableHeight / Math.max(totalDays, 1)

  dailyItinerary.slice(0, 6).forEach((day, index) => {
    const yPos = startY + index * dayHeight

    // Day 標籤背景
    elements.push(
      createShapeElement(`Day${index + 1}背景`, 24, yPos + 4, 32, 40, {
        fill: '#ffffff',
        zIndex: zIndex++,
      })
    )

    // DAY 文字
    elements.push(
      createTextElement(`DAY標籤${index + 1}`, 'DAY', 24, yPos + 4, {
        fontSize: 7,
        fontWeight: '700',
        color: '#94a3b8', // slate-400
        textAlign: 'center',
        letterSpacing: 2,
        width: 32,
        height: 10,
        zIndex: zIndex++,
      })
    )

    // Day 數字
    elements.push(
      createTextElement(`Day數字${index + 1}`, String(index + 1).padStart(2, '0'), 24, yPos + 16, {
        fontSize: 16,
        fontWeight: '700',
        color: '#0d9488', // teal-600
        textAlign: 'center',
        width: 32,
        height: 22,
        zIndex: zIndex++,
      })
    )

    // 日期
    elements.push(
      createTextElement(`日期${index + 1}`, formatDate(departureDate, index), 60, yPos + 6, {
        fontSize: 8,
        color: '#94a3b8', // slate-400
        width: 100,
        height: 12,
        zIndex: zIndex++,
      })
    )

    // 標題
    elements.push(
      createTextElement(`標題${index + 1}`, day.title || `第 ${index + 1} 天`, 60, yPos + 20, {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155', // slate-700
        width: A5_WIDTH - 90,
        height: 18,
        zIndex: zIndex++,
      })
    )

    // 活動標籤
    const activities = day.activities || []
    if (activities.length > 0) {
      const tags = activities.slice(0, 3).map(a => a.title).join(' · ')
      elements.push(
        createTextElement(`活動${index + 1}`, tags, 60, yPos + 42, {
          fontSize: 9,
          color: '#64748b', // slate-500
          width: A5_WIDTH - 90,
          height: 14,
          zIndex: zIndex++,
        })
      )
    }

    // 虛線分隔
    if (index < totalDays - 1) {
      elements.push(
        createShapeElement(`分隔線${index + 1}`, 60, yPos + dayHeight - 8, A5_WIDTH - 90, 1, {
          fill: '#e2e8f0', // slate-200
          zIndex: zIndex++,
        })
      )
    }
  })

  // 底部裝飾
  elements.push(
    createShapeElement('底部裝飾', A5_WIDTH - 80, A5_HEIGHT - 80, 80, 80, {
      fill: 'rgba(13, 148, 136, 0.05)', // teal-600/5
      cornerRadius: 80,
      zIndex: zIndex++,
    })
  )

  // 頁碼
  elements.push(
    createTextElement('頁碼', '05', A5_WIDTH - 40, A5_HEIGHT - 20, {
      fontSize: 9,
      color: '#94a3b8',
      textAlign: 'right',
      width: 20,
      height: 12,
      zIndex: zIndex++,
    })
  )

  return elements
}

/**
 * 每日行程頁（左）轉元素 - 日系風格
 * 結構：上方 45% 標題區 + 下方 55% 時間軸/圖片區
 */
export function dailyLeftToElements(
  dayIndex: number,
  day: DailyItineraryDay,
  departureDate?: string,
  tripName?: string
): CanvasElement[] {
  const elements: CanvasElement[] = []
  let zIndex = 0
  const dayNumber = dayIndex + 1
  const activities = day.activities || []

  // 日文數字對應
  const KANJI_NUMBERS = ['壱', '弐', '参', '肆', '伍', '陸', '漆', '捌', '玖', '拾']
  const kanjiNumber = KANJI_NUMBERS[dayIndex] || String(dayNumber)

  const topHeight = Math.floor(A5_HEIGHT * 0.45) // 357px
  const bottomHeight = A5_HEIGHT - topHeight

  // 格式化日期
  const formatDate = (dateStr: string, index: number) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      date.setDate(date.getDate() + index)
      const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const dayNum = String(date.getDate()).padStart(2, '0')
      return `${year}.${month}.${dayNum} / ${weekdays[date.getDay()]}`
    } catch {
      return ''
    }
  }

  // === 上方標題區 (45%) ===
  elements.push(
    createShapeElement('上方背景', 0, 0, A5_WIDTH, topHeight, {
      fill: '#f8fafc', // slate-50
      zIndex: zIndex++,
    })
  )

  // 標題底線
  elements.push(
    createShapeElement('標題底線', 0, topHeight, A5_WIDTH, 1, {
      fill: '#e2e8f0', // slate-200
      zIndex: zIndex++,
    })
  )

  // 右上角裝飾圓
  elements.push(
    createShapeElement('裝飾圓', A5_WIDTH - 100, -50, 160, 160, {
      fill: 'rgba(13, 148, 136, 0.1)', // teal-600/10
      cornerRadius: 80,
      opacity: 0.3,
      zIndex: zIndex++,
    })
  )

  // 頂部資訊
  elements.push(
    createTextElement('行程名稱', tripName || 'Japan Travel', 24, 24, {
      fontSize: 10,
      fontWeight: '700',
      color: '#f97316', // orange-500
      letterSpacing: 4,
      width: 200,
      height: 14,
      zIndex: zIndex++,
    })
  )
  elements.push(
    createTextElement('日期', formatDate(departureDate || '', dayIndex), 24, 42, {
      fontSize: 9,
      color: '#64748b', // slate-500
      letterSpacing: 2,
      width: 200,
      height: 12,
      zIndex: zIndex++,
    })
  )

  // 日文數字裝飾
  elements.push(
    createTextElement('日文數字', kanjiNumber, A5_WIDTH - 70, 20, {
      fontSize: 36,
      fontWeight: '700',
      color: 'rgba(13, 148, 136, 0.15)', // teal-600/15
      width: 50,
      height: 45,
      zIndex: zIndex++,
    })
  )

  // Day 大標題
  elements.push(
    createTextElement('Day標題', 'Day', 24, topHeight - 140, {
      fontSize: 72,
      fontWeight: '900',
      color: '#0d9488', // teal-600
      width: 150,
      height: 70,
      zIndex: zIndex++,
    })
  )
  elements.push(
    createTextElement('Day數字', String(dayNumber).padStart(2, '0'), 24, topHeight - 70, {
      fontSize: 72,
      fontWeight: '900',
      color: '#0d9488', // teal-600
      width: 150,
      height: 70,
      zIndex: zIndex++,
    })
  )

  // 左邊標題線
  elements.push(
    createShapeElement('標題線', 24 + 8, topHeight - 50, 1, 40, {
      fill: '#cbd5e1', // slate-300
      zIndex: zIndex++,
    })
  )

  // 日期標題
  elements.push(
    createTextElement('標題', day.title || `第 ${dayNumber} 天`, 40, topHeight - 45, {
      fontSize: 18,
      fontWeight: '700',
      color: '#1e293b', // slate-800
      width: A5_WIDTH - 80,
      height: 24,
      zIndex: zIndex++,
    })
  )

  // Highlight
  if (day.highlight) {
    elements.push(
      createTextElement('Highlight', day.highlight, 40, topHeight - 20, {
        fontSize: 11,
        fontWeight: '500',
        color: '#64748b', // slate-500
        letterSpacing: 2,
        width: A5_WIDTH - 80,
        height: 16,
        zIndex: zIndex++,
      })
    )
  }

  // === 下方區域 (55%) ===
  // 判斷是否使用圖片模式（活動少於 2 個時顯示封面圖）
  const useImageMode = activities.length < 2
  const dayImage = day.images?.[0] ? (typeof day.images[0] === 'string' ? day.images[0] : day.images[0].url) : undefined

  if (useImageMode && dayImage) {
    // 圖片模式
    elements.push(
      createImageElement('每日背景圖', dayImage, 0, topHeight, A5_WIDTH, bottomHeight, zIndex++)
    )
    // 漸層遮罩
    elements.push(
      createShapeElement('底部遮罩', 0, A5_HEIGHT - 80, A5_WIDTH, 80, {
        fill: 'rgba(0, 0, 0, 0.3)',
        zIndex: zIndex++,
      })
    )
    // 底部文字
    elements.push(
      createTextElement('移動日標題', activities[0]?.title || '移動日', 24, A5_HEIGHT - 50, {
        fontSize: 14,
        fontWeight: '500',
        color: '#ffffff',
        width: A5_WIDTH - 48,
        height: 20,
        zIndex: zIndex++,
      })
    )
  } else if (useImageMode) {
    // 無圖片的空白模式
    elements.push(
      createShapeElement('空白背景', 0, topHeight, A5_WIDTH, bottomHeight, {
        fill: '#f8fafc', // slate-50
        zIndex: zIndex++,
      })
    )
    elements.push(
      createTextElement('移動日', '移動日', (A5_WIDTH - 100) / 2, topHeight + bottomHeight / 2 - 20, {
        fontSize: 14,
        color: '#cbd5e1', // slate-300
        textAlign: 'center',
        width: 100,
        height: 20,
        zIndex: zIndex++,
      })
    )
    elements.push(
      createTextElement('Travel Day', 'Travel Day', (A5_WIDTH - 100) / 2, topHeight + bottomHeight / 2 + 5, {
        fontSize: 10,
        color: 'rgba(148, 163, 184, 0.5)', // slate-400/50
        textAlign: 'center',
        width: 100,
        height: 14,
        zIndex: zIndex++,
      })
    )
  } else {
    // 時間軸模式
    elements.push(
      createShapeElement('時間軸背景', 0, topHeight, A5_WIDTH, bottomHeight, {
        fill: '#ffffff',
        zIndex: zIndex++,
      })
    )

    // TIMELINE 裝飾文字
    elements.push(
      createTextElement('TIMELINE', 'TIMELINE', A5_WIDTH - 50, topHeight + 16, {
        fontSize: 9,
        color: '#e2e8f0', // slate-200
        letterSpacing: 2,
        width: 30,
        height: 80,
        zIndex: zIndex++,
      })
    )

    // 時間軸列表
    const dotColors = ['#0d9488', '#f97316', '#0f766e', '#475569'] // teal-600, orange-500, teal-700, slate-600
    let activityY = topHeight + 20

    activities.slice(0, 5).forEach((activity, index) => {
      const isLast = index === Math.min(activities.length - 1, 4)
      const dotColor = dotColors[index % dotColors.length]

      // 圓點
      elements.push(
        createShapeElement(`圓點${index + 1}`, 30, activityY + 4, 10, 10, {
          fill: dotColor,
          cornerRadius: 5,
          zIndex: zIndex++,
        })
      )

      // 連接線
      if (!isLast) {
        elements.push(
          createShapeElement(`連接線${index + 1}`, 35, activityY + 18, 1, 60, {
            fill: '#e2e8f0', // slate-200
            zIndex: zIndex++,
          })
        )
      }

      // 活動標題
      elements.push(
        createTextElement(`活動標題${index + 1}`, activity.title, 52, activityY, {
          fontSize: 14,
          fontWeight: '700',
          color: '#1e293b', // slate-800
          width: A5_WIDTH - 80,
          height: 18,
          zIndex: zIndex++,
        })
      )

      // 活動描述
      if (activity.description) {
        elements.push(
          createShapeElement(`描述背景${index + 1}`, 52, activityY + 22, A5_WIDTH - 80, 30, {
            fill: 'rgba(248, 250, 252, 0.8)', // slate-50/80
            stroke: '#f1f5f9', // slate-100
            strokeWidth: 1,
            cornerRadius: 4,
            zIndex: zIndex++,
          })
        )
        elements.push(
          createTextElement(`活動描述${index + 1}`, activity.description, 56, activityY + 28, {
            fontSize: 9,
            color: '#64748b', // slate-500
            width: A5_WIDTH - 90,
            height: 20,
            zIndex: zIndex++,
          })
        )
      }

      activityY += 75
    })

    // 如果超過 5 個活動
    if (activities.length > 5) {
      elements.push(
        createTextElement('更多活動', `+ ${activities.length - 5} more`, (A5_WIDTH - 100) / 2, A5_HEIGHT - 40, {
          fontSize: 10,
          color: '#cbd5e1', // slate-300
          textAlign: 'center',
          width: 100,
          height: 14,
          zIndex: zIndex++,
        })
      )
    }
  }

  // 頁碼
  const pageNumber = dayNumber * 2 + 4
  elements.push(
    createTextElement('頁碼', `P.${String(pageNumber).padStart(2, '0')}`, 20, A5_HEIGHT - 24, {
      fontSize: 9,
      color: useImageMode && dayImage ? 'rgba(255,255,255,0.7)' : 'rgba(148, 163, 184, 0.5)',
      width: 40,
      height: 12,
      zIndex: zIndex++,
    })
  )

  return elements
}

/**
 * 每日行程頁（右）轉元素 - 日系風格
 * 結構：景點介紹 + 活動卡片網格
 */
export function dailyRightToElements(
  dayIndex: number,
  day: DailyItineraryDay
): CanvasElement[] {
  const elements: CanvasElement[] = []
  let zIndex = 0
  const activities = day.activities || []

  // 白色背景
  elements.push(
    createShapeElement('每日右背景', 0, 0, A5_WIDTH, A5_HEIGHT, {
      fill: '#ffffff',
      zIndex: zIndex++,
    })
  )

  // 背景網格紋路（簡化表示）
  elements.push(
    createShapeElement('網格裝飾', 0, 0, A5_WIDTH, A5_HEIGHT, {
      fill: 'rgba(229, 224, 216, 0.1)', // 淡色紋路
      zIndex: zIndex++,
    })
  )

  // === 標題區 ===
  const padding = 24
  elements.push(
    createTextElement('景點介紹', '景點介紹', padding, 24, {
      fontSize: 18,
      fontWeight: '700',
      color: '#1e293b', // slate-800
      letterSpacing: 4,
      width: 120,
      height: 24,
      zIndex: zIndex++,
    })
  )
  elements.push(
    createTextElement('英文副標', 'Highlights', 150, 28, {
      fontSize: 11,
      color: '#94a3b8', // slate-400
      width: 80,
      height: 16,
      zIndex: zIndex++,
    })
  )

  // 標題裝飾點
  elements.push(
    createShapeElement('裝飾點1', A5_WIDTH - padding - 20, 28, 4, 4, {
      fill: '#94a3b8',
      cornerRadius: 2,
      zIndex: zIndex++,
    })
  )
  elements.push(
    createShapeElement('裝飾點2', A5_WIDTH - padding - 12, 28, 4, 4, {
      fill: 'rgba(148, 163, 184, 0.5)',
      cornerRadius: 2,
      zIndex: zIndex++,
    })
  )
  elements.push(
    createShapeElement('裝飾點3', A5_WIDTH - padding - 4, 28, 4, 4, {
      fill: 'rgba(148, 163, 184, 0.2)',
      cornerRadius: 2,
      zIndex: zIndex++,
    })
  )

  // 標題底線
  elements.push(
    createShapeElement('標題底線', padding, 56, A5_WIDTH - padding * 2, 1, {
      fill: '#e2e8f0', // slate-200
      zIndex: zIndex++,
    })
  )

  // === 活動卡片區 ===
  const cardStartY = 70
  const activityCount = activities.length

  // 取得活動圖片
  const getActivityImage = (activity: typeof activities[0], index: number) => {
    if (activity.image) return activity.image
    if (day.images && day.images[index]) {
      const img = day.images[index]
      return typeof img === 'string' ? img : img.url
    }
    return null
  }

  const colors = [
    { text: '#0d9488', bg: 'rgba(13, 148, 136, 0.05)' }, // teal-600
    { text: '#f97316', bg: 'rgba(249, 115, 22, 0.05)' }, // orange-500
    { text: '#475569', bg: 'rgba(71, 85, 105, 0.05)' },  // slate-600
    { text: '#0f766e', bg: 'rgba(15, 118, 110, 0.05)' }, // teal-700
  ]

  if (activityCount <= 2) {
    // 2個以下：大圖模式
    const cardHeight = (A5_HEIGHT - cardStartY - 100) / Math.max(activityCount, 1)

    activities.slice(0, 2).forEach((activity, index) => {
      const y = cardStartY + index * (cardHeight + 12)
      const image = getActivityImage(activity, index)
      const color = colors[index % colors.length]

      // 卡片背景
      elements.push(
        createShapeElement(`卡片背景${index + 1}`, padding, y, A5_WIDTH - padding * 2, cardHeight, {
          fill: '#ffffff',
          stroke: '#f1f5f9', // slate-100
          strokeWidth: 1,
          cornerRadius: 8,
          zIndex: zIndex++,
        })
      )

      // 圖片區域
      const imageHeight = cardHeight * 0.6
      if (image) {
        elements.push(
          createImageElement(`活動圖${index + 1}`, image, padding, y, A5_WIDTH - padding * 2, imageHeight, zIndex++)
        )
      } else {
        elements.push(
          createShapeElement(`圖片佔位${index + 1}`, padding, y, A5_WIDTH - padding * 2, imageHeight, {
            fill: '#f8fafc', // slate-50
            cornerRadius: 8,
            zIndex: zIndex++,
          })
        )
      }

      // 文字區域
      elements.push(
        createTextElement(`活動標題${index + 1}`, activity.title, padding + 12, y + imageHeight + 12, {
          fontSize: 14,
          fontWeight: '700',
          color: '#1e293b',
          width: A5_WIDTH - padding * 2 - 24,
          height: 18,
          zIndex: zIndex++,
        })
      )

      if (activity.description) {
        elements.push(
          createTextElement(`活動描述${index + 1}`, activity.description, padding + 12, y + imageHeight + 34, {
            fontSize: 10,
            color: '#64748b',
            width: A5_WIDTH - padding * 2 - 24,
            height: 40,
            zIndex: zIndex++,
          })
        )
      }
    })
  } else if (activityCount <= 4) {
    // 3-4個：2x2 網格
    const gap = 8
    const cardWidth = (A5_WIDTH - padding * 2 - gap) / 2
    const cardHeight = (A5_HEIGHT - cardStartY - 100 - gap) / 2

    activities.slice(0, 4).forEach((activity, index) => {
      const col = index % 2
      const row = Math.floor(index / 2)
      const x = padding + col * (cardWidth + gap)
      const y = cardStartY + row * (cardHeight + gap)
      const image = getActivityImage(activity, index)
      const color = colors[index % colors.length]

      // 卡片背景
      elements.push(
        createShapeElement(`卡片背景${index + 1}`, x, y, cardWidth, cardHeight, {
          fill: '#ffffff',
          stroke: '#f1f5f9',
          strokeWidth: 1,
          cornerRadius: 8,
          zIndex: zIndex++,
        })
      )

      // 圖片
      const imageHeight = 80
      if (image) {
        elements.push(
          createImageElement(`活動圖${index + 1}`, image, x, y, cardWidth, imageHeight, zIndex++)
        )
      } else {
        elements.push(
          createShapeElement(`圖片佔位${index + 1}`, x, y, cardWidth, imageHeight, {
            fill: '#f8fafc',
            cornerRadius: 8,
            zIndex: zIndex++,
          })
        )
      }

      // 文字
      elements.push(
        createTextElement(`活動標題${index + 1}`, activity.title, x + 8, y + imageHeight + 8, {
          fontSize: 11,
          fontWeight: '700',
          color: '#1e293b',
          width: cardWidth - 16,
          height: 16,
          zIndex: zIndex++,
        })
      )

      if (activity.description) {
        elements.push(
          createTextElement(`活動描述${index + 1}`, activity.description, x + 8, y + imageHeight + 28, {
            fontSize: 9,
            color: '#64748b',
            width: cardWidth - 16,
            height: 30,
            zIndex: zIndex++,
          })
        )
      }
    })
  } else {
    // 5個以上：緊湊列表
    let listY = cardStartY

    activities.slice(0, 5).forEach((activity, index) => {
      const image = getActivityImage(activity, index)
      const color = colors[index % colors.length]

      // 卡片背景
      elements.push(
        createShapeElement(`列表卡片${index + 1}`, padding, listY, A5_WIDTH - padding * 2, 70, {
          fill: '#ffffff',
          stroke: '#f1f5f9',
          strokeWidth: 1,
          cornerRadius: 8,
          zIndex: zIndex++,
        })
      )

      // 小圖
      if (image) {
        elements.push(
          createImageElement(`列表圖${index + 1}`, image, padding + 8, listY + 8, 54, 54, zIndex++)
        )
      } else {
        elements.push(
          createShapeElement(`列表圖佔位${index + 1}`, padding + 8, listY + 8, 54, 54, {
            fill: '#f8fafc',
            cornerRadius: 4,
            zIndex: zIndex++,
          })
        )
      }

      // 文字
      elements.push(
        createTextElement(`列表標題${index + 1}`, activity.title, padding + 72, listY + 12, {
          fontSize: 11,
          fontWeight: '700',
          color: '#1e293b',
          width: A5_WIDTH - padding * 2 - 90,
          height: 16,
          zIndex: zIndex++,
        })
      )

      if (activity.description) {
        elements.push(
          createTextElement(`列表描述${index + 1}`, activity.description, padding + 72, listY + 32, {
            fontSize: 9,
            color: '#64748b',
            width: A5_WIDTH - padding * 2 - 90,
            height: 28,
            zIndex: zIndex++,
          })
        )
      }

      listY += 80
    })
  }

  // === 底部備註 ===
  elements.push(
    createShapeElement('底部線', padding, A5_HEIGHT - 60, A5_WIDTH - padding * 2, 1, {
      fill: '#e2e8f0',
      zIndex: zIndex++,
    })
  )
  elements.push(
    createTextElement('底部備註', '行程內容可能依當地情況調整，敬請見諒', (A5_WIDTH - 280) / 2, A5_HEIGHT - 45, {
      fontSize: 9,
      color: '#94a3b8',
      textAlign: 'center',
      width: 280,
      height: 14,
      zIndex: zIndex++,
    })
  )

  // 頁碼
  const pageNumber = (dayIndex + 1) * 2 + 5
  elements.push(
    createTextElement('頁碼', `${String(dayIndex + 1).padStart(2, '0')}-${String(pageNumber).padStart(2, '0')} / SPOTS`, A5_WIDTH - padding - 100, A5_HEIGHT - 24, {
      fontSize: 9,
      color: 'rgba(148, 163, 184, 0.5)',
      textAlign: 'right',
      width: 100,
      height: 12,
      zIndex: zIndex++,
    })
  )

  return elements
}

/**
 * 住宿頁（左）轉元素 - 日系風格
 * 結構：標題 + 住宿圖片卡片（大圖模式）
 */
export function accommodationLeftToElements(
  accommodations: Array<{ name: string; image?: string; days?: number[] }>
): CanvasElement[] {
  const elements: CanvasElement[] = []
  let zIndex = 0
  const displayAccommodations = accommodations.slice(0, 3)

  // 白色背景
  elements.push(
    createShapeElement('住宿左背景', 0, 0, A5_WIDTH, A5_HEIGHT, {
      fill: '#ffffff',
      zIndex: zIndex++,
    })
  )

  // 背景紋路（簡化）
  elements.push(
    createShapeElement('背景紋路', 0, 0, A5_WIDTH, A5_HEIGHT, {
      fill: 'rgba(13, 148, 136, 0.02)', // 淡 teal 紋路
      zIndex: zIndex++,
    })
  )

  const padding = 24

  // === 標題區 ===
  // 裝飾線
  elements.push(
    createShapeElement('標題裝飾線', padding, 28, 8, 1, {
      fill: '#f97316', // orange-500
      zIndex: zIndex++,
    })
  )

  elements.push(
    createTextElement('英文標籤', 'Accommodation', padding + 14, 24, {
      fontSize: 9,
      fontWeight: '700',
      color: '#f97316', // orange-500
      letterSpacing: 4,
      width: 120,
      height: 14,
      zIndex: zIndex++,
    })
  )

  elements.push(
    createTextElement('日文標題', '宿泊施設', padding, 44, {
      fontSize: 24,
      fontWeight: '700',
      color: '#1e293b', // slate-800
      letterSpacing: 4,
      width: 150,
      height: 32,
      zIndex: zIndex++,
    })
  )

  elements.push(
    createTextElement('副標題', '嚴選住宿介紹', padding, 80, {
      fontSize: 10,
      color: '#64748b', // slate-500
      width: 100,
      height: 14,
      zIndex: zIndex++,
    })
  )

  // === 住宿卡片 ===
  const cardStartY = 110
  const availableHeight = A5_HEIGHT - cardStartY - 40
  const gap = 16
  const cardHeight = (availableHeight - gap * (displayAccommodations.length - 1)) / Math.max(displayAccommodations.length, 1)

  const colors = [
    { text: '#0d9488', bg: 'rgba(13, 148, 136, 0.05)', border: 'rgba(13, 148, 136, 0.2)' }, // teal-600
    { text: '#f97316', bg: 'rgba(249, 115, 22, 0.05)', border: 'rgba(249, 115, 22, 0.2)' }, // orange-500
    { text: '#0f766e', bg: 'rgba(15, 118, 110, 0.05)', border: 'rgba(15, 118, 110, 0.2)' }, // teal-700
  ]

  displayAccommodations.forEach((hotel, index) => {
    const y = cardStartY + index * (cardHeight + gap)
    const color = colors[index % colors.length]

    // 卡片容器（圖片 + 漸層遮罩）
    elements.push(
      createShapeElement(`卡片背景${index + 1}`, padding, y, A5_WIDTH - padding * 2, cardHeight, {
        fill: '#f8fafc',
        cornerRadius: 8,
        zIndex: zIndex++,
      })
    )

    // 圖片
    if (hotel.image) {
      elements.push(
        createImageElement(`住宿圖${index + 1}`, hotel.image, padding, y, A5_WIDTH - padding * 2, cardHeight, zIndex++)
      )
    } else {
      // 無圖片佔位
      elements.push(
        createShapeElement(`圖片佔位${index + 1}`, padding, y, A5_WIDTH - padding * 2, cardHeight, {
          fill: color.bg,
          cornerRadius: 8,
          zIndex: zIndex++,
        })
      )
      elements.push(
        createTextElement(`佔位符號${index + 1}`, '🏨', padding + (A5_WIDTH - padding * 2) / 2 - 25, y + cardHeight / 2 - 25, {
          fontSize: 50,
          color: color.text,
          textAlign: 'center',
          width: 50,
          height: 50,
          zIndex: zIndex++,
        })
      )
    }

    // 底部漸層遮罩
    elements.push(
      createShapeElement(`漸層遮罩${index + 1}`, padding, y + cardHeight - 70, A5_WIDTH - padding * 2, 70, {
        fill: 'rgba(0, 0, 0, 0.4)',
        cornerRadius: 0,
        zIndex: zIndex++,
      })
    )

    // 編號
    elements.push(
      createTextElement(`編號${index + 1}`, String(index + 1).padStart(2, '0'), padding + 16, y + cardHeight - 55, {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        width: 30,
        height: 16,
        zIndex: zIndex++,
      })
    )

    // 飯店名稱
    elements.push(
      createTextElement(`住宿名稱${index + 1}`, hotel.name, padding + 16, y + cardHeight - 35, {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
        width: A5_WIDTH - padding * 2 - 100,
        height: 24,
        zIndex: zIndex++,
      })
    )

    // 入住天數標籤
    if (hotel.days && hotel.days.length > 0) {
      const daysText = hotel.days.length === 1
        ? `Day ${hotel.days[0]}`
        : `Day ${hotel.days[0]}-${hotel.days[hotel.days.length - 1]}`
      elements.push(
        createShapeElement(`天數背景${index + 1}`, A5_WIDTH - padding - 80, y + cardHeight - 40, 64, 24, {
          fill: 'rgba(255, 255, 255, 0.2)',
          cornerRadius: 4,
          zIndex: zIndex++,
        })
      )
      elements.push(
        createTextElement(`天數${index + 1}`, daysText, A5_WIDTH - padding - 76, y + cardHeight - 35, {
          fontSize: 10,
          color: '#ffffff',
          textAlign: 'center',
          width: 56,
          height: 14,
          zIndex: zIndex++,
        })
      )
    }
  })

  // 頁碼
  elements.push(
    createTextElement('頁碼', '16', 20, A5_HEIGHT - 20, {
      fontSize: 9,
      color: '#94a3b8',
      width: 20,
      height: 12,
      zIndex: zIndex++,
    })
  )

  return elements
}

/**
 * 住宿頁（右）轉元素 - 日系風格
 * 結構：標題 + 住宿詳細資訊卡片
 */
export function accommodationRightToElements(
  accommodations: Array<{ name: string; address?: string; phone?: string; checkIn?: string; checkOut?: string; image?: string; days?: number[] }>
): CanvasElement[] {
  const elements: CanvasElement[] = []
  let zIndex = 0
  const displayAccommodations = accommodations.slice(0, 3)

  // 白色背景
  elements.push(
    createShapeElement('住宿右背景', 0, 0, A5_WIDTH, A5_HEIGHT, {
      fill: '#ffffff',
      zIndex: zIndex++,
    })
  )

  // 背景紋路
  elements.push(
    createShapeElement('背景紋路', 0, 0, A5_WIDTH, A5_HEIGHT, {
      fill: 'rgba(13, 148, 136, 0.02)',
      zIndex: zIndex++,
    })
  )

  // 右上角裝飾
  elements.push(
    createShapeElement('右上裝飾', A5_WIDTH - 200, -50, 200, 200, {
      fill: 'rgba(249, 115, 22, 0.05)', // orange-500/5
      cornerRadius: 100,
      zIndex: zIndex++,
    })
  )

  const padding = 24

  // === 標題區 ===
  elements.push(
    createShapeElement('標題裝飾線', padding, 28, 8, 1, {
      fill: '#f97316',
      zIndex: zIndex++,
    })
  )

  elements.push(
    createTextElement('英文標籤', 'Accommodation Guide', padding + 14, 24, {
      fontSize: 9,
      fontWeight: '700',
      color: '#f97316',
      letterSpacing: 3,
      width: 150,
      height: 14,
      zIndex: zIndex++,
    })
  )

  elements.push(
    createTextElement('日文標題', '住宿資訊', padding, 44, {
      fontSize: 20,
      fontWeight: '700',
      color: '#1e293b',
      letterSpacing: 4,
      width: 120,
      height: 28,
      zIndex: zIndex++,
    })
  )

  // 右上角大字裝飾
  elements.push(
    createTextElement('裝飾文字', '厳選宿泊', A5_WIDTH - 140, 36, {
      fontSize: 30,
      fontWeight: '700',
      color: 'rgba(30, 41, 59, 0.05)', // slate-800/5
      width: 120,
      height: 40,
      zIndex: zIndex++,
    })
  )

  // === 住宿資訊卡片 ===
  const cardStartY = 90
  const availableHeight = A5_HEIGHT - cardStartY - 40
  const gap = 16
  const cardHeight = (availableHeight - gap * (displayAccommodations.length - 1)) / Math.max(displayAccommodations.length, 1)

  const colors = [
    { text: '#0d9488', bg: 'rgba(13, 148, 136, 0.05)', border: 'rgba(13, 148, 136, 0.2)' },
    { text: '#f97316', bg: 'rgba(249, 115, 22, 0.05)', border: 'rgba(249, 115, 22, 0.2)' },
    { text: '#0f766e', bg: 'rgba(15, 118, 110, 0.05)', border: 'rgba(15, 118, 110, 0.2)' },
  ]

  displayAccommodations.forEach((hotel, index) => {
    const y = cardStartY + index * (cardHeight + gap)
    const color = colors[index % colors.length]

    // 左邊線裝飾
    elements.push(
      createShapeElement(`左邊線${index + 1}`, padding, y, 2, cardHeight - 10, {
        fill: color.border,
        zIndex: zIndex++,
      })
    )

    // 標題列
    // 編號標籤
    elements.push(
      createShapeElement(`編號背景${index + 1}`, padding + 12, y + 8, 26, 16, {
        fill: 'transparent',
        stroke: color.border,
        strokeWidth: 1,
        cornerRadius: 4,
        zIndex: zIndex++,
      })
    )
    elements.push(
      createTextElement(`編號${index + 1}`, String(index + 1).padStart(2, '0'), padding + 12, y + 10, {
        fontSize: 9,
        color: color.text,
        textAlign: 'center',
        letterSpacing: 2,
        width: 26,
        height: 12,
        zIndex: zIndex++,
      })
    )

    // 飯店名稱
    elements.push(
      createTextElement(`住宿名稱${index + 1}`, hotel.name, padding + 44, y + 8, {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        width: A5_WIDTH - padding * 2 - 150,
        height: 20,
        zIndex: zIndex++,
      })
    )

    // 入住天數
    if (hotel.days && hotel.days.length > 0) {
      const daysText = hotel.days.length === 1
        ? `Day ${hotel.days[0]}`
        : `Day ${hotel.days[0]}-${hotel.days[hotel.days.length - 1]}`
      const nightsText = `(${hotel.days.length}晚)`
      elements.push(
        createShapeElement(`天數背景${index + 1}`, A5_WIDTH - padding - 90, y + 6, 74, 20, {
          fill: color.bg,
          cornerRadius: 4,
          zIndex: zIndex++,
        })
      )
      elements.push(
        createTextElement(`天數${index + 1}`, `${daysText} ${nightsText}`, A5_WIDTH - padding - 88, y + 10, {
          fontSize: 9,
          color: color.text,
          width: 70,
          height: 12,
          zIndex: zIndex++,
        })
      )
    }

    // 分隔線
    elements.push(
      createShapeElement(`分隔線${index + 1}`, padding + 12, y + 34, A5_WIDTH - padding * 2 - 12, 1, {
        fill: 'rgba(226, 232, 240, 0.4)', // slate-200/40
        zIndex: zIndex++,
      })
    )

    // 資訊網格
    let infoY = y + 45

    // 地址
    if (hotel.address) {
      elements.push(
        createTextElement(`地址標籤${index + 1}`, '📍', padding + 12, infoY, {
          fontSize: 12,
          color: '#94a3b8',
          width: 18,
          height: 16,
          zIndex: zIndex++,
        })
      )
      elements.push(
        createTextElement(`地址${index + 1}`, hotel.address, padding + 32, infoY, {
          fontSize: 10,
          color: '#334155',
          width: A5_WIDTH - padding * 2 - 44,
          height: 32,
          zIndex: zIndex++,
        })
      )
      infoY += 35
    }

    // 電話
    if (hotel.phone) {
      elements.push(
        createTextElement(`電話標籤${index + 1}`, '📞', padding + 12, infoY, {
          fontSize: 12,
          color: '#94a3b8',
          width: 18,
          height: 16,
          zIndex: zIndex++,
        })
      )
      elements.push(
        createTextElement(`電話${index + 1}`, hotel.phone, padding + 32, infoY, {
          fontSize: 10,
          color: '#334155',
          letterSpacing: 1,
          width: 150,
          height: 14,
          zIndex: zIndex++,
        })
      )
      infoY += 20
    }

    // Check-in/out
    elements.push(
      createTextElement(`時間標籤${index + 1}`, '🕐', padding + 12, infoY, {
        fontSize: 12,
        color: '#94a3b8',
        width: 18,
        height: 16,
        zIndex: zIndex++,
      })
    )
    elements.push(
      createTextElement(`時間${index + 1}`, `IN ${hotel.checkIn || '15:00'} / OUT ${hotel.checkOut || '11:00'}`, padding + 32, infoY, {
        fontSize: 10,
        color: '#334155',
        width: 200,
        height: 14,
        zIndex: zIndex++,
      })
    )
    infoY += 24

    // 設施標籤
    elements.push(
      createShapeElement(`設施標籤背景${index + 1}`, padding + 12, infoY, 70, 18, {
        fill: color.bg,
        cornerRadius: 4,
        zIndex: zIndex++,
      })
    )
    elements.push(
      createTextElement(`設施標籤${index + 1}`, '📶 Free Wi-Fi', padding + 16, infoY + 4, {
        fontSize: 9,
        color: color.text,
        width: 70,
        height: 12,
        zIndex: zIndex++,
      })
    )
  })

  // 頁碼
  elements.push(
    createTextElement('頁碼', '17', A5_WIDTH - 40, A5_HEIGHT - 20, {
      fontSize: 9,
      color: 'rgba(148, 163, 184, 0.3)',
      textAlign: 'right',
      letterSpacing: 2,
      width: 20,
      height: 12,
      zIndex: zIndex++,
    })
  )

  return elements
}

/**
 * 主要轉換函數 - 根據頁面類型轉換為元素
 */
export function pageToElements(
  pageType: string,
  data: {
    coverData: BrochureCoverData
    itinerary: Itinerary | null
    dayIndex?: number
    day?: DailyItineraryDay
    accommodations?: Array<{ name: string; image?: string; days?: number[] }>
  }
): CanvasElement[] {
  const { coverData, itinerary, dayIndex, day, accommodations = [] } = data

  switch (pageType) {
    case 'cover':
      return coverToElements(coverData)

    case 'blank':
      return blankToElements()

    case 'contents':
      return contentsToElements(coverData, itinerary)

    case 'overview-left':
      return overviewLeftToElements(coverData, itinerary)

    case 'overview-right':
      return overviewRightToElements(coverData, itinerary)

    case 'accommodation-left':
      return accommodationLeftToElements(accommodations)

    case 'accommodation-right':
      return accommodationRightToElements(accommodations)

    default:
      // 每日行程頁
      if (pageType.startsWith('day-') && dayIndex !== undefined && day) {
        if (pageType.endsWith('-left')) {
          return dailyLeftToElements(
            dayIndex,
            day,
            itinerary?.departure_date || undefined,
            `${coverData.country} ${coverData.city}`
          )
        } else if (pageType.endsWith('-right')) {
          return dailyRightToElements(dayIndex, day)
        }
      }
      return []
  }
}

/**
 * 主要匯出函數 - 將模板頁面轉換為 Canvas 元素
 * 這是供 BrochureDesignerPage 使用的介面
 */
export function templateToElements(
  pageType: TemplatePageType,
  options: TemplateToElementsOptions = {}
): CanvasElement[] {
  const { coverData, itinerary, dayIndex, accommodations = [] } = options
  const dailyItinerary = itinerary?.daily_itinerary || []

  // 取得當天行程資料
  const day = dayIndex !== undefined ? dailyItinerary[dayIndex] : undefined

  return pageToElements(pageType, {
    coverData: coverData || {
      clientName: '',
      country: '',
      city: '',
      airportCode: '',
      travelDates: '',
      coverImage: '',
      companyName: '角落旅行社',
      emergencyContact: '',
      emergencyEmail: '',
    },
    itinerary: itinerary || null,
    dayIndex,
    day,
    accommodations,
  })
}
