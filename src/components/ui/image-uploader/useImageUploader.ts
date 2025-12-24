'use client'

import { useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { alert } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'
import { ImagePositionSettings } from '../image-position-editor'

export interface UseImageUploaderProps {
  value?: string | null
  onChange: (url: string) => void
  position?: ImagePositionSettings | null
  onPositionChange?: (position: ImagePositionSettings) => void
  bucket?: string
  filePrefix?: string
  maxSize?: number
}

export function useImageUploader({
  value,
  onChange,
  position,
  onPositionChange,
  bucket = 'city-backgrounds',
  filePrefix = 'upload',
  maxSize = 5 * 1024 * 1024,
}: UseImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 從 URL 提取檔名
  const extractFileName = useCallback((url: string): string | null => {
    if (!url) return null
    const match = url.match(new RegExp(`${bucket}/([^?]+)`))
    return match ? match[1] : null
  }, [bucket])

  // 刪除 Storage 中的圖片
  const deleteStorageImage = useCallback(async (url: string) => {
    const fileName = extractFileName(url)
    if (!fileName) return

    // 只刪除指定前綴的圖片
    if (!fileName.startsWith(filePrefix)) return

    try {
      await supabase.storage.from(bucket).remove([fileName])
    } catch (err) {
      logger.error('刪除圖片失敗:', err)
    }
  }, [bucket, filePrefix, extractFileName])

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
  }, [maxSize, bucket, filePrefix, value, onChange, onPositionChange, deleteStorageImage])

  // 從 URL 下載並上傳圖片
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

  // 處理檔案選擇
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      void uploadFile(file)
    }
    // 清除 input 值
    event.target.value = ''
  }, [uploadFile])

  // 處理拖曳
  const handleDragOver = useCallback((e: React.DragEvent, disabled: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, disabled: boolean) => {
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
  }, [uploadFile, fetchAndUploadImage])

  // 刪除圖片
  const handleDelete = useCallback(async () => {
    if (value) {
      await deleteStorageImage(value)
      onChange('')
    }
  }, [value, deleteStorageImage, onChange])

  // 點擊上傳區域
  const handleClick = useCallback((disabled: boolean, uploading: boolean) => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click()
    }
  }, [])

  // 位置調整確認
  const handlePositionConfirm = useCallback((settings: ImagePositionSettings) => {
    onPositionChange?.(settings)
  }, [onPositionChange])

  return {
    uploading,
    isDragOver,
    showEditor,
    setShowEditor,
    fileInputRef,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDelete,
    handleClick,
    handlePositionConfirm,
  }
}
