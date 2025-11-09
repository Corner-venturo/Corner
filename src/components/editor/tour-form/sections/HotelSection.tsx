import React, { useState, useRef } from 'react'
import { TourFormData, HotelInfo } from '../types'
import { Plus, X, Upload, Image as ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface HotelSectionProps {
  data: TourFormData
  updateField: (field: string, value: unknown) => void
}

export function HotelSection({ data, updateField }: HotelSectionProps) {
  const hotels = data.hotels || []
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})

  const addHotel = () => {
    updateField('hotels', [
      ...hotels,
      {
        name: '',
        description: '',
        image: '',
      },
    ])
  }

  const updateHotel = (index: number, field: keyof HotelInfo, value: string) => {
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

  const handleFileChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 驗證檔案類型
    if (!file.type.startsWith('image/')) {
      alert('請選擇圖片檔案')
      return
    }

    // 驗證檔案大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('圖片大小不可超過 5MB')
      return
    }

    setUploadingIndex(index)

    try {
      // 生成唯一檔名
      const timestamp = Date.now()
      const filename = `hotel-${timestamp}-${index}.jpg`

      // 上傳到 Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('tour-hotels')
        .upload(filename, file, {
          contentType: file.type,
          upsert: true,
        })

      if (uploadError) throw uploadError

      // 取得公開 URL
      const { data: urlData } = supabase.storage.from('tour-hotels').getPublicUrl(filename)

      // 更新飯店圖片 URL
      updateHotel(index, 'image', urlData.publicUrl)

      alert('圖片上傳成功！')
    } catch (error) {
      console.error('上傳失敗:', error)
      alert('圖片上傳失敗，請稍後再試')
    } finally {
      setUploadingIndex(null)
      // 清空 input，允許重新上傳相同檔案
      if (fileInputRefs.current[index]) {
        fileInputRefs.current[index]!.value = ''
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-morandi-primary border-b-2 border-morandi-gold pb-2 flex-1">
          🏨 飯店資訊
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
          <p className="text-sm text-morandi-secondary">新增入住的飯店資訊，可以加入多間飯店</p>
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

        {hotels.map((hotel, index) => (
          <div
            key={index}
            className="bg-white p-4 rounded-lg border border-morandi-container space-y-3 relative"
          >
            <button
              type="button"
              onClick={() => removeHotel(index)}
              className="absolute top-3 right-3 p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
              title="移除此飯店"
            >
              <X size={16} />
            </button>

            <div className="pr-8">
              <h4 className="font-bold text-morandi-secondary mb-3">飯店 {index + 1}</h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-morandi-primary mb-1">
                    飯店名稱 *
                  </label>
                  <input
                    type="text"
                    value={hotel.name}
                    onChange={e => updateHotel(index, 'name', e.target.value)}
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
                    onChange={e => updateHotel(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-morandi-container rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold min-h-[80px]"
                    placeholder="介紹飯店特色、位置、設施等..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-morandi-primary mb-1">
                    飯店圖片
                  </label>

                  {/* 預覽區域 */}
                  <div className="aspect-video w-full border-2 border-dashed border-morandi-container rounded-lg overflow-hidden bg-gray-50 mb-3">
                    {hotel.image ? (
                      <img
                        src={hotel.image}
                        alt={hotel.name || '飯店圖片'}
                        className="w-full h-full object-cover"
                        onError={e => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <ImageIcon size={48} className="mb-2 opacity-50" />
                        <p className="text-sm">尚未上傳圖片</p>
                      </div>
                    )}
                  </div>

                  {/* 上傳按鈕 */}
                  <input
                    ref={el => (fileInputRefs.current[index] = el)}
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileChange(index, e)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[index]?.click()}
                    disabled={uploadingIndex === index}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-morandi-container rounded-lg hover:bg-morandi-container/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload size={16} />
                    {uploadingIndex === index ? '上傳中...' : hotel.image ? '更換圖片' : '上傳圖片'}
                  </button>
                  <p className="mt-1 text-xs text-morandi-secondary">
                    建議使用 16:9 高解析度圖片，檔案大小不超過 5MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
