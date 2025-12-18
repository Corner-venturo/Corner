import React, { useState, useRef, useMemo } from 'react'
import { TourFormData, Feature, FeaturesStyleType } from '../types'
import { Loader2, X, Plus, GripVertical, Palette } from 'lucide-react'
import { useTemplates, getTemplateColor } from '@/features/itinerary/hooks/useTemplates'
import { supabase } from '@/lib/supabase/client'
import { alert } from '@/lib/ui/alert-dialog'

// 預設標籤顏色選項（Luxury 配色）
const TAG_COLOR_OPTIONS = [
  { value: '#2C5F4D', label: '深綠', preview: 'bg-[#2C5F4D]' },
  { value: '#C69C6D', label: '金色', preview: 'bg-[#C69C6D]' },
  { value: '#8F4F4F', label: '酒紅', preview: 'bg-[#8F4F4F]' },
  { value: '#636E72', label: '灰色', preview: 'bg-[#636E72]' },
  { value: '#2D3436', label: '深灰', preview: 'bg-[#2D3436]' },
  { value: '#0984e3', label: '藍色', preview: 'bg-[#0984e3]' },
]

interface FeaturesSectionProps {
  data: TourFormData
  updateField: (field: string, value: unknown) => void
  addFeature: () => void
  updateFeature: (index: number, field: string, value: string | string[]) => void
  removeFeature: (index: number) => void
  reorderFeature: (fromIndex: number, toIndex: number) => void
}

export function FeaturesSection({
  data,
  updateField,
  addFeature,
  updateFeature,
  removeFeature,
  reorderFeature,
}: FeaturesSectionProps) {
  const [uploadingImage, setUploadingImage] = useState<{ featureIndex: number; imageIndex: number } | null>(null)

  // 從資料庫載入模板
  const { featuresTemplates, loading: templatesLoading } = useTemplates()

  // 從資料庫載入的特色風格選項
  const featuresStyleOptions = useMemo(() => {
    return featuresTemplates.map(template => ({
      value: template.id as FeaturesStyleType,
      label: template.name,
      description: template.description || '',
      color: getTemplateColor(template.id),
    }))
  }, [featuresTemplates])
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const [draggedImage, setDraggedImage] = useState<{ featureIndex: number; imageIndex: number } | null>(null)
  const [dragOverImage, setDragOverImage] = useState<{ featureIndex: number; imageIndex: number } | null>(null)
  // 特色卡片拖曳排序
  const [draggedFeature, setDraggedFeature] = useState<number | null>(null)
  const [dragOverFeature, setDragOverFeature] = useState<number | null>(null)

  // 上傳特色圖片（單張）
  const handleImageUpload = async (
    featureIndex: number,
    imageIndex: number,
    file: File
  ) => {
    if (!file.type.startsWith('image/')) {
      void alert('請選擇圖片檔案', 'warning')
      return
    }

    setUploadingImage({ featureIndex, imageIndex })

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `feature-${featureIndex}-${imageIndex}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
      const filePath = `tour-feature-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('workspace-files')
        .upload(filePath, file)

      if (uploadError) {
        console.error('上傳失敗:', uploadError)
        void alert('圖片上傳失敗', 'error')
        return
      }

      const { data: urlData } = supabase.storage
        .from('workspace-files')
        .getPublicUrl(filePath)

      // 更新圖片陣列
      const feature = data.features?.[featureIndex]
      const currentImages = [...(feature?.images || [])]

      // 如果是新增位置，直接 push
      if (imageIndex >= currentImages.length) {
        currentImages.push(urlData.publicUrl)
      } else {
        currentImages[imageIndex] = urlData.publicUrl
      }

      updateFeature(featureIndex, 'images', currentImages)
    } catch (error) {
      console.error('上傳錯誤:', error)
      void alert('上傳過程發生錯誤', 'error')
    } finally {
      setUploadingImage(null)
    }
  }

  // 上傳多張特色圖片
  const handleMultipleImageUpload = async (
    featureIndex: number,
    files: FileList
  ) => {
    const feature = data.features?.[featureIndex]
    const currentImages = [...(feature?.images || [])]
    const remainingSlots = 4 - currentImages.length

    if (remainingSlots <= 0) {
      void alert('已達到最大圖片數量（4 張）', 'warning')
      return
    }

    // 過濾出圖片檔案，並限制數量
    const imageFiles = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .slice(0, remainingSlots)

    if (imageFiles.length === 0) {
      void alert('請選擇圖片檔案', 'warning')
      return
    }

    if (imageFiles.length < files.length) {
      const skipped = files.length - imageFiles.length
      if (skipped > 0) {
        // 有些檔案被跳過（非圖片或超過數量限制）
      }
    }

    // 設定上傳狀態（顯示第一張的位置）
    setUploadingImage({ featureIndex, imageIndex: currentImages.length })

    try {
      const uploadedUrls: string[] = []

      // 並行上傳所有圖片
      await Promise.all(
        imageFiles.map(async (file, idx) => {
          const fileExt = file.name.split('.').pop()
          const fileName = `feature-${featureIndex}-${currentImages.length + idx}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
          const filePath = `tour-feature-images/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('workspace-files')
            .upload(filePath, file)

          if (uploadError) {
            console.error(`上傳第 ${idx + 1} 張失敗:`, uploadError)
            return
          }

          const { data: urlData } = supabase.storage
            .from('workspace-files')
            .getPublicUrl(filePath)

          uploadedUrls[idx] = urlData.publicUrl
        })
      )

      // 過濾掉失敗的（undefined）並更新
      const successfulUrls = uploadedUrls.filter(Boolean)
      if (successfulUrls.length > 0) {
        updateFeature(featureIndex, 'images', [...currentImages, ...successfulUrls])
      }

      if (successfulUrls.length < imageFiles.length) {
        void alert(`${successfulUrls.length} 張圖片上傳成功，${imageFiles.length - successfulUrls.length} 張失敗`, 'warning')
      }
    } catch (error) {
      console.error('批量上傳錯誤:', error)
      void alert('上傳過程發生錯誤', 'error')
    } finally {
      setUploadingImage(null)
    }
  }

  // 移除圖片
  const handleRemoveImage = (featureIndex: number, imageIndex: number) => {
    const feature = data.features?.[featureIndex]
    const currentImages = [...(feature?.images || [])]
    currentImages.splice(imageIndex, 1)
    updateFeature(featureIndex, 'images', currentImages)
  }

  // 新增圖片位置
  const handleAddImageSlot = (featureIndex: number) => {
    const inputKey = `feature-${featureIndex}-new`
    fileInputRefs.current[inputKey]?.click()
  }

  // 拖曳圖片開始
  const handleImageDragStart = (featureIndex: number, imageIndex: number) => {
    setDraggedImage({ featureIndex, imageIndex })
  }

  // 拖曳到目標位置
  const handleImageDragOver = (e: React.DragEvent, featureIndex: number, imageIndex: number) => {
    e.preventDefault()
    // 只允許同一個 feature 內拖曳
    if (draggedImage && draggedImage.featureIndex === featureIndex) {
      setDragOverImage({ featureIndex, imageIndex })
    }
  }

  // 放下圖片 - 重新排序
  const handleImageDrop = (featureIndex: number, targetIndex: number) => {
    if (!draggedImage || draggedImage.featureIndex !== featureIndex) {
      setDraggedImage(null)
      setDragOverImage(null)
      return
    }

    const sourceIndex = draggedImage.imageIndex
    if (sourceIndex === targetIndex) {
      setDraggedImage(null)
      setDragOverImage(null)
      return
    }

    const feature = data.features?.[featureIndex]
    const currentImages = [...(feature?.images || [])]

    // 移動圖片
    const [movedImage] = currentImages.splice(sourceIndex, 1)
    currentImages.splice(targetIndex, 0, movedImage)

    updateFeature(featureIndex, 'images', currentImages)
    setDraggedImage(null)
    setDragOverImage(null)
  }

  // 拖曳結束
  const handleImageDragEnd = () => {
    setDraggedImage(null)
    setDragOverImage(null)
  }

  // 特色卡片拖曳開始
  const handleFeatureDragStart = (index: number) => {
    setDraggedFeature(index)
  }

  // 特色卡片拖曳到目標
  const handleFeatureDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedFeature !== null && draggedFeature !== index) {
      setDragOverFeature(index)
    }
  }

  // 特色卡片放下
  const handleFeatureDrop = (targetIndex: number) => {
    if (draggedFeature !== null && draggedFeature !== targetIndex) {
      reorderFeature(draggedFeature, targetIndex)
    }
    setDraggedFeature(null)
    setDragOverFeature(null)
  }

  // 特色卡片拖曳結束
  const handleFeatureDragEnd = () => {
    setDraggedFeature(null)
    setDragOverFeature(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b-2 border-morandi-gold pb-2">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-morandi-primary">行程特色</h2>
          {/* 模板選擇器 */}
          <div className="flex items-center gap-2">
            <Palette size={14} className="text-morandi-secondary" />
            {templatesLoading ? (
              <Loader2 size={14} className="animate-spin text-morandi-secondary" />
            ) : (
              <select
                value={data.featuresStyle || 'original'}
                onChange={e => updateField('featuresStyle', e.target.value as FeaturesStyleType)}
                className="text-xs bg-transparent border-none focus:ring-0 text-morandi-primary cursor-pointer pr-6"
              >
                {featuresStyleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <button
          onClick={addFeature}
          className="px-3 py-1 bg-morandi-gold text-white rounded-lg text-sm hover:bg-morandi-gold-hover"
        >
          + 新增特色
        </button>
      </div>

      {data.features?.map((feature: Feature, index: number) => {
        const images = feature.images || []
        const isDraggingFeature = draggedFeature === index
        const isDragOverFeature = dragOverFeature === index

        return (
          <div
            key={index}
            onDragOver={(e) => handleFeatureDragOver(e, index)}
            onDrop={() => handleFeatureDrop(index)}
            className={`p-4 border-2 rounded-lg space-y-3 transition-all ${
              isDraggingFeature
                ? 'opacity-50 scale-[0.98] border-morandi-gold bg-morandi-gold/10'
                : isDragOverFeature
                  ? 'border-morandi-gold bg-morandi-gold/5'
                  : 'border-morandi-container bg-morandi-container/20'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                {/* 只有這個把手可以拖曳 */}
                <div
                  draggable
                  onDragStart={() => handleFeatureDragStart(index)}
                  onDragEnd={handleFeatureDragEnd}
                  className="cursor-move text-morandi-secondary hover:text-morandi-primary transition-colors p-1 -m-1 rounded hover:bg-morandi-container/50"
                  title="拖曳排序"
                >
                  <GripVertical size={18} />
                </div>
                <span className="text-sm font-medium text-morandi-secondary">特色 {index + 1}</span>
              </div>
              <button
                onClick={() => removeFeature(index)}
                className="text-morandi-red hover:text-morandi-red/80 text-sm transition-colors"
              >
                刪除
              </button>
            </div>
            {/* 標籤文字 + 顏色選擇（同一行） */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1">標籤文字</label>
                <input
                  type="text"
                  value={feature.tag || ''}
                  onChange={e => updateFeature(index, 'tag', e.target.value)}
                  className="w-full px-3 py-2 border border-morandi-container rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold"
                  placeholder="如：Gastronomy、Discovery"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1">標籤顏色</label>
                <div className="flex gap-1.5 items-center h-[42px]">
                  {TAG_COLOR_OPTIONS.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => updateFeature(index, 'tagColor', color.value)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        feature.tagColor === color.value
                          ? 'border-morandi-gold scale-110 ring-2 ring-morandi-gold/30'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-morandi-primary mb-1">標題</label>
              <input
                type="text"
                value={feature.title}
                onChange={e => updateFeature(index, 'title', e.target.value)}
                className="w-full px-3 py-2 border border-morandi-container rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold"
                placeholder="溫泉飯店體驗"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-morandi-primary mb-1">描述</label>
              <input
                type="text"
                value={feature.description}
                onChange={e => updateFeature(index, 'description', e.target.value)}
                className="w-full px-3 py-2 border border-morandi-container rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold"
                placeholder="保證入住阿蘇溫泉飯店，享受日式溫泉文化"
              />
            </div>

            {/* 特色圖片（支援多張） */}
            <div>
              <label className="block text-sm font-medium text-morandi-primary mb-2">
                特色圖片（可一次選擇多張，最多 4 張，可拖曳排序）
              </label>
              <div className="flex flex-wrap gap-2">
                {/* 已上傳的圖片 - 縮圖顯示 */}
                {images.map((imageUrl, imgIndex) => {
                  const isUploading = uploadingImage?.featureIndex === index && uploadingImage?.imageIndex === imgIndex
                  const isDragging = draggedImage?.featureIndex === index && draggedImage?.imageIndex === imgIndex
                  const isDragOver = dragOverImage?.featureIndex === index && dragOverImage?.imageIndex === imgIndex

                  return (
                    <div
                      key={imgIndex}
                      draggable={!isUploading}
                      onDragStart={() => handleImageDragStart(index, imgIndex)}
                      onDragOver={(e) => handleImageDragOver(e, index, imgIndex)}
                      onDrop={() => handleImageDrop(index, imgIndex)}
                      onDragEnd={handleImageDragEnd}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden cursor-move group transition-all ${
                        isDragging ? 'opacity-50 scale-95' : ''
                      } ${isDragOver ? 'ring-2 ring-morandi-gold ring-offset-2' : ''}`}
                    >
                      {isUploading ? (
                        <div className="w-full h-full flex items-center justify-center bg-morandi-container/30">
                          <Loader2 size={16} className="text-morandi-secondary animate-spin" />
                        </div>
                      ) : (
                        <>
                          <img
                            src={imageUrl}
                            alt={`特色圖片 ${imgIndex + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {/* 拖曳提示 */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <GripVertical size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          {/* 序號標籤 */}
                          <span className="absolute bottom-0.5 left-0.5 bg-black/60 text-white text-[10px] px-1 rounded">
                            {imgIndex + 1}
                          </span>
                          {/* 刪除按鈕 */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveImage(index, imgIndex)
                            }}
                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            title="移除圖片"
                          >
                            <X size={10} />
                          </button>
                        </>
                      )}
                    </div>
                  )
                })}

                {/* 新增圖片按鈕（限制最多 4 張）- 縮圖尺寸 */}
                {images.length < 4 && (
                  <div
                    className="relative w-16 h-16 rounded-lg border-2 border-dashed border-morandi-container bg-morandi-container/20 hover:border-morandi-gold/50 overflow-hidden transition-colors"
                    onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
                    onDrop={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      // 確保不是圖片排序的拖曳
                      if (draggedImage) return
                      const files = e.dataTransfer.files
                      if (files && files.length > 0) {
                        if (files.length === 1) {
                          const file = files[0]
                          if (file.type.startsWith('image/')) {
                            handleImageUpload(index, images.length, file)
                          }
                        } else {
                          // 多張圖片
                          handleMultipleImageUpload(index, files)
                        }
                      }
                    }}
                  >
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-morandi-container/30 transition-colors">
                      {uploadingImage?.featureIndex === index && uploadingImage?.imageIndex >= images.length ? (
                        <Loader2 size={16} className="text-morandi-secondary animate-spin" />
                      ) : (
                        <Plus size={20} className="text-morandi-secondary/50" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        ref={el => { fileInputRefs.current[`feature-${index}-new`] = el }}
                        onChange={e => {
                          const files = e.target.files
                          if (files && files.length > 0) {
                            if (files.length === 1) {
                              handleImageUpload(index, images.length, files[0])
                            } else {
                              handleMultipleImageUpload(index, files)
                            }
                          }
                          e.target.value = ''
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* 圖片數量提示 */}
              <p className="text-xs text-morandi-secondary/60 mt-2">
                {images.length === 0 && '尚未上傳圖片'}
                {images.length === 1 && '1 張圖片會滿版顯示'}
                {images.length === 2 && '2 張圖片會左右並排'}
                {images.length === 3 && '3 張圖片會 1 大 + 2 小'}
                {images.length === 4 && '4 張圖片會 2x2 網格'}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
