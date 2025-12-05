import React, { useState, useRef } from 'react'
import { TourFormData, Feature } from '../types'
import { iconOptions, iconTemplates } from '../constants'
import { ImageIcon, Upload, Loader2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface FeaturesSectionProps {
  data: TourFormData
  addFeature: () => void
  updateFeature: (index: number, field: string, value: string | [string, string]) => void
  removeFeature: (index: number) => void
}

export function FeaturesSection({
  data,
  addFeature,
  updateFeature,
  removeFeature,
}: FeaturesSectionProps) {
  const [uploadingImage, setUploadingImage] = useState<{ featureIndex: number; position: 0 | 1 } | null>(null)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  // 上傳模板 PNG
  const handleTemplateUpload = async (featureIndex: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('請選擇圖片檔案')
      return
    }

    setUploadingImage({ featureIndex, position: 0 })

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `feature-template-${featureIndex}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
      const filePath = `tour-feature-templates/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('workspace-files')
        .upload(filePath, file)

      if (uploadError) {
        console.error('上傳失敗:', uploadError)
        alert('模板上傳失敗')
        return
      }

      const { data: urlData } = supabase.storage
        .from('workspace-files')
        .getPublicUrl(filePath)

      updateFeature(featureIndex, 'template', urlData.publicUrl)
    } catch (error) {
      console.error('上傳錯誤:', error)
      alert('上傳過程發生錯誤')
    } finally {
      setUploadingImage(null)
    }
  }

  // 上傳特色圖片
  const handleImageUpload = async (
    featureIndex: number,
    position: 0 | 1,
    file: File
  ) => {
    if (!file.type.startsWith('image/')) {
      alert('請選擇圖片檔案')
      return
    }

    setUploadingImage({ featureIndex, position })

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `feature-${featureIndex}-${position}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
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
      const currentImages: [string, string] = feature?.images || ['', '']
      currentImages[position] = urlData.publicUrl
      updateFeature(featureIndex, 'images', currentImages)
    } catch (error) {
      console.error('上傳錯誤:', error)
      alert('上傳過程發生錯誤')
    } finally {
      setUploadingImage(null)
    }
  }

  // 移除圖片
  const handleRemoveImage = (featureIndex: number, position: 0 | 1) => {
    const feature = data.features?.[featureIndex]
    const currentImages: [string, string] = feature?.images || ['', '']
    currentImages[position] = ''
    updateFeature(featureIndex, 'images', currentImages)
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

      {data.features?.map((feature: Feature, index: number) => (
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
              onChange={e => {
                const newIcon = e.target.value
                updateFeature(index, 'icon', newIcon)
                // 如果有對應的預設模板，自動帶入
                const defaultTemplate = iconTemplates[newIcon]
                if (defaultTemplate && !feature.template) {
                  updateFeature(index, 'template', defaultTemplate)
                }
              }}
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

          {/* 模板 + 特色圖片 */}
          <div className="space-y-3">
            {/* 模板上傳 */}
            <div>
              <label className="block text-sm font-medium text-morandi-primary mb-2">
                模板圖片（PNG，選填）
              </label>
              <div
                className={`relative aspect-[16/9] rounded-lg border-2 border-dashed overflow-hidden transition-colors ${
                  feature.template
                    ? 'border-transparent'
                    : 'border-morandi-container bg-morandi-container/20 hover:border-morandi-gold/50'
                }`}
                onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
                onDrop={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  const file = e.dataTransfer.files?.[0]
                  if (file && file.type.startsWith('image/')) {
                    handleTemplateUpload(index, file)
                  }
                }}
              >
                {feature.template ? (
                  <>
                    {/* 預覽：底層圖片 + 上層模板 */}
                    <div className="absolute inset-0 grid grid-cols-2 gap-1 p-1">
                      {feature.images?.map((imgUrl, imgIndex) => (
                        imgUrl ? (
                          <img
                            key={imgIndex}
                            src={imgUrl}
                            alt={`底圖 ${imgIndex + 1}`}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div key={imgIndex} className="w-full h-full bg-gray-200 rounded" />
                        )
                      )) || (
                        <>
                          <div className="w-full h-full bg-gray-200 rounded" />
                          <div className="w-full h-full bg-gray-200 rounded" />
                        </>
                      )}
                    </div>
                    {/* 模板 PNG 覆蓋在上面 */}
                    <img
                      src={feature.template}
                      alt="模板"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateFeature(index, 'template', '')}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors z-10"
                      title="移除模板"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-morandi-container/30 transition-colors">
                    <ImageIcon size={28} className="text-morandi-secondary/50 mb-2" />
                    <span className="text-sm text-morandi-secondary/70">上傳模板 PNG</span>
                    <span className="text-[10px] text-morandi-secondary/50 mt-1">
                      透明區域會顯示下方圖片
                    </span>
                    <input
                      type="file"
                      accept="image/png"
                      ref={el => { fileInputRefs.current[`template-${index}`] = el }}
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) handleTemplateUpload(index, file)
                        e.target.value = ''
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* 底層圖片（左右兩張） */}
            <div>
              <label className="block text-sm font-medium text-morandi-primary mb-2">
                特色圖片（會顯示在模板透明區域）
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[0, 1].map((position) => {
                  const inputKey = `feature-${index}-${position}`
                  const isUploading = uploadingImage?.featureIndex === index && uploadingImage?.position === position
                  const imageUrl = feature.images?.[position as 0 | 1] || ''

                  return (
                    <div
                      key={position}
                      className={`relative aspect-[4/3] rounded-lg border-2 border-dashed overflow-hidden transition-colors ${
                        imageUrl
                          ? 'border-transparent'
                          : 'border-morandi-container bg-morandi-container/20 hover:border-morandi-gold/50'
                      }`}
                      onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
                      onDrop={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        const file = e.dataTransfer.files?.[0]
                        if (file && file.type.startsWith('image/')) {
                          handleImageUpload(index, position as 0 | 1, file)
                        }
                      }}
                    >
                      {imageUrl ? (
                        <>
                          <img
                            src={imageUrl}
                            alt={`特色圖片 ${position + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index, position as 0 | 1)}
                            className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                            title="移除圖片"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-morandi-container/30 transition-colors">
                          {isUploading ? (
                            <Loader2 size={24} className="text-morandi-secondary animate-spin" />
                          ) : (
                            <>
                              <ImageIcon size={24} className="text-morandi-secondary/50 mb-2" />
                              <span className="text-xs text-morandi-secondary/70">
                                {position === 0 ? '左側圖片' : '右側圖片'}
                              </span>
                              <span className="text-[10px] text-morandi-secondary/50 mt-1">
                                點擊或拖曳上傳
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            ref={el => { fileInputRefs.current[inputKey] = el }}
                            onChange={e => {
                              const file = e.target.files?.[0]
                              if (file) handleImageUpload(index, position as 0 | 1, file)
                              e.target.value = ''
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
