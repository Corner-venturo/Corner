/**
 * V2 編輯器 Hook
 *
 * 管理 Fabric.js Canvas 的互動邏輯
 */
'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Canvas } from 'fabric'
import { renderPageOnCanvas } from '../components/core/renderer'
import type { CanvasPage, CanvasElement, FabricObjectWithData, ShapeElement, TextElement, ImageElement } from '../components/types'

export interface UseCanvasEditorOptions {
  page: CanvasPage | null
  onElementChange: (elementId: string, updates: Partial<CanvasElement>) => void
  onSelect: (elementId: string | null) => void
  onElementAdd: (element: CanvasElement) => void
  onElementDelete: (elementId: string) => void
  onPlaceholderClick?: (elementId: string) => void // 點擊占位元素時觸發
}

export function useCanvasEditor({
  page,
  onElementChange,
  onSelect,
  onElementAdd,
  onElementDelete,
  onPlaceholderClick,
}: UseCanvasEditorOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<Canvas | null>(null)
  const [zoom, setZoomState] = useState(1)
  const [isCanvasReady, setIsCanvasReady] = useState(false)

  // 縮放控制
  const setZoom = useCallback((newZoom: number) => {
    const fabricCanvas = fabricCanvasRef.current
    if (!fabricCanvas) return
    const clampedZoom = Math.max(0.25, Math.min(newZoom, 3))
    fabricCanvas.setZoom(clampedZoom)
    setZoomState(clampedZoom)
  }, [])

  // 初始化 Canvas
  useEffect(() => {
    if (!canvasRef.current || !page) return

    // 如果已經有 canvas，先清除
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose()
    }

    const fabricCanvas = new Canvas(canvasRef.current, {
      width: page.width,
      height: page.height,
      backgroundColor: page.backgroundColor,
      renderOnAddRemove: true,
      preserveObjectStacking: true,
      selection: true,
    })

    fabricCanvasRef.current = fabricCanvas
    setIsCanvasReady(true)

    // 物件修改事件
     
    const handleObjectModified = (e: any) => {
      const target = e.target as FabricObjectWithData | undefined
      if (!target || !target.data) return

      const { elementId } = target.data
      onElementChange(elementId, {
        x: target.left || 0,
        y: target.top || 0,
        width: (target.width || 0) * (target.scaleX || 1),
        height: (target.height || 0) * (target.scaleY || 1),
        rotation: target.angle || 0,
      })
    }

    // 選取事件
     
    const handleSelection = (e: any) => {
      const selected = e.selected as FabricObjectWithData[] | undefined
      if (selected && selected.length === 1 && selected[0].data) {
        onSelect(selected[0].data.elementId)
      } else {
        onSelect(null)
      }
    }

    const handleSelectionCleared = () => {
      onSelect(null)
    }

    // 雙擊事件（用於觸發占位元素的上傳功能）
     
    const handleDoubleClick = (e: any) => {
      const target = e.target as FabricObjectWithData | undefined
      if (!target || !target.data) return

      const { elementId } = target.data
      // 檢查是否為占位元素（以 placeholder 或 hint 結尾）
      if (elementId.includes('placeholder') || elementId.includes('hint')) {
        onPlaceholderClick?.(elementId)
      }
    }

    fabricCanvas.on('object:modified', handleObjectModified)
    fabricCanvas.on('selection:created', handleSelection)
    fabricCanvas.on('selection:updated', handleSelection)
    fabricCanvas.on('selection:cleared', handleSelectionCleared)
    fabricCanvas.on('mouse:dblclick', handleDoubleClick)

    return () => {
      fabricCanvas.dispose()
      fabricCanvasRef.current = null
      setIsCanvasReady(false)
    }
  }, [page?.width, page?.height, page?.backgroundColor, onElementChange, onSelect, onPlaceholderClick])

  // 當 page 變更時重新渲染
  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current
    if (!fabricCanvas || !page) return

    renderPageOnCanvas(fabricCanvas, page, {
      isEditable: true,
      canvasWidth: page.width,
      canvasHeight: page.height,
    })
  }, [page])

  // 新增文字元素
  const addTextElement = useCallback(() => {
    if (!page) return
    const newElement: TextElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      name: '新文字',
      x: page.width / 2 - 50,
      y: page.height / 2 - 20,
      width: 150,
      height: 40,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      zIndex: 0,
      content: '雙擊編輯文字',
      style: {
        fontFamily: 'Noto Sans TC',
        fontSize: 18,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'center',
        lineHeight: 1.2,
        letterSpacing: 0,
        color: '#333333',
      },
    }
    onElementAdd(newElement)
  }, [page, onElementAdd])

  // 新增矩形
  const addRectangle = useCallback(() => {
    if (!page) return
    // 初始位置置中
    const x = (page.width - 150) / 2
    const y = (page.height - 100) / 2
    const newElement: ShapeElement = {
      id: `rect-${Date.now()}`,
      type: 'shape',
      name: '矩形',
      x,
      y,
      width: 150,
      height: 100,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      zIndex: 0,
      variant: 'rectangle',
      fill: '#e8e5e0',
      stroke: '#d4c4b0',
      strokeWidth: 1,
      cornerRadius: 8,
    }
    onElementAdd(newElement)
  }, [page, onElementAdd])

  // 新增圓形
  const addCircle = useCallback(() => {
    if (!page) return
    // 初始位置置中
    const x = (page.width - 100) / 2
    const y = (page.height - 100) / 2
    const newElement: ShapeElement = {
      id: `circle-${Date.now()}`,
      type: 'shape',
      name: '圓形',
      x,
      y,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      zIndex: 0,
      variant: 'circle',
      fill: '#c9aa7c',
      stroke: '#b8996b',
      strokeWidth: 1,
    }
    onElementAdd(newElement)
  }, [page, onElementAdd])

  // 新增圖片
  const addImage = useCallback((src: string) => {
    if (!page) return
    const newElement: ImageElement = {
      id: `image-${Date.now()}`,
      type: 'image',
      name: '圖片',
      x: 100,
      y: 100,
      width: 300,
      height: 200,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      zIndex: 0,
      src,
      objectFit: 'cover',
    }
    onElementAdd(newElement)
  }, [page, onElementAdd])

  // 刪除選取的元素
  const deleteSelectedElements = useCallback(() => {
    const fabricCanvas = fabricCanvasRef.current
    if (!fabricCanvas) return

    const activeObjects = fabricCanvas.getActiveObjects()
    activeObjects.forEach((obj) => {
      const elWithData = obj as FabricObjectWithData
      if (elWithData.data?.elementId) {
        onElementDelete(elWithData.data.elementId)
      }
    })
    fabricCanvas.discardActiveObject()
  }, [onElementDelete])

  // 鍵盤事件監聽（Delete / Backspace 刪除選取元素）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果焦點在輸入框內，不處理
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Delete 或 Backspace 鍵刪除選取元素
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteSelectedElements()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [deleteSelectedElements])

  return {
    canvasRef,
    zoom,
    setZoom,
    isCanvasReady,
    addTextElement,
    addRectangle,
    addCircle,
    addImage,
    deleteSelectedElements,
  }
}
