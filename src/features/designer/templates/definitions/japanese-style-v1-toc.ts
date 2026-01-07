/**
 * 日系風格 - 目錄頁面範本
 *
 * 設計特點：
 * - 左上角公司名稱
 * - 大型直書「目錄」標題
 * - 右側特色圖片（拱形設計）
 * - 兩欄式章節列表
 * - 自動計算頁碼
 */
import type { PageTemplate, TemplateData } from './types'
import type { CanvasElement, ShapeElement, TextElement, ImageElement, TextStyle } from '@/features/designer/components/types'

// A5 尺寸（像素，96 DPI）
const A5_WIDTH = 559
const A5_HEIGHT = 794

// 顏色定義
const COLORS = {
  ink: '#181511',
  inkLight: '#887863',
  primary: '#e69019',
  paperWhite: '#ffffff',
  border: '#e5e1dc',
  background: '#f8f7f6',
}

// zIndex 計數器
let zIndexCounter = 0

// 輔助函數：創建基礎元素屬性
function createBaseElement(id: string, name: string) {
  return {
    id,
    name,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    zIndex: ++zIndexCounter,
  }
}

// 輔助函數：創建文字樣式
function createTextStyle(overrides: Partial<TextStyle> = {}): TextStyle {
  return {
    fontFamily: 'Noto Serif TC',
    fontSize: 14,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    lineHeight: 1.5,
    letterSpacing: 0,
    color: COLORS.ink,
    ...overrides,
  }
}

// 目錄項目類型
interface TocItem {
  number: string
  title: string
  description: string
  pageNumber: number
}

// 計算目錄項目
function calculateTocItems(data: TemplateData): TocItem[] {
  const items: TocItem[] = []
  let currentPage = 3 // 封面=1, 目錄=2, 從第3頁開始

  // 行程總覽
  items.push({
    number: '01',
    title: '行程總覽',
    description: '航班資訊、集合地點、每日行程概要',
    pageNumber: currentPage,
  })
  currentPage += 1

  // 每日行程
  const dailyCount = data.dailyDetails?.length || 3
  if (dailyCount > 0) {
    items.push({
      number: String(items.length + 1).padStart(2, '0'),
      title: '每日行程',
      description: `第一天至第${dailyCount}天的詳細行程安排`,
      pageNumber: currentPage,
    })
    currentPage += dailyCount
  }

  // 飯店介紹
  const hotelCount = data.hotels?.filter(h => h.enabled !== false)?.length || 0
  if (hotelCount > 0) {
    items.push({
      number: String(items.length + 1).padStart(2, '0'),
      title: '住宿介紹',
      description: `${hotelCount} 間精選飯店的特色與設施`,
      pageNumber: currentPage,
    })
    currentPage += hotelCount
  }

  // 備忘錄
  const memoEnabled = data.memoSettings?.items?.some(i => i.enabled)
  if (memoEnabled) {
    const memoItemCount = data.memoSettings?.items?.filter(i => i.enabled)?.length || 0
    const memoPages = Math.ceil(memoItemCount / 6) + (data.memoSettings?.seasons?.some(s => s.enabled) ? 1 : 0)
    items.push({
      number: String(items.length + 1).padStart(2, '0'),
      title: '旅遊提醒',
      description: '行前注意事項、禮儀須知、緊急聯絡',
      pageNumber: currentPage,
    })
    currentPage += memoPages
  }

  // 筆記頁（固定項目）
  items.push({
    number: String(items.length + 1).padStart(2, '0'),
    title: '旅行筆記',
    description: '記錄您的旅途回憶與心得',
    pageNumber: currentPage,
  })

  return items
}

export const japaneseStyleV1Toc: PageTemplate = {
  id: 'japanese-style-v1-toc',
  name: '日系風格 - 目錄',
  description: '優雅的目錄頁面，自動列出所有章節與頁碼',
  thumbnailUrl: '/templates/japanese-style-v1-toc.png',
  category: 'general',

  generateElements: (data: TemplateData): CanvasElement[] => {
    zIndexCounter = 0
    const elements: CanvasElement[] = []

    // 計算目錄項目
    const tocItems = calculateTocItems(data)

    // === 背景 ===
    const bgElement: ShapeElement = {
      ...createBaseElement('toc-bg', '頁面背景'),
      type: 'shape',
      x: 0,
      y: 0,
      width: A5_WIDTH,
      height: A5_HEIGHT,
      variant: 'rectangle',
      fill: COLORS.paperWhite,
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 0,
    }
    elements.push(bgElement)

    // === 左上角公司名稱 ===
    const companyDotElement: ShapeElement = {
      ...createBaseElement('toc-company-dot', '公司裝飾點'),
      type: 'shape',
      x: 32,
      y: 35,
      width: 6,
      height: 6,
      variant: 'circle',
      fill: COLORS.primary,
      stroke: 'transparent',
      strokeWidth: 0,
    }
    elements.push(companyDotElement)

    const companyNameElement: TextElement = {
      ...createBaseElement('toc-company-name', '公司名稱'),
      type: 'text',
      x: 46,
      y: 30,
      width: 150,
      height: 16,
      content: data.companyName?.toUpperCase() || 'CORNER TRAVEL',
      style: createTextStyle({
        fontSize: 8,
        fontWeight: 'bold',
        letterSpacing: 3,
        color: COLORS.ink,
      }),
    }
    elements.push(companyNameElement)

    // === 大型直書「目錄」標題 ===
    const titleVerticalElement: TextElement = {
      ...createBaseElement('toc-title-vertical', '目錄標題(直書)'),
      type: 'text',
      x: 32,
      y: 80,
      width: 60,
      height: 160,
      content: '目\n錄',
      style: createTextStyle({
        fontFamily: 'Noto Serif TC',
        fontSize: 56,
        fontWeight: 'bold',
        lineHeight: 1.2,
        letterSpacing: 8,
        color: COLORS.ink,
      }),
    }
    elements.push(titleVerticalElement)

    // === Index 英文標籤 ===
    const indexLabelElement: TextElement = {
      ...createBaseElement('toc-index-label', 'Index標籤'),
      type: 'text',
      x: 100,
      y: 180,
      width: 80,
      height: 14,
      content: 'INDEX',
      style: createTextStyle({
        fontSize: 8,
        fontWeight: 'bold',
        letterSpacing: 2,
        color: COLORS.primary,
      }),
    }
    elements.push(indexLabelElement)

    // === Table of Contents 英文標題 ===
    const tocEnglishElement: TextElement = {
      ...createBaseElement('toc-english-title', '英文標題'),
      type: 'text',
      x: 100,
      y: 196,
      width: 100,
      height: 40,
      content: 'Table of\nContents',
      style: createTextStyle({
        fontSize: 14,
        fontWeight: 'bold',
        lineHeight: 1.3,
        color: COLORS.ink,
      }),
    }
    elements.push(tocEnglishElement)

    // === 右側特色圖片區域 ===
    const imageWidth = 200
    const imageHeight = 260
    const imageX = A5_WIDTH - imageWidth - 32
    const imageY = 32

    // 圖片背景（拱形）
    const imageBgElement: ShapeElement = {
      ...createBaseElement('toc-image-bg', '圖片背景'),
      type: 'shape',
      x: imageX,
      y: imageY,
      width: imageWidth,
      height: imageHeight,
      variant: 'rectangle',
      fill: COLORS.background,
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 4,
    }
    elements.push(imageBgElement)

    // 如果有封面圖片，顯示在這裡
    if (data.coverImage) {
      const imageElement: ImageElement = {
        ...createBaseElement('toc-image', '特色圖片'),
        type: 'image',
        x: imageX,
        y: imageY,
        width: imageWidth,
        height: imageHeight,
        src: data.coverImage,
        objectFit: 'cover',
        borderRadius: {
          topLeft: 100,
          topRight: 100,
          bottomLeft: 4,
          bottomRight: 4,
        },
      }
      elements.push(imageElement)
    }

    // 右上角裝飾線
    const decorLineTopElement: ShapeElement = {
      ...createBaseElement('toc-decor-top', '裝飾線(上)'),
      type: 'shape',
      x: A5_WIDTH - 24,
      y: 20,
      width: 1,
      height: 40,
      variant: 'rectangle',
      fill: `${COLORS.primary}33`,
      stroke: 'transparent',
      strokeWidth: 0,
    }
    elements.push(decorLineTopElement)

    const decorLineRightElement: ShapeElement = {
      ...createBaseElement('toc-decor-right', '裝飾線(右)'),
      type: 'shape',
      x: A5_WIDTH - 64,
      y: 20,
      width: 40,
      height: 1,
      variant: 'rectangle',
      fill: `${COLORS.primary}33`,
      stroke: 'transparent',
      strokeWidth: 0,
    }
    elements.push(decorLineRightElement)

    // === 中間分隔線 ===
    const contentY = 320
    const contentX = 32
    const contentWidth = A5_WIDTH - 64
    const columnWidth = (contentWidth - 40) / 2

    const dividerElement: ShapeElement = {
      ...createBaseElement('toc-divider', '中間分隔線'),
      type: 'shape',
      x: contentX + columnWidth + 20,
      y: contentY,
      width: 1,
      height: 380,
      variant: 'rectangle',
      fill: COLORS.border,
      stroke: 'transparent',
      strokeWidth: 0,
    }
    elements.push(dividerElement)

    // === 目錄項目 ===
    const itemHeight = 70
    const itemGap = 15

    tocItems.forEach((item, index) => {
      const column = index % 2
      const row = Math.floor(index / 2)
      const itemX = contentX + column * (columnWidth + 40)
      const itemY = contentY + row * (itemHeight + itemGap)

      // 章節編號與頁碼行
      const headerLineElement: ShapeElement = {
        ...createBaseElement(`toc-item-${index}-line`, `項目${index + 1}底線`),
        type: 'shape',
        x: itemX,
        y: itemY + 20,
        width: columnWidth,
        height: 1,
        variant: 'rectangle',
        fill: COLORS.border,
        stroke: 'transparent',
        strokeWidth: 0,
        strokeDashArray: [4, 2],
      }
      elements.push(headerLineElement)

      // 章節編號
      const numberElement: TextElement = {
        ...createBaseElement(`toc-item-${index}-number`, `項目${index + 1}編號`),
        type: 'text',
        x: itemX,
        y: itemY,
        width: 30,
        height: 18,
        content: item.number,
        style: createTextStyle({
          fontFamily: 'monospace',
          fontSize: 12,
          fontWeight: 'bold',
          color: COLORS.primary,
        }),
      }
      elements.push(numberElement)

      // 頁碼
      const pageElement: TextElement = {
        ...createBaseElement(`toc-item-${index}-page`, `項目${index + 1}頁碼`),
        type: 'text',
        x: itemX + columnWidth - 40,
        y: itemY,
        width: 40,
        height: 18,
        content: `p. ${String(item.pageNumber).padStart(2, '0')}`,
        style: createTextStyle({
          fontSize: 10,
          fontWeight: '500',
          color: COLORS.inkLight,
          textAlign: 'right',
        }),
      }
      elements.push(pageElement)

      // 標題
      const titleElement: TextElement = {
        ...createBaseElement(`toc-item-${index}-title`, `項目${index + 1}標題`),
        type: 'text',
        x: itemX,
        y: itemY + 26,
        width: columnWidth,
        height: 18,
        content: item.title,
        style: createTextStyle({
          fontSize: 12,
          fontWeight: 'bold',
          color: COLORS.ink,
        }),
      }
      elements.push(titleElement)

      // 描述
      const descElement: TextElement = {
        ...createBaseElement(`toc-item-${index}-desc`, `項目${index + 1}描述`),
        type: 'text',
        x: itemX,
        y: itemY + 46,
        width: columnWidth,
        height: 24,
        content: item.description,
        style: createTextStyle({
          fontSize: 9,
          lineHeight: 1.4,
          color: COLORS.inkLight,
        }),
      }
      elements.push(descElement)
    })

    // === 底部資訊 ===
    const footerY = A5_HEIGHT - 50

    // 底部分隔線
    const footerLineElement: ShapeElement = {
      ...createBaseElement('toc-footer-line', '底部分隔線'),
      type: 'shape',
      x: contentX,
      y: footerY,
      width: contentWidth,
      height: 1,
      variant: 'rectangle',
      fill: COLORS.border,
      stroke: 'transparent',
      strokeWidth: 0,
    }
    elements.push(footerLineElement)

    // 左側：手冊標題
    const footerTitleElement: TextElement = {
      ...createBaseElement('toc-footer-title', '手冊標題'),
      type: 'text',
      x: contentX,
      y: footerY + 12,
      width: 200,
      height: 16,
      content: `${data.mainTitle || '旅遊手冊'} — ${data.travelDates?.split(' - ')[0]?.slice(0, 7) || '2025'}`,
      style: createTextStyle({
        fontSize: 9,
        fontWeight: '500',
        letterSpacing: 0.5,
        color: COLORS.inkLight,
      }),
    }
    elements.push(footerTitleElement)

    // 右側：頁碼
    const pageNumberElement: TextElement = {
      ...createBaseElement('toc-page-number', '頁碼'),
      type: 'text',
      x: A5_WIDTH - contentX - 60,
      y: footerY + 12,
      width: 60,
      height: 16,
      content: 'Page 02',
      style: createTextStyle({
        fontSize: 9,
        fontWeight: 'bold',
        color: COLORS.ink,
        textAlign: 'right',
      }),
    }
    elements.push(pageNumberElement)

    // === 右下角漸層裝飾 ===
    const gradientElement: ShapeElement = {
      ...createBaseElement('toc-gradient', '漸層裝飾'),
      type: 'shape',
      x: A5_WIDTH - 200,
      y: A5_HEIGHT - 200,
      width: 200,
      height: 200,
      variant: 'rectangle',
      fill: 'transparent',
      gradient: {
        type: 'radial',
        colorStops: [
          { offset: 0, color: COLORS.background },
          { offset: 1, color: 'transparent' },
        ],
      },
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 100,
    }
    elements.push(gradientElement)

    return elements
  },
}
