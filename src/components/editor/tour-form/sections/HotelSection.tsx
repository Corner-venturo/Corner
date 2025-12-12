import React, { useState, useRef } from 'react'
import { logger } from '@/lib/utils/logger'
import { TourFormData, HotelInfo } from '../types'
import { Plus, X, Upload, Image as ImageIcon, GripVertical, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { alert } from '@/lib/ui/alert-dialog'

interface HotelSectionProps {
  data: TourFormData
  updateField: (field: string, value: unknown) => void
}

export function HotelSection({ data, updateField }: HotelSectionProps) {
  const hotels = data.hotels || []
  const [uploadingImage, setUploadingImage] = useState<{ hotelIndex: number; imageIndex: number } | null>(null)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const [draggedImage, setDraggedImage] = useState<{ hotelIndex: number; imageIndex: number } | null>(null)
  const [dragOverImage, setDragOverImage] = useState<{ hotelIndex: number; imageIndex: number } | null>(null)

  const addHotel = () => {
    updateField('hotels', [
      ...hotels,
      {
        name: '',
        description: '',
        images: [],
      },
    ])
  }

  const updateHotel = (index: number, field: keyof HotelInfo, value: string | string[]) => {
    const updated = [...hotels]
    updated[index] = { ...updated[index], [field]: value }
    updateField('hotels', updated)
  }

  const removeHotel = (index: number) => {
    updateField(
      'hotels',
      hotels.filter((_, i) => i !== index)
    )
  }

  // 取得飯店圖片陣列（相容舊版單張圖片）
  const getHotelImages = (hotel: HotelInfo): string[] => {
    if (hotel.images && hotel.images.length > 0) {
      return hotel.images
    }
    // 向後相容：如果只有舊版 image 欄位
    if (hotel.image) {
      return [hotel.image]
    }
    return []
  }

  // 上傳圖片（單張）
  const handleImageUpload = async (hotelIndex: number, imageIndex: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      void alert('請選擇圖片檔案', 'warning')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      void alert('圖片大小不可超過 5MB', 'warning')
      return
    }

    setUploadingImage({ hotelIndex, imageIndex })

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `hotel-${hotelIndex}-${imageIndex}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
      const filePath = `tour-hotel-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('workspace-files')
        .upload(filePath, file)

      if (uploadError) {
        logger.error('上傳失敗:', uploadError)
        void alert('圖片上傳失敗', 'error')
        return
      }

      const { data: urlData } = supabase.storage
        .from('workspace-files')
        .getPublicUrl(filePath)

      const hotel = hotels[hotelIndex]
      const currentImages = [...getHotelImages(hotel)]

      if (imageIndex >= currentImages.length) {
        currentImages.push(urlData.publicUrl)
      } else {
        currentImages[imageIndex] = urlData.publicUrl
      }

      updateHotel(hotelIndex, 'images', currentImages)
    } catch (error) {
      logger.error('上傳錯誤:', error)
      void alert('上傳過程發生錯誤', 'error')
    } finally {
      setUploadingImage(null)
    }
  }

  // 批量上傳多張圖片
  const handleMultipleImageUpload = async (hotelIndex: number, files: FileList) => {
    const hotel = hotels[hotelIndex]
    const currentImages = [...getHotelImages(hotel)]
    const remainingSlots = 4 - currentImages.length

    if (remainingSlots <= 0) {
      void alert('已達到最大圖片數量（4 張）', 'warning')
      return
    }

    const imageFiles = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .slice(0, remainingSlots)

    if (imageFiles.length === 0) {
      void alert('請選擇圖片檔案', 'warning')
      return
    }

    setUploadingImage({ hotelIndex, imageIndex: currentImages.length })

    try {
      const uploadedUrls: string[] = []

      await Promise.all(
        imageFiles.map(async (file, idx) => {
          const fileExt = file.name.split('.').pop()
          const fileName = `hotel-${hotelIndex}-${currentImages.length + idx}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
          const filePath = `tour-hotel-images/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('workspace-files')
            .upload(filePath, file)

          if (uploadError) {
            logger.error(`上傳第 ${idx + 1} 張失敗:`, uploadError)
            return
          }

          const { data: urlData } = supabase.storage
            .from('workspace-files')
            .getPublicUrl(filePath)

          uploadedUrls[idx] = urlData.publicUrl
        })
      )

      const successfulUrls = uploadedUrls.filter(Boolean)
      if (successfulUrls.length > 0) {
        updateHotel(hotelIndex, 'images', [...currentImages, ...successfulUrls])
      }

      if (successfulUrls.length < imageFiles.length) {
        void alert(`${successfulUrls.length} 張圖片上傳成功，${imageFiles.length - successfulUrls.length} 張失敗`, 'warning')
      }
    } catch (error) {
      logger.error('批量上傳錯誤:', error)
      void alert('上傳過程發生錯誤', 'error')
    } finally {
      setUploadingImage(null)
    }
  }

  // 移除圖片
  const handleRemoveImage = (hotelIndex: number, imageIndex: number) => {
    const hotel = hotels[hotelIndex]
    const currentImages = [...getHotelImages(hotel)]
    currentImages.splice(imageIndex, 1)
    updateHotel(hotelIndex, 'images', currentImages)
  }

  // 新增圖片
  const handleAddImageSlot = (hotelIndex: number) => {
    const inputKey = `hotel-${hotelIndex}-new`
    fileInputRefs.current[inputKey]?.click()
  }

  // 拖曳排序
  const handleImageDragStart = (hotelIndex: number, imageIndex: number) => {
    setDraggedImage({ hotelIndex, imageIndex })
  }

  const handleImageDragOver = (e: React.DragEvent, hotelIndex: number, imageIndex: number) => {
    e.preventDefault()
    if (draggedImage && draggedImage.hotelIndex === hotelIndex) {
      setDragOverImage({ hotelIndex, imageIndex })
    }
  }

  const handleImageDrop = (hotelIndex: number, targetIndex: number) => {
    if (!draggedImage || draggedImage.hotelIndex !== hotelIndex) {
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

    const hotel = hotels[hotelIndex]
    const currentImages = [...getHotelImages(hotel)]
    const [movedImage] = currentImages.splice(sourceIndex, 1)
    currentImages.splice(targetIndex, 0, movedImage)

    updateHotel(hotelIndex, 'images', currentImages)
    setDraggedImage(null)
    setDragOverImage(null)
  }

  const handleImageDragEnd = () => {
    setDraggedImage(null)
    setDragOverImage(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-morandi-primary border-b-2 border-morandi-gold pb-2 flex-1">
          飯店資訊
        </h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.showHotels !== false}
            onChange={e => updateField('showHotels', e.target.checked)}
            className="w-4 h-4 text-morandi-gold rounded focus:ring-morandi-gold/50"
          />
          <span className="text-morandi-primary">顯示此區塊</span>
        </label>
      </div>

      <div className="bg-morandi-container/20 p-4 rounded-lg space-y-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-morandi-secondary">新增入住的飯店資訊，每間飯店最多可上傳 4 張圖片</p>
          <button
            type="button"
            onClick={addHotel}
            className="flex items-center gap-1 px-3 py-1.5 bg-morandi-gold text-white rounded-lg hover:bg-morandi-gold/90 transition-colors text-sm"
          >
            <Plus size={16} />
            新增飯店
          </button>
        </div>

        {hotels.length === 0 && (
          <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-morandi-container">
            <p className="text-sm text-morandi-secondary mb-2">尚未新增飯店資訊</p>
            <p className="text-xs text-gray-400">點擊「新增飯店」按鈕開始</p>
          </div>
        )}

        {hotels.map((hotel, hotelIndex) => {
          const images = getHotelImages(hotel)
          const canAddMore = images.length < 4

          return (
            <div
              key={hotelIndex}
              className="bg-white p-4 rounded-lg border border-morandi-container space-y-3 relative"
            >
              <button
                type="button"
                onClick={() => removeHotel(hotelIndex)}
                className="absolute top-3 right-3 p-1 text-morandi-red hover:bg-morandi-red/10 rounded transition-colors"
                title="移除此飯店"
              >
                <X size={16} />
              </button>

              <div className="pr-8">
                <h4 className="font-bold text-morandi-secondary mb-3">飯店 {hotelIndex + 1}</h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-morandi-primary mb-1">
                      飯店名稱 *
                    </label>
                    <input
                      type="text"
                      value={hotel.name}
                      onChange={e => updateHotel(hotelIndex, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-morandi-container rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold"
                      placeholder="例如: 福岡海鷹希爾頓酒店"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-morandi-primary mb-1">
                      飯店簡介
                    </label>
                    <textarea
                      value={hotel.description}
                      onChange={e => updateHotel(hotelIndex, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-morandi-container rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold min-h-[80px]"
                      placeholder="介紹飯店特色、位置、設施等..."
                    />
                  </div>

                  {/* 圖片區域 */}
                  <div>
                    <label className="block text-sm font-medium text-morandi-primary mb-2">
                      飯店圖片 ({images.length}/4)
                    </label>

                    {/* 圖片網格 */}
                    <div className="grid grid-cols-4 gap-2">
                      {/* 已上傳的圖片 */}
                      {images.map((imageUrl, imageIndex) => (
                        <div
                          key={imageIndex}
                          draggable
                          onDragStart={() => handleImageDragStart(hotelIndex, imageIndex)}
                          onDragOver={e => handleImageDragOver(e, hotelIndex, imageIndex)}
                          onDrop={() => handleImageDrop(hotelIndex, imageIndex)}
                          onDragEnd={handleImageDragEnd}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-move group ${
                            dragOverImage?.hotelIndex === hotelIndex && dragOverImage?.imageIndex === imageIndex
                              ? 'border-morandi-gold'
                              : 'border-morandi-container'
                          }`}
                        >
                          <img
                            src={imageUrl}
                            alt={`${hotel.name || '飯店'} 圖片 ${imageIndex + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {/* 拖曳把手 */}
                          <div className="absolute top-1 left-1 p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            <GripVertical size={12} className="text-white" />
                          </div>
                          {/* 刪除按鈕 */}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(hotelIndex, imageIndex)}
                            className="absolute top-1 right-1 p-1 bg-red-500 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <X size={12} />
                          </button>
                          {/* 序號 */}
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 rounded text-white text-xs">
                            {imageIndex + 1}
                          </div>
                        </div>
                      ))}

                      {/* 新增圖片按鈕 */}
                      {canAddMore && (
                        <div
                          onClick={() => handleAddImageSlot(hotelIndex)}
                          onDragOver={e => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                          onDrop={e => {
                            e.preventDefault()
                            const files = e.dataTransfer.files
                            if (files.length > 0) {
                              void handleMultipleImageUpload(hotelIndex, files)
                            }
                          }}
                          className="aspect-square rounded-lg border-2 border-dashed border-morandi-container hover:border-morandi-gold hover:bg-morandi-gold/5 transition-colors cursor-pointer flex flex-col items-center justify-center"
                        >
                          {uploadingImage?.hotelIndex === hotelIndex ? (
                            <Loader2 size={20} className="text-morandi-gold animate-spin" />
                          ) : (
                            <>
                              <Plus size={20} className="text-morandi-secondary mb-1" />
                              <span className="text-xs text-morandi-secondary">新增</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 隱藏的 file input */}
                    <input
                      ref={el => {
                        fileInputRefs.current[`hotel-${hotelIndex}-new`] = el
                      }}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={e => {
                        if (e.target.files && e.target.files.length > 0) {
                          void handleMultipleImageUpload(hotelIndex, e.target.files)
                          e.target.value = ''
                        }
                      }}
                      className="hidden"
                    />

                    <p className="mt-2 text-xs text-morandi-secondary">
                      可拖曳排序 · 支援拖放上傳 · 建議使用 16:9 高解析度圖片 · 單張不超過 5MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
