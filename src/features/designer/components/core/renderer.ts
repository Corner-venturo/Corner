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
  Image as FabricImage,
  Group,
  Object as FabricObject,
} from 'fabric'
import type {
  CanvasPage,
  CanvasElement,
  ShapeElement,
  TextElement,
  ImageElement,
  FabricObjectWithData,
} from '../types'

interface RenderOptions {
  isEditable: boolean
  canvasWidth: number
  canvasHeight: number
}

function getCommonProps(
  el: CanvasElement,
  isEditable: boolean
): Partial<FabricObject> & { data: FabricObjectWithData['data'] } {
  return {
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

  switch (el.variant) {
    case 'rectangle':
      return new Rect({
        ...commonProps,
        left: x,
        top: y,
        width: el.width,
        height: el.height,
        fill: el.fill || '#e0e0e0',
        stroke: el.stroke,
        strokeWidth: el.strokeWidth,
        rx: el.cornerRadius,
        ry: el.cornerRadius,
        originX: 'left',
        originY: 'top',
      }) as unknown as FabricObjectWithData

    case 'circle':
      return new Circle({
        ...commonProps,
        left: x,
        top: y,
        radius: Math.min(el.width, el.height) / 2,
        fill: el.fill || '#e0e0e0',
        stroke: el.stroke,
        strokeWidth: el.strokeWidth,
        originX: 'left',
        originY: 'top',
      }) as unknown as FabricObjectWithData

    default:
      // Fallback for unknown variants
      return new Rect({
        ...commonProps,
        left: x,
        top: y,
        width: el.width,
        height: el.height,
        fill: '#ff0000',
        originX: 'left',
        originY: 'top',
      }) as unknown as FabricObjectWithData
  }
}

function renderTextElement(el: TextElement, options: RenderOptions): FabricObject {
  const { isEditable } = options

  return new Textbox(el.content, {
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
  }) as unknown as FabricObjectWithData
}

async function renderImageElement(
  el: ImageElement,
  options: RenderOptions
): Promise<FabricObject> {
  const { isEditable } = options

  try {
    // 預載圖片
    const htmlImg = new window.Image()
    htmlImg.crossOrigin = 'anonymous'

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

    // 計算縮放後的圖片尺寸
    const scaledWidth = originalWidth * scaleX
    const scaledHeight = originalHeight * scaleY

    // 圖片在裁切區域內的偏移（置中）
    const offsetX = (targetWidth - scaledWidth) / 2
    const offsetY = (targetHeight - scaledHeight) / 2

    // 建立裁切用的矩形（使用絕對定位）
    const clipRect = new Rect({
      left: el.x,
      top: el.y,
      width: targetWidth,
      height: targetHeight,
      originX: 'left',
      originY: 'top',
      absolutePositioned: true,
    })

    // 直接對圖片設定位置和裁切
    fabricImg.set({
      ...getCommonProps(el, isEditable),
      left: el.x + offsetX,
      top: el.y + offsetY,
      scaleX,
      scaleY,
      originX: 'left',
      originY: 'top',
      clipPath: clipRect,
    })

    return fabricImg as unknown as FabricObjectWithData
  } catch (error) {
    // 圖片載入失敗時顯示佔位符
    console.error('[Renderer] Failed to load image:', error)
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
    }) as unknown as FabricObjectWithData
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
  // 清除現有內容
  canvas.clear()
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
      default:
        return Promise.resolve(null)
    }
  })

  const fabricObjects = await Promise.all(fabricObjectPromises)

  // 加入到 Canvas
  canvas.add(...fabricObjects.filter((obj): obj is FabricObject => obj !== null))

  // 渲染
  canvas.renderAll()
}
