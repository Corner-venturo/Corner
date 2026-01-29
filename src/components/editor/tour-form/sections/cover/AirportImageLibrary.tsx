'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useAirportImages } from '@/hooks/cloudHooks'
import { ImageUploader } from '@/components/ui/image-uploader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores'
import { logger } from '@/lib/utils/logger'
import type { AirportImage } from '@/stores/types'
import type { ImagePositionSettings } from '@/components/ui/image-position-editor'

interface AirportImageLibraryProps {
  airportCode: string
  selectedImage?: string
  onImageSelect: (url: string) => void
  onImageUpload: (url: string) => void
  position?: ImagePositionSettings
  onPositionChange?: (pos: ImagePositionSettings) => void
}

export function AirportImageLibrary({
  airportCode,
  selectedImage,
  onImageSelect,
  onImageUpload,
  position,
  onPositionChange,
}: AirportImageLibraryProps) {
  const { user } = useAuthStore()
  const { items: allImages, isLoading: loading, create, delete: deleteImage } = useAirportImages()

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newImageLabel, setNewImageLabel] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  // 過濾出該機場的圖片
  const airportImages = useMemo(() => {
    if (!airportCode) return []
    return allImages
      .filter(img => img.airport_code === airportCode)
      .sort((a, b) => a.display_order - b.display_order)
  }, [allImages, airportCode])

  // 處理上傳新圖片
  const handleUploadComplete = useCallback((url: string) => {
    setNewImageUrl(url)
  }, [])

  // 儲存新圖片到圖片庫
  const handleSaveNewImage = useCallback(async () => {
    if (!newImageUrl || !airportCode) return

    setIsUploading(true)
    try {
      const newImage: Partial<AirportImage> = {
        airport_code: airportCode,
        image_url: newImageUrl,
        label: newImageLabel || null,
        is_default: airportImages.length === 0,
        display_order: airportImages.length,
        uploaded_by: user?.id || null,
        workspace_id: user?.workspace_id || null,
      }

      await create(newImage as Omit<AirportImage, 'id' | 'created_at' | 'updated_at'>)

      setNewImageUrl('')
      setNewImageLabel('')
      setShowAddDialog(false)
      onImageUpload(newImageUrl)
    } catch (error) {
      logger.error('儲存圖片失敗:', error)
    } finally {
      setIsUploading(false)
    }
  }, [newImageUrl, newImageLabel, airportCode, airportImages.length, user, create, onImageUpload])

  // 刪除圖片
  const handleDeleteImage = useCallback(async (imageId: string) => {
    try {
      await deleteImage(imageId)
    } catch (error) {
      logger.error('刪除圖片失敗:', error)
    }
  }, [deleteImage])

  if (!airportCode) {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-morandi-primary">封面圖片</label>
        <div className="text-sm text-morandi-secondary p-4 bg-morandi-container/30 rounded-lg text-center">
          請先選擇城市
        </div>
        <ImageUploader
          value={selectedImage}
          onChange={onImageUpload}
          position={position}
          onPositionChange={onPositionChange}
          bucket="city-backgrounds"
          filePrefix="itinerary"
          previewHeight="112px"
          aspectRatio={16 / 9}
          placeholder="或直接上傳圖片"
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-morandi-primary">
          封面圖片 <span className="text-morandi-secondary font-normal">({airportCode})</span>
        </label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setShowAddDialog(true)}
          className="h-7 px-2 text-xs"
        >
          <Plus size={14} className="mr-1" />
          新增
        </Button>
      </div>

      {/* 圖片網格 */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-morandi-gold" />
        </div>
      ) : airportImages.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {airportImages.map((image) => (
            <button
              key={image.id}
              type="button"
              onClick={() => onImageSelect(image.image_url)}
              className={cn(
                'relative group overflow-hidden rounded-lg border-2 transition-all aspect-video',
                selectedImage === image.image_url
                  ? 'border-morandi-gold ring-2 ring-morandi-gold/30'
                  : 'border-morandi-container hover:border-morandi-gold/50'
              )}
            >
              <img
                src={image.image_url}
                alt={image.label || '封面圖片'}
                className="w-full h-full object-cover"
              />

              {image.label && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                  <p className="text-white text-[10px] truncate">{image.label}</p>
                </div>
              )}

              {selectedImage === image.image_url && (
                <div className="absolute top-1 right-1 bg-morandi-gold text-white text-[10px] px-1.5 py-0.5 rounded">
                  ✓
                </div>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteImage(image.id)
                }}
                className="absolute top-1 left-1 bg-red-500/80 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={12} />
              </button>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-sm text-morandi-secondary p-4 bg-morandi-container/30 rounded-lg text-center">
          尚無圖片
        </div>
      )}

      {/* 直接上傳 */}
      <ImageUploader
        value={selectedImage}
        onChange={onImageUpload}
        position={position}
        onPositionChange={onPositionChange}
        bucket="city-backgrounds"
        filePrefix="itinerary"
        previewHeight="80px"
        aspectRatio={16 / 9}
        placeholder="或直接上傳（僅用於此行程）"
      />

      {/* 新增圖片對話框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent level={1} className="max-w-md">
          <DialogHeader>
            <DialogTitle>新增圖片到 {airportCode}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <ImageUploader
              value={newImageUrl}
              onChange={handleUploadComplete}
              bucket="city-backgrounds"
              filePrefix={`airport/${airportCode}`}
              previewHeight="120px"
              aspectRatio={16 / 9}
              placeholder="上傳圖片"
            />

            <div>
              <label className="block text-sm font-medium text-morandi-primary mb-1">
                標籤（選填）
              </label>
              <Input
                value={newImageLabel}
                onChange={(e) => setNewImageLabel(e.target.value)}
                placeholder="如：春季、夏季、寺廟..."
                className="h-9"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false)
                  setNewImageUrl('')
                  setNewImageLabel('')
                }}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                type="button"
                onClick={handleSaveNewImage}
                disabled={!newImageUrl || isUploading}
                className="flex-1 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                {isUploading ? <Loader2 size={14} className="animate-spin" /> : '加入圖片庫'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
