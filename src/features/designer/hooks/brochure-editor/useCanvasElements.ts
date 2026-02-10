'use client'

import { useCallback } from 'react'
import * as fabric from 'fabric'
import { logger } from '@/lib/utils/logger'
import type {
  AddTextOptions,
  AddRectangleOptions,
  AddCircleOptions,
  AddEllipseOptions,
  AddTriangleOptions,
  AddImageOptions,
  AddLineOptions,
  AddStickerOptions,
  AddIconOptions,
  AddIllustrationOptions,
} from './types'

/**
 * useCanvasElements - 添加元素 Hook
 * 
 * 功能：
 * - addText, addRectangle, addCircle, addEllipse, addTriangle
 * - addImage, addLine, addSticker, addIcon, addIllustration
 */

interface UseCanvasElementsOptions {
  width: number
  height: number
  getCanvas: () => fabric.Canvas | null
}

interface UseCanvasElementsReturn {
  addText: (options?: AddTextOptions) => void
  addRectangle: (options?: AddRectangleOptions) => void
  addCircle: (options?: AddCircleOptions) => void
  addEllipse: (options?: AddEllipseOptions) => void
  addTriangle: (options?: AddTriangleOptions) => void
  addImage: (url: string, options?: AddImageOptions) => Promise<void>
  addLine: (options?: AddLineOptions) => void
  addSticker: (pathData: string, options?: AddStickerOptions) => void
  addIcon: (iconName: string, options?: AddIconOptions) => Promise<void>
  addIllustration: (svgString: string, options?: AddIllustrationOptions) => Promise<void>
}

export function useCanvasElements(options: UseCanvasElementsOptions): UseCanvasElementsReturn {
  const { width, height, getCanvas } = options

  // ============================================
  // Add Text
  // ============================================
  const addText = useCallback((opts?: AddTextOptions) => {
    const canvas = getCanvas()
    if (!canvas) return

    const text = new fabric.Textbox(opts?.content ?? '雙擊編輯文字', {
      left: opts?.x ?? width / 2,
      top: opts?.y ?? height / 2,
      fontFamily: 'Noto Sans TC',
      fontSize: 24,
      fill: '#3a3633',
      originX: 'center',
      originY: 'center',
      width: 200,
      textAlign: 'left',
      splitByGrapheme: true,
    })

    ;(text as fabric.Textbox & { id: string }).id = `text-${Date.now()}`

    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
  }, [getCanvas, width, height])

  // ============================================
  // Add Rectangle
  // ============================================
  const addRectangle = useCallback((opts?: AddRectangleOptions) => {
    const canvas = getCanvas()
    if (!canvas) return

    const rect = new fabric.Rect({
      left: opts?.x ?? width / 2,
      top: opts?.y ?? height / 2,
      width: opts?.width ?? 100,
      height: opts?.height ?? 80,
      fill: '#c9aa7c',
      stroke: '#b8996b',
      strokeWidth: 1,
      rx: 4,
      ry: 4,
      originX: 'center',
      originY: 'center',
    })

    ;(rect as fabric.Rect & { id: string }).id = `rect-${Date.now()}`

    canvas.add(rect)
    canvas.setActiveObject(rect)
    canvas.renderAll()
  }, [getCanvas, width, height])

  // ============================================
  // Add Circle
  // ============================================
  const addCircle = useCallback((opts?: AddCircleOptions) => {
    const canvas = getCanvas()
    if (!canvas) return

    const circle = new fabric.Circle({
      left: opts?.x ?? width / 2,
      top: opts?.y ?? height / 2,
      radius: opts?.radius ?? 50,
      fill: '#c9aa7c',
      stroke: '#b8996b',
      strokeWidth: 1,
      originX: 'center',
      originY: 'center',
    })

    ;(circle as fabric.Circle & { id: string }).id = `circle-${Date.now()}`

    canvas.add(circle)
    canvas.setActiveObject(circle)
    canvas.renderAll()
  }, [getCanvas, width, height])

  // ============================================
  // Add Ellipse
  // ============================================
  const addEllipse = useCallback((opts?: AddEllipseOptions) => {
    const canvas = getCanvas()
    if (!canvas) return

    const ellipse = new fabric.Ellipse({
      left: opts?.x ?? width / 2,
      top: opts?.y ?? height / 2,
      rx: opts?.rx ?? 60,
      ry: opts?.ry ?? 40,
      fill: '#c9aa7c',
      stroke: '#b8996b',
      strokeWidth: 1,
      originX: 'center',
      originY: 'center',
    })

    ;(ellipse as fabric.Ellipse & { id: string }).id = `ellipse-${Date.now()}`

    canvas.add(ellipse)
    canvas.setActiveObject(ellipse)
    canvas.renderAll()
  }, [getCanvas, width, height])

  // ============================================
  // Add Triangle
  // ============================================
  const addTriangle = useCallback((opts?: AddTriangleOptions) => {
    const canvas = getCanvas()
    if (!canvas) return

    const triangle = new fabric.Triangle({
      left: opts?.x ?? width / 2,
      top: opts?.y ?? height / 2,
      width: opts?.width ?? 80,
      height: opts?.height ?? 70,
      fill: '#c9aa7c',
      stroke: '#b8996b',
      strokeWidth: 1,
      originX: 'center',
      originY: 'center',
    })

    ;(triangle as fabric.Triangle & { id: string }).id = `triangle-${Date.now()}`

    canvas.add(triangle)
    canvas.setActiveObject(triangle)
    canvas.renderAll()
  }, [getCanvas, width, height])

  // ============================================
  // Add Image
  // ============================================
  const addImage = useCallback(async (url: string, opts?: AddImageOptions) => {
    const canvas = getCanvas()
    if (!canvas) return

    const img = await fabric.FabricImage.fromURL(url)

    const maxWidth = width * 0.6
    const maxHeight = height * 0.6
    const imgWidth = img.width || 100
    const imgHeight = img.height || 100
    const scaleX = maxWidth / imgWidth
    const scaleY = maxHeight / imgHeight
    const scale = Math.min(scaleX, scaleY, 1)

    img.set({
      left: opts?.x ?? width / 2,
      top: opts?.y ?? height / 2,
      originX: 'center',
      originY: 'center',
      scaleX: scale,
      scaleY: scale,
    })

    ;(img as fabric.FabricImage & { id: string }).id = `image-${Date.now()}`

    canvas.add(img)
    canvas.setActiveObject(img)
    canvas.renderAll()
  }, [getCanvas, width, height])

  // ============================================
  // Add Line
  // ============================================
  const addLine = useCallback((opts?: AddLineOptions) => {
    const canvas = getCanvas()
    if (!canvas) return

    const lineOptions: Partial<fabric.Line> = {
      stroke: '#3a3633',
      strokeWidth: 2,
    }

    if (opts?.style === 'dashed') {
      lineOptions.strokeDashArray = [10, 5]
    } else if (opts?.style === 'dotted') {
      lineOptions.strokeDashArray = [2, 4]
    }

    const line = new fabric.Line(
      [width / 2 - 50, height / 2, width / 2 + 50, height / 2],
      lineOptions as Partial<fabric.Line>
    )

    ;(line as fabric.Line & { id: string }).id = `line-${Date.now()}`

    canvas.add(line)

    if (opts?.arrow) {
      const triangle = new fabric.Triangle({
        left: width / 2 + 50,
        top: height / 2,
        width: 15,
        height: 15,
        fill: '#3a3633',
        angle: 90,
        originX: 'center',
        originY: 'center',
      })
      ;(triangle as fabric.Triangle & { id: string }).id = `arrow-${Date.now()}`
      canvas.add(triangle)
    }

    canvas.setActiveObject(line)
    canvas.renderAll()
  }, [getCanvas, width, height])

  // ============================================
  // Add Sticker (SVG Path)
  // ============================================
  const addSticker = useCallback((pathData: string, opts?: AddStickerOptions) => {
    const canvas = getCanvas()
    if (!canvas) return

    const defaultSize = 100
    const viewBoxWidth = opts?.viewBox?.width || 100
    const viewBoxHeight = opts?.viewBox?.height || 100
    const targetWidth = opts?.width || defaultSize
    const targetHeight = opts?.height || defaultSize

    const path = new fabric.Path(pathData, {
      left: opts?.x ?? width / 2,
      top: opts?.y ?? height / 2,
      fill: opts?.fill || '#c9aa7c',
      stroke: opts?.fill || '#c9aa7c',
      strokeWidth: 1,
      originX: 'center',
      originY: 'center',
      scaleX: targetWidth / viewBoxWidth,
      scaleY: targetHeight / viewBoxHeight,
    })

    ;(path as fabric.Path & { id: string }).id = `sticker-${Date.now()}`

    canvas.add(path)
    canvas.setActiveObject(path)
    canvas.renderAll()
  }, [getCanvas, width, height])

  // ============================================
  // Add Icon (from @iconify)
  // ============================================
  const addIcon = useCallback(async (iconName: string, opts?: AddIconOptions) => {
    const canvas = getCanvas()
    if (!canvas) return

    try {
      const response = await fetch(`https://api.iconify.design/${iconName}.svg?height=64`)
      if (!response.ok) throw new Error('Failed to fetch icon')

      const svgText = await response.text()

      fabric.loadSVGFromString(svgText).then((result) => {
        const group = new fabric.Group(result.objects.filter(Boolean) as fabric.FabricObject[], {
          left: opts?.x ?? width / 2,
          top: opts?.y ?? height / 2,
          originX: 'center',
          originY: 'center',
        })

        if (!opts?.keepOriginalColor) {
          const color = opts?.color || '#3a3633'
          group.getObjects().forEach(obj => {
            if ('fill' in obj) {
              const currentFill = obj.fill
              if (currentFill && currentFill !== 'none' && currentFill !== 'transparent' && currentFill !== '') {
                obj.set('fill', color)
              }
            }
            if ('stroke' in obj && obj.stroke && obj.stroke !== 'none') {
              obj.set('stroke', color)
            }
          })
        }

        const size = opts?.size || 64
        const bounds = group.getBoundingRect()
        const scale = size / Math.max(bounds.width, bounds.height)
        group.scale(scale)

        ;(group as fabric.Group & { id: string }).id = `icon-${Date.now()}`

        canvas.add(group)
        canvas.setActiveObject(group)
        canvas.renderAll()
      })
    } catch (error) {
      logger.error('Failed to add icon:', error)
    }
  }, [getCanvas, width, height])

  // ============================================
  // Add Illustration (colorful SVG)
  // ============================================
  const addIllustration = useCallback(async (svgString: string, opts?: AddIllustrationOptions) => {
    const canvas = getCanvas()
    if (!canvas) return

    try {
      fabric.loadSVGFromString(svgString).then((result) => {
        const objects = result.objects.filter(Boolean) as fabric.FabricObject[]
        if (objects.length === 0) return

        const group = new fabric.Group(objects, {
          left: opts?.x ?? width / 2,
          top: opts?.y ?? height / 2,
          originX: 'center',
          originY: 'center',
        })

        const size = opts?.size || 100
        const bounds = group.getBoundingRect()
        const scale = size / Math.max(bounds.width, bounds.height)
        group.scale(scale)

        ;(group as fabric.Group & { id: string }).id = `illustration-${Date.now()}`

        canvas.add(group)
        canvas.setActiveObject(group)
        canvas.renderAll()
      })
    } catch (error) {
      logger.error('Failed to add illustration:', error)
    }
  }, [getCanvas, width, height])

  return {
    addText,
    addRectangle,
    addCircle,
    addEllipse,
    addTriangle,
    addImage,
    addLine,
    addSticker,
    addIcon,
    addIllustration,
  }
}
