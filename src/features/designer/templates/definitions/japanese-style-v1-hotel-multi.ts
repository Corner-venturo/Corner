/**
 * 日系風格 - 飯店介紹頁面範本（多飯店版本）
 *
 * 設計特點：
 * - 頁面標題「精選住宿」+ 英文副標題
 * - 主要飯店：大圖 + 名稱 + 描述 + 標籤
 * - 次要飯店：兩欄式小圖 + 名稱
 * - 底部頁碼與裝飾
 */
import type { PageTemplate, TemplateData, HotelData } from './types'
import type { CanvasElement, ShapeElement, TextElement, ImageElement, IconElement, TextStyle } from '@/features/designer/components/types'

// A5 尺寸（像素，96 DPI）
const A5_WIDTH = 559
const A5_HEIGHT = 794

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

// 預設飯店資料
function getDefaultHotel(index: number): HotelData {
  const hotels = [
    {
      id: 'default-hotel-1',
      nameZh: '星野集團 界 由布院',
      nameEn: 'Hoshino Resorts KAI Yufuin',
      location: '大分縣由布市湯布院町川上',
      description: '位於由布院溫泉的深處，被梯田與群山環繞的溫泉旅館。設計由名建築師隈研吾操刀，將建築與自然景觀完美融合。',
      tags: ['露天溫泉', '梯田景觀', '懷石料理'],
      enabled: true,
    },
    {
      id: 'default-hotel-2',
      nameZh: '由布院玉之湯',
      nameEn: 'Yufuin Tamanoyu',
      location: '大分縣由布市湯布院町',
      description: '傳統日式溫泉旅館，享有優美庭園景觀。',
      tags: ['溫泉', '和室'],
      enabled: true,
    },
    {
      id: 'default-hotel-3',
      nameZh: '別府灣皇家酒店',
      nameEn: 'Beppu Bay Royal Hotel',
      location: '大分縣別府市',
      description: '面朝別府灣的現代化溫泉酒店。',
      tags: ['海景', '溫泉'],
      enabled: true,
    },
  ]
  return hotels[index] || hotels[0]
}

export const japaneseStyleV1HotelMulti: PageTemplate = {
  id: 'japanese-style-v1-hotel-multi',
  name: '日系風格 - 飯店介紹（多飯店）',
  description: '精選住宿頁面，展示1個主要飯店和2個次要飯店',
  thumbnailUrl: '/templates/japanese-style-v1-hotel-multi.png',
  category: 'info',

  generateElements: (data: TemplateData): CanvasElement[] => {
    zIndexCounter = 0
    const elements: CanvasElement[] = []

    // 取得飯店資料（3 間）
    const hotelPageIndex = data.currentHotelPageIndex ?? 0
    const allHotels = data.hotels?.filter(h => h.enabled !== false) ?? []
    const startIndex = hotelPageIndex * 3
    const hotel1 = allHotels[startIndex] ?? getDefaultHotel(0)
    const hotel2 = allHotels[startIndex + 1] ?? getDefaultHotel(1)
    const hotel3 = allHotels[startIndex + 2] ?? getDefaultHotel(2)

    const pageNumber = (data.currentPageNumber || 10).toString().padStart(2, '0')

    // === 背景 ===
    const bgElement: ShapeElement = {
      ...createBaseElement('hotel-multi-bg', '頁面背景'),
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

    // === 頁面標題區域 ===
    const titleY = 32

    // 標題標籤
    const titleLabelElement: TextElement = {
      ...createBaseElement('hotel-multi-title-label', '標題標籤'),
      type: 'text',
      x: 32,
      y: titleY,
      width: 150,
      height: 14,
      content: 'RECOMMENDED HOTELS',
      style: createTextStyle({
        fontSize: 8,
        fontWeight: 'bold',
        letterSpacing: 3,
        color: COLORS.primary,
      }),
    }
    elements.push(titleLabelElement)

    // 主標題
    const titleElement: TextElement = {
      ...createBaseElement('hotel-multi-title', '主標題'),
      type: 'text',
      x: 32,
      y: titleY + 18,
      width: 200,
      height: 36,
      content: '精選住宿',
      style: createTextStyle({
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 6,
        color: COLORS.ink,
      }),
    }
    elements.push(titleElement)

    // === 主要飯店區域 ===
    const primaryY = titleY + 70
    const primaryImgHeight = 180

    // 主飯店編號標籤
    const primary1LabelElement: TextElement = {
      ...createBaseElement('hotel-multi-primary-label', '主飯店編號'),
      type: 'text',
      x: 32,
      y: primaryY,
      width: 100,
      height: 14,
      content: 'HOTEL 01',
      style: createTextStyle({
        fontSize: 8,
        fontWeight: 'bold',
        letterSpacing: 3,
        color: COLORS.primary,
      }),
    }
    elements.push(primary1LabelElement)

    // 主飯店圖片背景
    const primaryImgY = primaryY + 20
    const primaryImgBgElement: ShapeElement = {
      ...createBaseElement('hotel-multi-primary-img-bg', '主飯店圖片背景'),
      type: 'shape',
      x: 32,
      y: primaryImgY,
      width: A5_WIDTH - 64,
      height: primaryImgHeight,
      variant: 'rectangle',
      fill: '#e0deda',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 4,
    }
    elements.push(primaryImgBgElement)

    // 主飯店圖片
    if (hotel1.image) {
      const primaryImgElement: ImageElement = {
        ...createBaseElement('hotel-multi-primary-img', '主飯店圖片'),
        type: 'image',
        x: 32,
        y: primaryImgY,
        width: A5_WIDTH - 64,
        height: primaryImgHeight,
        src: hotel1.image,
        objectFit: 'cover',
        borderRadius: {
          topLeft: 4,
          topRight: 4,
          bottomLeft: 4,
          bottomRight: 4,
        },
      }
      elements.push(primaryImgElement)
    } else {
      // 無圖片時顯示佔位圖標
      const placeholderIcon: IconElement = {
        ...createBaseElement('hotel-multi-primary-placeholder', '主飯店圖片佔位'),
        type: 'icon',
        x: A5_WIDTH / 2 - 24,
        y: primaryImgY + primaryImgHeight / 2 - 24,
        width: 48,
        height: 48,
        icon: 'image',
        size: 48,
        color: 'rgba(62, 58, 54, 0.2)',
      }
      elements.push(placeholderIcon)
    }

    // 主飯店名稱
    const primaryInfoY = primaryImgY + primaryImgHeight + 16
    const primaryNameElement: TextElement = {
      ...createBaseElement('hotel-multi-primary-name', '主飯店名稱'),
      type: 'text',
      x: 32,
      y: primaryInfoY,
      width: A5_WIDTH - 64,
      height: 28,
      content: hotel1.nameZh || '飯店名稱',
      style: createTextStyle({
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 3,
        color: COLORS.ink,
      }),
    }
    elements.push(primaryNameElement)

    // 主飯店英文名
    if (hotel1.nameEn) {
      const primaryNameEnElement: TextElement = {
        ...createBaseElement('hotel-multi-primary-name-en', '主飯店英文名'),
        type: 'text',
        x: 32,
        y: primaryInfoY + 28,
        width: A5_WIDTH - 64,
        height: 16,
        content: hotel1.nameEn.toUpperCase(),
        style: createTextStyle({
          fontSize: 9,
          fontWeight: '500',
          letterSpacing: 2,
          color: COLORS.inkLight,
        }),
      }
      elements.push(primaryNameEnElement)
    }

    // 主飯店描述
    if (hotel1.description) {
      const primaryDescElement: TextElement = {
        ...createBaseElement('hotel-multi-primary-desc', '主飯店描述'),
        type: 'text',
        x: 32,
        y: primaryInfoY + 50,
        width: A5_WIDTH - 64,
        height: 48,
        content: hotel1.description,
        style: createTextStyle({
          fontSize: 11,
          lineHeight: 1.8,
          color: COLORS.inkLight,
        }),
      }
      elements.push(primaryDescElement)
    }

    // 主飯店標籤
    if (hotel1.tags && hotel1.tags.length > 0) {
      let tagX = 32
      const tagY = primaryInfoY + 100
      const tagHeight = 18
      const tagPaddingX = 8
      const tagGap = 8

      hotel1.tags.slice(0, 4).forEach((tag, index) => {
        const tagWidth = tag.length * 10 + tagPaddingX * 2 + 4

        // 標籤背景
        const tagBgElement: ShapeElement = {
          ...createBaseElement(`hotel-multi-primary-tag-bg-${index}`, `主飯店標籤背景-${tag}`),
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
          ...createBaseElement(`hotel-multi-primary-tag-${index}`, `主飯店標籤-${tag}`),
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

    // === 分隔線 ===
    const dividerY = primaryInfoY + 130
    const dividerElement: ShapeElement = {
      ...createBaseElement('hotel-multi-divider', '中間分隔線'),
      type: 'shape',
      x: 32,
      y: dividerY,
      width: A5_WIDTH - 64,
      height: 1,
      variant: 'rectangle',
      fill: COLORS.border,
      stroke: 'transparent',
      strokeWidth: 0,
    }
    elements.push(dividerElement)

    // === 次要飯店區域（兩欄） ===
    const secondaryY = dividerY + 20
    const secondaryWidth = (A5_WIDTH - 64 - 16) / 2 // 減去左右邊距和中間間距
    const secondaryImgHeight = 100

    // 次要飯店 2
    const secondary2X = 32

    // 飯店2編號標籤
    const secondary2LabelElement: TextElement = {
      ...createBaseElement('hotel-multi-secondary2-label', '飯店2編號'),
      type: 'text',
      x: secondary2X,
      y: secondaryY,
      width: 100,
      height: 14,
      content: 'HOTEL 02',
      style: createTextStyle({
        fontSize: 7,
        fontWeight: 'bold',
        letterSpacing: 2,
        color: COLORS.primary,
      }),
    }
    elements.push(secondary2LabelElement)

    // 飯店2圖片背景
    const secondary2ImgY = secondaryY + 16
    const secondary2ImgBgElement: ShapeElement = {
      ...createBaseElement('hotel-multi-secondary2-img-bg', '飯店2圖片背景'),
      type: 'shape',
      x: secondary2X,
      y: secondary2ImgY,
      width: secondaryWidth,
      height: secondaryImgHeight,
      variant: 'rectangle',
      fill: '#e0deda',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 4,
    }
    elements.push(secondary2ImgBgElement)

    // 飯店2圖片
    if (hotel2.image) {
      const secondary2ImgElement: ImageElement = {
        ...createBaseElement('hotel-multi-secondary2-img', '飯店2圖片'),
        type: 'image',
        x: secondary2X,
        y: secondary2ImgY,
        width: secondaryWidth,
        height: secondaryImgHeight,
        src: hotel2.image,
        objectFit: 'cover',
        borderRadius: {
          topLeft: 4,
          topRight: 4,
          bottomLeft: 4,
          bottomRight: 4,
        },
      }
      elements.push(secondary2ImgElement)
    }

    // 飯店2名稱
    const secondary2NameElement: TextElement = {
      ...createBaseElement('hotel-multi-secondary2-name', '飯店2名稱'),
      type: 'text',
      x: secondary2X,
      y: secondary2ImgY + secondaryImgHeight + 10,
      width: secondaryWidth,
      height: 20,
      content: hotel2.nameZh || '飯店名稱',
      style: createTextStyle({
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 2,
        color: COLORS.ink,
      }),
    }
    elements.push(secondary2NameElement)

    // 飯店2英文名
    if (hotel2.nameEn) {
      const secondary2NameEnElement: TextElement = {
        ...createBaseElement('hotel-multi-secondary2-name-en', '飯店2英文名'),
        type: 'text',
        x: secondary2X,
        y: secondary2ImgY + secondaryImgHeight + 30,
        width: secondaryWidth,
        height: 14,
        content: hotel2.nameEn,
        style: createTextStyle({
          fontSize: 8,
          color: COLORS.inkLight,
        }),
      }
      elements.push(secondary2NameEnElement)
    }

    // 次要飯店 3
    const secondary3X = 32 + secondaryWidth + 16

    // 飯店3編號標籤
    const secondary3LabelElement: TextElement = {
      ...createBaseElement('hotel-multi-secondary3-label', '飯店3編號'),
      type: 'text',
      x: secondary3X,
      y: secondaryY,
      width: 100,
      height: 14,
      content: 'HOTEL 03',
      style: createTextStyle({
        fontSize: 7,
        fontWeight: 'bold',
        letterSpacing: 2,
        color: COLORS.primary,
      }),
    }
    elements.push(secondary3LabelElement)

    // 飯店3圖片背景
    const secondary3ImgBgElement: ShapeElement = {
      ...createBaseElement('hotel-multi-secondary3-img-bg', '飯店3圖片背景'),
      type: 'shape',
      x: secondary3X,
      y: secondary2ImgY,
      width: secondaryWidth,
      height: secondaryImgHeight,
      variant: 'rectangle',
      fill: '#e0deda',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 4,
    }
    elements.push(secondary3ImgBgElement)

    // 飯店3圖片
    if (hotel3.image) {
      const secondary3ImgElement: ImageElement = {
        ...createBaseElement('hotel-multi-secondary3-img', '飯店3圖片'),
        type: 'image',
        x: secondary3X,
        y: secondary2ImgY,
        width: secondaryWidth,
        height: secondaryImgHeight,
        src: hotel3.image,
        objectFit: 'cover',
        borderRadius: {
          topLeft: 4,
          topRight: 4,
          bottomLeft: 4,
          bottomRight: 4,
        },
      }
      elements.push(secondary3ImgElement)
    }

    // 飯店3名稱
    const secondary3NameElement: TextElement = {
      ...createBaseElement('hotel-multi-secondary3-name', '飯店3名稱'),
      type: 'text',
      x: secondary3X,
      y: secondary2ImgY + secondaryImgHeight + 10,
      width: secondaryWidth,
      height: 20,
      content: hotel3.nameZh || '飯店名稱',
      style: createTextStyle({
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 2,
        color: COLORS.ink,
      }),
    }
    elements.push(secondary3NameElement)

    // 飯店3英文名
    if (hotel3.nameEn) {
      const secondary3NameEnElement: TextElement = {
        ...createBaseElement('hotel-multi-secondary3-name-en', '飯店3英文名'),
        type: 'text',
        x: secondary3X,
        y: secondary2ImgY + secondaryImgHeight + 30,
        width: secondaryWidth,
        height: 14,
        content: hotel3.nameEn,
        style: createTextStyle({
          fontSize: 8,
          color: COLORS.inkLight,
        }),
      }
      elements.push(secondary3NameEnElement)
    }

    // === 底部區域 ===
    const footerY = A5_HEIGHT - 40

    // 裝飾點
    const dotGap = 8
    const dotSize = 3
    const dotsStartX = 32
    for (let i = 0; i < 5; i++) {
      const dotElement: ShapeElement = {
        ...createBaseElement(`hotel-multi-footer-dot-${i}`, `裝飾點${i + 1}`),
        type: 'shape',
        x: dotsStartX + i * dotGap,
        y: footerY + 6,
        width: dotSize,
        height: dotSize,
        variant: 'circle',
        fill: i === 0 ? COLORS.primary : COLORS.border,
        stroke: 'transparent',
        strokeWidth: 0,
      }
      elements.push(dotElement)
    }

    // 頁碼
    const pageNumberElement: TextElement = {
      ...createBaseElement('hotel-multi-page-number', '頁碼'),
      type: 'text',
      x: A5_WIDTH - 32 - 60,
      y: footerY,
      width: 60,
      height: 16,
      content: `p. ${pageNumber}`,
      style: createTextStyle({
        fontSize: 9,
        color: COLORS.ink,
        textAlign: 'right',
      }),
    }
    elements.push(pageNumberElement)

    return elements
  },
}
