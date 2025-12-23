'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Loader2, X, GripVertical, Plus, Move, ZoomIn, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { DailyImage } from '../types'
import { ThreeDPhotoWall } from '@/components/ui/3d-photo-wall'

interface DailyImagesUploaderProps {
  dayIndex: number
  images: (string | DailyImage)[]
  onImagesChange: (images: (string | DailyImage)[]) => void
  allTourImages?: string[] // 整個行程的所有每日照片（用於照片牆）
}

// 工具函數：取得圖片 URL
function getImageUrl(image: string | DailyImage): string {
  return typeof image === 'string' ? image : image.url
}

// 工具函數：取得圖片 position
function getImagePosition(image: string | DailyImage): string {
  return typeof image === 'string' ? 'center' : (image.position || 'center')
}

// 工具函數：建立 DailyImage 物件
function createDailyImage(url: string, position?: string): DailyImage {
  return { url, position: position || 'center' }
}

// 可拖曳的縮圖組件
function SortableImageItem({
  image,
  index,
  onRemove,
  onEdit,
  onPreview,
}: {
  image: string | DailyImage
  index: number
  onRemove: () => void
  onEdit: () => void
  onPreview: () => void
}) {
  const imageUrl = getImageUrl(image)
  const imagePosition = getImagePosition(image)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: imageUrl })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group aspect-video rounded-lg overflow-hidden border border-morandi-container bg-morandi-container/20"
    >
      <img
        src={imageUrl}
        alt={`圖片 ${index + 1}`}
        className="w-full h-full object-cover cursor-pointer"
        style={{ objectPosition: imagePosition }}
        onClick={onPreview}
      />
      {/* 拖曳把手 */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 p-1 bg-black/50 hover:bg-black/70 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical size={14} className="text-white" />
      </div>
      {/* 序號標籤 */}
      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 rounded text-white text-xs font-medium">
        {index + 1}
      </div>
      {/* 調整位置按鈕 */}
      <button
        type="button"
        onClick={onEdit}
        className="absolute bottom-1 right-8 p-1 bg-black/50 hover:bg-morandi-gold rounded text-white opacity-0 group-hover:opacity-100 transition-all"
        title="調整顯示位置"
      >
        <Move size={14} />
      </button>
      {/* 刪除按鈕 */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-500 rounded text-white opacity-0 group-hover:opacity-100 transition-all"
      >
        <X size={14} />
      </button>
      {/* 預覽按鈕 */}
      <button
        type="button"
        onClick={onPreview}
        className="absolute bottom-1 right-1 p-1 bg-black/50 hover:bg-morandi-gold rounded text-white opacity-0 group-hover:opacity-100 transition-all"
        title="預覽大圖"
      >
        <ZoomIn size={14} />
      </button>
    </div>
  )
}

// 圖片位置編輯器
function ImagePositionEditor({
  image,
  onSave,
  onClose,
}: {
  image: string | DailyImage
  onSave: (position: string) => void
  onClose: () => void
}) {
  const imageUrl = getImageUrl(image)
  const initialPosition = getImagePosition(image)

  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(initialPosition)
  const [isDragging, setIsDragging] = useState(false)

  // 解析 position 字串為百分比
  const parsePosition = (pos: string): { x: number; y: number } => {
    // 處理預設關鍵字
    const keywords: Record<string, { x: number; y: number }> = {
      'center': { x: 50, y: 50 },
      'top': { x: 50, y: 0 },
      'bottom': { x: 50, y: 100 },
      'left': { x: 0, y: 50 },
      'right': { x: 100, y: 50 },
      'center top': { x: 50, y: 0 },
      'center bottom': { x: 50, y: 100 },
      'left top': { x: 0, y: 0 },
      'right top': { x: 100, y: 0 },
      'left bottom': { x: 0, y: 100 },
      'right bottom': { x: 100, y: 100 },
    }

    if (keywords[pos]) return keywords[pos]

    // 解析百分比格式 "50% 30%"
    const match = pos.match(/(\d+)%?\s+(\d+)%?/)
    if (match) {
      return { x: parseInt(match[1]), y: parseInt(match[2]) }
    }

    return { x: 50, y: 50 }
  }

  const { x, y } = parsePosition(position)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const newX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const newY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))

    setPosition(`${Math.round(newX)}% ${Math.round(newY)}%`)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // 快速預設位置
  const presetPositions = [
    { label: '置中', value: 'center' },
    { label: '上方', value: 'center top' },
    { label: '下方', value: 'center bottom' },
    { label: '左上', value: 'left top' },
    { label: '右上', value: 'right top' },
    { label: '左下', value: 'left bottom' },
    { label: '右下', value: 'right bottom' },
  ]

  return (
    <div className="space-y-4">
      {/* 預覽區域 */}
      <div className="relative">
        <p className="text-sm text-morandi-secondary mb-2">
          拖曳下方的定位點，或點擊預設位置
        </p>
        {/* 模擬橫向裁切框 */}
        <div
          ref={containerRef}
          className="relative w-full aspect-[16/9] bg-gray-900 rounded-lg overflow-hidden cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={imageUrl}
            alt="調整位置"
            className="w-full h-full object-cover"
            style={{ objectPosition: position }}
            draggable={false}
          />
          {/* 定位點指示器 */}
          <div
            className="absolute w-6 h-6 bg-morandi-gold border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${x}%`, top: `${y}%` }}
          />
          {/* 網格線 */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
          </div>
        </div>
      </div>

      {/* 快速預設按鈕 */}
      <div className="flex flex-wrap gap-2">
        {presetPositions.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => setPosition(preset.value)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              position === preset.value
                ? 'bg-morandi-gold text-white border-morandi-gold'
                : 'bg-white text-morandi-secondary border-morandi-container hover:border-morandi-gold'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* 目前位置值 */}
      <div className="text-xs text-morandi-secondary">
        目前位置：<code className="bg-morandi-container/50 px-2 py-0.5 rounded">{position}</code>
      </div>

      {/* 操作按鈕 */}
      <div className="flex justify-end gap-2 pt-2 border-t border-morandi-container">
        <Button type="button" variant="ghost" onClick={onClose}>
          取消
        </Button>
        <Button
          type="button"
          onClick={() => onSave(position)}
          className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
        >
          <Check size={16} className="mr-1" />
          確定
        </Button>
      </div>
    </div>
  )
}

// 圖片預覽 Modal
function ImagePreviewModal({
  images,
  currentIndex,
  onClose,
  onNavigate,
}: {
  images: (string | DailyImage)[]
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
}) {
  const currentImage = images[currentIndex]
  const imageUrl = getImageUrl(currentImage)

  // 鍵盤導航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1)
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1) onNavigate(currentIndex + 1)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, images.length, onClose, onNavigate])

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 bg-black/95 border-none">
        <VisuallyHidden>
          <DialogTitle>圖片預覽</DialogTitle>
          <DialogDescription>預覽每日圖片，可使用左右鍵切換</DialogDescription>
        </VisuallyHidden>
        <div className="relative">
          {/* 關閉按鈕 */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
          >
            <X size={20} />
          </button>

          {/* 圖片 */}
          <div className="flex items-center justify-center min-h-[60vh] p-4">
            <img
              src={imageUrl}
              alt={`圖片 ${currentIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>

          {/* 導航按鈕 */}
          {images.length > 1 && (
            <>
              {currentIndex > 0 && (
                <button
                  type="button"
                  onClick={() => onNavigate(currentIndex - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15,18 9,12 15,6" />
                  </svg>
                </button>
              )}
              {currentIndex < images.length - 1 && (
                <button
                  type="button"
                  onClick={() => onNavigate(currentIndex + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9,6 15,12 9,18" />
                  </svg>
                </button>
              )}
            </>
          )}

          {/* 計數器 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 rounded-full text-white text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function DailyImagesUploader({
  dayIndex,
  images,
  onImagesChange,
  allTourImages = [],
}: DailyImagesUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [showPhotoWall, setShowPhotoWall] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 取得所有圖片的 URL 作為 sortable items
  const imageUrls = images.map(getImageUrl)

  // 處理拖曳排序結束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = imageUrls.findIndex((url) => url === active.id)
    const newIndex = imageUrls.findIndex((url) => url === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newImages = arrayMove(images, oldIndex, newIndex)
      onImagesChange(newImages)
    }
  }

  // 上傳多張圖片
  const handleMultipleUpload = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    )

    if (imageFiles.length === 0) {
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    const newImages: DailyImage[] = []
    let completed = 0

    try {
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `day-${dayIndex + 1}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
        const filePath = `tour-daily-images/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('workspace-files')
          .upload(filePath, file)

        if (uploadError) {
          logger.error('[DailyImagesUploader] 上傳失敗:', uploadError)
          toast.error(`圖片上傳失敗: ${uploadError.message}`)
          continue
        }

        const { data } = supabase.storage
          .from('workspace-files')
          .getPublicUrl(filePath)

        newImages.push(createDailyImage(data.publicUrl))
        completed++
        setUploadProgress(Math.round((completed / imageFiles.length) * 100))
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages])
      }
    } catch (error) {
      logger.error('[DailyImagesUploader] 意外錯誤:', error)
      toast.error(`上傳過程發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // 處理檔案選擇
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleMultipleUpload(files)
    }
    e.target.value = ''
  }

  // 從 URL 下載圖片並上傳到 Supabase
  const uploadImageFromUrl = async (imageUrl: string): Promise<string | null> => {
    try {
      setIsUploading(true)
      setUploadProgress(10)

      // 下載圖片（可能會遇到 CORS 問題）
      let response: Response
      try {
        response = await fetch(imageUrl, { mode: 'cors' })
      } catch (fetchError) {
        // CORS 錯誤 - 嘗試用 no-cors 模式（但這樣無法取得內容）
        logger.error('CORS 錯誤，無法下載此圖片:', imageUrl)
        toast.error('此網站不允許下載圖片，請改用右鍵另存圖片後上傳')
        return null
      }

      if (!response.ok) {
        toast.error('無法下載圖片，請改用右鍵另存圖片後上傳')
        return null
      }

      setUploadProgress(40)
      const blob = await response.blob()

      // 檢查是否為有效圖片
      if (!blob.type.startsWith('image/') && blob.size === 0) {
        toast.error('下載的內容不是有效圖片')
        return null
      }

      // 從 URL 或 content-type 判斷副檔名
      const contentType = blob.type || 'image/jpeg'
      const extMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/svg+xml': 'svg',
        'image/bmp': 'bmp',
        'image/avif': 'avif',
      }
      const ext = extMap[contentType] || 'jpg'

      setUploadProgress(60)

      // 上傳到 Supabase
      const fileName = `day-${dayIndex + 1}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
      const filePath = `tour-daily-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('workspace-files')
        .upload(filePath, blob, { contentType })

      if (uploadError) {
        logger.error('Supabase 上傳失敗:', uploadError)
        toast.error('上傳到伺服器失敗')
        return null
      }

      setUploadProgress(90)

      const { data } = supabase.storage
        .from('workspace-files')
        .getPublicUrl(filePath)

      setUploadProgress(100)
      return data.publicUrl
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤'
      logger.error('上傳圖片失敗:', errorMessage)
      toast.error(`上傳失敗: ${errorMessage}`)
      return null
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // 處理拖曳放置（支援本機檔案和網頁圖片 URL）
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    // 1. 優先嘗試從瀏覽器拖曳的圖片 URL
    const html = e.dataTransfer.getData('text/html')
    if (html) {
      const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i)
      if (imgMatch && imgMatch[1]) {
        const imageUrl = imgMatch[1]
        // 跳過 data: URL 和 blob: URL
        if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('blob:')) {
          toast.info('正在下載並上傳圖片...')
          const uploadedUrl = await uploadImageFromUrl(imageUrl)
          if (uploadedUrl) {
            onImagesChange([...images, createDailyImage(uploadedUrl)])
            toast.success('圖片已上傳')
          } else {
            toast.error('圖片上傳失敗')
          }
          return
        }
      }
    }

    // 2. 嘗試從 URL 下載並上傳
    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.avif']
      const lowerUrl = url.toLowerCase()
      const isImageUrl = imageExtensions.some(ext => lowerUrl.includes(ext)) ||
                         lowerUrl.includes('image') ||
                         lowerUrl.includes('photo') ||
                         lowerUrl.includes('unsplash') ||
                         lowerUrl.includes('imgur') ||
                         lowerUrl.includes('pexels') ||
                         lowerUrl.includes('pixabay') ||
                         lowerUrl.includes('googleusercontent')

      if (isImageUrl) {
        toast.info('正在下載並上傳圖片...')
        const uploadedUrl = await uploadImageFromUrl(url)
        if (uploadedUrl) {
          onImagesChange([...images, createDailyImage(uploadedUrl)])
          toast.success('圖片已上傳')
        } else {
          toast.error('圖片上傳失敗')
        }
        return
      }
    }

    // 3. 處理本機檔案
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const realImageFiles = Array.from(files).filter(
        file => file.type.startsWith('image/') && file.size > 0
      )
      if (realImageFiles.length > 0) {
        handleMultipleUpload(realImageFiles)
        return
      }
    }

    // 4. 嘗試任何 URL（可能是圖片）
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      toast.info('正在嘗試下載並上傳...')
      const uploadedUrl = await uploadImageFromUrl(url)
      if (uploadedUrl) {
        onImagesChange([...images, createDailyImage(uploadedUrl)])
        toast.success('圖片已上傳')
      } else {
        toast.error('無法下載或上傳圖片')
      }
      return
    }

    toast.error('無法識別拖曳的內容，請嘗試直接上傳檔案')
  }

  // 刪除圖片
  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  // 更新圖片位置
  const handleUpdatePosition = (index: number, position: string) => {
    const newImages = images.map((img, i) => {
      if (i !== index) return img
      const url = getImageUrl(img)
      return createDailyImage(url, position)
    })
    onImagesChange(newImages)
    setEditingIndex(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-morandi-primary">每日圖片</label>
          <p className="text-xs text-morandi-secondary mt-1">
            點擊縮圖可預覽，點擊 <Move size={12} className="inline" /> 可調整顯示位置
          </p>
        </div>
        <span className="text-xs text-morandi-secondary">
          {images.length} 張
        </span>
      </div>

      {/* 上傳區域 + 縮圖網格 */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-4 transition-colors ${
          isDragOver
            ? 'border-morandi-gold bg-morandi-gold/10'
            : 'border-morandi-container bg-morandi-container/10'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsDragOver(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsDragOver(false)
        }}
        onDrop={handleDrop}
      >
        {/* 縮圖網格 */}
        {images.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={imageUrls} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {images.map((image, index) => (
                  <SortableImageItem
                    key={getImageUrl(image)}
                    image={image}
                    index={index}
                    onRemove={() => handleRemoveImage(index)}
                    onEdit={() => setEditingIndex(index)}
                    onPreview={() => setPreviewIndex(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

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

      {/* 位置編輯 Modal */}
      {editingIndex !== null && (
        <Dialog open onOpenChange={() => setEditingIndex(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>調整圖片顯示位置</DialogTitle>
            </DialogHeader>
            <ImagePositionEditor
              image={images[editingIndex]}
              onSave={(position) => handleUpdatePosition(editingIndex, position)}
              onClose={() => setEditingIndex(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* 預覽 - 如果有整個行程的照片就顯示照片牆，否則顯示單張預覽 */}
      {previewIndex !== null && (
        allTourImages.length >= 4 ? (
          <ThreeDPhotoWall
            images={allTourImages}
            onClose={() => setPreviewIndex(null)}
          />
        ) : (
          <ImagePreviewModal
            images={images}
            currentIndex={previewIndex}
            onClose={() => setPreviewIndex(null)}
            onNavigate={setPreviewIndex}
          />
        )
      )}
    </div>
  )
}
