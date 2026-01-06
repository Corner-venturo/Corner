/**
 * Classic Theme - 經典主題
 * 基於原有 generateElements 的設計風格
 *
 * 特色：
 * - 主色：Teal (#0d9488)
 * - 強調色：Orange (#f97316)
 * - 優雅的漸層效果
 * - 日式風格元素標題
 */

import type {
  ThemeDefinition,
  ThemeStyle,
  ThemeColors,
  ThemeFonts,
  ThemeSpacing,
  ThemeLayouts,
  LayoutGenerator,
} from './types'
import type {
  CanvasElement,
  TextElement,
  ImageElement,
  ShapeElement,
} from '../../canvas-editor/types'
import type { PageDataSnapshot, BrochureSettings } from '../types'

// ============================================================================
// 風格設定
// ============================================================================

const colors: ThemeColors = {
  primary: '#0d9488',        // teal-600
  primaryLight: '#14b8a6',   // teal-500
  primaryDark: '#0f766e',    // teal-700
  accent: '#f97316',         // orange-500
  accentLight: '#fb923c',    // orange-400
  background: '#ffffff',
  cardBackground: '#f8fafc', // slate-50
  textPrimary: '#1e293b',    // slate-800
  textSecondary: '#64748b',  // slate-500
  textLight: '#ffffff',
  border: '#e2e8f0',         // slate-200
  gradients: {
    header: { start: '#0d9488', end: '#0f766e', angle: 180 },
    accent: { start: '#f97316', end: '#ea580c', angle: 180 },
  },
}

const fonts: ThemeFonts = {
  primary: 'Noto Sans TC',
  heading: 'Noto Sans TC',
  scale: {
    h1: 30,
    h2: 24,
    h3: 18,
    body: 12,
    small: 10,
    xs: 8,
  },
}

const spacing: ThemeSpacing = {
  pagePadding: 24,
  sectionGap: 20,
  elementGap: 12,
  cardPadding: 16,
}

const style: ThemeStyle = { colors, fonts, spacing }

// ============================================================================
// ID 生成器
// ============================================================================

let idCounter = 0

const generateId = (prefix: string): string => {
  idCounter++
  return `${prefix}-${Date.now()}-${idCounter}-${Math.random().toString(36).substr(2, 5)}`
}

// ============================================================================
// 元素建構器 (使用主題風格)
// ============================================================================

function createTextElement(
  name: string,
  content: string,
  x: number,
  y: number,
  options: {
    fontSize?: number
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
    color?: string
    textAlign?: 'left' | 'center' | 'right'
    letterSpacing?: number
    lineHeight?: number
    width?: number
    height?: number
    zIndex?: number
  } = {}
): TextElement {
  const {
    fontSize = fonts.scale.body,
    fontWeight = 'normal',
    color = colors.textPrimary,
    textAlign = 'left',
    letterSpacing = 0,
    lineHeight = 1.2,
    width = 200,
    height = 20,
    zIndex = 0,
  } = options

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
      fontFamily: fonts.primary,
      fontSize,
      fontWeight,
      fontStyle: 'normal',
      textAlign,
      lineHeight,
      letterSpacing,
      color,
      textDecoration: 'none',
    },
  }
}

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
    filters: { brightness: 0, contrast: 0, saturation: 0, blur: 0 },
    objectFit: 'cover',
  }
}

function createShapeElement(
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
  const {
    fill = colors.cardBackground,
    stroke = 'transparent',
    strokeWidth = 0,
    cornerRadius = 0,
    zIndex = 0,
    opacity = 1,
  } = options

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
// 版面生成器
// ============================================================================

// A5 尺寸
const A5_WIDTH = 559
const A5_HEIGHT = 794

/**
 * 封面版面
 */
const generateCoverLayout: LayoutGenerator = (data, style, settings) => {
  const elements: CanvasElement[] = []
  let zIndex = 0
  const cover = data.cover || {}
  const padding = style.spacing.pagePadding

  // 背景圖片
  if (cover.coverImage) {
    elements.push(createImageElement('封面背景圖', cover.coverImage, 0, 0, A5_WIDTH, A5_HEIGHT, zIndex++))
  } else {
    elements.push(createShapeElement('封面背景', 0, 0, A5_WIDTH, A5_HEIGHT, { fill: '#1e293b', zIndex: zIndex++ }))
  }

  // 遮罩
  elements.push(createShapeElement('漸層遮罩', 0, 0, A5_WIDTH, A5_HEIGHT, { fill: 'rgba(0, 0, 0, 0.4)', zIndex: zIndex++ }))

  // 客戶名稱
  if (cover.clientName) {
    elements.push(createShapeElement('客戶名左線', padding, 28, 2, 12, { fill: style.colors.accent, zIndex: zIndex++ }))
    elements.push(createTextElement('客戶名稱', cover.clientName.toUpperCase(), padding + 8, 28, {
      fontSize: 9, fontWeight: '700', color: 'rgba(255, 255, 255, 0.9)', letterSpacing: 3, width: 300, height: 14, zIndex: zIndex++
    }))
  }

  // 中央標題
  const centerY = A5_HEIGHT / 2

  if (cover.country) {
    elements.push(createTextElement('國家', cover.country.toUpperCase(), 0, centerY - 50, {
      fontSize: 14, fontWeight: '300', color: style.colors.textLight, textAlign: 'center', letterSpacing: 10, width: A5_WIDTH, height: 20, zIndex: zIndex++
    }))
  }

  elements.push(createTextElement('城市', cover.city || 'CITY', 0, centerY - 25, {
    fontSize: style.fonts.scale.h1, fontWeight: '800', color: style.colors.textLight, textAlign: 'center', width: A5_WIDTH, height: 40, zIndex: zIndex++
  }))

  if (cover.travelDates) {
    const dateWidth = 180
    const dateX = (A5_WIDTH - dateWidth) / 2
    const dateY = centerY + 25

    elements.push(createShapeElement('日期背景', dateX, dateY, dateWidth, 28, {
      fill: 'rgba(255, 255, 255, 0.1)', stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 1, cornerRadius: 14, zIndex: zIndex++
    }))
    elements.push(createTextElement('旅遊日期', `✈  ${cover.travelDates}`, dateX, dateY + 7, {
      fontSize: style.fonts.scale.small, fontWeight: '500', color: style.colors.textLight, textAlign: 'center', width: dateWidth, height: 16, zIndex: zIndex++
    }))
  }

  // 底部
  const bottomY = A5_HEIGHT - padding - 50
  elements.push(createShapeElement('分隔線', padding + 20, bottomY, A5_WIDTH - padding * 2 - 40, 1, {
    fill: 'rgba(255, 255, 255, 0.5)', zIndex: zIndex++
  }))

  elements.push(createImageElement('公司Logo', '/corner-logo.png', padding, bottomY + 16, 60, 16, zIndex++))

  elements.push(createTextElement('聯絡標籤', 'Emergency Contact', A5_WIDTH - padding - 120, bottomY + 10, {
    fontSize: 7, color: 'rgba(139, 134, 128, 0.9)', textAlign: 'right', width: 120, height: 10, zIndex: zIndex++
  }))

  if (cover.emergencyContact) {
    elements.push(createTextElement('緊急電話', cover.emergencyContact, A5_WIDTH - padding - 120, bottomY + 22, {
      fontSize: style.fonts.scale.small, fontWeight: '600', color: style.colors.textLight, textAlign: 'right', width: 120, height: 14, zIndex: zIndex++
    }))
  }

  if (cover.emergencyEmail) {
    elements.push(createTextElement('緊急信箱', cover.emergencyEmail, A5_WIDTH - padding - 120, bottomY + 38, {
      fontSize: style.fonts.scale.xs, color: 'rgba(139, 134, 128, 0.9)', textAlign: 'right', width: 120, height: 12, zIndex: zIndex++
    }))
  }

  return elements
}

/**
 * 空白頁版面
 */
const generateBlankLayout: LayoutGenerator = (data, style, settings) => {
  return [
    createShapeElement('空白頁背景', 0, 0, A5_WIDTH, A5_HEIGHT, { fill: style.colors.background, zIndex: 0 }),
    createTextElement('空白頁提示', '空白頁（封面背面）', A5_WIDTH / 2 - 60, A5_HEIGHT / 2 - 10, {
      fontSize: style.fonts.scale.body, color: '#cccccc', textAlign: 'center', width: 120, height: 20, zIndex: 1
    }),
  ]
}

/**
 * 目錄版面
 */
const generateContentsLayout: LayoutGenerator = (data, style, settings) => {
  const elements: CanvasElement[] = []
  let zIndex = 0
  const cover = data.cover || {}

  // 背景
  elements.push(createShapeElement('白色背景', 0, 0, A5_WIDTH, A5_HEIGHT, { fill: style.colors.background, zIndex: zIndex++ }))
  elements.push(createShapeElement('頂部裝飾條', 0, 0, A5_WIDTH, 6, { fill: '#22d3ee', zIndex: zIndex++ }))
  elements.push(createShapeElement('右上角裝飾', A5_WIDTH - 72, 0, 48, 64, { fill: 'rgba(34, 211, 238, 0.1)', cornerRadius: 24, zIndex: zIndex++ }))

  // Header
  elements.push(createShapeElement('Guidebook背景', 16, 16, 58, 16, { fill: '#22d3ee', cornerRadius: 3, zIndex: zIndex++ }))
  elements.push(createTextElement('Guidebook', 'Guidebook', 20, 18, { fontSize: 9, fontWeight: '700', color: style.colors.textLight, width: 50, height: 14, zIndex: zIndex++ }))
  elements.push(createTextElement('VOL', 'VOL. 01', 80, 18, { fontSize: 9, fontWeight: '500', color: style.colors.textSecondary, letterSpacing: 2, width: 50, height: 14, zIndex: zIndex++ }))
  elements.push(createTextElement('CONTENTS', 'CONTENTS', 16, 36, { fontSize: style.fonts.scale.h2, fontWeight: '800', color: style.colors.textPrimary, width: 180, height: 32, zIndex: zIndex++ }))

  const tripTitle = `${cover.country || ''} ${cover.city || ''} Trip`.trim() || 'Trip'
  elements.push(createTextElement('行程標題', tripTitle.toUpperCase(), 16, 70, { fontSize: style.fonts.scale.small, fontWeight: '500', color: '#06b6d4', letterSpacing: 2, width: 300, height: 16, zIndex: zIndex++ }))
  elements.push(createTextElement('目録', '目 録', A5_WIDTH - 40, 20, { fontSize: style.fonts.scale.h3, fontWeight: '700', color: style.colors.border, width: 20, height: 60, zIndex: zIndex++ }))
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

    elements.push(createShapeElement(`卡片${chapter.number}背景`, x, y, cardWidth, cardHeight, { fill: style.colors.background, stroke: '#f1f5f9', strokeWidth: 1, cornerRadius: 8, zIndex: zIndex++ }))
    elements.push(createTextElement(`章節${chapter.number}`, chapter.number, x + 10, y + 8, { fontSize: style.fonts.scale.h2, fontWeight: '900', color: '#f1f5f9', width: 40, height: 30, zIndex: zIndex++ }))
    elements.push(createShapeElement(`圖標${chapter.number}背景`, x + cardWidth - 36, y + 8, 28, 28, { fill: '#f8fafc', cornerRadius: 14, zIndex: zIndex++ }))
    elements.push(createTextElement(`標題${chapter.number}`, chapter.title, x + 10, y + cardHeight - 55, { fontSize: 14, fontWeight: '700', color: style.colors.textPrimary, width: cardWidth - 20, height: 20, zIndex: zIndex++ }))
    elements.push(createTextElement(`中文${chapter.number}`, chapter.titleCn, x + 10, y + cardHeight - 35, { fontSize: style.fonts.scale.small, fontWeight: '500', color: style.colors.textSecondary, letterSpacing: 1, width: cardWidth - 20, height: 16, zIndex: zIndex++ }))
    elements.push(createShapeElement(`虛線${chapter.number}`, x + 10, y + cardHeight - 22, cardWidth - 20, 1, { fill: style.colors.border, zIndex: zIndex++ }))
    elements.push(createTextElement(`頁碼${chapter.number}`, `P. ${String(chapter.page).padStart(2, '0')}`, x + cardWidth - 50, y + cardHeight - 18, { fontSize: style.fonts.scale.small, fontWeight: '700', color: style.colors.textSecondary, textAlign: 'right', width: 40, height: 14, zIndex: zIndex++ }))
  })

  // Footer
  const footerY = A5_HEIGHT - footerHeight
  elements.push(createShapeElement('機場代碼背景', 16, footerY + 8, 32, 32, { fill: '#f1f5f9', stroke: style.colors.border, strokeWidth: 1, cornerRadius: 16, zIndex: zIndex++ }))
  elements.push(createTextElement('機場代碼', cover.airportCode || '---', 16, footerY + 18, { fontSize: 9, fontWeight: '700', color: style.colors.textSecondary, textAlign: 'center', width: 32, height: 14, zIndex: zIndex++ }))
  elements.push(createTextElement('城市國家', `${cover.city || ''}, ${cover.country || ''}`, 56, footerY + 18, { fontSize: style.fonts.scale.body, fontWeight: '500', color: style.colors.textSecondary, width: 200, height: 16, zIndex: zIndex++ }))
  elements.push(createTextElement('Bon Voyage', 'Bon Voyage', A5_WIDTH - 100, footerY + 10, { fontSize: style.fonts.scale.body, fontWeight: '700', color: '#06b6d4', textAlign: 'right', letterSpacing: 2, width: 84, height: 16, zIndex: zIndex++ }))
  elements.push(createTextElement('頁碼', 'Page 02', A5_WIDTH - 70, footerY + 28, { fontSize: style.fonts.scale.small, fontWeight: '500', color: style.colors.textSecondary, textAlign: 'right', width: 54, height: 14, zIndex: zIndex++ }))

  return elements
}

/**
 * 總攬左頁版面
 */
const generateOverviewLeftLayout: LayoutGenerator = (data, style, settings) => {
  const elements: CanvasElement[] = []
  let zIndex = 0
  const cover = data.cover || {}
  const flight = data.flight || {}
  const meeting = data.meeting || {}
  const sectionPadding = style.spacing.pagePadding

  const topHeight = Math.floor(A5_HEIGHT * 0.5)

  // 上方裝飾區
  elements.push(createShapeElement('上方背景', 0, 0, A5_WIDTH, topHeight, { fill: style.colors.primary, zIndex: zIndex++ }))

  if (cover.overviewImage) {
    elements.push(createImageElement('總攬背景圖', cover.overviewImage, 0, 0, A5_WIDTH, topHeight, zIndex++))
    elements.push(createShapeElement('漸層遮罩', 0, 0, A5_WIDTH, topHeight, { fill: 'rgba(13, 148, 136, 0.5)', zIndex: zIndex++ }))
  }

  // 標題框
  const titleBoxWidth = 80
  const titleBoxHeight = 120
  const titleBoxX = (A5_WIDTH - titleBoxWidth) / 2
  const titleBoxY = (topHeight - titleBoxHeight) / 2

  elements.push(createShapeElement('標題框', titleBoxX, titleBoxY, titleBoxWidth, titleBoxHeight, {
    fill: 'rgba(255, 255, 255, 0.1)', stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 1, cornerRadius: 4, zIndex: zIndex++
  }))
  elements.push(createTextElement('日文標題', cover.city || 'Journey', titleBoxX, titleBoxY + 20, {
    fontSize: style.fonts.scale.h3, fontWeight: '700', color: style.colors.textLight, textAlign: 'center', letterSpacing: 3, width: titleBoxWidth, height: 60, zIndex: zIndex++
  }))
  elements.push(createTextElement('Travel Guide', 'Travel Guide', titleBoxX, titleBoxY + 85, {
    fontSize: style.fonts.scale.xs, fontWeight: '500', color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center', letterSpacing: 2, width: titleBoxWidth, height: 12, zIndex: zIndex++
  }))

  // 下方資訊區
  elements.push(createShapeElement('下方背景', 0, topHeight, A5_WIDTH, A5_HEIGHT - topHeight, { fill: style.colors.cardBackground, zIndex: zIndex++ }))

  let currentY = topHeight + 16

  // 航班資訊
  elements.push(createTextElement('航班標題', '航班資訊．フライト情報', sectionPadding + 20, currentY, {
    fontSize: style.fonts.scale.small, fontWeight: '500', color: style.colors.textSecondary, width: 200, height: 14, zIndex: zIndex++
  }))

  currentY += 20

  // 去程
  if (flight.outbound) {
    elements.push(createShapeElement('去程線', sectionPadding + 22, currentY, 2, 40, { fill: `${style.colors.accent}80`, zIndex: zIndex++ }))
    elements.push(createTextElement('去程標籤', '去程', sectionPadding + 30, currentY, {
      fontSize: style.fonts.scale.xs, fontWeight: '700', color: style.colors.accent, width: 30, height: 12, zIndex: zIndex++
    }))
    elements.push(createTextElement('去程航班', `${flight.outbound.airline || ''} ${flight.outbound.flightNumber || ''}`, sectionPadding + 100, currentY, {
      fontSize: style.fonts.scale.xs, color: style.colors.textSecondary, width: 150, height: 12, zIndex: zIndex++
    }))
    elements.push(createTextElement('去程時間', `${flight.outbound.departureTime || ''} ${flight.outbound.departureAirport || ''} → ${flight.outbound.arrivalTime || ''} ${flight.outbound.arrivalAirport || ''}`, sectionPadding + 30, currentY + 14, {
      fontSize: style.fonts.scale.small, fontWeight: '600', color: style.colors.textPrimary, width: 300, height: 14, zIndex: zIndex++
    }))
  }

  currentY += 45

  // 回程
  if (flight.return) {
    elements.push(createShapeElement('回程線', sectionPadding + 22, currentY, 2, 40, { fill: `${style.colors.primary}80`, zIndex: zIndex++ }))
    elements.push(createTextElement('回程標籤', '回程', sectionPadding + 30, currentY, {
      fontSize: style.fonts.scale.xs, fontWeight: '700', color: style.colors.primary, width: 30, height: 12, zIndex: zIndex++
    }))
    elements.push(createTextElement('回程航班', `${flight.return.airline || ''} ${flight.return.flightNumber || ''}`, sectionPadding + 100, currentY, {
      fontSize: style.fonts.scale.xs, color: style.colors.textSecondary, width: 150, height: 12, zIndex: zIndex++
    }))
    elements.push(createTextElement('回程時間', `${flight.return.departureTime || ''} ${flight.return.departureAirport || ''} → ${flight.return.arrivalTime || ''} ${flight.return.arrivalAirport || ''}`, sectionPadding + 30, currentY + 14, {
      fontSize: style.fonts.scale.small, fontWeight: '600', color: style.colors.textPrimary, width: 300, height: 14, zIndex: zIndex++
    }))
  }

  currentY += 55

  // 集合資訊
  elements.push(createTextElement('集合標題', '集合資訊．集合のご案内', sectionPadding + 20, currentY, {
    fontSize: style.fonts.scale.small, fontWeight: '500', color: style.colors.textSecondary, width: 200, height: 14, zIndex: zIndex++
  }))
  currentY += 20

  elements.push(createShapeElement('集合框', sectionPadding + 20, currentY, A5_WIDTH - sectionPadding * 2 - 40, 60, {
    fill: style.colors.background, stroke: style.colors.border, strokeWidth: 1, cornerRadius: 4, zIndex: zIndex++
  }))
  elements.push(createTextElement('集合時間', meeting.meetingTime || meeting.departureDate || '', sectionPadding + 30, currentY + 12, {
    fontSize: style.fonts.scale.small, fontWeight: '600', color: style.colors.textPrimary, width: 200, height: 14, zIndex: zIndex++
  }))
  elements.push(createTextElement('集合地點', meeting.meetingLocation || '桃園機場第二航廈 團體櫃檯前', sectionPadding + 30, currentY + 32, {
    fontSize: style.fonts.scale.small, color: '#475569', width: A5_WIDTH - 100, height: 20, zIndex: zIndex++
  }))

  currentY += 75

  // 領隊資訊
  elements.push(createTextElement('領隊標題', '領隊．添乗員', sectionPadding + 20, currentY, {
    fontSize: style.fonts.scale.small, fontWeight: '500', color: style.colors.textSecondary, width: 150, height: 14, zIndex: zIndex++
  }))
  currentY += 20

  elements.push(createShapeElement('領隊框', sectionPadding + 20, currentY, A5_WIDTH - sectionPadding * 2 - 40, 40, {
    fill: `${style.colors.primary}0D`, stroke: `${style.colors.primary}1A`, strokeWidth: 1, cornerRadius: 4, zIndex: zIndex++
  }))
  elements.push(createTextElement('領隊名稱', meeting.leaderName || '領隊', sectionPadding + 50, currentY + 12, {
    fontSize: style.fonts.scale.body, fontWeight: '700', color: style.colors.textPrimary, width: 150, height: 16, zIndex: zIndex++
  }))
  elements.push(createTextElement('領隊電話', meeting.leaderPhone || cover.emergencyContact || '', A5_WIDTH - sectionPadding - 150, currentY + 12, {
    fontSize: style.fonts.scale.small, color: style.colors.textSecondary, textAlign: 'right', width: 130, height: 14, zIndex: zIndex++
  }))

  // 頁碼
  elements.push(createTextElement('頁碼', '04', sectionPadding, A5_HEIGHT - 20, {
    fontSize: 9, color: style.colors.textSecondary, width: 20, height: 12, zIndex: zIndex++
  }))

  return elements
}

/**
 * 總攬右頁版面
 */
const generateOverviewRightLayout: LayoutGenerator = (data, style, settings) => {
  const elements: CanvasElement[] = []
  let zIndex = 0
  const dailyOverview = data.dailyOverview || []
  const meeting = data.meeting || {}

  // 背景
  elements.push(createShapeElement('總攬右背景', 0, 0, A5_WIDTH, A5_HEIGHT, { fill: style.colors.background, zIndex: zIndex++ }))

  // 標題
  elements.push(createTextElement('行程總攬', '行程總攬', 24, 24, {
    fontSize: 20, fontWeight: '700', color: style.colors.textPrimary, letterSpacing: 4, width: 150, height: 28, zIndex: zIndex++
  }))
  elements.push(createTextElement('英文副標', 'Itinerary Overview', 24, 52, {
    fontSize: 9, color: style.colors.primary, letterSpacing: 3, width: 150, height: 14, zIndex: zIndex++
  }))
  elements.push(createShapeElement('標題底線', 24, 72, A5_WIDTH - 48, 2, { fill: `${style.colors.primary}1A`, zIndex: zIndex++ }))

  // 時間軸
  elements.push(createShapeElement('時間軸線', 40, 90, 1, A5_HEIGHT - 140, { fill: style.colors.border, zIndex: zIndex++ }))

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

    elements.push(createShapeElement(`Day${index + 1}背景`, 24, yPos + 4, 32, 40, { fill: style.colors.background, zIndex: zIndex++ }))
    elements.push(createTextElement(`DAY標籤${index + 1}`, 'DAY', 24, yPos + 4, {
      fontSize: 7, fontWeight: '700', color: style.colors.textSecondary, textAlign: 'center', letterSpacing: 2, width: 32, height: 10, zIndex: zIndex++
    }))
    elements.push(createTextElement(`Day數字${index + 1}`, String(index + 1).padStart(2, '0'), 24, yPos + 16, {
      fontSize: 16, fontWeight: '700', color: style.colors.primary, textAlign: 'center', width: 32, height: 22, zIndex: zIndex++
    }))
    elements.push(createTextElement(`日期${index + 1}`, formatDate(meeting.departureDate || '', index), 60, yPos + 6, {
      fontSize: style.fonts.scale.xs, color: style.colors.textSecondary, width: 100, height: 12, zIndex: zIndex++
    }))
    elements.push(createTextElement(`標題${index + 1}`, day.title || `第 ${index + 1} 天`, 60, yPos + 20, {
      fontSize: 14, fontWeight: '700', color: style.colors.textPrimary, width: A5_WIDTH - 90, height: 18, zIndex: zIndex++
    }))

    if (day.activities && day.activities.length > 0) {
      const tags = day.activities.slice(0, 3).join(' · ')
      elements.push(createTextElement(`活動${index + 1}`, tags, 60, yPos + 42, {
        fontSize: 9, color: style.colors.textSecondary, width: A5_WIDTH - 90, height: 14, zIndex: zIndex++
      }))
    }

    if (index < totalDays - 1) {
      elements.push(createShapeElement(`分隔線${index + 1}`, 60, yPos + dayHeight - 8, A5_WIDTH - 90, 1, { fill: style.colors.border, zIndex: zIndex++ }))
    }
  })

  // 裝飾 & 頁碼
  elements.push(createShapeElement('底部裝飾', A5_WIDTH - 80, A5_HEIGHT - 80, 80, 80, { fill: `${style.colors.primary}0D`, cornerRadius: 80, zIndex: zIndex++ }))
  elements.push(createTextElement('頁碼', '05', A5_WIDTH - 40, A5_HEIGHT - 20, {
    fontSize: 9, color: style.colors.textSecondary, textAlign: 'right', width: 20, height: 12, zIndex: zIndex++
  }))

  return elements
}

/**
 * 每日行程左頁版面 (簡化版)
 */
const generateDayLeftLayout: LayoutGenerator = (data, style, settings) => {
  const elements: CanvasElement[] = []
  let zIndex = 0
  const day = data.day
  if (!day) return elements

  const cover = data.cover || {}
  const meeting = data.meeting || {}
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

  // 上方區域
  elements.push(createShapeElement('上方背景', 0, 0, A5_WIDTH, topHeight, { fill: style.colors.cardBackground, zIndex: zIndex++ }))
  elements.push(createShapeElement('標題底線', 0, topHeight, A5_WIDTH, 1, { fill: style.colors.border, zIndex: zIndex++ }))
  elements.push(createShapeElement('裝飾圓', A5_WIDTH - 100, -50, 160, 160, { fill: `${style.colors.primary}1A`, cornerRadius: 80, opacity: 0.3, zIndex: zIndex++ }))

  const tripName = `${cover.country || ''} ${cover.city || ''}`.trim() || 'Japan Travel'
  elements.push(createTextElement('行程名稱', tripName, 24, 24, {
    fontSize: style.fonts.scale.small, fontWeight: '700', color: style.colors.accent, letterSpacing: 4, width: 200, height: 14, zIndex: zIndex++
  }))
  elements.push(createTextElement('日期', formatDate(meeting.departureDate || '', day.dayIndex), 24, 42, {
    fontSize: 9, color: style.colors.textSecondary, letterSpacing: 2, width: 200, height: 12, zIndex: zIndex++
  }))
  elements.push(createTextElement('日文數字', kanjiNumber, A5_WIDTH - 70, 20, {
    fontSize: 36, fontWeight: '700', color: `${style.colors.primary}26`, width: 50, height: 45, zIndex: zIndex++
  }))

  // Day 大標題
  elements.push(createTextElement('Day標題', 'Day', 24, topHeight - 140, {
    fontSize: 72, fontWeight: '900', color: style.colors.primary, width: 150, height: 70, zIndex: zIndex++
  }))
  elements.push(createTextElement('Day數字', String(dayNumber).padStart(2, '0'), 24, topHeight - 70, {
    fontSize: 72, fontWeight: '900', color: style.colors.primary, width: 150, height: 70, zIndex: zIndex++
  }))
  elements.push(createShapeElement('標題線', 32, topHeight - 50, 1, 40, { fill: '#cbd5e1', zIndex: zIndex++ }))
  elements.push(createTextElement('標題', day.title || `第 ${dayNumber} 天`, 40, topHeight - 45, {
    fontSize: style.fonts.scale.h3, fontWeight: '700', color: style.colors.textPrimary, width: A5_WIDTH - 80, height: 24, zIndex: zIndex++
  }))

  if (day.highlight) {
    elements.push(createTextElement('Highlight', day.highlight, 40, topHeight - 20, {
      fontSize: 11, fontWeight: '500', color: style.colors.textSecondary, letterSpacing: 2, width: A5_WIDTH - 80, height: 16, zIndex: zIndex++
    }))
  }

  // 下方區域
  const useImageMode = activities.length < 2
  const dayImage = day.images?.[0] ? (typeof day.images[0] === 'string' ? day.images[0] : day.images[0].url) : undefined

  if (useImageMode && dayImage) {
    elements.push(createImageElement('每日背景圖', dayImage, 0, topHeight, A5_WIDTH, A5_HEIGHT - topHeight, zIndex++))
    elements.push(createShapeElement('底部遮罩', 0, A5_HEIGHT - 80, A5_WIDTH, 80, { fill: 'rgba(0, 0, 0, 0.3)', zIndex: zIndex++ }))
    elements.push(createTextElement('移動日標題', activities[0]?.title || '移動日', 24, A5_HEIGHT - 50, {
      fontSize: 14, fontWeight: '500', color: style.colors.textLight, width: A5_WIDTH - 48, height: 20, zIndex: zIndex++
    }))
  } else if (useImageMode) {
    elements.push(createShapeElement('空白背景', 0, topHeight, A5_WIDTH, A5_HEIGHT - topHeight, { fill: style.colors.cardBackground, zIndex: zIndex++ }))
    elements.push(createTextElement('移動日', '移動日', (A5_WIDTH - 100) / 2, topHeight + (A5_HEIGHT - topHeight) / 2 - 20, {
      fontSize: 14, color: '#cbd5e1', textAlign: 'center', width: 100, height: 20, zIndex: zIndex++
    }))
  } else {
    // 時間軸模式
    elements.push(createShapeElement('時間軸背景', 0, topHeight, A5_WIDTH, A5_HEIGHT - topHeight, { fill: style.colors.background, zIndex: zIndex++ }))
    const dotColors = [style.colors.primary, style.colors.accent, style.colors.primaryDark, '#475569']
    let activityY = topHeight + 20

    activities.slice(0, 5).forEach((activity, index) => {
      const isLast = index === Math.min(activities.length - 1, 4)
      const dotColor = dotColors[index % dotColors.length]

      elements.push(createShapeElement(`圓點${index + 1}`, 30, activityY + 4, 10, 10, { fill: dotColor, cornerRadius: 5, zIndex: zIndex++ }))

      if (!isLast) {
        elements.push(createShapeElement(`連接線${index + 1}`, 35, activityY + 18, 1, 60, { fill: style.colors.border, zIndex: zIndex++ }))
      }

      elements.push(createTextElement(`活動標題${index + 1}`, activity.title, 52, activityY, {
        fontSize: 14, fontWeight: '700', color: style.colors.textPrimary, width: A5_WIDTH - 80, height: 18, zIndex: zIndex++
      }))

      if (activity.description) {
        elements.push(createShapeElement(`描述背景${index + 1}`, 52, activityY + 22, A5_WIDTH - 80, 30, {
          fill: 'rgba(248, 250, 252, 0.8)', stroke: '#f1f5f9', strokeWidth: 1, cornerRadius: 4, zIndex: zIndex++
        }))
        elements.push(createTextElement(`活動描述${index + 1}`, activity.description, 56, activityY + 28, {
          fontSize: 9, color: style.colors.textSecondary, width: A5_WIDTH - 90, height: 20, zIndex: zIndex++
        }))
      }

      activityY += 75
    })
  }

  // 頁碼
  const pageNumber = dayNumber * 2 + 4
  elements.push(createTextElement('頁碼', `P.${String(pageNumber).padStart(2, '0')}`, 20, A5_HEIGHT - 24, {
    fontSize: 9, color: useImageMode && dayImage ? 'rgba(255,255,255,0.7)' : `${style.colors.textSecondary}80`, width: 40, height: 12, zIndex: zIndex++
  }))

  return elements
}

/**
 * 每日行程右頁版面 (簡化版)
 */
const generateDayRightLayout: LayoutGenerator = (data, style, settings) => {
  const elements: CanvasElement[] = []
  let zIndex = 0
  const day = data.day
  if (!day) return elements

  const activities = day.activities || []
  const dayNumber = day.dayIndex + 1
  const padding = style.spacing.pagePadding

  // 背景
  elements.push(createShapeElement('每日右背景', 0, 0, A5_WIDTH, A5_HEIGHT, { fill: style.colors.background, zIndex: zIndex++ }))

  // 標題
  elements.push(createTextElement('景點介紹', '景點介紹', padding, 24, {
    fontSize: style.fonts.scale.h3, fontWeight: '700', color: style.colors.textPrimary, letterSpacing: 4, width: 120, height: 24, zIndex: zIndex++
  }))
  elements.push(createTextElement('英文副標', 'Highlights', 150, 28, {
    fontSize: 11, color: style.colors.textSecondary, width: 80, height: 16, zIndex: zIndex++
  }))
  elements.push(createShapeElement('標題底線', padding, 56, A5_WIDTH - padding * 2, 1, { fill: style.colors.border, zIndex: zIndex++ }))

  const cardStartY = 70
  const getActivityImage = (activity: typeof activities[0], index: number) => {
    if (activity.image) return activity.image
    if (day.images && day.images[index]) {
      const img = day.images[index]
      return typeof img === 'string' ? img : img.url
    }
    return null
  }

  // 簡化版：只顯示 2 個活動
  const displayActivities = activities.slice(0, 2)
  const cardHeight = (A5_HEIGHT - cardStartY - 100) / Math.max(displayActivities.length, 1)

  displayActivities.forEach((activity, index) => {
    const y = cardStartY + index * (cardHeight + 12)
    const image = getActivityImage(activity, index)

    elements.push(createShapeElement(`卡片背景${index + 1}`, padding, y, A5_WIDTH - padding * 2, cardHeight, {
      fill: style.colors.background, stroke: '#f1f5f9', strokeWidth: 1, cornerRadius: 8, zIndex: zIndex++
    }))

    const imageHeight = cardHeight * 0.6
    if (image) {
      elements.push(createImageElement(`活動圖${index + 1}`, image, padding, y, A5_WIDTH - padding * 2, imageHeight, zIndex++))
    } else {
      elements.push(createShapeElement(`圖片佔位${index + 1}`, padding, y, A5_WIDTH - padding * 2, imageHeight, {
        fill: style.colors.cardBackground, cornerRadius: 8, zIndex: zIndex++
      }))
    }

    elements.push(createTextElement(`活動標題${index + 1}`, activity.title, padding + 12, y + imageHeight + 12, {
      fontSize: 14, fontWeight: '700', color: style.colors.textPrimary, width: A5_WIDTH - padding * 2 - 24, height: 18, zIndex: zIndex++
    }))

    if (activity.description) {
      elements.push(createTextElement(`活動描述${index + 1}`, activity.description, padding + 12, y + imageHeight + 34, {
        fontSize: style.fonts.scale.small, color: style.colors.textSecondary, width: A5_WIDTH - padding * 2 - 24, height: 40, zIndex: zIndex++
      }))
    }
  })

  // 底部
  elements.push(createShapeElement('底部線', padding, A5_HEIGHT - 60, A5_WIDTH - padding * 2, 1, { fill: style.colors.border, zIndex: zIndex++ }))
  elements.push(createTextElement('底部備註', '行程內容可能依當地情況調整，敬請見諒', (A5_WIDTH - 280) / 2, A5_HEIGHT - 45, {
    fontSize: 9, color: style.colors.textSecondary, textAlign: 'center', width: 280, height: 14, zIndex: zIndex++
  }))

  const pageNumber = dayNumber * 2 + 5
  elements.push(createTextElement('頁碼', `${String(dayNumber).padStart(2, '0')}-${String(pageNumber).padStart(2, '0')} / SPOTS`, A5_WIDTH - padding - 100, A5_HEIGHT - 24, {
    fontSize: 9, color: `${style.colors.textSecondary}80`, textAlign: 'right', width: 100, height: 12, zIndex: zIndex++
  }))

  return elements
}

/**
 * 住宿左頁版面
 */
const generateAccommodationLeftLayout: LayoutGenerator = (data, style, settings) => {
  const elements: CanvasElement[] = []
  let zIndex = 0
  const accommodations = (data.accommodations || []).slice(0, 3)
  const padding = style.spacing.pagePadding

  // 背景
  elements.push(createShapeElement('住宿左背景', 0, 0, A5_WIDTH, A5_HEIGHT, { fill: style.colors.background, zIndex: zIndex++ }))

  // 標題
  elements.push(createShapeElement('標題裝飾線', padding, 28, 8, 1, { fill: style.colors.accent, zIndex: zIndex++ }))
  elements.push(createTextElement('英文標籤', 'Accommodation', padding + 14, 24, {
    fontSize: 9, fontWeight: '700', color: style.colors.accent, letterSpacing: 4, width: 120, height: 14, zIndex: zIndex++
  }))
  elements.push(createTextElement('日文標題', '宿泊施設', padding, 44, {
    fontSize: style.fonts.scale.h2, fontWeight: '700', color: style.colors.textPrimary, letterSpacing: 4, width: 150, height: 32, zIndex: zIndex++
  }))
  elements.push(createTextElement('副標題', '嚴選住宿介紹', padding, 80, {
    fontSize: style.fonts.scale.small, color: style.colors.textSecondary, width: 100, height: 14, zIndex: zIndex++
  }))

  // 住宿卡片
  const cardStartY = 110
  const availableHeight = A5_HEIGHT - cardStartY - 40
  const gap = 16
  const cardHeight = (availableHeight - gap * (accommodations.length - 1)) / Math.max(accommodations.length, 1)

  accommodations.forEach((hotel, index) => {
    const y = cardStartY + index * (cardHeight + gap)

    elements.push(createShapeElement(`卡片背景${index + 1}`, padding, y, A5_WIDTH - padding * 2, cardHeight, {
      fill: style.colors.cardBackground, cornerRadius: 8, zIndex: zIndex++
    }))

    if (hotel.image) {
      elements.push(createImageElement(`住宿圖${index + 1}`, hotel.image, padding, y, A5_WIDTH - padding * 2, cardHeight, zIndex++))
    }

    elements.push(createShapeElement(`漸層遮罩${index + 1}`, padding, y + cardHeight - 70, A5_WIDTH - padding * 2, 70, {
      fill: 'rgba(0, 0, 0, 0.4)', zIndex: zIndex++
    }))
    elements.push(createTextElement(`編號${index + 1}`, String(index + 1).padStart(2, '0'), padding + 16, y + cardHeight - 55, {
      fontSize: style.fonts.scale.body, color: 'rgba(255, 255, 255, 0.8)', width: 30, height: 16, zIndex: zIndex++
    }))
    elements.push(createTextElement(`住宿名稱${index + 1}`, hotel.name, padding + 16, y + cardHeight - 35, {
      fontSize: style.fonts.scale.h3, fontWeight: '700', color: style.colors.textLight, width: A5_WIDTH - padding * 2 - 100, height: 24, zIndex: zIndex++
    }))

    if (hotel.days && hotel.days.length > 0) {
      const daysText = hotel.days.length === 1 ? `Day ${hotel.days[0]}` : `Day ${hotel.days[0]}-${hotel.days[hotel.days.length - 1]}`
      elements.push(createShapeElement(`天數背景${index + 1}`, A5_WIDTH - padding - 80, y + cardHeight - 40, 64, 24, {
        fill: 'rgba(255, 255, 255, 0.2)', cornerRadius: 4, zIndex: zIndex++
      }))
      elements.push(createTextElement(`天數${index + 1}`, daysText, A5_WIDTH - padding - 76, y + cardHeight - 35, {
        fontSize: style.fonts.scale.small, color: style.colors.textLight, textAlign: 'center', width: 56, height: 14, zIndex: zIndex++
      }))
    }
  })

  elements.push(createTextElement('頁碼', '16', 20, A5_HEIGHT - 20, {
    fontSize: 9, color: style.colors.textSecondary, width: 20, height: 12, zIndex: zIndex++
  }))

  return elements
}

/**
 * 住宿右頁版面
 */
const generateAccommodationRightLayout: LayoutGenerator = (data, style, settings) => {
  const elements: CanvasElement[] = []
  let zIndex = 0
  const accommodations = (data.accommodations || []).slice(0, 3)
  const padding = style.spacing.pagePadding

  // 背景
  elements.push(createShapeElement('住宿右背景', 0, 0, A5_WIDTH, A5_HEIGHT, { fill: style.colors.background, zIndex: zIndex++ }))
  elements.push(createShapeElement('右上裝飾', A5_WIDTH - 200, -50, 200, 200, { fill: `${style.colors.accent}0D`, cornerRadius: 100, zIndex: zIndex++ }))

  // 標題
  elements.push(createShapeElement('標題裝飾線', padding, 28, 8, 1, { fill: style.colors.accent, zIndex: zIndex++ }))
  elements.push(createTextElement('英文標籤', 'Accommodation Guide', padding + 14, 24, {
    fontSize: 9, fontWeight: '700', color: style.colors.accent, letterSpacing: 3, width: 150, height: 14, zIndex: zIndex++
  }))
  elements.push(createTextElement('日文標題', '住宿資訊', padding, 44, {
    fontSize: 20, fontWeight: '700', color: style.colors.textPrimary, letterSpacing: 4, width: 120, height: 28, zIndex: zIndex++
  }))
  elements.push(createTextElement('裝飾文字', '厳選宿泊', A5_WIDTH - 140, 36, {
    fontSize: style.fonts.scale.h1, fontWeight: '700', color: `${style.colors.textPrimary}0D`, width: 120, height: 40, zIndex: zIndex++
  }))

  // 住宿資訊卡片
  const cardStartY = 90
  const availableHeight = A5_HEIGHT - cardStartY - 40
  const gap = 16
  const cardHeight = (availableHeight - gap * (accommodations.length - 1)) / Math.max(accommodations.length, 1)

  const colorSchemes = [
    { text: style.colors.primary, bg: `${style.colors.primary}0D`, border: `${style.colors.primary}33` },
    { text: style.colors.accent, bg: `${style.colors.accent}0D`, border: `${style.colors.accent}33` },
    { text: style.colors.primaryDark, bg: `${style.colors.primaryDark}0D`, border: `${style.colors.primaryDark}33` },
  ]

  accommodations.forEach((hotel, index) => {
    const y = cardStartY + index * (cardHeight + gap)
    const color = colorSchemes[index % colorSchemes.length]

    elements.push(createShapeElement(`左邊線${index + 1}`, padding, y, 2, cardHeight - 10, { fill: color.border, zIndex: zIndex++ }))
    elements.push(createShapeElement(`編號背景${index + 1}`, padding + 12, y + 8, 26, 16, {
      fill: 'transparent', stroke: color.border, strokeWidth: 1, cornerRadius: 4, zIndex: zIndex++
    }))
    elements.push(createTextElement(`編號${index + 1}`, String(index + 1).padStart(2, '0'), padding + 12, y + 10, {
      fontSize: 9, color: color.text, textAlign: 'center', letterSpacing: 2, width: 26, height: 12, zIndex: zIndex++
    }))
    elements.push(createTextElement(`住宿名稱${index + 1}`, hotel.name, padding + 44, y + 8, {
      fontSize: 16, fontWeight: '700', color: style.colors.textPrimary, width: A5_WIDTH - padding * 2 - 150, height: 20, zIndex: zIndex++
    }))

    if (hotel.days && hotel.days.length > 0) {
      const daysText = hotel.days.length === 1 ? `Day ${hotel.days[0]}` : `Day ${hotel.days[0]}-${hotel.days[hotel.days.length - 1]}`
      const nightsText = `(${hotel.days.length}晚)`
      elements.push(createShapeElement(`天數背景${index + 1}`, A5_WIDTH - padding - 90, y + 6, 74, 20, {
        fill: color.bg, cornerRadius: 4, zIndex: zIndex++
      }))
      elements.push(createTextElement(`天數${index + 1}`, `${daysText} ${nightsText}`, A5_WIDTH - padding - 88, y + 10, {
        fontSize: 9, color: color.text, width: 70, height: 12, zIndex: zIndex++
      }))
    }

    elements.push(createShapeElement(`分隔線${index + 1}`, padding + 12, y + 34, A5_WIDTH - padding * 2 - 12, 1, {
      fill: `${style.colors.border}66`, zIndex: zIndex++
    }))

    let infoY = y + 45

    if (hotel.address) {
      elements.push(createTextElement(`地址標籤${index + 1}`, '📍', padding + 12, infoY, {
        fontSize: style.fonts.scale.body, color: style.colors.textSecondary, width: 18, height: 16, zIndex: zIndex++
      }))
      elements.push(createTextElement(`地址${index + 1}`, hotel.address, padding + 32, infoY, {
        fontSize: style.fonts.scale.small, color: style.colors.textPrimary, width: A5_WIDTH - padding * 2 - 44, height: 32, zIndex: zIndex++
      }))
      infoY += 35
    }

    if (hotel.phone) {
      elements.push(createTextElement(`電話標籤${index + 1}`, '📞', padding + 12, infoY, {
        fontSize: style.fonts.scale.body, color: style.colors.textSecondary, width: 18, height: 16, zIndex: zIndex++
      }))
      elements.push(createTextElement(`電話${index + 1}`, hotel.phone, padding + 32, infoY, {
        fontSize: style.fonts.scale.small, color: style.colors.textPrimary, letterSpacing: 1, width: 150, height: 14, zIndex: zIndex++
      }))
      infoY += 20
    }

    elements.push(createTextElement(`時間標籤${index + 1}`, '🕐', padding + 12, infoY, {
      fontSize: style.fonts.scale.body, color: style.colors.textSecondary, width: 18, height: 16, zIndex: zIndex++
    }))
    elements.push(createTextElement(`時間${index + 1}`, `IN ${hotel.checkIn || '15:00'} / OUT ${hotel.checkOut || '11:00'}`, padding + 32, infoY, {
      fontSize: style.fonts.scale.small, color: style.colors.textPrimary, width: 200, height: 14, zIndex: zIndex++
    }))
  })

  elements.push(createTextElement('頁碼', '17', A5_WIDTH - 40, A5_HEIGHT - 20, {
    fontSize: 9, color: `${style.colors.textSecondary}4D`, textAlign: 'right', letterSpacing: 2, width: 20, height: 12, zIndex: zIndex++
  }))

  return elements
}

/**
 * 自訂頁面版面（空）
 */
const generateCustomLayout: LayoutGenerator = () => []

// ============================================================================
// 版面集合
// ============================================================================

const layouts: ThemeLayouts = {
  'cover': generateCoverLayout,
  'blank': generateBlankLayout,
  'contents': generateContentsLayout,
  'overview-left': generateOverviewLeftLayout,
  'overview-right': generateOverviewRightLayout,
  'day-left': generateDayLeftLayout,
  'day-right': generateDayRightLayout,
  'accommodation-left': generateAccommodationLeftLayout,
  'accommodation-right': generateAccommodationRightLayout,
  'custom': generateCustomLayout,
}

// ============================================================================
// 主題定義
// ============================================================================

export const classicTheme: ThemeDefinition = {
  id: 'classic',
  name: '經典',
  description: '優雅的 Teal + Orange 配色，日式風格標題設計',
  previewImage: '/themes/classic-preview.png',
  tags: ['優雅', '日式', '商務'],
  version: '1.0.0',
  style,
  layouts,
}

export default classicTheme
