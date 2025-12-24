'use client'

import React from 'react'
import { Upload, X, Crop, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ImagePositionSettings, getImagePositionStyle } from '../image-position-editor'

export interface ImagePreviewProps {
  value: string
  position?: ImagePositionSettings | null
  uploading: boolean
  isDragOver: boolean
  previewHeight: string
  showPositionEditor: boolean
  showDeleteButton: boolean
  onPositionChange?: (position: ImagePositionSettings) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onUploadClick: () => void
  onPositionClick: () => void
  onDelete: () => void
}

export function ImagePreview({
  value,
  position,
  uploading,
  isDragOver,
  previewHeight,
  showPositionEditor,
  showDeleteButton,
  onPositionChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onUploadClick,
  onPositionClick,
  onDelete,
}: ImagePreviewProps) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "relative rounded-lg overflow-hidden border-2 group transition-all",
        isDragOver ? "border-morandi-gold bg-morandi-gold/20" : "border-morandi-gold"
      )}
      style={{ height: previewHeight }}
    >
      <img
        src={value}
        alt="預覽"
        className="w-full h-full object-cover"
        style={getImagePositionStyle(position)}
      />

      {/* 拖放提示 */}
      {isDragOver && (
        <div className="absolute inset-0 bg-morandi-gold/30 flex items-center justify-center">
          <div className="bg-white/90 px-4 py-2 rounded-lg text-sm font-medium text-morandi-primary">
            放開以更換圖片
          </div>
        </div>
      )}

      {/* 操作按鈕 */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {/* 更換圖片 */}
        <button
          type="button"
          onClick={onUploadClick}
          disabled={uploading}
          className="p-2 bg-white/90 hover:bg-white rounded-full text-morandi-primary transition-colors"
          title="更換圖片"
        >
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
        </button>

        {/* 位置調整 */}
        {showPositionEditor && onPositionChange && (
          <button
            type="button"
            onClick={onPositionClick}
            className="p-2 bg-white/90 hover:bg-white rounded-full text-morandi-primary transition-colors"
            title="調整位置"
          >
            <Crop size={18} />
          </button>
        )}

        {/* 刪除 */}
        {showDeleteButton && (
          <button
            type="button"
            onClick={onDelete}
            className="p-2 bg-white/90 hover:bg-red-50 rounded-full text-red-500 transition-colors"
            title="刪除圖片"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* 上傳中遮罩 */}
      {uploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-white" />
        </div>
      )}
    </div>
  )
}
