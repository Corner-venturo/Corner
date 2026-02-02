/**
 * 日系風格 - 備忘錄頁面範本
 *
 * 渲染旅遊提醒/注意事項頁面
 * 使用列表式佈局，更緊湊
 */
import type { PageTemplate, TemplateData, MemoItem, SeasonInfo, MemoInfoItem } from './types'
import type { CanvasElement, TextElement, ShapeElement } from '@/features/designer/components/types'

// A5 尺寸
const PAGE_WIDTH = 559
const PAGE_HEIGHT = 794
const PADDING = 32

// 顏色
const COLORS = {
  ink: '#3e3a36',
  inkLight: '#757068',
  primary: '#8e8070',
  accent: '#c9aa7c',
  paperWhite: '#fcfbf9',
  cardBg: 'rgba(255, 255, 255, 0.6)',
  border: 'rgba(142, 128, 112, 0.15)',
  bulletBg: 'rgba(201, 170, 124, 0.15)',
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
 * 生成列表式備忘錄頁面元素
 * 更緊湊的版面，一頁可放 6-8 個項目
 */
function generateListPageElements(
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

  // 左側裝飾線
  const decorLine: ShapeElement = {
    ...createBaseElement('memo-decor-line', '裝飾線'),
    type: 'shape',
    variant: 'rectangle',
    x: PADDING - 8,
    y: PADDING + 60,
    width: 3,
    height: PAGE_HEIGHT - PADDING * 2 - 100,
    fill: COLORS.accent,
    cornerRadius: 2,
    locked: true,
  }
  elements.push(decorLine)

  // 主標題
  const titleY = PADDING + 10
  const titleEl: TextElement = {
    ...createBaseElement('memo-title', '主標題'),
    type: 'text',
    x: PADDING,
    y: titleY,
    width: PAGE_WIDTH - PADDING * 2,
    height: 36,
    content: title,
    style: {
      fontFamily: 'Noto Serif TC',
      fontSize: 22,
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'center',
      lineHeight: 1.2,
      letterSpacing: 3,
      color: COLORS.ink,
    },
  }
  elements.push(titleEl)

  // 副標題
  const subtitleY = titleY + 36
  const subtitleEl: TextElement = {
    ...createBaseElement('memo-subtitle', '副標題'),
    type: 'text',
    x: PADDING,
    y: subtitleY,
    width: PAGE_WIDTH - PADDING * 2,
    height: 16,
    content: `— ${subtitle} —`,
    style: {
      fontFamily: 'Noto Serif TC',
      fontSize: 8,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      lineHeight: 1.4,
      letterSpacing: 2,
      color: COLORS.primary,
    },
  }
  elements.push(subtitleEl)

  // 列表區域
  const listStartY = subtitleY + 32
  const itemHeight = 78 // 每個項目的高度（縮小以容納更多項目）
  const contentWidth = PAGE_WIDTH - PADDING * 2 - 16 // 留一點空間給裝飾線

  items.forEach((item, index) => {
    const itemY = listStartY + index * itemHeight
    const itemId = `memo-item-${index}`

    // 項目背景（淡色區塊）
    const itemBg: ShapeElement = {
      ...createBaseElement(`${itemId}-bg`, `項目${index + 1}背景`),
      type: 'shape',
      variant: 'rectangle',
      x: PADDING + 8,
      y: itemY,
      width: contentWidth,
      height: itemHeight - 8,
      fill: index % 2 === 0 ? COLORS.cardBg : 'transparent',
      cornerRadius: 6,
    }
    elements.push(itemBg)

    // 小圓點
    const bulletDot: ShapeElement = {
      ...createBaseElement(`${itemId}-bullet`, `項目${index + 1}圓點`),
      type: 'shape',
      variant: 'circle',
      x: PADDING + 18,
      y: itemY + 12,
      width: 6,
      height: 6,
      fill: COLORS.accent,
      stroke: 'transparent',
      strokeWidth: 0,
    }
    elements.push(bulletDot)

    // 標題
    const titleContent = item.titleZh || item.title
    const itemTitle: TextElement = {
      ...createBaseElement(`${itemId}-title`, `項目${index + 1}標題`),
      type: 'text',
      x: PADDING + 44,
      y: itemY + 8,
      width: contentWidth - 44,
      height: 20,
      content: titleContent,
      style: {
        fontFamily: 'Noto Serif TC',
        fontSize: 13,
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'left',
        lineHeight: 1.4,
        letterSpacing: 0.5,
        color: COLORS.ink,
      },
    }
    elements.push(itemTitle)

    // 原文標題（如果有中文標題的話顯示原文）
    if (item.titleZh && item.title !== item.titleZh) {
      const originalTitle: TextElement = {
        ...createBaseElement(`${itemId}-original`, `項目${index + 1}原文`),
        type: 'text',
        x: PADDING + 44,
        y: itemY + 26,
        width: contentWidth - 44,
        height: 14,
        content: item.title,
        style: {
          fontFamily: 'Noto Serif TC',
          fontSize: 9,
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'left',
          lineHeight: 1.2,
          letterSpacing: 0.3,
          color: COLORS.primary,
        },
      }
      elements.push(originalTitle)
    }

    // 內容
    const contentY = item.titleZh && item.title !== item.titleZh ? itemY + 40 : itemY + 30
    const itemContent: TextElement = {
      ...createBaseElement(`${itemId}-content`, `項目${index + 1}內容`),
      type: 'text',
      x: PADDING + 44,
      y: contentY,
      width: contentWidth - 52,
      height: itemHeight - contentY + itemY - 12,
      content: item.content,
      style: {
        fontFamily: 'Noto Serif TC',
        fontSize: 10,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'left',
        lineHeight: 1.55,
        letterSpacing: 0.2,
        color: COLORS.inkLight,
      },
    }
    elements.push(itemContent)
  })

  // 頁腳分隔線
  const footerY = PAGE_HEIGHT - PADDING - 24
  const footerLine: ShapeElement = {
    ...createBaseElement('memo-footer-line', '頁腳分隔線'),
    type: 'shape',
    variant: 'rectangle',
    x: PADDING,
    y: footerY,
    width: PAGE_WIDTH - PADDING * 2,
    height: 1,
    fill: COLORS.border,
    locked: true,
  }
  elements.push(footerLine)

  // 頁腳左
  const footerLeft: TextElement = {
    ...createBaseElement('memo-footer-left', '頁腳左'),
    type: 'text',
    x: PADDING,
    y: footerY + 8,
    width: 200,
    height: 14,
    content: footerText,
    style: {
      fontFamily: 'Noto Serif TC',
      fontSize: 9,
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
    y: footerY + 8,
    width: 60,
    height: 14,
    content: pageNumber,
    style: {
      fontFamily: 'Noto Serif TC',
      fontSize: 10,
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'right',
      lineHeight: 1.2,
      letterSpacing: 1,
      color: COLORS.ink,
    },
  }
  elements.push(footerRight)

  return elements
}

/**
 * 生成天氣頁元素（選擇的季節 + 備忘錄）
 * 根據選擇的季節數量動態調整版面
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
    height: 36,
    content: title,
    style: {
      fontFamily: 'Noto Serif TC',
      fontSize: 22,
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'center',
      lineHeight: 1.2,
      letterSpacing: 3,
      color: COLORS.ink,
    },
  }
  elements.push(titleEl)

  // 副標題
  const subtitleY = titleY + 36
  const subtitleEl: TextElement = {
    ...createBaseElement('weather-subtitle', '副標題'),
    type: 'text',
    x: PADDING,
    y: subtitleY,
    width: PAGE_WIDTH - PADDING * 2,
    height: 16,
    content: '— Weather & Emergency Info —',
    style: {
      fontFamily: 'Noto Serif TC',
      fontSize: 8,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      lineHeight: 1.4,
      letterSpacing: 2,
      color: COLORS.primary,
    },
  }
  elements.push(subtitleEl)

  // 季節區域
  const seasonStartY = subtitleY + 32
  const contentWidth = PAGE_WIDTH - PADDING * 2

  // 根據季節數量決定佈局
  if (seasons.length > 0) {
    // 季節標題
    const seasonTitle: TextElement = {
      ...createBaseElement('season-section-title', '季節標題'),
      type: 'text',
      x: PADDING,
      y: seasonStartY,
      width: contentWidth,
      height: 20,
      content: '✦ 氣候資訊',
      style: {
        fontFamily: 'Noto Serif TC',
        fontSize: 12,
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'left',
        lineHeight: 1.4,
        letterSpacing: 1,
        color: COLORS.ink,
      },
    }
    elements.push(seasonTitle)

    // 季節列表（橫向排列）
    const seasonItemWidth = (contentWidth - (seasons.length - 1) * 12) / seasons.length
    const seasonItemHeight = 120
    const seasonListY = seasonStartY + 28

    seasons.forEach((season, index) => {
      const seasonX = PADDING + index * (seasonItemWidth + 12)
      const seasonId = `season-${season.season}`
      const seasonLabel = SEASON_LABELS[season.season] || season.season

      // 季節卡片背景
      const seasonBg: ShapeElement = {
        ...createBaseElement(`${seasonId}-bg`, `${seasonLabel}季背景`),
        type: 'shape',
        variant: 'rectangle',
        x: seasonX,
        y: seasonListY,
        width: seasonItemWidth,
        height: seasonItemHeight,
        fill: COLORS.cardBg,
        stroke: COLORS.border,
        strokeWidth: 1,
        cornerRadius: 8,
      }
      elements.push(seasonBg)

      // 季節標籤
      const seasonLabelEl: TextElement = {
        ...createBaseElement(`${seasonId}-label`, `${seasonLabel}季標籤`),
        type: 'text',
        x: seasonX,
        y: seasonListY + 12,
        width: seasonItemWidth,
        height: 24,
        content: `${seasonLabel}`,
        style: {
          fontFamily: 'Noto Serif TC',
          fontSize: 18,
          fontWeight: 'bold',
          fontStyle: 'normal',
          textAlign: 'center',
          lineHeight: 1.2,
          letterSpacing: 2,
          color: COLORS.accent,
        },
      }
      elements.push(seasonLabelEl)

      // 月份
      const seasonMonths: TextElement = {
        ...createBaseElement(`${seasonId}-months`, `${seasonLabel}季月份`),
        type: 'text',
        x: seasonX,
        y: seasonListY + 38,
        width: seasonItemWidth,
        height: 14,
        content: season.months,
        style: {
          fontFamily: 'Noto Serif TC',
          fontSize: 9,
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'center',
          lineHeight: 1.2,
          letterSpacing: 0.5,
          color: COLORS.primary,
        },
      }
      elements.push(seasonMonths)

      // 描述
      const seasonDesc: TextElement = {
        ...createBaseElement(`${seasonId}-desc`, `${seasonLabel}季描述`),
        type: 'text',
        x: seasonX + 8,
        y: seasonListY + 56,
        width: seasonItemWidth - 16,
        height: seasonItemHeight - 64,
        content: season.description,
        style: {
          fontFamily: 'Noto Serif TC',
          fontSize: 9,
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'center',
          lineHeight: 1.5,
          letterSpacing: 0.2,
          color: COLORS.inkLight,
        },
      }
      elements.push(seasonDesc)
    })
  }

  // 備忘錄區
  const infoStartY = seasons.length > 0 ? seasonStartY + 28 + 120 + 32 : seasonStartY

  if (infoItems.length > 0) {
    // 備忘錄標題
    const infoTitle: TextElement = {
      ...createBaseElement('info-section-title', '備忘錄標題'),
      type: 'text',
      x: PADDING,
      y: infoStartY,
      width: contentWidth,
      height: 20,
      content: '✦ 緊急聯絡 & 實用資訊',
      style: {
        fontFamily: 'Noto Serif TC',
        fontSize: 12,
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'left',
        lineHeight: 1.4,
        letterSpacing: 1,
        color: COLORS.ink,
      },
    }
    elements.push(infoTitle)

    // 資訊項目（列表式）
    const infoListY = infoStartY + 28
    const infoItemHeight = 65

    infoItems.forEach((item, index) => {
      const itemY = infoListY + index * infoItemHeight
      const itemId = `info-item-${index}`

      // 項目背景
      const itemBg: ShapeElement = {
        ...createBaseElement(`${itemId}-bg`, `資訊${index + 1}背景`),
        type: 'shape',
        variant: 'rectangle',
        x: PADDING,
        y: itemY,
        width: contentWidth,
        height: infoItemHeight - 8,
        fill: index % 2 === 0 ? COLORS.cardBg : 'transparent',
        cornerRadius: 6,
      }
      elements.push(itemBg)

      // 標題
      const itemTitle: TextElement = {
        ...createBaseElement(`${itemId}-title`, `資訊${index + 1}標題`),
        type: 'text',
        x: PADDING + 12,
        y: itemY + 8,
        width: contentWidth - 24,
        height: 18,
        content: `▸ ${item.title}`,
        style: {
          fontFamily: 'Noto Serif TC',
          fontSize: 11,
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
        x: PADDING + 20,
        y: itemY + 28,
        width: contentWidth - 32,
        height: infoItemHeight - 40,
        content: item.content,
        style: {
          fontFamily: 'Noto Serif TC',
          fontSize: 10,
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'left',
          lineHeight: 1.5,
          letterSpacing: 0.2,
          color: COLORS.inkLight,
        },
      }
      elements.push(itemContent)
    })
  }

  // 頁腳分隔線
  const footerY = PAGE_HEIGHT - PADDING - 24
  const footerLine: ShapeElement = {
    ...createBaseElement('weather-footer-line', '頁腳分隔線'),
    type: 'shape',
    variant: 'rectangle',
    x: PADDING,
    y: footerY,
    width: PAGE_WIDTH - PADDING * 2,
    height: 1,
    fill: COLORS.border,
    locked: true,
  }
  elements.push(footerLine)

  // 頁腳左
  const footerLeft: TextElement = {
    ...createBaseElement('weather-footer-left', '頁腳左'),
    type: 'text',
    x: PADDING,
    y: footerY + 8,
    width: 200,
    height: 14,
    content: footerText,
    style: {
      fontFamily: 'Noto Serif TC',
      fontSize: 9,
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
    y: footerY + 8,
    width: 60,
    height: 14,
    content: pageNumber,
    style: {
      fontFamily: 'Noto Serif TC',
      fontSize: 10,
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'right',
      lineHeight: 1.2,
      letterSpacing: 1,
      color: COLORS.ink,
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
  description: '旅遊提醒/注意事項頁面（列表式）',
  thumbnailUrl: '/templates/japanese-style-v1-memo.png',
  category: 'memo',

  generateElements(data: TemplateData): CanvasElement[] {
    // 檢查是否有自訂的備忘錄內容（新增頁面時選擇的項目）
    const customMemoContent = (data as { memoPageContent?: {
      items?: MemoItem[]
      seasons?: SeasonInfo[]
      infoItems?: MemoInfoItem[]
      isWeatherPage?: boolean
    } }).memoPageContent

    const memoSettings = data.memoSettings

    if (customMemoContent) {
      // 使用自訂內容
      const title = memoSettings?.title || '旅遊小提醒'
      const subtitle = memoSettings?.subtitle || 'Travel Tips'
      const footerText = memoSettings?.footerText || '旅の心得'
      const pageNumber = `P.${String(data.currentMemoPageIndex || 1).padStart(2, '0')}`

      if (customMemoContent.isWeatherPage) {
        return generateWeatherPageElements(
          customMemoContent.seasons || [],
          customMemoContent.infoItems || [],
          title,
          footerText,
          pageNumber
        )
      } else {
        return generateListPageElements(
          customMemoContent.items || [],
          title,
          subtitle,
          footerText,
          pageNumber
        )
      }
    }

    // 舊版相容：使用 memoSettings
    if (!memoSettings) {
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

    // 從 memoSettings 取得啟用的項目
    const enabledItems = memoSettings.items?.filter(i => i.enabled) || []
    const enabledSeasons = memoSettings.seasons?.filter(s => s.enabled) || []
    const enabledInfoItems = memoSettings.infoItems?.filter(i => i.enabled) || []

    const pageIndex = data.currentMemoPageIndex || 0
    const itemsPerPage = 7 // 列表式可以放更多項目
    const pageNumber = `P.${String(pageIndex + 1).padStart(2, '0')}`

    // 計算項目頁數
    const itemPages = Math.ceil(enabledItems.length / itemsPerPage)

    // 如果沒有任何內容被啟用，顯示提示
    if (enabledItems.length === 0 && enabledSeasons.length === 0 && enabledInfoItems.length === 0) {
      const emptyText: TextElement = {
        ...createBaseElement('memo-empty', '空白提示'),
        type: 'text',
        x: PADDING,
        y: PAGE_HEIGHT / 2 - 20,
        width: PAGE_WIDTH - PADDING * 2,
        height: 40,
        content: '請在右側面板勾選要顯示的項目',
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

    // 如果只有天氣/緊急資訊（沒有一般項目），直接顯示天氣頁
    if (enabledItems.length === 0 && (enabledSeasons.length > 0 || enabledInfoItems.length > 0)) {
      return generateWeatherPageElements(
        enabledSeasons,
        enabledInfoItems,
        memoSettings.title,
        memoSettings.footerText,
        pageNumber
      )
    }

    if (pageIndex < itemPages) {
      // 項目頁
      const start = pageIndex * itemsPerPage
      const end = start + itemsPerPage
      const pageItems = enabledItems.slice(start, end)

      return generateListPageElements(
        pageItems,
        memoSettings.title,
        memoSettings.subtitle,
        memoSettings.footerText,
        pageNumber
      )
    } else if (enabledSeasons.length > 0 || enabledInfoItems.length > 0) {
      // 天氣/資訊頁（需要另開一頁備忘錄）
      return generateWeatherPageElements(
        enabledSeasons,
        enabledInfoItems,
        memoSettings.title,
        memoSettings.footerText,
        pageNumber
      )
    }

    return []
  },
}
