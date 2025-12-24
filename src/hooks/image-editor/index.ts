/**
 * Image Editor Hook
 * 管理圖片編輯功能：縮放、平移、旋轉、翻轉、裁剪
 *
 * 共用於：
 * - CustomerVerifyDialog (顧客護照驗證)
 * - OrderMembersExpandable (訂單成員編輯)
 */

import { useCallback } from 'react'
import { useImageTransform } from './useImageTransform'
import { useImageCrop } from './useImageCrop'
import { useImageUpload } from './useImageUpload'

export function useImageEditor() {
  // 使用模組化的 hooks
  const transform = useImageTransform()
  const crop = useImageCrop()
  const upload = useImageUpload()

  // 重置所有狀態
  const reset = useCallback(() => {
    transform.resetTransform()
    crop.resetCrop()
    upload.resetUpload()
  }, [transform, crop, upload])

  // 整合事件處理器
  const handleWheel = useCallback((e: React.WheelEvent) => {
    transform.handleWheel(e, crop.isCropMode)
  }, [transform, crop.isCropMode])

  const handleMouseDown = useCallback((e: React.MouseEvent, container: HTMLElement | null) => {
    crop.handleMouseDown(
      e,
      container,
      transform.zoom,
      transform.position,
      transform.setPosition === undefined ? () => {} : () => {},
      transform.setPosition === undefined ? () => {} : () => {}
    )
  }, [crop, transform.zoom, transform.position])

  const handleMouseMove = useCallback((e: React.MouseEvent, container: HTMLElement | null) => {
    crop.handleMouseMove(
      e,
      container,
      transform.isDragging,
      transform.zoom,
      { x: 0, y: 0 },
      transform.setPosition
    )
  }, [crop, transform.isDragging, transform.zoom, transform.setPosition])

  const handleMouseUp = useCallback(() => {
    crop.handleMouseUp(() => {})
  }, [crop])

  const handleMouseLeave = useCallback((e: React.MouseEvent, container: HTMLElement | null) => {
    crop.handleMouseLeave(e, container, () => {})
  }, [crop])

  // 便利方法包裝
  const startCrop = useCallback(() => {
    crop.startCrop(transform.setZoom, transform.setPosition)
  }, [crop, transform.setZoom, transform.setPosition])

  return {
    // 狀態
    zoom: transform.zoom,
    position: transform.position,
    isDragging: transform.isDragging,
    rotation: transform.rotation,
    flipH: transform.flipH,
    isCropMode: crop.isCropMode,
    cropRect: crop.cropRect,
    isCropping: crop.isCropping,
    croppedImageUrl: crop.croppedImageUrl,
    containerRef: crop.containerRef,
    isSaving: upload.isSaving,

    // 設置器
    setZoom: transform.setZoom,
    setPosition: transform.setPosition,
    setRotation: transform.setRotation,
    setFlipH: transform.setFlipH,
    setIsCropMode: crop.setIsCropMode,
    setCroppedImageUrl: crop.setCroppedImageUrl,
    setIsSaving: upload.setIsSaving,

    // 便利方法
    zoomIn: transform.zoomIn,
    zoomOut: transform.zoomOut,
    rotateLeft: transform.rotateLeft,
    rotateRight: transform.rotateRight,
    toggleFlipH: transform.toggleFlipH,
    startCrop,

    // 核心方法
    transformImage: transform.transformImage,
    cropImage: crop.cropImage,
    confirmCrop: crop.confirmCrop,
    cancelCrop: crop.cancelCrop,
    reset,

    // 事件處理（圖片拖動）
    handleImageMouseDown: (e: React.MouseEvent) => transform.handleImageMouseDown(e, crop.isCropMode),
    handleImageMouseMove: (e: React.MouseEvent) => transform.handleImageMouseMove(e, crop.isCropMode),
    handleImageMouseUp: transform.handleImageMouseUp,

    // 事件處理（裁剪）
    handleCropMouseDown: crop.handleCropMouseDown,
    handleCropMouseMove: crop.handleCropMouseMove,
    handleCropMouseUp: crop.handleCropMouseUp,

    // 通用滑鼠事件處理器（用於容器）
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  }
}

// 匯出類型
export type { ImageTransformState } from './useImageTransform'
export type { ImageCropState } from './useImageCrop'
