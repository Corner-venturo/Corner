'use client'

import { useCallback } from 'react'
import * as fabric from 'fabric'
import type { FabricObjectWithId, FabricObjectWithName } from './types'

/**
 * useCanvasSelection - 選取操作 Hook
 * 
 * 功能：
 * - deleteSelected, copySelected, pasteClipboard, cutSelected
 * - moveSelected
 * - updateElementByName, removeObjectByName, getObjectByName
 */

// 模組層級的剪貼簿（跨實例共享）
let clipboard: fabric.FabricObject[] = []

interface UseCanvasSelectionOptions {
  getCanvas: () => fabric.Canvas | null
  markDirty: () => void
  saveToHistory: () => void
}

interface UseCanvasSelectionReturn {
  deleteSelected: () => void
  copySelected: () => Promise<void>
  pasteClipboard: () => Promise<void>
  cutSelected: () => void
  moveSelected: (dx: number, dy: number) => void
  selectAll: () => void
  updateElementByName: (elementName: string, updates: { text?: string }) => boolean
  removeObjectByName: (elementName: string) => boolean
  getObjectByName: (elementName: string) => fabric.FabricObject | null
}

export function useCanvasSelection(options: UseCanvasSelectionOptions): UseCanvasSelectionReturn {
  const { getCanvas, markDirty, saveToHistory } = options

  // ============================================
  // Delete Selected
  // ============================================
  const deleteSelected = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return

    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length === 0) return

    activeObjects.forEach((obj) => canvas.remove(obj))
    canvas.discardActiveObject()
    canvas.renderAll()
  }, [getCanvas])

  // ============================================
  // Copy Selected
  // ============================================
  const copySelected = useCallback(async () => {
    const canvas = getCanvas()
    if (!canvas) return

    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length === 0) return

    const cloned: fabric.FabricObject[] = []
    for (const obj of activeObjects) {
      const clone = await obj.clone()
      cloned.push(clone)
    }
    clipboard = cloned
  }, [getCanvas])

  // ============================================
  // Paste Clipboard
  // ============================================
  const pasteClipboard = useCallback(async () => {
    const canvas = getCanvas()
    if (!canvas || clipboard.length === 0) return

    for (const obj of clipboard) {
      const cloned = await obj.clone()
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      })
      ;(cloned as FabricObjectWithId).id = `paste-${Date.now()}-${Math.random()}`
      canvas.add(cloned)
    }

    canvas.renderAll()
  }, [getCanvas])

  // ============================================
  // Cut Selected
  // ============================================
  const cutSelected = useCallback(() => {
    copySelected()
    deleteSelected()
  }, [copySelected, deleteSelected])

  // ============================================
  // Move Selected
  // ============================================
  const moveSelected = useCallback((dx: number, dy: number) => {
    const canvas = getCanvas()
    if (!canvas) return

    const activeObject = canvas.getActiveObject()
    if (!activeObject) return

    activeObject.set({
      left: (activeObject.left || 0) + dx,
      top: (activeObject.top || 0) + dy,
    })
    activeObject.setCoords()
    canvas.renderAll()

    markDirty()
    saveToHistory()
  }, [getCanvas, markDirty, saveToHistory])

  // ============================================
  // Select All
  // ============================================
  const selectAll = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return

    const objects = canvas.getObjects().filter(obj => !obj.isType('line') || !((obj as unknown as { isGuideLine?: boolean }).isGuideLine))
    if (objects.length === 0) return

    canvas.discardActiveObject()
    if (objects.length === 1) {
      canvas.setActiveObject(objects[0])
    } else {
      const selection = new fabric.ActiveSelection(objects, { canvas })
      canvas.setActiveObject(selection)
    }
    canvas.renderAll()
  }, [getCanvas])

  // ============================================
  // Update Element by Name
  // ============================================
  const updateElementByName = useCallback((elementName: string, updates: { text?: string }) => {
    const canvas = getCanvas()
    if (!canvas) return false

    const objects = canvas.getObjects()

    // 先在頂層尋找
    let targetObj = objects.find(obj => {
      const fabricObj = obj as FabricObjectWithName
      return fabricObj.name === elementName
    })

    // 如果頂層找不到，搜尋群組內的元素
    if (!targetObj) {
      for (const obj of objects) {
        if (obj.type === 'group') {
          const group = obj as fabric.Group
          const groupObjects = group.getObjects()
          const found = groupObjects.find(item => {
            const fabricItem = item as FabricObjectWithName
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
      const textObj = targetObj as fabric.Textbox
      if (textObj.set && typeof textObj.text !== 'undefined') {
        textObj.set('text', updates.text)
        canvas.renderAll()
        markDirty()
        return true
      }
    }

    return false
  }, [getCanvas, markDirty])

  // ============================================
  // Remove Object by Name
  // ============================================
  const removeObjectByName = useCallback((elementName: string) => {
    const canvas = getCanvas()
    if (!canvas) return false

    const objects = canvas.getObjects()
    const targetObj = objects.find(obj => {
      const fabricObj = obj as FabricObjectWithName
      return fabricObj.name === elementName
    })

    if (targetObj) {
      canvas.remove(targetObj)
      canvas.renderAll()
      markDirty()
      return true
    }

    return false
  }, [getCanvas, markDirty])

  // ============================================
  // Get Object by Name
  // ============================================
  const getObjectByName = useCallback((elementName: string) => {
    const canvas = getCanvas()
    if (!canvas) return null

    const objects = canvas.getObjects()
    const targetObj = objects.find(obj => {
      const fabricObj = obj as FabricObjectWithName
      return fabricObj.name === elementName
    })

    return targetObj || null
  }, [getCanvas])

  return {
    deleteSelected,
    copySelected,
    pasteClipboard,
    cutSelected,
    moveSelected,
    selectAll,
    updateElementByName,
    removeObjectByName,
    getObjectByName,
  }
}
