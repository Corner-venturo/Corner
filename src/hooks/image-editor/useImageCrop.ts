/**
 * Image Crop Hook
 * 管理圖片裁切功能
 */

import { useState, useCallback, useRef } from 'react'

export interface ImageCropState {
  isCropMode: boolean
  cropRect: { x: number; y: number; width: number; height: number }
  cropStart: { x: number; y: number }
  isCropping: boolean
  croppedImageUrl: string | null
}

export function useImageCrop() {
  const [isCropMode, setIsCropMode] = useState(false)
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [cropStart, setCropStart] = useState({ x: 0, y: 0 })
  const [isCropping, setIsCropping] = useState(false)
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  // 裁剪圖片
  const cropImage = useCallback(async (imageUrl: string): Promise<string | null> => {
    if (!containerRef.current) return null
    if (cropRect.width < 20 || cropRect.height < 20) {
      throw new Error('請框選較大的區域')
    }

    const container = containerRef.current
    const img = container.querySelector('img')
    if (!img) return null

    // 創建 canvas 進行裁剪
    const sourceImg = new Image()
    sourceImg.crossOrigin = 'anonymous'

    await new Promise<void>((resolve, reject) => {
      sourceImg.onload = () => resolve()
      sourceImg.onerror = reject
      sourceImg.src = imageUrl
    })

    // 取得圖片在容器中的顯示尺寸和位置
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    const imgAspect = sourceImg.width / sourceImg.height
    const containerAspect = containerWidth / containerHeight

    let displayWidth: number
    let displayHeight: number
    let offsetX: number
    let offsetY: number

    if (imgAspect > containerAspect) {
      displayWidth = containerWidth
      displayHeight = containerWidth / imgAspect
      offsetX = 0
      offsetY = (containerHeight - displayHeight) / 2
    } else {
      displayHeight = containerHeight
      displayWidth = containerHeight * imgAspect
      offsetX = (containerWidth - displayWidth) / 2
      offsetY = 0
    }

    // 計算裁剪區域在原圖上的比例
    const scaleX = sourceImg.width / displayWidth
    const scaleY = sourceImg.height / displayHeight

    const cropX = Math.max(0, (cropRect.x - offsetX) * scaleX)
    const cropY = Math.max(0, (cropRect.y - offsetY) * scaleY)
    const cropWidth = Math.min(cropRect.width * scaleX, sourceImg.width - cropX)
    const cropHeight = Math.min(cropRect.height * scaleY, sourceImg.height - cropY)

    const canvas = document.createElement('canvas')
    canvas.width = cropWidth
    canvas.height = cropHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(
      sourceImg,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    )

    return canvas.toDataURL('image/jpeg', 0.9)
  }, [cropRect])

  // 裁剪框滑鼠事件
  const handleCropMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isCropMode) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setIsCropping(true)
    setCropStart({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setCropRect({ x: e.clientX - rect.left, y: e.clientY - rect.top, width: 0, height: 0 })
  }, [isCropMode])

  const handleCropMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isCropping || !isCropMode) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top
    setCropRect({
      x: Math.min(cropStart.x, currentX),
      y: Math.min(cropStart.y, currentY),
      width: Math.abs(currentX - cropStart.x),
      height: Math.abs(currentY - cropStart.y),
    })
  }, [isCropping, isCropMode, cropStart])

  const handleCropMouseUp = useCallback(() => {
    setIsCropping(false)
  }, [])

  // 通用滑鼠事件處理器（用於容器）
  const handleMouseDown = useCallback((e: React.MouseEvent, container: HTMLElement | null, zoom: number, position: { x: number; y: number }, setIsDragging: (dragging: boolean) => void, setDragStart: (start: { x: number; y: number }) => void) => {
    if (isCropMode) {
      if (!container) return
      const rect = container.getBoundingClientRect()
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height))
      setCropStart({ x, y })
      setCropRect({ x, y, width: 0, height: 0 })
      setIsCropping(true)
    } else if (zoom > 1) {
      e.preventDefault()
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }, [isCropMode])

  const handleMouseMove = useCallback((e: React.MouseEvent, container: HTMLElement | null, isDragging: boolean, zoom: number, dragStart: { x: number; y: number }, setPosition: (pos: { x: number; y: number }) => void) => {
    if (isCropMode && isCropping) {
      if (!container) return
      const rect = container.getBoundingClientRect()
      const currentX = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
      const currentY = Math.max(0, Math.min(e.clientY - rect.top, rect.height))
      setCropRect({
        x: Math.min(cropStart.x, currentX),
        y: Math.min(cropStart.y, currentY),
        width: Math.abs(currentX - cropStart.x),
        height: Math.abs(currentY - cropStart.y),
      })
    } else if (isDragging && zoom > 1) {
      e.preventDefault()
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }, [isCropMode, isCropping, cropStart])

  const handleMouseUp = useCallback((setIsDragging: (dragging: boolean) => void) => {
    setIsCropping(false)
    setIsDragging(false)
  }, [])

  const handleMouseLeave = useCallback((e: React.MouseEvent, container: HTMLElement | null, setIsDragging: (dragging: boolean) => void) => {
    if (isCropMode && isCropping && container) {
      const rect = container.getBoundingClientRect()
      const currentX = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
      const currentY = Math.max(0, Math.min(e.clientY - rect.top, rect.height))
      setCropRect({
        x: Math.min(cropStart.x, currentX),
        y: Math.min(cropStart.y, currentY),
        width: Math.abs(currentX - cropStart.x),
        height: Math.abs(currentY - cropStart.y),
      })
    }
    setIsCropping(false)
    setIsDragging(false)
  }, [isCropMode, isCropping, cropStart])

  // 開始裁剪
  const startCrop = useCallback((setZoom: (zoom: number) => void, setPosition: (pos: { x: number; y: number }) => void) => {
    setIsCropMode(true)
    setCropRect({ x: 0, y: 0, width: 0, height: 0 })
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  // 取消裁剪
  const cancelCrop = useCallback(() => {
    setIsCropMode(false)
    setCropRect({ x: 0, y: 0, width: 0, height: 0 })
    setCroppedImageUrl(null)
  }, [])

  // 確認裁剪
  const confirmCrop = useCallback(async (imageUrl: string) => {
    const cropped = await cropImage(imageUrl)
    if (cropped) {
      setCroppedImageUrl(cropped)
      setIsCropMode(false)
      setCropRect({ x: 0, y: 0, width: 0, height: 0 })
      return cropped
    }
    return null
  }, [cropImage])

  // 重置裁剪狀態
  const resetCrop = useCallback(() => {
    setIsCropMode(false)
    setCropRect({ x: 0, y: 0, width: 0, height: 0 })
    setCropStart({ x: 0, y: 0 })
    setIsCropping(false)
    setCroppedImageUrl(null)
  }, [])

  return {
    // 狀態
    isCropMode,
    cropRect,
    isCropping,
    croppedImageUrl,
    containerRef,

    // 設置器
    setIsCropMode,
    setCroppedImageUrl,

    // 便利方法
    startCrop,
    cancelCrop,
    confirmCrop,
    resetCrop,

    // 核心方法
    cropImage,

    // 事件處理
    handleCropMouseDown,
    handleCropMouseMove,
    handleCropMouseUp,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  }
}
