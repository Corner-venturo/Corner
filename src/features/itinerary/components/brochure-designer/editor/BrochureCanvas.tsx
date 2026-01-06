'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Move,
  MousePointer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BrochureElement, BrochurePage, CANVAS_CONFIG } from './types'

type ToolType = 'select' | 'text' | 'shape' | 'pan'

interface BrochureCanvasProps {
  page: BrochurePage | null
  selectedElementIds: string[]
  zoom: number
  activeTool: ToolType
  onElementSelect: (id: string | null, addToSelection?: boolean) => void
  onElementMove: (id: string, x: number, y: number) => void
  onElementResize: (id: string, width: number, height: number) => void
  onElementDoubleClick: (id: string) => void
  onZoomChange: (zoom: number) => void
  onToolChange: (tool: ToolType) => void
}

const CONFIG = {
  pageWidth: 559,
  pageHeight: 794,
  workspaceWidth: 900,
  workspaceHeight: 1000,
  minZoom: 0.25,
  maxZoom: 2,
}

export function BrochureCanvas({
  page,
  selectedElementIds,
  zoom,
  activeTool,
  onElementSelect,
  onElementMove,
  onElementResize,
  onElementDoubleClick,
  onZoomChange,
  onToolChange,
}: BrochureCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragElementId, setDragElementId] = useState<string | null>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)

  // 計算畫布位置（置中）
  const canvasOffset = {
    x: (CONFIG.workspaceWidth - CONFIG.pageWidth) / 2,
    y: (CONFIG.workspaceHeight - CONFIG.pageHeight) / 2,
  }

  // 縮放控制
  const handleZoomIn = () => {
    onZoomChange(Math.min(zoom + 0.1, CONFIG.maxZoom))
  }

  const handleZoomOut = () => {
    onZoomChange(Math.max(zoom - 0.1, CONFIG.minZoom))
  }

  const handleZoomFit = () => {
    if (!containerRef.current) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const scaleX = (containerRect.width - 100) / CONFIG.workspaceWidth
    const scaleY = (containerRect.height - 100) / CONFIG.workspaceHeight
    onZoomChange(Math.min(scaleX, scaleY, 1))
  }

  // 處理滑鼠事件
  const handleMouseDown = (e: React.MouseEvent, elementId?: string) => {
    if (activeTool === 'pan' || e.button === 1) {
      // 平移模式
      setIsPanning(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      return
    }

    if (elementId) {
      // 選擇元素
      const addToSelection = e.shiftKey || e.metaKey
      onElementSelect(elementId, addToSelection)

      // 開始拖拽
      setIsDragging(true)
      setDragElementId(elementId)
      setDragStart({ x: e.clientX, y: e.clientY })
    } else {
      // 點擊空白處取消選擇
      onElementSelect(null)
    }
  }

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        })
        return
      }

      if (isDragging && dragElementId && page) {
        const element = page.elements.find((el) => el.id === dragElementId)
        if (!element || element.locked) return

        const dx = (e.clientX - dragStart.x) / zoom
        const dy = (e.clientY - dragStart.y) / zoom

        onElementMove(dragElementId, element.x + dx, element.y + dy)
        setDragStart({ x: e.clientX, y: e.clientY })
      }
    },
    [isPanning, isDragging, dragElementId, dragStart, zoom, page, onElementMove]
  )

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragElementId(null)
    setIsPanning(false)
  }

  // 處理滾輪縮放
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        onZoomChange(Math.max(CONFIG.minZoom, Math.min(CONFIG.maxZoom, zoom + delta)))
      }
    },
    [zoom, onZoomChange]
  )

  // 雙擊編輯
  const handleDoubleClick = (elementId: string) => {
    onElementDoubleClick(elementId)
  }

  return (
    <div className="h-full flex flex-col bg-slate-100">
      {/* 工具列 */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-border">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', activeTool === 'select' && 'bg-morandi-gold/20')}
            onClick={() => onToolChange('select')}
            title="選擇工具 (V)"
          >
            <MousePointer size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', activeTool === 'pan' && 'bg-morandi-gold/20')}
            onClick={() => onToolChange('pan')}
            title="平移工具 (H)"
          >
            <Move size={16} />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
            <ZoomOut size={16} />
          </Button>
          <span className="text-sm text-morandi-secondary w-14 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
            <ZoomIn size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomFit} title="適合視窗">
            <Maximize size={16} />
          </Button>
        </div>
      </div>

      {/* 畫布區域 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: activeTool === 'pan' || isPanning ? 'grab' : 'default' }}
      >
        <div
          className="relative"
          style={{
            width: CONFIG.workspaceWidth * zoom,
            height: CONFIG.workspaceHeight * zoom,
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            margin: '20px auto',
          }}
        >
          {/* 工作區背景（畫布外區域） */}
          <div
            className="absolute inset-0 rounded-lg"
            style={{
              background: 'repeating-linear-gradient(45deg, #e5e7eb 0, #e5e7eb 1px, transparent 0, transparent 50%)',
              backgroundSize: '10px 10px',
            }}
            onMouseDown={(e) => handleMouseDown(e)}
          />

          {/* A5 畫布區域 */}
          <div
            className="absolute bg-white shadow-lg"
            style={{
              left: canvasOffset.x * zoom,
              top: canvasOffset.y * zoom,
              width: CONFIG.pageWidth * zoom,
              height: CONFIG.pageHeight * zoom,
            }}
            onMouseDown={(e) => handleMouseDown(e)}
          >
            {/* 畫布內元素 */}
            {page?.elements.map((element) => (
              <ElementRenderer
                key={element.id}
                element={element}
                zoom={zoom}
                isSelected={selectedElementIds.includes(element.id)}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  handleMouseDown(e, element.id)
                }}
                onDoubleClick={() => handleDoubleClick(element.id)}
              />
            ))}

            {/* 邊界參考線 */}
            <div className="absolute inset-0 pointer-events-none border border-dashed border-morandi-gold/30" />
          </div>

          {/* 畫布外暫存區標示 */}
          <div
            className="absolute top-2 left-2 px-2 py-1 bg-slate-500/80 text-white text-xs rounded"
            style={{ transform: `scale(${1 / zoom})`, transformOrigin: 'top left' }}
          >
            暫存區（畫布外）
          </div>
        </div>
      </div>
    </div>
  )
}

// 元素渲染器
interface ElementRendererProps {
  element: BrochureElement
  zoom: number
  isSelected: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onDoubleClick: () => void
}

function ElementRenderer({
  element,
  zoom,
  isSelected,
  onMouseDown,
  onDoubleClick,
}: ElementRendererProps) {
  if (!element.visible) return null

  const style: React.CSSProperties = {
    position: 'absolute',
    left: element.x * zoom,
    top: element.y * zoom,
    width: element.width * zoom,
    height: element.height * zoom,
    transform: `rotate(${element.rotation}deg)`,
    transformOrigin: 'center center',
    cursor: element.locked ? 'not-allowed' : 'move',
    outline: isSelected ? '2px solid #c9aa7c' : undefined,
    outlineOffset: 2,
  }

  // 渲染不同類型的元素
  switch (element.type) {
    case 'text':
      return (
        <div
          style={{
            ...style,
            fontFamily: element.style.fontFamily,
            fontSize: element.style.fontSize * zoom,
            fontWeight: element.style.fontWeight,
            fontStyle: element.style.fontStyle,
            color: element.style.color,
            textAlign: element.style.textAlign,
            lineHeight: element.style.lineHeight,
            letterSpacing: element.style.letterSpacing * zoom,
            overflow: 'hidden',
          }}
          onMouseDown={onMouseDown}
          onDoubleClick={onDoubleClick}
        >
          {element.content}
        </div>
      )

    case 'image':
      return (
        <div
          style={{
            ...style,
            borderRadius: element.borderRadius * zoom,
            overflow: 'hidden',
          }}
          onMouseDown={onMouseDown}
          onDoubleClick={onDoubleClick}
        >
          <img
            src={element.src}
            alt=""
            className="w-full h-full"
            style={{ objectFit: element.objectFit }}
            draggable={false}
          />
        </div>
      )

    case 'shape':
      return (
        <div
          style={{
            ...style,
            backgroundColor: element.fill,
            border: `${element.strokeWidth * zoom}px solid ${element.stroke}`,
            borderRadius: element.variant === 'circle' ? '50%' : element.cornerRadius * zoom,
          }}
          onMouseDown={onMouseDown}
          onDoubleClick={onDoubleClick}
        />
      )

    case 'attraction-card':
      return (
        <div
          style={{
            ...style,
            backgroundColor: '#ffffff',
            border: '1px solid #d4c4b0',
            borderRadius: 8 * zoom,
            padding: 8 * zoom,
          }}
          onMouseDown={onMouseDown}
          onDoubleClick={onDoubleClick}
        >
          <div className="text-sm font-medium" style={{ fontSize: 12 * zoom }}>
            {element.attraction?.name || '景點名稱'}
          </div>
          {element.showDescription && element.attraction?.description && (
            <div
              className="text-morandi-secondary mt-1"
              style={{ fontSize: 10 * zoom }}
            >
              {element.attraction.description.slice(0, 50)}...
            </div>
          )}
        </div>
      )

    default:
      return (
        <div
          style={{
            ...style,
            backgroundColor: '#f0f0f0',
            border: '1px dashed #ccc',
          }}
          onMouseDown={onMouseDown}
          onDoubleClick={onDoubleClick}
        />
      )
  }
}
