'use client'
import React from 'react'
import { ImageUploader } from '@/components/ui/image-uploader'
import type { ImagePositionSettings } from '@/components/ui/image-position-editor'

interface CoverImageUploadProps {
  cityImages: Array<{ url: string; label: string }>
  selectedImage: string
  onImageSelect: (url: string) => void
  onImageUpload: (url: string) => void
  position?: ImagePositionSettings
  onPositionChange?: (pos: ImagePositionSettings) => void
}

export function CoverImageUpload({
  cityImages,
  selectedImage,
  onImageSelect,
  onImageUpload,
  position,
  onPositionChange,
}: CoverImageUploadProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-morandi-primary">封面圖片</label>

      {/* 城市預設圖片選擇 */}
      {cityImages.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {cityImages.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onImageSelect(image.url)}
              className={`relative group overflow-hidden rounded-lg border-2 transition-all ${
                selectedImage === image.url
                  ? 'border-morandi-gold ring-2 ring-morandi-gold/30'
                  : 'border-morandi-container hover:border-morandi-gold/50'
              }`}
            >
              <img src={image.url} alt={image.label} className="w-full h-20 object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                <p className="text-white text-xs">{image.label}</p>
              </div>
              {selectedImage === image.url && (
                <div className="absolute top-1 right-1 bg-morandi-gold text-white text-[10px] px-1.5 py-0.5 rounded">✓</div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 上傳圖片（支援拖曳） */}
      <ImageUploader
        value={selectedImage}
        onChange={onImageUpload}
        position={position}
        onPositionChange={onPositionChange}
        bucket="city-backgrounds"
        filePrefix="itinerary"
        previewHeight="112px"
        aspectRatio={16 / 9}
        placeholder="拖曳圖片到此處，或點擊上傳"
      />
    </div>
  )
}
