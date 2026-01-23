'use client'

/**
 * 遮罩編輯模式 Hook
 *
 * 雙擊遮罩圖片進入編輯模式，可以用滑鼠拖曳調整圖片在遮罩內的位置
 * - 拖曳：移動圖片位置
 * - 滾輪：縮放圖片
 * - 點擊外部或按 Escape：退出編輯模式
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import * as fabric from 'fabric'

interface UseMaskEditModeOptions {
  canvas: fabric.Canvas | null
  onUpdate?: () => void
}

interface MaskEditState {
  isEditing: boolean
  targetImage: fabric.FabricImage | null
}

export function useMaskEditMode({ canvas, onUpdate }: UseMaskEditModeOptions) {
  const [editState, setEditState] = useState<MaskEditState>({
    isEditing: false,
    targetImage: null,
  })

  // 用於追蹤拖曳
  const dragStateRef = useRef({
    isDragging: false,
    lastX: 0,
    lastY: 0,
  })

  // 進入編輯模式
  const enterEditMode = useCallback((image: fabric.FabricImage) => {
    if (!canvas) return

    setEditState({
      isEditing: true,
      targetImage: image,
    })

    // 鎖定圖片的移動（只允許調整遮罩內的位置）
    image.set({
      lockMovementX: true,
      lockMovementY: true,
      lockRotation: true,
      lockScalingX: true,
      lockScalingY: true,
      hasControls: false,
      hasBorders: true,
      borderColor: '#c9aa7c',
      borderDashArray: [5, 5],
    })

    canvas.renderAll()
  }, [canvas])

  // 退出編輯模式
  const exitEditMode = useCallback(() => {
    if (!canvas || !editState.targetImage) return

    const image = editState.targetImage

    // 恢復正常控制
    image.set({
      lockMovementX: false,
      lockMovementY: false,
      lockRotation: false,
      lockScalingX: false,
      lockScalingY: false,
      hasControls: true,
      hasBorders: true,
      borderColor: '#c9aa7c',
      borderDashArray: undefined,
    })

    setEditState({
      isEditing: false,
      targetImage: null,
    })

    canvas.renderAll()
    onUpdate?.()
  }, [canvas, editState.targetImage, onUpdate])

  // 調整遮罩內圖片的位置
  const adjustMaskOffset = useCallback((deltaX: number, deltaY: number) => {
    if (!editState.targetImage || !canvas) return

    const image = editState.targetImage
    const clipPath = image.clipPath
    if (!clipPath) return

    // 取得當前 clipPath 位置
    const currentLeft = clipPath.left || 0
    const currentTop = clipPath.top || 0

    // 計算新位置（反向移動 clipPath 來模擬圖片移動）
    // 縮放係數讓移動更順暢
    const scaleFactor = 1

    clipPath.set({
      left: currentLeft - deltaX * scaleFactor,
      top: currentTop - deltaY * scaleFactor,
    })

    // 儲存到自訂屬性
    const obj = image as unknown as Record<string, unknown>
    obj.__maskOffsetX = ((obj.__maskOffsetX as number) || 0) + deltaX
    obj.__maskOffsetY = ((obj.__maskOffsetY as number) || 0) + deltaY

    image.setCoords()
    canvas.renderAll()
  }, [canvas, editState.targetImage])

  // 調整遮罩內圖片的縮放
  const adjustMaskZoom = useCallback((delta: number) => {
    if (!editState.targetImage || !canvas) return

    const image = editState.targetImage
    const clipPath = image.clipPath
    if (!clipPath) return

    // 取得當前縮放
    const currentScaleX = clipPath.scaleX || 1
    const currentScaleY = clipPath.scaleY || 1

    // 計算新縮放（delta > 0 = 圖片放大 = clipPath 縮小）
    const zoomFactor = 1 - delta * 0.001
    const newScaleX = Math.max(0.2, Math.min(3, currentScaleX * zoomFactor))
    const newScaleY = Math.max(0.2, Math.min(3, currentScaleY * zoomFactor))

    clipPath.set({
      scaleX: newScaleX,
      scaleY: newScaleY,
    })

    // 儲存到自訂屬性
    const obj = image as unknown as Record<string, unknown>
    obj.__maskZoom = 100 / newScaleX // 反向計算用戶感知的縮放值

    image.setCoords()
    canvas.renderAll()
  }, [canvas, editState.targetImage])

  // 監聽 canvas 事件
  useEffect(() => {
    if (!canvas) return

    // 雙擊事件：進入遮罩編輯模式
    const handleDoubleClick = (e: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
      const target = e.target
      if (!target) return

      // 檢查是否為帶 clipPath 的圖片
      if (target.type === 'image' && target.clipPath) {
        enterEditMode(target as fabric.FabricImage)
      }
    }

    // 滑鼠按下
    const handleMouseDown = (e: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
      if (!editState.isEditing) return

      const target = e.target
      // 如果點擊到編輯中的圖片，開始拖曳
      if (target === editState.targetImage) {
        dragStateRef.current = {
          isDragging: true,
          lastX: e.scenePoint?.x || 0,
          lastY: e.scenePoint?.y || 0,
        }
      } else {
        // 點擊其他地方，退出編輯模式
        exitEditMode()
      }
    }

    // 滑鼠移動
    const handleMouseMove = (e: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
      if (!editState.isEditing || !dragStateRef.current.isDragging) return

      const currentX = e.scenePoint?.x || 0
      const currentY = e.scenePoint?.y || 0

      const deltaX = currentX - dragStateRef.current.lastX
      const deltaY = currentY - dragStateRef.current.lastY

      adjustMaskOffset(deltaX, deltaY)

      dragStateRef.current.lastX = currentX
      dragStateRef.current.lastY = currentY
    }

    // 滑鼠放開
    const handleMouseUp = () => {
      if (dragStateRef.current.isDragging) {
        dragStateRef.current.isDragging = false
        onUpdate?.()
      }
    }

    // 滾輪事件（縮放）
    const handleWheel = (e: fabric.TPointerEventInfo<WheelEvent>) => {
      if (!editState.isEditing || !editState.targetImage) return

      // 在遮罩編輯模式下，允許滾輪縮放圖片
      e.e.preventDefault()
      e.e.stopPropagation()

      adjustMaskZoom(e.e.deltaY)
    }

    // 註冊事件
    canvas.on('mouse:dblclick', handleDoubleClick)
    canvas.on('mouse:down', handleMouseDown)
    canvas.on('mouse:move', handleMouseMove)
    canvas.on('mouse:up', handleMouseUp)
    canvas.on('mouse:wheel', handleWheel)

    return () => {
      canvas.off('mouse:dblclick', handleDoubleClick)
      canvas.off('mouse:down', handleMouseDown)
      canvas.off('mouse:move', handleMouseMove)
      canvas.off('mouse:up', handleMouseUp)
      canvas.off('mouse:wheel', handleWheel)
    }
  }, [canvas, editState.isEditing, editState.targetImage, enterEditMode, exitEditMode, adjustMaskOffset, adjustMaskZoom, onUpdate])

  // 監聽 Escape 鍵退出編輯模式
  useEffect(() => {
    if (!editState.isEditing) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        exitEditMode()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editState.isEditing, exitEditMode])

  return {
    isEditingMask: editState.isEditing,
    editingImage: editState.targetImage,
    enterEditMode,
    exitEditMode,
  }
}
