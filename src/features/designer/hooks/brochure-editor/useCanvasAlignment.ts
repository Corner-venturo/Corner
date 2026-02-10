'use client'

import { useCallback } from 'react'
import * as fabric from 'fabric'
import type { BoundingBox } from './types'

/**
 * useCanvasAlignment - 對齊和分佈操作 Hook
 * 
 * 功能：
 * - 對齊：alignLeft, alignCenterH, alignRight, alignTop, alignCenterV, alignBottom
 * - 分佈：distributeH, distributeV
 */

interface UseCanvasAlignmentOptions {
  width: number
  height: number
  getCanvas: () => fabric.Canvas | null
  markDirty: () => void
}

interface UseCanvasAlignmentReturn {
  alignLeft: () => void
  alignCenterH: () => void
  alignRight: () => void
  alignTop: () => void
  alignCenterV: () => void
  alignBottom: () => void
  distributeH: () => void
  distributeV: () => void
}

export function useCanvasAlignment(options: UseCanvasAlignmentOptions): UseCanvasAlignmentReturn {
  const { width, height, getCanvas, markDirty } = options

  // ============================================
  // Helper: Get Object Bounding Box
  // ============================================
  const getObjectBoundingBox = useCallback((obj: fabric.FabricObject): BoundingBox => {
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

  // ============================================
  // Helper: Move Object To
  // ============================================
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

  // ============================================
  // Helper: Prepare Objects for Alignment
  // ============================================
  const prepareObjectsForAlignment = useCallback((canvas: fabric.Canvas): {
    objects: fabric.FabricObject[]
    wasMultiSelect: boolean
  } => {
    const activeObject = canvas.getActiveObject()
    if (!activeObject) return { objects: [], wasMultiSelect: false }

    if (activeObject.type === 'activeSelection') {
      const activeSelection = activeObject as fabric.ActiveSelection
      const objects = activeSelection.getObjects()
      canvas.discardActiveObject()
      objects.forEach(obj => obj.setCoords())
      return { objects, wasMultiSelect: true }
    }

    return { objects: [activeObject], wasMultiSelect: false }
  }, [])

  // ============================================
  // Helper: Restore Multi Selection
  // ============================================
  const restoreMultiSelection = useCallback((canvas: fabric.Canvas, objects: fabric.FabricObject[]) => {
    if (objects.length > 1) {
      const selection = new fabric.ActiveSelection(objects, { canvas })
      canvas.setActiveObject(selection)
    } else if (objects.length === 1) {
      canvas.setActiveObject(objects[0])
    }
  }, [])

  // ============================================
  // Align Left
  // ============================================
  const alignLeft = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return

    const { objects, wasMultiSelect } = prepareObjectsForAlignment(canvas)
    if (objects.length === 0) return

    if (objects.length === 1) {
      const obj = objects[0]
      const box = getObjectBoundingBox(obj)
      moveObjectTo(obj, 0, box.top)
    } else {
      const boxes = objects.map(obj => ({ obj, box: getObjectBoundingBox(obj) }))
      const minLeft = Math.min(...boxes.map(b => b.box.left))
      boxes.forEach(({ obj, box }) => {
        moveObjectTo(obj, minLeft, box.top)
      })
    }

    if (wasMultiSelect) restoreMultiSelection(canvas, objects)
    canvas.renderAll()
    markDirty()
  }, [getCanvas, prepareObjectsForAlignment, getObjectBoundingBox, moveObjectTo, restoreMultiSelection, markDirty])

  // ============================================
  // Align Center Horizontal
  // ============================================
  const alignCenterH = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return

    const { objects, wasMultiSelect } = prepareObjectsForAlignment(canvas)
    if (objects.length === 0) return

    if (objects.length === 1) {
      const obj = objects[0]
      const box = getObjectBoundingBox(obj)
      moveObjectTo(obj, (width - box.width) / 2, box.top)
    } else {
      const boxes = objects.map(obj => ({ obj, box: getObjectBoundingBox(obj) }))
      const minLeft = Math.min(...boxes.map(b => b.box.left))
      const maxRight = Math.max(...boxes.map(b => b.box.right))
      const selectionCenterX = (minLeft + maxRight) / 2
      boxes.forEach(({ obj, box }) => {
        const newLeft = selectionCenterX - box.width / 2
        moveObjectTo(obj, newLeft, box.top)
      })
    }

    if (wasMultiSelect) restoreMultiSelection(canvas, objects)
    canvas.renderAll()
    markDirty()
  }, [width, getCanvas, prepareObjectsForAlignment, getObjectBoundingBox, moveObjectTo, restoreMultiSelection, markDirty])

  // ============================================
  // Align Right
  // ============================================
  const alignRight = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return

    const { objects, wasMultiSelect } = prepareObjectsForAlignment(canvas)
    if (objects.length === 0) return

    if (objects.length === 1) {
      const obj = objects[0]
      const box = getObjectBoundingBox(obj)
      moveObjectTo(obj, width - box.width, box.top)
    } else {
      const boxes = objects.map(obj => ({ obj, box: getObjectBoundingBox(obj) }))
      const maxRight = Math.max(...boxes.map(b => b.box.right))
      boxes.forEach(({ obj, box }) => {
        moveObjectTo(obj, maxRight - box.width, box.top)
      })
    }

    if (wasMultiSelect) restoreMultiSelection(canvas, objects)
    canvas.renderAll()
    markDirty()
  }, [width, getCanvas, prepareObjectsForAlignment, getObjectBoundingBox, moveObjectTo, restoreMultiSelection, markDirty])

  // ============================================
  // Align Top
  // ============================================
  const alignTop = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return

    const { objects, wasMultiSelect } = prepareObjectsForAlignment(canvas)
    if (objects.length === 0) return

    if (objects.length === 1) {
      const obj = objects[0]
      const box = getObjectBoundingBox(obj)
      moveObjectTo(obj, box.left, 0)
    } else {
      const boxes = objects.map(obj => ({ obj, box: getObjectBoundingBox(obj) }))
      const minTop = Math.min(...boxes.map(b => b.box.top))
      boxes.forEach(({ obj, box }) => {
        moveObjectTo(obj, box.left, minTop)
      })
    }

    if (wasMultiSelect) restoreMultiSelection(canvas, objects)
    canvas.renderAll()
    markDirty()
  }, [getCanvas, prepareObjectsForAlignment, getObjectBoundingBox, moveObjectTo, restoreMultiSelection, markDirty])

  // ============================================
  // Align Center Vertical
  // ============================================
  const alignCenterV = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return

    const { objects, wasMultiSelect } = prepareObjectsForAlignment(canvas)
    if (objects.length === 0) return

    if (objects.length === 1) {
      const obj = objects[0]
      const box = getObjectBoundingBox(obj)
      moveObjectTo(obj, box.left, (height - box.height) / 2)
    } else {
      const boxes = objects.map(obj => ({ obj, box: getObjectBoundingBox(obj) }))
      const minTop = Math.min(...boxes.map(b => b.box.top))
      const maxBottom = Math.max(...boxes.map(b => b.box.bottom))
      const selectionCenterY = (minTop + maxBottom) / 2
      boxes.forEach(({ obj, box }) => {
        const newTop = selectionCenterY - box.height / 2
        moveObjectTo(obj, box.left, newTop)
      })
    }

    if (wasMultiSelect) restoreMultiSelection(canvas, objects)
    canvas.renderAll()
    markDirty()
  }, [height, getCanvas, prepareObjectsForAlignment, getObjectBoundingBox, moveObjectTo, restoreMultiSelection, markDirty])

  // ============================================
  // Align Bottom
  // ============================================
  const alignBottom = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return

    const { objects, wasMultiSelect } = prepareObjectsForAlignment(canvas)
    if (objects.length === 0) return

    if (objects.length === 1) {
      const obj = objects[0]
      const box = getObjectBoundingBox(obj)
      moveObjectTo(obj, box.left, height - box.height)
    } else {
      const boxes = objects.map(obj => ({ obj, box: getObjectBoundingBox(obj) }))
      const maxBottom = Math.max(...boxes.map(b => b.box.bottom))
      boxes.forEach(({ obj, box }) => {
        moveObjectTo(obj, box.left, maxBottom - box.height)
      })
    }

    if (wasMultiSelect) restoreMultiSelection(canvas, objects)
    canvas.renderAll()
    markDirty()
  }, [height, getCanvas, prepareObjectsForAlignment, getObjectBoundingBox, moveObjectTo, restoreMultiSelection, markDirty])

  // ============================================
  // Distribute Horizontal
  // ============================================
  const distributeH = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return

    const { objects, wasMultiSelect } = prepareObjectsForAlignment(canvas)
    if (objects.length < 3) return

    const boxes = objects.map(obj => ({ obj, box: getObjectBoundingBox(obj) }))
    boxes.sort((a, b) => a.box.left - b.box.left)

    const leftMost = boxes[0].box.left
    const rightMost = boxes[boxes.length - 1].box.right
    const totalObjWidth = boxes.reduce((sum, b) => sum + b.box.width, 0)
    const totalSpace = rightMost - leftMost
    const gapSpace = totalSpace - totalObjWidth
    const gap = gapSpace / (boxes.length - 1)

    let currentX = leftMost + boxes[0].box.width + gap
    for (let i = 1; i < boxes.length - 1; i++) {
      const { obj, box } = boxes[i]
      moveObjectTo(obj, currentX, box.top)
      currentX += box.width + gap
    }

    if (wasMultiSelect) restoreMultiSelection(canvas, objects)
    canvas.renderAll()
    markDirty()
  }, [getCanvas, prepareObjectsForAlignment, getObjectBoundingBox, moveObjectTo, restoreMultiSelection, markDirty])

  // ============================================
  // Distribute Vertical
  // ============================================
  const distributeV = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return

    const { objects, wasMultiSelect } = prepareObjectsForAlignment(canvas)
    if (objects.length < 3) return

    const boxes = objects.map(obj => ({ obj, box: getObjectBoundingBox(obj) }))
    boxes.sort((a, b) => a.box.top - b.box.top)

    const topMost = boxes[0].box.top
    const bottomMost = boxes[boxes.length - 1].box.bottom
    const totalObjHeight = boxes.reduce((sum, b) => sum + b.box.height, 0)
    const totalSpace = bottomMost - topMost
    const gapSpace = totalSpace - totalObjHeight
    const gap = gapSpace / (boxes.length - 1)

    let currentY = topMost + boxes[0].box.height + gap
    for (let i = 1; i < boxes.length - 1; i++) {
      const { obj, box } = boxes[i]
      moveObjectTo(obj, box.left, currentY)
      currentY += box.height + gap
    }

    if (wasMultiSelect) restoreMultiSelection(canvas, objects)
    canvas.renderAll()
    markDirty()
  }, [getCanvas, prepareObjectsForAlignment, getObjectBoundingBox, moveObjectTo, restoreMultiSelection, markDirty])

  return {
    alignLeft,
    alignCenterH,
    alignRight,
    alignTop,
    alignCenterV,
    alignBottom,
    distributeH,
    distributeV,
  }
}
