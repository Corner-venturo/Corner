'use client'

/**
 * useBrochureEditorV2 - 簡化版手冊編輯器 Hook
 *
 * 核心理念：
 * - 編輯時純 Fabric.js 操作，不觸發 React re-render
 * - 只追蹤 isDirty 狀態
 * - 載入時完整渲染，不做增量更新
 * - 儲存時導出 canvas JSON
 * 
 * 架構：
 * - 拆分為多個子 hooks，各負責獨立功能
 * - 此檔案負責組合所有子 hooks
 */

import { useRef, useCallback, useEffect } from 'react'
import type * as fabric from 'fabric'
import { useDocumentStore } from '@/stores/document-store'
import type { CanvasElement, CanvasPage } from '@/features/designer/components/types'

// Import sub-hooks
import {
  type TextEditEvent,
  type UseBrochureEditorV2Options,
  type AddTextOptions,
  type AddRectangleOptions,
  type AddCircleOptions,
  type AddEllipseOptions,
  type AddTriangleOptions,
  type AddImageOptions,
  type AddLineOptions,
  type AddStickerOptions,
  type AddIconOptions,
  type AddIllustrationOptions,
  type AddTimelineOptions,
  useCanvasHistory,
  useCanvasCore,
  useCanvasIO,
  useCanvasElements,
  useCanvasTimeline,
  useCanvasSelection,
  useCanvasLayers,
  useCanvasAlignment,
  useCanvasTransform,
  useCanvasZoom,
} from './brochure-editor'

// ============================================
// Return Type
// ============================================

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
  addText: (options?: AddTextOptions) => void
  addRectangle: (options?: AddRectangleOptions) => void
  addCircle: (options?: AddCircleOptions) => void
  addEllipse: (options?: AddEllipseOptions) => void
  addTriangle: (options?: AddTriangleOptions) => void
  addImage: (url: string, options?: AddImageOptions) => Promise<void>
  addLine: (options?: AddLineOptions) => void
  addSticker: (pathData: string, options?: AddStickerOptions) => void
  addIcon: (iconName: string, options?: AddIconOptions) => Promise<void>
  addIllustration: (svgString: string, options?: AddIllustrationOptions) => Promise<void>
  addTimeline: (options?: AddTimelineOptions) => void
  addTimelinePoint: () => void

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

  // 頁面歷史管理
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
// Hook
// ============================================

export function useBrochureEditorV2(
  options: UseBrochureEditorV2Options = {}
): UseBrochureEditorV2Return {
  const { width = 559, height = 794, initialZoom = 1, onReady, onTextEdit } = options

  // 使用 ref 存儲 callback 避免 stale closure
  const onTextEditRef = useRef<((event: TextEditEvent) => void) | undefined>(onTextEdit)
  onTextEditRef.current = onTextEdit

  // Document store for isDirty tracking
  const setIsDirty = useDocumentStore((s) => s.setIsDirty)

  const markDirty = useCallback(() => {
    setIsDirty(true)
  }, [setIsDirty])

  // ============================================
  // Sub-hooks: Core (needs getCanvas from history)
  // ============================================
  
  // History hook (needs getCanvas function)
  const getCanvas = useCallback(() => fabricCanvasRef.current, [])
  
  const history = useCanvasHistory(getCanvas, {
    maxSize: 30,
    debounceMs: 300,
  })

  // Core hook
  const core = useCanvasCore({
    width,
    height,
    onReady,
    onTextEditRef,
    markDirty,
    saveToHistory: history.saveToHistory,
  })

  // Alias for easier access
  const { fabricCanvasRef } = core

  // ============================================
  // Sub-hooks: IO
  // ============================================
  const io = useCanvasIO({ width, height })

  // ============================================
  // Sub-hooks: Elements
  // ============================================
  const elements = useCanvasElements({
    width,
    height,
    getCanvas,
  })

  // ============================================
  // Sub-hooks: Timeline
  // ============================================
  const timeline = useCanvasTimeline({ getCanvas })

  // ============================================
  // Sub-hooks: Selection
  // ============================================
  const selection = useCanvasSelection({
    getCanvas,
    markDirty,
    saveToHistory: history.saveToHistory,
  })

  // ============================================
  // Sub-hooks: Layers
  // ============================================
  const layers = useCanvasLayers({ getCanvas })

  // ============================================
  // Sub-hooks: Alignment
  // ============================================
  const alignment = useCanvasAlignment({
    width,
    height,
    getCanvas,
    markDirty,
  })

  // ============================================
  // Sub-hooks: Transform
  // ============================================
  const transform = useCanvasTransform({
    getCanvas,
    markDirty,
  })

  // ============================================
  // Sub-hooks: Zoom
  // ============================================
  const zoom = useCanvasZoom({
    width,
    height,
    initialZoom,
  })

  // ============================================
  // Wrapped IO functions (bind canvas)
  // ============================================
  const loadCanvasData = useCallback(async (data: Record<string, unknown>) => {
    await io.loadCanvasData(fabricCanvasRef.current, data, core.applyControlStyles)
  }, [io, fabricCanvasRef, core.applyControlStyles])

  const loadCanvasElements = useCallback(async (elementsData: CanvasElement[]) => {
    await io.loadCanvasElements(fabricCanvasRef.current, elementsData)
  }, [io, fabricCanvasRef])

  const loadCanvasPage = useCallback(async (page: CanvasPage) => {
    await io.loadCanvasPage(fabricCanvasRef.current, page, core.applyControlStyles)
  }, [io, fabricCanvasRef, core.applyControlStyles])

  const exportCanvasData = useCallback(() => {
    return io.exportCanvasData(fabricCanvasRef.current)
  }, [io, fabricCanvasRef])

  const exportThumbnail = useCallback((opts?: { quality?: number; multiplier?: number }) => {
    return io.exportThumbnail(fabricCanvasRef.current, opts)
  }, [io, fabricCanvasRef])

  // ============================================
  // Wrapped History functions (bind canvas)
  // ============================================
  const undo = useCallback(async () => {
    await history.undo(fabricCanvasRef.current, core.applyControlStyles)
  }, [history, fabricCanvasRef, core.applyControlStyles])

  const redo = useCallback(async () => {
    await history.redo(fabricCanvasRef.current, core.applyControlStyles)
  }, [history, fabricCanvasRef, core.applyControlStyles])

  // ============================================
  // Cleanup on unmount
  // ============================================
  useEffect(() => {
    return () => {
      history.clearPendingTimeout()
      core.disposeCanvas()
    }
  }, [history, core])

  // ============================================
  // Return
  // ============================================
  return {
    canvasRef: core.canvasRef,
    canvas: fabricCanvasRef.current,
    isCanvasReady: core.isCanvasReady,

    initCanvas: core.initCanvas,
    disposeCanvas: core.disposeCanvas,
    loadCanvasData,
    loadCanvasElements,
    loadCanvasPage,
    exportCanvasData,
    exportThumbnail,
    updateElementByName: selection.updateElementByName,
    removeObjectByName: selection.removeObjectByName,
    getObjectByName: selection.getObjectByName,

    addText: elements.addText,
    addRectangle: elements.addRectangle,
    addCircle: elements.addCircle,
    addEllipse: elements.addEllipse,
    addTriangle: elements.addTriangle,
    addImage: elements.addImage,
    addLine: elements.addLine,
    addSticker: elements.addSticker,
    addIcon: elements.addIcon,
    addIllustration: elements.addIllustration,
    addTimeline: timeline.addTimeline,
    addTimelinePoint: timeline.addTimelinePoint,

    selectedObjectIds: core.selectedObjectIds,
    deleteSelected: selection.deleteSelected,
    copySelected: selection.copySelected,
    pasteClipboard: selection.pasteClipboard,
    cutSelected: selection.cutSelected,
    moveSelected: selection.moveSelected,

    bringForward: layers.bringForward,
    sendBackward: layers.sendBackward,
    bringToFront: layers.bringToFront,
    sendToBack: layers.sendToBack,
    getObjects: layers.getObjects,
    selectObjectById: layers.selectObjectById,

    alignLeft: alignment.alignLeft,
    alignCenterH: alignment.alignCenterH,
    alignRight: alignment.alignRight,
    alignTop: alignment.alignTop,
    alignCenterV: alignment.alignCenterV,
    alignBottom: alignment.alignBottom,

    distributeH: alignment.distributeH,
    distributeV: alignment.distributeV,

    groupSelected: transform.groupSelected,
    ungroupSelected: transform.ungroupSelected,

    flipHorizontal: transform.flipHorizontal,
    flipVertical: transform.flipVertical,

    toggleLock: transform.toggleLock,

    undo,
    redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    saveCurrentPageHistory: history.saveCurrentPageHistory,
    loadPageHistory: history.loadPageHistory,
    initPageHistory: history.initPageHistory,

    zoom: zoom.zoom,
    setZoom: zoom.setZoom,
    zoomIn: zoom.zoomIn,
    zoomOut: zoom.zoomOut,
    resetZoom: zoom.resetZoom,
    fitToContainer: zoom.fitToContainer,
  }
}

// Re-export types for convenience
export type { UseBrochureEditorV2Options, TextEditEvent } from './brochure-editor'
