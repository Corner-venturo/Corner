'use client'

import React, { useRef } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { DailyImage } from '../../types'

// 工具函數：建立 DailyImage 物件
function createDailyImage(url: string, position?: string): DailyImage {
  return { url, position: position || 'center' }
}

interface ImageUploadZoneProps {
  images: (string | DailyImage)[]
  isUploading: boolean
  uploadProgress: number
  isDragOver: boolean
  onDragOver: (isDragOver: boolean) => void
  onFileSelect: (files: FileList | File[]) => void
  onDrop: (e: React.DragEvent) => void
}

export function ImageUploadZone({
  images,
  isUploading,
  uploadProgress,
  isDragOver,
  onDragOver,
  onFileSelect,
  onDrop,
}: ImageUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 處理檔案選擇
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileSelect(files)
    }
    e.target.value = ''
  }

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-4 transition-colors ${
        isDragOver
          ? 'border-morandi-gold bg-morandi-gold/10'
          : 'border-morandi-container bg-morandi-container/10'
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onDragOver(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onDragOver(false)
      }}
      onDrop={onDrop}
    >
      {/* 上傳按鈕區 */}
      <div
        className={`flex flex-col items-center justify-center py-6 cursor-pointer hover:bg-morandi-container/20 rounded-lg transition-colors ${
          images.length > 0 ? 'border-t border-morandi-container/50 mt-2 pt-4' : ''
        }`}
        onClick={() => {
          fileInputRef.current?.click()
        }}
      >
        {isUploading ? (
          <>
            <Loader2 size={32} className="text-morandi-gold animate-spin mb-2" />
            <span className="text-sm text-morandi-secondary">
              上傳中... {uploadProgress}%
            </span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 px-4 py-2 bg-morandi-gold text-white rounded-lg hover:bg-morandi-gold-hover transition-colors">
              <Plus size={18} />
              <span className="text-sm font-medium">選擇照片上傳</span>
            </div>
            <span className="text-xs text-morandi-secondary mt-2">
              或將照片拖曳到此區域
            </span>
          </>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
