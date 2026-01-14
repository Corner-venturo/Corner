/**
 * V2 編輯器 Hook
 *
 * 管理 Fabric.js Canvas 的互動邏輯
 */
'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Canvas, FabricObject, Textbox, Line, Group, ActiveSelection } from 'fabric'
import { renderPageOnCanvas } from '../components/core/renderer'
import type { CanvasPage, CanvasElement, FabricObjectWithData, ShapeElement, TextElement, ImageElement, LineElement, StickerElement, StickerCategory } from '../components/types'

// 對齊參考線配置
const SNAP_THRESHOLD = 5 // 吸附閾值（像素）
const GUIDE_COLOR = '#c9aa7c' // 參考線顏色（莫蘭迪金色）

/** Fabric.js IText 物件（用於文字編輯後取得內容） */
interface FabricITextObject extends FabricObject {
  text?: string
}

/** Fabric.js Textbox 擴展介面（用於直接更新樣式） */
interface FabricTextboxObject extends Textbox {
  data?: FabricObjectWithData['data']
}

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
  const [clipboard, setClipboard] = useState<CanvasElement[]>([]) // 剪貼簿

  // 追蹤是否正在進行畫布操作（避免重複渲染）
  const isCanvasOperationRef = useRef(false)
  // 追蹤上一次渲染的頁面 ID
  const lastRenderedPageIdRef = useRef<string | null>(null)
  // 追蹤上一次渲染的元素數量
  const lastElementCountRef = useRef<number>(0)

  // 縮放控制（只更新狀態，實際縮放由外層 CSS transform 處理）
  const setZoom = useCallback((newZoom: number) => {
    const clampedZoom = Math.max(0.25, Math.min(newZoom, 3))
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

    // 物件修改事件（位置、大小、旋轉）
    const handleObjectModified = (e: { target?: FabricObject }) => {
      const target = e.target as FabricObjectWithData | undefined
      if (!target || !target.data) return

      // 操作結束，允許外部同步
      isCanvasOperationRef.current = false

      const { elementId } = target.data
      onElementChange(elementId, {
        x: target.left || 0,
        y: target.top || 0,
        width: (target.width || 0) * (target.scaleX || 1),
        height: (target.height || 0) * (target.scaleY || 1),
        rotation: target.angle || 0,
      })
    }

    // 物件開始操作（標記正在操作中，避免外部同步干擾）
    const handleObjectOperationStart = () => {
      isCanvasOperationRef.current = true
    }

    // 文字編輯完成事件
    const handleTextChanged = (e: { target?: FabricObject }) => {
      const target = e.target as FabricObjectWithData | undefined
      if (!target || !target.data) return

      const { elementId, elementType } = target.data
      if (elementType === 'text') {
        // 取得編輯後的文字內容
        const textObj = target as FabricITextObject
        const newContent = textObj.text || ''
        onElementChange(elementId, {
          content: newContent,
        })
      }
    }

    // 選取事件

    const handleSelection = (e: { selected?: FabricObject[] }) => {
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

    const handleDoubleClick = (e: { target?: FabricObject }) => {
      const target = e.target as FabricObjectWithData | undefined
      if (!target || !target.data) return

      const { elementId } = target.data
      // 檢查是否為占位元素（以 placeholder 或 hint 結尾）
      if (elementId.includes('placeholder') || elementId.includes('hint')) {
        onPlaceholderClick?.(elementId)
      }
    }

    // === 對齊參考線 (Smart Guides) ===
    let verticalLines: Line[] = []
    let horizontalLines: Line[] = []

    // 建立參考線
    const createGuideLine = (points: [number, number, number, number]): Line => {
      return new Line(points, {
        stroke: GUIDE_COLOR,
        strokeWidth: 1,
        strokeDashArray: [5, 3],
        selectable: false,
        evented: false,
        excludeFromExport: true,
      })
    }

    // 清除所有參考線
    const clearGuideLines = () => {
      verticalLines.forEach((line) => fabricCanvas.remove(line))
      horizontalLines.forEach((line) => fabricCanvas.remove(line))
      verticalLines = []
      horizontalLines = []
    }

    // 移動時計算對齊
    const handleObjectMoving = (e: { target?: FabricObject }) => {
      const target = e.target
      if (!target) return

      clearGuideLines()

      const targetLeft = target.left || 0
      const targetTop = target.top || 0
      const targetWidth = (target.width || 0) * (target.scaleX || 1)
      const targetHeight = (target.height || 0) * (target.scaleY || 1)

      // 計算目標物件的邊界和中心
      const targetCenterX = targetLeft + targetWidth / 2
      const targetCenterY = targetTop + targetHeight / 2
      const targetRight = targetLeft + targetWidth
      const targetBottom = targetTop + targetHeight

      // 畫布中心參考
      const canvasCenterX = page.width / 2
      const canvasCenterY = page.height / 2

      let snappedX: number | null = null
      let snappedY: number | null = null

      // 檢查畫布中心對齊
      if (Math.abs(targetCenterX - canvasCenterX) < SNAP_THRESHOLD) {
        snappedX = canvasCenterX - targetWidth / 2
        const line = createGuideLine([canvasCenterX, 0, canvasCenterX, page.height])
        verticalLines.push(line)
        fabricCanvas.add(line)
      }
      if (Math.abs(targetCenterY - canvasCenterY) < SNAP_THRESHOLD) {
        snappedY = canvasCenterY - targetHeight / 2
        const line = createGuideLine([0, canvasCenterY, page.width, canvasCenterY])
        horizontalLines.push(line)
        fabricCanvas.add(line)
      }

      // 檢查與其他物件的對齊
      const objects = fabricCanvas.getObjects().filter(
        (obj) => obj !== target && !(obj instanceof Line) && (obj as FabricObjectWithData).data?.elementId
      )

      objects.forEach((obj) => {
        const objLeft = obj.left || 0
        const objTop = obj.top || 0
        const objWidth = (obj.width || 0) * (obj.scaleX || 1)
        const objHeight = (obj.height || 0) * (obj.scaleY || 1)
        const objCenterX = objLeft + objWidth / 2
        const objCenterY = objTop + objHeight / 2
        const objRight = objLeft + objWidth
        const objBottom = objTop + objHeight

        // 垂直對齊檢查（左邊、中心、右邊）
        // 左邊對齊
        if (Math.abs(targetLeft - objLeft) < SNAP_THRESHOLD && snappedX === null) {
          snappedX = objLeft
          const line = createGuideLine([objLeft, 0, objLeft, page.height])
          verticalLines.push(line)
          fabricCanvas.add(line)
        }
        // 右邊對齊
        if (Math.abs(targetRight - objRight) < SNAP_THRESHOLD && snappedX === null) {
          snappedX = objRight - targetWidth
          const line = createGuideLine([objRight, 0, objRight, page.height])
          verticalLines.push(line)
          fabricCanvas.add(line)
        }
        // 中心對齊
        if (Math.abs(targetCenterX - objCenterX) < SNAP_THRESHOLD && snappedX === null) {
          snappedX = objCenterX - targetWidth / 2
          const line = createGuideLine([objCenterX, 0, objCenterX, page.height])
          verticalLines.push(line)
          fabricCanvas.add(line)
        }

        // 水平對齊檢查（上邊、中心、下邊）
        // 上邊對齊
        if (Math.abs(targetTop - objTop) < SNAP_THRESHOLD && snappedY === null) {
          snappedY = objTop
          const line = createGuideLine([0, objTop, page.width, objTop])
          horizontalLines.push(line)
          fabricCanvas.add(line)
        }
        // 下邊對齊
        if (Math.abs(targetBottom - objBottom) < SNAP_THRESHOLD && snappedY === null) {
          snappedY = objBottom - targetHeight
          const line = createGuideLine([0, objBottom, page.width, objBottom])
          horizontalLines.push(line)
          fabricCanvas.add(line)
        }
        // 中心對齊
        if (Math.abs(targetCenterY - objCenterY) < SNAP_THRESHOLD && snappedY === null) {
          snappedY = objCenterY - targetHeight / 2
          const line = createGuideLine([0, objCenterY, page.width, objCenterY])
          horizontalLines.push(line)
          fabricCanvas.add(line)
        }
      })

      // 吸附到對齊位置
      if (snappedX !== null) target.set('left', snappedX)
      if (snappedY !== null) target.set('top', snappedY)
    }

    // 移動結束時清除參考線
    const handleObjectModifiedWithClear = (e: { target?: FabricObject }) => {
      clearGuideLines()
      handleObjectModified(e)
    }

    // 監聽操作開始事件（標記正在操作中）
    fabricCanvas.on('object:moving', (e) => {
      handleObjectOperationStart()
      handleObjectMoving(e)
    })
    fabricCanvas.on('object:scaling', handleObjectOperationStart)
    fabricCanvas.on('object:rotating', handleObjectOperationStart)
    fabricCanvas.on('object:modified', handleObjectModifiedWithClear)
    fabricCanvas.on('text:editing:exited', handleTextChanged)
    fabricCanvas.on('selection:created', handleSelection)
    fabricCanvas.on('selection:updated', handleSelection)
    fabricCanvas.on('selection:cleared', handleSelectionCleared)
    fabricCanvas.on('mouse:dblclick', handleDoubleClick)

    return () => {
      clearGuideLines()
      fabricCanvas.dispose()
      fabricCanvasRef.current = null
      setIsCanvasReady(false)
    }
  }, [page?.width, page?.height, page?.backgroundColor, onElementChange, onSelect, onPlaceholderClick])

  // 計算需要完整重繪的 hash（只追蹤結構性變化）
  const structuralHash = page?.elements?.map(el => {
    // 只追蹤影響渲染的關鍵屬性
    if (el.type === 'image') {
      const imgEl = el as ImageElement
      // 圖片 src 變化需要重繪
      return `${el.id}:img:${imgEl.src?.slice(-30) || ''}`
    }
    // 其他元素只追蹤 ID（位置/大小由 Fabric 直接處理）
    return `${el.id}:${el.type}`
  }).join('|') || ''

  // 當頁面切換或元素結構變化時完整重繪
  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current
    if (!fabricCanvas || !page) return

    // 如果正在進行畫布操作，跳過重繪
    if (isCanvasOperationRef.current) return

    const isPageChanged = lastRenderedPageIdRef.current !== page.id
    const isElementCountChanged = lastElementCountRef.current !== page.elements.length

    // 只在頁面切換或元素數量變化時完整重繪
    if (isPageChanged || isElementCountChanged) {
      // 確保 canvas 尺寸正確
      if (fabricCanvas.width !== page.width || fabricCanvas.height !== page.height) {
        fabricCanvas.setDimensions({ width: page.width, height: page.height })
      }

      renderPageOnCanvas(fabricCanvas, page, {
        isEditable: true,
        canvasWidth: page.width,
        canvasHeight: page.height,
      })

      lastRenderedPageIdRef.current = page.id
      lastElementCountRef.current = page.elements.length
    }
  }, [page?.id, page?.elements?.length, structuralHash])

  // 同步外部資料變更到畫布（不完整重繪）
  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current
    if (!fabricCanvas || !page) return
    if (isCanvasOperationRef.current) return

    // 找到畫布上的所有物件
    const fabricObjects = fabricCanvas.getObjects()

    // 同步每個元素的狀態（只同步位置相關屬性，不重建物件）
    page.elements.forEach(el => {
      const fabricObj = fabricObjects.find(obj => {
        const withData = obj as FabricObjectWithData
        return withData.data?.elementId === el.id
      })

      if (fabricObj) {
        // 只同步基本屬性，不觸發完整重繪
        const currentLeft = fabricObj.left || 0
        const currentTop = fabricObj.top || 0

        // 只有當位置明顯不同時才更新（避免浮點數誤差）
        if (Math.abs(currentLeft - el.x) > 0.5 || Math.abs(currentTop - el.y) > 0.5) {
          fabricObj.set({
            left: el.x,
            top: el.y,
          })
          fabricObj.setCoords()
        }
      }
    })

    fabricCanvas.renderAll()
  }, [page?.elements])

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

  // 新增線條
  const addLine = useCallback((options?: { style?: 'solid' | 'dashed' | 'dotted'; endArrow?: boolean }) => {
    if (!page) return
    const x = page.width / 2 - 100
    const y = page.height / 2
    const newElement: LineElement = {
      id: `line-${Date.now()}`,
      type: 'line',
      name: '線條',
      x,
      y,
      width: 200,
      height: 2,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      zIndex: 0,
      x1: 0,
      y1: 0,
      x2: 200,
      y2: 0,
      stroke: '#c9aa7c',
      strokeWidth: 2,
      lineStyle: options?.style || 'solid',
      startEndpoint: 'none',
      endEndpoint: options?.endArrow ? 'arrow' : 'none',
    }
    onElementAdd(newElement)
  }, [page, onElementAdd])

  // 新增貼紙/印章
  const addSticker = useCallback((stickerId: string, category: StickerCategory) => {
    if (!page) return
    const x = (page.width - 80) / 2
    const y = (page.height - 80) / 2
    const newElement: StickerElement = {
      id: `sticker-${Date.now()}`,
      type: 'sticker',
      name: '貼紙',
      x,
      y,
      width: 80,
      height: 80,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      zIndex: 0,
      category,
      stickerId,
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

  // 複製選取的元素到剪貼簿
  const copySelectedElements = useCallback(() => {
    const fabricCanvas = fabricCanvasRef.current
    if (!fabricCanvas || !page) return

    const activeObjects = fabricCanvas.getActiveObjects()
    const elementsToCopy: CanvasElement[] = []

    activeObjects.forEach((obj) => {
      const elWithData = obj as FabricObjectWithData
      if (elWithData.data?.elementId) {
        // 從 page.elements 找到對應的元素
        const element = page.elements.find(el => el.id === elWithData.data?.elementId)
        if (element) {
          elementsToCopy.push(element)
        }
      }
    })

    if (elementsToCopy.length > 0) {
      setClipboard(elementsToCopy)
    }
  }, [page])

  // 貼上剪貼簿中的元素
  const pasteElements = useCallback(() => {
    if (clipboard.length === 0 || !page) return

    const offset = 20 // 貼上時的偏移量

    clipboard.forEach((element) => {
      // 建立新元素（複製並偏移位置）
      const newElement: CanvasElement = {
        ...element,
        id: `${element.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        x: element.x + offset,
        y: element.y + offset,
      }
      onElementAdd(newElement)
    })
  }, [clipboard, page, onElementAdd])

  // 剪下選取的元素
  const cutSelectedElements = useCallback(() => {
    copySelectedElements()
    deleteSelectedElements()
  }, [copySelectedElements, deleteSelectedElements])

  // 鍵盤事件監聯（Delete/Backspace 刪除、Ctrl+C/V/X 複製貼上剪下）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果焦點在輸入框內，不處理
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Ctrl/Cmd + C 複製
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault()
        copySelectedElements()
        return
      }

      // Ctrl/Cmd + V 貼上
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault()
        pasteElements()
        return
      }

      // Ctrl/Cmd + X 剪下
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault()
        cutSelectedElements()
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
  }, [deleteSelectedElements, copySelectedElements, pasteElements, cutSelectedElements])

  // 群組快捷鍵處理（Ctrl+G 群組、Ctrl+Shift+G 取消群組）
  // 注意：這個 effect 需要放在群組功能定義之後，但由於 React hooks 順序規則，
  // 我們使用 ref 來存儲函數引用
  const groupSelectedRef = useRef<() => void>(() => {})
  const ungroupSelectedRef = useRef<() => void>(() => {})

  useEffect(() => {
    const handleGroupKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Ctrl/Cmd + G 群組
      if ((e.ctrlKey || e.metaKey) && e.key === 'g' && !e.shiftKey) {
        e.preventDefault()
        groupSelectedRef.current()
        return
      }

      // Ctrl/Cmd + Shift + G 取消群組
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'g') {
        e.preventDefault()
        ungroupSelectedRef.current()
        return
      }
    }

    window.addEventListener('keydown', handleGroupKeyDown)
    return () => window.removeEventListener('keydown', handleGroupKeyDown)
  }, [])

  // 直接更新文字元素樣式（不重繪整個畫布）
  const updateTextStyle = useCallback((elementId: string, style: Partial<TextElement['style']>) => {
    const fabricCanvas = fabricCanvasRef.current
    if (!fabricCanvas) return false

    // 找到對應的 Fabric 物件
    const objects = fabricCanvas.getObjects()
    const targetObj = objects.find((obj) => {
      const withData = obj as FabricTextboxObject
      return withData.data?.elementId === elementId && withData.data?.elementType === 'text'
    }) as FabricTextboxObject | undefined

    if (!targetObj) return false

    // 直接更新 Textbox 屬性
    if (style.fontSize !== undefined) {
      targetObj.set('fontSize', style.fontSize)
    }
    if (style.fontFamily !== undefined) {
      targetObj.set('fontFamily', style.fontFamily)
    }
    if (style.fontWeight !== undefined) {
      targetObj.set('fontWeight', style.fontWeight)
    }
    if (style.color !== undefined) {
      targetObj.set('fill', style.color)
    }
    if (style.textAlign !== undefined) {
      targetObj.set('textAlign', style.textAlign)
    }
    if (style.lineHeight !== undefined) {
      targetObj.set('lineHeight', style.lineHeight)
    }
    if (style.letterSpacing !== undefined) {
      targetObj.set('charSpacing', style.letterSpacing * 10) // Fabric 使用 1/1000 em
    }

    // 只重繪這個物件
    fabricCanvas.renderAll()
    return true
  }, [])

  // === 圖層管理功能 ===

  // 取得選取元素的 ID
  const getSelectedElementId = useCallback((): string | null => {
    const fabricCanvas = fabricCanvasRef.current
    if (!fabricCanvas) return null

    const activeObject = fabricCanvas.getActiveObject() as FabricObjectWithData | undefined
    return activeObject?.data?.elementId || null
  }, [])

  // 將選取元素上移一層
  const bringForward = useCallback(() => {
    const fabricCanvas = fabricCanvasRef.current
    if (!fabricCanvas) return

    const activeObject = fabricCanvas.getActiveObject()
    if (activeObject) {
      fabricCanvas.bringObjectForward(activeObject)
      fabricCanvas.renderAll()

      // 更新元素 zIndex
      const elWithData = activeObject as FabricObjectWithData
      if (elWithData.data?.elementId) {
        const objects = fabricCanvas.getObjects().filter(obj => (obj as FabricObjectWithData).data?.elementId)
        const newIndex = objects.indexOf(activeObject)
        onElementChange(elWithData.data.elementId, { zIndex: newIndex })
      }
    }
  }, [onElementChange])

  // 將選取元素下移一層
  const sendBackward = useCallback(() => {
    const fabricCanvas = fabricCanvasRef.current
    if (!fabricCanvas) return

    const activeObject = fabricCanvas.getActiveObject()
    if (activeObject) {
      fabricCanvas.sendObjectBackwards(activeObject)
      fabricCanvas.renderAll()

      const elWithData = activeObject as FabricObjectWithData
      if (elWithData.data?.elementId) {
        const objects = fabricCanvas.getObjects().filter(obj => (obj as FabricObjectWithData).data?.elementId)
        const newIndex = objects.indexOf(activeObject)
        onElementChange(elWithData.data.elementId, { zIndex: newIndex })
      }
    }
  }, [onElementChange])

  // 將選取元素置頂
  const bringToFront = useCallback(() => {
    const fabricCanvas = fabricCanvasRef.current
    if (!fabricCanvas) return

    const activeObject = fabricCanvas.getActiveObject()
    if (activeObject) {
      fabricCanvas.bringObjectToFront(activeObject)
      fabricCanvas.renderAll()

      const elWithData = activeObject as FabricObjectWithData
      if (elWithData.data?.elementId) {
        const objects = fabricCanvas.getObjects().filter(obj => (obj as FabricObjectWithData).data?.elementId)
        onElementChange(elWithData.data.elementId, { zIndex: objects.length - 1 })
      }
    }
  }, [onElementChange])

  // 將選取元素置底
  const sendToBack = useCallback(() => {
    const fabricCanvas = fabricCanvasRef.current
    if (!fabricCanvas) return

    const activeObject = fabricCanvas.getActiveObject()
    if (activeObject) {
      fabricCanvas.sendObjectToBack(activeObject)
      fabricCanvas.renderAll()

      const elWithData = activeObject as FabricObjectWithData
      if (elWithData.data?.elementId) {
        onElementChange(elWithData.data.elementId, { zIndex: 0 })
      }
    }
  }, [onElementChange])

  // 鎖定/解鎖選取元素
  const toggleLock = useCallback(() => {
    const fabricCanvas = fabricCanvasRef.current
    if (!fabricCanvas) return

    const activeObject = fabricCanvas.getActiveObject()
    if (activeObject) {
      const isLocked = !activeObject.selectable
      activeObject.set({
        selectable: isLocked,
        evented: isLocked,
        lockMovementX: !isLocked,
        lockMovementY: !isLocked,
        lockRotation: !isLocked,
        lockScalingX: !isLocked,
        lockScalingY: !isLocked,
      })
      fabricCanvas.renderAll()

      const elWithData = activeObject as FabricObjectWithData
      if (elWithData.data?.elementId) {
        onElementChange(elWithData.data.elementId, { locked: !isLocked })
      }
    }
  }, [onElementChange])

  // === 對齊功能 ===

  // 水平靠左對齊
  const alignLeft = useCallback(() => {
    const fabricCanvas = fabricCanvasRef.current
    if (!fabricCanvas || !page) return

    const activeObject = fabricCanvas.getActiveObject()
    if (activeObject) {
      activeObject.set('left', 0)
      fabricCanvas.renderAll()

      const elWithData = activeObject as FabricObjectWithData
      if (elWithData.data?.elementId) {
        onElementChange(elWithData.data.elementId, { x: 0 })
      }
    }
  }, [page, onElementChange])

  // 水平置中對齊
  const alignCenterH = useCallback(() => {
    const fabricCanvas = fabricCanvasRef.current
    if (!fabricCanvas || !page) return

    const activeObject = fabricCanvas.getActiveObject()
    if (activeObject) {
      const objWidth = (activeObject.width || 0) * (activeObject.scaleX || 1)
      const newLeft = (page.width - objWidth) / 2
      activeObject.set('left', newLeft)
      fabricCanvas.renderAll()

      const elWithData = activeObject as FabricObjectWithData
      if (elWithData.data?.elementId) {
        onElementChange(elWithData.data.elementId, { x: newLeft })
      }
    }
  }, [page, onElementChange])

  // 水平靠右對齊
  const alignRight = useCallback(() => {
    const fabricCanvas = fabricCanvasRef.current
    if (!fabricCanvas || !page) return

    const activeObject = fabricCanvas.getActiveObject()
    if (activeObject) {
      const objWidth = (activeObject.width || 0) * (activeObject.scaleX || 1)
      const newLeft = page.width - objWidth
      activeObject.set('left', newLeft)
      fabricCanvas.renderAll()

      const elWithData = activeObject as FabricObjectWithData
      if (elWithData.data?.elementId) {
        onElementChange(elWithData.data.elementId, { x: newLeft })
      }
    }
  }, [page, onElementChange])

  // 垂直靠上對齊
  const alignTop = useCallback(() => {
    const fabricCanvas = fabricCanvasRef.current
    if (!fabricCanvas) return

    const activeObject = fabricCanvas.getActiveObject()
    if (activeObject) {
      activeObject.set('top', 0)
      fabricCanvas.renderAll()

      const elWithData = activeObject as FabricObjectWithData
      if (elWithData.data?.elementId) {
        onElementChange(elWithData.data.elementId, { y: 0 })
      }
    }
  }, [onElementChange])

  // 垂直置中對齊
  const alignCenterV = useCallback(() => {
    const fabricCanvas = fabricCanvasRef.current
    if (!fabricCanvas || !page) return

    const activeObject = fabricCanvas.getActiveObject()
    if (activeObject) {
      const objHeight = (activeObject.height || 0) * (activeObject.scaleY || 1)
      const newTop = (page.height - objHeight) / 2
      activeObject.set('top', newTop)
      fabricCanvas.renderAll()

      const elWithData = activeObject as FabricObjectWithData
      if (elWithData.data?.elementId) {
        onElementChange(elWithData.data.elementId, { y: newTop })
      }
    }
  }, [page, onElementChange])

  // 垂直靠下對齊
  const alignBottom = useCallback(() => {
    const fabricCanvas = fabricCanvasRef.current
    if (!fabricCanvas || !page) return

    const activeObject = fabricCanvas.getActiveObject()
    if (activeObject) {
      const objHeight = (activeObject.height || 0) * (activeObject.scaleY || 1)
      const newTop = page.height - objHeight
      activeObject.set('top', newTop)
      fabricCanvas.renderAll()

      const elWithData = activeObject as FabricObjectWithData
      if (elWithData.data?.elementId) {
        onElementChange(elWithData.data.elementId, { y: newTop })
      }
    }
  }, [page, onElementChange])

  // === 群組功能 ===

  // 將選取的多個元素群組
  const groupSelected = useCallback(() => {
    const fabricCanvas = fabricCanvasRef.current
    if (!fabricCanvas) return

    const activeObject = fabricCanvas.getActiveObject()
    if (!activeObject || !(activeObject instanceof ActiveSelection)) return

    // 取得選取的物件
    const objects = activeObject.getObjects()
    if (objects.length < 2) return

    // 建立群組
    const group = new Group(objects, {
      interactive: true,
      subTargetCheck: true,
    })

    // 設定群組 ID
    const groupId = `group-${Date.now()}`
    ;(group as unknown as FabricObjectWithData).data = {
      elementId: groupId,
      elementType: 'group',
    }

    // 從畫布移除原始物件
    objects.forEach((obj) => {
      fabricCanvas.remove(obj)
    })

    // 添加群組
    fabricCanvas.add(group)
    fabricCanvas.setActiveObject(group)
    fabricCanvas.renderAll()

    // 通知外部（建立群組元素）
    const groupElement: ShapeElement = {
      id: groupId,
      type: 'shape',
      name: '群組',
      x: group.left || 0,
      y: group.top || 0,
      width: group.width || 0,
      height: group.height || 0,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      zIndex: 0,
      variant: 'rectangle',
      fill: 'transparent',
      stroke: 'transparent',
      strokeWidth: 0,
    }
    onElementAdd(groupElement)
  }, [onElementAdd])

  // 取消群組
  const ungroupSelected = useCallback(() => {
    const fabricCanvas = fabricCanvasRef.current
    if (!fabricCanvas) return

    const activeObject = fabricCanvas.getActiveObject()
    if (!activeObject || !(activeObject instanceof Group)) return

    // 取得群組內的物件並計算其絕對位置
    const items = activeObject.getObjects()
    const groupLeft = activeObject.left || 0
    const groupTop = activeObject.top || 0

    // 從群組移除物件並添加回畫布（保持相對位置）
    const restoredItems: FabricObject[] = []
    items.forEach((item) => {
      // 計算物件的絕對位置
      const itemLeft = (item.left || 0) + groupLeft + (activeObject.width || 0) / 2
      const itemTop = (item.top || 0) + groupTop + (activeObject.height || 0) / 2
      item.set({ left: itemLeft, top: itemTop })
      item.setCoords()
      restoredItems.push(item)
    })

    // 從畫布移除群組
    fabricCanvas.remove(activeObject)

    // 將物件添加回畫布
    restoredItems.forEach((item) => {
      fabricCanvas.add(item)
    })

    // 選取所有物件
    const selection = new ActiveSelection(restoredItems, { canvas: fabricCanvas })
    fabricCanvas.setActiveObject(selection)
    fabricCanvas.renderAll()

    // 通知外部刪除群組元素
    const elWithData = activeObject as unknown as FabricObjectWithData
    if (elWithData.data?.elementId) {
      onElementDelete(elWithData.data.elementId)
    }
  }, [onElementDelete])

  // 更新群組功能 refs（供鍵盤快捷鍵使用）
  useEffect(() => {
    groupSelectedRef.current = groupSelected
    ungroupSelectedRef.current = ungroupSelected
  }, [groupSelected, ungroupSelected])

  return {
    canvasRef,
    zoom,
    setZoom,
    isCanvasReady,
    // 元素新增
    addTextElement,
    addRectangle,
    addCircle,
    addImage,
    addLine,
    addSticker,
    // 剪貼簿
    deleteSelectedElements,
    copySelectedElements,
    pasteElements,
    cutSelectedElements,
    clipboard,
    updateTextStyle,
    // 圖層管理
    getSelectedElementId,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    toggleLock,
    // 對齊功能
    alignLeft,
    alignCenterH,
    alignRight,
    alignTop,
    alignCenterV,
    alignBottom,
    // 群組功能
    groupSelected,
    ungroupSelected,
  }
}
