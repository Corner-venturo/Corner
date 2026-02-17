import type { DesignComponent, ComponentGenerateOptions } from '../types'
import { getStylePalette } from '../types'
import type { CanvasElement, TextElement, ShapeElement } from '../../types'

export const vehicleInfo: DesignComponent = {
  id: 'vehicle-info',
  name: '交通資訊',
  category: 'utility',
  icon: 'Bus',
  description: '交通工具與司機資訊',
  defaultWidth: 495,
  defaultHeight: 100,
  generate: (options: ComponentGenerateOptions): CanvasElement[] => {
    const { x, y, width } = options
    const ts = Date.now()
    const data = options.data || {}
    const p = getStylePalette(options.style)

    return [
      // 背景
      {
        id: `comp-vh-bg-${ts}`, type: 'shape', name: '交通背景', variant: 'rectangle',
        x, y, width, height: 90,
        zIndex: 0, rotation: 0, opacity: 1, locked: false, visible: true,
        fill: p.background, stroke: p.accent, strokeWidth: 1, cornerRadius: 8,
      } as ShapeElement,
      // 標題
      {
        id: `comp-vh-title-${ts}`, type: 'text', name: '交通標題',
        x: x + 16, y: y + 12, width: 200, height: 18,
        zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
        content: '🚌 交通資訊',
        style: { fontFamily: p.fontFamily, fontSize: 13, fontWeight: '600', fontStyle: 'normal', color: p.accent, textAlign: 'left', lineHeight: 1, letterSpacing: 0.5 },
      } as TextElement,
      // 車輛
      {
        id: `comp-vh-vehicle-${ts}`, type: 'text', name: '車輛資訊',
        x: x + 16, y: y + 38, width: width / 2 - 20, height: 18,
        zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
        content: (data.vehicleType as string) || '車型：45 座大巴',
        style: { fontFamily: p.fontFamily, fontSize: 10, fontWeight: '400', fontStyle: 'normal', color: p.primary, textAlign: 'left', lineHeight: 1.4, letterSpacing: 0.3 },
      } as TextElement,
      // 司機
      {
        id: `comp-vh-driver-${ts}`, type: 'text', name: '司機資訊',
        x: x + width / 2, y: y + 38, width: width / 2 - 16, height: 18,
        zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
        content: (data.driverInfo as string) || '司機：田中先生',
        style: { fontFamily: p.fontFamily, fontSize: 10, fontWeight: '400', fontStyle: 'normal', color: p.primary, textAlign: 'left', lineHeight: 1.4, letterSpacing: 0.3 },
      } as TextElement,
      // 車牌
      {
        id: `comp-vh-plate-${ts}`, type: 'text', name: '車牌號碼',
        x: x + 16, y: y + 60, width: width - 32, height: 18,
        zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
        content: (data.plateNumber as string) || '車牌：品川 300 あ 12-34',
        style: { fontFamily: p.fontFamily, fontSize: 10, fontWeight: '400', fontStyle: 'normal', color: p.secondary, textAlign: 'left', lineHeight: 1.4, letterSpacing: 0.3 },
      } as TextElement,
    ]
  },
}
