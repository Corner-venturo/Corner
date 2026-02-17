import type { DesignComponent, ComponentGenerateOptions } from '../types'
import { getStylePalette } from '../types'
import type { CanvasElement, ShapeElement, TextElement } from '../../types'

export const dividerComponent: DesignComponent = {
  id: 'divider',
  name: '分隔線',
  category: 'layout',
  icon: 'Minus',
  description: '多種風格裝飾分隔線',
  defaultWidth: 495,
  defaultHeight: 20,
  generate: (options: ComponentGenerateOptions): CanvasElement[] => {
    const { x, y, width } = options
    const ts = Date.now()
    const p = getStylePalette(options.style)

    return [
      {
        id: `comp-div-left-${ts}`, type: 'shape', name: '左線', variant: 'rectangle',
        x, y: y + 9, width: (width - 30) / 2, height: 1,
        zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
        fill: p.accent, stroke: 'transparent', strokeWidth: 0,
      } as ShapeElement,
      {
        id: `comp-div-dot-${ts}`, type: 'text', name: '裝飾',
        x: x + (width - 30) / 2, y: y + 2, width: 30, height: 16,
        zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
        content: '◆',
        style: { fontFamily: p.fontFamily, fontSize: 8, fontWeight: '400', fontStyle: 'normal', color: p.accent, textAlign: 'center', lineHeight: 1, letterSpacing: 0 },
      } as TextElement,
      {
        id: `comp-div-right-${ts}`, type: 'shape', name: '右線', variant: 'rectangle',
        x: x + (width + 30) / 2, y: y + 9, width: (width - 30) / 2, height: 1,
        zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
        fill: p.accent, stroke: 'transparent', strokeWidth: 0,
      } as ShapeElement,
    ]
  },
}
