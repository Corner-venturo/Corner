import type { DesignComponent, ComponentGenerateOptions } from '../types'
import { getStylePalette } from '../types'
import type { CanvasElement, TextElement, ShapeElement } from '../../types'

export const qrcodeComponent: DesignComponent = {
  id: 'qrcode-block',
  name: 'QR Code',
  category: 'utility',
  icon: 'QrCode',
  description: 'QR Code 佔位區塊',
  defaultWidth: 160,
  defaultHeight: 180,
  generate: (options: ComponentGenerateOptions): CanvasElement[] => {
    const { x, y } = options
    const ts = Date.now()
    const p = getStylePalette(options.style)

    return [
      // QR 佔位框
      {
        id: `comp-qr-box-${ts}`, type: 'shape', name: 'QR Code', variant: 'rectangle',
        x: x + 20, y, width: 120, height: 120,
        zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
        fill: p.lightBg, stroke: p.accent, strokeWidth: 1, cornerRadius: 4,
      } as ShapeElement,
      // 提示文字
      {
        id: `comp-qr-hint-${ts}`, type: 'text', name: 'QR 提示',
        x: x + 20, y: y + 40, width: 120, height: 40,
        zIndex: 2, rotation: 0, opacity: 1, locked: false, visible: true,
        content: 'QR Code\n（使用元素庫生成）',
        style: { fontFamily: p.fontFamily, fontSize: 9, fontWeight: '400', fontStyle: 'normal', color: p.secondary, textAlign: 'center', lineHeight: 1.6, letterSpacing: 0 },
      } as TextElement,
      // 說明
      {
        id: `comp-qr-label-${ts}`, type: 'text', name: 'QR 說明',
        x, y: y + 128, width: 160, height: 16,
        zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
        content: '掃描查看更多資訊',
        style: { fontFamily: p.fontFamily, fontSize: 8, fontWeight: '400', fontStyle: 'normal', color: p.secondary, textAlign: 'center', lineHeight: 1, letterSpacing: 0.5 },
      } as TextElement,
    ]
  },
}
