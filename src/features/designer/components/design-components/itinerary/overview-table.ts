import type { DesignComponent, ComponentGenerateOptions } from '../types'
import type { CanvasElement, TextElement, ShapeElement } from '../../types'

const COLORS = { gold: '#c9aa7c', black: '#181511', gray: '#666666', lightGray: '#f5f3f0' }

export const overviewTable: DesignComponent = {
  id: 'overview-table',
  name: '行程總覽表',
  category: 'itinerary',
  icon: 'Table',
  description: '表格式的天數列表總覽',
  defaultWidth: 495,
  defaultHeight: 300,
  generate: (options: ComponentGenerateOptions): CanvasElement[] => {
    const { x, y, width } = options
    const ts = Date.now()
    const elements: CanvasElement[] = []
    const rowHeight = 32
    const headerHeight = 28

    // 標題
    elements.push({
      id: `comp-ot-title-${ts}`, type: 'text', name: '總覽標題',
      x, y, width: 200, height: 24,
      zIndex: 2, rotation: 0, opacity: 1, locked: false, visible: true,
      content: '行程總覽 ITINERARY',
      style: { fontFamily: 'Noto Sans TC', fontSize: 16, fontWeight: '700', fontStyle: 'normal', color: COLORS.black, textAlign: 'left', lineHeight: 1.2, letterSpacing: 1.5 },
    } as TextElement)

    // 表頭背景
    elements.push({
      id: `comp-ot-header-bg-${ts}`, type: 'shape', name: '表頭背景', variant: 'rectangle',
      x, y: y + 30, width, height: headerHeight,
      zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
      fill: COLORS.gold, stroke: 'transparent', strokeWidth: 0,
    } as ShapeElement)

    // 表頭文字
    const cols = [
      { label: '天數', w: 50 },
      { label: '日期', w: 80 },
      { label: '行程', w: width - 200 },
      { label: '住宿', w: 70 },
    ]
    let colX = x
    cols.forEach((col, i) => {
      elements.push({
        id: `comp-ot-hdr-${i}-${ts}`, type: 'text', name: `表頭-${col.label}`,
        x: colX + 4, y: y + 34, width: col.w - 8, height: 20,
        zIndex: 3, rotation: 0, opacity: 1, locked: false, visible: true,
        content: col.label,
        style: { fontFamily: 'Noto Sans TC', fontSize: 10, fontWeight: '600', fontStyle: 'normal', color: '#ffffff', textAlign: 'left', lineHeight: 1, letterSpacing: 0.5 },
      } as TextElement)
      colX += col.w
    })

    // 5 行範例資料
    const rows = [
      { day: 'Day 1', date: '01/15', title: '台北→東京成田機場', hotel: '新宿華盛頓' },
      { day: 'Day 2', date: '01/16', title: '淺草寺・晴空塔・秋葉原', hotel: '新宿華盛頓' },
      { day: 'Day 3', date: '01/17', title: '富士山河口湖一日遊', hotel: '河口湖溫泉' },
      { day: 'Day 4', date: '01/18', title: '箱根海盜船・大涌谷', hotel: '新宿華盛頓' },
      { day: 'Day 5', date: '01/19', title: '自由活動→成田機場→台北', hotel: '—' },
    ]

    rows.forEach((row, ri) => {
      const rowY = y + 30 + headerHeight + ri * rowHeight

      // 交替背景
      if (ri % 2 === 0) {
        elements.push({
          id: `comp-ot-row-bg-${ri}-${ts}`, type: 'shape', name: `第${ri + 1}行背景`, variant: 'rectangle',
          x, y: rowY, width, height: rowHeight,
          zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
          fill: COLORS.lightGray, stroke: 'transparent', strokeWidth: 0,
        } as ShapeElement)
      }

      const values = [row.day, row.date, row.title, row.hotel]
      let cx = x
      cols.forEach((col, ci) => {
        elements.push({
          id: `comp-ot-cell-${ri}-${ci}-${ts}`, type: 'text', name: `${row.day}-${col.label}`,
          x: cx + 4, y: rowY + 8, width: col.w - 8, height: 16,
          zIndex: 2, rotation: 0, opacity: 1, locked: false, visible: true,
          content: values[ci],
          style: { fontFamily: 'Noto Sans TC', fontSize: 10, fontWeight: '400', fontStyle: 'normal', color: COLORS.black, textAlign: 'left', lineHeight: 1.2, letterSpacing: 0.3 },
        } as TextElement)
        cx += col.w
      })
    })

    return elements
  },
}
