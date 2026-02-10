'use client'

import type * as fabric from 'fabric'

/**
 * Brochure Editor Types
 * 手冊編輯器相關類型定義
 */

// ============================================
// Text Edit Event
// ============================================

/** 文字編輯完成時的 callback 參數 */
export interface TextEditEvent {
  elementId: string
  elementName: string
  newContent: string
}

// ============================================
// Options Types
// ============================================

export interface UseBrochureEditorV2Options {
  width?: number
  height?: number
  initialZoom?: number
  onReady?: () => void
  /** 文字編輯完成時的 callback（用於雙向綁定） */
  onTextEdit?: (event: TextEditEvent) => void
}

// ============================================
// History Types
// ============================================

/** 每頁獨立的歷史記錄 */
export interface PageHistory {
  stack: string[]
  index: number
}

/** 歷史記錄管理 hook 的 options */
export interface UseCanvasHistoryOptions {
  maxSize?: number
  debounceMs?: number
}

/** 歷史記錄管理 hook 的返回值 */
export interface UseCanvasHistoryReturn {
  canUndo: boolean
  canRedo: boolean
  saveToHistory: () => void
  saveToHistoryImmediate: () => void
  saveCurrentPageHistory: () => void
  loadPageHistory: (pageId: string) => void
  initPageHistory: (pageId: string) => void
  undo: (canvas: fabric.Canvas | null, applyControlStyles: (canvas: fabric.Canvas) => void) => Promise<void>
  redo: (canvas: fabric.Canvas | null, applyControlStyles: (canvas: fabric.Canvas) => void) => Promise<void>
  isUndoRedoRef: React.RefObject<boolean>
  clearPendingTimeout: () => void
}

// ============================================
// Core Types
// ============================================

export interface UseCanvasCoreOptions {
  width: number
  height: number
  onReady?: () => void
  onTextEdit?: (event: TextEditEvent) => void
  markDirty: () => void
  saveToHistory: () => void
}

export interface UseCanvasCoreReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  fabricCanvasRef: React.RefObject<fabric.Canvas | null>
  isCanvasReady: boolean
  selectedObjectIds: string[]
  initCanvas: () => void
  disposeCanvas: () => void
  applyControlStyles: (canvas: fabric.Canvas) => void
}

// ============================================
// IO Types
// ============================================

export interface UseCanvasIOOptions {
  width: number
  height: number
}

export interface UseCanvasIOReturn {
  loadCanvasData: (canvas: fabric.Canvas | null, data: Record<string, unknown>, applyControlStyles: (c: fabric.Canvas) => void) => Promise<void>
  loadCanvasElements: (canvas: fabric.Canvas | null, elements: import('@/features/designer/components/types').CanvasElement[]) => Promise<void>
  loadCanvasPage: (canvas: fabric.Canvas | null, page: import('@/features/designer/components/types').CanvasPage, applyControlStyles: (c: fabric.Canvas) => void) => Promise<void>
  exportCanvasData: (canvas: fabric.Canvas | null) => Record<string, unknown>
  exportThumbnail: (canvas: fabric.Canvas | null, options?: { quality?: number; multiplier?: number }) => string
}

// ============================================
// Elements Types
// ============================================

export interface AddTextOptions {
  content?: string
  x?: number
  y?: number
}

export interface AddRectangleOptions {
  x?: number
  y?: number
  width?: number
  height?: number
}

export interface AddCircleOptions {
  x?: number
  y?: number
  radius?: number
}

export interface AddEllipseOptions {
  x?: number
  y?: number
  rx?: number
  ry?: number
}

export interface AddTriangleOptions {
  x?: number
  y?: number
  width?: number
  height?: number
}

export interface AddImageOptions {
  x?: number
  y?: number
}

export interface AddLineOptions {
  style?: 'solid' | 'dashed' | 'dotted'
  arrow?: boolean
}

export interface AddStickerOptions {
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
  viewBox?: { width: number; height: number }
}

export interface AddIconOptions {
  x?: number
  y?: number
  size?: number
  color?: string
  keepOriginalColor?: boolean
}

export interface AddIllustrationOptions {
  x?: number
  y?: number
  size?: number
}

export interface AddTimelineOptions {
  x?: number
  y?: number
  pointCount?: number
  orientation?: 'vertical' | 'horizontal'
}

// ============================================
// Transform Types
// ============================================

export interface BoundingBox {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
  centerX: number
  centerY: number
}

// ============================================
// Extended Fabric Types
// ============================================

/** Fabric object with custom id property */
export type FabricObjectWithId = fabric.FabricObject & { id?: string }

/** Fabric object with custom name property */
export type FabricObjectWithName = fabric.FabricObject & { name?: string }

/** Fabric object with custom data property */
export type FabricObjectWithData = fabric.FabricObject & { data?: Record<string, unknown> }

/** Fabric object with all custom properties */
export type FabricObjectExtended = fabric.FabricObject & {
  id?: string
  name?: string
  data?: Record<string, unknown>
  text?: string
}

/** Fabric object that is a guide line */
export type FabricGuideLine = fabric.Line & { isGuideLine?: boolean }
