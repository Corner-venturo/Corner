/**
 * 日系風格 - 當日行程範本
 *
 * 單頁詳細行程，包含：
 * - 當日封面圖片（上半部）
 * - 日期顯示
 * - 時間軸行程
 * - 餐食資訊
 */
import type { PageTemplate, TemplateData, DailyDetailData, TimelineItem } from './types'
import type {
  CanvasElement,
  TextElement,
  ShapeElement,
  ImageElement,
  IconElement,
  GroupElement,
  MaterialIconName,
} from '@/features/designer/components/types'

// A5 尺寸
const A5_WIDTH = 559
const A5_HEIGHT = 794

// 顏色定義
const COLORS = {
  ink: '#3e3a36',
  inkLight: '#757068',
  primary: '#8e8070',
  accent: '#b8a896',
  paperWhite: '#fcfbf9',
  background: '#f4f1ea',
}

// 餐食圖標對應
function getMealIcon(mealType: 'breakfast' | 'lunch' | 'dinner'): MaterialIconName {
  if (mealType === 'breakfast') return 'coffee'
  if (mealType === 'lunch') return 'restaurant'
  return 'dinner_dining'
}

// 格式化日期
function formatDate(dateStr: string): { month: string; day: string; weekday: string } {
  if (!dateStr) {
    return { month: 'Oct', day: '01', weekday: 'Mon.' }
  }

  try {
    const date = new Date(dateStr)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const weekdays = ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.']

    return {
      month: months[date.getMonth()] || 'Oct',
      day: String(date.getDate()).padStart(2, '0'),
      weekday: weekdays[date.getDay()] || 'Mon.',
    }
  } catch {
    return { month: 'Oct', day: '01', weekday: 'Mon.' }
  }
}

export const japaneseStyleV1Daily: PageTemplate = {
  id: 'japanese-style-v1-daily',
  name: '日系風格 - 當日行程',
  description: '單頁詳細行程，含封面圖片、時間軸、餐食資訊',
  thumbnailUrl: '/thumbnails/japanese-style-v1-daily.jpg',
  category: 'daily',

  generateElements: (data: TemplateData): CanvasElement[] => {
    const elements: CanvasElement[] = []

    // 取得當日資料（從 currentDayIndex 指定）
    const dayIndex = data.currentDayIndex || 0

    // 輔助函數：生成帶 dayIndex 的唯一元素 ID
    const elId = (name: string) => `el-daily-${name}-d${dayIndex}`
    const dayDetail = data.dailyDetails?.[dayIndex] || {
      dayNumber: dayIndex + 1,
      date: '',
      title: '行程標題',
      coverImage: undefined,
      timeline: [],
      meals: { breakfast: '', lunch: '', dinner: '' },
    }

    const { month, day, weekday } = formatDate(dayDetail.date || '')
    const coverHeight = Math.floor(A5_HEIGHT * 0.42) // 42% 高度給封面

    // === 封面圖片區域 ===
    if (dayDetail.coverImage) {
      const coverImage: ImageElement = {
        id: elId('cover'),
        type: 'image',
        name: '當日封面',
        x: 0,
        y: 0,
        width: A5_WIDTH,
        height: coverHeight,
        zIndex: 1,
        rotation: 0,
        opacity: 0.85,
        locked: true, // 鎖定位置，使用「調整位置」按鈕來調整圖片
        visible: true,
        src: dayDetail.coverImage,
        objectFit: 'cover',
      }
      elements.push(coverImage)

      // 日期區域的半透明背景（讓白色文字更清晰）
      const dateBackdrop: ShapeElement = {
        id: elId('date-backdrop'),
        type: 'shape',
        name: '日期背景',
        variant: 'rectangle',
        x: 20,
        y: 18,
        width: 80,
        height: 90,
        zIndex: 2,
        rotation: 0,
        opacity: 0.25,
        locked: false,
        visible: true,
        fill: '#000000',
        stroke: 'transparent',
        strokeWidth: 0,
        cornerRadius: 8,
      }
      elements.push(dateBackdrop)
    } else {
      // 佔位區域
      const placeholder: ShapeElement = {
        id: elId('cover-placeholder'),
        type: 'shape',
        name: '封面佔位',
        variant: 'rectangle',
        x: 0,
        y: 0,
        width: A5_WIDTH,
        height: coverHeight,
        zIndex: 1,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        fill: '#e0deda',
        stroke: 'transparent',
        strokeWidth: 0,
      }
      elements.push(placeholder)

      // 上傳提示
      const uploadHint: TextElement = {
        id: elId('upload-hint'),
        type: 'text',
        name: '上傳提示',
        x: 0,
        y: coverHeight / 2 - 15,
        width: A5_WIDTH,
        height: 30,
        zIndex: 2,
        rotation: 0,
        opacity: 0.4,
        locked: false,
        visible: true,
        content: '點擊上傳當日封面圖片',
        style: {
          fontFamily: 'Noto Sans TC',
          fontSize: 14,
          fontWeight: '500',
          fontStyle: 'normal',
          textAlign: 'center',
          lineHeight: 1.4,
          letterSpacing: 0.5,
          color: COLORS.ink,
        },
      }
      elements.push(uploadHint)
    }

    // === 日期顯示（左上角） ===
    const dateX = 32
    const dateY = 28

    // 月份
    const monthText: TextElement = {
      id: elId('month'),
      type: 'text',
      name: '月份',
      x: dateX,
      y: dateY,
      width: 100,
      height: 24,
      zIndex: 10,
      rotation: 0,
      opacity: 0.9,
      locked: false,
      visible: true,
      content: month,
      style: {
        fontFamily: 'Zen Old Mincho',
        fontSize: 16,
        fontWeight: '300',
        fontStyle: 'normal',
        textAlign: 'left',
        lineHeight: 1.2,
        letterSpacing: 3,
        color: '#ffffff',
      },
    }
    elements.push(monthText)

    // 日期數字
    const dayText: TextElement = {
      id: elId('day'),
      type: 'text',
      name: '日期',
      x: dateX,
      y: dateY + 22,
      width: 80,
      height: 48,
      zIndex: 10,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      content: day,
      style: {
        fontFamily: 'Zen Old Mincho',
        fontSize: 36,
        fontWeight: '400',
        fontStyle: 'normal',
        textAlign: 'left',
        lineHeight: 1.0,
        letterSpacing: 1,
        color: '#ffffff',
      },
    }
    elements.push(dayText)

    // 星期
    const weekdayText: TextElement = {
      id: elId('weekday'),
      type: 'text',
      name: '星期',
      x: dateX,
      y: dateY + 68,
      width: 60,
      height: 16,
      zIndex: 10,
      rotation: 0,
      opacity: 0.8,
      locked: false,
      visible: true,
      content: weekday,
      style: {
        fontFamily: 'Zen Old Mincho',
        fontSize: 11,
        fontWeight: '400',
        fontStyle: 'normal',
        textAlign: 'left',
        lineHeight: 1.2,
        letterSpacing: 2,
        color: '#ffffff',
      },
    }
    elements.push(weekdayText)

    // === 內容區域 ===
    const contentY = coverHeight + 24
    const contentPadding = 40

    // Day 標籤
    const dayBadge: ShapeElement = {
      id: elId('badge-bg'),
      type: 'shape',
      name: 'Day標籤背景',
      variant: 'rectangle',
      x: contentPadding,
      y: contentY,
      width: 52,
      height: 20,
      zIndex: 3,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      fill: COLORS.primary,
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 2,
    }
    elements.push(dayBadge)

    const dayBadgeText: TextElement = {
      id: elId('badge-text'),
      type: 'text',
      name: 'Day標籤',
      x: contentPadding,
      y: contentY + 3,
      width: 52,
      height: 16,
      zIndex: 4,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      content: `DAY ${String(dayDetail.dayNumber || dayIndex + 1).padStart(2, '0')}`,
      style: {
        fontFamily: 'Noto Sans TC',
        fontSize: 9,
        fontWeight: '700',
        fontStyle: 'normal',
        textAlign: 'center',
        lineHeight: 1.2,
        letterSpacing: 1,
        color: '#ffffff',
      },
    }
    elements.push(dayBadgeText)

    // Day 標籤後的橫線
    const badgeLine: ShapeElement = {
      id: elId('badge-line'),
      type: 'shape',
      name: '標籤橫線',
      variant: 'rectangle',
      x: contentPadding + 60,
      y: contentY + 9,
      width: A5_WIDTH - contentPadding * 2 - 60,
      height: 1,
      zIndex: 3,
      rotation: 0,
      opacity: 0.2,
      locked: false,
      visible: true,
      fill: COLORS.primary,
      stroke: 'transparent',
      strokeWidth: 0,
    }
    elements.push(badgeLine)

    // 標題（支援多行）
    const titleContent = dayDetail.title || '行程標題'
    // 估算標題行數（約每 18 個字換行）
    const estimatedTitleLines = Math.ceil(titleContent.length / 18)
    const titleHeight = Math.max(28, estimatedTitleLines * 26)

    const titleText: TextElement = {
      id: elId('title'),
      type: 'text',
      name: '當日標題',
      x: contentPadding,
      y: contentY + 28,
      width: A5_WIDTH - contentPadding * 2,
      height: titleHeight,
      zIndex: 4,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      content: titleContent,
      style: {
        fontFamily: 'Noto Serif TC',
        fontSize: 16,
        fontWeight: '500',
        fontStyle: 'normal',
        textAlign: 'left',
        lineHeight: 1.5,
        letterSpacing: 0.3,
        color: COLORS.ink,
      },
    }
    elements.push(titleText)

    // === 時間軸區域 ===
    const timelineStartY = contentY + 32 + titleHeight + 16
    const timelineX = contentPadding + 8
    const timeline = dayDetail.timeline || []

    // 時間軸垂直線
    const timelineLine: ShapeElement = {
      id: elId('timeline-line'),
      type: 'shape',
      name: '時間軸線',
      variant: 'rectangle',
      x: timelineX + 52,
      y: timelineStartY + 12,
      width: 1,
      height: Math.min(timeline.length * 36, 280),
      zIndex: 3,
      rotation: 0,
      opacity: 0.25,
      locked: false,
      visible: true,
      fill: COLORS.primary,
      stroke: 'transparent',
      strokeWidth: 0,
    }
    elements.push(timelineLine)

    // 生成時間軸項目（群組，不限制數量，使用者可自行調整位置）
    timeline.forEach((item, idx) => {
      const itemY = timelineStartY + idx * 36

      // 時間（相對於群組位置）
      const timeText: TextElement = {
        id: elId(`time-${idx}`),
        type: 'text',
        name: `時間${idx + 1}`,
        x: 0,
        y: 0,
        width: 45,
        height: 20,
        zIndex: 4,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        content: item.time || '',
        style: {
          fontFamily: 'Noto Sans TC',
          fontSize: 10,
          fontWeight: '500',
          fontStyle: 'normal',
          textAlign: 'right',
          lineHeight: 1.6,
          letterSpacing: 0,
          color: COLORS.primary,
        },
      }

      // 圓點（相對於群組位置）
      const dot: ShapeElement = {
        id: elId(`dot-${idx}`),
        type: 'shape',
        name: `圓點${idx + 1}`,
        variant: 'circle',
        x: 50,
        y: 5,
        width: 6,
        height: 6,
        zIndex: 5,
        rotation: 0,
        opacity: item.isHighlight ? 1 : 0.6,
        locked: false,
        visible: true,
        fill: COLORS.primary,
        stroke: 'transparent',
        strokeWidth: 0,
      }

      // 活動內容（相對於群組位置）
      const activityText: TextElement = {
        id: elId(`activity-${idx}`),
        type: 'text',
        name: `活動${idx + 1}`,
        x: 64,
        y: 0,
        width: A5_WIDTH - contentPadding - timelineX - 80,
        height: 32,
        zIndex: 4,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        content: item.activity || '',
        style: {
          fontFamily: 'Noto Sans TC',
          fontSize: 11,
          fontWeight: item.isHighlight ? '700' : '400',
          fontStyle: 'normal',
          textAlign: 'left',
          lineHeight: 1.5,
          letterSpacing: 0.3,
          color: COLORS.ink,
        },
      }

      // 創建群組
      const timelineGroup: GroupElement = {
        id: elId(`timeline-item-${idx}`),
        type: 'group',
        name: `時間軸項目${idx + 1}`,
        x: timelineX,
        y: itemY,
        width: A5_WIDTH - contentPadding - timelineX,
        height: 32,
        zIndex: 4,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        children: [timeText, dot, activityText],
      }
      elements.push(timelineGroup)
    })

    // === 底部餐食區域 ===
    const footerY = A5_HEIGHT - 70

    // 分隔線
    const footerLine: ShapeElement = {
      id: elId('footer-line'),
      type: 'shape',
      name: '底部分隔線',
      variant: 'rectangle',
      x: contentPadding,
      y: footerY,
      width: A5_WIDTH - contentPadding * 2,
      height: 1,
      zIndex: 3,
      rotation: 0,
      opacity: 0.15,
      locked: false,
      visible: true,
      fill: COLORS.primary,
      stroke: 'transparent',
      strokeWidth: 0,
    }
    elements.push(footerLine)

    // 餐食資訊
    const meals = dayDetail.meals || {}
    const mealTypes: Array<{ type: 'breakfast' | 'lunch' | 'dinner'; label: string; content: string }> = [
      { type: 'breakfast', label: '早', content: meals.breakfast || '' },
      { type: 'lunch', label: '午', content: meals.lunch || '' },
      { type: 'dinner', label: '晚', content: meals.dinner || '' },
    ]

    const mealWidth = (A5_WIDTH - contentPadding * 2) / 3
    mealTypes.forEach((meal, idx) => {
      if (!meal.content) return

      const mealX = contentPadding + idx * mealWidth
      const mealY = footerY + 12

      // 圖標
      const mealIcon: IconElement = {
        id: elId(`meal-${meal.type}-icon`),
        type: 'icon',
        name: `${meal.label}餐圖標`,
        x: mealX,
        y: mealY,
        width: 14,
        height: 14,
        zIndex: 4,
        rotation: 0,
        opacity: 0.7,
        locked: false,
        visible: true,
        icon: getMealIcon(meal.type),
        size: 14,
        color: COLORS.primary,
      }
      elements.push(mealIcon)

      // 文字
      const mealText: TextElement = {
        id: elId(`meal-${meal.type}-text`),
        type: 'text',
        name: `${meal.label}餐`,
        x: mealX + 18,
        y: mealY,
        width: mealWidth - 24,
        height: 16,
        zIndex: 4,
        rotation: 0,
        opacity: 0.8,
        locked: false,
        visible: true,
        content: meal.content,
        style: {
          fontFamily: 'Noto Sans TC',
          fontSize: 9,
          fontWeight: '500',
          fontStyle: 'normal',
          textAlign: 'left',
          lineHeight: 1.6,
          letterSpacing: 0.3,
          color: COLORS.inkLight,
        },
      }
      elements.push(mealText)
    })

    // 頁碼
    const pageNumber = (data.currentDayIndex || 0) + 3 // 封面=1, 總覽=2, Day1=3...
    const pageText: TextElement = {
      id: elId('page'),
      type: 'text',
      name: '頁碼',
      x: A5_WIDTH - contentPadding - 30,
      y: footerY + 36,
      width: 30,
      height: 14,
      zIndex: 4,
      rotation: 0,
      opacity: 0.6,
      locked: false,
      visible: true,
      content: `p. ${String(pageNumber).padStart(2, '0')}`,
      style: {
        fontFamily: 'Zen Old Mincho',
        fontSize: 8,
        fontWeight: '400',
        fontStyle: 'italic',
        textAlign: 'right',
        lineHeight: 1.2,
        letterSpacing: 0,
        color: COLORS.primary,
      },
    }
    elements.push(pageText)

    // 行程名稱（左下角）
    const tripName: TextElement = {
      id: elId('trip-name'),
      type: 'text',
      name: '行程名稱',
      x: contentPadding,
      y: footerY + 36,
      width: 150,
      height: 14,
      zIndex: 4,
      rotation: 0,
      opacity: 0.6,
      locked: false,
      visible: true,
      content: data.mainTitle || 'Trip 2024',
      style: {
        fontFamily: 'Zen Old Mincho',
        fontSize: 8,
        fontWeight: '400',
        fontStyle: 'italic',
        textAlign: 'left',
        lineHeight: 1.2,
        letterSpacing: 0,
        color: COLORS.primary,
      },
    }
    elements.push(tripName)

    return elements
  },
}
