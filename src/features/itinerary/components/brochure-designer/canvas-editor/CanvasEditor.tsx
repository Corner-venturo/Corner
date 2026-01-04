'use client'

/**
 * Canvas Editor Component
 * Canva-like 手冊設計器主組件
 */

import React, { useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useCanvasEditor } from './useCanvasEditor'
import { SmartGuides } from './SmartGuides'
import { OverlapIndicator } from './OverlapIndicator'
import type { CanvasElement, OverlapInfo } from './types'

interface CanvasEditorProps {
  className?: string
  onElementSelect?: (elementId: string | null) => void
  onElementChange?: (element: CanvasElement) => void
  onOverlapDetected?: (overlaps: OverlapInfo[]) => void
}

export function CanvasEditor({
  className,
  onElementSelect,
  onElementChange,
  onOverlapDetected,
}: CanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    editorState,
    elements,
    snapGuides,
    overlaps,
    canvasWidth,
    canvasHeight,
    addTextElement,
    addRectangle,
    addCircle,
    addImage,
    deleteSelected,
    bringToFront,
    sendToBack,
    setZoom,
  } = useCanvasEditor({
    containerRef,
    onElementSelect,
    onElementChange,
    onOverlapDetected,
  })

  // 鍵盤快捷鍵
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Delete / Backspace - 刪除選中元素
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      deleteSelected()
    }

    // Ctrl/Cmd + ] - 上移一層
    if ((e.ctrlKey || e.metaKey) && e.key === ']') {
      e.preventDefault()
      bringToFront()
    }

    // Ctrl/Cmd + [ - 下移一層
    if ((e.ctrlKey || e.metaKey) && e.key === '[') {
      e.preventDefault()
      sendToBack()
    }

    // Ctrl/Cmd + + - 放大
    if ((e.ctrlKey || e.metaKey) && e.key === '=') {
      e.preventDefault()
      setZoom(editorState.zoom + 0.1)
    }

    // Ctrl/Cmd + - - 縮小
    if ((e.ctrlKey || e.metaKey) && e.key === '-') {
      e.preventDefault()
      setZoom(editorState.zoom - 0.1)
    }

    // Ctrl/Cmd + 0 - 重置縮放
    if ((e.ctrlKey || e.metaKey) && e.key === '0') {
      e.preventDefault()
      setZoom(1)
    }
  }, [deleteSelected, bringToFront, sendToBack, setZoom, editorState.zoom])

  // 滾輪縮放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom(editorState.zoom + delta)
    }
  }, [setZoom, editorState.zoom])

  return (
    <div
      className={cn(
        'relative bg-slate-100 overflow-hidden',
        className
      )}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
    >
      {/* 背景網格 */}
      {editorState.showGrid && (
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
      )}

      {/* 畫布容器 - 置中顯示 */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: `scale(${editorState.zoom})`,
          transformOrigin: 'center center',
        }}
      >
        {/* 畫布陰影 */}
        <div
          className="relative shadow-lg"
          style={{
            width: canvasWidth,
            height: canvasHeight,
          }}
        >
          {/* Fabric.js 畫布容器 */}
          <div
            ref={containerRef}
            className="absolute inset-0"
            style={{
              width: canvasWidth,
              height: canvasHeight,
            }}
          />

          {/* 智慧參考線覆蓋層 */}
          {editorState.showGuides && snapGuides.length > 0 && (
            <SmartGuides
              guides={snapGuides}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
            />
          )}

          {/* 重疊指示器 */}
          {editorState.showOverlapWarning && overlaps.length > 0 && (
            <OverlapIndicator
              overlaps={overlaps}
              elements={elements}
            />
          )}
        </div>
      </div>

      {/* 縮放指示器 */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm border border-border">
        <span className="text-xs font-mono text-morandi-secondary">
          {Math.round(editorState.zoom * 100)}%
        </span>
      </div>

      {/* 選中元素數量 */}
      {editorState.selectedIds.length > 0 && (
        <div className="absolute top-4 left-4 bg-morandi-gold/90 text-white rounded-lg px-3 py-1.5 shadow-sm">
          <span className="text-xs font-medium">
            已選取 {editorState.selectedIds.length} 個元素
          </span>
        </div>
      )}
    </div>
  )
}

// 匯出元素添加函數的類型
export type { CanvasEditorProps }
