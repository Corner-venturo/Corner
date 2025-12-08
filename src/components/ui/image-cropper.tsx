'use client'

import React, { useState, useCallback } from 'react'
import Cropper, { Area } from 'react-easy-crop'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

interface ImageCropperProps {
  open: boolean
  onClose: () => void
  imageSrc: string
  aspectRatio?: number
  onCropComplete: (croppedBlob: Blob) => void
}

// 從 Cropper 輸出的區域裁切圖片
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas context not available')
  }

  // 設定 canvas 大小為裁切區域大小
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // 繪製裁切後的圖片
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

  // 轉換為 Blob
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

// 建立 Image 物件
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.crossOrigin = 'anonymous'
    image.src = url
  })
}

export function ImageCropper({
  open,
  onClose,
  imageSrc,
  aspectRatio = 16 / 9, // 封面預設 16:9
  onCropComplete,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onCropChange = useCallback((location: { x: number; y: number }) => {
    setCrop(location)
  }, [])

  const onZoomChange = useCallback((zoomValue: number) => {
    setZoom(zoomValue)
  }, [])

  const onCropAreaComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const handleReset = useCallback(() => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!croppedAreaPixels) return

    setIsProcessing(true)
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      onCropComplete(croppedBlob)
      onClose()
    } catch (error) {
      console.error('裁切圖片失敗:', error)
      alert('裁切圖片失敗，請重試')
    } finally {
      setIsProcessing(false)
    }
  }, [croppedAreaPixels, imageSrc, onCropComplete, onClose])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>調整封面圖片</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 裁切區域 */}
          <div className="relative h-[400px] bg-black rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropAreaComplete}
              objectFit="contain"
            />
          </div>

          {/* 控制區 */}
          <div className="space-y-3">
            {/* 縮放控制 */}
            <div className="flex items-center gap-3">
              <ZoomOut size={16} className="text-morandi-secondary" />
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(values) => setZoom(values[0])}
                className="flex-1"
              />
              <ZoomIn size={16} className="text-morandi-secondary" />
              <span className="text-xs text-morandi-secondary w-12 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

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
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isProcessing}
                >
                  取消
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                >
                  {isProcessing ? '處理中...' : '確認裁切'}
                </Button>
              </div>
            </div>
          </div>

          {/* 提示文字 */}
          <p className="text-xs text-morandi-secondary text-center">
            拖曳圖片調整位置，使用滑桿調整縮放比例
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
