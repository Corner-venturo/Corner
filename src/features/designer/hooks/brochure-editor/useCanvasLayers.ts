'use client'

import { useCallback } from 'react'
import * as fabric from 'fabric'
import type { FabricObjectWithId } from './types'

/**
 * useCanvasLayers - 圖層操作 Hook
 * 
 * 功能：
 * - bringForward, sendBackward, bringToFront, sendToBack
 * - getObjects, selectObjectById
 */

interface UseCanvasLayersOptions {
  getCanvas: () => fabric.Canvas | null
}

interface UseCanvasLayersReturn {
  bringForward: () => void
  sendBackward: () => void
  bringToFront: () => void
  sendToBack: () => void
  getObjects: () => fabric.FabricObject[]
  selectObjectById: (id: string) => void
}

export function useCanvasLayers(options: UseCanvasLayersOptions): UseCanvasLayersReturn {
  const { getCanvas } = options

  // ============================================
  // Bring Forward
  // ============================================
  const bringForward = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      canvas.bringObjectForward(activeObject)
      canvas.renderAll()
    }
  }, [getCanvas])

  // ============================================
  // Send Backward
  // ============================================
  const sendBackward = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      canvas.sendObjectBackwards(activeObject)
      canvas.renderAll()
    }
  }, [getCanvas])

  // ============================================
  // Bring to Front
  // ============================================
  const bringToFront = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      canvas.bringObjectToFront(activeObject)
      canvas.renderAll()
    }
  }, [getCanvas])

  // ============================================
  // Send to Back
  // ============================================
  const sendToBack = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      canvas.sendObjectToBack(activeObject)
      canvas.renderAll()
    }
  }, [getCanvas])

  // ============================================
  // Get Objects
  // ============================================
  const getObjects = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return []
    return canvas.getObjects()
  }, [getCanvas])

  // ============================================
  // Select Object by ID
  // ============================================
  const selectObjectById = useCallback((id: string) => {
    const canvas = getCanvas()
    if (!canvas) return

    const objects = canvas.getObjects()
    const target = objects.find(obj => (obj as FabricObjectWithId).id === id)
    if (target) {
      canvas.setActiveObject(target)
      canvas.renderAll()
    }
  }, [getCanvas])

  return {
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    getObjects,
    selectObjectById,
  }
}
