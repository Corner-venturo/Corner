import type { DesignComponent, ComponentGenerateOptions } from '../types'
import { DEFAULT_PALETTE } from '../types'
import type { CanvasElement, TextElement, ShapeElement } from '../../types'

export const attractionCard: DesignComponent = {
  id: 'attraction-card',
  name: '景點卡片',
  category: 'info',
  icon: 'MapPin',
  description: '照片區 + 景點名稱 + 介紹',
  defaultWidth: 495,
  defaultHeight: 200,
  generate: (options: ComponentGenerateOptions): CanvasElement[] => {
    const { x, y, width } = options
    const ts = Date.now()
    const data = options.data || {}
    const p = DEFAULT_PALETTE
    const elements: CanvasElement[] = []

    // 照片佔位
    elements.push({
      id: `comp-at-img-${ts}`, type: 'shape', name: '景點照片', variant: 'rectangle',
      x, y, width, height: 120,
      zIndex: 0, rotation: 0, opacity: 1, locked: false, visible: true,
      fill: p.lightBg, stroke: 'transparent', strokeWidth: 0, cornerRadius: 8,
    } as ShapeElement)

    // 景點名稱
    elements.push({
      id: `comp-at-name-${ts}`, type: 'text', name: '景點名稱',
      x, y: y + 130, width, height: 22,
      zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
      content: (data.attractionName as string) || '淺草寺',
      style: { fontFamily: p.fontFamily, fontSize: 15, fontWeight: '700', fontStyle: 'normal', color: p.primary, textAlign: 'left', lineHeight: 1.3, letterSpacing: 0.5 },
    } as TextElement)

    // 介紹
    elements.push({
      id: `comp-at-desc-${ts}`, type: 'text', name: '景點介紹',
      x, y: y + 156, width, height: 36,
      zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
      content: (data.attractionDesc as string) || '東京最古老的寺院，以雷門大燈籠聞名。仲見世通商店街長約250公尺，販售各式傳統小吃與紀念品。',
      style: { fontFamily: p.fontFamily, fontSize: 10, fontWeight: '400', fontStyle: 'normal', color: p.secondary, textAlign: 'left', lineHeight: 1.6, letterSpacing: 0.3 },
    } as TextElement)

    return elements
  },
}
