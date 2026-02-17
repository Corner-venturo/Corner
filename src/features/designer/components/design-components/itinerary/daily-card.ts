import type { DesignComponent, ComponentGenerateOptions } from '../types'
import { DEFAULT_PALETTE } from '../types'
import type { CanvasElement, TextElement, ShapeElement } from '../../types'

export const dailyCard: DesignComponent = {
  id: 'daily-card',
  name: '每日行程卡片',
  category: 'itinerary',
  icon: 'Calendar',
  description: '日期 + 標題 + 活動列表 + 圖片區',
  defaultWidth: 495,
  defaultHeight: 200,
  generate: (options: ComponentGenerateOptions): CanvasElement[] => {
    const { x, y, width } = options
    const ts = Date.now()
    const data = options.data || {}
    const p = DEFAULT_PALETTE
    const elements: CanvasElement[] = []

    // 天數大字
    elements.push({
      id: `comp-dc-num-${ts}`, type: 'text', name: '天數',
      x, y, width: 60, height: 40,
      zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
      content: String(data.dayNumber || '01').padStart(2, '0'),
      style: { fontFamily: p.fontFamily, fontSize: 28, fontWeight: '900', fontStyle: 'normal', color: p.accent, textAlign: 'left', lineHeight: 1, letterSpacing: 0 },
    } as TextElement)

    // DAY 標籤
    elements.push({
      id: `comp-dc-label-${ts}`, type: 'text', name: 'DAY 標籤',
      x: x + 65, y: y + 8, width: 60, height: 20,
      zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
      content: `DAY ${data.dayNumber || 1}`,
      style: { fontFamily: p.fontFamily, fontSize: 11, fontWeight: '400', fontStyle: 'normal', color: p.secondary, textAlign: 'left', lineHeight: 1, letterSpacing: 1 },
    } as TextElement)

    // 日期
    elements.push({
      id: `comp-dc-date-${ts}`, type: 'text', name: '日期',
      x: x + 65, y: y + 22, width: 120, height: 16,
      zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
      content: (data.date as string) || '2025/01/15（三）',
      style: { fontFamily: p.fontFamily, fontSize: 10, fontWeight: '400', fontStyle: 'normal', color: p.secondary, textAlign: 'left', lineHeight: 1, letterSpacing: 0.5 },
    } as TextElement)

    // 行程標題
    elements.push({
      id: `comp-dc-title-${ts}`, type: 'text', name: '行程標題',
      x, y: y + 50, width, height: 24,
      zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
      content: (data.title as string) || '東京市區觀光・淺草寺・晴空塔',
      style: { fontFamily: p.fontFamily, fontSize: 14, fontWeight: '700', fontStyle: 'normal', color: p.primary, textAlign: 'left', lineHeight: 1.4, letterSpacing: 0.5 },
    } as TextElement)

    // 分隔線
    elements.push({
      id: `comp-dc-divider-${ts}`, type: 'shape', name: '分隔線', variant: 'rectangle',
      x, y: y + 80, width, height: 2,
      zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
      fill: p.accent, stroke: 'transparent', strokeWidth: 0,
    } as ShapeElement)

    // 行程內容
    elements.push({
      id: `comp-dc-content-${ts}`, type: 'text', name: '行程內容',
      x, y: y + 90, width, height: 80,
      zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
      content: (data.content as string) || '● 淺草寺・雷門\n● 東京晴空塔展望台\n● 仲見世通商店街\n● 隅田川散步',
      style: { fontFamily: p.fontFamily, fontSize: 11, fontWeight: '400', fontStyle: 'normal', color: p.primary, textAlign: 'left', lineHeight: 1.8, letterSpacing: 0.3 },
    } as TextElement)

    return elements
  },
}
