import React, { useMemo, useState } from 'react'
import { TourFormData, CityOption } from '../types'
import { Combobox } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { useRegionsStore } from '@/stores'
import { supabase } from '@/lib/supabase/client'
import { Upload } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface CoverInfoSectionProps {
  data: TourFormData
  user: {
    display_name?: string
    english_name?: string
    employee_number?: string
  } | null
  selectedCountry: string
  setSelectedCountry: (country: string) => void
  setSelectedCountryCode: (code: string) => void
  allDestinations: CityOption[]
  availableCities: CityOption[]
  countryNameToCode: Record<string, string>
  updateField: (field: string, value: unknown) => void
  updateCity: (city: string) => void
  onChange: (data: TourFormData) => void
}

export function CoverInfoSection({
  data,
  user,
  selectedCountry,
  setSelectedCountry,
  setSelectedCountryCode,
  allDestinations,
  availableCities,
  countryNameToCode,
  updateField,
  updateCity,
  onChange,
}: CoverInfoSectionProps) {
  const { cities, updateCity: updateCityInStore } = useRegionsStore()
  const [uploading, setUploading] = useState(false)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState('')

  // 取得當前選擇城市的圖片
  const cityImages = useMemo(() => {
    if (!data.city) return []

    const selectedCity = cities.find(c => c.name === data.city)
    if (!selectedCity) return []

    const images = []
    if (selectedCity.background_image_url) {
      images.push({
        url: selectedCity.background_image_url,
        label: '圖片 1',
      })
    }
    if (selectedCity.background_image_url_2) {
      images.push({
        url: selectedCity.background_image_url_2,
        label: '圖片 2',
      })
    }
    return images
  }, [data.city, cities])

  // 上傳圖片
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 檢查檔案大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('檔案太大！請選擇小於 5MB 的圖片')
      return
    }

    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      alert('請選擇圖片檔案')
      return
    }

    setUploading(true)

    try {
      // 生成唯一檔名（避免中文字元）
      const timestamp = Date.now()
      const fileExt = file.name.split('.').pop()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const fileName = `itinerary_${timestamp}_${randomStr}.${fileExt}`
      const filePath = `${fileName}`

      // 上傳到 Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('city-backgrounds')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // 取得公開網址
      const { data: urlData } = supabase.storage.from('city-backgrounds').getPublicUrl(filePath)

      // 更新表單資料
      updateField('coverImage', urlData.publicUrl)

      // 儲存圖片網址，準備詢問是否更新資料庫
      setUploadedImageUrl(urlData.publicUrl)

      // 如果有選擇城市，詢問是否更新預設圖片
      if (data.city) {
        setShowUpdateDialog(true)
      } else {
        alert('✅ 圖片上傳成功！')
      }
    } catch (error) {
      console.error('上傳失敗:', error)
      alert('❌ 圖片上傳失敗，請稍後再試')
    } finally {
      setUploading(false)
    }
  }

  // 更新城市預設圖片
  const handleUpdateCityImage = async (imageNumber: 1 | 2) => {
    if (!data.city || !uploadedImageUrl) return

    const selectedCity = cities.find(c => c.name === data.city)
    if (!selectedCity) return

    try {
      const updateData = imageNumber === 1
        ? { background_image_url: uploadedImageUrl }
        : { background_image_url_2: uploadedImageUrl }

      // 更新資料庫
      const { error } = await supabase
        .from('cities')
        .update(updateData)
        .eq('id', selectedCity.id)

      if (error) throw error

      // 更新本地 store
      await updateCityInStore(selectedCity.id, updateData)

      alert(`✅ 已將圖片設為「${data.city}」的預設圖片 ${imageNumber}！`)
      setShowUpdateDialog(false)
    } catch (error) {
      console.error('更新城市圖片失敗:', error)
      alert('❌ 更新失敗，請稍後再試')
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-morandi-primary border-b-2 border-morandi-gold pb-2">
        封面設定
      </h2>

      <div>
        <label className="block text-sm font-medium text-morandi-primary mb-1">標籤文字</label>
        <Input
          type="text"
          value={data.tagline || ''}
          onChange={e => updateField('tagline', e.target.value)}
          placeholder="Venturo Travel 2025 秋季精選"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">主標題</label>
          <Input
            type="text"
            value={data.title || ''}
            onChange={e => updateField('title', e.target.value)}
            placeholder="漫遊福岡"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">副標題</label>
          <Input
            type="text"
            value={data.subtitle || ''}
            onChange={e => updateField('subtitle', e.target.value)}
            placeholder="半自由行"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-morandi-primary mb-1">描述</label>
        <Input
          type="text"
          value={data.description || ''}
          onChange={e => updateField('description', e.target.value)}
          placeholder="2日市區自由活動 · 保證入住溫泉飯店 · 柳川遊船 · 阿蘇火山"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">國家</label>
          <Combobox
            value={selectedCountry}
            onChange={newCountry => {
              setSelectedCountry(newCountry)
              // 更新國家代碼
              const code = countryNameToCode[newCountry]
              setSelectedCountryCode(code || '')
              // 同時更新國家和清空城市，避免 data 覆蓋問題
              onChange({
                ...data,
                country: newCountry,
                city: '',
              })
            }}
            options={allDestinations.map(dest => ({ value: dest.name, label: dest.name }))}
            placeholder="搜尋或選擇國家..."
            showSearchIcon
            showClearButton
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">城市</label>
          <Combobox
            value={data.city || ''}
            onChange={value => updateCity(value)}
            options={availableCities.map(city => ({ value: city.name, label: city.name }))}
            placeholder="搜尋或選擇城市..."
            showSearchIcon
            showClearButton
            disabled={!selectedCountry}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">出發日期</label>
          <Input
            type="text"
            value={data.departureDate || ''}
            onChange={e => updateField('departureDate', e.target.value)}
            placeholder="2025/10/21"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">行程代碼</label>
          <Input
            type="text"
            value={data.tourCode || ''}
            onChange={e => updateField('tourCode', e.target.value)}
            placeholder="25JFO21CIG"
          />
        </div>
      </div>

      {/* 封面圖片選擇 */}
      {cityImages.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-2">
            選擇封面圖片 <span className="text-xs text-morandi-secondary">（來自資料庫）</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {cityImages.map((image, index) => (
              <button
                key={index}
                type="button"
                onClick={() => updateField('coverImage', image.url)}
                className={`relative group overflow-hidden rounded-lg border-2 transition-all ${
                  data.coverImage === image.url
                    ? 'border-morandi-gold ring-2 ring-morandi-gold/30'
                    : 'border-morandi-container hover:border-morandi-gold/50'
                }`}
              >
                <img
                  src={image.url}
                  alt={image.label}
                  className="w-full h-32 object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-white text-xs font-medium">{image.label}</p>
                </div>
                {data.coverImage === image.url && (
                  <div className="absolute top-2 right-2 bg-morandi-gold text-white text-xs px-2 py-1 rounded">
                    ✓ 已選
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 上傳圖片 */}
      <div>
        <label className="block text-sm font-medium text-morandi-primary mb-2">
          或上傳自己的圖片
        </label>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="hidden"
            id="cover-image-upload"
          />
          <label
            htmlFor="cover-image-upload"
            className={`flex items-center gap-2 px-4 py-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Upload size={16} />
            {uploading ? '上傳中...' : '選擇圖片'}
          </label>
          <span className="text-xs text-morandi-secondary">
            支援 JPG、PNG、WebP，最大 5MB
          </span>
        </div>
      </div>

      {/* 目前選擇的圖片預覽 */}
      {data.coverImage && (
        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-2">目前封面圖片</label>
          <div className="relative rounded-lg overflow-hidden border-2 border-morandi-gold">
            <img
              src={data.coverImage}
              alt="封面預覽"
              className="w-full h-48 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = 'https://via.placeholder.com/1200x400?text=圖片載入失敗'
              }}
            />
          </div>
        </div>
      )}

      {/* 更新城市預設圖片對話框 */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>✅ 圖片上傳成功！</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-morandi-secondary">
              要將此圖片設為「<span className="font-medium text-morandi-primary">{data.city}</span>」的預設圖片嗎？
              <br />
              （所有人建立 {data.city} 行程時都能使用）
            </p>

            {/* 預覽上傳的圖片 */}
            {uploadedImageUrl && (
              <div className="rounded-lg overflow-hidden border border-morandi-container">
                <img
                  src={uploadedImageUrl}
                  alt="上傳的圖片"
                  className="w-full h-32 object-cover"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => handleUpdateCityImage(1)}
                className="flex-1 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                設為圖片 1
              </Button>
              <Button
                onClick={() => handleUpdateCityImage(2)}
                className="flex-1 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                設為圖片 2
              </Button>
            </div>

            <Button
              onClick={() => {
                setShowUpdateDialog(false)
                alert('✅ 圖片僅用於此行程！')
              }}
              variant="outline"
              className="w-full"
            >
              只用於此行程
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
