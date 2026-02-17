import type { DesignComponent, ComponentGenerateOptions } from '../types'
import type { CanvasElement, TextElement, ShapeElement } from '../../types'

const A5_WIDTH = 559

export const minimalCover: DesignComponent = {
  id: 'minimal-cover',
  name: '簡約封面',
  category: 'cover',
  icon: 'Minus',
  description: '大標題 + 裝飾線，適合簡潔風格',
  defaultWidth: A5_WIDTH,
  defaultHeight: 794,
  generate: (options: ComponentGenerateOptions): CanvasElement[] => {
    const ts = Date.now()
    const data = options.data || {}
    const elements: CanvasElement[] = []

    // 背景色塊
    elements.push({
      id: `comp-mc-bg-${ts}`,
      type: 'shape', name: '背景', variant: 'rectangle',
      x: 0, y: 0, width: A5_WIDTH, height: 794,
      zIndex: 0, rotation: 0, opacity: 1, locked: true, visible: true,
      fill: '#faf8f5', stroke: 'transparent', strokeWidth: 0,
    } as ShapeElement)

    // 上方裝飾線
    elements.push({
      id: `comp-mc-top-line-${ts}`,
      type: 'shape', name: '上方裝飾線', variant: 'rectangle',
      x: (A5_WIDTH - 120) / 2, y: 300, width: 120, height: 1,
      zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
      fill: '#c9aa7c', stroke: 'transparent', strokeWidth: 0,
    } as ShapeElement)

    // 大標題
    elements.push({
      id: `comp-mc-title-${ts}`,
      type: 'text', name: '主標題',
      x: 40, y: 320, width: A5_WIDTH - 80, height: 60,
      zIndex: 2, rotation: 0, opacity: 1, locked: false, visible: true,
      content: (data.tourName as string) || '旅行手冊',
      style: {
        fontFamily: 'Noto Sans TC', fontSize: 32, fontWeight: '900', fontStyle: 'normal',
        textAlign: 'center', lineHeight: 1.3, letterSpacing: 4, color: '#181511',
      },
    } as TextElement)

    // 下方裝飾線
    elements.push({
      id: `comp-mc-bottom-line-${ts}`,
      type: 'shape', name: '下方裝飾線', variant: 'rectangle',
      x: (A5_WIDTH - 120) / 2, y: 400, width: 120, height: 1,
      zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
      fill: '#c9aa7c', stroke: 'transparent', strokeWidth: 0,
    } as ShapeElement)

    // 副標題
    elements.push({
      id: `comp-mc-subtitle-${ts}`,
      type: 'text', name: '副標題',
      x: 40, y: 420, width: A5_WIDTH - 80, height: 20,
      zIndex: 2, rotation: 0, opacity: 1, locked: false, visible: true,
      content: (data.subtitle as string) || 'TRAVEL GUIDE',
      style: {
        fontFamily: 'Noto Sans TC', fontSize: 10, fontWeight: '400', fontStyle: 'normal',
        textAlign: 'center', lineHeight: 1.4, letterSpacing: 3, color: '#999999',
      },
    } as TextElement)

    // 日期
    elements.push({
      id: `comp-mc-date-${ts}`,
      type: 'text', name: '日期',
      x: 40, y: 460, width: A5_WIDTH - 80, height: 16,
      zIndex: 2, rotation: 0, opacity: 1, locked: false, visible: true,
      content: (data.dateRange as string) || '2025.01.15 — 2025.01.19',
      style: {
        fontFamily: 'Noto Sans TC', fontSize: 9, fontWeight: '400', fontStyle: 'normal',
        textAlign: 'center', lineHeight: 1.4, letterSpacing: 1.5, color: '#999999',
      },
    } as TextElement)

    return elements
  },
}
