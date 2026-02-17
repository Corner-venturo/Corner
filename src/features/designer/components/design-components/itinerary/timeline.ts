import type { DesignComponent, ComponentGenerateOptions } from '../types'
import { getStylePalette } from '../types'
import type { CanvasElement, TextElement, ShapeElement } from '../../types'

export const timelineComponent: DesignComponent = {
  id: 'timeline-itinerary',
  name: '時間軸行程',
  category: 'itinerary',
  icon: 'Clock',
  description: '直式時間軸，適合展示每日行程',
  defaultWidth: 495,
  defaultHeight: 320,
  generate: (options: ComponentGenerateOptions): CanvasElement[] => {
    const { x, y, width } = options
    const ts = Date.now()
    const p = getStylePalette(options.style)
    const elements: CanvasElement[] = []

    // 標題
    elements.push({
      id: `comp-tl-title-${ts}`, type: 'text', name: '時間軸標題',
      x, y, width: 200, height: 24,
      zIndex: 2, rotation: 0, opacity: 1, locked: false, visible: true,
      content: 'DAY 1 行程',
      style: { fontFamily: p.fontFamily, fontSize: 14, fontWeight: '700', fontStyle: 'normal', color: p.primary, textAlign: 'left', lineHeight: 1.2, letterSpacing: 0.5 },
    } as TextElement)

    // 時間軸線
    elements.push({
      id: `comp-tl-line-${ts}`, type: 'shape', name: '時間軸線', variant: 'rectangle',
      x: x + 50, y: y + 40, width: 2, height: 260,
      zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
      fill: p.accent, stroke: 'transparent', strokeWidth: 0,
    } as ShapeElement)

    // 時間點
    const points = [
      { time: '08:30', text: '飯店出發' },
      { time: '09:30', text: '淺草寺・雷門參拜' },
      { time: '12:00', text: '午餐：日式定食' },
      { time: '14:00', text: '東京晴空塔展望台' },
      { time: '17:00', text: '仲見世通商店街自由逛街' },
      { time: '19:00', text: '返回飯店' },
    ]

    points.forEach((pt, i) => {
      const py = y + 45 + i * 44

      // 圓點
      elements.push({
        id: `comp-tl-dot-${i}-${ts}`, type: 'shape', name: `時間點${i + 1}`, variant: 'circle',
        x: x + 44, y: py, width: 14, height: 14,
        zIndex: 3, rotation: 0, opacity: 1, locked: false, visible: true,
        fill: p.accent, stroke: '#ffffff', strokeWidth: 2,
      } as ShapeElement)

      // 時間
      elements.push({
        id: `comp-tl-time-${i}-${ts}`, type: 'text', name: `時間${i + 1}`,
        x, y: py - 2, width: 40, height: 16,
        zIndex: 2, rotation: 0, opacity: 1, locked: false, visible: true,
        content: pt.time,
        style: { fontFamily: p.fontFamily, fontSize: 10, fontWeight: '600', fontStyle: 'normal', color: p.accent, textAlign: 'right', lineHeight: 1, letterSpacing: 0 },
      } as TextElement)

      // 活動
      elements.push({
        id: `comp-tl-act-${i}-${ts}`, type: 'text', name: `活動${i + 1}`,
        x: x + 68, y: py - 2, width: width - 68, height: 16,
        zIndex: 2, rotation: 0, opacity: 1, locked: false, visible: true,
        content: pt.text,
        style: { fontFamily: p.fontFamily, fontSize: 11, fontWeight: '400', fontStyle: 'normal', color: p.primary, textAlign: 'left', lineHeight: 1.2, letterSpacing: 0.3 },
      } as TextElement)
    })

    return elements
  },
}
