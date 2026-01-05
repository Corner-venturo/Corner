'use client'

/**
 * ReadOnlyCanvas
 * 唯讀模式的 Fabric.js 畫布，用於預覽
 *
 * 核心特點：
 * 1. 與編輯模式使用完全相同的 Fabric.js 渲染引擎
 * 2. 停用所有互動功能（選擇、拖曳、縮放）
 * 3. 確保預覽和編輯 100% 像素級一致
 */

import React, { useEffect, useRef, useCallback } from 'react'
import { StaticCanvas, Text, Rect, Circle, Image as FabricImage, Gradient } from 'fabric'
import type { CanvasElement, TextElement, ImageElement, ShapeElement } from './types'
import { logger } from '@/lib/utils/logger'

// A5 尺寸 (mm) 轉 px (假設 96 DPI)
const MM_TO_PX = 3.7795275591
const A5_WIDTH_MM = 148
const A5_HEIGHT_MM = 210
const A5_WIDTH_PX = Math.round(A5_WIDTH_MM * MM_TO_PX)
const A5_HEIGHT_PX = Math.round(A5_HEIGHT_MM * MM_TO_PX)

export interface ReadOnlyCanvasProps {
  /** 要渲染的元素列表 */
  elements: CanvasElement[]
  /** 縮放比例 (預設 1) */
  scale?: number
  /** 自訂寬度（覆蓋預設 A5 寬度） */
  width?: number
  /** 自訂高度（覆蓋預設 A5 高度） */
  height?: number
  /** 背景顏色 */
  backgroundColor?: string
  /** 額外的 className */
  className?: string
}

export const ReadOnlyCanvas: React.FC<ReadOnlyCanvasProps> = ({
  elements,
  scale = 1,
  width = A5_WIDTH_PX,
  height = A5_HEIGHT_PX,
  backgroundColor = '#ffffff',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<StaticCanvas | null>(null)

  // 載入元素到畫布
  const loadElements = useCallback(async (canvas: StaticCanvas, elementsToLoad: CanvasElement[]) => {
    // 清除現有元素
    canvas.clear()
    canvas.backgroundColor = backgroundColor

    // 按 zIndex 排序
    const sortedElements = [...elementsToLoad].sort((a, b) => a.zIndex - b.zIndex)

    // 依序加入元素
    for (const el of sortedElements) {
      try {
        if (el.type === 'text') {
          await loadTextElement(canvas, el as TextElement)
        } else if (el.type === 'shape') {
          await loadShapeElement(canvas, el as ShapeElement)
        } else if (el.type === 'image') {
          await loadImageElement(canvas, el as ImageElement)
        }
      } catch (error) {
        logger.error('[ReadOnlyCanvas] Failed to load element:', el.name, error)
      }
    }

    canvas.renderAll()
  }, [backgroundColor])

  // 載入文字元素
  const loadTextElement = async (canvas: StaticCanvas, el: TextElement) => {
    const textAlign = el.style?.textAlign || 'left'
    const elementWidth = el.width || 200

    // 根據對齊方式計算位置和原點
    let originX: 'left' | 'center' | 'right' = 'left'
    let actualX = el.x

    if (textAlign === 'center') {
      originX = 'center'
      actualX = el.x + elementWidth / 2
    } else if (textAlign === 'right') {
      originX = 'right'
      actualX = el.x + elementWidth
    }

    const fabricText = new Text(el.content || '', {
      left: actualX,
      top: el.y,
      originX,
      originY: 'top',
      fontFamily: el.style?.fontFamily || 'Noto Sans TC',
      fontSize: el.style?.fontSize || 16,
      fill: el.style?.color || '#333333',
      fontWeight: el.style?.fontWeight || 'normal',
      fontStyle: el.style?.fontStyle || 'normal',
      lineHeight: el.style?.lineHeight || 1.2,
      charSpacing: (el.style?.letterSpacing || 0) * 10,
      opacity: el.opacity ?? 1,
      angle: el.rotation,
      // 停用互動
      selectable: false,
      evented: false,
    })

    canvas.add(fabricText)
  }

  // 載入形狀元素
  const loadShapeElement = async (canvas: StaticCanvas, el: ShapeElement) => {
    if (el.variant === 'rectangle' || !el.variant) {
      // 處理漸層
      let gradientFill: Gradient<'linear', 'linear'> | null = null

      if (el.gradient) {
        const g = el.gradient
        const angleRad = ((g.angle || 180) - 90) * Math.PI / 180
        const coords = {
          x1: el.width / 2 - Math.cos(angleRad) * el.width / 2,
          y1: el.height / 2 - Math.sin(angleRad) * el.height / 2,
          x2: el.width / 2 + Math.cos(angleRad) * el.width / 2,
          y2: el.height / 2 + Math.sin(angleRad) * el.height / 2,
        }

        gradientFill = new Gradient({
          type: 'linear',
          coords,
          colorStops: g.colorStops.map(stop => ({
            offset: stop.offset,
            color: stop.color,
          })),
        })
      }

      const rect = new Rect({
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.height,
        fill: el.fill || '#e8e5e0',
        stroke: el.stroke === 'transparent' ? '' : (el.stroke || ''),
        strokeWidth: el.strokeWidth ?? 0,
        rx: el.cornerRadius || 0,
        ry: el.cornerRadius || 0,
        opacity: el.opacity ?? 1,
        angle: el.rotation,
        // 停用互動
        selectable: false,
        evented: false,
      })

      if (gradientFill) {
        rect.set('fill', gradientFill)
      }

      canvas.add(rect)
    } else if (el.variant === 'circle') {
      const circle = new Circle({
        left: el.x,
        top: el.y,
        radius: Math.min(el.width, el.height) / 2,
        fill: el.fill || '#c9aa7c',
        stroke: el.stroke === 'transparent' ? '' : (el.stroke || ''),
        strokeWidth: el.strokeWidth ?? 0,
        opacity: el.opacity ?? 1,
        angle: el.rotation,
        // 停用互動
        selectable: false,
        evented: false,
      })

      canvas.add(circle)
    }
  }

  // 載入圖片元素
  const loadImageElement = async (canvas: StaticCanvas, el: ImageElement) => {
    try {
      // 先預載圖片以取得正確尺寸
      const htmlImg = new window.Image()
      htmlImg.crossOrigin = 'anonymous'

      await new Promise<void>((resolve, reject) => {
        htmlImg.onload = () => resolve()
        htmlImg.onerror = () => reject(new Error('Image load failed'))
        htmlImg.src = el.src
      })

      const img = new FabricImage(htmlImg)

      const originalWidth = htmlImg.naturalWidth || htmlImg.width || 1
      const originalHeight = htmlImg.naturalHeight || htmlImg.height || 1
      const targetWidth = el.width
      const targetHeight = el.height
      const objectFit = el.objectFit || 'cover'

      let scaleX: number
      let scaleY: number

      if (objectFit === 'cover') {
        const scale = Math.max(targetWidth / originalWidth, targetHeight / originalHeight)
        scaleX = scale
        scaleY = scale
      } else if (objectFit === 'contain') {
        const scale = Math.min(targetWidth / originalWidth, targetHeight / originalHeight)
        scaleX = scale
        scaleY = scale
      } else {
        scaleX = targetWidth / originalWidth
        scaleY = targetHeight / originalHeight
      }

      // 使用中心點定位
      const centerX = el.x + targetWidth / 2
      const centerY = el.y + targetHeight / 2

      img.set({
        left: centerX,
        top: centerY,
        originX: 'center',
        originY: 'center',
        scaleX,
        scaleY,
        opacity: el.opacity ?? 1,
        angle: el.rotation,
        // 停用互動
        selectable: false,
        evented: false,
      })

      canvas.add(img)
    } catch (error) {
      logger.error('[ReadOnlyCanvas] Failed to load image:', el.src, error)
    }
  }

  // 初始化畫布
  useEffect(() => {
    if (!containerRef.current) return

    // 如果已經有畫布，先清理
    if (canvasRef.current) {
      canvasRef.current.dispose()
      canvasRef.current = null
    }

    const container = containerRef.current
    container.innerHTML = ''

    const canvasEl = document.createElement('canvas')
    canvasEl.id = `readonly-canvas-${Date.now()}`
    container.appendChild(canvasEl)

    // 使用 StaticCanvas - 不需要互動功能的輕量版本
    const canvas = new StaticCanvas(canvasEl, {
      width,
      height,
      backgroundColor,
      renderOnAddRemove: false, // 手動控制渲染以提升效能
    })

    canvasRef.current = canvas

    logger.log('[ReadOnlyCanvas] Canvas initialized', { width, height })

    return () => {
      canvas.dispose()
      canvasRef.current = null
    }
  }, [width, height, backgroundColor])

  // 當元素變更時重新載入
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    loadElements(canvas, elements)
  }, [elements, loadElements])

  // 計算縮放後的尺寸
  const scaledWidth = width * scale
  const scaledHeight = height * scale

  return (
    <div
      className={className}
      style={{
        width: scaledWidth,
        height: scaledHeight,
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
    >
      <div
        ref={containerRef}
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      />
    </div>
  )
}

// 匯出常數供外部使用
export { A5_WIDTH_PX, A5_HEIGHT_PX }
