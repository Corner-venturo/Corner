'use client'

import { useCallback } from 'react'
import * as fabric from 'fabric'
import type { CanvasElement, TextElement, ShapeElement, ImageElement, CanvasPage } from '@/features/designer/components/types'
import { renderPageOnCanvas } from '@/features/designer/components/core/renderer'
import { logger } from '@/lib/utils/logger'

/**
 * useCanvasIO - Canvas 載入/匯出 Hook
 * 
 * 功能：
 * - loadCanvasData: 從 JSON 載入
 * - loadCanvasElements: 從 CanvasElement[] 載入
 * - loadCanvasPage: 使用 renderer 完整渲染頁面
 * - exportCanvasData: 匯出 JSON
 * - exportThumbnail: 匯出縮圖
 */

interface UseCanvasIOOptions {
  width: number
  height: number
}

interface UseCanvasIOReturn {
  loadCanvasData: (canvas: fabric.Canvas | null, data: Record<string, unknown>, applyControlStyles: (c: fabric.Canvas) => void) => Promise<void>
  loadCanvasElements: (canvas: fabric.Canvas | null, elements: CanvasElement[]) => Promise<void>
  loadCanvasPage: (canvas: fabric.Canvas | null, page: CanvasPage, applyControlStyles: (c: fabric.Canvas) => void) => Promise<void>
  exportCanvasData: (canvas: fabric.Canvas | null) => Record<string, unknown>
  exportThumbnail: (canvas: fabric.Canvas | null, options?: { quality?: number; multiplier?: number }) => string
}

export function useCanvasIO(options: UseCanvasIOOptions): UseCanvasIOReturn {
  const { width, height } = options

  // ============================================
  // Load Canvas Data (from JSON)
  // ============================================
  const loadCanvasData = useCallback(async (
    canvas: fabric.Canvas | null,
    data: Record<string, unknown>,
    applyControlStyles: (c: fabric.Canvas) => void
  ) => {
    if (!canvas) return

    canvas.clear()
    await canvas.loadFromJSON(data)
    applyControlStyles(canvas)
    canvas.renderAll()
  }, [])

  // ============================================
  // Load Canvas Elements (from CanvasElement[])
  // ============================================
  const loadCanvasElements = useCallback(async (
    canvas: fabric.Canvas | null,
    elements: CanvasElement[]
  ) => {
    if (!canvas) return

    canvas.clear()

    // Sort elements by zIndex
    const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex)

    for (const element of sortedElements) {
      let fabricObj: fabric.FabricObject | null = null

      switch (element.type) {
        case 'text': {
          const textEl = element as TextElement
          const textbox = new fabric.Textbox(textEl.content, {
            left: textEl.x,
            top: textEl.y,
            width: textEl.width,
            fontFamily: textEl.style.fontFamily,
            fontSize: textEl.style.fontSize,
            fontWeight: textEl.style.fontWeight as string,
            fontStyle: textEl.style.fontStyle,
            textAlign: textEl.style.textAlign,
            lineHeight: textEl.style.lineHeight,
            charSpacing: textEl.style.letterSpacing * 10,
            fill: textEl.style.color,
            angle: textEl.rotation,
            opacity: textEl.opacity,
            selectable: !textEl.locked,
            evented: !textEl.locked,
            visible: textEl.visible,
            originX: 'left',
            originY: 'top',
          })
          fabricObj = textbox
          break
        }

        case 'shape': {
          const shapeEl = element as ShapeElement
          if (shapeEl.variant === 'rectangle') {
            fabricObj = new fabric.Rect({
              left: shapeEl.x,
              top: shapeEl.y,
              width: shapeEl.width,
              height: shapeEl.height,
              fill: shapeEl.fill || '#c9aa7c',
              stroke: shapeEl.stroke,
              strokeWidth: shapeEl.strokeWidth || 0,
              strokeDashArray: shapeEl.strokeDashArray,
              rx: shapeEl.cornerRadius || 0,
              ry: shapeEl.cornerRadius || 0,
              angle: shapeEl.rotation,
              opacity: shapeEl.opacity,
              selectable: !shapeEl.locked,
              evented: !shapeEl.locked,
              visible: shapeEl.visible,
              originX: 'left',
              originY: 'top',
            })
          } else if (shapeEl.variant === 'circle') {
            fabricObj = new fabric.Circle({
              left: shapeEl.x,
              top: shapeEl.y,
              radius: Math.min(shapeEl.width, shapeEl.height) / 2,
              fill: shapeEl.fill || '#c9aa7c',
              stroke: shapeEl.stroke,
              strokeWidth: shapeEl.strokeWidth || 0,
              angle: shapeEl.rotation,
              opacity: shapeEl.opacity,
              selectable: !shapeEl.locked,
              evented: !shapeEl.locked,
              visible: shapeEl.visible,
              originX: 'left',
              originY: 'top',
            })
          } else if (shapeEl.variant === 'ellipse') {
            fabricObj = new fabric.Ellipse({
              left: shapeEl.x,
              top: shapeEl.y,
              rx: shapeEl.width / 2,
              ry: shapeEl.height / 2,
              fill: shapeEl.fill || '#c9aa7c',
              stroke: shapeEl.stroke,
              strokeWidth: shapeEl.strokeWidth || 0,
              angle: shapeEl.rotation,
              opacity: shapeEl.opacity,
              selectable: !shapeEl.locked,
              evented: !shapeEl.locked,
              visible: shapeEl.visible,
              originX: 'left',
              originY: 'top',
            })
          }
          break
        }

        case 'image': {
          const imgEl = element as ImageElement
          try {
            const img = await fabric.FabricImage.fromURL(imgEl.src, { crossOrigin: 'anonymous' })
            img.set({
              left: imgEl.x,
              top: imgEl.y,
              angle: imgEl.rotation,
              opacity: imgEl.opacity,
              selectable: !imgEl.locked,
              evented: !imgEl.locked,
              visible: imgEl.visible,
              originX: 'left',
              originY: 'top',
            })
            // Scale to fit specified dimensions
            if (img.width && img.height) {
              img.scaleToWidth(imgEl.width)
              if ((img.height * (imgEl.width / img.width)) > imgEl.height) {
                img.scaleToHeight(imgEl.height)
              }
            }
            fabricObj = img
          } catch (err) {
            logger.error('Failed to load image:', imgEl.src, err)
          }
          break
        }

        case 'line': {
          const lineEl = element
          if ('x1' in lineEl && 'y1' in lineEl && 'x2' in lineEl && 'y2' in lineEl) {
            const strokeDashArray = lineEl.lineStyle === 'dashed'
              ? [10, 5]
              : lineEl.lineStyle === 'dotted'
                ? [2, 4]
                : undefined
            fabricObj = new fabric.Line(
              [lineEl.x + lineEl.x1, lineEl.y + lineEl.y1, lineEl.x + lineEl.x2, lineEl.y + lineEl.y2],
              {
                stroke: lineEl.stroke,
                strokeWidth: lineEl.strokeWidth,
                strokeDashArray,
                angle: lineEl.rotation,
                opacity: lineEl.opacity,
                selectable: !lineEl.locked,
                evented: !lineEl.locked,
                visible: lineEl.visible,
              }
            )
          }
          break
        }
      }

      if (fabricObj) {
        (fabricObj as fabric.FabricObject & { id: string }).id = element.id
        canvas.add(fabricObj)
      }
    }

    canvas.renderAll()
  }, [])

  // ============================================
  // Load Canvas Page (using renderer)
  // ============================================
  const loadCanvasPage = useCallback(async (
    canvas: fabric.Canvas | null,
    page: CanvasPage,
    applyControlStyles: (c: fabric.Canvas) => void
  ) => {
    if (!canvas) return

    await renderPageOnCanvas(canvas, page, {
      isEditable: true,
      canvasWidth: width,
      canvasHeight: height,
    })
    applyControlStyles(canvas)
  }, [width, height])

  // ============================================
  // Export Canvas Data
  // ============================================
  const exportCanvasData = useCallback((canvas: fabric.Canvas | null): Record<string, unknown> => {
    if (!canvas) return {}

    const json = canvas.toJSON() as { objects?: Array<Record<string, unknown>> }
    if (json.objects) {
      const objects = canvas.getObjects()
      json.objects = json.objects.map((obj, idx) => {
        const fabricObj = objects[idx] as fabric.FabricObject & {
          data?: Record<string, unknown>
          name?: string
        }
        return {
          ...obj,
          name: fabricObj?.name || obj.name,
          data: fabricObj?.data,
        }
      })
    }
    return json as Record<string, unknown>
  }, [])

  // ============================================
  // Export Thumbnail
  // ============================================
  const exportThumbnail = useCallback((
    canvas: fabric.Canvas | null,
    options?: { quality?: number; multiplier?: number }
  ): string => {
    if (!canvas) return ''

    return canvas.toDataURL({
      format: 'jpeg',
      quality: options?.quality ?? 0.6,
      multiplier: options?.multiplier ?? 0.3,
    })
  }, [])

  return {
    loadCanvasData,
    loadCanvasElements,
    loadCanvasPage,
    exportCanvasData,
    exportThumbnail,
  }
}
