/**
 * Canvas Sync Utilities
 * 提供 Fabric.js Canvas 和 Schema 之間的雙向同步功能
 *
 * 職責：
 * 1. 從 Schema 載入元素到 Canvas
 * 2. 從 Canvas 同步變更回 Schema
 * 3. 處理元素選擇、移動、縮放、旋轉的同步
 */

import type { Canvas as FabricCanvas, FabricObject } from 'fabric'
import type { CanvasElement, TextElement, ImageElement, ShapeElement } from '../canvas-editor/types'

// ============================================================================
// 類型定義
// ============================================================================

/** 基礎位置/尺寸屬性（不含 type 等鑑別欄位） */
interface BasePositionProps {
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
}

/** Canvas 變更事件 */
export interface CanvasChangeEvent {
  type: 'add' | 'remove' | 'modify' | 'select' | 'deselect'
  elementId: string
  changes?: Partial<CanvasElement>
}

/** Canvas 同步配置 */
export interface CanvasSyncConfig {
  /** 是否自動同步 */
  autoSync?: boolean
  /** 同步防抖時間 (ms) */
  debounceMs?: number
  /** 變更回調 */
  onChange?: (events: CanvasChangeEvent[]) => void
}

// ============================================================================
// 從 Fabric Object 提取元素資料
// ============================================================================

/**
 * 從 Fabric Object 提取基礎屬性
 */
export function extractBaseProps(obj: FabricObject): BasePositionProps {
  const { left = 0, top = 0, width = 0, height = 0, angle = 0, opacity = 1, scaleX = 1, scaleY = 1 } = obj

  return {
    x: left,
    y: top,
    width: width * scaleX,
    height: height * scaleY,
    rotation: angle,
    opacity,
  }
}

/**
 * 從 Fabric Text 提取文字屬性
 */
export function extractTextProps(obj: FabricObject): Partial<TextElement> {
  const baseProps = extractBaseProps(obj)

  // 檢查是否為文字物件
  if (obj.type !== 'textbox' && obj.type !== 'text' && obj.type !== 'i-text') {
    return baseProps as Partial<TextElement>
  }

  const textObj = obj as FabricObject & {
    text?: string
    fontFamily?: string
    fontSize?: number
    fontWeight?: string
    fontStyle?: string
    textAlign?: string
    lineHeight?: number
    charSpacing?: number
    fill?: string
    underline?: boolean
  }

  return {
    ...baseProps,
    content: textObj.text || '',
    style: {
      fontFamily: textObj.fontFamily || 'Noto Sans TC',
      fontSize: textObj.fontSize || 16,
      fontWeight: (textObj.fontWeight || 'normal') as TextElement['style']['fontWeight'],
      fontStyle: (textObj.fontStyle || 'normal') as 'normal' | 'italic',
      textAlign: (textObj.textAlign || 'left') as 'left' | 'center' | 'right',
      lineHeight: textObj.lineHeight || 1.2,
      letterSpacing: (textObj.charSpacing || 0) / 1000, // Fabric 使用 1/1000 em
      color: (textObj.fill as string) || '#333333',
      textDecoration: textObj.underline ? 'underline' : 'none',
    },
  }
}

/**
 * 從 Fabric Image 提取圖片屬性
 */
export function extractImageProps(obj: FabricObject): Partial<ImageElement> {
  const baseProps = extractBaseProps(obj)

  // 檢查是否為圖片物件
  if (obj.type !== 'image') {
    return baseProps as Partial<ImageElement>
  }

  const imgObj = obj as FabricObject & {
    _element?: HTMLImageElement
    cropX?: number
    cropY?: number
    filters?: unknown[]
  }

  return {
    ...baseProps,
    src: imgObj._element?.src || '',
    cropX: imgObj.cropX || 0,
    cropY: imgObj.cropY || 0,
  }
}

/**
 * 從 Fabric Rect/Shape 提取形狀屬性
 */
export function extractShapeProps(obj: FabricObject): Partial<ShapeElement> {
  const baseProps = extractBaseProps(obj)

  const shapeObj = obj as FabricObject & {
    fill?: string | { type?: string }
    stroke?: string
    strokeWidth?: number
    rx?: number
    ry?: number
  }

  return {
    ...baseProps,
    fill: typeof shapeObj.fill === 'string' ? shapeObj.fill : 'transparent',
    stroke: shapeObj.stroke || 'transparent',
    strokeWidth: shapeObj.strokeWidth || 0,
    cornerRadius: shapeObj.rx || 0,
  }
}

// ============================================================================
// 從 Schema 元素建立 Fabric Object 選項
// ============================================================================

/**
 * 取得文字元素的 Fabric 選項
 */
export function getTextFabricOptions(element: TextElement): Record<string, unknown> {
  return {
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    angle: element.rotation,
    opacity: element.opacity,
    text: element.content,
    fontFamily: element.style.fontFamily,
    fontSize: element.style.fontSize,
    fontWeight: element.style.fontWeight,
    fontStyle: element.style.fontStyle,
    textAlign: element.style.textAlign,
    lineHeight: element.style.lineHeight,
    charSpacing: element.style.letterSpacing * 1000, // 轉換為 Fabric 格式
    fill: element.style.color,
    underline: element.style.textDecoration === 'underline',
    selectable: !element.locked,
    visible: element.visible,
    // 自訂屬性
    elementId: element.id,
    elementName: element.name,
    elementType: 'text',
  }
}

/**
 * 取得圖片元素的 Fabric 選項
 */
export function getImageFabricOptions(element: ImageElement): Record<string, unknown> {
  return {
    left: element.x,
    top: element.y,
    angle: element.rotation,
    opacity: element.opacity,
    selectable: !element.locked,
    visible: element.visible,
    // 自訂屬性
    elementId: element.id,
    elementName: element.name,
    elementType: 'image',
  }
}

/**
 * 取得形狀元素的 Fabric 選項
 */
export function getShapeFabricOptions(element: ShapeElement): Record<string, unknown> {
  return {
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    angle: element.rotation,
    opacity: element.opacity,
    fill: element.fill,
    stroke: element.stroke,
    strokeWidth: element.strokeWidth,
    rx: element.cornerRadius,
    ry: element.cornerRadius,
    selectable: !element.locked,
    visible: element.visible,
    // 自訂屬性
    elementId: element.id,
    elementName: element.name,
    elementType: 'shape',
  }
}

// ============================================================================
// Canvas 事件監聽器
// ============================================================================

/**
 * 設置 Canvas 變更監聽
 */
export function setupCanvasListeners(
  canvas: FabricCanvas,
  onChange: (events: CanvasChangeEvent[]) => void
): () => void {
  const pendingChanges: CanvasChangeEvent[] = []
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const flushChanges = () => {
    if (pendingChanges.length > 0) {
      onChange([...pendingChanges])
      pendingChanges.length = 0
    }
  }

  const scheduleFlush = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(flushChanges, 100)
  }

  // 物件修改事件
  const handleObjectModified = (e: { target?: FabricObject }) => {
    if (!e.target) return

    const obj = e.target
    const elementId = (obj as FabricObject & { elementId?: string }).elementId
    if (!elementId) return

    let changes: Partial<CanvasElement>

    const elementType = (obj as FabricObject & { elementType?: string }).elementType
    switch (elementType) {
      case 'text':
        changes = extractTextProps(obj)
        break
      case 'image':
        changes = extractImageProps(obj)
        break
      case 'shape':
        changes = extractShapeProps(obj)
        break
      default:
        changes = extractBaseProps(obj) as Partial<CanvasElement>
    }

    pendingChanges.push({
      type: 'modify',
      elementId,
      changes,
    })

    scheduleFlush()
  }

  // 選擇事件
  const handleSelectionCreated = (e: { selected?: FabricObject[] }) => {
    if (!e.selected || e.selected.length === 0) return

    const obj = e.selected[0]
    const elementId = (obj as FabricObject & { elementId?: string }).elementId
    if (!elementId) return

    pendingChanges.push({
      type: 'select',
      elementId,
    })

    scheduleFlush()
  }

  // 取消選擇事件
  const handleSelectionCleared = () => {
    pendingChanges.push({
      type: 'deselect',
      elementId: '',
    })

    scheduleFlush()
  }

  // 註冊事件
  canvas.on('object:modified', handleObjectModified)
  canvas.on('selection:created', handleSelectionCreated)
  canvas.on('selection:updated', handleSelectionCreated)
  canvas.on('selection:cleared', handleSelectionCleared)

  // 返回清理函數
  return () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    canvas.off('object:modified', handleObjectModified)
    canvas.off('selection:created', handleSelectionCreated)
    canvas.off('selection:updated', handleSelectionCreated)
    canvas.off('selection:cleared', handleSelectionCleared)
  }
}

// ============================================================================
// 元素 ID 查找
// ============================================================================

/**
 * 在 Canvas 中查找指定 ID 的物件
 */
export function findObjectById(canvas: FabricCanvas, elementId: string): FabricObject | undefined {
  return canvas.getObjects().find(
    obj => (obj as FabricObject & { elementId?: string }).elementId === elementId
  )
}

/**
 * 在 Canvas 中查找指定 name 的物件
 */
export function findObjectByName(canvas: FabricCanvas, elementName: string): FabricObject | undefined {
  return canvas.getObjects().find(
    obj => (obj as FabricObject & { elementName?: string }).elementName === elementName
  )
}

/**
 * 取得 Canvas 中所有元素的 ID
 */
export function getAllElementIds(canvas: FabricCanvas): string[] {
  return canvas.getObjects()
    .map(obj => (obj as FabricObject & { elementId?: string }).elementId)
    .filter((id): id is string => !!id)
}
