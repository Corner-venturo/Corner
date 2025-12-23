'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Upload, X, Crop, Loader2, ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { alert } from '@/lib/ui/alert-dialog'
import { ImagePositionEditor, ImagePositionSettings, getImagePositionStyle } from './image-position-editor'
import { logger } from '@/lib/utils/logger'

export interface ImageUploaderProps {
  /** 當前圖片 URL */
  value?: string | null
  /** 圖片變更回調 */
  onChange: (url: string) => void
  /** 位置設定（選填） */
  position?: ImagePositionSettings | null
  /** 位置變更回調（選填） */
  onPositionChange?: (position: ImagePositionSettings) => void
  /** Storage bucket 名稱 */
  bucket?: string
  /** 檔名前綴 */
  filePrefix?: string
  /** 最大檔案大小 (bytes)，預設 5MB */
  maxSize?: number
  /** 預覽寬高比，預設 16/9 */
  aspectRatio?: number
  /** 預覽高度 */
  previewHeight?: string
  /** 是否顯示位置調整按鈕 */
  showPositionEditor?: boolean
  /** 是否顯示刪除按鈕 */
  showDeleteButton?: boolean
  /** 自訂 className */
  className?: string
  /** 佔位文字 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
}

/**
 * 統一的圖片上傳組件
 * 支援：拖曳上傳、點擊上傳、預覽、位置調整
 */
export function ImageUploader({
  value,
  onChange,
  position,
  onPositionChange,
  bucket = 'city-backgrounds',
  filePrefix = 'upload',
  maxSize = 5 * 1024 * 1024, // 5MB
  aspectRatio = 16 / 9,
  previewHeight = '120px',
  showPositionEditor = true,
  showDeleteButton = true,
  className,
  placeholder = '拖曳圖片到此處，或點擊上傳',
  disabled = false,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 從 URL 提取檔名
  const extractFileName = (url: string): string | null => {
    if (!url) return null
    const match = url.match(new RegExp(`${bucket}/([^?]+)`))
    return match ? match[1] : null
  }

  // 刪除 Storage 中的圖片
  const deleteStorageImage = async (url: string) => {
    const fileName = extractFileName(url)
    if (!fileName) return

    // 只刪除指定前綴的圖片
    if (!fileName.startsWith(filePrefix)) return

    try {
      await supabase.storage.from(bucket).remove([fileName])
    } catch (err) {
      logger.error('刪除圖片失敗:', err)
    }
  }

  // 上傳檔案
  const uploadFile = useCallback(async (file: File) => {
    // 檢查檔案大小
    if (file.size > maxSize) {
      void alert(`檔案太大！請選擇小於 ${Math.round(maxSize / 1024 / 1024)}MB 的圖片`, 'warning')
      return
    }

    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      void alert('請選擇圖片檔案', 'warning')
      return
    }

    setUploading(true)
    const oldImageUrl = value

    try {
      // 生成唯一檔名
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `${filePrefix}_${timestamp}_${randomStr}.${fileExt}`

      // 上傳到 Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // 取得公開網址
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName)

      // 刪除舊圖片
      if (oldImageUrl) {
        await deleteStorageImage(oldImageUrl)
      }

      // 更新
      onChange(urlData.publicUrl)

      // 重置位置
      if (onPositionChange) {
        onPositionChange({ x: 50, y: 50, scale: 1 })
      }
    } catch (error) {
      logger.error('上傳失敗:', error)
      void alert('圖片上傳失敗，請稍後再試', 'error')
    } finally {
      setUploading(false)
    }
  }, [maxSize, bucket, filePrefix, value, onChange, onPositionChange])

  // 處理檔案選擇
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      void uploadFile(file)
    }
    // 清除 input 值
    event.target.value = ''
  }

  // 處理拖曳
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  // 從 URL 下載並上傳圖片（必須在 handleDrop 之前定義）
  const fetchAndUploadImage = useCallback(async (imageUrl: string) => {
    setUploading(true)
    try {
      // 嘗試透過後端 API 下載（避免 CORS 問題）
      const response = await fetch('/api/fetch-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrl }),
      })

      if (!response.ok) {
        // 如果後端 API 不存在，嘗試直接下載
        const directResponse = await fetch(imageUrl, { mode: 'cors' })
        if (!directResponse.ok) throw new Error('無法下載圖片')

        const blob = await directResponse.blob()
        if (!blob.type.startsWith('image/')) {
          throw new Error('URL 不是圖片')
        }

        const file = new File([blob], 'dragged-image.jpg', { type: blob.type })
        await uploadFile(file)
        return
      }

      const blob = await response.blob()
      const file = new File([blob], 'dragged-image.jpg', { type: blob.type || 'image/jpeg' })
      await uploadFile(file)
    } catch (error) {
      logger.error('下載圖片失敗:', error)
      void alert('無法從該網址下載圖片（可能有跨域限制），請先下載到本機再上傳', 'warning')
    } finally {
      setUploading(false)
    }
  }, [uploadFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (disabled) return

    // 方法 1: 檢查 files（本地拖曳的檔案）
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        void uploadFile(file)
        return
      }
    }

    // 方法 2: 檢查 items（瀏覽器拖曳的圖片可能在這裡）
    const items = e.dataTransfer.items
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        // 如果是圖片類型的 file
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            void uploadFile(file)
            return
          }
        }
      }
    }

    // 方法 3: 嘗試從 HTML 中解析圖片 URL
    const html = e.dataTransfer.getData('text/html')
    if (html) {
      const match = html.match(/<img[^>]+src="([^"]+)"/)
      if (match && match[1]) {
        const imgSrc = match[1]
        if (imgSrc.startsWith('http://') || imgSrc.startsWith('https://')) {
          void fetchAndUploadImage(imgSrc)
          return
        }
      }
    }

    // 方法 4: 處理純 URL
    const imageUrl = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')
    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      void fetchAndUploadImage(imageUrl)
      return
    }

    // 都沒有找到圖片
    void alert('請拖曳圖片檔案', 'warning')
  }, [disabled, uploadFile, fetchAndUploadImage])

  // 刪除圖片
  const handleDelete = async () => {
    if (value) {
      await deleteStorageImage(value)
      onChange('')
    }
  }

  // 點擊上傳區域
  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click()
    }
  }

  // 位置調整確認
  const handlePositionConfirm = (settings: ImagePositionSettings) => {
    onPositionChange?.(settings)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* 隱藏的 file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        className="hidden"
      />

      {/* 上傳區域 / 預覽 */}
      {value ? (
        // 有圖片時顯示預覽（也支援拖放更換）
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
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
              onClick={handleClick}
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
                onClick={() => setShowEditor(true)}
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
                onClick={handleDelete}
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
      ) : (
        // 沒有圖片時顯示上傳區域
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center gap-2',
            isDragOver
              ? 'border-morandi-gold bg-morandi-gold/10'
              : 'border-morandi-container hover:border-morandi-gold/50 hover:bg-morandi-container/30',
            disabled && 'opacity-50 cursor-not-allowed',
            uploading && 'pointer-events-none'
          )}
          style={{ height: previewHeight }}
        >
          {uploading ? (
            <>
              <Loader2 size={24} className="animate-spin text-morandi-gold" />
              <span className="text-sm text-morandi-secondary">上傳中...</span>
            </>
          ) : (
            <>
              <ImageIcon size={24} className="text-morandi-secondary" />
              <span className="text-sm text-morandi-secondary text-center px-4">{placeholder}</span>
              <span className="text-xs text-morandi-secondary/70">
                最大 {Math.round(maxSize / 1024 / 1024)}MB
              </span>
            </>
          )}
        </div>
      )}

      {/* 位置調整編輯器 */}
      {showPositionEditor && value && (
        <ImagePositionEditor
          open={showEditor}
          onClose={() => setShowEditor(false)}
          imageSrc={value}
          currentPosition={position}
          onConfirm={handlePositionConfirm}
          aspectRatio={aspectRatio}
          title="調整圖片位置"
        />
      )}
    </div>
  )
}

/**
 * 多圖上傳組件
 * 用於每日行程圖片等需要多張圖片的場景
 */
export interface MultiImageUploaderProps {
  /** 當前圖片 URL 列表 */
  value: string[]
  /** 圖片變更回調 */
  onChange: (urls: string[]) => void
  /** 最大圖片數量 */
  maxCount?: number
  /** Storage bucket 名稱 */
  bucket?: string
  /** 檔名前綴 */
  filePrefix?: string
  /** 最大檔案大小 (bytes) */
  maxSize?: number
  /** 預覽高度 */
  previewHeight?: string
  /** 自訂 className */
  className?: string
  /** 是否禁用 */
  disabled?: boolean
}

export function MultiImageUploader({
  value = [],
  onChange,
  maxCount = 10,
  bucket = 'city-backgrounds',
  filePrefix = 'multi',
  maxSize = 5 * 1024 * 1024,
  previewHeight = '80px',
  className,
  disabled = false,
}: MultiImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 上傳檔案
  const uploadFile = async (file: File): Promise<string | null> => {
    if (file.size > maxSize) {
      void alert(`檔案太大！請選擇小於 ${Math.round(maxSize / 1024 / 1024)}MB 的圖片`, 'warning')
      return null
    }

    if (!file.type.startsWith('image/')) {
      return null
    }

    try {
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `${filePrefix}_${timestamp}_${randomStr}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName)
      return urlData.publicUrl
    } catch (error) {
      logger.error('上傳失敗:', error)
      return null
    }
  }

  // 處理多檔案選擇
  const handleFilesSelect = async (files: FileList) => {
    if (value.length >= maxCount) {
      void alert(`最多只能上傳 ${maxCount} 張圖片`, 'warning')
      return
    }

    const remainingSlots = maxCount - value.length
    const filesToUpload = Array.from(files).slice(0, remainingSlots)

    setUploading(true)
    const newUrls: string[] = []

    for (const file of filesToUpload) {
      const url = await uploadFile(file)
      if (url) {
        newUrls.push(url)
      }
    }

    if (newUrls.length > 0) {
      onChange([...value, ...newUrls])
    }

    setUploading(false)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      void handleFilesSelect(files)
    }
    event.target.value = ''
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragOver(true)
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      void handleFilesSelect(files)
    }
  }, [disabled, value.length, maxCount])

  const handleRemove = async (index: number) => {
    const urlToRemove = value[index]
    const newUrls = value.filter((_, i) => i !== index)
    onChange(newUrls)

    // 嘗試刪除 storage 中的圖片
    const fileName = urlToRemove.match(new RegExp(`${bucket}/([^?]+)`))?.[1]
    if (fileName?.startsWith(filePrefix)) {
      try {
        await supabase.storage.from(bucket).remove([fileName])
      } catch (err) {
        logger.error('刪除圖片失敗:', err)
      }
    }
  }

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        className="hidden"
      />

      {/* 已上傳的圖片 */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((url, index) => (
            <div
              key={index}
              className="relative group rounded-lg overflow-hidden border border-morandi-container"
              style={{ width: previewHeight, height: previewHeight }}
            >
              <img
                src={url}
                alt={`圖片 ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 上傳區域 */}
      {value.length < maxCount && (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 px-4',
            isDragOver
              ? 'border-morandi-gold bg-morandi-gold/10'
              : 'border-morandi-container hover:border-morandi-gold/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{ height: previewHeight }}
        >
          {uploading ? (
            <Loader2 size={18} className="animate-spin text-morandi-gold" />
          ) : (
            <>
              <Upload size={18} className="text-morandi-secondary" />
              <span className="text-sm text-morandi-secondary">
                拖曳或點擊上傳 ({value.length}/{maxCount})
              </span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
