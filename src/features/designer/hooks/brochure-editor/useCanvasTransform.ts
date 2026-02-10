'use client'

import { useCallback } from 'react'
import * as fabric from 'fabric'

/**
 * useCanvasTransform - 變形操作 Hook
 * 
 * 功能：
 * - groupSelected, ungroupSelected
 * - flipHorizontal, flipVertical
 * - toggleLock
 */

interface UseCanvasTransformOptions {
  getCanvas: () => fabric.Canvas | null
  markDirty: () => void
}

interface UseCanvasTransformReturn {
  groupSelected: () => void
  ungroupSelected: () => void
  flipHorizontal: () => void
  flipVertical: () => void
  toggleLock: () => void
}

export function useCanvasTransform(options: UseCanvasTransformOptions): UseCanvasTransformReturn {
  const { getCanvas, markDirty } = options

  // ============================================
  // Group Selected
  // ============================================
  const groupSelected = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return

    const activeSelection = canvas.getActiveObject()
    if (!activeSelection || activeSelection.type !== 'activeSelection') return

    const objects = (activeSelection as fabric.ActiveSelection).getObjects()
    if (objects.length < 2) return

    objects.forEach((obj) => canvas.remove(obj))

    const group = new fabric.Group(objects)
    ;(group as fabric.Group & { id: string }).id = `group-${Date.now()}`

    canvas.add(group)
    canvas.setActiveObject(group)
    canvas.renderAll()
  }, [getCanvas])

  // ============================================
  // Ungroup Selected
  // ============================================
  const ungroupSelected = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return

    const activeObject = canvas.getActiveObject()
    if (!activeObject || activeObject.type !== 'group') return

    const group = activeObject as fabric.Group
    const items = group.getObjects()

    const groupLeft = group.left || 0
    const groupTop = group.top || 0

    canvas.remove(group)

    items.forEach((item) => {
      item.set({
        left: groupLeft + (item.left || 0),
        top: groupTop + (item.top || 0),
      })
      canvas.add(item)
    })

    canvas.renderAll()
  }, [getCanvas])

  // ============================================
  // Flip Horizontal
  // ============================================
  const flipHorizontal = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return

    const activeObject = canvas.getActiveObject()
    if (!activeObject) return

    activeObject.set('flipX', !activeObject.flipX)
    canvas.renderAll()
    markDirty()
  }, [getCanvas, markDirty])

  // ============================================
  // Flip Vertical
  // ============================================
  const flipVertical = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return

    const activeObject = canvas.getActiveObject()
    if (!activeObject) return

    activeObject.set('flipY', !activeObject.flipY)
    canvas.renderAll()
    markDirty()
  }, [getCanvas, markDirty])

  // ============================================
  // Toggle Lock
  // ============================================
  const toggleLock = useCallback(() => {
    const canvas = getCanvas()
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
  }, [getCanvas])

  return {
    groupSelected,
    ungroupSelected,
    flipHorizontal,
    flipVertical,
    toggleLock,
  }
}
