/**
 * 日系風格 - 行程總覽範本
 *
 * 簡約、留白、優雅的日式設計風格
 * 用於顯示多日行程總覽
 *
 * 參考設計：五天行程總覽（和紙質感）
 */
import type { PageTemplate, TemplateData } from './types'
import type { CanvasElement, TextElement, ShapeElement, IconElement, MaterialIconName } from '@/features/designer/components/types'

// A5 尺寸
const A5_WIDTH = 559
const A5_HEIGHT = 794

// 中文數字
const CHINESE_NUMERALS = ['壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖', '拾']

// 顏色定義（日系配色）
const COLORS = {
  ink: '#3e3a36',        // 主要文字
  inkLight: '#757068',   // 次要文字
  primary: '#8e8070',    // 主題色（灰褐）
  accent: '#b8a896',     // 強調色（淺褐）
}

// 餐食圖標對應（返回 MaterialIconName 類型，用於 IconElement）
function getMealIcon(mealType: 'breakfast' | 'lunch' | 'dinner', mealContent: string): MaterialIconName {
  const content = mealContent.toLowerCase()

  // 特定內容對應
  if (content.includes('溫暖的家') || content.includes('家')) return 'bakery_dining'
  if (content.includes('機上') || content.includes('飛機')) return 'flight_class'
  if (content.includes('自理')) return 'restaurant'
  if (content.includes('拉麵') || content.includes('日式') || content.includes('定食')) return 'ramen_dining'
  if (content.includes('湯') || content.includes('豆腐')) return 'soup_kitchen'
  if (content.includes('鍋') || content.includes('涮涮')) return 'skillet'
  if (content.includes('便當') || content.includes('釜飯') || content.includes('bento')) return 'bento'
  if (content.includes('飯') && !content.includes('飯店')) return 'rice_bowl'

  // 預設圖標（依餐食類型）
  if (mealType === 'breakfast') return 'coffee'
  if (mealType === 'lunch') return 'restaurant'
  return 'dinner_dining'
}

export const japaneseStyleV1Itinerary: PageTemplate = {
  id: 'japanese-style-v1-itinerary',
  name: '日系風格 - 行程總覽',
  description: '簡約、留白、優雅的日式設計風格，顯示多日行程總覽',
  thumbnailUrl: '/thumbnails/japanese-style-v1-itinerary.jpg',
  category: 'daily',

  generateElements: (data: TemplateData): CanvasElement[] => {
    const elements: CanvasElement[] = []
    const days = data.dailyItineraries?.length || 5

    // === 頁面標題區 ===

    // 1. 左上角裝飾線（L 形）
    const cornerTopLeft: ShapeElement = {
      id: 'el-corner-tl',
      type: 'shape',
      name: '左上角裝飾',
      variant: 'rectangle',
      x: 32,
      y: 28,
      width: 28,
      height: 1,
      zIndex: 1,
      rotation: 0,
      opacity: 0.25,
      locked: false,
      visible: true,
      fill: COLORS.primary,
    }
    elements.push(cornerTopLeft)

    const cornerTopLeftV: ShapeElement = {
      id: 'el-corner-tl-v',
      type: 'shape',
      name: '左上角裝飾垂直',
      variant: 'rectangle',
      x: 32,
      y: 28,
      width: 1,
      height: 28,
      zIndex: 1,
      rotation: 0,
      opacity: 0.25,
      locked: false,
      visible: true,
      fill: COLORS.primary,
    }
    elements.push(cornerTopLeftV)

    // 2. 右上角裝飾線（L 形）
    const cornerTopRight: ShapeElement = {
      id: 'el-corner-tr',
      type: 'shape',
      name: '右上角裝飾',
      variant: 'rectangle',
      x: A5_WIDTH - 60,
      y: 28,
      width: 28,
      height: 1,
      zIndex: 1,
      rotation: 0,
      opacity: 0.25,
      locked: false,
      visible: true,
      fill: COLORS.primary,
    }
    elements.push(cornerTopRight)

    const cornerTopRightV: ShapeElement = {
      id: 'el-corner-tr-v',
      type: 'shape',
      name: '右上角裝飾垂直',
      variant: 'rectangle',
      x: A5_WIDTH - 33,
      y: 28,
      width: 1,
      height: 28,
      zIndex: 1,
      rotation: 0,
      opacity: 0.25,
      locked: false,
      visible: true,
      fill: COLORS.primary,
    }
    elements.push(cornerTopRightV)

    // 3. 主標題「五天行程總覽」（參考 HTML: text-3xl tracking-[0.2em] font-light）
    const mainTitle: TextElement = {
      id: 'el-main-title',
      type: 'text',
      name: '頁面標題',
      x: 0,
      y: 44,
      width: A5_WIDTH,
      height: 45,
      zIndex: 2,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      content: '行程總覽',
      style: {
        fontFamily: 'Zen Old Mincho',
        fontSize: 30,
        fontWeight: '400',
        fontStyle: 'normal',
        textAlign: 'center',
        lineHeight: 1.2,
        letterSpacing: 6, // 0.2em ≈ 6px at 30px
        color: COLORS.ink,
      },
    }
    elements.push(mainTitle)

    // 4. 標題底線（w-16 = 64px）
    const titleUnderline: ShapeElement = {
      id: 'el-title-underline',
      type: 'shape',
      name: '標題底線',
      variant: 'rectangle',
      x: (A5_WIDTH - 64) / 2,
      y: 92,
      width: 64,
      height: 1,
      zIndex: 2,
      rotation: 0,
      opacity: 0.4,
      locked: false,
      visible: true,
      fill: COLORS.primary,
    }
    elements.push(titleUnderline)

    // === 相關資訊區 ===
    let infoY = 108

    // 5. 集合時間與領隊資訊（使用 Material Symbols 圖標）
    if (data.meetingTime || data.meetingPlace || data.leaderName) {
      let infoX = 100 // 起始 X 位置

      // 集合資訊
      if (data.meetingTime || data.meetingPlace) {
        const meeting = [data.meetingTime, data.meetingPlace].filter(Boolean).join(' ')

        // schedule 圖標（使用 SVG Path）
        const scheduleIcon: IconElement = {
          id: 'el-schedule-icon',
          type: 'icon',
          name: '集合圖標',
          x: infoX,
          y: infoY,
          width: 13,
          height: 13,
          zIndex: 3,
          rotation: 0,
          opacity: 0.6,
          locked: false,
          visible: true,
          icon: 'schedule',
          size: 13,
          color: COLORS.primary,
        }
        elements.push(scheduleIcon)

        // 集合文字
        const meetingText: TextElement = {
          id: 'el-meeting-text',
          type: 'text',
          name: '集合文字',
          x: infoX + 18,
          y: infoY,
          width: 150,
          height: 16,
          zIndex: 3,
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
          content: `集合 ${meeting}`,
          style: {
            fontFamily: 'Noto Serif TC',
            fontSize: 10,
            fontWeight: '400',
            fontStyle: 'normal',
            textAlign: 'left',
            lineHeight: 1.5,
            letterSpacing: 0.8,
            color: COLORS.inkLight,
          },
        }
        elements.push(meetingText)
        infoX += 180
      }

      // 領隊資訊
      if (data.leaderName) {
        // badge 圖標（使用 SVG Path）
        const badgeIcon: IconElement = {
          id: 'el-badge-icon',
          type: 'icon',
          name: '領隊圖標',
          x: infoX,
          y: infoY,
          width: 13,
          height: 13,
          zIndex: 3,
          rotation: 0,
          opacity: 0.6,
          locked: false,
          visible: true,
          icon: 'badge',
          size: 13,
          color: COLORS.primary,
        }
        elements.push(badgeIcon)

        // 領隊文字
        const leaderText: TextElement = {
          id: 'el-leader-text',
          type: 'text',
          name: '領隊文字',
          x: infoX + 18,
          y: infoY,
          width: 180,
          height: 16,
          zIndex: 3,
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
          content: data.leaderPhone ? `領隊 ${data.leaderName}  ${data.leaderPhone}` : `領隊 ${data.leaderName}`,
          style: {
            fontFamily: 'Noto Serif TC',
            fontSize: 10,
            fontWeight: '400',
            fontStyle: 'normal',
            textAlign: 'left',
            lineHeight: 1.5,
            letterSpacing: 0.8,
            color: COLORS.inkLight,
          },
        }
        elements.push(leaderText)
      }

      infoY += 24
    }

    // 6. 航班資訊（參考 HTML: 框線標籤樣式）
    if (data.outboundFlight || data.returnFlight) {
      const flightY = infoY

      // 航班區塊頂部分隔線
      const flightDivider: ShapeElement = {
        id: 'el-flight-divider',
        type: 'shape',
        name: '航班分隔線',
        variant: 'rectangle',
        x: (A5_WIDTH - 320) / 2,
        y: flightY,
        width: 320,
        height: 1,
        zIndex: 3,
        rotation: 0,
        opacity: 0.1,
        locked: false,
        visible: true,
        fill: COLORS.primary,
      }
      elements.push(flightDivider)

      // 計算航班顯示的起始 X 位置（居中對齊）
      const flightStartX = 100

      if (data.outboundFlight) {
        // 去程標籤框
        const outboundLabelBox: ShapeElement = {
          id: 'el-outbound-label-box',
          type: 'shape',
          name: '去程標籤框',
          variant: 'rectangle',
          x: flightStartX,
          y: flightY + 8,
          width: 28,
          height: 14,
          zIndex: 3,
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
          fill: 'rgba(142, 128, 112, 0.05)', // bg-primary/5
          stroke: 'rgba(142, 128, 112, 0.3)', // border-primary/30
          strokeWidth: 1,
          cornerRadius: 2,
        }
        elements.push(outboundLabelBox)

        // 去程標籤文字
        const outboundLabel: TextElement = {
          id: 'el-outbound-label',
          type: 'text',
          name: '去程標籤',
          x: flightStartX,
          y: flightY + 9,
          width: 28,
          height: 12,
          zIndex: 4,
          rotation: 0,
          opacity: 0.8,
          locked: false,
          visible: true,
          content: '去程',
          style: {
            fontFamily: 'Noto Sans TC',
            fontSize: 9,
            fontWeight: '400',
            fontStyle: 'normal',
            textAlign: 'center',
            lineHeight: 1,
            letterSpacing: 0,
            color: COLORS.primary,
          },
        }
        elements.push(outboundLabel)

        // 去程航班詳情
        const outboundFlight: TextElement = {
          id: 'el-outbound-flight',
          type: 'text',
          name: '去程航班',
          x: flightStartX + 34,
          y: flightY + 8,
          width: A5_WIDTH - flightStartX - 80,
          height: 16,
          zIndex: 3,
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
          content: data.outboundFlight,
          style: {
            fontFamily: 'Noto Serif TC',
            fontSize: 10,
            fontWeight: '400',
            fontStyle: 'normal',
            textAlign: 'left',
            lineHeight: 1.5,
            letterSpacing: 0.5,
            color: COLORS.inkLight,
          },
        }
        elements.push(outboundFlight)
      }

      if (data.returnFlight) {
        const returnFlightY = data.outboundFlight ? flightY + 26 : flightY + 8

        // 回程標籤框
        const returnLabelBox: ShapeElement = {
          id: 'el-return-label-box',
          type: 'shape',
          name: '回程標籤框',
          variant: 'rectangle',
          x: flightStartX,
          y: returnFlightY,
          width: 28,
          height: 14,
          zIndex: 3,
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
          fill: 'rgba(142, 128, 112, 0.05)', // bg-primary/5
          stroke: 'rgba(142, 128, 112, 0.3)', // border-primary/30
          strokeWidth: 1,
          cornerRadius: 2,
        }
        elements.push(returnLabelBox)

        // 回程標籤文字
        const returnLabel: TextElement = {
          id: 'el-return-label',
          type: 'text',
          name: '回程標籤',
          x: flightStartX,
          y: returnFlightY + 1,
          width: 28,
          height: 12,
          zIndex: 4,
          rotation: 0,
          opacity: 0.8,
          locked: false,
          visible: true,
          content: '回程',
          style: {
            fontFamily: 'Noto Sans TC',
            fontSize: 9,
            fontWeight: '400',
            fontStyle: 'normal',
            textAlign: 'center',
            lineHeight: 1,
            letterSpacing: 0,
            color: COLORS.primary,
          },
        }
        elements.push(returnLabel)

        // 回程航班詳情
        const returnFlight: TextElement = {
          id: 'el-return-flight',
          type: 'text',
          name: '回程航班',
          x: flightStartX + 34,
          y: returnFlightY,
          width: A5_WIDTH - flightStartX - 80,
          height: 16,
          zIndex: 3,
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
          content: data.returnFlight,
          style: {
            fontFamily: 'Noto Serif TC',
            fontSize: 10,
            fontWeight: '400',
            fontStyle: 'normal',
            textAlign: 'left',
            lineHeight: 1.5,
            letterSpacing: 0.5,
            color: COLORS.inkLight,
          },
        }
        elements.push(returnFlight)
      }

      infoY += 50
    }

    // === 每日行程區 ===
    const itineraryStartY = infoY + 8
    const itineraryEndY = A5_HEIGHT - 50
    const availableHeight = itineraryEndY - itineraryStartY
    const dayHeight = Math.floor(availableHeight / days)

    // 7. 左側漸變線 - 使用橢圓實現「中間粗、兩端細」的效果
    // 橢圓天然具有這種視覺特性，比矩形漸層更自然
    const leftLine: ShapeElement = {
      id: 'el-left-line',
      type: 'shape',
      name: '左側裝飾線',
      variant: 'ellipse', // 橢圓：寬度窄、高度長 = 紡錘形
      x: 45,
      y: itineraryStartY + 4,
      width: 3, // 橢圓寬度（中間最粗處約 3px）
      height: availableHeight - 8, // 橢圓高度
      zIndex: 4,
      rotation: 0,
      opacity: 1,
      locked: false, // 允許選取調整
      visible: true,
      fill: 'rgba(142, 128, 112, 0.2)', // primary/20 效果
      stroke: 'transparent',
      strokeWidth: 0,
    }
    elements.push(leftLine)

    // 8. 生成每日行程（參考 HTML 樣式）
    const dailyItineraries = data.dailyItineraries || []

    for (let i = 0; i < days; i++) {
      const dayData = dailyItineraries[i] || {
        dayNumber: i + 1,
        title: '行程內容',
        meals: { breakfast: '飯店內', lunch: '自理', dinner: '自理' },
        accommodation: '住宿飯店',
      }

      const dayY = itineraryStartY + i * dayHeight
      const dayNum = CHINESE_NUMERALS[i] || `${i + 1}`

      // 天數標記（中文數字）- font-serif text-lg font-medium
      const dayLabel: TextElement = {
        id: `el-day-${i + 1}-label`,
        type: 'text',
        name: `第${i + 1}天標記`,
        x: 50,
        y: dayY + 4,
        width: 28,
        height: 32,
        zIndex: 5,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        content: dayNum,
        style: {
          fontFamily: 'Zen Old Mincho',
          fontSize: 18,
          fontWeight: '500',
          fontStyle: 'normal',
          textAlign: 'center',
          lineHeight: 1,
          letterSpacing: 0,
          color: COLORS.primary,
        },
      }
      elements.push(dayLabel)

      // Day X 標記（text-[8px] uppercase tracking-widest opacity-60）
      const dayEnLabel: TextElement = {
        id: `el-day-${i + 1}-en`,
        type: 'text',
        name: `Day ${i + 1}`,
        x: 50,
        y: dayY + 28,
        width: 28,
        height: 20,
        zIndex: 5,
        rotation: 0,
        opacity: 0.6,
        locked: false,
        visible: true,
        content: `DAY\n${i + 1}`,
        style: {
          fontFamily: 'Noto Sans TC',
          fontSize: 8,
          fontWeight: '400',
          fontStyle: 'normal',
          textAlign: 'center',
          lineHeight: 1.2,
          letterSpacing: 2,
          color: COLORS.accent,
        },
      }
      elements.push(dayEnLabel)

      // 行程內容（text-[13px] font-medium tracking-wide）
      // 用 " ／ " 分隔，參考 HTML 的 <span class="text-accent text-[10px] px-1">/</span>
      const dayContent: TextElement = {
        id: `el-day-${i + 1}-content`,
        type: 'text',
        name: `第${i + 1}天內容`,
        x: 88,
        y: dayY + 4,
        width: A5_WIDTH - 130,
        height: 32,
        zIndex: 5,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        content: dayData.title.replace(/>/g, ' ／ ').replace(/＞/g, ' ／ '),
        style: {
          fontFamily: 'Noto Sans TC',
          fontSize: 13,
          fontWeight: '500',
          fontStyle: 'normal',
          textAlign: 'left',
          lineHeight: 1.5,
          letterSpacing: 0.8,
          color: COLORS.ink,
        },
      }
      elements.push(dayContent)

      // 餐食資訊（使用 Material Symbols 圖標）
      const meals = dayData.meals || {}
      const mealIcons = dayData.mealIcons || {}
      const mealTypes: Array<{ type: 'breakfast' | 'lunch' | 'dinner'; label: string; content: string | undefined }> = [
        { type: 'breakfast', label: '早餐', content: meals.breakfast },
        { type: 'lunch', label: '午餐', content: meals.lunch },
        { type: 'dinner', label: '晚餐', content: meals.dinner },
      ]

      let mealX = 88
      const mealY = dayY + 40

      mealTypes.forEach((meal, mealIdx) => {
        if (!meal.content) return

        // 優先使用手動選擇的圖標，否則自動判斷
        const iconName = mealIcons[meal.type] || getMealIcon(meal.type, meal.content)

        // 圖標（使用 SVG Path）- 增大尺寸讓細節更清楚
        const mealIcon: IconElement = {
          id: `el-day-${i + 1}-meal-${meal.type}-icon`,
          type: 'icon',
          name: `第${i + 1}天${meal.label}圖標`,
          x: mealX,
          y: mealY - 1,
          width: 16,
          height: 16,
          zIndex: 5,
          rotation: 0,
          opacity: 0.7,
          locked: false, // 允許調整
          visible: true,
          icon: iconName,
          size: 16, // 從 14 增加到 16
          color: COLORS.primary,
        }
        elements.push(mealIcon)

        // 文字
        const mealText: TextElement = {
          id: `el-day-${i + 1}-meal-${meal.type}-text`,
          type: 'text',
          name: `第${i + 1}天${meal.label}`,
          x: mealX + 18, // 調整文字位置配合較大圖標
          y: mealY,
          width: 58,
          height: 16,
          zIndex: 5,
          rotation: 0,
          opacity: 0.8,
          locked: false,
          visible: true,
          content: meal.content,
          style: {
            fontFamily: 'Noto Sans TC',
            fontSize: 9,
            fontWeight: '400',
            fontStyle: 'normal',
            textAlign: 'left',
            lineHeight: 1.6,
            letterSpacing: 0.2,
            color: COLORS.inkLight,
          },
        }
        elements.push(mealText)

        // 移動到下一個餐食位置
        mealX += 82
      })

      // 住宿資訊（text-[9px] italic 右對齊）
      if (dayData.accommodation) {
        const accommodationText: TextElement = {
          id: `el-day-${i + 1}-accommodation`,
          type: 'text',
          name: `第${i + 1}天住宿`,
          x: A5_WIDTH - 180,
          y: dayY + 40,
          width: 145,
          height: 18,
          zIndex: 5,
          rotation: 0,
          opacity: 0.8,
          locked: false,
          visible: true,
          content: dayData.accommodation,
          style: {
            fontFamily: 'Noto Serif TC',
            fontSize: 9,
            fontWeight: '400',
            fontStyle: 'italic',
            textAlign: 'right',
            lineHeight: 1.4,
            letterSpacing: 0.3,
            color: COLORS.accent,
          },
        }
        elements.push(accommodationText)
      }

      // 分隔線（border-b border-primary/10，最後一天不加）
      // 分隔線在餐食資訊下方，約 dayY + 58 的位置
      if (i < days - 1) {
        const dividerY = dayY + 60 // 固定在餐食下方
        const dayDivider: ShapeElement = {
          id: `el-day-${i + 1}-divider`,
          type: 'shape',
          name: `第${i + 1}天分隔線`,
          variant: 'rectangle',
          x: 78, // 從天數標記右側開始
          y: dividerY,
          width: A5_WIDTH - 110, // 延伸到右邊距
          height: 1,
          zIndex: 10,
          rotation: 0,
          opacity: 1,
          locked: false, // 允許使用者調整
          visible: true,
          fill: 'rgba(142, 128, 112, 0.15)', // 稍微深一點更明顯
          stroke: 'rgba(142, 128, 112, 0.15)',
          strokeWidth: 1,
        }
        elements.push(dayDivider)
      }
    }

    // === 底部裝飾 ===

    // 9. 右下角「旅」字裝飾
    const decorText: TextElement = {
      id: 'el-decor-text',
      type: 'text',
      name: '裝飾文字',
      x: A5_WIDTH - 85,
      y: A5_HEIGHT - 85,
      width: 65,
      height: 65,
      zIndex: 1,
      rotation: -15,
      opacity: 0.06,
      locked: false,
      visible: true,
      content: '旅',
      style: {
        fontFamily: 'Noto Serif TC',
        fontSize: 52,
        fontWeight: '400',
        fontStyle: 'normal',
        textAlign: 'center',
        lineHeight: 1,
        letterSpacing: 0,
        color: COLORS.primary,
      },
    }
    elements.push(decorText)

    return elements
  },
}
