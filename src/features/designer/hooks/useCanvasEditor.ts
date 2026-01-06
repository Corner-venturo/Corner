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
}

export function useCanvasEditor({
  page,
  onElementChange,
  onSelect,
  onElementAdd,
  onElementDelete,
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

    const fabricCanvas = new Canvas(canvasRef.current, {
      width: page.width,
      height: page.height,
      backgroundColor: page.backgroundColor,
      renderOnAddRemove: false,
      preserveObjectStacking: true,
    })

    fabricCanvasRef.current = fabricCanvas
    setIsCanvasReady(true)

    // 物件修改事件
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    fabricCanvas.on('object:modified', handleObjectModified)
    fabricCanvas.on('selection:created', handleSelection)
    fabricCanvas.on('selection:updated', handleSelection)
    fabricCanvas.on('selection:cleared', handleSelectionCleared)

    return () => {
      fabricCanvas.dispose()
      fabricCanvasRef.current = null
      setIsCanvasReady(false)
    }
  }, []) // 只在初始化時執行一次

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
    const newElement: ShapeElement = {
      id: `rect-${Date.now()}`,
      type: 'shape',
      name: '矩形',
      x: 0,
      y: 0,
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
      align: { horizontal: 'center', vertical: 'center' },
    }
    onElementAdd(newElement)
  }, [page, onElementAdd])

  // 新增圓形
  const addCircle = useCallback(() => {
    if (!page) return
    const newElement: ShapeElement = {
      id: `circle-${Date.now()}`,
      type: 'shape',
      name: '圓形',
      x: 0,
      y: 0,
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
      align: { horizontal: 'center', vertical: 'center' },
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
