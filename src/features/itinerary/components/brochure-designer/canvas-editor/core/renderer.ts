/**
 * A2UI - Canvas Rendering Engine
 *
 * This engine is the single source of truth for converting abstract
 * CanvasElement definitions into concrete Fabric.js objects.
 * It ensures that both the read-only preview and the interactive editor
 * look and behave identically.
 *
 * Design Principles:
 * 1.  **Pure Functions:** Each `render[Type]Element` function is a pure function
 *     that takes a CanvasElement and returns a FabricObject.
 * 2.  **Centralized Logic:** All layout and style calculations are done here.
 * 3.  **Extensible:** Easily add support for new element types by adding a
 *     new `render[Type]Element` function and adding it to the main switch.
 */

import {
  Canvas,
  StaticCanvas,
  Text,
  Rect,
  Circle,
  Image as FabricImage,
  Gradient,
  Object as FabricObject,
  Group,
} from 'fabric'
import type {
  CanvasElement,
  TextElement,
  ImageElement,
  ShapeElement,
  GradientFill,
  FabricObjectWithData,
} from '../types'
import { logger } from '@/lib/utils/logger'

// =================================================================
// Helper Functions
// =================================================================

/**
 * Creates a Fabric.js Gradient object from a GradientFill definition.
 * @param gradientDef The gradient definition.
 * @param width The width of the object to apply the gradient to.
 * @param height The height of the object to apply the gradient to.
 * @returns A Fabric.js Gradient object.
 */
function createGradient(
  gradientDef: GradientFill,
  width: number,
  height: number
): Gradient<'linear', 'linear'> {
  const angleRad = ((gradientDef.angle || 180) - 90) * (Math.PI / 180)
  const coords = {
    x1: width / 2 - (Math.cos(angleRad) * width) / 2,
    y1: height / 2 - (Math.sin(angleRad) * height) / 2,
    x2: width / 2 + (Math.cos(angleRad) * width) / 2,
    y2: height / 2 + (Math.sin(angleRad) * height) / 2,
  }

  return new Gradient({
    type: 'linear',
    coords,
    colorStops: gradientDef.colorStops.map((stop) => ({
      offset: stop.offset,
      color: stop.color,
    })),
  })
}

/**
 * Gets the common Fabric.js object properties for any element.
 * @param el The canvas element.
 * @param isEditable Whether the object should be interactive.
 * @returns Common Fabric.js properties with custom data attribute.
 */
function getCommonProps(
  el: CanvasElement,
  isEditable: boolean
): Partial<FabricObject> & { data: FabricObjectWithData['data'] } {
  return {
    opacity: el.opacity ?? 1,
    angle: el.rotation || 0,
    visible: el.visible ?? true,
    // Data attribute for linking Fabric object back to our schema
    data: {
      elementId: el.id,
      elementType: el.type,
    },
    // Control interactivity
    selectable: isEditable && !el.locked,
    evented: isEditable && !el.locked,
    lockMovementX: el.locked,
    lockMovementY: el.locked,
    lockScalingX: el.locked,
    lockScalingY: el.locked,
    lockRotation: el.locked,
  }
}

// =================================================================
// Element Renderers
// =================================================================

/** Renders a TextElement into a Fabric.Text object. */
function renderTextElement(el: TextElement, isEditable: boolean): FabricObject {
  const textAlign = el.style?.textAlign || 'left'
  const elementWidth = el.width || 200

  // Adjust position based on text alignment
  let originX: 'left' | 'center' | 'right' = 'left'
  let actualX = el.x

  if (textAlign === 'center') {
    originX = 'center'
    actualX = el.x + elementWidth / 2
  } else if (textAlign === 'right') {
    originX = 'right'
    actualX = el.x + elementWidth
  }

  return new Text(el.content || '', {
    ...getCommonProps(el, isEditable),
    left: actualX,
    top: el.y,
    originX,
    originY: 'top',
    width: el.width,
    fontFamily: el.style?.fontFamily || 'Noto Sans TC',
    fontSize: el.style?.fontSize || 16,
    fill: el.style?.color || '#333333',
    fontWeight: el.style?.fontWeight || 'normal',
    fontStyle: el.style?.fontStyle || 'normal',
    lineHeight: el.style?.lineHeight || 1.2,
    charSpacing: (el.style?.letterSpacing || 0) * 10, // Fabric's charSpacing is different
  }) as FabricObjectWithData
}

/** Renders a ShapeElement into a Fabric.Rect or Fabric.Circle object. */
function renderShapeElement(el: ShapeElement, isEditable: boolean): FabricObject {
  const commonProps = getCommonProps(el, isEditable)

  logger.log('[Renderer] Shape:', {
    name: el.name,
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height,
  })

  if (el.variant === 'rectangle' || !el.variant) {
    const rect = new Rect({
      ...commonProps,
      left: el.x,
      top: el.y,
      width: el.width,
      height: el.height,
      originX: 'left',
      originY: 'top',
      fill: el.fill || '#e8e5e0',
      stroke: el.stroke === 'transparent' ? '' : el.stroke || '',
      strokeWidth: el.strokeWidth ?? 0,
      rx: el.cornerRadius || 0,
      ry: el.cornerRadius || 0,
    })

    if (el.gradient) {
      const gradient = createGradient(el.gradient, el.width, el.height)
      rect.set('fill', gradient)
    }
    return rect as FabricObjectWithData
  }

  if (el.variant === 'circle') {
    return new Circle({
      ...commonProps,
      left: el.x,
      top: el.y,
      radius: Math.min(el.width, el.height) / 2,
      originX: 'left',
      originY: 'top',
      fill: el.fill || '#c9aa7c',
      stroke: el.stroke === 'transparent' ? '' : el.stroke || '',
      strokeWidth: el.strokeWidth ?? 0,
    }) as FabricObjectWithData
  }

  // Fallback for other shape variants
  logger.warn('[Renderer] Unsupported shape variant:', el.variant)
  return renderErrorPlaceholder(el, isEditable, `Unsupported shape: ${el.variant}`)
}

/** Renders an ImageElement into a Fabric.Image object. This is an async operation. */
async function renderImageElement(el: ImageElement, isEditable: boolean): Promise<FabricObject> {
  try {
    const htmlImg = new window.Image()
    htmlImg.crossOrigin = 'anonymous'

    await new Promise<void>((resolve, reject) => {
      htmlImg.onload = () => resolve()
      htmlImg.onerror = (err) => reject(new Error(`Image load failed for src: ${el.src.substring(0, 100)}...`))
      htmlImg.src = el.src
    })

    const fabricImg = new FabricImage(htmlImg)

    const originalWidth = htmlImg.naturalWidth || 1
    const originalHeight = htmlImg.naturalHeight || 1
    const targetWidth = el.width
    const targetHeight = el.height
    const objectFit = el.objectFit || 'cover'

    logger.log('[Renderer] Image:', {
      name: el.name,
      position: { x: el.x, y: el.y },
      target: { w: targetWidth, h: targetHeight },
      original: { w: originalWidth, h: originalHeight },
      objectFit,
    })

    let scaleX: number, scaleY: number

    if (objectFit === 'cover') {
      const scale = Math.max(targetWidth / originalWidth, targetHeight / originalHeight)
      scaleX = scale
      scaleY = scale
    } else if (objectFit === 'contain') {
      const scale = Math.min(targetWidth / originalWidth, targetHeight / originalHeight)
      scaleX = scale
      scaleY = scale
    } else { // 'fill'
      scaleX = targetWidth / originalWidth
      scaleY = targetHeight / originalHeight
    }

    // 計算縮放後的圖片尺寸
    const scaledWidth = originalWidth * scaleX
    const scaledHeight = originalHeight * scaleY

    // 圖片在群組內的偏移（置中裁切）
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

    // 直接對圖片設定位置和裁切（不使用 Group 以避免自動佈局問題）
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

    return fabricImg as FabricObjectWithData
  } catch (error) {
    logger.error('[Renderer] Failed to render image:', error)
    // Return a placeholder on error
    return renderErrorPlaceholder(el, isEditable, 'Image failed to load')
  }
}

/** Renders a placeholder for unsupported or errored elements. */
function renderErrorPlaceholder(
  el: CanvasElement,
  isEditable: boolean,
  message?: string
): FabricObject {
  const textContent = message || `Unsupported: ${el.type}`
  const rect = new Rect({
    left: 0,
    top: 0,
    width: el.width,
    height: el.height,
    fill: '#fff2f2',
    stroke: '#ff8f8f',
    strokeWidth: 1,
  })
  const text = new Text(textContent, {
    left: el.width / 2,
    top: el.height / 2,
    originX: 'center',
    originY: 'center',
    fontSize: 12,
    fill: '#da2d2d',
    textAlign: 'center',
  })

  return new Group([rect, text], {
    ...getCommonProps(el, isEditable),
    left: el.x,
    top: el.y,
    width: el.width,
    height: el.height,
  }) as FabricObjectWithData
}

// =================================================================
// Main Rendering Orchestrator
// =================================================================

export interface RenderElementsOptions {
  isEditable: boolean
}

/**
 * Renders a list of canvas elements onto a Fabric.js canvas.
 * This is the main entry point for the rendering engine.
 * @param canvas The Fabric.js canvas instance (Canvas or StaticCanvas).
 * @param elements The array of elements to render.
 * @param options Rendering options.
 */
export async function renderElements(
  canvas: Canvas | StaticCanvas,
  elements: CanvasElement[],
  options: RenderElementsOptions
): Promise<void> {
  const { isEditable } = options

  // 1. Sort elements by zIndex
  const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))

  // 2. Create a list of promises for Fabric objects
  const fabricObjectPromises: Promise<FabricObject | null>[] = sortedElements.map((el) => {
    switch (el.type) {
      case 'text':
        return Promise.resolve(renderTextElement(el as TextElement, isEditable))
      case 'shape':
        return Promise.resolve(renderShapeElement(el as ShapeElement, isEditable))
      case 'image':
        return renderImageElement(el as ImageElement, isEditable)

      // --- Stubs for currently unsupported types ---
      case 'decoration':
      case 'icon':
      case 'spot-card':
      case 'itinerary-item':
      case 'flight-info':
      case 'accommodation-card':
      case 'day-header':
        logger.warn(`[Renderer] Rendering placeholder for unsupported element type: ${el.type}`)
        return Promise.resolve(renderErrorPlaceholder(el, isEditable))

      default:
        logger.error(`[Renderer] Unknown element type: ${(el as any).type}`)
        return Promise.resolve(null)
    }
  })

  // 3. Await all objects to be created (especially async images)
  const fabricObjects = await Promise.all(fabricObjectPromises)

  // 4. Add all created objects to the canvas
  canvas.add(...fabricObjects.filter((obj): obj is FabricObject => obj !== null))


  // 5. Final render
  canvas.renderAll()
  logger.log(`[Renderer] Rendered ${fabricObjects.length} elements.`)
}
