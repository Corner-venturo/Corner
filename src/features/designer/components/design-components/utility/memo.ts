import type { DesignComponent, ComponentGenerateOptions } from '../types'
import { DEFAULT_PALETTE } from '../types'
import type { CanvasElement, TextElement, ShapeElement } from '../../types'

export const memoComponent: DesignComponent = {
  id: 'memo',
  name: '備忘錄',
  category: 'utility',
  icon: 'StickyNote',
  description: '注意事項列表',
  defaultWidth: 495,
  defaultHeight: 220,
  generate: (options: ComponentGenerateOptions): CanvasElement[] => {
    const { x, y, width } = options
    const ts = Date.now()
    const p = DEFAULT_PALETTE
    const elements: CanvasElement[] = []

    // 標題
    elements.push({
      id: `comp-memo-title-${ts}`, type: 'text', name: '備忘錄標題',
      x, y, width: 200, height: 24,
      zIndex: 2, rotation: 0, opacity: 1, locked: false, visible: true,
      content: '📋 旅遊備忘錄',
      style: { fontFamily: p.fontFamily, fontSize: 14, fontWeight: '700', fontStyle: 'normal', color: p.primary, textAlign: 'left', lineHeight: 1.2, letterSpacing: 0.5 },
    } as TextElement)

    const items = [
      { icon: '🛂', title: '護照效期', content: '請確認護照有效期限至少六個月以上' },
      { icon: '💴', title: '貨幣兌換', content: '建議於出發前兌換日幣，當地可使用信用卡' },
      { icon: '🌡️', title: '天氣資訊', content: '請查詢當地天氣預報，攜帶合適衣物' },
      { icon: '📱', title: 'Wi-Fi', content: '可於機場租借 Wi-Fi 分享器或購買 SIM 卡' },
    ]

    items.forEach((item, i) => {
      const iy = y + 40 + i * 44

      // 背景
      elements.push({
        id: `comp-memo-bg-${i}-${ts}`, type: 'shape', name: `${item.title}背景`, variant: 'rectangle',
        x, y: iy, width, height: 40,
        zIndex: 0, rotation: 0, opacity: 1, locked: false, visible: true,
        fill: i % 2 === 0 ? p.lightBg : 'transparent', stroke: 'transparent', strokeWidth: 0, cornerRadius: 4,
      } as ShapeElement)

      // 圖標 + 標題
      elements.push({
        id: `comp-memo-head-${i}-${ts}`, type: 'text', name: `${item.title}`,
        x: x + 8, y: iy + 4, width: 180, height: 16,
        zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
        content: `${item.icon} ${item.title}`,
        style: { fontFamily: p.fontFamily, fontSize: 11, fontWeight: '600', fontStyle: 'normal', color: p.primary, textAlign: 'left', lineHeight: 1, letterSpacing: 0.3 },
      } as TextElement)

      // 內容
      elements.push({
        id: `comp-memo-text-${i}-${ts}`, type: 'text', name: `${item.title}內容`,
        x: x + 28, y: iy + 22, width: width - 36, height: 14,
        zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
        content: item.content,
        style: { fontFamily: p.fontFamily, fontSize: 10, fontWeight: '400', fontStyle: 'normal', color: p.secondary, textAlign: 'left', lineHeight: 1.3, letterSpacing: 0.3 },
      } as TextElement)
    })

    return elements
  },
}
