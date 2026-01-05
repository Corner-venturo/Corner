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

import React, { useEffect, useRef } from 'react'
import { StaticCanvas } from 'fabric'
import type { CanvasElement } from './types'
import { renderElements } from './core/renderer'
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

    // 清除現有元素後使用新的渲染引擎
    canvas.clear()
    canvas.backgroundColor = backgroundColor
    renderElements(canvas, elements, {
      isEditable: false,
    })
  }, [elements, backgroundColor])

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
