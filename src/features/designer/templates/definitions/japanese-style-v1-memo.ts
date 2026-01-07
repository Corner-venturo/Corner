/**
 * 日系風格 - 備忘錄頁面範本
 *
 * 渲染旅遊提醒/注意事項頁面
 * 支援兩種版面：
 * 1. 項目頁（4 個提醒卡片）
 * 2. 天氣頁（四季資訊 + 備忘錄區）
 */
import type { PageTemplate, TemplateData, MemoItem, SeasonInfo, MemoInfoItem } from './types'
import type { CanvasElement, TextElement, ShapeElement } from '@/features/designer/components/types'
import { getMemoItemsForPage } from '../definitions/country-presets'

// A5 尺寸
const PAGE_WIDTH = 559
const PAGE_HEIGHT = 794
const PADDING = 32

// 顏色
const COLORS = {
  ink: '#3e3a36',
  inkLight: '#757068',
  primary: '#8e8070',
  paperWhite: '#fcfbf9',
  paperOff: '#f7f5f0',
  cardBg: 'rgba(255, 255, 255, 0.6)',
  border: 'rgba(142, 128, 112, 0.1)',
}

// 季節標籤
const SEASON_LABELS: Record<string, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
}

// 基礎元素屬性
let zIndexCounter = 0
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

/**
 * 生成項目頁元素（4 個提醒卡片）
 */
function generateItemPageElements(
  items: MemoItem[],
  title: string,
  subtitle: string,
  footerText: string,
  pageNumber: string
): CanvasElement[] {
  const elements: CanvasElement[] = []
  zIndexCounter = 0

  // 背景
  const bgShape: ShapeElement = {
    ...createBaseElement('memo-bg', '背景'),
    type: 'shape',
    variant: 'rectangle',
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    fill: COLORS.paperWhite,
    locked: true,
  }
  elements.push(bgShape)

  // 主標題
  const titleY = PADDING + 10
  const titleEl: TextElement = {
    ...createBaseElement('memo-title', '主標題'),
    type: 'text',
    x: PADDING,
    y: titleY,
    width: PAGE_WIDTH - PADDING * 2,
    height: 40,
    content: title,
    style: {
      fontFamily: 'Noto Serif TC',
      fontSize: 26,
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'center',
      lineHeight: 1.2,
      letterSpacing: 4,
      color: COLORS.ink,
    },
  }
  elements.push(titleEl)

  // 副標題
  const subtitleY = titleY + 40
  const subtitleEl: TextElement = {
    ...createBaseElement('memo-subtitle', '副標題'),
    type: 'text',
    x: PADDING,
    y: subtitleY,
    width: PAGE_WIDTH - PADDING * 2,
    height: 20,
    content: `— ${subtitle} —`,
    style: {
      fontFamily: 'Noto Serif TC',
      fontSize: 9,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      lineHeight: 1.4,
      letterSpacing: 2,
      color: COLORS.primary,
    },
  }
  elements.push(subtitleEl)

  // 提醒卡片區
  const cardsStartY = subtitleY + 40
  const cardHeight = 135
  const cardGap = 14
  const cardWidth = PAGE_WIDTH - PADDING * 2

  items.forEach((item, index) => {
    const cardY = cardsStartY + index * (cardHeight + cardGap)
    const cardId = `memo-card-${index}`

    // 卡片背景
    const cardBg: ShapeElement = {
      ...createBaseElement(`${cardId}-bg`, `卡片${index + 1}背景`),
      type: 'shape',
      variant: 'rectangle',
      x: PADDING,
      y: cardY,
      width: cardWidth,
      height: cardHeight,
      fill: COLORS.cardBg,
      stroke: COLORS.border,
      strokeWidth: 1,
      cornerRadius: 8,
      locked: true,
    }
    elements.push(cardBg)

    // 標題（含圖標提示）
    const titleContent = item.titleZh ? `${item.title}` : item.title
    const itemTitle: TextElement = {
      ...createBaseElement(`${cardId}-title`, `卡片${index + 1}標題`),
      type: 'text',
      x: PADDING + 16,
      y: cardY + 14,
      width: cardWidth - 32,
      height: 24,
      content: titleContent,
      style: {
        fontFamily: 'Noto Serif TC',
        fontSize: 14,
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'left',
        lineHeight: 1.4,
        letterSpacing: 1,
        color: COLORS.ink,
      },
    }
    elements.push(itemTitle)

    // 中文標題（如果有）
    if (item.titleZh) {
      const titleZhEl: TextElement = {
        ...createBaseElement(`${cardId}-title-zh`, `卡片${index + 1}中文標題`),
        type: 'text',
        x: PADDING + 16,
        y: cardY + 36,
        width: cardWidth - 32,
        height: 18,
        content: item.titleZh,
        style: {
          fontFamily: 'Noto Serif TC',
          fontSize: 11,
          fontWeight: '500',
          fontStyle: 'normal',
          textAlign: 'left',
          lineHeight: 1.4,
          letterSpacing: 0.5,
          color: COLORS.primary,
        },
      }
      elements.push(titleZhEl)
    }

    // 內容
    const contentY = item.titleZh ? cardY + 56 : cardY + 42
    const itemContent: TextElement = {
      ...createBaseElement(`${cardId}-content`, `卡片${index + 1}內容`),
      type: 'text',
      x: PADDING + 16,
      y: contentY,
      width: cardWidth - 32,
      height: cardHeight - (item.titleZh ? 70 : 56),
      content: item.content,
      style: {
        fontFamily: 'Noto Serif TC',
        fontSize: 11,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'left',
        lineHeight: 1.6,
        letterSpacing: 0.3,
        color: COLORS.inkLight,
      },
    }
    elements.push(itemContent)
  })

  // 頁腳左
  const footerY = PAGE_HEIGHT - PADDING - 16
  const footerLeft: TextElement = {
    ...createBaseElement('memo-footer-left', '頁腳左'),
    type: 'text',
    x: PADDING,
    y: footerY,
    width: 200,
    height: 16,
    content: footerText,
    style: {
      fontFamily: 'Noto Serif TC',
      fontSize: 10,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      lineHeight: 1.2,
      letterSpacing: 1,
      color: COLORS.primary,
    },
  }
  elements.push(footerLeft)

  // 頁腳右（頁碼）
  const footerRight: TextElement = {
    ...createBaseElement('memo-footer-right', '頁碼'),
    type: 'text',
    x: PAGE_WIDTH - PADDING - 60,
    y: footerY,
    width: 60,
    height: 16,
    content: pageNumber,
    style: {
      fontFamily: 'Noto Serif TC',
      fontSize: 12,
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'right',
      lineHeight: 1.2,
      letterSpacing: 1,
      color: COLORS.inkLight,
    },
  }
  elements.push(footerRight)

  return elements
}

/**
 * 生成天氣頁元素（四季 + 備忘錄）
 */
function generateWeatherPageElements(
  seasons: SeasonInfo[],
  infoItems: MemoInfoItem[],
  title: string,
  footerText: string,
  pageNumber: string
): CanvasElement[] {
  const elements: CanvasElement[] = []
  zIndexCounter = 0

  // 背景
  const bgShape: ShapeElement = {
    ...createBaseElement('weather-bg', '背景'),
    type: 'shape',
    variant: 'rectangle',
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    fill: COLORS.paperWhite,
    locked: true,
  }
  elements.push(bgShape)

  // 主標題
  const titleY = PADDING + 10
  const titleEl: TextElement = {
    ...createBaseElement('weather-title', '主標題'),
    type: 'text',
    x: PADDING,
    y: titleY,
    width: PAGE_WIDTH - PADDING * 2,
    height: 40,
    content: title,
    style: {
      fontFamily: 'Noto Serif TC',
      fontSize: 26,
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'center',
      lineHeight: 1.2,
      letterSpacing: 4,
      color: COLORS.ink,
    },
  }
  elements.push(titleEl)

  // 副標題
  const subtitleY = titleY + 40
  const subtitleEl: TextElement = {
    ...createBaseElement('weather-subtitle', '副標題'),
    type: 'text',
    x: PADDING,
    y: subtitleY,
    width: PAGE_WIDTH - PADDING * 2,
    height: 20,
    content: '— Weather & Tips —',
    style: {
      fontFamily: 'Noto Serif TC',
      fontSize: 9,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      lineHeight: 1.4,
      letterSpacing: 2,
      color: COLORS.primary,
    },
  }
  elements.push(subtitleEl)

  // 四季卡片區（2x2 網格）
  const gridStartY = subtitleY + 40
  const cardWidth = (PAGE_WIDTH - PADDING * 2 - 16) / 2
  const cardHeight = 115
  const cardGap = 12

  seasons.forEach((season, index) => {
    const row = Math.floor(index / 2)
    const col = index % 2
    const cardX = PADDING + col * (cardWidth + 16)
    const cardY = gridStartY + row * (cardHeight + cardGap)
    const cardId = `season-${season.season}`

    // 卡片背景
    const cardBg: ShapeElement = {
      ...createBaseElement(`${cardId}-bg`, `${SEASON_LABELS[season.season]}季背景`),
      type: 'shape',
      variant: 'rectangle',
      x: cardX,
      y: cardY,
      width: cardWidth,
      height: cardHeight,
      fill: COLORS.cardBg,
      stroke: COLORS.border,
      strokeWidth: 1,
      cornerRadius: 8,
      locked: true,
    }
    elements.push(cardBg)

    // 季節標題
    const seasonLabel = SEASON_LABELS[season.season] || season.season
    const seasonTitle: TextElement = {
      ...createBaseElement(`${cardId}-title`, `${seasonLabel}季標題`),
      type: 'text',
      x: cardX + 12,
      y: cardY + 12,
      width: cardWidth - 24,
      height: 22,
      content: `${seasonLabel} (${season.months})`,
      style: {
        fontFamily: 'Noto Serif TC',
        fontSize: 14,
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'left',
        lineHeight: 1.4,
        letterSpacing: 1,
        color: COLORS.ink,
      },
    }
    elements.push(seasonTitle)

    // 描述
    const seasonDesc: TextElement = {
      ...createBaseElement(`${cardId}-desc`, `${seasonLabel}季描述`),
      type: 'text',
      x: cardX + 12,
      y: cardY + 38,
      width: cardWidth - 24,
      height: cardHeight - 50,
      content: season.description,
      style: {
        fontFamily: 'Noto Serif TC',
        fontSize: 10,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'left',
        lineHeight: 1.6,
        letterSpacing: 0.3,
        color: COLORS.inkLight,
      },
    }
    elements.push(seasonDesc)
  })

  // 備忘錄區
  const infoStartY = gridStartY + 2 * (cardHeight + cardGap) + 24
  const infoWidth = PAGE_WIDTH - PADDING * 2

  // 備忘錄標題
  const infoTitle: TextElement = {
    ...createBaseElement('info-title', '備忘錄標題'),
    type: 'text',
    x: PADDING,
    y: infoStartY,
    width: infoWidth,
    height: 24,
    content: '✦ 旅の備忘録 ✦',
    style: {
      fontFamily: 'Noto Serif TC',
      fontSize: 14,
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'center',
      lineHeight: 1.2,
      letterSpacing: 2,
      color: COLORS.ink,
    },
  }
  elements.push(infoTitle)

  // 分隔線
  const divider: ShapeElement = {
    ...createBaseElement('info-divider', '分隔線'),
    type: 'shape',
    variant: 'rectangle',
    x: PADDING + 100,
    y: infoStartY + 30,
    width: infoWidth - 200,
    height: 1,
    fill: COLORS.border,
    locked: true,
  }
  elements.push(divider)

  // 資訊項目
  const infoItemStartY = infoStartY + 44
  const infoItemHeight = 55

  infoItems.forEach((item, index) => {
    const itemY = infoItemStartY + index * infoItemHeight
    const itemId = `info-item-${index}`

    // 標題
    const itemTitle: TextElement = {
      ...createBaseElement(`${itemId}-title`, `資訊${index + 1}標題`),
      type: 'text',
      x: PADDING + 16,
      y: itemY,
      width: infoWidth - 32,
      height: 18,
      content: item.title,
      style: {
        fontFamily: 'Noto Serif TC',
        fontSize: 12,
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'left',
        lineHeight: 1.4,
        letterSpacing: 0.5,
        color: COLORS.ink,
      },
    }
    elements.push(itemTitle)

    // 內容
    const itemContent: TextElement = {
      ...createBaseElement(`${itemId}-content`, `資訊${index + 1}內容`),
      type: 'text',
      x: PADDING + 16,
      y: itemY + 20,
      width: infoWidth - 32,
      height: 32,
      content: item.content,
      style: {
        fontFamily: 'Noto Serif TC',
        fontSize: 10,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'left',
        lineHeight: 1.6,
        letterSpacing: 0.3,
        color: COLORS.inkLight,
      },
    }
    elements.push(itemContent)
  })

  // 頁腳左
  const footerY = PAGE_HEIGHT - PADDING - 16
  const footerLeft: TextElement = {
    ...createBaseElement('weather-footer-left', '頁腳左'),
    type: 'text',
    x: PADDING,
    y: footerY,
    width: 200,
    height: 16,
    content: footerText,
    style: {
      fontFamily: 'Noto Serif TC',
      fontSize: 10,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      lineHeight: 1.2,
      letterSpacing: 1,
      color: COLORS.primary,
    },
  }
  elements.push(footerLeft)

  // 頁腳右（頁碼）
  const footerRight: TextElement = {
    ...createBaseElement('weather-footer-right', '頁碼'),
    type: 'text',
    x: PAGE_WIDTH - PADDING - 60,
    y: footerY,
    width: 60,
    height: 16,
    content: pageNumber,
    style: {
      fontFamily: 'Noto Serif TC',
      fontSize: 12,
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'right',
      lineHeight: 1.2,
      letterSpacing: 1,
      color: COLORS.inkLight,
    },
  }
  elements.push(footerRight)

  return elements
}

/**
 * 日系風格備忘錄頁面範本
 */
export const japaneseStyleV1Memo: PageTemplate = {
  id: 'japanese-style-v1-memo',
  name: '日系風格 - 備忘錄',
  description: '旅遊提醒/注意事項頁面',
  thumbnailUrl: '/templates/japanese-style-v1-memo.png',
  category: 'info',

  generateElements(data: TemplateData): CanvasElement[] {
    const memoSettings = data.memoSettings
    if (!memoSettings) {
      // 沒有備忘錄設定，返回空白頁
      const emptyText: TextElement = {
        ...createBaseElement('memo-empty', '空白提示'),
        type: 'text',
        x: PADDING,
        y: PAGE_HEIGHT / 2 - 20,
        width: PAGE_WIDTH - PADDING * 2,
        height: 40,
        content: '請設定備忘錄內容',
        style: {
          fontFamily: 'Noto Serif TC',
          fontSize: 14,
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'center',
          lineHeight: 1.4,
          letterSpacing: 0.5,
          color: COLORS.inkLight,
        },
      }
      return [emptyText]
    }

    const pageIndex = data.currentMemoPageIndex || 0
    const { items, isWeatherPage } = getMemoItemsForPage(memoSettings, pageIndex)

    // 計算頁碼（備忘錄頁碼從行程頁之後開始）
    const pageNumber = `P.${String(pageIndex + 1).padStart(2, '0')}`

    if (isWeatherPage) {
      // 天氣頁
      const enabledSeasons = memoSettings.seasons?.filter(s => s.enabled) || []
      const enabledInfoItems = memoSettings.infoItems?.filter(i => i.enabled) || []
      return generateWeatherPageElements(
        enabledSeasons,
        enabledInfoItems,
        memoSettings.title,
        memoSettings.footerText,
        pageNumber
      )
    } else {
      // 項目頁
      return generateItemPageElements(
        items,
        memoSettings.title,
        memoSettings.subtitle,
        memoSettings.footerText,
        pageNumber
      )
    }
  },
}
