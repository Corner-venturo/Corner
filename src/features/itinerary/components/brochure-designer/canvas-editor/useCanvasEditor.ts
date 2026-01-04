'use client'

/**
 * Canvas Editor Hook
 * 管理 Fabric.js 畫布的核心 Hook
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, Object as FabricObject, Text, Rect, Circle, Image as FabricImage, Line, Group } from 'fabric'
import type {
  CanvasElement,
  EditorState,
  CanvasPage,
  FabricObjectWithData,
  GuideLine,
  SnapGuide,
  OverlapInfo,
} from './types'
import { logger } from '@/lib/utils/logger'

// 預設編輯器狀態
const DEFAULT_EDITOR_STATE: EditorState = {
  selectedIds: [],
  hoveredId: null,
  isMultiSelect: false,
  isPanning: false,
  isZooming: false,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  showGrid: true,
  showGuides: true,
  showOverlapWarning: true,
  snapToGuide: true,
  snapThreshold: 5,
}

// A5 尺寸 (mm) 轉 px (假設 96 DPI)
const MM_TO_PX = 3.7795275591
const A5_WIDTH_MM = 148
const A5_HEIGHT_MM = 210
const A5_WIDTH_PX = Math.round(A5_WIDTH_MM * MM_TO_PX)
const A5_HEIGHT_PX = Math.round(A5_HEIGHT_MM * MM_TO_PX)

export interface UseCanvasEditorOptions {
  containerRef: React.RefObject<HTMLDivElement | null>
  initialPage?: CanvasPage
  onElementSelect?: (elementId: string | null) => void
  onElementChange?: (element: CanvasElement) => void
  onOverlapDetected?: (overlaps: OverlapInfo[]) => void
}

export function useCanvasEditor(options: UseCanvasEditorOptions) {
  const { containerRef, initialPage, onElementSelect, onElementChange, onOverlapDetected } = options

  const canvasRef = useRef<Canvas | null>(null)
  const [editorState, setEditorState] = useState<EditorState>(DEFAULT_EDITOR_STATE)
  const [elements, setElements] = useState<CanvasElement[]>(initialPage?.elements || [])
  const [guides, setGuides] = useState<GuideLine[]>([])
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([])
  const [overlaps, setOverlaps] = useState<OverlapInfo[]>([])

  // 追蹤容器是否已掛載
  const [isContainerMounted, setIsContainerMounted] = useState(false)

  // 監聽容器掛載狀態
  useEffect(() => {
    const checkContainer = () => {
      if (containerRef.current && !isContainerMounted) {
        setIsContainerMounted(true)
      } else if (!containerRef.current && isContainerMounted) {
        setIsContainerMounted(false)
      }
    }

    // 立即檢查一次
    checkContainer()

    // 使用 MutationObserver 或定時器來監聽變化
    const interval = setInterval(checkContainer, 100)
    return () => clearInterval(interval)
  }, [containerRef, isContainerMounted])

  // 設定畫布事件（移到前面避免 hoisting 問題）
  const setupCanvasEvents = useCallback((canvas: Canvas) => {
    // 選取事件
    canvas.on('selection:created', (e) => {
      const selected = e.selected || []
      const ids = selected
        .map((obj) => (obj as FabricObjectWithData).data?.elementId)
        .filter(Boolean) as string[]
      setEditorState((prev) => ({ ...prev, selectedIds: ids }))
      if (ids.length === 1 && onElementSelect) {
        onElementSelect(ids[0])
      }
    })

    canvas.on('selection:updated', (e) => {
      const selected = e.selected || []
      const ids = selected
        .map((obj) => (obj as FabricObjectWithData).data?.elementId)
        .filter(Boolean) as string[]
      setEditorState((prev) => ({ ...prev, selectedIds: ids }))
      if (ids.length === 1 && onElementSelect) {
        onElementSelect(ids[0])
      }
    })

    canvas.on('selection:cleared', () => {
      setEditorState((prev) => ({ ...prev, selectedIds: [] }))
      if (onElementSelect) {
        onElementSelect(null)
      }
    })

    // 移動事件 - 智慧參考線
    canvas.on('object:moving', (e) => {
      const obj = e.target as FabricObjectWithData
      if (!obj || !obj.data?.elementId) return

      // 計算智慧參考線
      const newSnapGuides = calculateSnapGuides(canvas, obj)
      setSnapGuides(newSnapGuides)

      // 如果啟用吸附，調整位置
      if (newSnapGuides.length > 0) {
        applySnap(obj, newSnapGuides)
      }
    })

    // object:modified 在 Fabric.js v6 中代替了 moved/scaled/rotated
    canvas.on('object:modified', (e) => {
      setSnapGuides([])
      const obj = e.target as FabricObjectWithData
      if (obj?.data?.elementId) {
        syncElementFromFabric(obj)
        checkOverlaps(canvas)
      }
    })

    // 縮放事件
    canvas.on('object:scaling', (e) => {
      const obj = e.target as FabricObjectWithData
      if (!obj || !obj.data?.elementId) return
      const newSnapGuides = calculateSnapGuides(canvas, obj)
      setSnapGuides(newSnapGuides)
    })

    // 滑鼠懸停
    canvas.on('mouse:over', (e) => {
      const obj = e.target as FabricObjectWithData
      if (obj?.data?.elementId) {
        setEditorState((prev) => ({ ...prev, hoveredId: obj.data!.elementId }))
      }
    })

    canvas.on('mouse:out', () => {
      setEditorState((prev) => ({ ...prev, hoveredId: null }))
    })
  }, [onElementSelect])

  // 初始化畫布
  useEffect(() => {
    if (!containerRef.current) return

    // 如果已經有畫布，先清理
    if (canvasRef.current) {
      canvasRef.current.dispose()
      canvasRef.current = null
    }

    const container = containerRef.current

    // 清空容器
    container.innerHTML = ''

    const canvasEl = document.createElement('canvas')
    canvasEl.id = 'brochure-canvas'
    container.appendChild(canvasEl)

    const canvas = new Canvas(canvasEl, {
      width: A5_WIDTH_PX,
      height: A5_HEIGHT_PX,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: true,
    })

    canvasRef.current = canvas

    // 設定事件監聽
    setupCanvasEvents(canvas)

    logger.log('[CanvasEditor] Canvas initialized', { width: A5_WIDTH_PX, height: A5_HEIGHT_PX })

    return () => {
      canvas.dispose()
      canvasRef.current = null
    }
  }, [isContainerMounted, setupCanvasEvents])

  // 計算智慧參考線
  const calculateSnapGuides = useCallback((canvas: Canvas, movingObj: FabricObject): SnapGuide[] => {
    const guides: SnapGuide[] = []
    const threshold = editorState.snapThreshold

    const movingBounds = movingObj.getBoundingRect()
    const movingCenter = {
      x: movingBounds.left + movingBounds.width / 2,
      y: movingBounds.top + movingBounds.height / 2,
    }

    // 畫布邊界參考線
    const canvasGuides = [
      { type: 'edge' as const, direction: 'vertical' as const, position: 0 },
      { type: 'edge' as const, direction: 'vertical' as const, position: canvas.width! / 2 },
      { type: 'edge' as const, direction: 'vertical' as const, position: canvas.width! },
      { type: 'edge' as const, direction: 'horizontal' as const, position: 0 },
      { type: 'edge' as const, direction: 'horizontal' as const, position: canvas.height! / 2 },
      { type: 'edge' as const, direction: 'horizontal' as const, position: canvas.height! },
    ]

    // 檢查畫布參考線
    canvasGuides.forEach((guide) => {
      if (guide.direction === 'vertical') {
        // 左邊緣
        if (Math.abs(movingBounds.left - guide.position) < threshold) {
          guides.push({ ...guide, sourceId: (movingObj as FabricObjectWithData).data?.elementId || '' })
        }
        // 中心
        if (Math.abs(movingCenter.x - guide.position) < threshold) {
          guides.push({ ...guide, type: 'center', sourceId: (movingObj as FabricObjectWithData).data?.elementId || '' })
        }
        // 右邊緣
        if (Math.abs(movingBounds.left + movingBounds.width - guide.position) < threshold) {
          guides.push({ ...guide, sourceId: (movingObj as FabricObjectWithData).data?.elementId || '' })
        }
      } else {
        // 上邊緣
        if (Math.abs(movingBounds.top - guide.position) < threshold) {
          guides.push({ ...guide, sourceId: (movingObj as FabricObjectWithData).data?.elementId || '' })
        }
        // 中心
        if (Math.abs(movingCenter.y - guide.position) < threshold) {
          guides.push({ ...guide, type: 'center', sourceId: (movingObj as FabricObjectWithData).data?.elementId || '' })
        }
        // 下邊緣
        if (Math.abs(movingBounds.top + movingBounds.height - guide.position) < threshold) {
          guides.push({ ...guide, sourceId: (movingObj as FabricObjectWithData).data?.elementId || '' })
        }
      }
    })

    // 與其他元素對齊
    canvas.getObjects().forEach((obj) => {
      if (obj === movingObj) return
      const objWithData = obj as FabricObjectWithData
      if (!objWithData.data?.elementId) return

      const bounds = obj.getBoundingRect()
      const center = {
        x: bounds.left + bounds.width / 2,
        y: bounds.top + bounds.height / 2,
      }

      // 垂直對齊
      const verticalAlignments = [
        { pos: bounds.left, type: 'edge' as const },
        { pos: center.x, type: 'center' as const },
        { pos: bounds.left + bounds.width, type: 'edge' as const },
      ]

      verticalAlignments.forEach(({ pos, type }) => {
        if (Math.abs(movingBounds.left - pos) < threshold ||
            Math.abs(movingCenter.x - pos) < threshold ||
            Math.abs(movingBounds.left + movingBounds.width - pos) < threshold) {
          guides.push({
            type,
            direction: 'vertical',
            position: pos,
            sourceId: (movingObj as FabricObjectWithData).data?.elementId || '',
            targetId: objWithData.data?.elementId,
          })
        }
      })

      // 水平對齊
      const horizontalAlignments = [
        { pos: bounds.top, type: 'edge' as const },
        { pos: center.y, type: 'center' as const },
        { pos: bounds.top + bounds.height, type: 'edge' as const },
      ]

      horizontalAlignments.forEach(({ pos, type }) => {
        if (Math.abs(movingBounds.top - pos) < threshold ||
            Math.abs(movingCenter.y - pos) < threshold ||
            Math.abs(movingBounds.top + movingBounds.height - pos) < threshold) {
          guides.push({
            type,
            direction: 'horizontal',
            position: pos,
            sourceId: (movingObj as FabricObjectWithData).data?.elementId || '',
            targetId: objWithData.data?.elementId,
          })
        }
      })
    })

    return guides
  }, [editorState.snapThreshold])

  // 套用吸附
  const applySnap = useCallback((obj: FabricObject, guides: SnapGuide[]) => {
    if (!editorState.snapToGuide) return

    const bounds = obj.getBoundingRect()
    let newLeft = obj.left || 0
    let newTop = obj.top || 0

    guides.forEach((guide) => {
      if (guide.direction === 'vertical') {
        const diff = guide.position - bounds.left
        if (Math.abs(diff) < editorState.snapThreshold) {
          newLeft = (obj.left || 0) + diff
        }
      } else {
        const diff = guide.position - bounds.top
        if (Math.abs(diff) < editorState.snapThreshold) {
          newTop = (obj.top || 0) + diff
        }
      }
    })

    obj.set({ left: newLeft, top: newTop })
    obj.setCoords()
  }, [editorState.snapToGuide, editorState.snapThreshold])

  // 檢測元素重疊
  const checkOverlaps = useCallback((canvas: Canvas) => {
    if (!editorState.showOverlapWarning) return

    const newOverlaps: OverlapInfo[] = []
    const objects = canvas.getObjects()

    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const obj1 = objects[i] as FabricObjectWithData
        const obj2 = objects[j] as FabricObjectWithData

        if (!obj1.data?.elementId || !obj2.data?.elementId) continue

        const bounds1 = obj1.getBoundingRect()
        const bounds2 = obj2.getBoundingRect()

        // 計算重疊區域
        const overlapLeft = Math.max(bounds1.left, bounds2.left)
        const overlapTop = Math.max(bounds1.top, bounds2.top)
        const overlapRight = Math.min(bounds1.left + bounds1.width, bounds2.left + bounds2.width)
        const overlapBottom = Math.min(bounds1.top + bounds1.height, bounds2.top + bounds2.height)

        if (overlapLeft < overlapRight && overlapTop < overlapBottom) {
          const overlapArea = (overlapRight - overlapLeft) * (overlapBottom - overlapTop)
          const smallerArea = Math.min(bounds1.width * bounds1.height, bounds2.width * bounds2.height)
          const overlapPercent = (overlapArea / smallerArea) * 100

          if (overlapPercent > 10) { // 只報告重疊超過 10% 的情況
            newOverlaps.push({
              element1Id: obj1.data.elementId,
              element2Id: obj2.data.elementId,
              overlapArea,
              overlapPercent,
            })
          }
        }
      }
    }

    setOverlaps(newOverlaps)
    if (onOverlapDetected && newOverlaps.length > 0) {
      onOverlapDetected(newOverlaps)
    }
  }, [editorState.showOverlapWarning, onOverlapDetected])

  // 從 Fabric 物件同步回元素狀態
  const syncElementFromFabric = useCallback((obj: FabricObjectWithData) => {
    if (!obj.data?.elementId) return

    const bounds = obj.getBoundingRect()

    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== obj.data?.elementId) return el
        return {
          ...el,
          x: bounds.left,
          y: bounds.top,
          width: bounds.width,
          height: bounds.height,
          rotation: obj.angle || 0,
        }
      })
    )

    // 觸發外部變更回調
    if (onElementChange) {
      const element = elements.find((el) => el.id === obj.data?.elementId)
      if (element) {
        onElementChange({
          ...element,
          x: bounds.left,
          y: bounds.top,
          width: bounds.width,
          height: bounds.height,
          rotation: obj.angle || 0,
        })
      }
    }
  }, [elements, onElementChange])

  // 添加文字元素
  const addTextElement = useCallback((text: string, x: number, y: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const id = `text-${Date.now()}`
    const fabricText = new Text(text, {
      left: x,
      top: y,
      fontFamily: 'Noto Sans TC',
      fontSize: 16,
      fill: '#333333',
    }) as FabricObjectWithData

    fabricText.data = {
      elementId: id,
      elementType: 'text',
    }

    canvas.add(fabricText)
    canvas.setActiveObject(fabricText)
    canvas.renderAll()

    const newElement = {
      id,
      type: 'text' as const,
      name: '文字',
      x,
      y,
      width: fabricText.width || 100,
      height: fabricText.height || 20,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      zIndex: elements.length,
      content: text,
      style: {
        fontFamily: 'Noto Sans TC',
        fontSize: 16,
        fontWeight: 'normal' as const,
        fontStyle: 'normal' as const,
        textAlign: 'left' as const,
        lineHeight: 1.2,
        letterSpacing: 0,
        color: '#333333',
        textDecoration: 'none' as const,
      },
    }

    setElements((prev) => [...prev, newElement])
    return newElement
  }, [elements.length])

  // 添加矩形
  const addRectangle = useCallback((x: number, y: number, width: number, height: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const id = `shape-${Date.now()}`
    const rect = new Rect({
      left: x,
      top: y,
      width,
      height,
      fill: '#e8e5e0',
      stroke: '#d4c4b0',
      strokeWidth: 1,
      rx: 8,
      ry: 8,
    }) as FabricObjectWithData

    rect.data = {
      elementId: id,
      elementType: 'shape',
    }

    canvas.add(rect)
    canvas.setActiveObject(rect)
    canvas.renderAll()

    const newElement = {
      id,
      type: 'shape' as const,
      name: '矩形',
      x,
      y,
      width,
      height,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      zIndex: elements.length,
      variant: 'rectangle' as const,
      fill: '#e8e5e0',
      stroke: '#d4c4b0',
      strokeWidth: 1,
      cornerRadius: 8,
    }

    setElements((prev) => [...prev, newElement])
    return newElement
  }, [elements.length])

  // 添加圓形
  const addCircle = useCallback((x: number, y: number, radius: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const id = `shape-${Date.now()}`
    const circle = new Circle({
      left: x,
      top: y,
      radius,
      fill: '#c9aa7c',
      stroke: '#b8996b',
      strokeWidth: 1,
    }) as FabricObjectWithData

    circle.data = {
      elementId: id,
      elementType: 'shape',
    }

    canvas.add(circle)
    canvas.setActiveObject(circle)
    canvas.renderAll()

    const newElement = {
      id,
      type: 'shape' as const,
      name: '圓形',
      x,
      y,
      width: radius * 2,
      height: radius * 2,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      zIndex: elements.length,
      variant: 'circle' as const,
      fill: '#c9aa7c',
      stroke: '#b8996b',
      strokeWidth: 1,
      cornerRadius: 0,
    }

    setElements((prev) => [...prev, newElement])
    return newElement
  }, [elements.length])

  // 添加圖片
  const addImage = useCallback(async (src: string, x: number, y: number, maxWidth?: number, maxHeight?: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const id = `image-${Date.now()}`

    try {
      const img = await FabricImage.fromURL(src, { crossOrigin: 'anonymous' })
      const imgWithData = img as FabricObjectWithData

      // 計算縮放以符合最大尺寸
      let scale = 1
      if (maxWidth && img.width && img.width > maxWidth) {
        scale = maxWidth / img.width
      }
      if (maxHeight && img.height && img.height * scale > maxHeight) {
        scale = maxHeight / img.height
      }

      img.set({
        left: x,
        top: y,
        scaleX: scale,
        scaleY: scale,
      })

      imgWithData.data = {
        elementId: id,
        elementType: 'image',
      }

      canvas.add(img)
      canvas.setActiveObject(img)
      canvas.renderAll()

      const newElement = {
        id,
        type: 'image' as const,
        name: '圖片',
        x,
        y,
        width: (img.width || 100) * scale,
        height: (img.height || 100) * scale,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: elements.length,
        src,
        cropX: 0,
        cropY: 0,
        cropWidth: img.width || 100,
        cropHeight: img.height || 100,
        filters: {
          brightness: 0,
          contrast: 0,
          saturation: 0,
          blur: 0,
        },
        objectFit: 'cover' as const,
      }

      setElements((prev) => [...prev, newElement])
      return newElement
    } catch (error) {
      logger.error('[CanvasEditor] Failed to load image:', error)
      return null
    }
  }, [elements.length])

  // 刪除選中元素
  const deleteSelected = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const selected = canvas.getActiveObjects()
    selected.forEach((obj) => {
      canvas.remove(obj)
      const objWithData = obj as FabricObjectWithData
      if (objWithData.data?.elementId) {
        setElements((prev) => prev.filter((el) => el.id !== objWithData.data?.elementId))
      }
    })

    canvas.discardActiveObject()
    canvas.renderAll()
    setEditorState((prev) => ({ ...prev, selectedIds: [] }))
  }, [])

  // 圖層操作：移到最上層
  const bringToFront = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const selected = canvas.getActiveObject()
    if (selected) {
      canvas.bringObjectToFront(selected)
      canvas.renderAll()
      updateZIndexes(canvas)
    }
  }, [])

  // 圖層操作：移到最下層
  const sendToBack = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const selected = canvas.getActiveObject()
    if (selected) {
      canvas.sendObjectToBack(selected)
      canvas.renderAll()
      updateZIndexes(canvas)
    }
  }, [])

  // 更新所有元素的 zIndex
  const updateZIndexes = useCallback((canvas: Canvas) => {
    const objects = canvas.getObjects()
    setElements((prev) =>
      prev.map((el) => {
        const obj = objects.find(
          (o) => (o as FabricObjectWithData).data?.elementId === el.id
        )
        if (obj) {
          return { ...el, zIndex: objects.indexOf(obj) }
        }
        return el
      })
    )
  }, [])

  // 縮放
  const setZoom = useCallback((zoom: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const clampedZoom = Math.min(Math.max(zoom, 0.25), 4)
    canvas.setZoom(clampedZoom)
    canvas.renderAll()
    setEditorState((prev) => ({ ...prev, zoom: clampedZoom }))
  }, [])

  // 清除畫布
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.clear()
    canvas.backgroundColor = '#ffffff'
    canvas.renderAll()
    setElements([])
    setEditorState((prev) => ({ ...prev, selectedIds: [] }))
  }, [])

  // 切換元素可見性
  const toggleElementVisibility = useCallback((id: string) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const obj = canvas.getObjects().find(
      (o) => (o as FabricObjectWithData).data?.elementId === id
    )
    if (obj) {
      obj.visible = !obj.visible
      canvas.renderAll()
    }

    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, visible: !el.visible } : el))
    )
  }, [])

  // 切換元素鎖定狀態
  const toggleElementLock = useCallback((id: string) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const obj = canvas.getObjects().find(
      (o) => (o as FabricObjectWithData).data?.elementId === id
    )
    if (obj) {
      obj.selectable = !obj.selectable
      obj.evented = !obj.evented
      canvas.renderAll()
    }

    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, locked: !el.locked } : el))
    )
  }, [])

  // 載入元素到畫布
  const loadElements = useCallback(async (elementsToLoad: CanvasElement[]) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // 清除現有元素
    canvas.clear()
    canvas.backgroundColor = '#ffffff'

    // 依序加入元素
    for (const el of elementsToLoad) {
      try {
        if (el.type === 'text') {
          const textEl = el as import('./types').TextElement
          const fabricText = new Text(textEl.content || '', {
            left: textEl.x,
            top: textEl.y,
            fontFamily: textEl.style?.fontFamily || 'Noto Sans TC',
            fontSize: textEl.style?.fontSize || 16,
            fill: textEl.style?.color || '#333333',
            fontWeight: textEl.style?.fontWeight || 'normal',
            fontStyle: textEl.style?.fontStyle || 'normal',
            opacity: textEl.opacity,
            angle: textEl.rotation,
          }) as FabricObjectWithData

          fabricText.data = {
            elementId: el.id,
            elementType: 'text',
          }
          canvas.add(fabricText)
        } else if (el.type === 'shape') {
          const shapeEl = el as import('./types').ShapeElement
          if (shapeEl.variant === 'rectangle') {
            const rect = new Rect({
              left: shapeEl.x,
              top: shapeEl.y,
              width: shapeEl.width,
              height: shapeEl.height,
              fill: shapeEl.fill || '#e8e5e0',
              stroke: shapeEl.stroke || '#d4c4b0',
              strokeWidth: shapeEl.strokeWidth || 1,
              rx: shapeEl.cornerRadius || 0,
              ry: shapeEl.cornerRadius || 0,
              opacity: shapeEl.opacity,
              angle: shapeEl.rotation,
            }) as FabricObjectWithData

            rect.data = {
              elementId: el.id,
              elementType: 'shape',
            }
            canvas.add(rect)
          } else if (shapeEl.variant === 'circle') {
            const circle = new Circle({
              left: shapeEl.x,
              top: shapeEl.y,
              radius: Math.min(shapeEl.width, shapeEl.height) / 2,
              fill: shapeEl.fill || '#c9aa7c',
              stroke: shapeEl.stroke || '#b8996b',
              strokeWidth: shapeEl.strokeWidth || 1,
              opacity: shapeEl.opacity,
              angle: shapeEl.rotation,
            }) as FabricObjectWithData

            circle.data = {
              elementId: el.id,
              elementType: 'shape',
            }
            canvas.add(circle)
          }
        } else if (el.type === 'image') {
          const imageEl = el as import('./types').ImageElement
          try {
            // 先預載圖片以取得正確尺寸
            const htmlImg = new window.Image()
            htmlImg.crossOrigin = 'anonymous'

            await new Promise<void>((resolve, reject) => {
              htmlImg.onload = () => resolve()
              htmlImg.onerror = () => reject(new Error('Image load failed'))
              htmlImg.src = imageEl.src
            })

            const img = new FabricImage(htmlImg)
            const imgWithData = img as FabricObjectWithData

            // 計算縮放比例，確保圖片填滿指定尺寸
            const originalWidth = htmlImg.naturalWidth || htmlImg.width || 1
            const originalHeight = htmlImg.naturalHeight || htmlImg.height || 1
            const scaleX = imageEl.width / originalWidth
            const scaleY = imageEl.height / originalHeight

            img.set({
              left: imageEl.x,
              top: imageEl.y,
              scaleX,
              scaleY,
              opacity: imageEl.opacity,
              angle: imageEl.rotation,
            })

            imgWithData.data = {
              elementId: el.id,
              elementType: 'image',
            }
            canvas.add(img)
            logger.log('[CanvasEditor] Image loaded:', {
              id: el.id,
              originalSize: { w: originalWidth, h: originalHeight },
              targetSize: { w: imageEl.width, h: imageEl.height },
              scale: { x: scaleX, y: scaleY },
            })
          } catch (error) {
            logger.error('[CanvasEditor] Failed to load image:', imageEl.src, error)
          }
        }
      } catch (error) {
        logger.error('[CanvasEditor] Failed to load element:', el, error)
      }
    }

    canvas.renderAll()
    setElements(elementsToLoad)
    setEditorState((prev) => ({ ...prev, selectedIds: [] }))
  }, [])

  return {
    // Refs
    canvasRef,

    // State
    editorState,
    elements,
    guides,
    snapGuides,
    overlaps,
    isCanvasReady: isContainerMounted && canvasRef.current !== null,

    // Actions
    setEditorState,
    addTextElement,
    addRectangle,
    addCircle,
    addImage,
    deleteSelected,
    bringToFront,
    sendToBack,
    setZoom,
    clearCanvas,
    loadElements,
    toggleElementVisibility,
    toggleElementLock,

    // Constants
    canvasWidth: A5_WIDTH_PX,
    canvasHeight: A5_HEIGHT_PX,
  }
}
