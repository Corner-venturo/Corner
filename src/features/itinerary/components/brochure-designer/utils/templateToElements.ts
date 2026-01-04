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
 * 封面頁轉元素
 */
export function coverToElements(data: BrochureCoverData): CanvasElement[] {
  const elements: CanvasElement[] = []

  // 1. 背景圖片
  if (data.coverImage) {
    elements.push(
      createImageElement('封面背景', data.coverImage, 0, 0, A5_WIDTH, A5_HEIGHT, 0)
    )
  } else {
    // 沒有圖片時用深色背景
    elements.push(
      createShapeElement('封面背景', 0, 0, A5_WIDTH, A5_HEIGHT, {
        fill: '#1e293b',
        zIndex: 0,
      })
    )
  }

  // 2. 漸層遮罩
  elements.push(
    createShapeElement('漸層遮罩', 0, 0, A5_WIDTH, A5_HEIGHT, {
      fill: 'rgba(0,0,0,0.4)',
      zIndex: 1,
      opacity: 0.6,
    })
  )

  // 3. 客戶名稱 (左上)
  if (data.clientName) {
    elements.push(
      createTextElement('客戶名稱', data.clientName, 20, 25, {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#ffffff',
        letterSpacing: 2,
        width: 300,
        height: 20,
        zIndex: 10,
      })
    )
  }

  // 4. 國家 (中央上方)
  if (data.country) {
    elements.push(
      createTextElement('國家', data.country, 0, 340, {
        fontSize: 14,
        fontWeight: '300',
        color: '#ffffff',
        textAlign: 'center',
        letterSpacing: 6,
        width: A5_WIDTH,
        height: 25,
        zIndex: 10,
      })
    )
  }

  // 5. 城市 (中央主標題)
  elements.push(
    createTextElement('城市', data.city || 'CITY', 0, 370, {
      fontSize: 48,
      fontWeight: '800',
      color: '#ffffff',
      textAlign: 'center',
      width: A5_WIDTH,
      height: 70,
      zIndex: 10,
    })
  )

  // 6. 旅遊日期 (中央下方)
  if (data.travelDates) {
    elements.push(
      createShapeElement('日期背景', (A5_WIDTH - 200) / 2, 455, 200, 32, {
        fill: 'rgba(255,255,255,0.15)',
        cornerRadius: 16,
        zIndex: 9,
      })
    )
    elements.push(
      createTextElement('旅遊日期', data.travelDates, 0, 460, {
        fontSize: 10,
        fontWeight: '500',
        color: '#ffffff',
        textAlign: 'center',
        width: A5_WIDTH,
        height: 22,
        zIndex: 10,
      })
    )
  }

  // 7. 底部分隔線
  elements.push(
    createShapeElement('分隔線', 40, 730, A5_WIDTH - 80, 1, {
      fill: 'rgba(255,255,255,0.5)',
      zIndex: 10,
    })
  )

  // 8. 公司名稱 (左下)
  elements.push(
    createTextElement('公司名稱', data.companyName || '角落旅行社', 20, 750, {
      fontSize: 12,
      fontWeight: '600',
      color: '#ffffff',
      width: 150,
      height: 20,
      zIndex: 10,
    })
  )

  // 9. 緊急聯絡 (右下)
  elements.push(
    createTextElement('緊急聯絡標籤', 'Emergency Contact', A5_WIDTH - 170, 740, {
      fontSize: 7,
      color: '#a0a0a0',
      textAlign: 'right',
      width: 150,
      height: 12,
      zIndex: 10,
    })
  )
  elements.push(
    createTextElement('緊急電話', data.emergencyContact || '', A5_WIDTH - 170, 752, {
      fontSize: 10,
      fontWeight: '600',
      color: '#ffffff',
      textAlign: 'right',
      width: 150,
      height: 16,
      zIndex: 10,
    })
  )
  elements.push(
    createTextElement('緊急信箱', data.emergencyEmail || '', A5_WIDTH - 170, 768, {
      fontSize: 8,
      color: '#a0a0a0',
      textAlign: 'right',
      width: 150,
      height: 14,
      zIndex: 10,
    })
  )

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
 * 目錄頁轉元素
 */
export function contentsToElements(
  data: BrochureCoverData,
  itinerary: Itinerary | null
): CanvasElement[] {
  const elements: CanvasElement[] = []
  const dailyItinerary = itinerary?.daily_itinerary || []

  // 背景
  elements.push(
    createShapeElement('目錄背景', 0, 0, A5_WIDTH, A5_HEIGHT, {
      fill: '#faf9f7',
      zIndex: 0,
    })
  )

  // 標題
  elements.push(
    createTextElement('目錄標題', 'CONTENTS', 40, 60, {
      fontSize: 24,
      fontWeight: '700',
      color: '#1a1a1a',
      letterSpacing: 4,
      width: 200,
      height: 35,
      zIndex: 1,
    })
  )

  // 旅程名稱
  elements.push(
    createTextElement('旅程名稱', `${data.country} ${data.city} Trip`, 40, 100, {
      fontSize: 12,
      color: '#666666',
      width: 300,
      height: 20,
      zIndex: 1,
    })
  )

  // 分隔線
  elements.push(
    createShapeElement('目錄分隔線', 40, 130, A5_WIDTH - 80, 2, {
      fill: '#c9aa7c',
      zIndex: 1,
    })
  )

  // 每日項目
  let yOffset = 160
  dailyItinerary.forEach((day, index) => {
    // 日期編號
    elements.push(
      createTextElement(`Day ${index + 1} 編號`, `Day ${index + 1}`, 40, yOffset, {
        fontSize: 14,
        fontWeight: '600',
        color: '#c9aa7c',
        width: 60,
        height: 22,
        zIndex: 1,
      })
    )

    // 日期標題
    const title = day.title || `第 ${index + 1} 天`
    elements.push(
      createTextElement(`Day ${index + 1} 標題`, title, 110, yOffset, {
        fontSize: 13,
        color: '#333333',
        width: A5_WIDTH - 180,
        height: 22,
        zIndex: 1,
      })
    )

    // 頁碼
    elements.push(
      createTextElement(`Day ${index + 1} 頁碼`, String(index * 2 + 5).padStart(2, '0'), A5_WIDTH - 60, yOffset, {
        fontSize: 12,
        color: '#999999',
        textAlign: 'right',
        width: 30,
        height: 22,
        zIndex: 1,
      })
    )

    yOffset += 40
  })

  return elements
}

/**
 * 總攬頁（左）轉元素
 */
export function overviewLeftToElements(
  data: BrochureCoverData,
  itinerary: Itinerary | null
): CanvasElement[] {
  const elements: CanvasElement[] = []

  // 背景
  elements.push(
    createShapeElement('總攬左背景', 0, 0, A5_WIDTH, A5_HEIGHT, {
      fill: '#faf9f7',
      zIndex: 0,
    })
  )

  // 標題區塊
  elements.push(
    createTextElement('總攬標題', 'OVERVIEW', 40, 50, {
      fontSize: 20,
      fontWeight: '700',
      color: '#1a1a1a',
      letterSpacing: 3,
      width: 150,
      height: 30,
      zIndex: 1,
    })
  )

  // 旅程名稱
  elements.push(
    createTextElement('旅程副標', `${data.country} ${data.city}`, 40, 85, {
      fontSize: 11,
      color: '#666666',
      width: 200,
      height: 18,
      zIndex: 1,
    })
  )

  // 總攬圖片區域
  if (data.overviewImage) {
    elements.push(
      createImageElement('總攬圖片', data.overviewImage, 30, 120, A5_WIDTH - 60, 350, 1)
    )
  } else {
    elements.push(
      createShapeElement('總攬圖片佔位', 30, 120, A5_WIDTH - 60, 350, {
        fill: '#e5e5e5',
        cornerRadius: 8,
        zIndex: 1,
      })
    )
  }

  // 行程摘要
  elements.push(
    createTextElement('行程摘要標題', '行程摘要', 40, 500, {
      fontSize: 14,
      fontWeight: '600',
      color: '#c9aa7c',
      width: 100,
      height: 22,
      zIndex: 1,
    })
  )

  const summary = itinerary?.description || '精彩的旅程即將展開...'
  elements.push(
    createTextElement('行程摘要內容', summary, 40, 530, {
      fontSize: 11,
      color: '#444444',
      lineHeight: 1.6,
      width: A5_WIDTH - 80,
      height: 200,
      zIndex: 1,
    })
  )

  return elements
}

/**
 * 總攬頁（右）轉元素
 */
export function overviewRightToElements(
  data: BrochureCoverData,
  itinerary: Itinerary | null
): CanvasElement[] {
  const elements: CanvasElement[] = []
  const dailyItinerary = itinerary?.daily_itinerary || []

  // 背景
  elements.push(
    createShapeElement('總攬右背景', 0, 0, A5_WIDTH, A5_HEIGHT, {
      fill: '#faf9f7',
      zIndex: 0,
    })
  )

  // 標題
  elements.push(
    createTextElement('行程概覽標題', 'ITINERARY', 40, 50, {
      fontSize: 16,
      fontWeight: '600',
      color: '#c9aa7c',
      letterSpacing: 2,
      width: 120,
      height: 25,
      zIndex: 1,
    })
  )

  // 每日摘要
  let yOffset = 90
  dailyItinerary.slice(0, 8).forEach((day, index) => {
    // 日期
    elements.push(
      createTextElement(`總攬 Day ${index + 1}`, `Day ${index + 1}`, 40, yOffset, {
        fontSize: 11,
        fontWeight: '600',
        color: '#1a1a1a',
        width: 50,
        height: 18,
        zIndex: 1,
      })
    )

    // 標題
    const title = day.title || `第 ${index + 1} 天行程`
    elements.push(
      createTextElement(`總攬 Day ${index + 1} 標題`, title, 100, yOffset, {
        fontSize: 10,
        color: '#666666',
        width: A5_WIDTH - 140,
        height: 18,
        zIndex: 1,
      })
    )

    yOffset += 35
  })

  return elements
}

/**
 * 每日行程頁（左）轉元素
 */
export function dailyLeftToElements(
  dayIndex: number,
  day: DailyItineraryDay,
  departureDate?: string,
  tripName?: string
): CanvasElement[] {
  const elements: CanvasElement[] = []

  // 背景
  elements.push(
    createShapeElement('每日左背景', 0, 0, A5_WIDTH, A5_HEIGHT, {
      fill: '#faf9f7',
      zIndex: 0,
    })
  )

  // Day 標題
  elements.push(
    createTextElement('Day 編號', `Day ${dayIndex + 1}`, 40, 40, {
      fontSize: 32,
      fontWeight: '800',
      color: '#c9aa7c',
      width: 150,
      height: 45,
      zIndex: 1,
    })
  )

  // 日期標題
  const title = day.title || `第 ${dayIndex + 1} 天`
  elements.push(
    createTextElement('日期標題', title, 40, 90, {
      fontSize: 14,
      fontWeight: '600',
      color: '#333333',
      width: A5_WIDTH - 80,
      height: 22,
      zIndex: 1,
    })
  )

  // 主圖 (取 images 的第一張)
  const mainImage = day.images?.[0]
  const mainImageSrc = typeof mainImage === 'string' ? mainImage : mainImage?.url
  if (mainImageSrc) {
    elements.push(
      createImageElement('每日主圖', mainImageSrc, 30, 130, A5_WIDTH - 60, 280, 1)
    )
  } else {
    elements.push(
      createShapeElement('每日主圖佔位', 30, 130, A5_WIDTH - 60, 280, {
        fill: '#e5e5e5',
        cornerRadius: 8,
        zIndex: 1,
      })
    )
  }

  // 活動列表
  let yOffset = 440
  const activities = day.activities || []
  activities.slice(0, 6).forEach((activity, index) => {
    const actTitle = activity.title || activity.description || `活動 ${index + 1}`
    elements.push(
      createTextElement(`活動 ${index + 1}`, actTitle, 50, yOffset, {
        fontSize: 11,
        color: '#444444',
        width: A5_WIDTH - 100,
        height: 20,
        zIndex: 1,
      })
    )
    yOffset += 30
  })

  return elements
}

/**
 * 每日行程頁（右）轉元素
 */
export function dailyRightToElements(
  dayIndex: number,
  day: DailyItineraryDay
): CanvasElement[] {
  const elements: CanvasElement[] = []

  // 背景
  elements.push(
    createShapeElement('每日右背景', 0, 0, A5_WIDTH, A5_HEIGHT, {
      fill: '#faf9f7',
      zIndex: 0,
    })
  )

  // 延續活動或景點介紹
  elements.push(
    createTextElement('詳細介紹標題', '景點介紹', 40, 40, {
      fontSize: 14,
      fontWeight: '600',
      color: '#c9aa7c',
      width: 100,
      height: 22,
      zIndex: 1,
    })
  )

  // 景點圖片網格 (2x2) - 使用 images 陣列
  const images = day.images || []
  const gridPositions = [
    { x: 30, y: 80 },
    { x: A5_WIDTH / 2 + 5, y: 80 },
    { x: 30, y: 280 },
    { x: A5_WIDTH / 2 + 5, y: 280 },
  ]

  gridPositions.forEach((pos, i) => {
    const img = images[i]
    const imgSrc = typeof img === 'string' ? img : img?.url
    if (imgSrc) {
      elements.push(
        createImageElement(`景點圖 ${i + 1}`, imgSrc, pos.x, pos.y, (A5_WIDTH - 70) / 2, 180, 1)
      )
    } else {
      elements.push(
        createShapeElement(`景點圖佔位 ${i + 1}`, pos.x, pos.y, (A5_WIDTH - 70) / 2, 180, {
          fill: '#eeeeee',
          cornerRadius: 6,
          zIndex: 1,
        })
      )
    }
  })

  // 備註區域
  elements.push(
    createTextElement('備註標題', '備註', 40, 500, {
      fontSize: 12,
      fontWeight: '600',
      color: '#666666',
      width: 60,
      height: 20,
      zIndex: 1,
    })
  )

  const notes = day.highlight || day.description || '請注意當地時間與天氣變化'
  elements.push(
    createTextElement('備註內容', notes, 40, 530, {
      fontSize: 10,
      color: '#888888',
      lineHeight: 1.5,
      width: A5_WIDTH - 80,
      height: 100,
      zIndex: 1,
    })
  )

  return elements
}

/**
 * 住宿頁（左）轉元素
 */
export function accommodationLeftToElements(
  accommodations: Array<{ name: string; image?: string; days?: number[] }>
): CanvasElement[] {
  const elements: CanvasElement[] = []

  // 背景
  elements.push(
    createShapeElement('住宿左背景', 0, 0, A5_WIDTH, A5_HEIGHT, {
      fill: '#faf9f7',
      zIndex: 0,
    })
  )

  // 標題
  elements.push(
    createTextElement('住宿標題', 'ACCOMMODATION', 40, 50, {
      fontSize: 20,
      fontWeight: '700',
      color: '#1a1a1a',
      letterSpacing: 3,
      width: 220,
      height: 30,
      zIndex: 1,
    })
  )

  // 住宿列表
  let yOffset = 100
  accommodations.slice(0, 4).forEach((acc, index) => {
    // 住宿圖片
    if (acc.image) {
      elements.push(
        createImageElement(`住宿圖 ${index + 1}`, acc.image, 30, yOffset, A5_WIDTH - 60, 120, 1)
      )
    } else {
      elements.push(
        createShapeElement(`住宿圖佔位 ${index + 1}`, 30, yOffset, A5_WIDTH - 60, 120, {
          fill: '#e5e5e5',
          cornerRadius: 8,
          zIndex: 1,
        })
      )
    }

    // 住宿名稱
    elements.push(
      createTextElement(`住宿名稱 ${index + 1}`, acc.name, 40, yOffset + 130, {
        fontSize: 12,
        fontWeight: '600',
        color: '#333333',
        width: A5_WIDTH - 80,
        height: 20,
        zIndex: 1,
      })
    )

    // 入住天數
    const daysText = acc.days?.length ? `Day ${acc.days.join(', ')}` : ''
    elements.push(
      createTextElement(`住宿天數 ${index + 1}`, daysText, 40, yOffset + 152, {
        fontSize: 10,
        color: '#888888',
        width: 200,
        height: 16,
        zIndex: 1,
      })
    )

    yOffset += 180
  })

  return elements
}

/**
 * 住宿頁（右）轉元素
 */
export function accommodationRightToElements(
  accommodations: Array<{ name: string; image?: string; days?: number[] }>
): CanvasElement[] {
  const elements: CanvasElement[] = []

  // 背景
  elements.push(
    createShapeElement('住宿右背景', 0, 0, A5_WIDTH, A5_HEIGHT, {
      fill: '#faf9f7',
      zIndex: 0,
    })
  )

  // 延續的住宿列表（第5個以後）
  let yOffset = 50
  accommodations.slice(4, 8).forEach((acc, index) => {
    // 住宿圖片
    if (acc.image) {
      elements.push(
        createImageElement(`住宿圖 ${index + 5}`, acc.image, 30, yOffset, A5_WIDTH - 60, 120, 1)
      )
    } else {
      elements.push(
        createShapeElement(`住宿圖佔位 ${index + 5}`, 30, yOffset, A5_WIDTH - 60, 120, {
          fill: '#e5e5e5',
          cornerRadius: 8,
          zIndex: 1,
        })
      )
    }

    // 住宿名稱
    elements.push(
      createTextElement(`住宿名稱 ${index + 5}`, acc.name, 40, yOffset + 130, {
        fontSize: 12,
        fontWeight: '600',
        color: '#333333',
        width: A5_WIDTH - 80,
        height: 20,
        zIndex: 1,
      })
    )

    yOffset += 180
  })

  // 如果沒有延續的住宿，顯示備註區域
  if (accommodations.length <= 4) {
    elements.push(
      createTextElement('住宿備註標題', '住宿須知', 40, 50, {
        fontSize: 14,
        fontWeight: '600',
        color: '#c9aa7c',
        width: 100,
        height: 22,
        zIndex: 1,
      })
    )

    elements.push(
      createTextElement('住宿備註內容', '• 入住時間：15:00 後\n• 退房時間：11:00 前\n• 請攜帶護照辦理入住', 40, 85, {
        fontSize: 11,
        color: '#666666',
        lineHeight: 1.8,
        width: A5_WIDTH - 80,
        height: 150,
        zIndex: 1,
      })
    )
  }

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
