/**
 * Modern Theme - 現代主題
 * 簡潔、幾何、現代感設計
 *
 * 特色：
 * - 主色：Deep Blue (#1e3a5f)
 * - 強調色：Hot Pink (#ec4899)
 * - 簡潔的幾何設計
 * - 大量留白與現代排版
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
  primary: '#1e3a5f',        // deep blue
  primaryLight: '#2d4a6f',   // lighter blue
  primaryDark: '#0f2847',    // darker blue
  accent: '#ec4899',         // hot pink
  accentLight: '#f472b6',    // lighter pink
  background: '#ffffff',
  cardBackground: '#f9fafb', // gray-50
  textPrimary: '#111827',    // gray-900
  textSecondary: '#6b7280',  // gray-500
  textLight: '#ffffff',
  border: '#e5e7eb',         // gray-200
  gradients: {
    header: { start: '#1e3a5f', end: '#0f2847', angle: 135 },
    accent: { start: '#ec4899', end: '#db2777', angle: 135 },
  },
}

const fonts: ThemeFonts = {
  primary: 'Noto Sans TC',
  heading: 'Noto Sans TC',
  scale: {
    h1: 36,
    h2: 28,
    h3: 20,
    body: 12,
    small: 10,
    xs: 8,
  },
}

const spacing: ThemeSpacing = {
  pagePadding: 32,
  sectionGap: 24,
  elementGap: 16,
  cardPadding: 20,
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
    lineHeight = 1.4,
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
 * 封面版面 - 現代簡潔風格
 */
const generateCoverLayout: LayoutGenerator = (data, style, settings) => {
  const elements: CanvasElement[] = []
  let zIndex = 0
  const cover = data.cover || {}
  const padding = style.spacing.pagePadding

  // 背景
  if (cover.coverImage) {
    elements.push(createImageElement('封面背景圖', cover.coverImage, 0, 0, A5_WIDTH, A5_HEIGHT, zIndex++))
    // 深色遮罩
    elements.push(createShapeElement('漸層遮罩', 0, 0, A5_WIDTH, A5_HEIGHT, { fill: 'rgba(30, 58, 95, 0.7)', zIndex: zIndex++ }))
  } else {
    elements.push(createShapeElement('封面背景', 0, 0, A5_WIDTH, A5_HEIGHT, { fill: style.colors.primary, zIndex: zIndex++ }))
  }

  // 幾何裝飾 - 右上角圓形
  elements.push(createShapeElement('裝飾圓1', A5_WIDTH - 150, -80, 250, 250, {
    fill: `${style.colors.accent}20`, cornerRadius: 125, zIndex: zIndex++
  }))
  elements.push(createShapeElement('裝飾圓2', A5_WIDTH - 100, -50, 180, 180, {
    fill: `${style.colors.accent}30`, cornerRadius: 90, zIndex: zIndex++
  }))

  // 左上角 - 品牌區域
  elements.push(createShapeElement('品牌線', padding, padding, 40, 3, { fill: style.colors.accent, zIndex: zIndex++ }))

  if (cover.clientName) {
    elements.push(createTextElement('客戶名稱', cover.clientName.toUpperCase(), padding, padding + 16, {
      fontSize: 10, fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', letterSpacing: 4, width: 300, height: 16, zIndex: zIndex++
    }))
  }

  // 中央內容區
  const centerY = A5_HEIGHT / 2 - 40

  if (cover.country) {
    elements.push(createTextElement('國家', cover.country.toUpperCase(), padding, centerY - 60, {
      fontSize: 11, fontWeight: '500', color: style.colors.accent, letterSpacing: 8, width: A5_WIDTH - padding * 2, height: 16, zIndex: zIndex++
    }))
  }

  elements.push(createTextElement('城市', cover.city || 'DESTINATION', padding, centerY - 30, {
    fontSize: style.fonts.scale.h1, fontWeight: '800', color: style.colors.textLight, letterSpacing: 2, width: A5_WIDTH - padding * 2, height: 50, zIndex: zIndex++
  }))

  elements.push(createShapeElement('標題底線', padding, centerY + 30, 60, 3, { fill: style.colors.textLight, zIndex: zIndex++ }))

  if (cover.travelDates) {
    elements.push(createTextElement('旅遊日期', cover.travelDates, padding, centerY + 50, {
      fontSize: style.fonts.scale.body, fontWeight: '400', color: 'rgba(255, 255, 255, 0.8)', letterSpacing: 1, width: 200, height: 18, zIndex: zIndex++
    }))
  }

  // 底部
  const bottomY = A5_HEIGHT - padding - 60

  elements.push(createShapeElement('底部線', padding, bottomY, A5_WIDTH - padding * 2, 1, {
    fill: 'rgba(255, 255, 255, 0.3)', zIndex: zIndex++
  }))

  elements.push(createImageElement('公司Logo', '/corner-logo.png', padding, bottomY + 20, 80, 24, zIndex++))

  if (cover.emergencyContact) {
    elements.push(createTextElement('緊急聯絡', `Emergency: ${cover.emergencyContact}`, A5_WIDTH - padding - 180, bottomY + 24, {
      fontSize: style.fonts.scale.small, color: 'rgba(255, 255, 255, 0.7)', textAlign: 'right', width: 180, height: 14, zIndex: zIndex++
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
    createTextElement('空白頁提示', '— Notes —', (A5_WIDTH - 100) / 2, A5_HEIGHT / 2 - 10, {
      fontSize: style.fonts.scale.body, color: '#d1d5db', textAlign: 'center', width: 100, height: 20, zIndex: 1
    }),
  ]
}

/**
 * 目錄版面 - 現代網格風格
 */
const generateContentsLayout: LayoutGenerator = (data, style, settings) => {
  const elements: CanvasElement[] = []
  let zIndex = 0
  const cover = data.cover || {}
  const padding = style.spacing.pagePadding

  // 背景
  elements.push(createShapeElement('白色背景', 0, 0, A5_WIDTH, A5_HEIGHT, { fill: style.colors.background, zIndex: zIndex++ }))

  // 左側裝飾條
  elements.push(createShapeElement('左側裝飾', 0, 0, 8, A5_HEIGHT, { fill: style.colors.primary, zIndex: zIndex++ }))

  // Header
  elements.push(createTextElement('CONTENTS', 'CONTENTS', padding + 16, padding, {
    fontSize: style.fonts.scale.h1, fontWeight: '800', color: style.colors.textPrimary, letterSpacing: 4, width: 300, height: 45, zIndex: zIndex++
  }))

  const tripTitle = `${cover.country || ''} ${cover.city || ''}`.trim() || 'Travel Guide'
  elements.push(createTextElement('行程標題', tripTitle.toUpperCase(), padding + 16, padding + 50, {
    fontSize: style.fonts.scale.small, fontWeight: '500', color: style.colors.accent, letterSpacing: 3, width: 300, height: 16, zIndex: zIndex++
  }))

  elements.push(createShapeElement('Header底線', padding + 16, padding + 80, A5_WIDTH - padding * 2 - 16, 2, {
    fill: style.colors.border, zIndex: zIndex++
  }))

  // 章節列表 - 簡潔線條風格
  const chapters = [
    { number: '01', title: 'Overview', titleCn: '行程總覽', page: 4 },
    { number: '02', title: 'Daily Plan', titleCn: '每日行程', page: 6 },
    { number: '03', title: 'Accommodation', titleCn: '住宿資訊', page: 12 },
    { number: '04', title: 'Information', titleCn: '旅遊須知', page: 14 },
  ]

  const startY = padding + 110
  const itemHeight = 100

  chapters.forEach((chapter, index) => {
    const y = startY + index * itemHeight

    // 編號
    elements.push(createTextElement(`編號${chapter.number}`, chapter.number, padding + 16, y, {
      fontSize: 48, fontWeight: '800', color: `${style.colors.primary}15`, width: 80, height: 60, zIndex: zIndex++
    }))

    // 標題
    elements.push(createTextElement(`標題${chapter.number}`, chapter.title, padding + 90, y + 10, {
      fontSize: style.fonts.scale.h3, fontWeight: '700', color: style.colors.textPrimary, width: 200, height: 28, zIndex: zIndex++
    }))

    elements.push(createTextElement(`中文${chapter.number}`, chapter.titleCn, padding + 90, y + 40, {
      fontSize: style.fonts.scale.body, color: style.colors.textSecondary, width: 150, height: 16, zIndex: zIndex++
    }))

    // 頁碼
    elements.push(createTextElement(`頁碼${chapter.number}`, `— ${String(chapter.page).padStart(2, '0')}`, A5_WIDTH - padding - 60, y + 20, {
      fontSize: style.fonts.scale.body, fontWeight: '600', color: style.colors.textSecondary, textAlign: 'right', width: 60, height: 16, zIndex: zIndex++
    }))

    // 分隔線
    if (index < chapters.length - 1) {
      elements.push(createShapeElement(`分隔線${chapter.number}`, padding + 16, y + itemHeight - 20, A5_WIDTH - padding * 2 - 16, 1, {
        fill: style.colors.border, zIndex: zIndex++
      }))
    }
  })

  // 底部裝飾
  elements.push(createShapeElement('底部裝飾', A5_WIDTH - 120, A5_HEIGHT - 120, 100, 100, {
    fill: `${style.colors.accent}10`, cornerRadius: 50, zIndex: zIndex++
  }))

  elements.push(createTextElement('頁碼', '02', padding + 16, A5_HEIGHT - padding - 10, {
    fontSize: 9, color: style.colors.textSecondary, width: 20, height: 12, zIndex: zIndex++
  }))

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
  const padding = style.spacing.pagePadding

  // 頂部區域 - 使用主色
  const topHeight = Math.floor(A5_HEIGHT * 0.4)

  elements.push(createShapeElement('頂部背景', 0, 0, A5_WIDTH, topHeight, { fill: style.colors.primary, zIndex: zIndex++ }))

  if (cover.overviewImage) {
    elements.push(createImageElement('總攬背景圖', cover.overviewImage, 0, 0, A5_WIDTH, topHeight, zIndex++))
    elements.push(createShapeElement('漸層遮罩', 0, 0, A5_WIDTH, topHeight, { fill: 'rgba(30, 58, 95, 0.6)', zIndex: zIndex++ }))
  }

  // 標題區
  elements.push(createTextElement('OVERVIEW', 'OVERVIEW', padding, padding, {
    fontSize: style.fonts.scale.h2, fontWeight: '800', color: style.colors.textLight, letterSpacing: 4, width: 200, height: 36, zIndex: zIndex++
  }))
  elements.push(createShapeElement('標題線', padding, padding + 40, 40, 3, { fill: style.colors.accent, zIndex: zIndex++ }))

  // 目的地
  elements.push(createTextElement('目的地', cover.city || 'Destination', padding, topHeight - 60, {
    fontSize: 48, fontWeight: '800', color: style.colors.textLight, width: A5_WIDTH - padding * 2, height: 60, zIndex: zIndex++
  }))

  // 下半部白色區域
  elements.push(createShapeElement('下半背景', 0, topHeight, A5_WIDTH, A5_HEIGHT - topHeight, { fill: style.colors.background, zIndex: zIndex++ }))

  let currentY = topHeight + padding

  // 航班資訊
  elements.push(createTextElement('航班資訊', 'FLIGHT INFO', padding, currentY, {
    fontSize: 9, fontWeight: '700', color: style.colors.accent, letterSpacing: 3, width: 100, height: 12, zIndex: zIndex++
  }))

  currentY += 24

  // 去程
  if (flight.outbound) {
    elements.push(createShapeElement('去程指示', padding, currentY + 2, 3, 40, { fill: style.colors.accent, zIndex: zIndex++ }))
    elements.push(createTextElement('去程標籤', 'OUTBOUND', padding + 12, currentY, {
      fontSize: style.fonts.scale.xs, fontWeight: '600', color: style.colors.textSecondary, letterSpacing: 1, width: 80, height: 12, zIndex: zIndex++
    }))
    elements.push(createTextElement('去程航班', `${flight.outbound.airline || ''} ${flight.outbound.flightNumber || ''}`, padding + 12, currentY + 14, {
      fontSize: style.fonts.scale.body, fontWeight: '600', color: style.colors.textPrimary, width: 200, height: 16, zIndex: zIndex++
    }))
    elements.push(createTextElement('去程時間', `${flight.outbound.departureTime || ''} → ${flight.outbound.arrivalTime || ''}`, padding + 12, currentY + 30, {
      fontSize: style.fonts.scale.small, color: style.colors.textSecondary, width: 200, height: 14, zIndex: zIndex++
    }))
  }

  currentY += 55

  // 回程
  if (flight.return) {
    elements.push(createShapeElement('回程指示', padding, currentY + 2, 3, 40, { fill: style.colors.primary, zIndex: zIndex++ }))
    elements.push(createTextElement('回程標籤', 'RETURN', padding + 12, currentY, {
      fontSize: style.fonts.scale.xs, fontWeight: '600', color: style.colors.textSecondary, letterSpacing: 1, width: 80, height: 12, zIndex: zIndex++
    }))
    elements.push(createTextElement('回程航班', `${flight.return.airline || ''} ${flight.return.flightNumber || ''}`, padding + 12, currentY + 14, {
      fontSize: style.fonts.scale.body, fontWeight: '600', color: style.colors.textPrimary, width: 200, height: 16, zIndex: zIndex++
    }))
    elements.push(createTextElement('回程時間', `${flight.return.departureTime || ''} → ${flight.return.arrivalTime || ''}`, padding + 12, currentY + 30, {
      fontSize: style.fonts.scale.small, color: style.colors.textSecondary, width: 200, height: 14, zIndex: zIndex++
    }))
  }

  currentY += 70

  // 集合資訊
  elements.push(createTextElement('集合資訊', 'MEETING POINT', padding, currentY, {
    fontSize: 9, fontWeight: '700', color: style.colors.accent, letterSpacing: 3, width: 120, height: 12, zIndex: zIndex++
  }))

  currentY += 24

  elements.push(createShapeElement('集合框', padding, currentY, A5_WIDTH - padding * 2, 70, {
    fill: style.colors.cardBackground, stroke: style.colors.border, strokeWidth: 1, cornerRadius: 8, zIndex: zIndex++
  }))

  elements.push(createTextElement('集合時間', meeting.meetingTime || meeting.departureDate || '請確認行程', padding + 16, currentY + 16, {
    fontSize: style.fonts.scale.body, fontWeight: '600', color: style.colors.textPrimary, width: A5_WIDTH - padding * 2 - 32, height: 16, zIndex: zIndex++
  }))

  elements.push(createTextElement('集合地點', meeting.meetingLocation || '集合地點待確認', padding + 16, currentY + 38, {
    fontSize: style.fonts.scale.small, color: style.colors.textSecondary, width: A5_WIDTH - padding * 2 - 32, height: 20, zIndex: zIndex++
  }))

  // 頁碼
  elements.push(createTextElement('頁碼', '04', padding, A5_HEIGHT - padding, {
    fontSize: 9, color: style.colors.textSecondary, width: 20, height: 12, zIndex: zIndex++
  }))

  return elements
}

/**
 * 總攬右頁版面 - 每日時間軸
 */
const generateOverviewRightLayout: LayoutGenerator = (data, style, settings) => {
  const elements: CanvasElement[] = []
  let zIndex = 0
  const dailyOverview = data.dailyOverview || []
  const meeting = data.meeting || {}
  const padding = style.spacing.pagePadding

  // 背景
  elements.push(createShapeElement('總攬右背景', 0, 0, A5_WIDTH, A5_HEIGHT, { fill: style.colors.background, zIndex: zIndex++ }))

  // 標題
  elements.push(createTextElement('行程總覽', 'ITINERARY', padding, padding, {
    fontSize: style.fonts.scale.h2, fontWeight: '800', color: style.colors.textPrimary, letterSpacing: 4, width: 200, height: 36, zIndex: zIndex++
  }))

  elements.push(createTextElement('副標題', 'Day by Day Overview', padding, padding + 40, {
    fontSize: style.fonts.scale.small, color: style.colors.textSecondary, width: 200, height: 16, zIndex: zIndex++
  }))

  elements.push(createShapeElement('標題底線', padding, padding + 64, A5_WIDTH - padding * 2, 2, {
    fill: style.colors.border, zIndex: zIndex++
  }))

  // 時間軸
  const startY = padding + 90
  const timelineX = padding + 40

  elements.push(createShapeElement('時間軸線', timelineX, startY, 2, A5_HEIGHT - startY - 60, {
    fill: style.colors.border, zIndex: zIndex++
  }))

  // 每日行程
  const formatDate = (dateStr: string, dayIndex: number) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      date.setDate(date.getDate() + dayIndex)
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${month}.${day} ${weekdays[date.getDay()]}`
    } catch {
      return ''
    }
  }

  const totalDays = Math.min(dailyOverview.length, 6)
  const availableHeight = A5_HEIGHT - startY - 60
  const dayHeight = availableHeight / Math.max(totalDays, 1)

  dailyOverview.slice(0, 6).forEach((day, index) => {
    const y = startY + index * dayHeight
    const dotColor = index % 2 === 0 ? style.colors.accent : style.colors.primary

    // 時間軸圓點
    elements.push(createShapeElement(`圓點${index + 1}`, timelineX - 5, y + 8, 12, 12, {
      fill: dotColor, cornerRadius: 6, zIndex: zIndex++
    }))

    // Day 編號
    elements.push(createTextElement(`Day編號${index + 1}`, `DAY ${String(index + 1).padStart(2, '0')}`, padding, y, {
      fontSize: style.fonts.scale.xs, fontWeight: '700', color: style.colors.textSecondary, letterSpacing: 2, width: 60, height: 12, zIndex: zIndex++
    }))

    // 日期
    elements.push(createTextElement(`日期${index + 1}`, formatDate(meeting.departureDate || '', index), timelineX + 20, y, {
      fontSize: style.fonts.scale.xs, color: style.colors.textSecondary, width: 100, height: 12, zIndex: zIndex++
    }))

    // 標題
    elements.push(createTextElement(`標題${index + 1}`, day.title || `第 ${index + 1} 天`, timelineX + 20, y + 16, {
      fontSize: 16, fontWeight: '700', color: style.colors.textPrimary, width: A5_WIDTH - timelineX - padding - 20, height: 22, zIndex: zIndex++
    }))

    // 活動
    if (day.activities && day.activities.length > 0) {
      const tags = day.activities.slice(0, 3).join(' · ')
      elements.push(createTextElement(`活動${index + 1}`, tags, timelineX + 20, y + 42, {
        fontSize: 9, color: style.colors.textSecondary, width: A5_WIDTH - timelineX - padding - 20, height: 14, zIndex: zIndex++
      }))
    }
  })

  // 頁碼
  elements.push(createTextElement('頁碼', '05', A5_WIDTH - padding - 20, A5_HEIGHT - padding, {
    fontSize: 9, color: style.colors.textSecondary, textAlign: 'right', width: 20, height: 12, zIndex: zIndex++
  }))

  return elements
}

/**
 * 每日行程左頁版面
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
  const padding = style.spacing.pagePadding

  // 頂部色塊
  const topHeight = Math.floor(A5_HEIGHT * 0.35)

  elements.push(createShapeElement('頂部背景', 0, 0, A5_WIDTH, topHeight, { fill: style.colors.primary, zIndex: zIndex++ }))

  // 日期格式化
  const formatDate = (dateStr: string, index: number) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      date.setDate(date.getDate() + index)
      const weekdays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
      return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')} · ${weekdays[date.getDay()]}`
    } catch {
      return ''
    }
  }

  // 頂部內容
  elements.push(createTextElement('Day標籤', 'DAY', padding, padding, {
    fontSize: 12, fontWeight: '600', color: style.colors.accent, letterSpacing: 4, width: 50, height: 16, zIndex: zIndex++
  }))

  elements.push(createTextElement('Day數字', String(dayNumber).padStart(2, '0'), padding, padding + 20, {
    fontSize: 72, fontWeight: '900', color: style.colors.textLight, width: 120, height: 80, zIndex: zIndex++
  }))

  elements.push(createTextElement('日期', formatDate(meeting.departureDate || '', day.dayIndex), padding, padding + 100, {
    fontSize: style.fonts.scale.xs, fontWeight: '500', color: 'rgba(255, 255, 255, 0.7)', letterSpacing: 2, width: 200, height: 12, zIndex: zIndex++
  }))

  // 裝飾
  elements.push(createShapeElement('裝飾圓', A5_WIDTH - 80, topHeight - 100, 150, 150, {
    fill: `${style.colors.accent}20`, cornerRadius: 75, zIndex: zIndex++
  }))

  // 主標題區
  elements.push(createShapeElement('標題背景', 0, topHeight, A5_WIDTH, 80, { fill: style.colors.cardBackground, zIndex: zIndex++ }))

  elements.push(createTextElement('標題', day.title || `第 ${dayNumber} 天`, padding, topHeight + 20, {
    fontSize: style.fonts.scale.h2, fontWeight: '700', color: style.colors.textPrimary, width: A5_WIDTH - padding * 2, height: 36, zIndex: zIndex++
  }))

  if (day.highlight) {
    elements.push(createTextElement('Highlight', day.highlight, padding, topHeight + 55, {
      fontSize: style.fonts.scale.small, color: style.colors.textSecondary, width: A5_WIDTH - padding * 2, height: 16, zIndex: zIndex++
    }))
  }

  // 內容區
  const contentY = topHeight + 90
  elements.push(createShapeElement('內容背景', 0, contentY, A5_WIDTH, A5_HEIGHT - contentY, { fill: style.colors.background, zIndex: zIndex++ }))

  // 活動時間軸
  const dayImage = day.images?.[0] ? (typeof day.images[0] === 'string' ? day.images[0] : day.images[0].url) : undefined

  if (activities.length < 2 && dayImage) {
    // 圖片模式
    elements.push(createImageElement('每日圖片', dayImage, padding, contentY + 16, A5_WIDTH - padding * 2, A5_HEIGHT - contentY - 60, zIndex++))
  } else {
    // 時間軸模式
    let activityY = contentY + 20

    activities.slice(0, 5).forEach((activity, index) => {
      const dotColors = [style.colors.accent, style.colors.primary, style.colors.primaryLight]
      const dotColor = dotColors[index % dotColors.length]

      elements.push(createShapeElement(`圓點${index + 1}`, padding + 8, activityY + 4, 8, 8, {
        fill: dotColor, cornerRadius: 4, zIndex: zIndex++
      }))

      if (index < activities.length - 1 && index < 4) {
        elements.push(createShapeElement(`連接線${index + 1}`, padding + 11, activityY + 16, 2, 55, {
          fill: style.colors.border, zIndex: zIndex++
        }))
      }

      elements.push(createTextElement(`活動標題${index + 1}`, activity.title, padding + 28, activityY, {
        fontSize: 14, fontWeight: '600', color: style.colors.textPrimary, width: A5_WIDTH - padding - 50, height: 18, zIndex: zIndex++
      }))

      if (activity.description) {
        elements.push(createTextElement(`活動描述${index + 1}`, activity.description, padding + 28, activityY + 22, {
          fontSize: style.fonts.scale.small, color: style.colors.textSecondary, width: A5_WIDTH - padding - 50, height: 35, zIndex: zIndex++
        }))
      }

      activityY += 70
    })
  }

  // 頁碼
  const pageNumber = dayNumber * 2 + 4
  elements.push(createTextElement('頁碼', String(pageNumber).padStart(2, '0'), padding, A5_HEIGHT - padding, {
    fontSize: 9, color: style.colors.textSecondary, width: 20, height: 12, zIndex: zIndex++
  }))

  return elements
}

/**
 * 每日行程右頁版面
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
  elements.push(createTextElement('景點標題', 'HIGHLIGHTS', padding, padding, {
    fontSize: 9, fontWeight: '700', color: style.colors.accent, letterSpacing: 4, width: 100, height: 12, zIndex: zIndex++
  }))

  elements.push(createTextElement('景點介紹', '景點介紹', padding, padding + 16, {
    fontSize: style.fonts.scale.h3, fontWeight: '700', color: style.colors.textPrimary, width: 150, height: 28, zIndex: zIndex++
  }))

  elements.push(createShapeElement('標題底線', padding, padding + 52, A5_WIDTH - padding * 2, 2, {
    fill: style.colors.border, zIndex: zIndex++
  }))

  // 活動卡片
  const cardStartY = padding + 70
  const getActivityImage = (activity: typeof activities[0], index: number) => {
    if (activity.image) return activity.image
    if (day.images && day.images[index]) {
      const img = day.images[index]
      return typeof img === 'string' ? img : img.url
    }
    return null
  }

  const displayActivities = activities.slice(0, 2)
  const availableHeight = A5_HEIGHT - cardStartY - 60
  const cardHeight = (availableHeight - 20) / Math.max(displayActivities.length, 1)

  displayActivities.forEach((activity, index) => {
    const y = cardStartY + index * (cardHeight + 20)
    const image = getActivityImage(activity, index)

    // 卡片背景
    elements.push(createShapeElement(`卡片背景${index + 1}`, padding, y, A5_WIDTH - padding * 2, cardHeight, {
      fill: style.colors.cardBackground, cornerRadius: 12, zIndex: zIndex++
    }))

    // 圖片
    const imageHeight = cardHeight * 0.55
    if (image) {
      elements.push(createImageElement(`活動圖${index + 1}`, image, padding, y, A5_WIDTH - padding * 2, imageHeight, zIndex++))
    } else {
      elements.push(createShapeElement(`圖片佔位${index + 1}`, padding, y, A5_WIDTH - padding * 2, imageHeight, {
        fill: `${style.colors.primary}10`, cornerRadius: 12, zIndex: zIndex++
      }))
    }

    // 編號
    elements.push(createShapeElement(`編號背景${index + 1}`, padding + 12, y + 12, 28, 28, {
      fill: style.colors.accent, cornerRadius: 14, zIndex: zIndex++
    }))
    elements.push(createTextElement(`編號${index + 1}`, String(index + 1).padStart(2, '0'), padding + 12, y + 18, {
      fontSize: style.fonts.scale.small, fontWeight: '700', color: style.colors.textLight, textAlign: 'center', width: 28, height: 16, zIndex: zIndex++
    }))

    // 標題
    elements.push(createTextElement(`活動標題${index + 1}`, activity.title, padding + 16, y + imageHeight + 16, {
      fontSize: 16, fontWeight: '700', color: style.colors.textPrimary, width: A5_WIDTH - padding * 2 - 32, height: 22, zIndex: zIndex++
    }))

    // 描述
    if (activity.description) {
      elements.push(createTextElement(`活動描述${index + 1}`, activity.description, padding + 16, y + imageHeight + 42, {
        fontSize: style.fonts.scale.small, color: style.colors.textSecondary, lineHeight: 1.5, width: A5_WIDTH - padding * 2 - 32, height: 40, zIndex: zIndex++
      }))
    }
  })

  // 頁碼
  const pageNumber = dayNumber * 2 + 5
  elements.push(createTextElement('頁碼', String(pageNumber).padStart(2, '0'), A5_WIDTH - padding - 20, A5_HEIGHT - padding, {
    fontSize: 9, color: style.colors.textSecondary, textAlign: 'right', width: 20, height: 12, zIndex: zIndex++
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

  // 頂部裝飾
  elements.push(createShapeElement('頂部色塊', 0, 0, A5_WIDTH, 100, { fill: style.colors.primary, zIndex: zIndex++ }))

  // 標題
  elements.push(createTextElement('STAY', 'STAY', padding, padding, {
    fontSize: style.fonts.scale.h1, fontWeight: '900', color: style.colors.textLight, letterSpacing: 6, width: 150, height: 45, zIndex: zIndex++
  }))

  elements.push(createTextElement('副標題', '住宿資訊', padding, padding + 50, {
    fontSize: style.fonts.scale.body, color: 'rgba(255, 255, 255, 0.8)', width: 100, height: 16, zIndex: zIndex++
  }))

  // 住宿卡片
  const cardStartY = 120
  const availableHeight = A5_HEIGHT - cardStartY - 40
  const gap = 16
  const cardHeight = (availableHeight - gap * (accommodations.length - 1)) / Math.max(accommodations.length, 1)

  accommodations.forEach((hotel, index) => {
    const y = cardStartY + index * (cardHeight + gap)

    // 卡片背景
    elements.push(createShapeElement(`卡片背景${index + 1}`, padding, y, A5_WIDTH - padding * 2, cardHeight, {
      fill: style.colors.cardBackground, cornerRadius: 12, zIndex: zIndex++
    }))

    // 圖片
    if (hotel.image) {
      elements.push(createImageElement(`住宿圖${index + 1}`, hotel.image, padding, y, A5_WIDTH - padding * 2, cardHeight, zIndex++))

      // 遮罩
      elements.push(createShapeElement(`遮罩${index + 1}`, padding, y + cardHeight - 80, A5_WIDTH - padding * 2, 80, {
        fill: 'rgba(0, 0, 0, 0.5)', zIndex: zIndex++
      }))
    }

    // 編號
    elements.push(createShapeElement(`編號背景${index + 1}`, padding + 12, y + 12, 32, 32, {
      fill: style.colors.accent, cornerRadius: 16, zIndex: zIndex++
    }))
    elements.push(createTextElement(`編號${index + 1}`, String(index + 1).padStart(2, '0'), padding + 12, y + 20, {
      fontSize: style.fonts.scale.body, fontWeight: '700', color: style.colors.textLight, textAlign: 'center', width: 32, height: 16, zIndex: zIndex++
    }))

    // 住宿名稱
    elements.push(createTextElement(`住宿名稱${index + 1}`, hotel.name, padding + 16, y + cardHeight - 60, {
      fontSize: style.fonts.scale.h3, fontWeight: '700', color: hotel.image ? style.colors.textLight : style.colors.textPrimary, width: A5_WIDTH - padding * 2 - 100, height: 28, zIndex: zIndex++
    }))

    // 天數
    if (hotel.days && hotel.days.length > 0) {
      const daysText = hotel.days.length === 1 ? `Day ${hotel.days[0]}` : `Day ${hotel.days[0]}-${hotel.days[hotel.days.length - 1]}`
      elements.push(createShapeElement(`天數背景${index + 1}`, A5_WIDTH - padding - 80, y + cardHeight - 50, 64, 24, {
        fill: 'rgba(255, 255, 255, 0.2)', cornerRadius: 12, zIndex: zIndex++
      }))
      elements.push(createTextElement(`天數${index + 1}`, daysText, A5_WIDTH - padding - 78, y + cardHeight - 45, {
        fontSize: style.fonts.scale.small, color: style.colors.textLight, textAlign: 'center', width: 60, height: 14, zIndex: zIndex++
      }))
    }
  })

  // 頁碼
  elements.push(createTextElement('頁碼', '16', padding, A5_HEIGHT - padding, {
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

  // 裝飾
  elements.push(createShapeElement('裝飾圓', A5_WIDTH - 100, -50, 180, 180, {
    fill: `${style.colors.accent}10`, cornerRadius: 90, zIndex: zIndex++
  }))

  // 標題
  elements.push(createTextElement('DETAILS', 'ACCOMMODATION', padding, padding, {
    fontSize: 9, fontWeight: '700', color: style.colors.accent, letterSpacing: 4, width: 150, height: 12, zIndex: zIndex++
  }))

  elements.push(createTextElement('住宿詳情', '住宿詳情', padding, padding + 16, {
    fontSize: style.fonts.scale.h3, fontWeight: '700', color: style.colors.textPrimary, width: 150, height: 28, zIndex: zIndex++
  }))

  elements.push(createShapeElement('標題底線', padding, padding + 52, A5_WIDTH - padding * 2, 2, {
    fill: style.colors.border, zIndex: zIndex++
  }))

  // 住宿資訊卡片
  const cardStartY = padding + 70
  const availableHeight = A5_HEIGHT - cardStartY - 40
  const gap = 20
  const cardHeight = (availableHeight - gap * (accommodations.length - 1)) / Math.max(accommodations.length, 1)

  accommodations.forEach((hotel, index) => {
    const y = cardStartY + index * (cardHeight + gap)
    const accentColor = index % 2 === 0 ? style.colors.accent : style.colors.primary

    // 左側指示線
    elements.push(createShapeElement(`左側線${index + 1}`, padding, y, 3, cardHeight - 10, {
      fill: accentColor, zIndex: zIndex++
    }))

    // 編號
    elements.push(createShapeElement(`編號背景${index + 1}`, padding + 16, y + 4, 28, 20, {
      fill: `${accentColor}15`, cornerRadius: 4, zIndex: zIndex++
    }))
    elements.push(createTextElement(`編號${index + 1}`, String(index + 1).padStart(2, '0'), padding + 16, y + 8, {
      fontSize: style.fonts.scale.small, fontWeight: '700', color: accentColor, textAlign: 'center', width: 28, height: 12, zIndex: zIndex++
    }))

    // 住宿名稱
    elements.push(createTextElement(`住宿名稱${index + 1}`, hotel.name, padding + 52, y + 4, {
      fontSize: 16, fontWeight: '700', color: style.colors.textPrimary, width: A5_WIDTH - padding * 2 - 120, height: 22, zIndex: zIndex++
    }))

    // 天數
    if (hotel.days && hotel.days.length > 0) {
      const daysText = hotel.days.length === 1 ? `Day ${hotel.days[0]}` : `Day ${hotel.days[0]}-${hotel.days[hotel.days.length - 1]}`
      elements.push(createTextElement(`天數${index + 1}`, `${daysText} (${hotel.days.length}晚)`, A5_WIDTH - padding - 100, y + 8, {
        fontSize: style.fonts.scale.small, color: accentColor, textAlign: 'right', width: 90, height: 14, zIndex: zIndex++
      }))
    }

    elements.push(createShapeElement(`分隔線${index + 1}`, padding + 16, y + 32, A5_WIDTH - padding * 2 - 16, 1, {
      fill: style.colors.border, zIndex: zIndex++
    }))

    let infoY = y + 44

    if (hotel.address) {
      elements.push(createTextElement(`地址標籤${index + 1}`, '地址', padding + 16, infoY, {
        fontSize: style.fonts.scale.xs, fontWeight: '600', color: style.colors.textSecondary, width: 30, height: 12, zIndex: zIndex++
      }))
      elements.push(createTextElement(`地址${index + 1}`, hotel.address, padding + 50, infoY, {
        fontSize: style.fonts.scale.small, color: style.colors.textPrimary, width: A5_WIDTH - padding * 2 - 66, height: 30, zIndex: zIndex++
      }))
      infoY += 32
    }

    if (hotel.phone) {
      elements.push(createTextElement(`電話標籤${index + 1}`, '電話', padding + 16, infoY, {
        fontSize: style.fonts.scale.xs, fontWeight: '600', color: style.colors.textSecondary, width: 30, height: 12, zIndex: zIndex++
      }))
      elements.push(createTextElement(`電話${index + 1}`, hotel.phone, padding + 50, infoY, {
        fontSize: style.fonts.scale.small, color: style.colors.textPrimary, width: 150, height: 14, zIndex: zIndex++
      }))
      infoY += 20
    }

    elements.push(createTextElement(`時間標籤${index + 1}`, '時間', padding + 16, infoY, {
      fontSize: style.fonts.scale.xs, fontWeight: '600', color: style.colors.textSecondary, width: 30, height: 12, zIndex: zIndex++
    }))
    elements.push(createTextElement(`時間${index + 1}`, `Check-in ${hotel.checkIn || '15:00'} / Check-out ${hotel.checkOut || '11:00'}`, padding + 50, infoY, {
      fontSize: style.fonts.scale.small, color: style.colors.textPrimary, width: 250, height: 14, zIndex: zIndex++
    }))
  })

  // 頁碼
  elements.push(createTextElement('頁碼', '17', A5_WIDTH - padding - 20, A5_HEIGHT - padding, {
    fontSize: 9, color: style.colors.textSecondary, textAlign: 'right', width: 20, height: 12, zIndex: zIndex++
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

export const modernTheme: ThemeDefinition = {
  id: 'modern',
  name: '現代',
  description: '簡潔幾何設計，Deep Blue + Hot Pink 配色',
  previewImage: '/themes/modern-preview.png',
  tags: ['簡潔', '幾何', '現代'],
  version: '1.0.0',
  style,
  layouts,
}

export default modernTheme
