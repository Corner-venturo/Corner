/**
 * Image Transform Hook
 * 管理圖片變換功能：縮放、平移、旋轉、翻轉
 */

import { useState, useCallback } from 'react'

export interface ImageTransformState {
  // 縮放/平移
  zoom: number
  position: { x: number; y: number }
  isDragging: boolean
  dragStart: { x: number; y: number }

  // 旋轉/翻轉
  rotation: number
  flipH: boolean
}

export function useImageTransform() {
  // 縮放/平移狀態
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // 旋轉/翻轉狀態
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)

  // 旋轉/翻轉圖片並轉換為 base64
  const transformImage = useCallback((
    imageUrl: string,
    rotationDeg: number,
    flipHorizontal: boolean
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Cannot get canvas context'))
          return
        }

        // 90 或 270 度旋轉時，寬高需要交換
        if (rotationDeg === 90 || rotationDeg === 270) {
          canvas.width = img.height
          canvas.height = img.width
        } else {
          canvas.width = img.width
          canvas.height = img.height
        }

        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((rotationDeg * Math.PI) / 180)
        if (flipHorizontal) {
          ctx.scale(-1, 1)
        }
        ctx.drawImage(img, -img.width / 2, -img.height / 2)
        resolve(canvas.toDataURL('image/jpeg', 0.9))
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = imageUrl
    })
  }, [])

  // 滑鼠事件處理（圖片拖動）
  const handleImageMouseDown = useCallback((e: React.MouseEvent, isCropMode: boolean) => {
    if (isCropMode) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }, [position])

  const handleImageMouseMove = useCallback((e: React.MouseEvent, isCropMode: boolean) => {
    if (!isDragging || isCropMode) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }, [isDragging, dragStart])

  const handleImageMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // 滾輪縮放
  const handleWheel = useCallback((e: React.WheelEvent, isCropMode: boolean) => {
    if (isCropMode) return
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(z => Math.min(3, Math.max(0.5, z + delta)))
  }, [])

  // 便利方法
  const zoomIn = useCallback(() => setZoom(z => Math.min(3, z + 0.25)), [])
  const zoomOut = useCallback(() => setZoom(z => Math.max(0.5, z - 0.25)), [])
  const rotateLeft = useCallback(() => setRotation(r => (r - 90 + 360) % 360), [])
  const rotateRight = useCallback(() => setRotation(r => (r + 90) % 360), [])
  const toggleFlipH = useCallback(() => setFlipH(f => !f), [])

  // 重置變換狀態
  const resetTransform = useCallback(() => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
    setIsDragging(false)
    setDragStart({ x: 0, y: 0 })
    setRotation(0)
    setFlipH(false)
  }, [])

  return {
    // 狀態
    zoom,
    position,
    isDragging,
    rotation,
    flipH,

    // 設置器
    setZoom,
    setPosition,
    setRotation,
    setFlipH,

    // 便利方法
    zoomIn,
    zoomOut,
    rotateLeft,
    rotateRight,
    toggleFlipH,
    resetTransform,

    // 核心方法
    transformImage,

    // 事件處理
    handleImageMouseDown,
    handleImageMouseMove,
    handleImageMouseUp,
    handleWheel,
  }
}
