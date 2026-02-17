import type { DesignComponent, ComponentGenerateOptions } from '../types'
import type { CanvasElement, TextElement, ShapeElement } from '../../types'

const COLORS = { gold: '#c9aa7c', black: '#181511', gray: '#666666', lightBg: '#faf8f5' }

export const hotelCard: DesignComponent = {
  id: 'hotel-card',
  name: '飯店卡片',
  category: 'info',
  icon: 'Hotel',
  description: '照片區 + 飯店名稱 + 地址 + 星級',
  defaultWidth: 495,
  defaultHeight: 160,
  generate: (options: ComponentGenerateOptions): CanvasElement[] => {
    const { x, y, width } = options
    const ts = Date.now()
    const data = options.data || {}
    const elements: CanvasElement[] = []

    // 背景
    elements.push({
      id: `comp-ht-bg-${ts}`, type: 'shape', name: '飯店背景', variant: 'rectangle',
      x, y, width, height: 150,
      zIndex: 0, rotation: 0, opacity: 1, locked: false, visible: true,
      fill: COLORS.lightBg, stroke: COLORS.gold, strokeWidth: 1, cornerRadius: 8,
    } as ShapeElement)

    // 圖片佔位
    elements.push({
      id: `comp-ht-img-${ts}`, type: 'shape', name: '飯店照片', variant: 'rectangle',
      x: x + 12, y: y + 12, width: 126, height: 126,
      zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
      fill: '#e8e4df', stroke: 'transparent', strokeWidth: 0, cornerRadius: 6,
    } as ShapeElement)

    // 飯店名稱
    elements.push({
      id: `comp-ht-name-${ts}`, type: 'text', name: '飯店名稱',
      x: x + 152, y: y + 16, width: width - 168, height: 22,
      zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
      content: (data.hotelName as string) || '東京新宿華盛頓飯店',
      style: { fontFamily: 'Noto Sans TC', fontSize: 14, fontWeight: '700', fontStyle: 'normal', color: COLORS.black, textAlign: 'left', lineHeight: 1.3, letterSpacing: 0.5 },
    } as TextElement)

    // 星級
    elements.push({
      id: `comp-ht-stars-${ts}`, type: 'text', name: '星級',
      x: x + 152, y: y + 42, width: 100, height: 16,
      zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
      content: '★★★★☆',
      style: { fontFamily: 'Noto Sans TC', fontSize: 11, fontWeight: '400', fontStyle: 'normal', color: COLORS.gold, textAlign: 'left', lineHeight: 1, letterSpacing: 2 },
    } as TextElement)

    // 地址
    elements.push({
      id: `comp-ht-addr-${ts}`, type: 'text', name: '地址',
      x: x + 152, y: y + 64, width: width - 168, height: 30,
      zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
      content: (data.address as string) || '〒160-0023 東京都新宿区西新宿3-2-9',
      style: { fontFamily: 'Noto Sans TC', fontSize: 10, fontWeight: '400', fontStyle: 'normal', color: COLORS.gray, textAlign: 'left', lineHeight: 1.4, letterSpacing: 0.3 },
    } as TextElement)

    // 電話
    elements.push({
      id: `comp-ht-tel-${ts}`, type: 'text', name: '電話',
      x: x + 152, y: y + 96, width: width - 168, height: 16,
      zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
      content: (data.phone as string) || 'TEL: +81-3-3343-3111',
      style: { fontFamily: 'Noto Sans TC', fontSize: 10, fontWeight: '400', fontStyle: 'normal', color: COLORS.gray, textAlign: 'left', lineHeight: 1, letterSpacing: 0.3 },
    } as TextElement)

    // 入住日期
    elements.push({
      id: `comp-ht-dates-${ts}`, type: 'text', name: '入住日期',
      x: x + 152, y: y + 116, width: width - 168, height: 16,
      zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
      content: (data.stayDates as string) || '入住：Day 1 ~ Day 3',
      style: { fontFamily: 'Noto Sans TC', fontSize: 10, fontWeight: '500', fontStyle: 'normal', color: COLORS.gold, textAlign: 'left', lineHeight: 1, letterSpacing: 0.3 },
    } as TextElement)

    return elements
  },
}
