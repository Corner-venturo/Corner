/**
 * 手冊生成引擎
 * Brochure Generator Engine
 *
 * 從行程資料自動生成完整手冊
 */

import type { Itinerary, DailyItineraryDay } from '@/stores/types'
import type { CanvasElement, CanvasPage, TextElement, ImageElement, ShapeElement } from '../canvas-editor/types'
import type { BrochureTheme } from './themes'
import type { PageTemplate, TemplateRegion, PageType } from './page-templates'
import { recommendTheme, getThemeById } from './themes'
import {
  selectBestTemplate,
  COVER_FULLBLEED,
  CONTENTS_SIMPLE,
  OVERVIEW_LEFT_FLIGHT,
  OVERVIEW_RIGHT_SCHEDULE,
  DAILY_LEFT_LARGE_IMAGE,
  DAILY_LEFT_COMPACT,
  DAILY_RIGHT_SPOTS,
  ACCOMMODATION_LIST,
  INFO_PAGE,
} from './page-templates'

// ============= 類型定義 =============

export interface GeneratedBrochure {
  id: string
  name: string
  theme: BrochureTheme
  pages: GeneratedPage[]
  createdAt: string
  sourceItineraryId: string
}

export interface GeneratedPage {
  id: string
  type: PageType
  name: string
  pageNumber: number
  template: PageTemplate
  elements: CanvasElement[]
  data: Record<string, unknown>  // 原始資料綁定
}

export interface GeneratorOptions {
  themeId?: string           // 指定主題 ID，不指定則自動推薦
  includeWeather?: boolean   // 是否包含天氣資訊
  includeCurrency?: boolean  // 是否包含匯率資訊
  includeQRCode?: boolean    // 是否包含 QR Code
  includeNotes?: boolean     // 是否包含筆記頁
  companyName?: string       // 公司名稱
  companyLogo?: string       // 公司 Logo URL
}

// ============= 輔助函數 =============

// 生成唯一 ID
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 格式化日期
function formatDate(dateStr: string, dayIndex: number): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    date.setDate(date.getDate() + dayIndex)
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekday = weekdays[date.getDay()]
    return `${month}/${day} (${weekday})`
  } catch {
    return ''
  }
}

// 格式化日期範圍
function formatDateRange(startDate: string, days: number): string {
  if (!startDate) return ''
  try {
    const start = new Date(startDate)
    const end = new Date(startDate)
    end.setDate(end.getDate() + days - 1)

    const format = (d: Date) =>
      `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`

    return `${format(start)} - ${format(end)}`
  } catch {
    return ''
  }
}

// 從活動中提取圖片
function getActivityImage(activity: DailyItineraryDay['activities'][0], day: DailyItineraryDay, index: number): string | null {
  // 優先使用活動自己的圖片
  if (activity.image) return activity.image

  // 其次使用當天的圖片
  if (day.images && day.images[index]) {
    const img = day.images[index]
    return typeof img === 'string' ? img : img.url
  }

  return null
}

// 從行程中提取住宿資訊
function extractAccommodations(dailyItinerary: DailyItineraryDay[]): Array<{
  day: number
  hotelName: string
  url?: string
  rating?: number
}> {
  const accommodations: Array<{
    day: number
    hotelName: string
    url?: string
    rating?: number
  }> = []

  dailyItinerary.forEach((day, index) => {
    if (day.accommodation) {
      accommodations.push({
        day: index + 1,
        hotelName: day.accommodation,  // accommodation is a string
        url: day.accommodationUrl,
        rating: day.accommodationRating,
      })
    }
  })

  return accommodations
}

// ============= 元素生成函數 =============

// 將百分比位置轉換為像素 (A5: 559px x 794px)
const A5_WIDTH = 559
const A5_HEIGHT = 794

function percentToPixel(percent: number, dimension: 'x' | 'y' | 'width' | 'height'): number {
  const base = (dimension === 'x' || dimension === 'width') ? A5_WIDTH : A5_HEIGHT
  return Math.round((percent / 100) * base)
}

// 創建文字元素
function createTextElement(
  region: TemplateRegion,
  content: string,
  theme: BrochureTheme,
  pageId: string
): TextElement {
  const fontConfig = {
    title: { size: 28, weight: 'bold' as const, font: theme.fonts.title },
    subtitle: { size: 18, weight: '500' as const, font: theme.fonts.subtitle },
    heading: { size: 20, weight: 'bold' as const, font: theme.fonts.title },
    body: { size: 12, weight: 'normal' as const, font: theme.fonts.body },
    caption: { size: 10, weight: 'normal' as const, font: theme.fonts.body },
    label: { size: 11, weight: '500' as const, font: theme.fonts.body },
    'page-number': { size: 9, weight: 'normal' as const, font: theme.fonts.body },
  }

  const config = fontConfig[region.textVariant || 'body']

  return {
    id: generateId(`text-${pageId}`),
    type: 'text',
    name: region.id,
    x: percentToPixel(region.x, 'x'),
    y: percentToPixel(region.y, 'y'),
    width: percentToPixel(region.width, 'width'),
    height: percentToPixel(region.height, 'height'),
    rotation: 0,
    opacity: region.style?.opacity ?? 1,
    locked: false,
    visible: true,
    zIndex: 0,
    content,
    style: {
      fontFamily: config.font,
      fontSize: config.size,
      fontWeight: config.weight,
      fontStyle: 'normal',
      textAlign: region.textAlign || 'left',
      lineHeight: 1.4,
      letterSpacing: 0,
      color: region.textVariant === 'caption' ? theme.colors.textMuted : theme.colors.text,
      textDecoration: 'none',
    },
  }
}

// 創建圖片元素
function createImageElement(
  region: TemplateRegion,
  src: string,
  pageId: string
): ImageElement {
  return {
    id: generateId(`image-${pageId}`),
    type: 'image',
    name: region.id,
    x: percentToPixel(region.x, 'x'),
    y: percentToPixel(region.y, 'y'),
    width: percentToPixel(region.width, 'width'),
    height: percentToPixel(region.height, 'height'),
    rotation: 0,
    opacity: region.style?.opacity ?? 1,
    locked: false,
    visible: true,
    zIndex: 0,
    src,
    cropX: 0,
    cropY: 0,
    cropWidth: 100,
    cropHeight: 100,
    filters: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      blur: 0,
    },
    objectFit: region.objectFit || 'cover',
  }
}

// 創建形狀元素（用於卡片背景等）
function createShapeElement(
  region: TemplateRegion,
  theme: BrochureTheme,
  pageId: string
): ShapeElement {
  return {
    id: generateId(`shape-${pageId}`),
    type: 'shape',
    name: region.id,
    x: percentToPixel(region.x, 'x'),
    y: percentToPixel(region.y, 'y'),
    width: percentToPixel(region.width, 'width'),
    height: percentToPixel(region.height, 'height'),
    rotation: 0,
    opacity: region.style?.opacity ?? 1,
    locked: false,
    visible: true,
    zIndex: 0,
    variant: 'rectangle',
    fill: region.style?.backgroundColor || theme.colors.surface,
    stroke: theme.colors.border,
    strokeWidth: 1,
    cornerRadius: region.style?.borderRadius ?? 8,
  }
}

// ============= 頁面生成函數 =============

// 生成封面
function generateCoverPage(
  itinerary: Itinerary,
  theme: BrochureTheme,
  options: GeneratorOptions
): GeneratedPage {
  const template = COVER_FULLBLEED
  const pageId = generateId('cover')
  const elements: CanvasElement[] = []

  const data = {
    city: itinerary.city?.toUpperCase() || '目的地',
    country: itinerary.country?.toUpperCase() || '',
    travelDates: formatDateRange(itinerary.departure_date || '', itinerary.daily_itinerary?.length || 1),
    coverImage: itinerary.cover_image || '',
    companyLogo: options.companyLogo || '',
  }

  // 背景圖
  if (data.coverImage) {
    elements.push(createImageElement(
      template.regions.find(r => r.id === 'bg-image')!,
      data.coverImage,
      pageId
    ))
  }

  // 漸層遮罩（用形狀模擬）
  elements.push({
    id: generateId(`overlay-${pageId}`),
    type: 'shape',
    name: 'overlay',
    x: 0,
    y: A5_HEIGHT * 0.5,
    width: A5_WIDTH,
    height: A5_HEIGHT * 0.5,
    rotation: 0,
    opacity: 0.7,
    locked: true,
    visible: true,
    zIndex: 1,
    variant: 'rectangle',
    fill: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
    stroke: 'transparent',
    strokeWidth: 0,
    cornerRadius: 0,
  } as ShapeElement)

  // 城市名稱
  elements.push(createTextElement(
    { ...template.regions.find(r => r.id === 'destination')!, textVariant: 'title' },
    data.city,
    { ...theme, colors: { ...theme.colors, text: '#ffffff' } },
    pageId
  ))

  // 國家
  if (data.country) {
    elements.push(createTextElement(
      { ...template.regions.find(r => r.id === 'country')!, textVariant: 'subtitle' },
      data.country,
      { ...theme, colors: { ...theme.colors, text: '#ffffff', textMuted: 'rgba(255,255,255,0.8)' } },
      pageId
    ))
  }

  // 日期
  elements.push(createTextElement(
    { ...template.regions.find(r => r.id === 'dates')!, textVariant: 'caption' },
    data.travelDates,
    { ...theme, colors: { ...theme.colors, textMuted: 'rgba(255,255,255,0.9)' } },
    pageId
  ))

  return {
    id: pageId,
    type: 'cover',
    name: '封面',
    pageNumber: 1,
    template,
    elements,
    data,
  }
}

// 生成目錄頁
function generateContentsPage(
  itinerary: Itinerary,
  theme: BrochureTheme,
  pageNumber: number
): GeneratedPage {
  const template = CONTENTS_SIMPLE
  const pageId = generateId('contents')
  const elements: CanvasElement[] = []
  const dailyItinerary = itinerary.daily_itinerary || []

  // 背景
  elements.push({
    id: generateId(`bg-${pageId}`),
    type: 'shape',
    name: 'background',
    x: 0, y: 0, width: A5_WIDTH, height: A5_HEIGHT,
    rotation: 0, opacity: 1, locked: true, visible: true, zIndex: 0,
    variant: 'rectangle',
    fill: theme.colors.background,
    stroke: 'transparent', strokeWidth: 0, cornerRadius: 0,
  } as ShapeElement)

  // 標題
  elements.push(createTextElement(
    template.regions.find(r => r.id === 'title')!,
    '目錄',
    theme,
    pageId
  ))

  elements.push(createTextElement(
    template.regions.find(r => r.id === 'subtitle')!,
    'CONTENTS',
    theme,
    pageId
  ))

  // 行程列表
  let yOffset = percentToPixel(28, 'y')
  const itemHeight = 60

  dailyItinerary.forEach((day, index) => {
    // Day 標籤
    elements.push({
      id: generateId(`day-label-${pageId}-${index}`),
      type: 'text',
      name: `day-${index + 1}-label`,
      x: percentToPixel(15, 'x'),
      y: yOffset,
      width: 60,
      height: 24,
      rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 2,
      content: `DAY ${String(index + 1).padStart(2, '0')}`,
      style: {
        fontFamily: theme.fonts.subtitle,
        fontSize: 11,
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'left',
        lineHeight: 1.2,
        letterSpacing: 1,
        color: theme.colors.accent,
        textDecoration: 'none',
      },
    } as TextElement)

    // 日期
    elements.push({
      id: generateId(`date-${pageId}-${index}`),
      type: 'text',
      name: `day-${index + 1}-date`,
      x: percentToPixel(15, 'x') + 70,
      y: yOffset,
      width: 100,
      height: 24,
      rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 2,
      content: formatDate(itinerary.departure_date || '', index),
      style: {
        fontFamily: theme.fonts.body,
        fontSize: 10,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'left',
        lineHeight: 1.2,
        letterSpacing: 0,
        color: theme.colors.textMuted,
        textDecoration: 'none',
      },
    } as TextElement)

    // 標題
    elements.push({
      id: generateId(`title-${pageId}-${index}`),
      type: 'text',
      name: `day-${index + 1}-title`,
      x: percentToPixel(15, 'x'),
      y: yOffset + 22,
      width: percentToPixel(70, 'width'),
      height: 30,
      rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 2,
      content: day.title || `第 ${index + 1} 天`,
      style: {
        fontFamily: theme.fonts.title,
        fontSize: 14,
        fontWeight: '500',
        fontStyle: 'normal',
        textAlign: 'left',
        lineHeight: 1.3,
        letterSpacing: 0,
        color: theme.colors.text,
        textDecoration: 'none',
      },
    } as TextElement)

    yOffset += itemHeight
  })

  // 頁碼
  elements.push(createTextElement(
    template.regions.find(r => r.id === 'page-number')!,
    String(pageNumber).padStart(2, '0'),
    theme,
    pageId
  ))

  return {
    id: pageId,
    type: 'contents',
    name: '目錄',
    pageNumber,
    template,
    elements,
    data: { dailyItinerary },
  }
}

// 生成每日行程左頁
function generateDailyLeftPage(
  day: DailyItineraryDay,
  dayIndex: number,
  itinerary: Itinerary,
  theme: BrochureTheme,
  pageNumber: number
): GeneratedPage {
  const activityCount = day.activities?.length || 0
  const hasImages = day.activities?.some(a => a.image) || (day.images && day.images.length > 0)

  const template = selectBestTemplate('daily-left', {
    activityCount,
    hasImages,
  })

  const pageId = generateId(`daily-left-${dayIndex}`)
  const elements: CanvasElement[] = []

  // 背景
  elements.push({
    id: generateId(`bg-${pageId}`),
    type: 'shape',
    name: 'background',
    x: 0, y: 0, width: A5_WIDTH, height: A5_HEIGHT,
    rotation: 0, opacity: 1, locked: true, visible: true, zIndex: 0,
    variant: 'rectangle',
    fill: theme.colors.background,
    stroke: 'transparent', strokeWidth: 0, cornerRadius: 0,
  } as ShapeElement)

  // Day 標籤背景
  elements.push({
    id: generateId(`day-badge-bg-${pageId}`),
    type: 'shape',
    name: 'day-badge',
    x: percentToPixel(5, 'x'),
    y: percentToPixel(5, 'y'),
    width: percentToPixel(15, 'width'),
    height: percentToPixel(12, 'height'),
    rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 1,
    variant: 'rectangle',
    fill: theme.colors.accent,
    stroke: 'transparent', strokeWidth: 0, cornerRadius: 12,
  } as ShapeElement)

  // Day 文字
  elements.push({
    id: generateId(`day-text-${pageId}`),
    type: 'text',
    name: 'day-text',
    x: percentToPixel(5, 'x'),
    y: percentToPixel(6, 'y'),
    width: percentToPixel(15, 'width'),
    height: 20,
    rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 2,
    content: 'DAY',
    style: {
      fontFamily: theme.fonts.body,
      fontSize: 10,
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'center',
      lineHeight: 1,
      letterSpacing: 2,
      color: '#ffffff',
      textDecoration: 'none',
    },
  } as TextElement)

  // Day 數字
  elements.push({
    id: generateId(`day-number-${pageId}`),
    type: 'text',
    name: 'day-number',
    x: percentToPixel(5, 'x'),
    y: percentToPixel(9, 'y'),
    width: percentToPixel(15, 'width'),
    height: 40,
    rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 2,
    content: String(dayIndex + 1).padStart(2, '0'),
    style: {
      fontFamily: theme.fonts.title,
      fontSize: 28,
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'center',
      lineHeight: 1,
      letterSpacing: 0,
      color: '#ffffff',
      textDecoration: 'none',
    },
  } as TextElement)

  // 日期
  elements.push({
    id: generateId(`date-${pageId}`),
    type: 'text',
    name: 'date',
    x: percentToPixel(22, 'x'),
    y: percentToPixel(6, 'y'),
    width: percentToPixel(40, 'width'),
    height: 20,
    rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 2,
    content: formatDate(itinerary.departure_date || '', dayIndex),
    style: {
      fontFamily: theme.fonts.body,
      fontSize: 11,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      lineHeight: 1,
      letterSpacing: 0,
      color: theme.colors.textMuted,
      textDecoration: 'none',
    },
  } as TextElement)

  // 標題
  elements.push({
    id: generateId(`title-${pageId}`),
    type: 'text',
    name: 'title',
    x: percentToPixel(22, 'x'),
    y: percentToPixel(10, 'y'),
    width: percentToPixel(70, 'width'),
    height: 40,
    rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 2,
    content: day.title || `第 ${dayIndex + 1} 天`,
    style: {
      fontFamily: theme.fonts.title,
      fontSize: 18,
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'left',
      lineHeight: 1.2,
      letterSpacing: 0,
      color: theme.colors.text,
      textDecoration: 'none',
    },
  } as TextElement)

  // 主圖（如果有）
  const mainImage = day.activities?.[0] ? getActivityImage(day.activities[0], day, 0) : null
  if (mainImage) {
    elements.push({
      id: generateId(`main-image-${pageId}`),
      type: 'image',
      name: 'main-image',
      x: percentToPixel(5, 'x'),
      y: percentToPixel(20, 'y'),
      width: percentToPixel(90, 'width'),
      height: percentToPixel(45, 'height'),
      rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 1,
      src: mainImage,
      cropX: 0, cropY: 0, cropWidth: 100, cropHeight: 100,
      filters: { brightness: 0, contrast: 0, saturation: 0, blur: 0 },
      objectFit: 'cover',
    } as ImageElement)
  }

  // 行程內容
  let yOffset = mainImage ? percentToPixel(68, 'y') : percentToPixel(22, 'y')
  const activities = day.activities || []

  activities.slice(0, 3).forEach((activity, index) => {
    // 圖標（如果有）
    if (activity.icon) {
      elements.push({
        id: generateId(`icon-${pageId}-${index}`),
        type: 'text',
        name: `activity-${index}-icon`,
        x: percentToPixel(5, 'x'),
        y: yOffset,
        width: 30,
        height: 24,
        rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 2,
        content: activity.icon,
        style: {
          fontFamily: theme.fonts.body,
          fontSize: 16,
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'center',
          lineHeight: 1,
          letterSpacing: 0,
          color: theme.colors.text,
          textDecoration: 'none',
        },
      } as TextElement)
    }

    // 標題
    elements.push({
      id: generateId(`activity-title-${pageId}-${index}`),
      type: 'text',
      name: `activity-${index}-title`,
      x: percentToPixel(5, 'x') + (activity.icon ? 35 : 0),
      y: yOffset,
      width: percentToPixel(85, 'width') - (activity.icon ? 35 : 0),
      height: 24,
      rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 2,
      content: activity.title,
      style: {
        fontFamily: theme.fonts.subtitle,
        fontSize: 13,
        fontWeight: '500',
        fontStyle: 'normal',
        textAlign: 'left',
        lineHeight: 1.2,
        letterSpacing: 0,
        color: theme.colors.text,
        textDecoration: 'none',
      },
    } as TextElement)

    // 描述
    if (activity.description) {
      elements.push({
        id: generateId(`activity-desc-${pageId}-${index}`),
        type: 'text',
        name: `activity-${index}-desc`,
        x: percentToPixel(5, 'x'),
        y: yOffset + 22,
        width: percentToPixel(90, 'width'),
        height: 40,
        rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 2,
        content: activity.description.slice(0, 100) + (activity.description.length > 100 ? '...' : ''),
        style: {
          fontFamily: theme.fonts.body,
          fontSize: 10,
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'left',
          lineHeight: 1.4,
          letterSpacing: 0,
          color: theme.colors.textMuted,
          textDecoration: 'none',
        },
      } as TextElement)
      yOffset += 65
    } else {
      yOffset += 30
    }
  })

  // 頁碼
  elements.push({
    id: generateId(`page-number-${pageId}`),
    type: 'text',
    name: 'page-number',
    x: percentToPixel(5, 'x'),
    y: percentToPixel(95, 'y'),
    width: 40,
    height: 20,
    rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 2,
    content: String(pageNumber).padStart(2, '0'),
    style: {
      fontFamily: theme.fonts.body,
      fontSize: 9,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      lineHeight: 1,
      letterSpacing: 0,
      color: theme.colors.textMuted,
      textDecoration: 'none',
    },
  } as TextElement)

  return {
    id: pageId,
    type: 'daily-left',
    name: `Day ${dayIndex + 1} (左)`,
    pageNumber,
    template,
    elements,
    data: { day, dayIndex },
  }
}

// 生成每日行程右頁
function generateDailyRightPage(
  day: DailyItineraryDay,
  dayIndex: number,
  theme: BrochureTheme,
  pageNumber: number
): GeneratedPage {
  const template = DAILY_RIGHT_SPOTS
  const pageId = generateId(`daily-right-${dayIndex}`)
  const elements: CanvasElement[] = []
  const activities = day.activities || []

  // 背景
  elements.push({
    id: generateId(`bg-${pageId}`),
    type: 'shape',
    name: 'background',
    x: 0, y: 0, width: A5_WIDTH, height: A5_HEIGHT,
    rotation: 0, opacity: 1, locked: true, visible: true, zIndex: 0,
    variant: 'rectangle',
    fill: theme.colors.background,
    stroke: 'transparent', strokeWidth: 0, cornerRadius: 0,
  } as ShapeElement)

  // 標題
  elements.push({
    id: generateId(`title-${pageId}`),
    type: 'text',
    name: 'title',
    x: percentToPixel(8, 'x'),
    y: percentToPixel(6, 'y'),
    width: percentToPixel(50, 'width'),
    height: 30,
    rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 2,
    content: '景點介紹',
    style: {
      fontFamily: theme.fonts.title,
      fontSize: 16,
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'left',
      lineHeight: 1,
      letterSpacing: 2,
      color: theme.colors.text,
      textDecoration: 'none',
    },
  } as TextElement)

  elements.push({
    id: generateId(`subtitle-${pageId}`),
    type: 'text',
    name: 'subtitle',
    x: percentToPixel(8, 'x'),
    y: percentToPixel(11, 'y'),
    width: percentToPixel(50, 'width'),
    height: 20,
    rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 2,
    content: 'HIGHLIGHTS',
    style: {
      fontFamily: theme.fonts.body,
      fontSize: 9,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      lineHeight: 1,
      letterSpacing: 2,
      color: theme.colors.accent,
      textDecoration: 'none',
    },
  } as TextElement)

  // 景點網格
  const gridStartY = percentToPixel(16, 'y')
  const itemsPerRow = activities.length <= 2 ? 1 : 2
  const itemWidth = itemsPerRow === 1 ? percentToPixel(90, 'width') : percentToPixel(43, 'width')
  const itemHeight = activities.length <= 2 ? 280 : 180

  activities.slice(0, 4).forEach((activity, index) => {
    const row = Math.floor(index / itemsPerRow)
    const col = index % itemsPerRow
    const x = percentToPixel(5, 'x') + col * (itemWidth + percentToPixel(4, 'width'))
    const y = gridStartY + row * (itemHeight + 15)

    // 卡片背景
    elements.push({
      id: generateId(`card-${pageId}-${index}`),
      type: 'shape',
      name: `spot-card-${index}`,
      x, y, width: itemWidth, height: itemHeight,
      rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 1,
      variant: 'rectangle',
      fill: theme.colors.surface,
      stroke: theme.colors.border, strokeWidth: 1, cornerRadius: 12,
    } as ShapeElement)

    // 圖片
    const image = getActivityImage(activity, day, index)
    if (image) {
      const imgHeight = activities.length <= 2 ? 160 : 100
      elements.push({
        id: generateId(`spot-image-${pageId}-${index}`),
        type: 'image',
        name: `spot-image-${index}`,
        x: x + 8, y: y + 8, width: itemWidth - 16, height: imgHeight,
        rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 2,
        src: image,
        cropX: 0, cropY: 0, cropWidth: 100, cropHeight: 100,
        filters: { brightness: 0, contrast: 0, saturation: 0, blur: 0 },
        objectFit: 'cover',
      } as ImageElement)
    }

    // 標題
    const titleY = image ? y + (activities.length <= 2 ? 175 : 115) : y + 15
    elements.push({
      id: generateId(`spot-title-${pageId}-${index}`),
      type: 'text',
      name: `spot-title-${index}`,
      x: x + 12, y: titleY, width: itemWidth - 24, height: 24,
      rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 2,
      content: activity.title,
      style: {
        fontFamily: theme.fonts.subtitle,
        fontSize: 12,
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'left',
        lineHeight: 1.2,
        letterSpacing: 0,
        color: theme.colors.text,
        textDecoration: 'none',
      },
    } as TextElement)

    // 描述
    if (activity.description) {
      elements.push({
        id: generateId(`spot-desc-${pageId}-${index}`),
        type: 'text',
        name: `spot-desc-${index}`,
        x: x + 12, y: titleY + 22, width: itemWidth - 24, height: 50,
        rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 2,
        content: activity.description.slice(0, 80) + (activity.description.length > 80 ? '...' : ''),
        style: {
          fontFamily: theme.fonts.body,
          fontSize: 9,
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'left',
          lineHeight: 1.4,
          letterSpacing: 0,
          color: theme.colors.textMuted,
          textDecoration: 'none',
        },
      } as TextElement)
    }
  })

  // 頁碼
  elements.push({
    id: generateId(`page-number-${pageId}`),
    type: 'text',
    name: 'page-number',
    x: percentToPixel(85, 'x'),
    y: percentToPixel(95, 'y'),
    width: 40,
    height: 20,
    rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 2,
    content: String(pageNumber).padStart(2, '0'),
    style: {
      fontFamily: theme.fonts.body,
      fontSize: 9,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'right',
      lineHeight: 1,
      letterSpacing: 0,
      color: theme.colors.textMuted,
      textDecoration: 'none',
    },
  } as TextElement)

  return {
    id: pageId,
    type: 'daily-right',
    name: `Day ${dayIndex + 1} (右)`,
    pageNumber,
    template,
    elements,
    data: { day, dayIndex },
  }
}

// ============= 主生成函數 =============

export function generateBrochure(
  itinerary: Itinerary,
  options: GeneratorOptions = {}
): GeneratedBrochure {
  // 選擇主題
  const theme = options.themeId
    ? getThemeById(options.themeId) || recommendTheme(itinerary.country || '', itinerary.city)
    : recommendTheme(itinerary.country || '', itinerary.city)

  const pages: GeneratedPage[] = []
  let pageNumber = 1

  // 1. 封面
  pages.push(generateCoverPage(itinerary, theme, options))
  pageNumber++

  // 2. 空白頁（封面背面）
  pages.push({
    id: generateId('blank'),
    type: 'blank',
    name: '空白頁',
    pageNumber: pageNumber++,
    template: { id: 'blank', type: 'blank', name: '空白頁', description: '', regions: [] },
    elements: [{
      id: generateId('blank-bg'),
      type: 'shape',
      name: 'background',
      x: 0, y: 0, width: A5_WIDTH, height: A5_HEIGHT,
      rotation: 0, opacity: 1, locked: true, visible: true, zIndex: 0,
      variant: 'rectangle',
      fill: '#ffffff',
      stroke: 'transparent', strokeWidth: 0, cornerRadius: 0,
    } as ShapeElement],
    data: {},
  })

  // 3. 目錄
  pages.push(generateContentsPage(itinerary, theme, pageNumber++))

  // 4. 總攬左（預留）
  // 5. 總攬右（預留）
  pageNumber += 2

  // 6. 每日行程
  const dailyItinerary = itinerary.daily_itinerary || []
  dailyItinerary.forEach((day, index) => {
    pages.push(generateDailyLeftPage(day, index, itinerary, theme, pageNumber++))
    pages.push(generateDailyRightPage(day, index, theme, pageNumber++))
  })

  return {
    id: generateId('brochure'),
    name: `${itinerary.city || '旅遊'}手冊`,
    theme,
    pages,
    createdAt: new Date().toISOString(),
    sourceItineraryId: itinerary.id,
  }
}

// 匯出
export { recommendTheme, getThemeById }
