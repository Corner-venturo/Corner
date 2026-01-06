/**
 * Schema-Driven Element Generator
 * 根據 PageSchema 的 dataSnapshot 生成 CanvasElement 列表
 *
 * 此模組是 templateToElements.ts 的 Schema 驅動版本
 * 保留原有的精細佈局邏輯，但使用 Schema 類型作為輸入
 */

import type {
  CanvasElement,
  TextElement,
  ImageElement,
  ShapeElement,
} from '../canvas-editor/types'
import type {
  PageTemplateType,
  PageDataSnapshot,
  ElementOverride,
  GenerateElementsOptions,
  CoverDataSnapshot,
  DayDataSnapshot,
  AccommodationSnapshot,
  DEFAULT_PAGE_SIZE,
  BrochureSettings,
} from './types'
import { themeRegistry } from './themes'

// A5 尺寸常數
const A5_WIDTH = 559
const A5_HEIGHT = 794

// ============================================================================
// ID 生成器
// ============================================================================

let idCounter = 0

/** 生成唯一 ID */
const generateId = (prefix: string): string => {
  idCounter++
  return `${prefix}-${Date.now()}-${idCounter}-${Math.random().toString(36).substr(2, 5)}`
}

/** 重置 ID 計數器（測試用） */
export const resetIdCounter = () => {
  idCounter = 0
}

// ============================================================================
// 元素建構器
// ============================================================================

/** 文字元素建構器 */
export function createTextElement(
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

/** 圖片元素建構器 */
export function createImageElement(
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

/** 形狀元素建構器 */
export function createShapeElement(
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    fill?: string
    stroke?: string
    strokeWidth?: number
    cornerRadius?: number
    zIndex?: number
    opacity?: number
  } = {}
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

// ============================================================================
// 頁面元素生成器
// ============================================================================

/**
 * 封面頁元素生成
 * @deprecated 此為舊版硬編碼版面，請使用主題系統 (themes/classic.ts 或 themes/modern.ts)
 */
function generateCoverElements(data: CoverDataSnapshot): CanvasElement[] {
  const elements: CanvasElement[] = []
  let zIndex = 0
  const padding = 20

  // 背景圖片
  if (data.coverImage) {
    elements.push(createImageElement('封面背景圖', data.coverImage, 0, 0, A5_WIDTH, A5_HEIGHT, zIndex++))
  } else {
    elements.push(createShapeElement('封面背景', 0, 0, A5_WIDTH, A5_HEIGHT, { fill: '#1e293b', zIndex: zIndex++ }))
  }

  // 遮罩
  elements.push(createShapeElement('漸層遮罩', 0, 0, A5_WIDTH, A5_HEIGHT, { fill: 'rgba(0, 0, 0, 0.4)', zIndex: zIndex++ }))

  // 客戶名稱
  if (data.clientName) {
    elements.push(createShapeElement('客戶名左線', padding, 28, 2, 12, { fill: '#f59e0b', zIndex: zIndex++ }))
    elements.push(createTextElement('客戶名稱', data.clientName.toUpperCase(), padding + 8, 28, {
      fontSize: 9, fontWeight: '700', color: 'rgba(255, 255, 255, 0.9)', letterSpacing: 3, width: 300, height: 14, zIndex: zIndex++
    }))
  }

  // 中央：國家 + 城市 + 日期
  const centerY = A5_HEIGHT / 2

  if (data.country) {
    elements.push(createTextElement('國家', data.country.toUpperCase(), 0, centerY - 50, {
      fontSize: 14, fontWeight: '300', color: '#ffffff', textAlign: 'center', letterSpacing: 10, width: A5_WIDTH, height: 20, zIndex: zIndex++
    }))
  }

  elements.push(createTextElement('城市', data.city || 'CITY', 0, centerY - 25, {
    fontSize: 30, fontWeight: '800', color: '#ffffff', textAlign: 'center', width: A5_WIDTH, height: 40, zIndex: zIndex++
  }))

  if (data.travelDates) {
    const dateWidth = 180
    const dateX = (A5_WIDTH - dateWidth) / 2
    const dateY = centerY + 25

    elements.push(createShapeElement('日期背景', dateX, dateY, dateWidth, 28, {
      fill: 'rgba(255, 255, 255, 0.1)', stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 1, cornerRadius: 14, zIndex: zIndex++
    }))
    elements.push(createTextElement('旅遊日期', `✈  ${data.travelDates}`, dateX, dateY + 7, {
      fontSize: 10, fontWeight: '500', color: '#ffffff', textAlign: 'center', width: dateWidth, height: 16, zIndex: zIndex++
    }))
  }

  // 底部
  const bottomContentStart = A5_HEIGHT - padding - 50
  elements.push(createShapeElement('分隔線', padding + 20, bottomContentStart, A5_WIDTH - padding * 2 - 40, 1, {
    fill: 'rgba(255, 255, 255, 0.5)', zIndex: zIndex++
  }))
  elements.push(createImageElement('公司Logo', '/corner-logo.png', padding, bottomContentStart + 16, 60, 16, zIndex++))
  elements.push(createTextElement('聯絡標籤', 'Emergency Contact', A5_WIDTH - padding - 120, bottomContentStart + 10, {
    fontSize: 7, color: 'rgba(139, 134, 128, 0.9)', textAlign: 'right', width: 120, height: 10, zIndex: zIndex++
  }))

  if (data.emergencyContact) {
    elements.push(createTextElement('緊急電話', data.emergencyContact, A5_WIDTH - padding - 120, bottomContentStart + 22, {
      fontSize: 10, fontWeight: '600', color: '#ffffff', textAlign: 'right', width: 120, height: 14, zIndex: zIndex++
    }))
  }

  if (data.emergencyEmail) {
    elements.push(createTextElement('緊急信箱', data.emergencyEmail, A5_WIDTH - padding - 120, bottomContentStart + 38, {
      fontSize: 8, color: 'rgba(139, 134, 128, 0.9)', textAlign: 'right', width: 120, height: 12, zIndex: zIndex++
    }))
  }

  return elements
}

/**
 * 空白頁元素生成
 * @deprecated 此為舊版硬編碼版面，請使用主題系統 (themes/classic.ts 或 themes/modern.ts)
 */
function generateBlankElements(): CanvasElement[] {
  return [
    createShapeElement('空白頁背景', 0, 0, A5_WIDTH, A5_HEIGHT, { fill: '#ffffff', zIndex: 0 }),
    createTextElement('空白頁提示', '空白頁（封面背面）', A5_WIDTH / 2 - 60, A5_HEIGHT / 2 - 10, {
      fontSize: 12, color: '#cccccc', textAlign: 'center', width: 120, height: 20, zIndex: 1
    }),
  ]
}

/**
 * 目錄頁元素生成
 * @deprecated 此為舊版硬編碼版面，請使用主題系統 (themes/classic.ts 或 themes/modern.ts)
 */
function generateContentsElements(data: CoverDataSnapshot): CanvasElement[] {
  const elements: CanvasElement[] = []
  let zIndex = 0

  // 背景
  elements.push(createShapeElement('白色背景', 0, 0, A5_WIDTH, A5_HEIGHT, { fill: '#ffffff', zIndex: zIndex++ }))
  elements.push(createShapeElement('頂部裝飾條', 0, 0, A5_WIDTH, 6, { fill: '#22d3ee', zIndex: zIndex++ }))
  elements.push(createShapeElement('右上角裝飾', A5_WIDTH - 72, 0, 48, 64, { fill: 'rgba(34, 211, 238, 0.1)', cornerRadius: 24, zIndex: zIndex++ }))

  // Header
  elements.push(createShapeElement('Guidebook背景', 16, 16, 58, 16, { fill: '#22d3ee', cornerRadius: 3, zIndex: zIndex++ }))
  elements.push(createTextElement('Guidebook', 'Guidebook', 20, 18, { fontSize: 9, fontWeight: '700', color: '#ffffff', width: 50, height: 14, zIndex: zIndex++ }))
  elements.push(createTextElement('VOL', 'VOL. 01', 80, 18, { fontSize: 9, fontWeight: '500', color: '#94a3b8', letterSpacing: 2, width: 50, height: 14, zIndex: zIndex++ }))
  elements.push(createTextElement('CONTENTS', 'CONTENTS', 16, 36, { fontSize: 24, fontWeight: '800', color: '#0f172a', width: 180, height: 32, zIndex: zIndex++ }))

  const tripTitle = `${data.country || ''} ${data.city || ''} Trip`.trim() || 'Trip'
  elements.push(createTextElement('行程標題', tripTitle.toUpperCase(), 16, 70, { fontSize: 10, fontWeight: '500', color: '#06b6d4', letterSpacing: 2, width: 300, height: 16, zIndex: zIndex++ }))
  elements.push(createTextElement('目録', '目 録', A5_WIDTH - 40, 20, { fontSize: 18, fontWeight: '700', color: '#e2e8f0', width: 20, height: 60, zIndex: zIndex++ }))
  elements.push(createShapeElement('Header底線', 16, 92, A5_WIDTH - 32, 2, { fill: '#f1f5f9', zIndex: zIndex++ }))

  // 章節網格
  const gridStartY = 104
  const gridPadding = 16
  const gap = 8
  const cardWidth = (A5_WIDTH - gridPadding * 2 - gap) / 2
  const footerHeight = 50
  const availableHeight = A5_HEIGHT - gridStartY - footerHeight - gridPadding
  const cardHeight = (availableHeight - gap * 2) / 3

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

    elements.push(createShapeElement(`卡片${chapter.number}背景`, x, y, cardWidth, cardHeight, { fill: '#ffffff', stroke: '#f1f5f9', strokeWidth: 1, cornerRadius: 8, zIndex: zIndex++ }))
    elements.push(createTextElement(`章節${chapter.number}`, chapter.number, x + 10, y + 8, { fontSize: 24, fontWeight: '900', color: '#f1f5f9', width: 40, height: 30, zIndex: zIndex++ }))
    elements.push(createShapeElement(`圖標${chapter.number}背景`, x + cardWidth - 36, y + 8, 28, 28, { fill: '#f8fafc', cornerRadius: 14, zIndex: zIndex++ }))
    elements.push(createTextElement(`標題${chapter.number}`, chapter.title, x + 10, y + cardHeight - 55, { fontSize: 14, fontWeight: '700', color: '#1e293b', width: cardWidth - 20, height: 20, zIndex: zIndex++ }))
    elements.push(createTextElement(`中文${chapter.number}`, chapter.titleCn, x + 10, y + cardHeight - 35, { fontSize: 10, fontWeight: '500', color: '#94a3b8', letterSpacing: 1, width: cardWidth - 20, height: 16, zIndex: zIndex++ }))
    elements.push(createShapeElement(`虛線${chapter.number}`, x + 10, y + cardHeight - 22, cardWidth - 20, 1, { fill: '#e2e8f0', zIndex: zIndex++ }))
    elements.push(createTextElement(`頁碼${chapter.number}`, `P. ${String(chapter.page).padStart(2, '0')}`, x + cardWidth - 50, y + cardHeight - 18, { fontSize: 10, fontWeight: '700', color: '#94a3b8', textAlign: 'right', width: 40, height: 14, zIndex: zIndex++ }))
  })

  // Footer
  const footerY = A5_HEIGHT - footerHeight
  elements.push(createShapeElement('機場代碼背景', 16, footerY + 8, 32, 32, { fill: '#f1f5f9', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 16, zIndex: zIndex++ }))
  elements.push(createTextElement('機場代碼', data.airportCode || '---', 16, footerY + 18, { fontSize: 9, fontWeight: '700', color: '#94a3b8', textAlign: 'center', width: 32, height: 14, zIndex: zIndex++ }))
  elements.push(createTextElement('城市國家', `${data.city || ''}, ${data.country || ''}`, 56, footerY + 18, { fontSize: 12, fontWeight: '500', color: '#94a3b8', width: 200, height: 16, zIndex: zIndex++ }))
  elements.push(createTextElement('Bon Voyage', 'Bon Voyage', A5_WIDTH - 100, footerY + 10, { fontSize: 12, fontWeight: '700', color: '#06b6d4', textAlign: 'right', letterSpacing: 2, width: 84, height: 16, zIndex: zIndex++ }))
  elements.push(createTextElement('頁碼', 'Page 02', A5_WIDTH - 70, footerY + 28, { fontSize: 10, fontWeight: '500', color: '#94a3b8', textAlign: 'right', width: 54, height: 14, zIndex: zIndex++ }))
  elements.push(createShapeElement('底部裝飾', A5_WIDTH - 64, A5_HEIGHT - 64, 64, 64, { fill: 'rgba(34, 211, 238, 0.05)', cornerRadius: 64, zIndex: zIndex++ }))

  return elements
}

/**
 * 總攬左頁元素生成
 * @deprecated 此為舊版硬編碼版面，請使用主題系統 (themes/classic.ts 或 themes/modern.ts)
 */
function generateOverviewLeftElements(snapshot: PageDataSnapshot): CanvasElement[] {
  const elements: CanvasElement[] = []
  let zIndex = 0
  const data = snapshot.cover || {}
  const flight = snapshot.flight || {}
  const meeting = snapshot.meeting || {}

  const topHeight = Math.floor(A5_HEIGHT * 0.5)
  const sectionPadding = 16

  // 上方裝飾區
  elements.push(createShapeElement('上方背景', 0, 0, A5_WIDTH, topHeight, { fill: '#0d9488', zIndex: zIndex++ }))

  if (data.overviewImage) {
    elements.push(createImageElement('總攬背景圖', data.overviewImage, 0, 0, A5_WIDTH, topHeight, zIndex++))
    elements.push(createShapeElement('漸層遮罩', 0, 0, A5_WIDTH, topHeight, { fill: 'rgba(13, 148, 136, 0.5)', zIndex: zIndex++ }))
  }

  // 標題框
  const titleBoxWidth = 80
  const titleBoxHeight = 120
  const titleBoxX = (A5_WIDTH - titleBoxWidth) / 2
  const titleBoxY = (topHeight - titleBoxHeight) / 2

  elements.push(createShapeElement('標題框', titleBoxX, titleBoxY, titleBoxWidth, titleBoxHeight, { fill: 'rgba(255, 255, 255, 0.1)', stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 1, cornerRadius: 4, zIndex: zIndex++ }))
  elements.push(createTextElement('日文標題', `${data.city || 'Journey'}`, titleBoxX, titleBoxY + 20, { fontSize: 18, fontWeight: '700', color: '#ffffff', textAlign: 'center', letterSpacing: 3, width: titleBoxWidth, height: 60, zIndex: zIndex++ }))
  elements.push(createTextElement('Travel Guide', 'Travel Guide', titleBoxX, titleBoxY + 85, { fontSize: 8, fontWeight: '500', color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center', letterSpacing: 2, width: titleBoxWidth, height: 12, zIndex: zIndex++ }))

  // 下方資訊區
  elements.push(createShapeElement('下方背景', 0, topHeight, A5_WIDTH, A5_HEIGHT - topHeight, { fill: '#f8fafc', zIndex: zIndex++ }))

  let currentY = topHeight + 16

  // 航班資訊
  elements.push(createTextElement('航班標題', '航班資訊．フライト情報', sectionPadding + 20, currentY, { fontSize: 10, fontWeight: '500', color: '#64748b', width: 200, height: 14, zIndex: zIndex++ }))
  elements.push(createTextElement('航班標籤', 'Flight', A5_WIDTH - sectionPadding - 50, currentY, { fontSize: 8, color: '#94a3b8', textAlign: 'right', letterSpacing: 2, width: 50, height: 12, zIndex: zIndex++ }))

  currentY += 20

  // 去程
  if (flight.outbound) {
    elements.push(createShapeElement('去程線', sectionPadding + 22, currentY, 2, 40, { fill: 'rgba(249, 115, 22, 0.5)', zIndex: zIndex++ }))
    elements.push(createTextElement('去程標籤', '去程', sectionPadding + 30, currentY, { fontSize: 8, fontWeight: '700', color: '#f97316', width: 30, height: 12, zIndex: zIndex++ }))
    elements.push(createTextElement('去程航班', `${flight.outbound.airline || ''} ${flight.outbound.flightNumber || ''}`, sectionPadding + 100, currentY, { fontSize: 8, color: '#64748b', width: 150, height: 12, zIndex: zIndex++ }))
    elements.push(createTextElement('去程時間', `${flight.outbound.departureTime || ''} ${flight.outbound.departureAirport || ''} → ${flight.outbound.arrivalTime || ''} ${flight.outbound.arrivalAirport || ''}`, sectionPadding + 30, currentY + 14, { fontSize: 10, fontWeight: '600', color: '#334155', width: 300, height: 14, zIndex: zIndex++ }))
  }

  currentY += 45

  // 回程
  if (flight.return) {
    elements.push(createShapeElement('回程線', sectionPadding + 22, currentY, 2, 40, { fill: 'rgba(13, 148, 136, 0.5)', zIndex: zIndex++ }))
    elements.push(createTextElement('回程標籤', '回程', sectionPadding + 30, currentY, { fontSize: 8, fontWeight: '700', color: '#0d9488', width: 30, height: 12, zIndex: zIndex++ }))
    elements.push(createTextElement('回程航班', `${flight.return.airline || ''} ${flight.return.flightNumber || ''}`, sectionPadding + 100, currentY, { fontSize: 8, color: '#64748b', width: 150, height: 12, zIndex: zIndex++ }))
    elements.push(createTextElement('回程時間', `${flight.return.departureTime || ''} ${flight.return.departureAirport || ''} → ${flight.return.arrivalTime || ''} ${flight.return.arrivalAirport || ''}`, sectionPadding + 30, currentY + 14, { fontSize: 10, fontWeight: '600', color: '#334155', width: 300, height: 14, zIndex: zIndex++ }))
  }

  currentY += 55

  // 集合資訊
  elements.push(createTextElement('集合標題', '集合資訊．集合のご案内', sectionPadding + 20, currentY, { fontSize: 10, fontWeight: '500', color: '#64748b', width: 200, height: 14, zIndex: zIndex++ }))
  currentY += 20

  elements.push(createShapeElement('集合框', sectionPadding + 20, currentY, A5_WIDTH - sectionPadding * 2 - 40, 60, { fill: '#ffffff', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 4, zIndex: zIndex++ }))
  elements.push(createTextElement('集合時間', meeting.meetingTime || meeting.departureDate || '', sectionPadding + 30, currentY + 12, { fontSize: 10, fontWeight: '600', color: '#334155', width: 200, height: 14, zIndex: zIndex++ }))
  elements.push(createTextElement('集合地點', meeting.meetingLocation || '桃園機場第二航廈 團體櫃檯前', sectionPadding + 30, currentY + 32, { fontSize: 10, color: '#475569', width: A5_WIDTH - 100, height: 20, zIndex: zIndex++ }))

  currentY += 75

  // 領隊資訊
  elements.push(createTextElement('領隊標題', '領隊．添乗員', sectionPadding + 20, currentY, { fontSize: 10, fontWeight: '500', color: '#64748b', width: 150, height: 14, zIndex: zIndex++ }))
  currentY += 20

  elements.push(createShapeElement('領隊框', sectionPadding + 20, currentY, A5_WIDTH - sectionPadding * 2 - 40, 40, { fill: 'rgba(13, 148, 136, 0.05)', stroke: 'rgba(13, 148, 136, 0.1)', strokeWidth: 1, cornerRadius: 4, zIndex: zIndex++ }))
  elements.push(createTextElement('領隊名稱', meeting.leaderName || '領隊', sectionPadding + 50, currentY + 12, { fontSize: 12, fontWeight: '700', color: '#334155', width: 150, height: 16, zIndex: zIndex++ }))
  elements.push(createTextElement('領隊電話', meeting.leaderPhone || data.emergencyContact || '', A5_WIDTH - sectionPadding - 150, currentY + 12, { fontSize: 10, color: '#64748b', textAlign: 'right', width: 130, height: 14, zIndex: zIndex++ }))

  // 頁碼
  elements.push(createTextElement('頁碼', '04', sectionPadding, A5_HEIGHT - 20, { fontSize: 9, color: '#94a3b8', width: 20, height: 12, zIndex: zIndex++ }))

  return elements
}

/**
 * 總攬右頁元素生成
 * @deprecated 此為舊版硬編碼版面，請使用主題系統 (themes/classic.ts 或 themes/modern.ts)
 */
function generateOverviewRightElements(snapshot: PageDataSnapshot): CanvasElement[] {
  const elements: CanvasElement[] = []
  let zIndex = 0
  const dailyOverview = snapshot.dailyOverview || []
  const meeting = snapshot.meeting || {}

  // 背景
  elements.push(createShapeElement('總攬右背景', 0, 0, A5_WIDTH, A5_HEIGHT, { fill: '#ffffff', zIndex: zIndex++ }))

  // 標題
  elements.push(createTextElement('行程總攬', '行程總攬', 24, 24, { fontSize: 20, fontWeight: '700', color: '#1e293b', letterSpacing: 4, width: 150, height: 28, zIndex: zIndex++ }))
  elements.push(createTextElement('英文副標', 'Itinerary Overview', 24, 52, { fontSize: 9, color: '#0d9488', letterSpacing: 3, width: 150, height: 14, zIndex: zIndex++ }))
  elements.push(createShapeElement('標題底線', 24, 72, A5_WIDTH - 48, 2, { fill: 'rgba(13, 148, 136, 0.1)', zIndex: zIndex++ }))

  // 時間軸線
  elements.push(createShapeElement('時間軸線', 40, 90, 1, A5_HEIGHT - 140, { fill: '#e2e8f0', zIndex: zIndex++ }))

  // 日期格式化
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

  // 每日行程
  const startY = 90
  const totalDays = Math.min(dailyOverview.length, 6)
  const availableHeight = A5_HEIGHT - startY - 50
  const dayHeight = availableHeight / Math.max(totalDays, 1)

  dailyOverview.slice(0, 6).forEach((day, index) => {
    const yPos = startY + index * dayHeight

    elements.push(createShapeElement(`Day${index + 1}背景`, 24, yPos + 4, 32, 40, { fill: '#ffffff', zIndex: zIndex++ }))
    elements.push(createTextElement(`DAY標籤${index + 1}`, 'DAY', 24, yPos + 4, { fontSize: 7, fontWeight: '700', color: '#94a3b8', textAlign: 'center', letterSpacing: 2, width: 32, height: 10, zIndex: zIndex++ }))
    elements.push(createTextElement(`Day數字${index + 1}`, String(index + 1).padStart(2, '0'), 24, yPos + 16, { fontSize: 16, fontWeight: '700', color: '#0d9488', textAlign: 'center', width: 32, height: 22, zIndex: zIndex++ }))
    elements.push(createTextElement(`日期${index + 1}`, formatDate(meeting.departureDate || '', index), 60, yPos + 6, { fontSize: 8, color: '#94a3b8', width: 100, height: 12, zIndex: zIndex++ }))
    elements.push(createTextElement(`標題${index + 1}`, day.title || `第 ${index + 1} 天`, 60, yPos + 20, { fontSize: 14, fontWeight: '700', color: '#334155', width: A5_WIDTH - 90, height: 18, zIndex: zIndex++ }))

    if (day.activities && day.activities.length > 0) {
      const tags = day.activities.slice(0, 3).join(' · ')
      elements.push(createTextElement(`活動${index + 1}`, tags, 60, yPos + 42, { fontSize: 9, color: '#64748b', width: A5_WIDTH - 90, height: 14, zIndex: zIndex++ }))
    }

    if (index < totalDays - 1) {
      elements.push(createShapeElement(`分隔線${index + 1}`, 60, yPos + dayHeight - 8, A5_WIDTH - 90, 1, { fill: '#e2e8f0', zIndex: zIndex++ }))
    }
  })

  // 裝飾 & 頁碼
  elements.push(createShapeElement('底部裝飾', A5_WIDTH - 80, A5_HEIGHT - 80, 80, 80, { fill: 'rgba(13, 148, 136, 0.05)', cornerRadius: 80, zIndex: zIndex++ }))
  elements.push(createTextElement('頁碼', '05', A5_WIDTH - 40, A5_HEIGHT - 20, { fontSize: 9, color: '#94a3b8', textAlign: 'right', width: 20, height: 12, zIndex: zIndex++ }))

  return elements
}

/**
 * 每日行程左頁元素生成
 * @deprecated 此為舊版硬編碼版面，請使用主題系統 (themes/classic.ts 或 themes/modern.ts)
 */
function generateDayLeftElements(day: DayDataSnapshot, cover?: CoverDataSnapshot, departureDate?: string): CanvasElement[] {
  const elements: CanvasElement[] = []
  let zIndex = 0
  const dayNumber = day.dayIndex + 1
  const activities = day.activities || []

  const KANJI_NUMBERS = ['壱', '弐', '参', '肆', '伍', '陸', '漆', '捌', '玖', '拾']
  const kanjiNumber = KANJI_NUMBERS[day.dayIndex] || String(dayNumber)

  const topHeight = Math.floor(A5_HEIGHT * 0.45)

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

  // 上方標題區
  elements.push(createShapeElement('上方背景', 0, 0, A5_WIDTH, topHeight, { fill: '#f8fafc', zIndex: zIndex++ }))
  elements.push(createShapeElement('標題底線', 0, topHeight, A5_WIDTH, 1, { fill: '#e2e8f0', zIndex: zIndex++ }))
  elements.push(createShapeElement('裝飾圓', A5_WIDTH - 100, -50, 160, 160, { fill: 'rgba(13, 148, 136, 0.1)', cornerRadius: 80, opacity: 0.3, zIndex: zIndex++ }))

  const tripName = cover ? `${cover.country || ''} ${cover.city || ''}`.trim() : 'Japan Travel'
  elements.push(createTextElement('行程名稱', tripName, 24, 24, { fontSize: 10, fontWeight: '700', color: '#f97316', letterSpacing: 4, width: 200, height: 14, zIndex: zIndex++ }))
  elements.push(createTextElement('日期', formatDate(departureDate || '', day.dayIndex), 24, 42, { fontSize: 9, color: '#64748b', letterSpacing: 2, width: 200, height: 12, zIndex: zIndex++ }))
  elements.push(createTextElement('日文數字', kanjiNumber, A5_WIDTH - 70, 20, { fontSize: 36, fontWeight: '700', color: 'rgba(13, 148, 136, 0.15)', width: 50, height: 45, zIndex: zIndex++ }))

  // Day 大標題
  elements.push(createTextElement('Day標題', 'Day', 24, topHeight - 140, { fontSize: 72, fontWeight: '900', color: '#0d9488', width: 150, height: 70, zIndex: zIndex++ }))
  elements.push(createTextElement('Day數字', String(dayNumber).padStart(2, '0'), 24, topHeight - 70, { fontSize: 72, fontWeight: '900', color: '#0d9488', width: 150, height: 70, zIndex: zIndex++ }))
  elements.push(createShapeElement('標題線', 32, topHeight - 50, 1, 40, { fill: '#cbd5e1', zIndex: zIndex++ }))
  elements.push(createTextElement('標題', day.title || `第 ${dayNumber} 天`, 40, topHeight - 45, { fontSize: 18, fontWeight: '700', color: '#1e293b', width: A5_WIDTH - 80, height: 24, zIndex: zIndex++ }))

  if (day.highlight) {
    elements.push(createTextElement('Highlight', day.highlight, 40, topHeight - 20, { fontSize: 11, fontWeight: '500', color: '#64748b', letterSpacing: 2, width: A5_WIDTH - 80, height: 16, zIndex: zIndex++ }))
  }

  // 下方區域
  const useImageMode = activities.length < 2
  const dayImage = day.images?.[0] ? (typeof day.images[0] === 'string' ? day.images[0] : day.images[0].url) : undefined

  if (useImageMode && dayImage) {
    elements.push(createImageElement('每日背景圖', dayImage, 0, topHeight, A5_WIDTH, A5_HEIGHT - topHeight, zIndex++))
    elements.push(createShapeElement('底部遮罩', 0, A5_HEIGHT - 80, A5_WIDTH, 80, { fill: 'rgba(0, 0, 0, 0.3)', zIndex: zIndex++ }))
    elements.push(createTextElement('移動日標題', activities[0]?.title || '移動日', 24, A5_HEIGHT - 50, { fontSize: 14, fontWeight: '500', color: '#ffffff', width: A5_WIDTH - 48, height: 20, zIndex: zIndex++ }))
  } else if (useImageMode) {
    elements.push(createShapeElement('空白背景', 0, topHeight, A5_WIDTH, A5_HEIGHT - topHeight, { fill: '#f8fafc', zIndex: zIndex++ }))
    elements.push(createTextElement('移動日', '移動日', (A5_WIDTH - 100) / 2, topHeight + (A5_HEIGHT - topHeight) / 2 - 20, { fontSize: 14, color: '#cbd5e1', textAlign: 'center', width: 100, height: 20, zIndex: zIndex++ }))
  } else {
    // 時間軸模式
    elements.push(createShapeElement('時間軸背景', 0, topHeight, A5_WIDTH, A5_HEIGHT - topHeight, { fill: '#ffffff', zIndex: zIndex++ }))
    elements.push(createTextElement('TIMELINE', 'TIMELINE', A5_WIDTH - 50, topHeight + 16, { fontSize: 9, color: '#e2e8f0', letterSpacing: 2, width: 30, height: 80, zIndex: zIndex++ }))

    const dotColors = ['#0d9488', '#f97316', '#0f766e', '#475569']
    let activityY = topHeight + 20

    activities.slice(0, 5).forEach((activity, index) => {
      const isLast = index === Math.min(activities.length - 1, 4)
      const dotColor = dotColors[index % dotColors.length]

      elements.push(createShapeElement(`圓點${index + 1}`, 30, activityY + 4, 10, 10, { fill: dotColor, cornerRadius: 5, zIndex: zIndex++ }))

      if (!isLast) {
        elements.push(createShapeElement(`連接線${index + 1}`, 35, activityY + 18, 1, 60, { fill: '#e2e8f0', zIndex: zIndex++ }))
      }

      elements.push(createTextElement(`活動標題${index + 1}`, activity.title, 52, activityY, { fontSize: 14, fontWeight: '700', color: '#1e293b', width: A5_WIDTH - 80, height: 18, zIndex: zIndex++ }))

      if (activity.description) {
        elements.push(createShapeElement(`描述背景${index + 1}`, 52, activityY + 22, A5_WIDTH - 80, 30, { fill: 'rgba(248, 250, 252, 0.8)', stroke: '#f1f5f9', strokeWidth: 1, cornerRadius: 4, zIndex: zIndex++ }))
        elements.push(createTextElement(`活動描述${index + 1}`, activity.description, 56, activityY + 28, { fontSize: 9, color: '#64748b', width: A5_WIDTH - 90, height: 20, zIndex: zIndex++ }))
      }

      activityY += 75
    })
  }

  // 頁碼
  const pageNumber = dayNumber * 2 + 4
  elements.push(createTextElement('頁碼', `P.${String(pageNumber).padStart(2, '0')}`, 20, A5_HEIGHT - 24, { fontSize: 9, color: useImageMode && dayImage ? 'rgba(255,255,255,0.7)' : 'rgba(148, 163, 184, 0.5)', width: 40, height: 12, zIndex: zIndex++ }))

  return elements
}

/**
 * 每日行程右頁元素生成
 * @deprecated 此為舊版硬編碼版面，請使用主題系統 (themes/classic.ts 或 themes/modern.ts)
 */
function generateDayRightElements(day: DayDataSnapshot): CanvasElement[] {
  const elements: CanvasElement[] = []
  let zIndex = 0
  const activities = day.activities || []
  const dayNumber = day.dayIndex + 1
  const padding = 24

  // 背景
  elements.push(createShapeElement('每日右背景', 0, 0, A5_WIDTH, A5_HEIGHT, { fill: '#ffffff', zIndex: zIndex++ }))

  // 標題
  elements.push(createTextElement('景點介紹', '景點介紹', padding, 24, { fontSize: 18, fontWeight: '700', color: '#1e293b', letterSpacing: 4, width: 120, height: 24, zIndex: zIndex++ }))
  elements.push(createTextElement('英文副標', 'Highlights', 150, 28, { fontSize: 11, color: '#94a3b8', width: 80, height: 16, zIndex: zIndex++ }))
  elements.push(createShapeElement('標題底線', padding, 56, A5_WIDTH - padding * 2, 1, { fill: '#e2e8f0', zIndex: zIndex++ }))

  const cardStartY = 70
  const activityCount = activities.length

  const getActivityImage = (activity: typeof activities[0], index: number) => {
    if (activity.image) return activity.image
    if (day.images && day.images[index]) {
      const img = day.images[index]
      return typeof img === 'string' ? img : img.url
    }
    return null
  }

  if (activityCount <= 2) {
    // 大圖模式
    const cardHeight = (A5_HEIGHT - cardStartY - 100) / Math.max(activityCount, 1)

    activities.slice(0, 2).forEach((activity, index) => {
      const y = cardStartY + index * (cardHeight + 12)
      const image = getActivityImage(activity, index)

      elements.push(createShapeElement(`卡片背景${index + 1}`, padding, y, A5_WIDTH - padding * 2, cardHeight, { fill: '#ffffff', stroke: '#f1f5f9', strokeWidth: 1, cornerRadius: 8, zIndex: zIndex++ }))

      const imageHeight = cardHeight * 0.6
      if (image) {
        elements.push(createImageElement(`活動圖${index + 1}`, image, padding, y, A5_WIDTH - padding * 2, imageHeight, zIndex++))
      } else {
        elements.push(createShapeElement(`圖片佔位${index + 1}`, padding, y, A5_WIDTH - padding * 2, imageHeight, { fill: '#f8fafc', cornerRadius: 8, zIndex: zIndex++ }))
      }

      elements.push(createTextElement(`活動標題${index + 1}`, activity.title, padding + 12, y + imageHeight + 12, { fontSize: 14, fontWeight: '700', color: '#1e293b', width: A5_WIDTH - padding * 2 - 24, height: 18, zIndex: zIndex++ }))

      if (activity.description) {
        elements.push(createTextElement(`活動描述${index + 1}`, activity.description, padding + 12, y + imageHeight + 34, { fontSize: 10, color: '#64748b', width: A5_WIDTH - padding * 2 - 24, height: 40, zIndex: zIndex++ }))
      }
    })
  } else if (activityCount <= 4) {
    // 2x2 網格
    const gap = 8
    const cardWidth = (A5_WIDTH - padding * 2 - gap) / 2
    const cardHeight = (A5_HEIGHT - cardStartY - 100 - gap) / 2

    activities.slice(0, 4).forEach((activity, index) => {
      const col = index % 2
      const row = Math.floor(index / 2)
      const x = padding + col * (cardWidth + gap)
      const y = cardStartY + row * (cardHeight + gap)
      const image = getActivityImage(activity, index)

      elements.push(createShapeElement(`卡片背景${index + 1}`, x, y, cardWidth, cardHeight, { fill: '#ffffff', stroke: '#f1f5f9', strokeWidth: 1, cornerRadius: 8, zIndex: zIndex++ }))

      const imageHeight = 80
      if (image) {
        elements.push(createImageElement(`活動圖${index + 1}`, image, x, y, cardWidth, imageHeight, zIndex++))
      } else {
        elements.push(createShapeElement(`圖片佔位${index + 1}`, x, y, cardWidth, imageHeight, { fill: '#f8fafc', cornerRadius: 8, zIndex: zIndex++ }))
      }

      elements.push(createTextElement(`活動標題${index + 1}`, activity.title, x + 8, y + imageHeight + 8, { fontSize: 11, fontWeight: '700', color: '#1e293b', width: cardWidth - 16, height: 16, zIndex: zIndex++ }))

      if (activity.description) {
        elements.push(createTextElement(`活動描述${index + 1}`, activity.description, x + 8, y + imageHeight + 28, { fontSize: 9, color: '#64748b', width: cardWidth - 16, height: 30, zIndex: zIndex++ }))
      }
    })
  } else {
    // 緊湊列表
    let listY = cardStartY

    activities.slice(0, 5).forEach((activity, index) => {
      const image = getActivityImage(activity, index)

      elements.push(createShapeElement(`列表卡片${index + 1}`, padding, listY, A5_WIDTH - padding * 2, 70, { fill: '#ffffff', stroke: '#f1f5f9', strokeWidth: 1, cornerRadius: 8, zIndex: zIndex++ }))

      if (image) {
        elements.push(createImageElement(`列表圖${index + 1}`, image, padding + 8, listY + 8, 54, 54, zIndex++))
      } else {
        elements.push(createShapeElement(`列表圖佔位${index + 1}`, padding + 8, listY + 8, 54, 54, { fill: '#f8fafc', cornerRadius: 4, zIndex: zIndex++ }))
      }

      elements.push(createTextElement(`列表標題${index + 1}`, activity.title, padding + 72, listY + 12, { fontSize: 11, fontWeight: '700', color: '#1e293b', width: A5_WIDTH - padding * 2 - 90, height: 16, zIndex: zIndex++ }))

      if (activity.description) {
        elements.push(createTextElement(`列表描述${index + 1}`, activity.description, padding + 72, listY + 32, { fontSize: 9, color: '#64748b', width: A5_WIDTH - padding * 2 - 90, height: 28, zIndex: zIndex++ }))
      }

      listY += 80
    })
  }

  // 底部
  elements.push(createShapeElement('底部線', padding, A5_HEIGHT - 60, A5_WIDTH - padding * 2, 1, { fill: '#e2e8f0', zIndex: zIndex++ }))
  elements.push(createTextElement('底部備註', '行程內容可能依當地情況調整，敬請見諒', (A5_WIDTH - 280) / 2, A5_HEIGHT - 45, { fontSize: 9, color: '#94a3b8', textAlign: 'center', width: 280, height: 14, zIndex: zIndex++ }))

  const pageNumber = dayNumber * 2 + 5
  elements.push(createTextElement('頁碼', `${String(dayNumber).padStart(2, '0')}-${String(pageNumber).padStart(2, '0')} / SPOTS`, A5_WIDTH - padding - 100, A5_HEIGHT - 24, { fontSize: 9, color: 'rgba(148, 163, 184, 0.5)', textAlign: 'right', width: 100, height: 12, zIndex: zIndex++ }))

  return elements
}

/**
 * 住宿左頁元素生成
 * @deprecated 此為舊版硬編碼版面，請使用主題系統 (themes/classic.ts 或 themes/modern.ts)
 */
function generateAccommodationLeftElements(accommodations: AccommodationSnapshot[]): CanvasElement[] {
  const elements: CanvasElement[] = []
  let zIndex = 0
  const padding = 24
  const displayAccommodations = accommodations.slice(0, 3)

  // 背景
  elements.push(createShapeElement('住宿左背景', 0, 0, A5_WIDTH, A5_HEIGHT, { fill: '#ffffff', zIndex: zIndex++ }))

  // 標題
  elements.push(createShapeElement('標題裝飾線', padding, 28, 8, 1, { fill: '#f97316', zIndex: zIndex++ }))
  elements.push(createTextElement('英文標籤', 'Accommodation', padding + 14, 24, { fontSize: 9, fontWeight: '700', color: '#f97316', letterSpacing: 4, width: 120, height: 14, zIndex: zIndex++ }))
  elements.push(createTextElement('日文標題', '宿泊施設', padding, 44, { fontSize: 24, fontWeight: '700', color: '#1e293b', letterSpacing: 4, width: 150, height: 32, zIndex: zIndex++ }))
  elements.push(createTextElement('副標題', '嚴選住宿介紹', padding, 80, { fontSize: 10, color: '#64748b', width: 100, height: 14, zIndex: zIndex++ }))

  // 住宿卡片
  const cardStartY = 110
  const availableHeight = A5_HEIGHT - cardStartY - 40
  const gap = 16
  const cardHeight = (availableHeight - gap * (displayAccommodations.length - 1)) / Math.max(displayAccommodations.length, 1)

  displayAccommodations.forEach((hotel, index) => {
    const y = cardStartY + index * (cardHeight + gap)

    elements.push(createShapeElement(`卡片背景${index + 1}`, padding, y, A5_WIDTH - padding * 2, cardHeight, { fill: '#f8fafc', cornerRadius: 8, zIndex: zIndex++ }))

    if (hotel.image) {
      elements.push(createImageElement(`住宿圖${index + 1}`, hotel.image, padding, y, A5_WIDTH - padding * 2, cardHeight, zIndex++))
    }

    elements.push(createShapeElement(`漸層遮罩${index + 1}`, padding, y + cardHeight - 70, A5_WIDTH - padding * 2, 70, { fill: 'rgba(0, 0, 0, 0.4)', zIndex: zIndex++ }))
    elements.push(createTextElement(`編號${index + 1}`, String(index + 1).padStart(2, '0'), padding + 16, y + cardHeight - 55, { fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', width: 30, height: 16, zIndex: zIndex++ }))
    elements.push(createTextElement(`住宿名稱${index + 1}`, hotel.name, padding + 16, y + cardHeight - 35, { fontSize: 18, fontWeight: '700', color: '#ffffff', width: A5_WIDTH - padding * 2 - 100, height: 24, zIndex: zIndex++ }))

    if (hotel.days && hotel.days.length > 0) {
      const daysText = hotel.days.length === 1 ? `Day ${hotel.days[0]}` : `Day ${hotel.days[0]}-${hotel.days[hotel.days.length - 1]}`
      elements.push(createShapeElement(`天數背景${index + 1}`, A5_WIDTH - padding - 80, y + cardHeight - 40, 64, 24, { fill: 'rgba(255, 255, 255, 0.2)', cornerRadius: 4, zIndex: zIndex++ }))
      elements.push(createTextElement(`天數${index + 1}`, daysText, A5_WIDTH - padding - 76, y + cardHeight - 35, { fontSize: 10, color: '#ffffff', textAlign: 'center', width: 56, height: 14, zIndex: zIndex++ }))
    }
  })

  elements.push(createTextElement('頁碼', '16', 20, A5_HEIGHT - 20, { fontSize: 9, color: '#94a3b8', width: 20, height: 12, zIndex: zIndex++ }))

  return elements
}

/**
 * 住宿右頁元素生成
 * @deprecated 此為舊版硬編碼版面，請使用主題系統 (themes/classic.ts 或 themes/modern.ts)
 */
function generateAccommodationRightElements(accommodations: AccommodationSnapshot[]): CanvasElement[] {
  const elements: CanvasElement[] = []
  let zIndex = 0
  const padding = 24
  const displayAccommodations = accommodations.slice(0, 3)

  // 背景
  elements.push(createShapeElement('住宿右背景', 0, 0, A5_WIDTH, A5_HEIGHT, { fill: '#ffffff', zIndex: zIndex++ }))
  elements.push(createShapeElement('右上裝飾', A5_WIDTH - 200, -50, 200, 200, { fill: 'rgba(249, 115, 22, 0.05)', cornerRadius: 100, zIndex: zIndex++ }))

  // 標題
  elements.push(createShapeElement('標題裝飾線', padding, 28, 8, 1, { fill: '#f97316', zIndex: zIndex++ }))
  elements.push(createTextElement('英文標籤', 'Accommodation Guide', padding + 14, 24, { fontSize: 9, fontWeight: '700', color: '#f97316', letterSpacing: 3, width: 150, height: 14, zIndex: zIndex++ }))
  elements.push(createTextElement('日文標題', '住宿資訊', padding, 44, { fontSize: 20, fontWeight: '700', color: '#1e293b', letterSpacing: 4, width: 120, height: 28, zIndex: zIndex++ }))
  elements.push(createTextElement('裝飾文字', '厳選宿泊', A5_WIDTH - 140, 36, { fontSize: 30, fontWeight: '700', color: 'rgba(30, 41, 59, 0.05)', width: 120, height: 40, zIndex: zIndex++ }))

  // 住宿資訊卡片
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

    elements.push(createShapeElement(`左邊線${index + 1}`, padding, y, 2, cardHeight - 10, { fill: color.border, zIndex: zIndex++ }))
    elements.push(createShapeElement(`編號背景${index + 1}`, padding + 12, y + 8, 26, 16, { fill: 'transparent', stroke: color.border, strokeWidth: 1, cornerRadius: 4, zIndex: zIndex++ }))
    elements.push(createTextElement(`編號${index + 1}`, String(index + 1).padStart(2, '0'), padding + 12, y + 10, { fontSize: 9, color: color.text, textAlign: 'center', letterSpacing: 2, width: 26, height: 12, zIndex: zIndex++ }))
    elements.push(createTextElement(`住宿名稱${index + 1}`, hotel.name, padding + 44, y + 8, { fontSize: 16, fontWeight: '700', color: '#1e293b', width: A5_WIDTH - padding * 2 - 150, height: 20, zIndex: zIndex++ }))

    if (hotel.days && hotel.days.length > 0) {
      const daysText = hotel.days.length === 1 ? `Day ${hotel.days[0]}` : `Day ${hotel.days[0]}-${hotel.days[hotel.days.length - 1]}`
      const nightsText = `(${hotel.days.length}晚)`
      elements.push(createShapeElement(`天數背景${index + 1}`, A5_WIDTH - padding - 90, y + 6, 74, 20, { fill: color.bg, cornerRadius: 4, zIndex: zIndex++ }))
      elements.push(createTextElement(`天數${index + 1}`, `${daysText} ${nightsText}`, A5_WIDTH - padding - 88, y + 10, { fontSize: 9, color: color.text, width: 70, height: 12, zIndex: zIndex++ }))
    }

    elements.push(createShapeElement(`分隔線${index + 1}`, padding + 12, y + 34, A5_WIDTH - padding * 2 - 12, 1, { fill: 'rgba(226, 232, 240, 0.4)', zIndex: zIndex++ }))

    let infoY = y + 45

    if (hotel.address) {
      elements.push(createTextElement(`地址標籤${index + 1}`, '📍', padding + 12, infoY, { fontSize: 12, color: '#94a3b8', width: 18, height: 16, zIndex: zIndex++ }))
      elements.push(createTextElement(`地址${index + 1}`, hotel.address, padding + 32, infoY, { fontSize: 10, color: '#334155', width: A5_WIDTH - padding * 2 - 44, height: 32, zIndex: zIndex++ }))
      infoY += 35
    }

    if (hotel.phone) {
      elements.push(createTextElement(`電話標籤${index + 1}`, '📞', padding + 12, infoY, { fontSize: 12, color: '#94a3b8', width: 18, height: 16, zIndex: zIndex++ }))
      elements.push(createTextElement(`電話${index + 1}`, hotel.phone, padding + 32, infoY, { fontSize: 10, color: '#334155', letterSpacing: 1, width: 150, height: 14, zIndex: zIndex++ }))
      infoY += 20
    }

    elements.push(createTextElement(`時間標籤${index + 1}`, '🕐', padding + 12, infoY, { fontSize: 12, color: '#94a3b8', width: 18, height: 16, zIndex: zIndex++ }))
    elements.push(createTextElement(`時間${index + 1}`, `IN ${hotel.checkIn || '15:00'} / OUT ${hotel.checkOut || '11:00'}`, padding + 32, infoY, { fontSize: 10, color: '#334155', width: 200, height: 14, zIndex: zIndex++ }))
  })

  elements.push(createTextElement('頁碼', '17', A5_WIDTH - 40, A5_HEIGHT - 20, { fontSize: 9, color: 'rgba(148, 163, 184, 0.3)', textAlign: 'right', letterSpacing: 2, width: 20, height: 12, zIndex: zIndex++ }))

  return elements
}

// ============================================================================
// 主要匯出函數
// ============================================================================

/**
 * 根據頁面類型和資料快照生成元素列表
 *
 * 如果提供 themeId 或 settings.themeId，會使用主題系統生成元素。
 * 否則會使用舊版硬編碼版面（向後兼容）。
 */
export function generatePageElements(options: GenerateElementsOptions): CanvasElement[] {
  const { pageType, dataSnapshot, overrides = {}, themeId, settings } = options

  // 取得有效的主題 ID（優先使用 options.themeId，其次使用 settings.themeId）
  const effectiveThemeId = themeId || settings?.themeId

  let elements: CanvasElement[]

  // 如果有主題 ID，使用主題系統生成元素
  if (effectiveThemeId) {
    const theme = themeRegistry.getTheme(effectiveThemeId)
    if (theme) {
      const layoutGenerator = theme.layouts[pageType]
      if (layoutGenerator) {
        const effectiveSettings: BrochureSettings = settings || {
          pageSize: { width: A5_WIDTH, height: A5_HEIGHT },
          bleed: { top: 3, right: 3, bottom: 3, left: 3 },
          themeId: effectiveThemeId,
          theme: {
            primaryColor: theme.style.colors.primary,
            accentColor: theme.style.colors.accent,
            fontFamily: theme.style.fonts.primary,
          },
        }
        elements = layoutGenerator(dataSnapshot, theme.style, effectiveSettings)
      } else {
        elements = []
      }
    } else {
      // 主題不存在，fallback 到舊版
      elements = generateLegacyElements(pageType, dataSnapshot)
    }
  } else {
    // 沒有主題 ID，使用舊版硬編碼版面
    elements = generateLegacyElements(pageType, dataSnapshot)
  }

  // 套用 overrides
  if (Object.keys(overrides).length > 0) {
    elements = elements.map(el => {
      const override = overrides[el.name]
      if (!override) return el

      // 合併覆寫
      return {
        ...el,
        ...override,
        style: el.type === 'text' && override.style
          ? { ...(el as TextElement).style, ...override.style }
          : (el as TextElement).style,
      } as CanvasElement
    })
  }

  return elements
}

/**
 * @deprecated 使用舊版硬編碼版面生成元素。
 * 請改用主題系統（傳入 themeId 參數）。
 */
function generateLegacyElements(pageType: PageTemplateType, dataSnapshot: PageDataSnapshot): CanvasElement[] {
  switch (pageType) {
    case 'cover':
      return generateCoverElements(dataSnapshot.cover || {})

    case 'blank':
      return generateBlankElements()

    case 'contents':
      return generateContentsElements(dataSnapshot.cover || {})

    case 'overview-left':
      return generateOverviewLeftElements(dataSnapshot)

    case 'overview-right':
      return generateOverviewRightElements(dataSnapshot)

    case 'day-left':
      if (!dataSnapshot.day) return []
      return generateDayLeftElements(
        dataSnapshot.day,
        dataSnapshot.cover,
        dataSnapshot.meeting?.departureDate
      )

    case 'day-right':
      if (!dataSnapshot.day) return []
      return generateDayRightElements(dataSnapshot.day)

    case 'accommodation-left':
      return generateAccommodationLeftElements(dataSnapshot.accommodations || [])

    case 'accommodation-right':
      return generateAccommodationRightElements(dataSnapshot.accommodations || [])

    case 'custom':
    default:
      return []
  }
}

/**
 * 從 Itinerary 建立資料快照
 */
export function createDataSnapshotFromItinerary(
  itinerary: {
    title?: string
    country?: string
    city?: string
    tour_code?: string
    departure_date?: string
    cover_image?: string
    outbound_flight?: {
      airline?: string
      flightNumber?: string
      departureTime?: string
      departureAirport?: string
      arrivalTime?: string
      arrivalAirport?: string
    }
    return_flight?: {
      airline?: string
      flightNumber?: string
      departureTime?: string
      departureAirport?: string
      arrivalTime?: string
      arrivalAirport?: string
    }
    leader?: { name?: string; domesticPhone?: string }
    meeting_info?: { time?: string; location?: string }
    daily_itinerary?: Array<{
      title?: string
      highlight?: string
      activities?: Array<{ title: string; description?: string; image?: string }>
      images?: Array<string | { url: string }>
    }>
    hotels?: Array<{
      name: string
      image?: string
      address?: string
      phone?: string
      checkIn?: string
      checkOut?: string
      days?: number[]
    }>
  },
  pageType: PageTemplateType,
  dayIndex?: number
): PageDataSnapshot {
  const snapshot: PageDataSnapshot = {}

  // Cover data
  snapshot.cover = {
    country: itinerary.country,
    city: itinerary.city,
    travelDates: itinerary.departure_date,
    coverImage: itinerary.cover_image,
    airportCode: itinerary.tour_code?.substring(0, 3),
  }

  // Flight data
  if (itinerary.outbound_flight || itinerary.return_flight) {
    snapshot.flight = {
      outbound: itinerary.outbound_flight,
      return: itinerary.return_flight,
    }
  }

  // Meeting data
  snapshot.meeting = {
    leaderName: itinerary.leader?.name,
    leaderPhone: itinerary.leader?.domesticPhone,
    meetingTime: itinerary.meeting_info?.time,
    meetingLocation: itinerary.meeting_info?.location,
    departureDate: itinerary.departure_date,
  }

  // Day data
  if (dayIndex !== undefined && itinerary.daily_itinerary?.[dayIndex]) {
    const dayData = itinerary.daily_itinerary[dayIndex]
    snapshot.day = {
      dayIndex,
      title: dayData.title,
      highlight: dayData.highlight,
      activities: dayData.activities,
      images: dayData.images,
    }
  }

  // Daily overview
  if (pageType === 'overview-right' && itinerary.daily_itinerary) {
    snapshot.dailyOverview = itinerary.daily_itinerary.map((day, idx) => ({
      dayIndex: idx,
      title: day.title || `第 ${idx + 1} 天`,
      activities: day.activities?.map(a => a.title) || [],
    }))
  }

  // Accommodations
  if (itinerary.hotels) {
    snapshot.accommodations = itinerary.hotels
  }

  return snapshot
}
