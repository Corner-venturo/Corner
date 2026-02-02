/**
 * 日系風格 - 景點介紹頁面範本
 *
 * 設計特點：
 * - 雙景點版面配置
 * - 每個景點包含：編號、名稱、英文名、照片、介紹文字
 * - 左側裝飾線條
 * - 底部頁碼與主題標示
 */
import type { PageTemplate, TemplateData } from './types'
import type { CanvasElement, ShapeElement, TextElement, ImageElement, TextStyle } from '@/features/designer/components/types'

// A5 尺寸（像素，96 DPI）
const A5_WIDTH = 559
const A5_HEIGHT = 794

// 顏色定義
const COLORS = {
  ink: '#3e3a36',
  inkLight: '#757068',
  primary: '#8e8070',
  primaryLight: 'rgba(142, 128, 112, 0.3)',
  paperWhite: '#fcfbf9',
  border: '#e5e1dc',
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

export const japaneseStyleV1Attraction: PageTemplate = {
  id: 'japanese-style-v1-attraction',
  name: '日系風格 - 景點介紹',
  description: '雙景點介紹頁面，適合展示當日重點景點',
  thumbnailUrl: '/templates/japanese-style-v1-attraction.png',
  category: 'info',

  generateElements: (data: TemplateData): CanvasElement[] => {
    zIndexCounter = 0
    const elements: CanvasElement[] = []

    // 取得當前景點頁的資料
    const attractionPageIndex = data.currentAttractionPageIndex || 0
    const attractions = data.attractions || []
    const attraction1 = attractions[attractionPageIndex * 2] || {
      nameZh: '景點名稱',
      nameEn: 'Attraction Name',
      description: '景點介紹文字',
    }
    const attraction2 = attractions[attractionPageIndex * 2 + 1] || {
      nameZh: '景點名稱',
      nameEn: 'Attraction Name',
      description: '景點介紹文字',
    }

    // 頁面基本資訊
    const regionName = data.destination || '景點介紹'
    const pageNumber = (data.currentPageNumber || 8).toString().padStart(2, '0')

    // === 背景 ===
    const bgElement: ShapeElement = {
      ...createBaseElement('attraction-bg', '頁面背景'),
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

    // === 景點一區域 (上半部) ===
    const section1Y = 32
    const section1Height = (A5_HEIGHT - 64 - 24) / 2 // 減去上下邊距和中間分隔

    // 景點一編號標籤
    const label1Element: TextElement = {
      ...createBaseElement('attraction-1-label', '景點一編號'),
      type: 'text',
      x: 32,
      y: section1Y,
      width: 150,
      height: 14,
      content: 'ATTRACTION 01',
      style: createTextStyle({
        fontSize: 8,
        fontWeight: 'bold',
        letterSpacing: 3,
        color: COLORS.primary,
      }),
    }
    elements.push(label1Element)

    // 景點一名稱
    const name1Element: TextElement = {
      ...createBaseElement('attraction-1-name', '景點一名稱'),
      type: 'text',
      x: 32,
      y: section1Y + 18,
      width: 200,
      height: 32,
      content: attraction1.nameZh,
      style: createTextStyle({
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 4,
        color: COLORS.ink,
      }),
    }
    elements.push(name1Element)

    // 景點一英文名（右側）
    const nameEn1Element: TextElement = {
      ...createBaseElement('attraction-1-name-en', '景點一英文名'),
      type: 'text',
      x: A5_WIDTH - 32 - 120,
      y: section1Y + 32,
      width: 120,
      height: 16,
      content: attraction1.nameEn || 'Attraction',
      style: createTextStyle({
        fontSize: 10,
        fontStyle: 'italic',
        color: COLORS.inkLight,
        textAlign: 'right',
      }),
    }
    elements.push(nameEn1Element)

    // 景點一圖片區域
    const img1Y = section1Y + 58
    const img1Height = 140

    // 圖片背景
    const imgBg1Element: ShapeElement = {
      ...createBaseElement('attraction-1-img-bg', '景點一圖片背景'),
      type: 'shape',
      x: 32,
      y: img1Y,
      width: A5_WIDTH - 64,
      height: img1Height,
      variant: 'rectangle',
      fill: '#e0deda',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 0,
    }
    elements.push(imgBg1Element)

    // 如果有圖片
    if (attraction1.image) {
      const img1Element: ImageElement = {
        ...createBaseElement('attraction-1-img', '景點一圖片'),
        type: 'image',
        x: 32,
        y: img1Y,
        width: A5_WIDTH - 64,
        height: img1Height,
        src: attraction1.image,
        objectFit: 'cover',
      }
      elements.push(img1Element)
    }

    // 景點一介紹區域
    const desc1Y = img1Y + img1Height + 12

    // 左側裝飾線
    const decorLine1Element: ShapeElement = {
      ...createBaseElement('attraction-1-decor-line', '景點一裝飾線'),
      type: 'shape',
      x: 32,
      y: desc1Y + 4,
      width: 3,
      height: 60,
      variant: 'rectangle',
      fill: COLORS.primaryLight,
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 2,
    }
    elements.push(decorLine1Element)

    // 景點一介紹文字
    const desc1Element: TextElement = {
      ...createBaseElement('attraction-1-desc', '景點一介紹'),
      type: 'text',
      x: 48,
      y: desc1Y,
      width: A5_WIDTH - 80,
      height: 70,
      content: attraction1.description,
      style: createTextStyle({
        fontSize: 11,
        lineHeight: 1.8,
        color: COLORS.inkLight,
        textAlign: 'left',
      }),
    }
    elements.push(desc1Element)

    // === 中間分隔線 ===
    const dividerY = section1Y + section1Height + 8
    const dividerElement: ShapeElement = {
      ...createBaseElement('attraction-divider', '中間分隔線'),
      type: 'shape',
      x: 32,
      y: dividerY,
      width: A5_WIDTH - 64,
      height: 1,
      variant: 'rectangle',
      fill: COLORS.primaryLight,
      stroke: 'transparent',
      strokeWidth: 0,
    }
    elements.push(dividerElement)

    // === 景點二區域 (下半部) ===
    const section2Y = dividerY + 20

    // 景點二編號標籤
    const label2Element: TextElement = {
      ...createBaseElement('attraction-2-label', '景點二編號'),
      type: 'text',
      x: 32,
      y: section2Y,
      width: 150,
      height: 14,
      content: 'ATTRACTION 02',
      style: createTextStyle({
        fontSize: 8,
        fontWeight: 'bold',
        letterSpacing: 3,
        color: COLORS.primary,
      }),
    }
    elements.push(label2Element)

    // 景點二名稱
    const name2Element: TextElement = {
      ...createBaseElement('attraction-2-name', '景點二名稱'),
      type: 'text',
      x: 32,
      y: section2Y + 18,
      width: 200,
      height: 32,
      content: attraction2.nameZh,
      style: createTextStyle({
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 4,
        color: COLORS.ink,
      }),
    }
    elements.push(name2Element)

    // 景點二英文名（右側）
    const nameEn2Element: TextElement = {
      ...createBaseElement('attraction-2-name-en', '景點二英文名'),
      type: 'text',
      x: A5_WIDTH - 32 - 120,
      y: section2Y + 32,
      width: 120,
      height: 16,
      content: attraction2.nameEn || 'Attraction',
      style: createTextStyle({
        fontSize: 10,
        fontStyle: 'italic',
        color: COLORS.inkLight,
        textAlign: 'right',
      }),
    }
    elements.push(nameEn2Element)

    // 景點二圖片區域
    const img2Y = section2Y + 58
    const img2Height = 140

    // 圖片背景
    const imgBg2Element: ShapeElement = {
      ...createBaseElement('attraction-2-img-bg', '景點二圖片背景'),
      type: 'shape',
      x: 32,
      y: img2Y,
      width: A5_WIDTH - 64,
      height: img2Height,
      variant: 'rectangle',
      fill: '#e0deda',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 0,
    }
    elements.push(imgBg2Element)

    // 如果有圖片
    if (attraction2.image) {
      const img2Element: ImageElement = {
        ...createBaseElement('attraction-2-img', '景點二圖片'),
        type: 'image',
        x: 32,
        y: img2Y,
        width: A5_WIDTH - 64,
        height: img2Height,
        src: attraction2.image,
        objectFit: 'cover',
      }
      elements.push(img2Element)
    }

    // 景點二介紹區域
    const desc2Y = img2Y + img2Height + 12

    // 左側裝飾線
    const decorLine2Element: ShapeElement = {
      ...createBaseElement('attraction-2-decor-line', '景點二裝飾線'),
      type: 'shape',
      x: 32,
      y: desc2Y + 4,
      width: 3,
      height: 60,
      variant: 'rectangle',
      fill: COLORS.primaryLight,
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 2,
    }
    elements.push(decorLine2Element)

    // 景點二介紹文字
    const desc2Element: TextElement = {
      ...createBaseElement('attraction-2-desc', '景點二介紹'),
      type: 'text',
      x: 48,
      y: desc2Y,
      width: A5_WIDTH - 80,
      height: 70,
      content: attraction2.description,
      style: createTextStyle({
        fontSize: 11,
        lineHeight: 1.8,
        color: COLORS.inkLight,
        textAlign: 'left',
      }),
    }
    elements.push(desc2Element)

    // === 底部頁碼區域 ===
    const footerY = A5_HEIGHT - 28

    // 主題標籤
    const themeLabelElement: TextElement = {
      ...createBaseElement('attraction-theme-label', '主題標籤'),
      type: 'text',
      x: A5_WIDTH - 32 - 150,
      y: footerY,
      width: 80,
      height: 12,
      content: regionName.toUpperCase() + ' TRIP',
      style: createTextStyle({
        fontSize: 7,
        fontWeight: 'bold',
        letterSpacing: 2,
        color: COLORS.primary,
        textAlign: 'right',
      }),
    }
    elements.push(themeLabelElement)

    // 分隔線
    const footerDividerElement: ShapeElement = {
      ...createBaseElement('attraction-footer-divider', '底部分隔線'),
      type: 'shape',
      x: A5_WIDTH - 32 - 60,
      y: footerY + 4,
      width: 1,
      height: 8,
      variant: 'rectangle',
      fill: COLORS.primaryLight,
      stroke: 'transparent',
      strokeWidth: 0,
    }
    elements.push(footerDividerElement)

    // 頁碼
    const pageNumberElement: TextElement = {
      ...createBaseElement('attraction-page-number', '頁碼'),
      type: 'text',
      x: A5_WIDTH - 32 - 50,
      y: footerY,
      width: 50,
      height: 12,
      content: `p. ${pageNumber}`,
      style: createTextStyle({
        fontSize: 8,
        color: COLORS.ink,
        textAlign: 'right',
      }),
    }
    elements.push(pageNumberElement)

    return elements
  },
}
