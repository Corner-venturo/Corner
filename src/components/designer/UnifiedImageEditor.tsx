'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import Cropper, { Area } from 'react-easy-crop'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Crop,
  Sliders,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ImageAdjustmentsPanel } from '@/features/designer/components/ImageAdjustmentsPanel'
import { useImageAdjustments } from '@/features/designer/hooks/useImageAdjustments'
import type { ImageAdjustments, ImagePositionSettings } from '@/features/designer/components/types'
import { DEFAULT_IMAGE_ADJUSTMENTS, DEFAULT_IMAGE_POSITION } from '@/features/designer/components/types'
import { alert } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'

type EditorMode = 'crop' | 'position' | 'adjust'

interface UnifiedImageEditorProps {
  open: boolean
  onClose: () => void
  imageSrc: string
  aspectRatio?: number
  initialPosition?: ImagePositionSettings
  initialAdjustments?: ImageAdjustments
  onSave: (result: {
    croppedBlob?: Blob
    position?: ImagePositionSettings
    adjustments?: ImageAdjustments
  }) => void
  /** 預設開啟的模式 */
  defaultMode?: EditorMode
  /** 隱藏特定模式 */
  hideModes?: EditorMode[]
}

/**
 * 統一圖片編輯器
 * 整合裁切、位置調整、色彩調整三種功能
 */
export function UnifiedImageEditor({
  open,
  onClose,
  imageSrc,
  aspectRatio = 16 / 9,
  initialPosition,
  initialAdjustments,
  onSave,
  defaultMode = 'position',
  hideModes = [],
}: UnifiedImageEditorProps) {
  const [mode, setMode] = useState<EditorMode>(defaultMode)
  const [isProcessing, setIsProcessing] = useState(false)

  // 裁切相關狀態
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [cropZoom, setCropZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  // 位置調整相關狀態
  const [position, setPosition] = useState<ImagePositionSettings>(
    initialPosition || { ...DEFAULT_IMAGE_POSITION }
  )
  const [isDragging, setIsDragging] = useState(false)
  const positionPreviewRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 })

  // 色彩調整相關狀態
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(
    initialAdjustments || { ...DEFAULT_IMAGE_ADJUSTMENTS }
  )
  const [previewImageSrc, setPreviewImageSrc] = useState(imageSrc)

  const { applyAdjustments } = useImageAdjustments()

  // 開啟時重置狀態
  useEffect(() => {
    if (open) {
      setMode(defaultMode)
      setCrop({ x: 0, y: 0 })
      setCropZoom(1)
      setPosition(initialPosition || { ...DEFAULT_IMAGE_POSITION })
      setAdjustments(initialAdjustments || { ...DEFAULT_IMAGE_ADJUSTMENTS })
      setPreviewImageSrc(imageSrc)
    }
  }, [open, imageSrc, initialPosition, initialAdjustments, defaultMode])

  // 色彩調整變更時更新預覽（帶 debounce）
  useEffect(() => {
    if (mode !== 'adjust') return

    const timeout = setTimeout(async () => {
      const processed = await applyAdjustments(imageSrc, adjustments)
      setPreviewImageSrc(processed)
    }, 100)

    return () => clearTimeout(timeout)
  }, [adjustments, imageSrc, mode, applyAdjustments])

  // 位置調整拖曳
  const handlePositionMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y,
      }
    },
    [position]
  )

  const handlePositionMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !positionPreviewRef.current) return

      const rect = positionPreviewRef.current.getBoundingClientRect()
      const deltaX = e.clientX - dragStartRef.current.x
      const deltaY = e.clientY - dragStartRef.current.y

      const percentX = (deltaX / rect.width) * 100
      const percentY = (deltaY / rect.height) * 100

      const moveMultiplier = position.scale

      setPosition((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(100, dragStartRef.current.posX - percentX * moveMultiplier)),
        y: Math.max(0, Math.min(100, dragStartRef.current.posY - percentY * moveMultiplier)),
      }))
    },
    [isDragging, position.scale]
  )

  const handlePositionMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handlePositionMouseMove)
      window.addEventListener('mouseup', handlePositionMouseUp)
      return () => {
        window.removeEventListener('mousemove', handlePositionMouseMove)
        window.removeEventListener('mouseup', handlePositionMouseUp)
      }
    }
  }, [isDragging, handlePositionMouseMove, handlePositionMouseUp])

  // 重置當前模式
  const handleReset = useCallback(() => {
    if (mode === 'crop') {
      setCrop({ x: 0, y: 0 })
      setCropZoom(1)
    } else if (mode === 'position') {
      setPosition({ ...DEFAULT_IMAGE_POSITION })
    } else if (mode === 'adjust') {
      setAdjustments({ ...DEFAULT_IMAGE_ADJUSTMENTS })
    }
  }, [mode])

  // 儲存結果
  const handleSave = useCallback(async () => {
    setIsProcessing(true)
    try {
      const result: {
        croppedBlob?: Blob
        position?: ImagePositionSettings
        adjustments?: ImageAdjustments
      } = {}

      // 如果有裁切
      if (croppedAreaPixels && mode === 'crop') {
        const blob = await getCroppedImg(imageSrc, croppedAreaPixels)
        result.croppedBlob = blob
      }

      // 位置設定
      result.position = position

      // 色彩調整
      result.adjustments = adjustments

      onSave(result)
      onClose()
    } catch (error) {
      logger.error('圖片處理失敗:', error)
      void alert('圖片處理失敗，請重試', 'error')
    } finally {
      setIsProcessing(false)
    }
  }, [croppedAreaPixels, position, adjustments, imageSrc, mode, onSave, onClose])

  // 可用的模式標籤
  const allModes: Array<{ key: EditorMode; label: string; icon: typeof Crop }> = [
    { key: 'crop', label: '裁切', icon: Crop },
    { key: 'position', label: '位置', icon: Move },
    { key: 'adjust', label: '調整', icon: Sliders },
  ]
  const modes = allModes.filter((m) => !hideModes.includes(m.key))

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent level={1} className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>編輯圖片</DialogTitle>
        </DialogHeader>

        {/* 模式切換標籤 */}
        <div className="flex border-b border-border">
          {modes.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm transition-colors',
                mode === key
                  ? 'text-morandi-gold border-b-2 border-morandi-gold'
                  : 'text-morandi-secondary hover:text-morandi-primary'
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* 編輯區域 */}
        <div className="flex-1 overflow-hidden flex gap-4 min-h-0">
          {/* 預覽區 */}
          <div className="flex-1 min-w-0">
            {/* 裁切模式 */}
            {mode === 'crop' && (
              <div className="relative h-[400px] bg-black rounded-lg overflow-hidden">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={cropZoom}
                  aspect={aspectRatio}
                  onCropChange={setCrop}
                  onZoomChange={setCropZoom}
                  onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                  objectFit="contain"
                />
              </div>
            )}

            {/* 位置模式 */}
            {mode === 'position' && (
              <div
                ref={positionPreviewRef}
                className="relative bg-black rounded-lg overflow-hidden cursor-move select-none"
                style={{ aspectRatio }}
                onMouseDown={handlePositionMouseDown}
              >
                <img
                  src={imageSrc}
                  alt="預覽"
                  className="w-full h-full object-cover pointer-events-none"
                  style={{
                    objectPosition: `${position.x}% ${position.y}%`,
                    transform: `scale(${position.scale})`,
                    transformOrigin: `${position.x}% ${position.y}%`,
                  }}
                  draggable={false}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className={cn(
                      'bg-black/50 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-2 transition-opacity',
                      isDragging ? 'opacity-0' : 'opacity-70'
                    )}
                  >
                    <Move size={14} />
                    拖曳調整位置
                  </div>
                </div>
              </div>
            )}

            {/* 調整模式 */}
            {mode === 'adjust' && (
              <div
                className="relative bg-black rounded-lg overflow-hidden"
                style={{ aspectRatio }}
              >
                <img
                  src={previewImageSrc}
                  alt="預覽"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* 控制區（調整模式時顯示在右側） */}
          {mode === 'adjust' && (
            <div className="w-64 flex-shrink-0 overflow-y-auto">
              <ImageAdjustmentsPanel
                adjustments={adjustments}
                onChange={setAdjustments}
              />
            </div>
          )}
        </div>

        {/* 底部控制列 */}
        <div className="pt-4 border-t border-border space-y-3">
          {/* 縮放控制（裁切和位置模式） */}
          {(mode === 'crop' || mode === 'position') && (
            <div className="flex items-center gap-3">
              <ZoomOut size={16} className="text-morandi-secondary" />
              <Slider
                value={[mode === 'crop' ? cropZoom : position.scale]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(values) => {
                  if (mode === 'crop') {
                    setCropZoom(values[0])
                  } else {
                    setPosition((prev) => ({ ...prev, scale: values[0] }))
                  }
                }}
                className="flex-1"
              />
              <ZoomIn size={16} className="text-morandi-secondary" />
              <span className="text-xs text-morandi-secondary w-12 text-right">
                {Math.round((mode === 'crop' ? cropZoom : position.scale) * 100)}%
              </span>
            </div>
          )}

          {/* 快速位置預設（位置模式） */}
          {mode === 'position' && (
            <div className="flex gap-2 justify-center flex-wrap">
              {[
                { label: '左上', x: 0, y: 0 },
                { label: '上', x: 50, y: 0 },
                { label: '右上', x: 100, y: 0 },
                { label: '左', x: 0, y: 50 },
                { label: '置中', x: 50, y: 50 },
                { label: '右', x: 100, y: 50 },
                { label: '左下', x: 0, y: 100 },
                { label: '下', x: 50, y: 100 },
                { label: '右下', x: 100, y: 100 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setPosition((prev) => ({ ...prev, x: preset.x, y: preset.y }))}
                  className={cn(
                    'px-2 py-1 text-xs rounded transition-colors',
                    position.x === preset.x && position.y === preset.y
                      ? 'bg-morandi-gold text-white'
                      : 'bg-morandi-container hover:bg-morandi-container/80 text-morandi-primary'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1"
            >
              <RotateCcw size={14} />
              重置
            </Button>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
                取消
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isProcessing}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-1"
              >
                <Check size={14} />
                {isProcessing ? '處理中...' : '套用'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * 裁切圖片並回傳 Blob
 */
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas context not available')
  }

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Canvas to Blob failed'))
        }
      },
      'image/jpeg',
      0.9
    )
  })
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.crossOrigin = 'anonymous'
    image.src = url
  })
}
