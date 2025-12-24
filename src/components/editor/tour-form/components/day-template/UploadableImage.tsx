'use client'

import React from 'react'
import { Upload, Loader2, ImageIcon } from 'lucide-react'

interface UploadableImageProps {
  src?: string
  alt: string
  targetKey: { type: 'activity' | 'day'; index?: number }
  triggerUpload: (target: { type: 'activity' | 'day'; index?: number }) => void
  uploading: string | null
  className?: string
  emptySize?: string
}

export function UploadableImage({
  src,
  alt,
  targetKey,
  triggerUpload,
  uploading,
  className = '',
  emptySize = 'h-48',
}: UploadableImageProps) {
  const uploadKey = targetKey.type === 'activity' ? `activity-${targetKey.index}` : 'day'
  const isUploading = uploading === uploadKey

  if (src) {
    return (
      <div
        className={`relative group cursor-pointer overflow-hidden ${className}`}
        onClick={() => triggerUpload(targetKey)}
      >
        <img src={src} alt={alt} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {isUploading ? (
            <Loader2 size={24} className="text-white animate-spin" />
          ) : (
            <div className="text-white text-center">
              <Upload size={20} className="mx-auto mb-1" />
              <span className="text-xs">更換圖片</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${emptySize} bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 hover:border-[#2C5F4D] transition-colors ${className}`}
      onClick={() => triggerUpload(targetKey)}
    >
      {isUploading ? (
        <Loader2 size={20} className="text-gray-400 animate-spin" />
      ) : (
        <>
          <ImageIcon size={20} className="text-gray-400 mb-1" />
          <span className="text-xs text-gray-400">上傳圖片</span>
        </>
      )}
    </div>
  )
}
