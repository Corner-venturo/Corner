import type { DesignComponent, ComponentGenerateOptions } from '../types'
import type { CanvasElement, TextElement, ShapeElement } from '../../types'

const COLORS = { gold: '#c9aa7c', black: '#181511' }

export const headerComponent: DesignComponent = {
  id: 'page-header',
  name: '頁眉',
  category: 'layout',
  icon: 'PanelTop',
  description: '公司 Logo + 團名',
  defaultWidth: 495,
  defaultHeight: 50,
  generate: (options: ComponentGenerateOptions): CanvasElement[] => {
    const { x, y, width } = options
    const ts = Date.now()
    const data = options.data || {}

    return [
      {
        id: `comp-hdr-left-${ts}`, type: 'text', name: '頁眉左',
        x, y, width: width / 2, height: 36,
        zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
        content: (data.headerText as string) || 'TRAVEL GUIDE\nTOKYO',
        style: { fontFamily: 'Noto Sans TC', fontSize: 9, fontWeight: '600', fontStyle: 'normal', color: COLORS.black, textAlign: 'left', lineHeight: 1.4, letterSpacing: 1.5 },
      } as TextElement,
      {
        id: `comp-hdr-right-${ts}`, type: 'text', name: '頁眉右',
        x: x + width / 2, y, width: width / 2, height: 36,
        zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
        content: (data.tourName as string) || '東京五日遊',
        style: { fontFamily: 'Noto Sans TC', fontSize: 9, fontWeight: '500', fontStyle: 'normal', color: '#999999', textAlign: 'right', lineHeight: 1.4, letterSpacing: 0.5 },
      } as TextElement,
      {
        id: `comp-hdr-line-${ts}`, type: 'shape', name: '頁眉底線', variant: 'rectangle',
        x, y: y + 40, width: 80, height: 1,
        zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
        fill: COLORS.gold, stroke: 'transparent', strokeWidth: 0,
      } as ShapeElement,
    ]
  },
}
