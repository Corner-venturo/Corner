import type { DesignComponent, ComponentGenerateOptions } from '../types'
import { DEFAULT_PALETTE } from '../types'
import type { CanvasElement, TextElement, ShapeElement } from '../../types'

export const flightCard: DesignComponent = {
  id: 'flight-card',
  name: '航班資訊卡',
  category: 'info',
  icon: 'Plane',
  description: '去程/回程航班資訊',
  defaultWidth: 495,
  defaultHeight: 120,
  generate: (options: ComponentGenerateOptions): CanvasElement[] => {
    const { x, y, width } = options
    const ts = Date.now()
    const data = options.data || {}
    const p = DEFAULT_PALETTE
    const elements: CanvasElement[] = []

    // 背景
    elements.push({
      id: `comp-fl-bg-${ts}`, type: 'shape', name: '航班背景', variant: 'rectangle',
      x, y, width, height: 110,
      zIndex: 0, rotation: 0, opacity: 1, locked: false, visible: true,
      fill: p.background, stroke: p.accent, strokeWidth: 1, cornerRadius: 8,
    } as ShapeElement)

    // 標題
    elements.push({
      id: `comp-fl-title-${ts}`, type: 'text', name: '航班標題',
      x: x + 16, y: y + 12, width: 150, height: 18,
      zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
      content: '✈ 航班資訊 FLIGHT',
      style: { fontFamily: p.fontFamily, fontSize: 13, fontWeight: '600', fontStyle: 'normal', color: p.accent, textAlign: 'left', lineHeight: 1, letterSpacing: 0.5 },
    } as TextElement)

    // 分隔線
    elements.push({
      id: `comp-fl-div-${ts}`, type: 'shape', name: '分隔線', variant: 'rectangle',
      x: x + 16, y: y + 36, width: width - 32, height: 1,
      zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
      fill: p.border, stroke: 'transparent', strokeWidth: 0,
    } as ShapeElement)

    // 去程
    elements.push({
      id: `comp-fl-outbound-${ts}`, type: 'text', name: '去程航班',
      x: x + 16, y: y + 46, width: width - 32, height: 18,
      zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
      content: (data.outbound as string) || '去程｜CI100  桃園 TPE 08:30 → 成田 NRT 12:30',
      style: { fontFamily: p.fontFamily, fontSize: 11, fontWeight: '400', fontStyle: 'normal', color: p.primary, textAlign: 'left', lineHeight: 1.4, letterSpacing: 0.3 },
    } as TextElement)

    // 回程
    elements.push({
      id: `comp-fl-return-${ts}`, type: 'text', name: '回程航班',
      x: x + 16, y: y + 72, width: width - 32, height: 18,
      zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
      content: (data.returnFlight as string) || '回程｜CI101  成田 NRT 14:00 → 桃園 TPE 17:00',
      style: { fontFamily: p.fontFamily, fontSize: 11, fontWeight: '400', fontStyle: 'normal', color: p.primary, textAlign: 'left', lineHeight: 1.4, letterSpacing: 0.3 },
    } as TextElement)

    return elements
  },
}
