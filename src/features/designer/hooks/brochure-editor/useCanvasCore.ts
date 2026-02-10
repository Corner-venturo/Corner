'use client'

import { useRef, useCallback, useState } from 'react'
import * as fabric from 'fabric'
import type { TextEditEvent, FabricObjectWithId, FabricObjectWithData, FabricGuideLine } from './types'

/**
 * useCanvasCore - Canvas 核心初始化 Hook
 * 
 * 功能：
 * - Canvas 初始化和銷毀
 * - 全域控制點樣式設定
 * - 事件綁定（選取、文字編輯、對齊參考線）
 */

interface UseCanvasCoreOptions {
  width: number
  height: number
  onReady?: () => void
  onTextEditRef: React.RefObject<((event: TextEditEvent) => void) | undefined>
  markDirty: () => void
  saveToHistory: () => void
}

interface UseCanvasCoreReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  fabricCanvasRef: React.RefObject<fabric.Canvas | null>
  isCanvasReady: boolean
  selectedObjectIds: string[]
  initCanvas: () => void
  disposeCanvas: () => void
  applyControlStyles: (canvas: fabric.Canvas) => void
}

const SNAP_THRESHOLD = 8 // 吸附閾值（像素）

export function useCanvasCore(options: UseCanvasCoreOptions): UseCanvasCoreReturn {
  const { width, height, onReady, onTextEditRef, markDirty, saveToHistory } = options

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const [isCanvasReady, setIsCanvasReady] = useState(false)
  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([])

  // ============================================
  // Apply Control Styles
  // ============================================
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

  // ============================================
  // Get Object ID Helper
  // ============================================
  const getObjectId = useCallback((obj: fabric.FabricObject): string | undefined => {
    // 優先從 obj.id 讀取（手動添加的元素）
    const directId = (obj as FabricObjectWithId).id
    if (directId) return directId
    // 其次從 data.elementId 讀取（renderer 渲染的元素）
    const dataId = (obj as FabricObjectWithData).data?.elementId as string | undefined
    return dataId
  }, [])

  // ============================================
  // Initialize Canvas
  // ============================================
  const initCanvas = useCallback(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return

    // 設定全域控制點樣式
    fabric.FabricObject.prototype.cornerSize = 6
    fabric.FabricObject.prototype.cornerStyle = 'circle'
    fabric.FabricObject.prototype.cornerColor = '#c9aa7c'
    fabric.FabricObject.prototype.cornerStrokeColor = '#ffffff'
    fabric.FabricObject.prototype.transparentCorners = false
    fabric.FabricObject.prototype.borderColor = '#c9aa7c'
    fabric.FabricObject.prototype.borderScaleFactor = 1
    fabric.FabricObject.prototype.padding = 2

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

    // 選取事件
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
    // 文字編輯完成事件（雙向綁定用）
    // ============================================
    canvas.on('text:editing:exited', (e) => {
      const target = e.target as fabric.FabricObject & {
        text?: string
        id?: string
        name?: string
        data?: { elementId?: string; elementName?: string }
      }
      if (!target) return

      const elementId = target.id || target.data?.elementId || ''
      const elementName = target.name || target.data?.elementName || ''
      const newContent = target.text || ''

      if (onTextEditRef.current && (elementId || elementName)) {
        onTextEditRef.current({
          elementId,
          elementName,
          newContent,
        })
      }
    })

    // ============================================
    // 對齊參考線功能
    // ============================================
    const guideLines: fabric.Line[] = []

    const createGuideLine = (coords: [number, number, number, number]) => {
      const line = new fabric.Line(coords, {
        stroke: '#c9aa7c',
        strokeWidth: 1,
        strokeDashArray: [4, 4],
        selectable: false,
        evented: false,
        excludeFromExport: true,
      }) as FabricGuideLine
      line.isGuideLine = true
      return line
    }

    const clearGuideLines = () => {
      guideLines.forEach(line => canvas.remove(line))
      guideLines.length = 0
    }

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

    let lastSnapX: number | null = null
    let lastSnapY: number | null = null

    canvas.on('object:moving', (e) => {
      const movingObj = e.target
      if (!movingObj) return

      const movingEdges = getObjEdges(movingObj)
      const canvasWidth = width
      const canvasHeight = height

      // 參考點（畫布邊界和中心）
      const snapPoints = {
        vertical: [0, canvasWidth / 2, canvasWidth],
        horizontal: [0, canvasHeight / 2, canvasHeight],
      }

      // 收集其他物件的邊緣（限制數量）
      const otherObjects = canvas.getObjects().filter(obj => {
        const isGuideLine = (obj as FabricGuideLine).isGuideLine
        return obj !== movingObj && !isGuideLine && obj.type !== 'activeSelection'
      }).slice(0, 20)

      otherObjects.forEach(obj => {
        const edges = getObjEdges(obj)
        snapPoints.vertical.push(edges.left, edges.right, edges.centerX)
        snapPoints.horizontal.push(edges.top, edges.bottom, edges.centerY)
      })

      let snappedLeft: number | null = null
      let snappedTop: number | null = null
      let snapXPos: number | null = null
      let snapYPos: number | null = null

      // 檢查垂直對齊
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

      // 檢查水平對齊
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

    // 移動結束時清除參考線
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
  }, [width, height, markDirty, saveToHistory, onReady, getObjectId, onTextEditRef])

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

  return {
    canvasRef,
    fabricCanvasRef,
    isCanvasReady,
    selectedObjectIds,
    initCanvas,
    disposeCanvas,
    applyControlStyles,
  }
}
