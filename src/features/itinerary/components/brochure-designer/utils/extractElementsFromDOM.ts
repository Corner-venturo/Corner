/**
 * 從 DOM 提取元素座標
 * 自動讀取 React 模板渲染後的實際位置，轉換為 Canvas 元素
 */

import type { CanvasElement, TextElement, ImageElement, ShapeElement, GradientFill, GradientColorStop } from '../canvas-editor/types'
import { logger } from '@/lib/utils/logger'

// 生成唯一 ID
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// 解析 CSS 漸層
function parseGradient(backgroundImage: string): GradientFill | null {
  if (!backgroundImage || backgroundImage === 'none') return null

  // 檢測 linear-gradient
  const linearMatch = backgroundImage.match(/linear-gradient\((.+)\)/)
  if (!linearMatch) return null

  const content = linearMatch[1]

  // 解析方向
  let angle = 180 // 預設 to bottom
  const directionMatch = content.match(/^(to\s+\w+(?:\s+\w+)?|[\d.]+deg)/)
  if (directionMatch) {
    const dir = directionMatch[1]
    if (dir.includes('to bottom')) angle = 180
    else if (dir.includes('to top')) angle = 0
    else if (dir.includes('to right')) angle = 90
    else if (dir.includes('to left')) angle = 270
    else if (dir.endsWith('deg')) angle = parseFloat(dir)
  }

  // 解析顏色停止點
  // 需要處理兩種 CSS 語法：
  // 1. 傳統語法: rgba(0, 0, 0, 0.6) - 逗號分隔
  // 2. 現代語法: rgb(0 0 0 / 0.6) - 空格分隔，斜線表示 alpha
  const colorStops: GradientColorStop[] = []

  // 使用更複雜的策略：先分割顏色停止點，再解析每個
  // 分割邏輯：以逗號分隔，但忽略括號內的逗號
  const colorStopStrings: string[] = []
  let depth = 0
  let current = ''

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    if (char === '(') {
      depth++
      current += char
    } else if (char === ')') {
      depth--
      current += char
    } else if (char === ',' && depth === 0) {
      const trimmed = current.trim()
      if (trimmed) colorStopStrings.push(trimmed)
      current = ''
    } else {
      current += char
    }
  }
  // 加入最後一段
  const trimmedLast = current.trim()
  if (trimmedLast) colorStopStrings.push(trimmedLast)

  // 過濾掉方向部分
  const directionKeywords = ['to', 'top', 'bottom', 'left', 'right']

  for (const stopStr of colorStopStrings) {
    // 跳過方向關鍵字（如 "to bottom"）
    const firstWord = stopStr.split(/\s+/)[0].toLowerCase()
    if (directionKeywords.includes(firstWord)) {
      continue
    }

    // 解析顏色和位置
    // 格式可能是: "rgba(0, 0, 0, 0.6) 50%" 或 "rgb(0 0 0 / 0.6) 50%" 或 "#fff 50%" 或 "white 50%"
    let color = ''
    let position = ''

    // 檢查是否有 rgb/rgba 函數
    const funcMatch = stopStr.match(/^(rgba?\s*\([^)]+\))(.*)/)
    if (funcMatch) {
      color = funcMatch[1].trim()
      const rest = funcMatch[2].trim()
      // 檢查位置百分比
      const posMatch = rest.match(/([\d.]+%?)/)
      if (posMatch) {
        position = posMatch[1]
      }
    } else {
      // 沒有 rgb 函數，可能是 hex 或顏色名稱
      const parts = stopStr.trim().split(/\s+/)
      if (parts.length >= 1) {
        color = parts[0]
        if (parts.length >= 2 && parts[1].match(/[\d.]+%?/)) {
          position = parts[1]
        }
      }
    }

    if (color) {
      // 將現代 CSS 顏色格式轉換成 Canvas 支援的格式
      const normalizedColor = normalizeColorForCanvas(color)
      colorStops.push({
        offset: position ? parseFloat(position) / 100 : -1,
        color: normalizedColor,
      })
    }
  }

  // 自動計算缺失的位置
  if (colorStops.length >= 2) {
    colorStops.forEach((stop, i) => {
      if (stop.offset === -1) {
        stop.offset = i / (colorStops.length - 1)
      }
    })

    logger.log('[parseGradient] Parsed gradient:', { angle, colorStops })

    return {
      type: 'linear',
      angle,
      colorStops,
    }
  }

  return null
}

/**
 * 將現代 CSS 顏色格式轉換成 Canvas 支援的格式
 * 處理 oklab, oklch, lab, lch, color() 等新格式
 */
function normalizeColorForCanvas(color: string): string {
  if (!color) return 'transparent'

  // 處理 oklab/oklch/lab/lch 格式
  // 例如: oklab(0 0 0 / 0) 表示透明
  // 例如: oklab(1 0 0) 表示白色
  const modernColorMatch = color.match(/^(oklab|oklch|lab|lch|color)\s*\(([^)]+)\)/)
  if (modernColorMatch) {
    const params = modernColorMatch[2].trim()

    // 檢查是否有 alpha 值（用 / 分隔）
    const alphaPart = params.split('/')
    let alpha = 1
    if (alphaPart.length > 1) {
      alpha = parseFloat(alphaPart[1].trim()) || 1
    }

    // 如果完全透明，返回 transparent
    if (alpha === 0 || alpha < 0.01) {
      return 'rgba(0, 0, 0, 0)'
    }

    // 對於 oklab/oklch，提取 L 值（亮度）並轉換成灰階近似
    // oklab(L a b) 或 oklab(L a b / alpha)
    // L: 0 = 黑色, 1 = 白色
    const values = alphaPart[0].trim().split(/\s+/)
    if (values.length >= 1) {
      const L = parseFloat(values[0]) || 0
      // 簡單轉換：L 值 0-1 對應灰階 0-255
      const gray = Math.round(L * 255)
      return `rgba(${gray}, ${gray}, ${gray}, ${alpha})`
    }

    // 無法解析，返回黑色透明
    return `rgba(0, 0, 0, ${alpha})`
  }

  return color
}

// 解析顏色（處理 rgba、rgb、hex）
function parseColor(color: string): string {
  if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
    return 'transparent'
  }
  return normalizeColorForCanvas(color)
}

// 字體粗細類型
type FontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'

// 從 computed style 取得字體粗細
function getFontWeight(weight: string): FontWeight {
  const weightMap: Record<string, FontWeight> = {
    '100': '100',
    '200': '200',
    '300': '300',
    '400': 'normal',
    '500': '500',
    '600': '600',
    '700': '700',
    '800': '800',
    '900': '900',
    'normal': 'normal',
    'bold': '700',
  }
  return weightMap[weight] || 'normal'
}

// 文字對齊類型
type TextAlign = 'left' | 'center' | 'right'

// 從 computed style 取得文字對齊
function getTextAlign(align: string): TextAlign {
  if (align === 'center' || align === 'right') {
    return align
  }
  // justify 和其他值都視為 left
  return 'left'
}

interface ExtractOptions {
  scale?: number  // 容器的縮放比例，預設 1
}

/**
 * 從 DOM 元素提取 Canvas 元素
 * @param container - 包含 data-element 屬性的容器元素
 * @param options - 提取選項（scale 應為 1，表示 DOM 以 1:1 比例渲染）
 * @returns CanvasElement 陣列
 */
export function extractElementsFromDOM(
  container: HTMLElement,
  options: ExtractOptions = {}
): CanvasElement[] {
  const { scale = 1 } = options
  const elements: CanvasElement[] = []
  const containerRect = container.getBoundingClientRect()

  // 調試：打印容器資訊
  logger.log('[extractDOM] Container:', {
    left: containerRect.left,
    top: containerRect.top,
    width: containerRect.width,
    height: containerRect.height,
    scale,
    note: scale === 1 ? '1:1 extraction (no scale adjustment needed)' : `will divide by ${scale}`,
  })

  // 找出所有有 data-element 屬性的元素
  const markedElements = container.querySelectorAll('[data-element]')

  let zIndex = 0

  markedElements.forEach((el) => {
    const htmlEl = el as HTMLElement
    const elementType = htmlEl.dataset.element // 'text', 'image', 'shape'
    const elementName = htmlEl.dataset.name || '未命名'
    const rect = htmlEl.getBoundingClientRect()

    // 計算相對於容器的座標（考慮縮放比例）
    // getBoundingClientRect 返回的是縮放後的座標，需要除以 scale 來得到原始座標
    const x = (rect.left - containerRect.left) / scale
    const y = (rect.top - containerRect.top) / scale
    const width = rect.width / scale
    const height = rect.height / scale

    // 調試：打印每個元素的座標
    logger.log(`[extractDOM] ${elementName}:`, {
      rawRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      relativeRaw: { x: rect.left - containerRect.left, y: rect.top - containerRect.top },
      afterScale: { x, y, width, height },
    })

    const computedStyle = window.getComputedStyle(htmlEl)

    if (elementType === 'text' || htmlEl.tagName === 'H1' || htmlEl.tagName === 'H2' || htmlEl.tagName === 'H3' || htmlEl.tagName === 'P' || htmlEl.tagName === 'SPAN') {
      // 文字元素
      const textContent = htmlEl.textContent || ''

      // 字體大小不需要除以 scale，因為 computedStyle 返回的是 CSS 原始值，不受 transform 影響
      // 只有 getBoundingClientRect() 返回的座標/尺寸才受 transform 影響
      const fontSize = parseFloat(computedStyle.fontSize) || 16
      const rawLetterSpacing = parseFloat(computedStyle.letterSpacing) || 0
      const letterSpacing = isNaN(rawLetterSpacing) ? 0 : rawLetterSpacing

      const textElement: TextElement = {
        id: generateId('text'),
        type: 'text',
        name: elementName,
        x,
        y,
        width,
        height,
        rotation: 0,
        opacity: parseFloat(computedStyle.opacity) || 1,
        locked: false,
        visible: true,
        zIndex: zIndex++,
        content: textContent,
        style: {
          fontFamily: computedStyle.fontFamily.split(',')[0].replace(/['"]/g, '').trim() || 'Noto Sans TC',
          fontSize,
          fontWeight: getFontWeight(computedStyle.fontWeight),
          fontStyle: computedStyle.fontStyle as 'normal' | 'italic',
          textAlign: getTextAlign(computedStyle.textAlign),
          lineHeight: parseFloat(computedStyle.lineHeight) / fontSize || 1.2,
          letterSpacing,
          color: parseColor(computedStyle.color),
          textDecoration: computedStyle.textDecoration.includes('underline') ? 'underline' : 'none',
        },
      }

      elements.push(textElement)

    } else if (elementType === 'image' || htmlEl.tagName === 'IMG') {
      // 圖片元素
      const imgEl = htmlEl as HTMLImageElement

      // 圖片來源優先順序：
      // 1. data-src 屬性（明確指定的圖片 URL）
      // 2. img 元素的 src
      // 3. 背景圖片 URL（從 computedStyle 解析）
      let imageSrc = ''

      // 優先使用 data-src
      if (htmlEl.dataset.src) {
        imageSrc = htmlEl.dataset.src
      }
      // 如果是 <img> 標籤，使用 src
      else if (htmlEl.tagName === 'IMG' && imgEl.src) {
        imageSrc = imgEl.src
      }
      // 否則從背景圖片提取
      else {
        const bgImage = computedStyle.backgroundImage
        if (bgImage && bgImage !== 'none') {
          // 處理各種 url() 格式
          const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/)
          if (match && match[1]) {
            imageSrc = match[1]
          }
        }
      }

      // 判斷 objectFit：
      // - <img> 元素使用 object-fit
      // - 背景圖片使用 background-size
      let objectFit: 'cover' | 'contain' | 'fill' = 'cover'
      if (htmlEl.tagName === 'IMG') {
        const objFit = computedStyle.objectFit
        if (objFit === 'contain') objectFit = 'contain'
        else if (objFit === 'fill') objectFit = 'fill'
        else objectFit = 'cover'
      } else {
        // 背景圖片
        const bgSize = computedStyle.backgroundSize
        if (bgSize === 'contain') objectFit = 'contain'
        else if (bgSize === '100% 100%' || bgSize.includes('100%')) objectFit = 'fill'
        else objectFit = 'cover'  // 預設 cover
      }

      // 如果沒有找到圖片來源，跳過此元素
      if (!imageSrc) {
        // 使用 logger，但這裡在 forEach 內，用 return 跳過
        // Note: 這不會影響其他元素的處理
        return
      }

      const imageElement: ImageElement = {
        id: generateId('image'),
        type: 'image',
        name: elementName,
        x,
        y,
        width,
        height,
        rotation: 0,
        opacity: parseFloat(computedStyle.opacity) || 1,
        locked: false,
        visible: true,
        zIndex: zIndex++,
        src: imageSrc,
        cropX: 0,
        cropY: 0,
        cropWidth: width,
        cropHeight: height,
        filters: {
          brightness: 0,
          contrast: 0,
          saturation: 0,
          blur: 0,
        },
        objectFit,
      }

      elements.push(imageElement)

    } else if (elementType === 'shape') {
      // 形狀元素
      // 檢測漸層背景
      const gradient = parseGradient(computedStyle.backgroundImage)

      const shapeElement: ShapeElement = {
        id: generateId('shape'),
        type: 'shape',
        name: elementName,
        x,
        y,
        width,
        height,
        rotation: 0,
        opacity: parseFloat(computedStyle.opacity) || 1,
        locked: false,
        visible: true,
        zIndex: zIndex++,
        variant: 'rectangle',
        fill: parseColor(computedStyle.backgroundColor),
        stroke: parseColor(computedStyle.borderColor),
        strokeWidth: parseFloat(computedStyle.borderWidth) || 0,
        cornerRadius: parseFloat(computedStyle.borderRadius) || 0,
        gradient: gradient || undefined,
      }

      logger.log(`[extractDOM] Shape "${elementName}":`, {
        hasGradient: !!gradient,
        gradient,
        backgroundImage: computedStyle.backgroundImage?.substring(0, 100),
      })

      elements.push(shapeElement)
    }
  })

  return elements
}

/**
 * 從模板 ref 提取元素（用於 React 組件）
 * @param templateRef - 模板容器的 ref
 * @param scale - 模板的縮放比例（預設 0.75，對應 BrochureDesignerPage 的 scale）
 */
export function extractFromTemplateRef(
  templateRef: React.RefObject<HTMLDivElement | null>,
  scale: number = 0.75
): CanvasElement[] {
  if (!templateRef.current) {
    // 使用 logger 而非 console
    return []
  }

  return extractElementsFromDOM(templateRef.current, { scale })
}
