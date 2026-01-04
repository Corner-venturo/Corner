/**
 * 模板轉換為 Canvas 元素
 * Template to Canvas Elements Converter
 *
 * 將 React 模板頁面轉換為可編輯的 Canvas 元素
 */

import type { CanvasElement, TextElement, ImageElement, ShapeElement } from '../canvas-editor/types'
import type { BrochureCoverData } from '../types'
import type { Itinerary, DailyItineraryDay } from '@/stores/types'

// A5 尺寸 (px @ 96dpi)
const A5_WIDTH = 559
const A5_HEIGHT = 794

// 生成唯一 ID
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 創建文字元素
function createText(
  name: string,
  content: string,
  x: number,
  y: number,
  options: {
    fontSize?: number
    fontWeight?: 'normal' | 'bold' | '500' | '600' | '700'
    color?: string
    textAlign?: 'left' | 'center' | 'right'
    width?: number
    height?: number
  } = {}
): TextElement {
  return {
    id: generateId('text'),
    type: 'text',
    name,
    x,
    y,
    width: options.width || 200,
    height: options.height || 30,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    zIndex: 0,
    content,
    style: {
      fontFamily: 'Noto Sans TC',
      fontSize: options.fontSize || 14,
      fontWeight: options.fontWeight || 'normal',
      fontStyle: 'normal',
      textAlign: options.textAlign || 'left',
      lineHeight: 1.4,
      letterSpacing: 0,
      color: options.color || '#333333',
      textDecoration: 'none',
    },
  }
}

// 創建圖片元素
function createImage(
  name: string,
  src: string,
  x: number,
  y: number,
  width: number,
  height: number
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
    objectFit: 'cover',
  }
}

// 創建形狀元素
function createShape(
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    variant?: 'rectangle' | 'circle'
    fill?: string
    stroke?: string
    strokeWidth?: number
    cornerRadius?: number
    opacity?: number
  } = {}
): ShapeElement {
  return {
    id: generateId('shape'),
    type: 'shape',
    name,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: options.opacity ?? 1,
    locked: false,
    visible: true,
    zIndex: 0,
    variant: options.variant || 'rectangle',
    fill: options.fill || '#e8e5e0',
    stroke: options.stroke || 'transparent',
    strokeWidth: options.strokeWidth || 0,
    cornerRadius: options.cornerRadius || 0,
  }
}

/**
 * 封面頁轉換為 Canvas 元素
 */
export function coverToElements(data: BrochureCoverData): CanvasElement[] {
  const elements: CanvasElement[] = []

  // 1. 背景圖片
  if (data.coverImage) {
    elements.push(createImage('背景圖片', data.coverImage, 0, 0, A5_WIDTH, A5_HEIGHT))
  } else {
    // 無圖片時的漸層背景
    elements.push(createShape('背景', 0, 0, A5_WIDTH, A5_HEIGHT, {
      fill: '#1e293b',
    }))
  }

  // 2. 漸層遮罩
  elements.push(createShape('漸層遮罩', 0, 0, A5_WIDTH, A5_HEIGHT, {
    fill: 'rgba(0,0,0,0.4)',
    opacity: 0.6,
  }))

  // 3. 客戶名稱
  if (data.clientName) {
    elements.push(createText('客戶名稱', data.clientName, 30, 40, {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#ffffff',
      width: 200,
    }))
  }

  // 4. 國家
  if (data.country) {
    elements.push(createText('國家', data.country, A5_WIDTH / 2 - 100, A5_HEIGHT / 2 - 60, {
      fontSize: 14,
      fontWeight: 'normal',
      color: '#ffffff',
      textAlign: 'center',
      width: 200,
    }))
  }

  // 5. 城市（主標題）
  elements.push(createText('城市', data.city || 'CITY', A5_WIDTH / 2 - 150, A5_HEIGHT / 2 - 30, {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    width: 300,
    height: 60,
  }))

  // 6. 旅遊日期
  if (data.travelDates) {
    elements.push(createShape('日期背景', A5_WIDTH / 2 - 80, A5_HEIGHT / 2 + 40, 160, 30, {
      fill: 'rgba(255,255,255,0.15)',
      cornerRadius: 15,
    }))
    elements.push(createText('旅遊日期', data.travelDates, A5_WIDTH / 2 - 70, A5_HEIGHT / 2 + 47, {
      fontSize: 11,
      color: '#ffffff',
      textAlign: 'center',
      width: 140,
    }))
  }

  // 7. 公司名稱
  if (data.companyName) {
    elements.push(createText('公司名稱', data.companyName, 30, A5_HEIGHT - 60, {
      fontSize: 12,
      fontWeight: '500',
      color: '#ffffff',
    }))
  }

  // 8. 聯絡電話
  if (data.emergencyContact) {
    elements.push(createText('聯絡電話', data.emergencyContact, A5_WIDTH - 150, A5_HEIGHT - 60, {
      fontSize: 10,
      color: '#ffffff',
      textAlign: 'right',
      width: 120,
    }))
  }

  // 9. Email
  if (data.emergencyEmail) {
    elements.push(createText('Email', data.emergencyEmail, A5_WIDTH - 150, A5_HEIGHT - 45, {
      fontSize: 9,
      color: 'rgba(255,255,255,0.8)',
      textAlign: 'right',
      width: 120,
    }))
  }

  return elements
}

/**
 * 目錄頁轉換為 Canvas 元素
 */
export function contentsToElements(
  data: BrochureCoverData,
  itinerary: Itinerary | null
): CanvasElement[] {
  const elements: CanvasElement[] = []
  const dailyItinerary = itinerary?.daily_itinerary || []

  // 背景
  elements.push(createShape('背景', 0, 0, A5_WIDTH, A5_HEIGHT, {
    fill: '#faf9f7',
  }))

  // 標題
  elements.push(createText('目錄標題', 'CONTENTS', 40, 50, {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  }))

  // 副標題
  elements.push(createText('副標題', `${data.country} ${data.city} Trip`, 40, 85, {
    fontSize: 12,
    color: '#888888',
  }))

  // 目錄項目
  let yOffset = 140
  dailyItinerary.forEach((day, index) => {
    elements.push(createText(`Day ${index + 1}`, `Day ${index + 1}`, 40, yOffset, {
      fontSize: 14,
      fontWeight: '600',
      color: '#c9aa7c',
      width: 60,
    }))
    elements.push(createText(`Day ${index + 1} 標題`, day.title || `第 ${index + 1} 天行程`, 110, yOffset, {
      fontSize: 12,
      color: '#333333',
      width: 350,
    }))
    yOffset += 35
  })

  return elements
}

/**
 * 總覽頁（左）轉換為 Canvas 元素
 */
export function overviewLeftToElements(
  data: BrochureCoverData,
  itinerary: Itinerary | null
): CanvasElement[] {
  const elements: CanvasElement[] = []

  // 背景
  elements.push(createShape('背景', 0, 0, A5_WIDTH, A5_HEIGHT, {
    fill: '#ffffff',
  }))

  // 標題
  elements.push(createText('標題', 'OVERVIEW', 40, 40, {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  }))

  // 航班資訊區塊
  elements.push(createShape('航班卡片', 30, 100, A5_WIDTH - 60, 120, {
    fill: '#f8f7f5',
    cornerRadius: 12,
  }))

  elements.push(createText('航班標題', '航班資訊', 50, 115, {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  }))

  elements.push(createText('航班提示', '請在此輸入航班資訊', 50, 145, {
    fontSize: 11,
    color: '#999999',
    width: 200,
  }))

  // 總覽圖片
  if (data.overviewImage) {
    elements.push(createImage('總覽圖片', data.overviewImage, 30, 250, A5_WIDTH - 60, 300))
  } else {
    elements.push(createShape('圖片佔位', 30, 250, A5_WIDTH - 60, 300, {
      fill: '#e8e5e0',
      cornerRadius: 8,
    }))
    elements.push(createText('圖片提示', '點擊添加圖片', A5_WIDTH / 2 - 50, 390, {
      fontSize: 12,
      color: '#999999',
      textAlign: 'center',
      width: 100,
    }))
  }

  return elements
}

/**
 * 總覽頁（右）轉換為 Canvas 元素
 */
export function overviewRightToElements(
  data: BrochureCoverData,
  itinerary: Itinerary | null
): CanvasElement[] {
  const elements: CanvasElement[] = []
  const dailyItinerary = itinerary?.daily_itinerary || []

  // 背景
  elements.push(createShape('背景', 0, 0, A5_WIDTH, A5_HEIGHT, {
    fill: '#ffffff',
  }))

  // 行程總覽
  elements.push(createText('標題', '行程總覽', 40, 40, {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  }))

  let yOffset = 80
  dailyItinerary.forEach((day, index) => {
    // 天數標籤
    elements.push(createShape(`Day ${index + 1} 標籤`, 30, yOffset, 50, 24, {
      fill: '#c9aa7c',
      cornerRadius: 4,
    }))
    elements.push(createText(`Day ${index + 1}`, `D${index + 1}`, 35, yOffset + 5, {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#ffffff',
      width: 40,
      textAlign: 'center',
    }))

    // 行程標題
    elements.push(createText(`Day ${index + 1} 行程`, day.title || `第 ${index + 1} 天`, 90, yOffset + 3, {
      fontSize: 12,
      fontWeight: '500',
      color: '#333333',
      width: A5_WIDTH - 120,
    }))

    yOffset += 40
  })

  return elements
}

/**
 * 每日行程頁（左）轉換為 Canvas 元素
 */
export function dailyLeftToElements(
  dayIndex: number,
  day: DailyItineraryDay,
  departureDate?: string | null
): CanvasElement[] {
  const elements: CanvasElement[] = []

  // 背景
  elements.push(createShape('背景', 0, 0, A5_WIDTH, A5_HEIGHT, {
    fill: '#ffffff',
  }))

  // Day 標題區
  elements.push(createShape('標題背景', 0, 0, A5_WIDTH, 80, {
    fill: '#c9aa7c',
  }))

  elements.push(createText('Day 標題', `DAY ${dayIndex + 1}`, 30, 25, {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  }))

  // 日期
  if (departureDate) {
    const date = new Date(departureDate)
    date.setDate(date.getDate() + dayIndex)
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
    elements.push(createText('日期', dateStr, 30, 55, {
      fontSize: 12,
      color: 'rgba(255,255,255,0.8)',
    }))
  }

  // 每日標題
  if (day.title) {
    elements.push(createText('每日標題', day.title, 30, 100, {
      fontSize: 16,
      fontWeight: '600',
      color: '#333333',
      width: A5_WIDTH - 60,
    }))
  }

  // 主圖片
  const mainImage = day.images?.[0]
  if (mainImage) {
    const imgUrl = typeof mainImage === 'string' ? mainImage : mainImage.url
    elements.push(createImage('主圖片', imgUrl, 20, 140, A5_WIDTH - 40, 280))
  } else {
    elements.push(createShape('圖片佔位', 20, 140, A5_WIDTH - 40, 280, {
      fill: '#f0eeeb',
      cornerRadius: 8,
    }))
  }

  return elements
}

/**
 * 每日行程頁（右）轉換為 Canvas 元素
 */
export function dailyRightToElements(
  dayIndex: number,
  day: DailyItineraryDay
): CanvasElement[] {
  const elements: CanvasElement[] = []

  // 背景
  elements.push(createShape('背景', 0, 0, A5_WIDTH, A5_HEIGHT, {
    fill: '#faf9f7',
  }))

  // 活動列表
  let yOffset = 40
  const activities = day.activities || []

  activities.forEach((activity, index) => {
    // 活動圖示
    if (activity.icon) {
      elements.push(createText(`活動 ${index + 1} 圖示`, activity.icon, 30, yOffset, {
        fontSize: 14,
        width: 30,
      }))
    }

    // 活動名稱
    elements.push(createText(`活動 ${index + 1} 名稱`, activity.title || `活動 ${index + 1}`, 65, yOffset, {
      fontSize: 12,
      fontWeight: '500',
      color: '#333333',
      width: A5_WIDTH - 100,
    }))

    // 活動描述
    if (activity.description) {
      elements.push(createText(`活動 ${index + 1} 描述`, activity.description, 65, yOffset + 20, {
        fontSize: 10,
        color: '#666666',
        width: A5_WIDTH - 100,
        height: 40,
      }))
      yOffset += 70
    } else {
      yOffset += 35
    }
  })

  // 住宿資訊
  if (day.accommodation) {
    elements.push(createShape('住宿卡片', 20, A5_HEIGHT - 100, A5_WIDTH - 40, 80, {
      fill: '#ffffff',
      cornerRadius: 8,
      stroke: '#e8e5e0',
      strokeWidth: 1,
    }))
    elements.push(createText('住宿標籤', '🏨 住宿', 35, A5_HEIGHT - 85, {
      fontSize: 10,
      fontWeight: '500',
      color: '#c9aa7c',
    }))
    elements.push(createText('住宿名稱', day.accommodation, 35, A5_HEIGHT - 65, {
      fontSize: 12,
      fontWeight: '500',
      color: '#333333',
      width: A5_WIDTH - 70,
    }))
  }

  return elements
}

/**
 * 空白頁轉換為 Canvas 元素
 */
export function blankToElements(): CanvasElement[] {
  return [
    createShape('背景', 0, 0, A5_WIDTH, A5_HEIGHT, {
      fill: '#ffffff',
    }),
  ]
}

// 住宿資訊類型
interface AccommodationInfo {
  name: string
  image?: string
  days?: number[]
}

/**
 * 住宿頁轉換為 Canvas 元素
 */
export function accommodationToElements(
  accommodations: AccommodationInfo[],
  side: 'left' | 'right'
): CanvasElement[] {
  const elements: CanvasElement[] = []

  // 背景
  elements.push(createShape('背景', 0, 0, A5_WIDTH, A5_HEIGHT, {
    fill: side === 'left' ? '#faf9f7' : '#ffffff',
  }))

  if (side === 'left') {
    // 標題
    elements.push(createText('標題', 'ACCOMMODATION', 40, 40, {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333333',
    }))

    elements.push(createText('副標題', '住宿資訊', 40, 70, {
      fontSize: 12,
      color: '#888888',
    }))
  }

  // 住宿列表
  const startIndex = side === 'left' ? 0 : Math.ceil(accommodations.length / 2)
  const endIndex = side === 'left' ? Math.ceil(accommodations.length / 2) : accommodations.length
  const displayAccommodations = accommodations.slice(startIndex, endIndex)

  let yOffset = side === 'left' ? 120 : 40

  displayAccommodations.forEach((acc, index) => {
    const daysStr = acc.days?.join(', ') || ''

    elements.push(createShape(`住宿 ${index + 1} 卡片`, 30, yOffset, A5_WIDTH - 60, 70, {
      fill: '#ffffff',
      cornerRadius: 8,
      stroke: '#e8e5e0',
      strokeWidth: 1,
    }))

    if (daysStr) {
      elements.push(createText(`住宿 ${index + 1} 天數`, `Day ${daysStr}`, 45, yOffset + 12, {
        fontSize: 10,
        fontWeight: '600',
        color: '#c9aa7c',
      }))
    }

    elements.push(createText(`住宿 ${index + 1} 名稱`, acc.name, 45, yOffset + 32, {
      fontSize: 12,
      fontWeight: '500',
      color: '#333333',
      width: A5_WIDTH - 100,
    }))

    yOffset += 85
  })

  return elements
}

/**
 * 根據頁面類型轉換為 Canvas 元素
 */
export function pageToElements(
  pageType: string,
  data: {
    coverData: BrochureCoverData
    itinerary: Itinerary | null
    dayIndex?: number
    day?: DailyItineraryDay
    accommodations?: AccommodationInfo[]
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
      return accommodationToElements(accommodations, 'left')

    case 'accommodation-right':
      return accommodationToElements(accommodations, 'right')

    default:
      // 每日行程頁面
      if (pageType.startsWith('day-') && day !== undefined && dayIndex !== undefined) {
        const side = pageType.endsWith('-left') ? 'left' : 'right'
        if (side === 'left') {
          return dailyLeftToElements(dayIndex, day, itinerary?.departure_date)
        } else {
          return dailyRightToElements(dayIndex, day)
        }
      }
      return []
  }
}
