/**
 * 日系風格 - 飯店介紹頁面範本
 *
 * 設計特點：
 * - 上方 55% 為飯店主圖
 * - 飯店中文名稱 + 英文名稱
 * - 優雅的描述文字區塊
 * - 地點資訊 + 設施標籤
 */
import type { PageTemplate, TemplateData, HotelData } from './types'
import type { CanvasElement, ShapeElement, TextElement, ImageElement, IconElement, TextStyle } from '@/features/designer/components/types'

// A5 尺寸（像素，96 DPI）
const A5_WIDTH = 559
const A5_HEIGHT = 794

// 主圖區域高度（55%）
const IMAGE_HEIGHT = Math.round(A5_HEIGHT * 0.55)

// 顏色定義
const COLORS = {
  ink: '#3e3a36',
  inkLight: '#757068',
  primary: '#8e8070',
  accent: '#b8a896',
  paperWhite: '#fcfbf9',
  border: 'rgba(142, 128, 112, 0.15)',
  tagBg: 'rgba(142, 128, 112, 0.05)',
  tagBorder: 'rgba(142, 128, 112, 0.2)',
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

// 預設飯店資料（佔位提示）
function getDefaultHotel(): HotelData {
  return {
    id: 'default-hotel',
    nameZh: '請從右側面板帶入飯店',
    nameEn: 'Import hotel from the right panel',
    location: '點擊「從行程帶入飯店」或「手動新增飯店」',
    description: '此處將顯示您選擇的飯店介紹文字。您可以在右側面板中編輯飯店名稱、地點、描述和設施標籤等資訊。',
    tags: ['設施標籤', '將顯示於此'],
    enabled: true,
  }
}

export const japaneseStyleV1Hotel: PageTemplate = {
  id: 'japanese-style-v1-hotel',
  name: '日系風格 - 飯店介紹',
  description: '優雅的飯店特寫頁面，展示住宿特色',
  thumbnailUrl: '/templates/japanese-style-v1-hotel.png',
  category: 'hotel',

  generateElements: (data: TemplateData): CanvasElement[] => {
    zIndexCounter = 0
    const elements: CanvasElement[] = []

    // 取得當前飯店資料
    const hotelIndex = data.currentHotelIndex ?? 0
    const hotel = data.hotels?.[hotelIndex] ?? getDefaultHotel()

    // === 背景 ===
    const bgElement: ShapeElement = {
      ...createBaseElement('hotel-bg', '頁面背景'),
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

    // === 主圖區域背景 ===
    const imageBgElement: ShapeElement = {
      ...createBaseElement('hotel-image-bg', '圖片區背景'),
      type: 'shape',
      x: 0,
      y: 0,
      width: A5_WIDTH,
      height: IMAGE_HEIGHT,
      variant: 'rectangle',
      fill: '#e0deda',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 0,
    }
    elements.push(imageBgElement)

    // === 主圖 ===
    if (hotel.image) {
      const imageElement: ImageElement = {
        ...createBaseElement('hotel-image', '飯店主圖'),
        type: 'image',
        x: 0,
        y: 0,
        width: A5_WIDTH,
        height: IMAGE_HEIGHT,
        src: hotel.image,
        objectFit: 'cover',
      }
      elements.push(imageElement)
    }
    // 無圖片時只顯示灰色背景區域（圖片區背景已建立），不再顯示佔位 icon
    // 使用者可從右側面板上傳飯店圖片

    // === 圖片底部分隔線 ===
    const imageBorderElement: ShapeElement = {
      ...createBaseElement('hotel-image-border', '圖片分隔線'),
      type: 'shape',
      x: 0,
      y: IMAGE_HEIGHT - 1,
      width: A5_WIDTH,
      height: 1,
      variant: 'rectangle',
      fill: COLORS.border,
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 0,
    }
    elements.push(imageBorderElement)

    // === 內容區域 ===
    const contentX = 40
    const contentWidth = A5_WIDTH - 80
    let currentY = IMAGE_HEIGHT + 40

    // === 飯店中文名稱 ===
    const nameZhElement: TextElement = {
      ...createBaseElement('hotel-name-zh', '飯店名稱(中文)'),
      type: 'text',
      x: contentX,
      y: currentY,
      width: contentWidth,
      height: 45,
      content: hotel.nameZh || '飯店名稱',
      style: createTextStyle({
        fontFamily: 'Noto Serif TC',
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 4,
        lineHeight: 1.3,
        color: COLORS.ink,
      }),
    }
    elements.push(nameZhElement)
    currentY += 50

    // === 裝飾線 + 英文名稱 ===
    const decorLineElement: ShapeElement = {
      ...createBaseElement('hotel-decor-line', '裝飾線'),
      type: 'shape',
      x: contentX,
      y: currentY + 6,
      width: 32,
      height: 1,
      variant: 'rectangle',
      fill: 'rgba(142, 128, 112, 0.6)',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 0,
    }
    elements.push(decorLineElement)

    if (hotel.nameEn) {
      const nameEnElement: TextElement = {
        ...createBaseElement('hotel-name-en', '飯店名稱(英文)'),
        type: 'text',
        x: contentX + 44,
        y: currentY,
        width: contentWidth - 44,
        height: 16,
        content: hotel.nameEn.toUpperCase(),
        style: createTextStyle({
          fontSize: 10,
          fontWeight: '500',
          letterSpacing: 2,
          color: COLORS.primary,
        }),
      }
      elements.push(nameEnElement)
    }
    currentY += 32

    // === 描述文字 ===
    if (hotel.description) {
      // 引號裝飾
      const quoteElement: TextElement = {
        ...createBaseElement('hotel-quote', '引號裝飾'),
        type: 'text',
        x: contentX - 12,
        y: currentY - 16,
        width: 30,
        height: 40,
        content: '"',
        style: createTextStyle({
          fontFamily: 'Noto Serif TC',
          fontSize: 36,
          color: 'rgba(142, 128, 112, 0.15)',
        }),
      }
      elements.push(quoteElement)

      // 描述文字 - 首行縮排
      const indentedDescription = '　　' + hotel.description // 使用全形空格縮排
      const descriptionElement: TextElement = {
        ...createBaseElement('hotel-description', '飯店描述'),
        type: 'text',
        x: contentX,
        y: currentY,
        width: contentWidth,
        height: 100,
        content: indentedDescription,
        style: createTextStyle({
          fontFamily: 'Noto Serif TC',
          fontSize: 12,
          lineHeight: 2.2,
          letterSpacing: 0.5,
          color: 'rgba(62, 58, 54, 0.85)',
          textAlign: 'left',
        }),
      }
      elements.push(descriptionElement)
      currentY += 110
    }

    // === 底部資訊區 ===
    const bottomY = A5_HEIGHT - 95

    // 分隔線
    const bottomBorderElement: ShapeElement = {
      ...createBaseElement('hotel-bottom-border', '底部分隔線'),
      type: 'shape',
      x: contentX,
      y: bottomY,
      width: contentWidth,
      height: 1,
      variant: 'rectangle',
      fill: COLORS.border,
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 0,
    }
    elements.push(bottomBorderElement)

    // === 地點資訊 ===
    if (hotel.location) {
      const locationIconElement: IconElement = {
        ...createBaseElement('hotel-location-icon', '地點圖標'),
        type: 'icon',
        x: contentX,
        y: bottomY + 18,
        width: 16,
        height: 16,
        icon: 'location_on',
        size: 16,
        color: COLORS.inkLight,
      }
      elements.push(locationIconElement)

      const locationTextElement: TextElement = {
        ...createBaseElement('hotel-location', '地點'),
        type: 'text',
        x: contentX + 22,
        y: bottomY + 18,
        width: contentWidth - 22,
        height: 16,
        content: hotel.location,
        style: createTextStyle({
          fontSize: 10,
          fontWeight: '500',
          letterSpacing: 0.5,
          color: COLORS.inkLight,
        }),
      }
      elements.push(locationTextElement)
    }

    // === 設施標籤 ===
    if (hotel.tags && hotel.tags.length > 0) {
      let tagX = contentX
      const tagY = bottomY + 42
      const tagHeight = 18
      const tagPaddingX = 8
      const tagGap = 8

      hotel.tags.forEach((tag, index) => {
        const tagWidth = tag.length * 10 + tagPaddingX * 2 + 4

        // 標籤背景
        const tagBgElement: ShapeElement = {
          ...createBaseElement(`hotel-tag-bg-${index}`, `標籤背景-${tag}`),
          type: 'shape',
          x: tagX,
          y: tagY,
          width: tagWidth,
          height: tagHeight,
          variant: 'rectangle',
          fill: COLORS.tagBg,
          stroke: COLORS.tagBorder,
          strokeWidth: 1,
          cornerRadius: 2,
        }
        elements.push(tagBgElement)

        // 標籤文字
        const tagTextElement: TextElement = {
          ...createBaseElement(`hotel-tag-${index}`, `標籤-${tag}`),
          type: 'text',
          x: tagX + tagPaddingX,
          y: tagY + 3,
          width: tagWidth - tagPaddingX * 2,
          height: tagHeight - 4,
          content: tag,
          style: createTextStyle({
            fontSize: 9,
            letterSpacing: 0.5,
            color: 'rgba(142, 128, 112, 0.9)',
          }),
        }
        elements.push(tagTextElement)

        tagX += tagWidth + tagGap
      })
    }

    // === 右下角 Recommended Stay 標記 ===
    const recommendedElement: TextElement = {
      ...createBaseElement('hotel-recommended', 'Recommended Stay'),
      type: 'text',
      x: A5_WIDTH - contentX - 100,
      y: A5_HEIGHT - 35,
      width: 100,
      height: 14,
      content: 'Recommended Stay',
      style: createTextStyle({
        fontFamily: 'Noto Serif TC',
        fontSize: 8,
        fontStyle: 'italic',
        color: COLORS.primary,
        textAlign: 'right',
      }),
    }
    elements.push(recommendedElement)

    return elements
  },
}
