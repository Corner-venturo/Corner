/**
 * V2 Canvas Rendering Engine
 *
 * 單一渲染引擎，確保預覽和編輯模式完全一致
 */
import {
  Canvas,
  StaticCanvas,
  Rect,
  Textbox,
  Circle,
  Ellipse,
  Image as FabricImage,
  Group,
  Object as FabricObject,
  Path,
  Gradient,
  Line,
  Triangle,
} from 'fabric'
import type {
  CanvasPage,
  CanvasElement,
  ShapeElement,
  TextElement,
  ImageElement,
  IconElement,
  LineElement,
  StickerElement,
  FabricObjectWithData,
  GradientFill,
} from '../types'
import { STICKER_PATHS, getStickerViewBox } from './sticker-paths'
import { MATERIAL_ICON_PATHS, ICON_VIEWBOX_SIZE } from './icon-paths'
import { logger } from '@/lib/utils/logger'

interface RenderOptions {
  isEditable: boolean
  canvasWidth: number
  canvasHeight: number
}

/**
 * 建立圓角矩形的 SVG Path 字串
 * 支援四個角有不同的圓角半徑（用於圓拱形狀）
 */
function createRoundedRectPath(
  x: number,
  y: number,
  width: number,
  height: number,
  borderRadius: { topLeft?: number; topRight?: number; bottomLeft?: number; bottomRight?: number }
): string {
  const tl = Math.min(borderRadius.topLeft || 0, width / 2, height / 2)
  const tr = Math.min(borderRadius.topRight || 0, width / 2, height / 2)
  const br = Math.min(borderRadius.bottomRight || 0, width / 2, height / 2)
  const bl = Math.min(borderRadius.bottomLeft || 0, width / 2, height / 2)

  return `
    M ${x + tl} ${y}
    L ${x + width - tr} ${y}
    Q ${x + width} ${y} ${x + width} ${y + tr}
    L ${x + width} ${y + height - br}
    Q ${x + width} ${y + height} ${x + width - br} ${y + height}
    L ${x + bl} ${y + height}
    Q ${x} ${y + height} ${x} ${y + height - bl}
    L ${x} ${y + tl}
    Q ${x} ${y} ${x + tl} ${y}
    Z
  `.trim()
}

function getCommonProps(
  el: CanvasElement,
  isEditable: boolean
): Partial<FabricObject> & { data: FabricObjectWithData['data']; name: string } {
  return {
    name: el.name, // 保留元素名稱，用於位置匹配
    angle: el.rotation || 0,
    opacity: el.opacity ?? 1,
    visible: el.visible ?? true,
    selectable: isEditable && !el.locked,
    evented: isEditable && !el.locked,
    data: {
      elementId: el.id,
      elementType: el.type,
    },
  }
}

/**
 * 建立 Fabric.js 漸層物件
 */
function createFabricGradient(gradient: GradientFill, width: number, height: number) {
  const isVertical = gradient.direction === 'vertical'

  if (gradient.type === 'linear') {
    return new Gradient<'linear'>({
      type: 'linear',
      gradientUnits: 'percentage',
      coords: {
        x1: 0,
        y1: 0,
        x2: isVertical ? 0 : 1,
        y2: isVertical ? 1 : 0,
      },
      colorStops: gradient.colorStops.map(stop => ({
        offset: stop.offset,
        color: stop.color,
      })),
    })
  } else {
    return new Gradient<'radial'>({
      type: 'radial',
      gradientUnits: 'percentage',
      coords: {
        x1: 0.5,
        y1: 0.5,
        x2: 0.5,
        y2: 0.5,
        r1: 0,
        r2: 0.5,
      },
      colorStops: gradient.colorStops.map(stop => ({
        offset: stop.offset,
        color: stop.color,
      })),
    })
  }
}

function renderShapeElement(el: ShapeElement, options: RenderOptions): FabricObject {
  const { canvasWidth, canvasHeight, isEditable } = options
  let { x, y } = el

  // 處理對齊
  if (el.align?.horizontal === 'center') {
    x = (canvasWidth - el.width) / 2
  } else if (el.align?.horizontal === 'right') {
    x = canvasWidth - el.width
  }
  if (el.align?.vertical === 'center') {
    y = (canvasHeight - el.height) / 2
  } else if (el.align?.vertical === 'bottom') {
    y = canvasHeight - el.height
  }

  const commonProps = getCommonProps(el, isEditable)

  // 決定填充：漸層優先於純色
  const fill = el.gradient
    ? createFabricGradient(el.gradient, el.width, el.height)
    : (el.fill || '#e0e0e0')

  switch (el.variant) {
    case 'rectangle':
      // 如果有四角不同圓角（borderRadius），使用 Path 來繪製
      if (el.borderRadius && (el.borderRadius.topLeft || el.borderRadius.topRight || el.borderRadius.bottomLeft || el.borderRadius.bottomRight)) {
        const pathData = createRoundedRectPath(x, y, el.width, el.height, el.borderRadius)
        return new Path(pathData, {
          ...commonProps,
          fill: fill,
          stroke: el.stroke,
          strokeWidth: el.strokeWidth,
          strokeDashArray: el.strokeDashArray,
          originX: 'left',
          originY: 'top',
        })
      }
      // 普通矩形
      return new Rect({
        ...commonProps,
        left: x,
        top: y,
        width: el.width,
        height: el.height,
        fill: fill,
        stroke: el.stroke,
        strokeWidth: el.strokeWidth,
        strokeDashArray: el.strokeDashArray,
        rx: el.cornerRadius,
        ry: el.cornerRadius,
        originX: 'left',
        originY: 'top',
      })

    case 'circle':
      return new Circle({
        ...commonProps,
        left: x,
        top: y,
        radius: Math.min(el.width, el.height) / 2,
        fill: fill,
        stroke: el.stroke,
        strokeWidth: el.strokeWidth,
        strokeDashArray: el.strokeDashArray,
        originX: 'left',
        originY: 'top',
      })

    case 'ellipse':
      // 橢圓：中間粗、兩端細的效果
      return new Ellipse({
        ...commonProps,
        left: x,
        top: y,
        rx: el.width / 2,  // 水平半徑
        ry: el.height / 2, // 垂直半徑
        fill: fill,
        stroke: el.stroke,
        strokeWidth: el.strokeWidth,
        strokeDashArray: el.strokeDashArray,
        originX: 'left',
        originY: 'top',
      })

    default:
      return new Rect({
        ...commonProps,
        left: x,
        top: y,
        width: el.width,
        height: el.height,
        fill: '#ff0000',
        originX: 'left',
        originY: 'top',
      })
  }
}

function renderTextElement(el: TextElement, options: RenderOptions): FabricObject {
  const { isEditable } = options

  const textbox = new Textbox(el.content, {
    ...getCommonProps(el, isEditable),
    left: el.x,
    top: el.y,
    width: el.width,
    fontFamily: el.style.fontFamily,
    fontSize: el.style.fontSize,
    fontWeight: el.style.fontWeight,
    fontStyle: el.style.fontStyle,
    fill: el.style.color,
    lineHeight: el.style.lineHeight,
    charSpacing: el.style.letterSpacing * 10,
    textAlign: el.style.textAlign,
    originX: 'left',
    originY: 'top',
    // 文字編輯設定：拉伸只改變寬度，不縮放文字
    lockScalingY: true,  // 鎖定垂直縮放
    splitByGrapheme: true, // 中文字元分割
  })

  // 覆寫縮放行為：拉伸時只改變寬度，不縮放文字大小
  textbox.on('scaling', () => {
    const newWidth = textbox.width! * textbox.scaleX!
    textbox.set({
      width: newWidth,
      scaleX: 1,
      scaleY: 1,
    })
  })

  return textbox
}

async function renderImageElement(
  el: ImageElement,
  options: RenderOptions
): Promise<FabricObject> {
  const { isEditable } = options

  try {
    // 預載圖片
    const htmlImg = new window.Image()

    // 只有遠端 URL 需要設定 crossOrigin
    // data: 和 blob: URL 不需要（且設定會導致某些瀏覽器出錯）
    if (!el.src.startsWith('data:') && !el.src.startsWith('blob:')) {
      htmlImg.crossOrigin = 'anonymous'
    }

    await new Promise<void>((resolve, reject) => {
      htmlImg.onload = () => resolve()
      htmlImg.onerror = () => reject(new Error('Image load failed'))
      htmlImg.src = el.src
    })

    const fabricImg = new FabricImage(htmlImg)

    const targetWidth = el.width
    const targetHeight = el.height
    const originalWidth = htmlImg.naturalWidth || 1
    const originalHeight = htmlImg.naturalHeight || 1

    let scaleX: number, scaleY: number

    if (el.objectFit === 'cover') {
      const scale = Math.max(targetWidth / originalWidth, targetHeight / originalHeight)
      scaleX = scale
      scaleY = scale
    } else if (el.objectFit === 'contain') {
      const scale = Math.min(targetWidth / originalWidth, targetHeight / originalHeight)
      scaleX = scale
      scaleY = scale
    } else {
      // fill
      scaleX = targetWidth / originalWidth
      scaleY = targetHeight / originalHeight
    }

    // 如果有自訂位置設定，套用額外縮放
    const positionScale = el.position?.scale || 1
    scaleX *= positionScale
    scaleY *= positionScale

    // 計算縮放後的圖片尺寸
    const scaledWidth = originalWidth * scaleX
    const scaledHeight = originalHeight * scaleY

    // 圖片在裁切區域內的偏移
    // 如果有自訂位置，使用百分比計算；否則置中
    let offsetX: number, offsetY: number
    if (el.position) {
      // position.x/y 是 0-100 的百分比，50 = 置中
      // 當 x=0 時圖片靠左，x=100 時圖片靠右
      const maxOffsetX = targetWidth - scaledWidth
      const maxOffsetY = targetHeight - scaledHeight
      offsetX = (el.position.x / 100) * maxOffsetX
      offsetY = (el.position.y / 100) * maxOffsetY
    } else {
      // 預設置中
      offsetX = (targetWidth - scaledWidth) / 2
      offsetY = (targetHeight - scaledHeight) / 2
    }

    // 建立裁切用的形狀（支援自訂圓角）
    // 使用 absolutePositioned: true，clipPath 使用畫布絕對座標
    // 圖片被鎖定時不能移動，所以這種方式可以正確裁切
    let clipShape: Rect | Path

    if (el.borderRadius && (el.borderRadius.topLeft || el.borderRadius.topRight || el.borderRadius.bottomLeft || el.borderRadius.bottomRight)) {
      // 使用自訂圓角 Path（圓拱形狀）
      // absolutePositioned 模式：使用元素的絕對位置
      const pathData = createRoundedRectPath(el.x, el.y, targetWidth, targetHeight, el.borderRadius)
      clipShape = new Path(pathData, {
        originX: 'left',
        originY: 'top',
        absolutePositioned: true,
      })
    } else {
      // 預設矩形裁切
      clipShape = new Rect({
        left: el.x,
        top: el.y,
        width: targetWidth,
        height: targetHeight,
        originX: 'left',
        originY: 'top',
        absolutePositioned: true,
      })
    }

    // 直接對圖片設定位置和裁切
    fabricImg.set({
      ...getCommonProps(el, isEditable),
      left: el.x + offsetX,
      top: el.y + offsetY,
      scaleX,
      scaleY,
      originX: 'left',
      originY: 'top',
      clipPath: clipShape,
    })

    return fabricImg
  } catch (error) {
    // 圖片載入失敗時顯示佔位符
    logger.error('[Renderer] Failed to load image:', error)
    return new Rect({
      ...getCommonProps(el, isEditable),
      left: el.x,
      top: el.y,
      width: el.width,
      height: el.height,
      fill: '#f0f0f0',
      stroke: '#ff0000',
      strokeWidth: 2,
      originX: 'left',
      originY: 'top',
    })
  }
}

/**
 * 渲染圖標元素（使用 SVG Path）
 */
function renderIconElement(el: IconElement, options: RenderOptions): FabricObject {
  const { isEditable } = options

  const pathData = MATERIAL_ICON_PATHS[el.icon]
  if (!pathData) {
    // 圖標不存在時顯示佔位符
    logger.warn(`[Renderer] Icon "${el.icon}" not found, using placeholder`)
    return new Rect({
      ...getCommonProps(el, isEditable),
      left: el.x,
      top: el.y,
      width: el.size,
      height: el.size,
      fill: el.color,
      opacity: 0.3,
      originX: 'left',
      originY: 'top',
    })
  }

  // 計算縮放比例（從 24x24 viewBox 縮放到目標尺寸）
  const scale = el.size / ICON_VIEWBOX_SIZE

  const path = new Path(pathData, {
    ...getCommonProps(el, isEditable),
    left: el.x,
    top: el.y,
    fill: el.color,
    scaleX: scale,
    scaleY: scale,
    originX: 'left',
    originY: 'top',
  })

  return path
}

/**
 * 渲染線條元素
 */
function renderLineElement(el: LineElement, options: RenderOptions): FabricObject[] {
  const { isEditable } = options
  const commonProps = getCommonProps(el, isEditable)

  // 計算線條虛線樣式
  let strokeDashArray: number[] | undefined
  switch (el.lineStyle) {
    case 'dashed':
      strokeDashArray = [10, 5]
      break
    case 'dotted':
      strokeDashArray = [2, 4]
      break
    default:
      strokeDashArray = undefined
  }

  const objects: FabricObject[] = []

  // 主線條
  const line = new Line([el.x1, el.y1, el.x2, el.y2], {
    ...commonProps,
    left: el.x,
    top: el.y,
    stroke: el.stroke,
    strokeWidth: el.strokeWidth,
    strokeDashArray,
    originX: 'left',
    originY: 'top',
  })
  objects.push(line)

  // 計算線條角度（用於端點旋轉）
  const angle = Math.atan2(el.y2 - el.y1, el.x2 - el.x1) * (180 / Math.PI)

  // 起點端點
  if (el.startEndpoint && el.startEndpoint !== 'none') {
    const startObj = createEndpoint(
      el.x + el.x1,
      el.y + el.y1,
      el.startEndpoint,
      angle + 180,
      el.stroke,
      el.strokeWidth,
      isEditable
    )
    if (startObj) objects.push(startObj)
  }

  // 終點端點
  if (el.endEndpoint && el.endEndpoint !== 'none') {
    const endObj = createEndpoint(
      el.x + el.x2,
      el.y + el.y2,
      el.endEndpoint,
      angle,
      el.stroke,
      el.strokeWidth,
      isEditable
    )
    if (endObj) objects.push(endObj)
  }

  return objects
}

/**
 * 建立線條端點形狀
 */
function createEndpoint(
  x: number,
  y: number,
  type: 'arrow' | 'circle' | 'diamond',
  angle: number,
  color: string,
  strokeWidth: number,
  isEditable: boolean
): FabricObject | null {
  const size = strokeWidth * 3

  switch (type) {
    case 'arrow':
      return new Triangle({
        left: x,
        top: y,
        width: size,
        height: size,
        fill: color,
        angle: angle + 90,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
      })
    case 'circle':
      return new Circle({
        left: x - size / 2,
        top: y - size / 2,
        radius: size / 2,
        fill: color,
        originX: 'left',
        originY: 'top',
        selectable: false,
        evented: false,
      })
    case 'diamond':
      return new Rect({
        left: x,
        top: y,
        width: size,
        height: size,
        fill: color,
        angle: 45,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
      })
    default:
      return null
  }
}

/**
 * 渲染印章/貼紙元素
 */
function renderStickerElement(el: StickerElement, options: RenderOptions): FabricObject {
  const { isEditable } = options
  const commonProps = getCommonProps(el, isEditable)

  const stickerData = STICKER_PATHS[el.stickerId]
  if (!stickerData) {
    // 貼紙不存在時顯示佔位符
    logger.warn(`[Renderer] Sticker "${el.stickerId}" not found, using placeholder`)
    return new Rect({
      ...commonProps,
      left: el.x,
      top: el.y,
      width: el.width,
      height: el.height,
      fill: '#f0f0f0',
      stroke: '#ccc',
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      originX: 'left',
      originY: 'top',
    })
  }

  // 取得 viewBox 並計算縮放
  const viewBox = getStickerViewBox(el.stickerId)
  const scaleX = el.width / viewBox.width
  const scaleY = el.height / viewBox.height
  const scale = Math.min(scaleX, scaleY)

  // 替換顏色
  let pathData = stickerData.path
  if (el.primaryColor) {
    pathData = pathData.replace(/#c9aa7c/gi, el.primaryColor)
  }
  if (el.secondaryColor) {
    pathData = pathData.replace(/#8b8680/gi, el.secondaryColor)
  }

  const path = new Path(pathData, {
    ...commonProps,
    left: el.x,
    top: el.y,
    fill: el.primaryColor || stickerData.defaultColor || '#c9aa7c',
    scaleX: scale,
    scaleY: scale,
    originX: 'left',
    originY: 'top',
  })

  return path
}

/**
 * 確保必要的字體已載入
 */
async function ensureFontsLoaded(): Promise<void> {
  // 等待所有字體載入完成
  if (typeof document !== 'undefined' && document.fonts) {
    await document.fonts.ready

    // 額外確保特定字體已載入
    const requiredFonts = [
      'Material Symbols Outlined',
      'Zen Old Mincho',
      'Noto Serif TC',
      'Noto Sans TC',
    ]

    for (const fontName of requiredFonts) {
      try {
        // 嘗試載入字體
        await document.fonts.load(`14px "${fontName}"`)
      } catch {
        // 忽略載入失敗
      }
    }
  }
}

/**
 * 將頁面渲染到 Canvas 上
 */
export async function renderPageOnCanvas(
  canvas: Canvas | StaticCanvas,
  page: CanvasPage,
  options: RenderOptions
): Promise<void> {
  // 安全檢查：確保 canvas 已正確初始化
  if (!canvas) {
    logger.warn('Canvas not provided, skipping render')
    return
  }

  // Fabric.js canvas 需要檢查內部的 contextContainer
  const ctx = canvas.getContext()
  if (!ctx) {
    logger.warn('Canvas context not available, skipping render')
    return
  }

  // 確保字體已載入
  await ensureFontsLoaded()

  // 清除現有內容
  try {
    canvas.clear()
  } catch (err) {
    logger.warn('Canvas clear failed, canvas may not be fully initialized:', err)
    return
  }
  canvas.backgroundColor = page.backgroundColor

  // 按 zIndex 排序
  const sortedElements = [...page.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))

  // 建立所有 Fabric 物件
  const fabricObjectPromises = sortedElements.map((el) => {
    switch (el.type) {
      case 'shape':
        return Promise.resolve(renderShapeElement(el as ShapeElement, options))
      case 'text':
        return Promise.resolve(renderTextElement(el as TextElement, options))
      case 'image':
        return renderImageElement(el as ImageElement, options)
      case 'icon':
        return Promise.resolve(renderIconElement(el as IconElement, options))
      case 'line':
        // 線條元素返回多個物件（線條 + 端點）
        return Promise.resolve(renderLineElement(el as LineElement, options))
      case 'sticker':
        return Promise.resolve(renderStickerElement(el as StickerElement, options))
      default:
        return Promise.resolve(null)
    }
  })

  const fabricObjectsOrArrays = await Promise.all(fabricObjectPromises)

  // 扁平化陣列（處理線條元素返回的多個物件）
  const fabricObjects = fabricObjectsOrArrays.flatMap((obj) => {
    if (Array.isArray(obj)) return obj
    return obj ? [obj] : []
  })

  // 加入到 Canvas
  canvas.add(...fabricObjects)

  // 渲染
  canvas.renderAll()
}
