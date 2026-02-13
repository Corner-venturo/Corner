/**
 * 向量 PDF 生成引擎
 *
 * 將設計工具的 CanvasPage 轉換為向量 PDF
 * - 文字保持向量，可選取、放大不模糊
 * - 形狀使用向量繪製
 * - 圖片嵌入高解析度版本
 */

import jsPDF from 'jspdf'
import type {
  CanvasPage,
  CanvasElement,
  ShapeElement,
  TextElement,
  ImageElement,
  IconElement,
  LineElement,
  StickerElement,
  GroupElement,
} from '@/features/designer/components/types'
import { MATERIAL_ICON_PATHS, ICON_VIEWBOX_SIZE } from '@/features/designer/components/core/icon-paths'
import { STICKER_PATHS, getStickerViewBox } from '@/features/designer/components/core/sticker-paths'
import { loadFontsForPDF, getFontName, type FontStyle } from './font-loader'
import { renderSvgPath, renderGradientShape } from './svg-renderer'
import { logger } from '@/lib/utils/logger'

// ============================================
// 常數定義
// ============================================

// A5 尺寸（mm）
const A5_WIDTH_MM = 148
const A5_HEIGHT_MM = 210

// Canvas 尺寸（px，300 DPI 含出血）
const CANVAS_WIDTH_PX = 1819
const CANVAS_HEIGHT_PX = 2551

// 轉換比例：px → mm
const PX_TO_MM = A5_WIDTH_MM / CANVAS_WIDTH_PX

// ============================================
// 座標轉換工具
// ============================================

/**
 * 像素轉毫米
 */
function pxToMm(px: number): number {
  return px * PX_TO_MM
}

/**
 * 解析顏色為 RGB 值
 */
function parseColor(color: string): { r: number; g: number; b: number } {
  // 處理 hex 顏色
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return { r, g, b }
  }

  // 處理 rgb/rgba 顏色
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    }
  }

  // 預設黑色
  return { r: 0, g: 0, b: 0 }
}

/**
 * 解析透明度
 */
function parseOpacity(color: string): number {
  const rgbaMatch = color.match(/rgba\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/)
  if (rgbaMatch) {
    return parseFloat(rgbaMatch[1])
  }
  return 1
}

// ============================================
// 元素渲染器
// ============================================

/**
 * 渲染文字元素
 */
function renderText(doc: jsPDF, el: TextElement): void {
  const x = pxToMm(el.x)
  const y = pxToMm(el.y)
  const fontSize = pxToMm(el.style.fontSize) * 2.83 // pt to mm adjustment

  // 設定字體
  const fontName = getFontName(el.style.fontFamily)
  const fontStyle: FontStyle = el.style.fontWeight === 'bold' || parseInt(el.style.fontWeight) >= 700 ? 'bold' : 'normal'

  try {
    doc.setFont(fontName, fontStyle)
  } catch {
    // fallback 到預設字體
    doc.setFont('ChironHeiHK', fontStyle)
  }

  doc.setFontSize(fontSize)

  // 設定顏色
  const { r, g, b } = parseColor(el.style.color)
  doc.setTextColor(r, g, b)

  // 設定透明度
  if (el.opacity !== undefined && el.opacity < 1) {
    doc.setGState(doc.GState({ opacity: el.opacity }))
  }

  // 處理對齊
  let align: 'left' | 'center' | 'right' = 'left'
  if (el.style.textAlign === 'center') align = 'center'
  if (el.style.textAlign === 'right') align = 'right'

  // 處理多行文字
  const lines = el.content.split('\n')
  const lineHeight = fontSize * (el.style.lineHeight || 1.2)

  lines.forEach((line, index) => {
    const lineY = y + (index * lineHeight) + fontSize // 加上 fontSize 是因為 jsPDF 的 y 是基線位置
    doc.text(line, x, lineY, { align })
  })

  // 重置透明度
  if (el.opacity !== undefined && el.opacity < 1) {
    doc.setGState(doc.GState({ opacity: 1 }))
  }
}

/**
 * 渲染形狀元素
 */
async function renderShape(doc: jsPDF, el: ShapeElement): Promise<void> {
  const x = pxToMm(el.x)
  const y = pxToMm(el.y)
  const width = pxToMm(el.width)
  const height = pxToMm(el.height)

  // 設定透明度
  if (el.opacity !== undefined && el.opacity < 1) {
    doc.setGState(doc.GState({ opacity: el.opacity }))
  }

  // 設定填充顏色
  if (el.fill && !el.gradient) {
    const { r, g, b } = parseColor(el.fill)
    doc.setFillColor(r, g, b)
  }

  // 設定邊框
  if (el.stroke && el.strokeWidth) {
    const { r, g, b } = parseColor(el.stroke)
    doc.setDrawColor(r, g, b)
    doc.setLineWidth(pxToMm(el.strokeWidth))
  }

  // 決定繪製模式
  const hasFill = !!el.fill && !el.gradient
  const hasStroke = !!el.stroke && !!el.strokeWidth
  let style: 'F' | 'S' | 'FD' = 'F'
  if (hasFill && hasStroke) style = 'FD'
  else if (hasStroke && !hasFill) style = 'S'

  switch (el.variant) {
    case 'rectangle':
      if (el.cornerRadius) {
        doc.roundedRect(x, y, width, height, pxToMm(el.cornerRadius), pxToMm(el.cornerRadius), style)
      } else {
        doc.rect(x, y, width, height, style)
      }
      break

    case 'circle':
      const radius = Math.min(width, height) / 2
      doc.circle(x + radius, y + radius, radius, style)
      break

    case 'ellipse':
      doc.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, style)
      break
  }

  // 處理漸層 — 使用 svg2pdf.js 向量渲染
  if (el.gradient) {
    const shapeMap: Record<string, 'rect' | 'circle' | 'ellipse'> = {
      rectangle: 'rect',
      circle: 'circle',
      ellipse: 'ellipse',
    }
    const angle = el.gradient.direction === 'horizontal' ? 0 : 90
    await renderGradientShape(doc, {
      shape: shapeMap[el.variant] ?? 'rect',
      x, y, width, height,
      gradient: {
        type: el.gradient.type,
        angle,
        stops: el.gradient.colorStops,
      },
      cornerRadius: el.cornerRadius ? pxToMm(el.cornerRadius) : undefined,
      opacity: el.opacity,
    })
  }

  // 重置透明度
  if (el.opacity !== undefined && el.opacity < 1) {
    doc.setGState(doc.GState({ opacity: 1 }))
  }
}

/**
 * 渲染圖片元素
 */
async function renderImage(doc: jsPDF, el: ImageElement): Promise<void> {
  const x = pxToMm(el.x)
  const y = pxToMm(el.y)
  const width = pxToMm(el.width)
  const height = pxToMm(el.height)

  try {
    // 設定透明度
    if (el.opacity !== undefined && el.opacity < 1) {
      doc.setGState(doc.GState({ opacity: el.opacity }))
    }

    // 直接嵌入圖片
    // jsPDF 會自動處理 base64 和 URL
    if (el.src.startsWith('data:')) {
      // Base64 圖片
      const format = el.src.includes('image/png') ? 'PNG' : 'JPEG'
      doc.addImage(el.src, format, x, y, width, height)
    } else {
      // URL 圖片 - 需要先載入
      const response = await fetch(el.src)
      const blob = await response.blob()
      const base64 = await blobToBase64(blob)
      const format = blob.type.includes('png') ? 'PNG' : 'JPEG'
      doc.addImage(base64, format, x, y, width, height)
    }

    // 重置透明度
    if (el.opacity !== undefined && el.opacity < 1) {
      doc.setGState(doc.GState({ opacity: 1 }))
    }
  } catch (error) {
    logger.error('[PDF] Failed to render image:', error)
    // 繪製佔位符
    doc.setFillColor(240, 240, 240)
    doc.rect(x, y, width, height, 'F')
  }
}

/**
 * 將 Blob 轉換為 Base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * 渲染圖標元素
 */
async function renderIcon(doc: jsPDF, el: IconElement): Promise<void> {
  const pathData = MATERIAL_ICON_PATHS[el.icon]
  if (!pathData) {
    logger.warn(`[PDF] Icon "${el.icon}" not found`)
    return
  }

  const x = pxToMm(el.x)
  const y = pxToMm(el.y)
  const size = pxToMm(el.size)
  const scale = size / ICON_VIEWBOX_SIZE

  // 設定顏色
  const { r, g, b } = parseColor(el.color)
  doc.setFillColor(r, g, b)

  // 設定透明度
  if (el.opacity !== undefined && el.opacity < 1) {
    doc.setGState(doc.GState({ opacity: el.opacity }))
  }

  // 使用 svg2pdf.js 渲染 SVG Path
  try {
    await renderSvgPath(doc, {
      pathData: pathData,
      x, y,
      width: size,
      height: size,
      fill: el.color,
      opacity: el.opacity,
      viewBox: `0 0 ${ICON_VIEWBOX_SIZE} ${ICON_VIEWBOX_SIZE}`,
    })
  } catch (error) {
    logger.error('[PDF] Failed to render icon:', error)
    doc.rect(x, y, size, size, 'F')
  }

  // 重置透明度
  if (el.opacity !== undefined && el.opacity < 1) {
    doc.setGState(doc.GState({ opacity: 1 }))
  }
}

/**
 * 渲染線條元素
 */
function renderLine(doc: jsPDF, el: LineElement): void {
  const x1 = pxToMm(el.x + el.x1)
  const y1 = pxToMm(el.y + el.y1)
  const x2 = pxToMm(el.x + el.x2)
  const y2 = pxToMm(el.y + el.y2)

  // 設定線條顏色
  const { r, g, b } = parseColor(el.stroke)
  doc.setDrawColor(r, g, b)
  doc.setLineWidth(pxToMm(el.strokeWidth))

  // 設定透明度
  if (el.opacity !== undefined && el.opacity < 1) {
    doc.setGState(doc.GState({ opacity: el.opacity }))
  }

  // 設定虛線
  if (el.lineStyle === 'dashed') {
    doc.setLineDashPattern([pxToMm(8), pxToMm(4)], 0)
  } else if (el.lineStyle === 'dotted') {
    doc.setLineDashPattern([pxToMm(2), pxToMm(2)], 0)
  }

  doc.line(x1, y1, x2, y2)

  // 重置虛線
  doc.setLineDashPattern([], 0)

  // 重置透明度
  if (el.opacity !== undefined && el.opacity < 1) {
    doc.setGState(doc.GState({ opacity: 1 }))
  }
}

/**
 * 渲染貼紙元素
 */
async function renderSticker(doc: jsPDF, el: StickerElement): Promise<void> {
  // 貼紙使用 SVG Path，處理方式類似圖標
  const x = pxToMm(el.x)
  const y = pxToMm(el.y)
  const width = pxToMm(el.width)
  const height = pxToMm(el.height)

  // 設定顏色
  if (el.primaryColor) {
    const { r, g, b } = parseColor(el.primaryColor)
    doc.setFillColor(r, g, b)
  }

  // 設定透明度
  if (el.opacity !== undefined && el.opacity < 1) {
    doc.setGState(doc.GState({ opacity: el.opacity }))
  }

  // 使用 svg2pdf.js 渲染 SVG Path
  const stickerDef = STICKER_PATHS[el.stickerId]
  if (stickerDef) {
    try {
      const vb = stickerDef.viewBox
      await renderSvgPath(doc, {
        pathData: stickerDef.path,
        x, y, width, height,
        fill: el.primaryColor ?? stickerDef.defaultColor ?? '#000000',
        opacity: el.opacity,
        viewBox: `0 0 ${vb.width} ${vb.height}`,
      })
    } catch (error) {
      logger.error('[PDF] Failed to render sticker:', error)
      doc.rect(x, y, width, height, 'F')
    }
  } else {
    doc.rect(x, y, width, height, 'F')
  }

  // 重置透明度
  if (el.opacity !== undefined && el.opacity < 1) {
    doc.setGState(doc.GState({ opacity: 1 }))
  }
}

/**
 * 渲染群組元素
 */
async function renderGroup(doc: jsPDF, el: GroupElement): Promise<void> {
  // 遞迴渲染子元素
  for (const child of el.children) {
    await renderElement(doc, child)
  }
}

/**
 * 渲染單個元素
 */
async function renderElement(doc: jsPDF, el: CanvasElement): Promise<void> {
  // 跳過不可見元素
  if (el.visible === false) return

  switch (el.type) {
    case 'text':
      renderText(doc, el)
      break
    case 'shape':
      await renderShape(doc, el)
      break
    case 'image':
      await renderImage(doc, el)
      break
    case 'icon':
      await renderIcon(doc, el)
      break
    case 'line':
      renderLine(doc, el)
      break
    case 'sticker':
      await renderSticker(doc, el)
      break
    case 'group':
      await renderGroup(doc, el)
      break
  }
}

/**
 * 渲染單頁
 */
async function renderPage(doc: jsPDF, page: CanvasPage): Promise<void> {
  // 繪製背景
  if (page.backgroundColor && page.backgroundColor !== 'transparent') {
    const { r, g, b } = parseColor(page.backgroundColor)
    doc.setFillColor(r, g, b)
    doc.rect(0, 0, A5_WIDTH_MM, A5_HEIGHT_MM, 'F')
  }

  // 按 zIndex 排序元素
  const sortedElements = [...page.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))

  // 渲染所有元素
  for (const element of sortedElements) {
    await renderElement(doc, element)
  }
}

// ============================================
// 主要匯出函數
// ============================================

export interface GeneratePDFOptions {
  /** 文件名稱 */
  filename?: string
  /** 是否自動下載 */
  autoDownload?: boolean
  /** 進度回調 */
  onProgress?: (current: number, total: number) => void
}

/**
 * 生成向量 PDF
 *
 * @param pages - 要轉換的頁面列表
 * @param options - 選項
 * @returns PDF Blob
 */
export async function generateBrochurePDF(
  pages: CanvasPage[],
  options: GeneratePDFOptions = {}
): Promise<Blob> {
  const { filename = 'brochure.pdf', autoDownload = false, onProgress } = options

  logger.log(`[PDF] Starting vector PDF generation for ${pages.length} pages`)

  // 初始化 PDF（A5 直式）
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  })

  // 收集所有使用的字體
  const usedFonts = new Set<string>()
  pages.forEach(page => {
    page.elements.forEach(el => {
      if (el.type === 'text') {
        usedFonts.add(el.style.fontFamily)
      }
    })
  })

  // 載入字體
  await loadFontsForPDF(doc, Array.from(usedFonts))

  // 渲染每一頁
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]

    // 第一頁之後需要新增頁面
    if (i > 0) {
      doc.addPage('a5', 'portrait')
    }

    await renderPage(doc, page)

    // 回報進度
    onProgress?.(i + 1, pages.length)

    logger.log(`[PDF] Rendered page ${i + 1}/${pages.length}`)
  }

  // 生成 Blob
  const blob = doc.output('blob')

  logger.log(`[PDF] Generated PDF: ${(blob.size / 1024 / 1024).toFixed(2)} MB`)

  // 自動下載
  if (autoDownload) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return blob
}

/**
 * 生成並開啟預覽視窗
 */
export async function generateAndPreviewPDF(
  pages: CanvasPage[],
  options: GeneratePDFOptions = {}
): Promise<void> {
  const blob = await generateBrochurePDF(pages, options)
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}
