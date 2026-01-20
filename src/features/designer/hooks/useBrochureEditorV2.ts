'use client'

/**
 * useBrochureEditorV2 - 簡化版手冊編輯器 Hook
 *
 * 核心理念：
 * - 編輯時純 Fabric.js 操作，不觸發 React re-render
 * - 只追蹤 isDirty 狀態
 * - 載入時完整渲染，不做增量更新
 * - 儲存時導出 canvas JSON
 */

import { useRef, useCallback, useEffect, useState } from 'react'
import * as fabric from 'fabric'
import { useDocumentStore } from '@/stores/document-store'
import type { CanvasElement, TextElement, ShapeElement, ImageElement, CanvasPage } from '@/features/designer/components/types'
import { renderPageOnCanvas } from '@/features/designer/components/core/renderer'
import { logger } from '@/lib/utils/logger'

// ============================================
// Types
// ============================================

interface UseBrochureEditorV2Options {
  width?: number
  height?: number
  initialZoom?: number
  onReady?: () => void
}

interface UseBrochureEditorV2Return {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  canvas: fabric.Canvas | null
  isCanvasReady: boolean

  // Canvas 操作
  initCanvas: () => void
  disposeCanvas: () => void
  loadCanvasData: (data: Record<string, unknown>) => Promise<void>
  loadCanvasElements: (elements: CanvasElement[]) => Promise<void>
  loadCanvasPage: (page: CanvasPage) => Promise<void>
  exportCanvasData: () => Record<string, unknown>
  exportThumbnail: (options?: { quality?: number; multiplier?: number }) => string
  updateElementByName: (elementName: string, updates: { text?: string }) => boolean
  removeObjectByName: (elementName: string) => boolean
  getObjectByName: (elementName: string) => fabric.FabricObject | null

  // 元素操作
  addText: (options?: { content?: string; x?: number; y?: number }) => void
  addRectangle: (options?: { x?: number; y?: number; width?: number; height?: number }) => void
  addCircle: (options?: { x?: number; y?: number; radius?: number }) => void
  addEllipse: (options?: { x?: number; y?: number; rx?: number; ry?: number }) => void
  addTriangle: (options?: { x?: number; y?: number; width?: number; height?: number }) => void
  addImage: (url: string, options?: { x?: number; y?: number }) => Promise<void>
  addLine: (options?: { style?: 'solid' | 'dashed' | 'dotted'; arrow?: boolean }) => void
  addSticker: (pathData: string, options?: {
    x?: number
    y?: number
    width?: number
    height?: number
    fill?: string
    viewBox?: { width: number; height: number }
  }) => void
  addIcon: (iconName: string, options?: {
    x?: number
    y?: number
    size?: number
    color?: string
    keepOriginalColor?: boolean
  }) => Promise<void>
  addIllustration: (svgString: string, options?: {
    x?: number
    y?: number
    size?: number
  }) => Promise<void>

  // 選取操作
  selectedObjectIds: string[]
  deleteSelected: () => void
  copySelected: () => void
  pasteClipboard: () => void
  cutSelected: () => void
  moveSelected: (dx: number, dy: number) => void

  // 圖層操作
  bringForward: () => void
  sendBackward: () => void
  bringToFront: () => void
  sendToBack: () => void
  getObjects: () => fabric.FabricObject[]
  selectObjectById: (id: string) => void

  // 對齊操作
  alignLeft: () => void
  alignCenterH: () => void
  alignRight: () => void
  alignTop: () => void
  alignCenterV: () => void
  alignBottom: () => void

  // 分佈操作
  distributeH: () => void
  distributeV: () => void

  // 群組操作
  groupSelected: () => void
  ungroupSelected: () => void

  // 翻轉操作
  flipHorizontal: () => void
  flipVertical: () => void

  // 鎖定
  toggleLock: () => void

  // Undo/Redo
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean

  // 頁面歷史管理（用於多頁切換）
  saveCurrentPageHistory: () => void
  loadPageHistory: (pageId: string) => void
  initPageHistory: (pageId: string) => void

  // 縮放
  zoom: number
  setZoom: (zoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  fitToContainer: (containerWidth: number, containerHeight: number, padding?: number) => void
}

// ============================================
// Clipboard (module level for persistence)
// ============================================
let clipboard: fabric.FabricObject[] = []

// ============================================
// History Configuration
// ============================================
const MAX_HISTORY_SIZE = 30 // 減少記憶體使用
const HISTORY_DEBOUNCE_MS = 300 // 防抖延遲

// 每頁獨立的歷史記錄類型
interface PageHistory {
  stack: string[]
  index: number
}

// ============================================
// Hook
// ============================================

export function useBrochureEditorV2(
  options: UseBrochureEditorV2Options = {}
): UseBrochureEditorV2Return {
  const { width = 559, height = 794, initialZoom = 1, onReady } = options

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const [isCanvasReady, setIsCanvasReady] = useState(false)
  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([])
  const [zoom, setZoomState] = useState(initialZoom)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  // 歷史記錄管理（使用 useRef 避免 re-render 問題）
  const historyRef = useRef<PageHistory>({ stack: [], index: -1 })
  const pageHistoriesRef = useRef<Map<string, PageHistory>>(new Map())
  const isUndoRedoRef = useRef(false)
  const currentPageIdRef = useRef<string | null>(null)
  const saveHistoryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Document store for isDirty tracking
  const setIsDirty = useDocumentStore((s) => s.setIsDirty)

  // ============================================
  // Mark Dirty Helper
  // ============================================
  const markDirty = useCallback(() => {
    setIsDirty(true)
  }, [setIsDirty])

  // ============================================
  // History Management Helpers
  // ============================================
  const updateHistoryState = useCallback(() => {
    const history = historyRef.current
    setCanUndo(history.index > 0)
    setCanRedo(history.index < history.stack.length - 1)
  }, [])

  // 立即保存到歷史（內部使用）
  const saveToHistoryImmediate = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas || isUndoRedoRef.current) return

    const json = JSON.stringify(canvas.toJSON())
    const history = historyRef.current

    // 如果當前不在最新位置，刪除之後的歷史
    if (history.index < history.stack.length - 1) {
      history.stack = history.stack.slice(0, history.index + 1)
    }

    // 避免重複保存相同狀態
    if (history.stack[history.stack.length - 1] === json) return

    // 添加新狀態
    history.stack.push(json)

    // 限制歷史數量
    if (history.stack.length > MAX_HISTORY_SIZE) {
      history.stack.shift()
    } else {
      history.index++
    }

    updateHistoryState()
  }, [updateHistoryState])

  // 帶防抖的保存（用於頻繁操作如拖動）
  const saveToHistory = useCallback(() => {
    // 清除之前的定時器
    if (saveHistoryTimeoutRef.current) {
      clearTimeout(saveHistoryTimeoutRef.current)
    }
    // 設置新的延遲保存
    saveHistoryTimeoutRef.current = setTimeout(() => {
      saveToHistoryImmediate()
      saveHistoryTimeoutRef.current = null
    }, HISTORY_DEBOUNCE_MS)
  }, [saveToHistoryImmediate])

  // 切換頁面時保存當前頁面的歷史
  const saveCurrentPageHistory = useCallback(() => {
    const pageId = currentPageIdRef.current
    if (pageId) {
      pageHistoriesRef.current.set(pageId, {
        stack: [...historyRef.current.stack],
        index: historyRef.current.index,
      })
    }
  }, [])

  // 切換到新頁面時載入或初始化歷史
  const loadPageHistory = useCallback((pageId: string) => {
    currentPageIdRef.current = pageId
    const savedHistory = pageHistoriesRef.current.get(pageId)
    if (savedHistory) {
      historyRef.current = {
        stack: [...savedHistory.stack],
        index: savedHistory.index,
      }
    } else {
      // 新頁面，初始化空歷史
      historyRef.current = { stack: [], index: -1 }
    }
    updateHistoryState()
  }, [updateHistoryState])

  // 初始化當前頁面的歷史（載入內容後呼叫）
  const initPageHistory = useCallback((pageId: string) => {
    currentPageIdRef.current = pageId
    historyRef.current = { stack: [], index: -1 }
    // 延遲保存初始狀態，確保 canvas 內容已載入
    setTimeout(() => {
      saveToHistoryImmediate()
    }, 100)
  }, [saveToHistoryImmediate])

  // ============================================
  // Initialize Canvas
  // ============================================
  const initCanvas = useCallback(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return

    // 設定全域控制點樣式 - 小實心圓點（避免控制點比元素還大）
    // fabric.js v7 需要直接修改 prototype 屬性
    fabric.FabricObject.prototype.cornerSize = 6           // 控制點大小（原本預設 13）
    fabric.FabricObject.prototype.cornerStyle = 'circle'   // 圓形控制點
    fabric.FabricObject.prototype.cornerColor = '#c9aa7c'  // 莫蘭迪金色
    fabric.FabricObject.prototype.cornerStrokeColor = '#ffffff' // 白色邊框
    fabric.FabricObject.prototype.transparentCorners = false // 實心（不透明）
    fabric.FabricObject.prototype.borderColor = '#c9aa7c'  // 選取框顏色
    fabric.FabricObject.prototype.borderScaleFactor = 1    // 邊框粗細
    fabric.FabricObject.prototype.padding = 2              // 控制點與元素的間距

    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    })

    // 綁定事件 - 保存歷史和標記 dirty
    const handleChange = () => {
      markDirty()
      saveToHistory()
    }
    canvas.on('object:modified', handleChange)
    canvas.on('object:added', handleChange)
    canvas.on('object:removed', handleChange)

    // 選取事件 - 支援兩種 ID 存取方式：obj.id 和 data.elementId
    const getObjectId = (obj: fabric.FabricObject): string | undefined => {
      // 優先從 obj.id 讀取（手動添加的元素）
      const directId = (obj as fabric.FabricObject & { id?: string }).id
      if (directId) return directId
      // 其次從 data.elementId 讀取（renderer 渲染的元素）
      const dataId = (obj as fabric.FabricObject & { data?: { elementId?: string } }).data?.elementId
      return dataId
    }

    canvas.on('selection:created', (e) => {
      const ids = e.selected?.map(getObjectId).filter(Boolean) as string[]
      setSelectedObjectIds(ids)
    })

    canvas.on('selection:updated', (e) => {
      const ids = e.selected?.map(getObjectId).filter(Boolean) as string[]
      setSelectedObjectIds(ids)
    })

    canvas.on('selection:cleared', () => {
      setSelectedObjectIds([])
    })

    // ============================================
    // 對齊參考線功能
    // ============================================
    const SNAP_THRESHOLD = 8 // 吸附閾值（像素）
    const guideLines: fabric.Line[] = []

    // 創建參考線
    const createGuideLine = (coords: [number, number, number, number]) => {
      const line = new fabric.Line(coords, {
        stroke: '#c9aa7c',
        strokeWidth: 1,
        strokeDashArray: [4, 4],
        selectable: false,
        evented: false,
        excludeFromExport: true,
      })
      // 標記為參考線
      ;(line as fabric.Line & { isGuideLine: boolean }).isGuideLine = true
      return line
    }

    // 清除所有參考線
    const clearGuideLines = () => {
      guideLines.forEach(line => canvas.remove(line))
      guideLines.length = 0
    }

    // 取得物件的邊界
    const getObjEdges = (obj: fabric.FabricObject) => {
      const bound = obj.getBoundingRect()
      return {
        left: bound.left,
        right: bound.left + bound.width,
        top: bound.top,
        bottom: bound.top + bound.height,
        centerX: bound.left + bound.width / 2,
        centerY: bound.top + bound.height / 2,
        width: bound.width,
        height: bound.height,
      }
    }

    // 追蹤上一次的吸附狀態，避免重複計算
    let lastSnapX: number | null = null
    let lastSnapY: number | null = null

    canvas.on('object:moving', (e) => {
      const movingObj = e.target
      if (!movingObj) return

      const movingEdges = getObjEdges(movingObj)
      const canvasWidth = width
      const canvasHeight = height

      // 要對齊的參考點（只收集畫布邊界和中心）
      const snapPoints = {
        vertical: [0, canvasWidth / 2, canvasWidth],
        horizontal: [0, canvasHeight / 2, canvasHeight],
      }

      // 收集其他物件的邊緣（限制數量避免效能問題）
      const otherObjects = canvas.getObjects().filter(obj => {
        const isGuideLine = (obj as fabric.FabricObject & { isGuideLine?: boolean }).isGuideLine
        return obj !== movingObj && !isGuideLine && obj.type !== 'activeSelection'
      }).slice(0, 20) // 最多檢查 20 個物件

      otherObjects.forEach(obj => {
        const edges = getObjEdges(obj)
        snapPoints.vertical.push(edges.left, edges.right, edges.centerX)
        snapPoints.horizontal.push(edges.top, edges.bottom, edges.centerY)
      })

      let snappedLeft: number | null = null
      let snappedTop: number | null = null
      let snapXPos: number | null = null
      let snapYPos: number | null = null

      // 檢查垂直對齊（左、中、右）
      const movingX = [movingEdges.left, movingEdges.centerX, movingEdges.right]
      for (const mx of movingX) {
        for (const snap of snapPoints.vertical) {
          if (Math.abs(mx - snap) < SNAP_THRESHOLD) {
            const offset = snap - mx
            snappedLeft = (movingObj.left || 0) + offset
            snapXPos = snap
            break
          }
        }
        if (snappedLeft !== null) break
      }

      // 檢查水平對齊（上、中、下）
      const movingY = [movingEdges.top, movingEdges.centerY, movingEdges.bottom]
      for (const my of movingY) {
        for (const snap of snapPoints.horizontal) {
          if (Math.abs(my - snap) < SNAP_THRESHOLD) {
            const offset = snap - my
            snappedTop = (movingObj.top || 0) + offset
            snapYPos = snap
            break
          }
        }
        if (snappedTop !== null) break
      }

      // 只有當吸附狀態改變時才更新參考線
      const snapChanged = snapXPos !== lastSnapX || snapYPos !== lastSnapY
      if (snapChanged) {
        clearGuideLines()
        lastSnapX = snapXPos
        lastSnapY = snapYPos

        // 創建新的參考線
        if (snapXPos !== null) {
          const line = createGuideLine([snapXPos, 0, snapXPos, canvasHeight])
          canvas.add(line)
          guideLines.push(line)
        }
        if (snapYPos !== null) {
          const line = createGuideLine([0, snapYPos, canvasWidth, snapYPos])
          canvas.add(line)
          guideLines.push(line)
        }
      }

      // 應用吸附位置
      if (snappedLeft !== null) {
        movingObj.set({ left: snappedLeft })
      }
      if (snappedTop !== null) {
        movingObj.set({ top: snappedTop })
      }
    })

    // 移動結束時清除參考線並重置狀態
    canvas.on('object:modified', () => {
      clearGuideLines()
      lastSnapX = null
      lastSnapY = null
      canvas.renderAll()
    })

    canvas.on('mouse:up', () => {
      clearGuideLines()
      lastSnapX = null
      lastSnapY = null
      canvas.renderAll()
    })

    fabricCanvasRef.current = canvas
    setIsCanvasReady(true)
    onReady?.()
  }, [width, height, markDirty, saveToHistory, onReady])

  // ============================================
  // Dispose Canvas
  // ============================================
  const disposeCanvas = useCallback(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose()
      fabricCanvasRef.current = null
      setIsCanvasReady(false)
    }
  }, [])

  // ============================================
  // Load Canvas Data
  // ============================================
  // 更新所有物件的控制點樣式（載入後調用）
  const applyControlStyles = useCallback((canvas: fabric.Canvas) => {
    canvas.getObjects().forEach((obj) => {
      obj.set({
        cornerSize: 6,
        cornerStyle: 'circle',
        cornerColor: '#c9aa7c',
        cornerStrokeColor: '#ffffff',
        transparentCorners: false,
        borderColor: '#c9aa7c',
        borderScaleFactor: 1,
        padding: 2,
      })
    })
  }, [])

  const loadCanvasData = useCallback(async (data: Record<string, unknown>) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    // Clear existing objects
    canvas.clear()

    // Load from JSON
    await canvas.loadFromJSON(data)
    applyControlStyles(canvas)
    canvas.renderAll()
  }, [applyControlStyles])

  // ============================================
  // Load Canvas Elements (from CanvasElement[] format)
  // ============================================
  const loadCanvasElements = useCallback(async (elements: CanvasElement[]) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    // Clear existing objects
    canvas.clear()

    // Sort elements by zIndex
    const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex)

    // Convert each element to Fabric.js object
    for (const element of sortedElements) {
      let fabricObj: fabric.FabricObject | null = null

      switch (element.type) {
        case 'text': {
          const textEl = element as TextElement
          // 使用 Textbox 而非 IText，可以支援自動換行和固定寬度
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
            // 確保左上角對齊
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
        // Store original element ID
        (fabricObj as fabric.FabricObject & { id: string }).id = element.id
        canvas.add(fabricObj)
      }
    }

    canvas.renderAll()
  }, [])

  // ============================================
  // Load Canvas Page (使用完整的 renderer)
  // ============================================
  const loadCanvasPage = useCallback(async (page: CanvasPage) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    // 使用 renderer.ts 的 renderPageOnCanvas 來正確處理所有元素類型
    // 包括：圖片 borderRadius（圓拱形狀）、objectFit、漸層、圖標等
    await renderPageOnCanvas(canvas, page, {
      isEditable: true,
      canvasWidth: width,
      canvasHeight: height,
    })
    // 套用控制點樣式
    applyControlStyles(canvas)
  }, [width, height, applyControlStyles])

  // ============================================
  // Export Canvas Data
  // ============================================
  const exportCanvasData = useCallback((): Record<string, unknown> => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return {}

    // Fabric.js 6: toJSON() 需要明確指定要序列化的自訂屬性
    // name 和 data 都需要手動合併以確保狀態保留
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
          // 確保 name 屬性被序列化（用於元素狀態匹配）
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
  const exportThumbnail = useCallback((options?: { quality?: number; multiplier?: number }): string => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return ''

    return canvas.toDataURL({
      format: 'jpeg',
      quality: options?.quality ?? 0.6,
      multiplier: options?.multiplier ?? 0.3,
    })
  }, [])

  // ============================================
  // Add Text
  // ============================================
  const addText = useCallback((options?: { content?: string; x?: number; y?: number }) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    // 使用 Textbox 支援多行編輯（按 Enter 換行）
    const text = new fabric.Textbox(options?.content ?? '雙擊編輯文字', {
      left: options?.x ?? width / 2,
      top: options?.y ?? height / 2,
      fontFamily: 'Noto Sans TC',
      fontSize: 24,
      fill: '#3a3633',
      originX: 'center',
      originY: 'center',
      width: 200, // 預設寬度，可拖曳調整
      textAlign: 'left',
      splitByGrapheme: true, // 支援中文換行
    })

    // Add custom ID
    ;(text as fabric.Textbox & { id: string }).id = `text-${Date.now()}`

    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
  }, [width, height])

  // ============================================
  // Add Rectangle
  // ============================================
  const addRectangle = useCallback((options?: { x?: number; y?: number; width?: number; height?: number }) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const rect = new fabric.Rect({
      left: options?.x ?? width / 2,
      top: options?.y ?? height / 2,
      width: options?.width ?? 100,
      height: options?.height ?? 80,
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
  }, [width, height])

  // ============================================
  // Add Circle
  // ============================================
  const addCircle = useCallback((options?: { x?: number; y?: number; radius?: number }) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const circle = new fabric.Circle({
      left: options?.x ?? width / 2,
      top: options?.y ?? height / 2,
      radius: options?.radius ?? 50,
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
  }, [width, height])

  // ============================================
  // Add Ellipse
  // ============================================
  const addEllipse = useCallback((options?: { x?: number; y?: number; rx?: number; ry?: number }) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const ellipse = new fabric.Ellipse({
      left: options?.x ?? width / 2,
      top: options?.y ?? height / 2,
      rx: options?.rx ?? 60,
      ry: options?.ry ?? 40,
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
  }, [width, height])

  // ============================================
  // Add Triangle
  // ============================================
  const addTriangle = useCallback((options?: { x?: number; y?: number; width?: number; height?: number }) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const triangle = new fabric.Triangle({
      left: options?.x ?? width / 2,
      top: options?.y ?? height / 2,
      width: options?.width ?? 80,
      height: options?.height ?? 70,
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
  }, [width, height])

  // ============================================
  // Add Image
  // ============================================
  const addImage = useCallback(async (url: string, options?: { x?: number; y?: number }) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const img = await fabric.FabricImage.fromURL(url)

    // 計算最大允許尺寸（畫布的 60%）
    const maxWidth = width * 0.6
    const maxHeight = height * 0.6

    // 計算縮放比例（取較小值以確保完整顯示）
    const imgWidth = img.width || 100
    const imgHeight = img.height || 100
    const scaleX = maxWidth / imgWidth
    const scaleY = maxHeight / imgHeight
    const scale = Math.min(scaleX, scaleY, 1) // 不放大，只縮小

    img.set({
      left: options?.x ?? width / 2,
      top: options?.y ?? height / 2,
      originX: 'center',
      originY: 'center',
      scaleX: scale,
      scaleY: scale,
    })

    ;(img as fabric.FabricImage & { id: string }).id = `image-${Date.now()}`

    canvas.add(img)
    canvas.setActiveObject(img)
    canvas.renderAll()
  }, [width, height])

  // ============================================
  // Add Line
  // ============================================
  const addLine = useCallback((options?: { style?: 'solid' | 'dashed' | 'dotted'; arrow?: boolean }) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const lineOptions: Partial<fabric.Line> = {
      stroke: '#3a3633',
      strokeWidth: 2,
    }

    if (options?.style === 'dashed') {
      lineOptions.strokeDashArray = [10, 5]
    } else if (options?.style === 'dotted') {
      lineOptions.strokeDashArray = [2, 4]
    }

    const line = new fabric.Line(
      [width / 2 - 50, height / 2, width / 2 + 50, height / 2],
      lineOptions as Partial<fabric.Line>
    )

    ;(line as fabric.Line & { id: string }).id = `line-${Date.now()}`

    canvas.add(line)

    // Add arrow if needed
    if (options?.arrow) {
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
  }, [width, height])

  // ============================================
  // Add Sticker (SVG Path)
  // ============================================
  const addSticker = useCallback((pathData: string, options?: {
    x?: number
    y?: number
    width?: number
    height?: number
    fill?: string
    viewBox?: { width: number; height: number }
  }) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const defaultSize = 100
    const viewBoxWidth = options?.viewBox?.width || 100
    const viewBoxHeight = options?.viewBox?.height || 100
    const targetWidth = options?.width || defaultSize
    const targetHeight = options?.height || defaultSize

    const path = new fabric.Path(pathData, {
      left: options?.x ?? width / 2,
      top: options?.y ?? height / 2,
      fill: options?.fill || '#c9aa7c',
      stroke: options?.fill || '#c9aa7c',
      strokeWidth: 1,
      originX: 'center',
      originY: 'center',
      // 縮放到目標尺寸
      scaleX: targetWidth / viewBoxWidth,
      scaleY: targetHeight / viewBoxHeight,
    })

    ;(path as fabric.Path & { id: string }).id = `sticker-${Date.now()}`

    canvas.add(path)
    canvas.setActiveObject(path)
    canvas.renderAll()
  }, [width, height])

  // ============================================
  // Add Icon (from @iconify)
  // ============================================
  const addIcon = useCallback(async (iconName: string, options?: {
    x?: number
    y?: number
    size?: number
    color?: string
    keepOriginalColor?: boolean  // 保持原始顏色（用於彩色圖標）
  }) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    try {
      // 從 Iconify API 取得 SVG
      const response = await fetch(`https://api.iconify.design/${iconName}.svg?height=64`)
      if (!response.ok) throw new Error('Failed to fetch icon')

      const svgText = await response.text()

      // 使用 fabric 載入 SVG
      fabric.loadSVGFromString(svgText).then((result) => {
        const group = new fabric.Group(result.objects.filter(Boolean) as fabric.FabricObject[], {
          left: options?.x ?? width / 2,
          top: options?.y ?? height / 2,
          originX: 'center',
          originY: 'center',
        })

        // 設定顏色（除非指定保持原色）
        if (!options?.keepOriginalColor) {
          const color = options?.color || '#3a3633'
          group.getObjects().forEach(obj => {
            if ('fill' in obj) obj.set('fill', color)
            if ('stroke' in obj && obj.stroke) obj.set('stroke', color)
          })
        }

        // 縮放到目標尺寸
        const size = options?.size || 64
        const bounds = group.getBoundingRect()
        const scale = size / Math.max(bounds.width, bounds.height)
        group.scale(scale)

        ;(group as fabric.Group & { id: string }).id = `icon-${Date.now()}`

        canvas.add(group)
        canvas.setActiveObject(group)
        canvas.renderAll()
      })
    } catch (error) {
      console.error('Failed to add icon:', error)
    }
  }, [width, height])

  // ============================================
  // Add Illustration (colorful SVG)
  // ============================================
  const addIllustration = useCallback(async (svgString: string, options?: {
    x?: number
    y?: number
    size?: number
  }) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    try {
      // 使用 fabric 載入 SVG
      fabric.loadSVGFromString(svgString).then((result) => {
        const objects = result.objects.filter(Boolean) as fabric.FabricObject[]
        if (objects.length === 0) return

        const group = new fabric.Group(objects, {
          left: options?.x ?? width / 2,
          top: options?.y ?? height / 2,
          originX: 'center',
          originY: 'center',
        })

        // 縮放到目標尺寸（保持原始顏色，不改變）
        const size = options?.size || 100
        const bounds = group.getBoundingRect()
        const scale = size / Math.max(bounds.width, bounds.height)
        group.scale(scale)

        ;(group as fabric.Group & { id: string }).id = `illustration-${Date.now()}`

        canvas.add(group)
        canvas.setActiveObject(group)
        canvas.renderAll()
      })
    } catch (error) {
      console.error('Failed to add illustration:', error)
    }
  }, [width, height])

  // ============================================
  // Delete Selected
  // ============================================
  const deleteSelected = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length === 0) return

    activeObjects.forEach((obj) => canvas.remove(obj))
    canvas.discardActiveObject()
    canvas.renderAll()
  }, [])

  // ============================================
  // Copy/Cut/Paste
  // ============================================
  const copySelected = useCallback(async () => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length === 0) return

    // Clone objects using Fabric.js clone method
    const cloned: fabric.FabricObject[] = []
    for (const obj of activeObjects) {
      const clone = await obj.clone()
      cloned.push(clone)
    }
    clipboard = cloned
  }, [])

  const pasteClipboard = useCallback(async () => {
    const canvas = fabricCanvasRef.current
    if (!canvas || clipboard.length === 0) return

    for (const obj of clipboard) {
      const cloned = await obj.clone()
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      })
      ;(cloned as fabric.FabricObject & { id: string }).id = `paste-${Date.now()}-${Math.random()}`
      canvas.add(cloned)
    }

    canvas.renderAll()
  }, [])

  const cutSelected = useCallback(() => {
    copySelected()
    deleteSelected()
  }, [copySelected, deleteSelected])

  // ============================================
  // Move Selected (Arrow Keys)
  // ============================================
  const moveSelected = useCallback((dx: number, dy: number) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const activeObject = canvas.getActiveObject()
    if (!activeObject) return

    // 移動物件
    activeObject.set({
      left: (activeObject.left || 0) + dx,
      top: (activeObject.top || 0) + dy,
    })
    activeObject.setCoords()
    canvas.renderAll()

    // 標記已修改
    markDirty()
    saveToHistory()
  }, [markDirty, saveToHistory])

  // ============================================
  // Layer Operations
  // ============================================
  const bringForward = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      canvas.bringObjectForward(activeObject)
      canvas.renderAll()
    }
  }, [])

  const sendBackward = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      canvas.sendObjectBackwards(activeObject)
      canvas.renderAll()
    }
  }, [])

  const bringToFront = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      canvas.bringObjectToFront(activeObject)
      canvas.renderAll()
    }
  }, [])

  const sendToBack = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      canvas.sendObjectToBack(activeObject)
      canvas.renderAll()
    }
  }, [])

  // 獲取畫布上所有物件（由下到上排序）
  const getObjects = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return []
    return canvas.getObjects()
  }, [])

  // 根據 ID 選取物件
  const selectObjectById = useCallback((id: string) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const objects = canvas.getObjects()
    const target = objects.find(obj => (obj as fabric.FabricObject & { id?: string }).id === id)
    if (target) {
      canvas.setActiveObject(target)
      canvas.renderAll()
    }
  }, [])

  // ============================================
  // Alignment Operations
  // 支援單物件對齊畫布、多物件相對對齊
  // ============================================

  // 取得物件的實際邊界框（使用 Fabric.js 內建方法，確保考慮變換）
  const getObjectBoundingBox = useCallback((obj: fabric.FabricObject) => {
    const bound = obj.getBoundingRect()
    return {
      left: bound.left,
      top: bound.top,
      right: bound.left + bound.width,
      bottom: bound.top + bound.height,
      width: bound.width,
      height: bound.height,
      centerX: bound.left + bound.width / 2,
      centerY: bound.top + bound.height / 2,
    }
  }, [])

  // 移動物件到目標位置（以左上角為基準）
  // 這個方法計算需要移動的差值，適用於任何 origin 設定
  const moveObjectTo = useCallback((obj: fabric.FabricObject, targetLeft: number, targetTop: number) => {
    const currentBound = obj.getBoundingRect()
    const deltaX = targetLeft - currentBound.left
    const deltaY = targetTop - currentBound.top
    obj.set({
      left: (obj.left || 0) + deltaX,
      top: (obj.top || 0) + deltaY,
    })
    obj.setCoords()
  }, [])

  // 取得選中的物件陣列，並解除 ActiveSelection
  // 這樣每個物件的位置都是絕對座標，方便對齊操作
  const prepareObjectsForAlignment = useCallback((canvas: fabric.Canvas): {
    objects: fabric.FabricObject[]
    wasMultiSelect: boolean
  } => {
    const activeObject = canvas.getActiveObject()
    if (!activeObject) return { objects: [], wasMultiSelect: false }

    // 如果是 ActiveSelection（多選），需要解除群組
    if (activeObject.type === 'activeSelection') {
      const activeSelection = activeObject as fabric.ActiveSelection
      const objects = activeSelection.getObjects()

      // 解除選取（這會讓物件的位置變成絕對座標）
      canvas.discardActiveObject()

      // 更新每個物件的座標
      objects.forEach(obj => obj.setCoords())

      return { objects, wasMultiSelect: true }
    }

    // 單選
    return { objects: [activeObject], wasMultiSelect: false }
  }, [])

  // 重新建立多選
  const restoreMultiSelection = useCallback((canvas: fabric.Canvas, objects: fabric.FabricObject[]) => {
    if (objects.length > 1) {
      const selection = new fabric.ActiveSelection(objects, { canvas })
      canvas.setActiveObject(selection)
    } else if (objects.length === 1) {
      canvas.setActiveObject(objects[0])
    }
  }, [])

  const alignLeft = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const { objects, wasMultiSelect } = prepareObjectsForAlignment(canvas)
    if (objects.length === 0) return

    if (objects.length === 1) {
      // 單物件：對齊到畫布左邊
      const obj = objects[0]
      const box = getObjectBoundingBox(obj)
      moveObjectTo(obj, 0, box.top)
    } else {
      // 多物件：全部對齊到最左邊物件的左邊
      const boxes = objects.map(obj => ({ obj, box: getObjectBoundingBox(obj) }))
      const minLeft = Math.min(...boxes.map(b => b.box.left))
      boxes.forEach(({ obj, box }) => {
        moveObjectTo(obj, minLeft, box.top)
      })
    }

    // 恢復多選狀態
    if (wasMultiSelect) {
      restoreMultiSelection(canvas, objects)
    }
    canvas.renderAll()
    markDirty()
  }, [prepareObjectsForAlignment, getObjectBoundingBox, moveObjectTo, restoreMultiSelection, markDirty])

  const alignCenterH = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const { objects, wasMultiSelect } = prepareObjectsForAlignment(canvas)
    if (objects.length === 0) return

    if (objects.length === 1) {
      // 單物件：對齊到畫布水平中心
      const obj = objects[0]
      const box = getObjectBoundingBox(obj)
      moveObjectTo(obj, (width - box.width) / 2, box.top)
    } else {
      // 多物件：以選區的中心為基準對齊
      const boxes = objects.map(obj => ({ obj, box: getObjectBoundingBox(obj) }))
      const minLeft = Math.min(...boxes.map(b => b.box.left))
      const maxRight = Math.max(...boxes.map(b => b.box.right))
      const selectionCenterX = (minLeft + maxRight) / 2
      boxes.forEach(({ obj, box }) => {
        const newLeft = selectionCenterX - box.width / 2
        moveObjectTo(obj, newLeft, box.top)
      })
    }

    if (wasMultiSelect) {
      restoreMultiSelection(canvas, objects)
    }
    canvas.renderAll()
    markDirty()
  }, [width, prepareObjectsForAlignment, getObjectBoundingBox, moveObjectTo, restoreMultiSelection, markDirty])

  const alignRight = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const { objects, wasMultiSelect } = prepareObjectsForAlignment(canvas)
    if (objects.length === 0) return

    if (objects.length === 1) {
      // 單物件：對齊到畫布右邊
      const obj = objects[0]
      const box = getObjectBoundingBox(obj)
      moveObjectTo(obj, width - box.width, box.top)
    } else {
      // 多物件：全部對齊到最右邊物件的右邊
      const boxes = objects.map(obj => ({ obj, box: getObjectBoundingBox(obj) }))
      const maxRight = Math.max(...boxes.map(b => b.box.right))
      boxes.forEach(({ obj, box }) => {
        moveObjectTo(obj, maxRight - box.width, box.top)
      })
    }

    if (wasMultiSelect) {
      restoreMultiSelection(canvas, objects)
    }
    canvas.renderAll()
    markDirty()
  }, [width, prepareObjectsForAlignment, getObjectBoundingBox, moveObjectTo, restoreMultiSelection, markDirty])

  const alignTop = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const { objects, wasMultiSelect } = prepareObjectsForAlignment(canvas)
    if (objects.length === 0) return

    if (objects.length === 1) {
      // 單物件：對齊到畫布頂部
      const obj = objects[0]
      const box = getObjectBoundingBox(obj)
      moveObjectTo(obj, box.left, 0)
    } else {
      // 多物件：全部對齊到最上方物件的頂部
      const boxes = objects.map(obj => ({ obj, box: getObjectBoundingBox(obj) }))
      const minTop = Math.min(...boxes.map(b => b.box.top))
      boxes.forEach(({ obj, box }) => {
        moveObjectTo(obj, box.left, minTop)
      })
    }

    if (wasMultiSelect) {
      restoreMultiSelection(canvas, objects)
    }
    canvas.renderAll()
    markDirty()
  }, [prepareObjectsForAlignment, getObjectBoundingBox, moveObjectTo, restoreMultiSelection, markDirty])

  const alignCenterV = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const { objects, wasMultiSelect } = prepareObjectsForAlignment(canvas)
    if (objects.length === 0) return

    if (objects.length === 1) {
      // 單物件：對齊到畫布垂直中心
      const obj = objects[0]
      const box = getObjectBoundingBox(obj)
      moveObjectTo(obj, box.left, (height - box.height) / 2)
    } else {
      // 多物件：以選區的中心為基準對齊
      const boxes = objects.map(obj => ({ obj, box: getObjectBoundingBox(obj) }))
      const minTop = Math.min(...boxes.map(b => b.box.top))
      const maxBottom = Math.max(...boxes.map(b => b.box.bottom))
      const selectionCenterY = (minTop + maxBottom) / 2
      boxes.forEach(({ obj, box }) => {
        const newTop = selectionCenterY - box.height / 2
        moveObjectTo(obj, box.left, newTop)
      })
    }

    if (wasMultiSelect) {
      restoreMultiSelection(canvas, objects)
    }
    canvas.renderAll()
    markDirty()
  }, [height, prepareObjectsForAlignment, getObjectBoundingBox, moveObjectTo, restoreMultiSelection, markDirty])

  const alignBottom = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const { objects, wasMultiSelect } = prepareObjectsForAlignment(canvas)
    if (objects.length === 0) return

    if (objects.length === 1) {
      // 單物件：對齊到畫布底部
      const obj = objects[0]
      const box = getObjectBoundingBox(obj)
      moveObjectTo(obj, box.left, height - box.height)
    } else {
      // 多物件：全部對齊到最下方物件的底部
      const boxes = objects.map(obj => ({ obj, box: getObjectBoundingBox(obj) }))
      const maxBottom = Math.max(...boxes.map(b => b.box.bottom))
      boxes.forEach(({ obj, box }) => {
        moveObjectTo(obj, box.left, maxBottom - box.height)
      })
    }

    if (wasMultiSelect) {
      restoreMultiSelection(canvas, objects)
    }
    canvas.renderAll()
    markDirty()
  }, [height, prepareObjectsForAlignment, getObjectBoundingBox, moveObjectTo, restoreMultiSelection, markDirty])

  // ============================================
  // Distribute Operations (需要 3 個以上物件)
  // ============================================
  const distributeH = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const { objects, wasMultiSelect } = prepareObjectsForAlignment(canvas)
    if (objects.length < 3) return // 至少需要 3 個物件

    // 取得所有物件的邊界框
    const boxes = objects.map(obj => ({ obj, box: getObjectBoundingBox(obj) }))

    // 按照 x 座標排序
    boxes.sort((a, b) => a.box.left - b.box.left)

    // 計算最左和最右物件的位置
    const leftMost = boxes[0].box.left
    const rightMost = boxes[boxes.length - 1].box.right

    // 計算所有物件的總寬度（不包括第一個和最後一個的邊緣）
    const totalObjWidth = boxes.reduce((sum, b) => sum + b.box.width, 0)

    // 計算可用空間和間距
    const totalSpace = rightMost - leftMost
    const gapSpace = totalSpace - totalObjWidth
    const gap = gapSpace / (boxes.length - 1)

    // 分佈物件（第一個和最後一個保持不動）
    let currentX = leftMost + boxes[0].box.width + gap
    for (let i = 1; i < boxes.length - 1; i++) {
      const { obj, box } = boxes[i]
      moveObjectTo(obj, currentX, box.top)
      currentX += box.width + gap
    }

    if (wasMultiSelect) {
      restoreMultiSelection(canvas, objects)
    }
    canvas.renderAll()
    markDirty()
  }, [prepareObjectsForAlignment, getObjectBoundingBox, moveObjectTo, restoreMultiSelection, markDirty])

  const distributeV = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const { objects, wasMultiSelect } = prepareObjectsForAlignment(canvas)
    if (objects.length < 3) return // 至少需要 3 個物件

    // 取得所有物件的邊界框
    const boxes = objects.map(obj => ({ obj, box: getObjectBoundingBox(obj) }))

    // 按照 y 座標排序
    boxes.sort((a, b) => a.box.top - b.box.top)

    // 計算最上和最下物件的位置
    const topMost = boxes[0].box.top
    const bottomMost = boxes[boxes.length - 1].box.bottom

    // 計算所有物件的總高度
    const totalObjHeight = boxes.reduce((sum, b) => sum + b.box.height, 0)

    // 計算可用空間和間距
    const totalSpace = bottomMost - topMost
    const gapSpace = totalSpace - totalObjHeight
    const gap = gapSpace / (boxes.length - 1)

    // 分佈物件（第一個和最後一個保持不動）
    let currentY = topMost + boxes[0].box.height + gap
    for (let i = 1; i < boxes.length - 1; i++) {
      const { obj, box } = boxes[i]
      moveObjectTo(obj, box.left, currentY)
      currentY += box.height + gap
    }

    if (wasMultiSelect) {
      restoreMultiSelection(canvas, objects)
    }
    canvas.renderAll()
    markDirty()
  }, [prepareObjectsForAlignment, getObjectBoundingBox, moveObjectTo, restoreMultiSelection, markDirty])

  // ============================================
  // Group Operations
  // ============================================
  const groupSelected = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const activeSelection = canvas.getActiveObject()
    if (!activeSelection || activeSelection.type !== 'activeSelection') return

    // Get all selected objects
    const objects = (activeSelection as fabric.ActiveSelection).getObjects()
    if (objects.length < 2) return

    // Remove from canvas
    objects.forEach((obj) => canvas.remove(obj))

    // Create group
    const group = new fabric.Group(objects)
    ;(group as fabric.Group & { id: string }).id = `group-${Date.now()}`

    canvas.add(group)
    canvas.setActiveObject(group)
    canvas.renderAll()
  }, [])

  const ungroupSelected = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const activeObject = canvas.getActiveObject()
    if (!activeObject || activeObject.type !== 'group') return

    const group = activeObject as fabric.Group
    const items = group.getObjects()

    // Calculate absolute positions
    const groupLeft = group.left || 0
    const groupTop = group.top || 0

    // Remove group
    canvas.remove(group)

    // Add items back with correct positions
    items.forEach((item) => {
      item.set({
        left: groupLeft + (item.left || 0),
        top: groupTop + (item.top || 0),
      })
      canvas.add(item)
    })

    canvas.renderAll()
  }, [])

  // ============================================
  // Flip Operations
  // ============================================
  const flipHorizontal = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const activeObject = canvas.getActiveObject()
    if (!activeObject) return

    // 切換 flipX 狀態
    activeObject.set('flipX', !activeObject.flipX)
    canvas.renderAll()
    markDirty()
  }, [markDirty])

  const flipVertical = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const activeObject = canvas.getActiveObject()
    if (!activeObject) return

    // 切換 flipY 狀態
    activeObject.set('flipY', !activeObject.flipY)
    canvas.renderAll()
    markDirty()
  }, [markDirty])

  // ============================================
  // Lock Toggle
  // ============================================
  const toggleLock = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const activeObject = canvas.getActiveObject()
    if (!activeObject) return

    const isLocked = !activeObject.selectable
    activeObject.set({
      selectable: isLocked,
      evented: isLocked,
      lockMovementX: !isLocked,
      lockMovementY: !isLocked,
      lockScalingX: !isLocked,
      lockScalingY: !isLocked,
      lockRotation: !isLocked,
    })

    canvas.discardActiveObject()
    canvas.renderAll()
  }, [])

  // ============================================
  // Zoom Operations
  // 注意：縮放只使用 CSS transform 顯示，不影響 canvas 內部座標
  // 這樣可以避免雙重縮放問題，且匯出時保持原始尺寸
  // ============================================
  const setZoom = useCallback((newZoom: number) => {
    const clampedZoom = Math.max(0.25, Math.min(3, newZoom))
    setZoomState(clampedZoom)
    // 不呼叫 canvas.setZoom()，只用 CSS transform 顯示
  }, [])

  const zoomIn = useCallback(() => setZoom(zoom + 0.1), [zoom, setZoom])
  const zoomOut = useCallback(() => setZoom(zoom - 0.1), [zoom, setZoom])
  const resetZoom = useCallback(() => setZoom(1), [setZoom])

  // 自動適應容器大小
  const fitToContainer = useCallback((containerWidth: number, containerHeight: number, padding = 64) => {
    // 計算可用空間（扣除 padding）
    const availableWidth = containerWidth - padding * 2
    const availableHeight = containerHeight - padding * 2

    // 計算需要的縮放比例（取較小值以確保完整顯示）
    const scaleX = availableWidth / width
    const scaleY = availableHeight / height
    const fitZoom = Math.min(scaleX, scaleY)

    // 設定縮放（會被 clamp 到 0.25-3 範圍）
    setZoom(fitZoom)
  }, [width, height, setZoom])

  // ============================================
  // Undo/Redo Operations
  // ============================================
  const undo = useCallback(async () => {
    const canvas = fabricCanvasRef.current
    const history = historyRef.current
    if (!canvas || history.index <= 0) return

    // 確保沒有待處理的防抖保存
    if (saveHistoryTimeoutRef.current) {
      clearTimeout(saveHistoryTimeoutRef.current)
      saveHistoryTimeoutRef.current = null
    }

    isUndoRedoRef.current = true
    history.index--

    try {
      await canvas.loadFromJSON(JSON.parse(history.stack[history.index]))
      applyControlStyles(canvas)
      canvas.renderAll()
      updateHistoryState()
    } finally {
      isUndoRedoRef.current = false
    }
  }, [updateHistoryState, applyControlStyles])

  const redo = useCallback(async () => {
    const canvas = fabricCanvasRef.current
    const history = historyRef.current
    if (!canvas || history.index >= history.stack.length - 1) return

    isUndoRedoRef.current = true
    history.index++

    try {
      await canvas.loadFromJSON(JSON.parse(history.stack[history.index]))
      applyControlStyles(canvas)
      canvas.renderAll()
      updateHistoryState()
    } finally {
      isUndoRedoRef.current = false
    }
  }, [updateHistoryState, applyControlStyles])

  // ============================================
  // Cleanup on unmount
  // ============================================
  useEffect(() => {
    return () => {
      // 清理防抖計時器
      if (saveHistoryTimeoutRef.current) {
        clearTimeout(saveHistoryTimeoutRef.current)
      }
      // 清理畫布
      disposeCanvas()
    }
  }, [disposeCanvas])

  // ============================================
  // Update Element by Name (直接更新畫布上的元素，支援群組內元素)
  // ============================================
  const updateElementByName = useCallback((elementName: string, updates: { text?: string }) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return false

    const objects = canvas.getObjects()

    // 先在頂層尋找
    let targetObj = objects.find(obj => {
      const fabricObj = obj as fabric.FabricObject & { name?: string }
      return fabricObj.name === elementName
    })

    // 如果頂層找不到，搜尋群組內的元素
    if (!targetObj) {
      for (const obj of objects) {
        if (obj.type === 'group') {
          const group = obj as fabric.Group
          const groupObjects = group.getObjects()
          const found = groupObjects.find(item => {
            const fabricItem = item as fabric.FabricObject & { name?: string }
            return fabricItem.name === elementName
          })
          if (found) {
            targetObj = found
            break
          }
        }
      }
    }

    if (targetObj && updates.text !== undefined) {
      // 如果是 Textbox，更新文字內容
      const textObj = targetObj as fabric.Textbox
      if (textObj.set && typeof textObj.text !== 'undefined') {
        textObj.set('text', updates.text)
        canvas.renderAll()
        markDirty()
        return true
      }
    }

    return false
  }, [markDirty])

  // ============================================
  // Remove Object by Name (通過名稱刪除物件)
  // ============================================
  const removeObjectByName = useCallback((elementName: string) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return false

    const objects = canvas.getObjects()
    const targetObj = objects.find(obj => {
      const fabricObj = obj as fabric.FabricObject & { name?: string }
      return fabricObj.name === elementName
    })

    if (targetObj) {
      canvas.remove(targetObj)
      canvas.renderAll()
      markDirty()
      return true
    }

    return false
  }, [markDirty])

  // ============================================
  // Get Object by Name (通過名稱取得物件)
  // ============================================
  const getObjectByName = useCallback((elementName: string) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return null

    const objects = canvas.getObjects()
    const targetObj = objects.find(obj => {
      const fabricObj = obj as fabric.FabricObject & { name?: string }
      return fabricObj.name === elementName
    })

    return targetObj || null
  }, [])

  // ============================================
  // Return
  // ============================================
  return {
    canvasRef,
    canvas: fabricCanvasRef.current,
    isCanvasReady,

    initCanvas,
    disposeCanvas,
    loadCanvasData,
    loadCanvasElements,
    loadCanvasPage,
    exportCanvasData,
    exportThumbnail,
    updateElementByName,
    removeObjectByName,
    getObjectByName,

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

    selectedObjectIds,
    deleteSelected,
    copySelected,
    pasteClipboard,
    cutSelected,
    moveSelected,

    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    getObjects,
    selectObjectById,

    alignLeft,
    alignCenterH,
    alignRight,
    alignTop,
    alignCenterV,
    alignBottom,

    distributeH,
    distributeV,

    groupSelected,
    ungroupSelected,

    flipHorizontal,
    flipVertical,

    toggleLock,

    undo,
    redo,
    canUndo,
    canRedo,
    saveCurrentPageHistory,
    loadPageHistory,
    initPageHistory,

    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToContainer,
  }
}
