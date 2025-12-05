import React, { useState, useRef } from 'react'
import { TourFormData, Feature } from '../types'
import { iconOptions } from '../constants'
import { ImageIcon, Loader2, X, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface FeaturesSectionProps {
  data: TourFormData
  addFeature: () => void
  updateFeature: (index: number, field: string, value: string | string[]) => void
  removeFeature: (index: number) => void
}

export function FeaturesSection({
  data,
  addFeature,
  updateFeature,
  removeFeature,
}: FeaturesSectionProps) {
  const [uploadingImage, setUploadingImage] = useState<{ featureIndex: number; imageIndex: number } | null>(null)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  // 上傳特色圖片
  const handleImageUpload = async (
    featureIndex: number,
    imageIndex: number,
    file: File
  ) => {
    if (!file.type.startsWith('image/')) {
      alert('請選擇圖片檔案')
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
        alert('圖片上傳失敗')
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
      alert('上傳過程發生錯誤')
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b-2 border-morandi-gold pb-2">
        <h2 className="text-lg font-bold text-morandi-primary">行程特色</h2>
        <button
          onClick={addFeature}
          className="px-3 py-1 bg-morandi-gold text-white rounded-lg text-sm hover:bg-morandi-gold/90"
        >
          + 新增特色
        </button>
      </div>

      {data.features?.map((feature: Feature, index: number) => {
        const images = feature.images || []

        return (
          <div
            key={index}
            className="p-4 border-2 border-morandi-container rounded-lg space-y-3 bg-morandi-container/20"
          >
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-morandi-secondary">特色 {index + 1}</span>
              <button
                onClick={() => removeFeature(index)}
                className="text-morandi-red hover:text-morandi-red/80 text-sm transition-colors"
              >
                刪除
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-morandi-primary mb-1">圖標</label>
              <select
                value={feature.icon}
                onChange={e => updateFeature(index, 'icon', e.target.value)}
                className="w-full px-3 py-2 border border-morandi-container rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold"
              >
                {iconOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
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
                特色圖片（最多 4 張）
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* 已上傳的圖片 */}
                {images.map((imageUrl, imgIndex) => {
                  const isUploading = uploadingImage?.featureIndex === index && uploadingImage?.imageIndex === imgIndex

                  return (
                    <div
                      key={imgIndex}
                      className="relative aspect-[4/3] rounded-lg border-2 border-transparent overflow-hidden"
                    >
                      {isUploading ? (
                        <div className="w-full h-full flex items-center justify-center bg-morandi-container/30">
                          <Loader2 size={24} className="text-morandi-secondary animate-spin" />
                        </div>
                      ) : (
                        <>
                          <img
                            src={imageUrl}
                            alt={`特色圖片 ${imgIndex + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index, imgIndex)}
                            className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                            title="移除圖片"
                          >
                            <X size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  )
                })}

                {/* 新增圖片按鈕（限制最多 4 張） */}
                {images.length < 4 && (
                  <div
                    className="relative aspect-[4/3] rounded-lg border-2 border-dashed border-morandi-container bg-morandi-container/20 hover:border-morandi-gold/50 overflow-hidden transition-colors"
                    onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
                    onDrop={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      const file = e.dataTransfer.files?.[0]
                      if (file && file.type.startsWith('image/')) {
                        handleImageUpload(index, images.length, file)
                      }
                    }}
                  >
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-morandi-container/30 transition-colors">
                      {uploadingImage?.featureIndex === index && uploadingImage?.imageIndex === images.length ? (
                        <Loader2 size={24} className="text-morandi-secondary animate-spin" />
                      ) : (
                        <>
                          <Plus size={24} className="text-morandi-secondary/50 mb-2" />
                          <span className="text-xs text-morandi-secondary/70">新增圖片</span>
                          <span className="text-[10px] text-morandi-secondary/50 mt-1">
                            點擊或拖曳上傳
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        ref={el => { fileInputRefs.current[`feature-${index}-new`] = el }}
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(index, images.length, file)
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
