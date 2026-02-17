import type { DesignComponent, ComponentGenerateOptions } from '../types'
import { getStylePalette } from '../types'
import type { CanvasElement, TextElement, ShapeElement } from '../../types'

export const tocComponent: DesignComponent = {
  id: 'toc',
  name: '目錄',
  category: 'layout',
  icon: 'List',
  description: '頁面目錄列表',
  defaultWidth: 495,
  defaultHeight: 300,
  generate: (options: ComponentGenerateOptions): CanvasElement[] => {
    const { x, y, width } = options
    const ts = Date.now()
    const p = getStylePalette(options.style)
    const elements: CanvasElement[] = []

    // 標題
    elements.push({
      id: `comp-toc-title-${ts}`, type: 'text', name: '目錄標題',
      x, y, width, height: 30,
      zIndex: 2, rotation: 0, opacity: 1, locked: false, visible: true,
      content: 'CONTENTS',
      style: { fontFamily: p.fontFamily, fontSize: 20, fontWeight: '800', fontStyle: 'normal', color: p.primary, textAlign: 'center', lineHeight: 1, letterSpacing: 6 },
    } as TextElement)

    // 裝飾線
    elements.push({
      id: `comp-toc-line-${ts}`, type: 'shape', name: '裝飾線', variant: 'rectangle',
      x: x + (width - 60) / 2, y: y + 36, width: 60, height: 1,
      zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
      fill: p.accent, stroke: 'transparent', strokeWidth: 0,
    } as ShapeElement)

    // 目錄項目
    const items = [
      { name: '行程總覽', page: '02' },
      { name: 'Day 1 — 抵達東京', page: '03' },
      { name: 'Day 2 — 淺草・晴空塔', page: '04' },
      { name: 'Day 3 — 富士山', page: '05' },
      { name: 'Day 4 — 箱根', page: '06' },
      { name: 'Day 5 — 返程', page: '07' },
      { name: '住宿資訊', page: '08' },
      { name: '備忘錄', page: '09' },
    ]

    items.forEach((item, i) => {
      const iy = y + 56 + i * 28

      elements.push({
        id: `comp-toc-item-${i}-${ts}`, type: 'text', name: item.name,
        x: x + 20, y: iy, width: width - 80, height: 18,
        zIndex: 2, rotation: 0, opacity: 1, locked: false, visible: true,
        content: item.name,
        style: { fontFamily: p.fontFamily, fontSize: 12, fontWeight: '400', fontStyle: 'normal', color: p.primary, textAlign: 'left', lineHeight: 1.2, letterSpacing: 0.5 },
      } as TextElement)

      // 頁碼
      elements.push({
        id: `comp-toc-page-${i}-${ts}`, type: 'text', name: `頁碼-${item.name}`,
        x: x + width - 50, y: iy, width: 30, height: 18,
        zIndex: 2, rotation: 0, opacity: 1, locked: false, visible: true,
        content: item.page,
        style: { fontFamily: p.fontFamily, fontSize: 12, fontWeight: '600', fontStyle: 'normal', color: p.accent, textAlign: 'right', lineHeight: 1.2, letterSpacing: 0 },
      } as TextElement)

      // 點線
      elements.push({
        id: `comp-toc-dots-${i}-${ts}`, type: 'shape', name: `點線-${item.name}`, variant: 'rectangle',
        x: x + 20, y: iy + 18, width: width - 40, height: 1,
        zIndex: 1, rotation: 0, opacity: 0.3, locked: false, visible: true,
        fill: p.secondary, stroke: 'transparent', strokeWidth: 0,
        strokeDashArray: [2, 2],
      } as ShapeElement)
    })

    return elements
  },
}
