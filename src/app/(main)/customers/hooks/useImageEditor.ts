/**
 * Image Editor Hook
 * 管理圖片編輯功能：縮放、平移、旋轉、翻轉、裁剪
 */

import { useState, useCallback, useRef } from 'react'

interface ImageEditorState {
  // 縮放/平移
  zoom: number
  position: { x: number; y: number }
  isDragging: boolean
  dragStart: { x: number; y: number }

  // 旋轉/翻轉
  rotation: number
  flipH: boolean

  // 裁剪
  isCropMode: boolean
  cropRect: { x: number; y: number; width: number; height: number }
  cropStart: { x: number; y: number }
  isCropping: boolean
  croppedImageUrl: string | null
}

export function useImageEditor() {
  // 縮放/平移狀態
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // 旋轉/翻轉狀態
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)

  // 裁剪狀態
  const [isCropMode, setIsCropMode] = useState(false)
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [cropStart, setCropStart] = useState({ x: 0, y: 0 })
  const [isCropping, setIsCropping] = useState(false)
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  // 🎨 旋轉/翻轉圖片並轉換為 base64
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

  // ✂️ 裁剪圖片
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

  // 🖱️ 滑鼠事件處理（圖片拖動）
  const handleImageMouseDown = useCallback((e: React.MouseEvent) => {
    if (isCropMode) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }, [isCropMode, position])

  const handleImageMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || isCropMode) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }, [isDragging, isCropMode, dragStart])

  const handleImageMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // 🖱️ 裁剪框滑鼠事件
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

  // 🔄 重置所有狀態
  const reset = useCallback(() => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
    setIsDragging(false)
    setDragStart({ x: 0, y: 0 })
    setRotation(0)
    setFlipH(false)
    setIsCropMode(false)
    setCropRect({ x: 0, y: 0, width: 0, height: 0 })
    setCropStart({ x: 0, y: 0 })
    setIsCropping(false)
    setCroppedImageUrl(null)
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

  // 便利方法
  const zoomIn = useCallback(() => setZoom(z => Math.min(3, z + 0.25)), [])
  const zoomOut = useCallback(() => setZoom(z => Math.max(0.5, z - 0.25)), [])
  const rotateLeft = useCallback(() => setRotation(r => (r - 90 + 360) % 360), [])
  const rotateRight = useCallback(() => setRotation(r => (r + 90) % 360), [])
  const toggleFlipH = useCallback(() => setFlipH(f => !f), [])
  const startCrop = useCallback(() => {
    setIsCropMode(true)
    setCropRect({ x: 0, y: 0, width: 0, height: 0 })
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  // 儲存狀態
  const [isSaving, setIsSaving] = useState(false)

  return {
    // 狀態
    zoom,
    position,
    isDragging,
    rotation,
    flipH,
    isCropMode,
    cropRect,
    isCropping,
    croppedImageUrl,
    containerRef,
    isSaving,

    // 設置器
    setZoom,
    setPosition,
    setRotation,
    setFlipH,
    setIsCropMode,
    setCroppedImageUrl,
    setIsSaving,

    // 便利方法
    zoomIn,
    zoomOut,
    rotateLeft,
    rotateRight,
    toggleFlipH,
    startCrop,

    // 核心方法
    transformImage,
    cropImage,
    confirmCrop,
    cancelCrop,
    reset,

    // 事件處理（圖片拖動）
    handleImageMouseDown,
    handleImageMouseMove,
    handleImageMouseUp,

    // 事件處理（裁剪）
    handleCropMouseDown,
    handleCropMouseMove,
    handleCropMouseUp,

    // 通用滑鼠事件處理器（用於容器）
    handleWheel: useCallback((e: React.WheelEvent) => {
      if (isCropMode) return
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom(z => Math.min(3, Math.max(0.5, z + delta)))
    }, [isCropMode]),

    handleMouseDown: useCallback((e: React.MouseEvent, container: HTMLElement | null) => {
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
    }, [isCropMode, zoom, position]),

    handleMouseMove: useCallback((e: React.MouseEvent, container: HTMLElement | null) => {
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
    }, [isCropMode, isCropping, cropStart, isDragging, zoom, dragStart]),

    handleMouseUp: useCallback(() => {
      setIsCropping(false)
      setIsDragging(false)
    }, []),

    handleMouseLeave: useCallback((e: React.MouseEvent, container: HTMLElement | null) => {
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
    }, [isCropMode, isCropping, cropStart]),
  }
}
