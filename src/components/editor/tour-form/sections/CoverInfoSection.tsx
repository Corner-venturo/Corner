import React, { useMemo, useState } from 'react'
import { TourFormData, CityOption, CoverStyleType } from '../types'
import { Combobox } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { useRegionsStore } from '@/stores'
import { supabase } from '@/lib/supabase/client'
import { Upload, Check, Crop, Settings2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toHalfWidth } from '@/lib/utils/text'
import { ImagePositionEditor, ImagePositionSettings, getImagePositionStyle } from '@/components/ui/image-position-editor'
import { alert } from '@/lib/ui/alert-dialog'

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
  // 位置調整功能相關狀態
  const [showPositionEditor, setShowPositionEditor] = useState(false)
  // 封面設定 Modal
  const [showCoverSettings, setShowCoverSettings] = useState(false)

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

  // 從 URL 提取檔名（用於刪除舊圖片）
  const extractFileNameFromUrl = (url: string): string | null => {
    if (!url) return null
    // URL 格式: https://xxx.supabase.co/storage/v1/object/public/city-backgrounds/itinerary_xxx.jpg
    const match = url.match(/city-backgrounds\/([^?]+)/)
    return match ? match[1] : null
  }

  // 刪除 Storage 中的圖片
  const deleteStorageImage = async (url: string) => {
    const fileName = extractFileNameFromUrl(url)
    if (!fileName) return

    // 只刪除 itinerary_ 開頭的圖片（避免刪除城市預設圖片）
    if (!fileName.startsWith('itinerary_')) return

    try {
      const { error } = await supabase.storage
        .from('city-backgrounds')
        .remove([fileName])

      if (error) {
        console.warn('刪除舊圖片失敗:', error)
      }
    } catch (err) {
      console.warn('刪除舊圖片時發生錯誤:', err)
    }
  }

  // 選擇圖片後直接上傳（不裁切）
  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 檢查檔案大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      void alert('檔案太大！請選擇小於 5MB 的圖片', 'warning')
      return
    }

    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      void alert('請選擇圖片檔案', 'warning')
      return
    }

    // 清除 input 值，讓使用者可以再次選擇同一個檔案
    event.target.value = ''

    setUploading(true)

    // 記錄舊圖片 URL（上傳成功後刪除）
    const oldCoverImage = data.coverImage

    try {
      // 生成唯一檔名
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `itinerary_${timestamp}_${randomStr}.${fileExt}`
      const filePath = `${fileName}`

      // 上傳到 Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('city-backgrounds')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // 取得公開網址
      const { data: urlData } = supabase.storage.from('city-backgrounds').getPublicUrl(filePath)

      // 刪除舊的自訂上傳圖片（如果有）
      if (oldCoverImage) {
        await deleteStorageImage(oldCoverImage)
      }

      // 更新表單資料（圖片 + 重置位置設定）
      updateField('coverImage', urlData.publicUrl)
      updateField('coverImagePosition', { x: 50, y: 50, scale: 1 })

      // 儲存圖片網址，準備詢問是否更新資料庫
      setUploadedImageUrl(urlData.publicUrl)

      // 如果有選擇城市，詢問是否更新預設圖片
      if (data.city) {
        setShowUpdateDialog(true)
      } else {
        void alert('圖片上傳成功！', 'success')
      }
    } catch (error) {
      console.error('上傳失敗:', error)
      void alert('圖片上傳失敗，請稍後再試', 'error')
    } finally {
      setUploading(false)
    }
  }

  // 位置調整確認
  const handlePositionConfirm = (settings: ImagePositionSettings) => {
    updateField('coverImagePosition', settings)
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

      void alert(`已將圖片設為「${data.city}」的預設圖片 ${imageNumber}！`, 'success')
      setShowUpdateDialog(false)
    } catch (error) {
      console.error('更新城市圖片失敗:', error)
      void alert('更新失敗，請稍後再試', 'error')
    }
  }

  // 封面風格選項（五種款式）
  const coverStyleOptions: { value: CoverStyleType; label: string; description: string; color: string }[] = [
    {
      value: 'original',
      label: '經典全屏',
      description: '全螢幕背景圖片，文字置中，金色漸層動畫',
      color: '#f59e0b', // amber
    },
    {
      value: 'gemini',
      label: 'Gemini 風格',
      description: '精緻小巧，底部文字佈局，莫蘭迪金色',
      color: '#c9aa7c', // morandi gold
    },
    {
      value: 'nature',
      label: '日式和風',
      description: '日式極簡風，垂直文字，和紙紋理背景',
      color: '#30abe8', // japan blue
    },
    {
      value: 'serene',
      label: '浮水印風',
      description: '藍色寧靜風，大型日期浮水印，優雅字體',
      color: '#4a6fa5', // serene blue
    },
    {
      value: 'luxury',
      label: '奢華質感',
      description: '左右分欄佈局，襯線字體，深綠金色系',
      color: '#2C5F4D', // luxury green
    },
    {
      value: 'art',
      label: '藝術雜誌',
      description: '全螢幕大圖，高對比排版，雜誌感設計',
      color: '#E63946', // art red
    },
  ]

  // 取得當前風格的顏色
  const currentStyleOption = coverStyleOptions.find(o => o.value === (data.coverStyle || 'original'))
  const currentStyleColor = currentStyleOption?.color || '#f59e0b'

  return (
    <div className="space-y-2">
      {/* 封面設定按鈕 - 點擊打開 Modal */}
      <button
        type="button"
        onClick={() => setShowCoverSettings(true)}
        className="w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all hover:shadow-md"
        style={{ borderColor: currentStyleColor, backgroundColor: `${currentStyleColor}08` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: currentStyleColor }}
          >
            <Settings2 size={20} className="text-white" />
          </div>
          <div className="text-left">
            <h2 className="text-base font-bold text-morandi-primary">封面設定</h2>
            <p className="text-xs text-morandi-secondary">
              {currentStyleOption?.label || '經典全屏'} · {data.title || '未設定標題'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data.coverImage && (
            <img
              src={data.coverImage}
              alt="封面預覽"
              className="w-12 h-12 rounded object-cover border"
              style={{ borderColor: `${currentStyleColor}40` }}
            />
          )}
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${currentStyleColor}20` }}
          >
            <Check size={14} style={{ color: currentStyleColor }} />
          </div>
        </div>
      </button>

      {/* 封面設定 Modal */}
      <Dialog open={showCoverSettings} onOpenChange={setShowCoverSettings}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: currentStyleColor }}
              >
                <Settings2 size={14} className="text-white" />
              </div>
              封面設定
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* 封面風格選擇器 */}
            <div>
              <label className="block text-sm font-medium text-morandi-primary mb-2">封面風格</label>
              <div className="grid grid-cols-2 gap-2">
                {coverStyleOptions.map((option) => {
                  const isSelected = (data.coverStyle || 'original') === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateField('coverStyle', option.value)}
                      className={cn(
                        'relative flex flex-col items-start p-2 rounded-lg border-2 transition-all text-left',
                        isSelected
                          ? 'ring-2 ring-offset-1 bg-white'
                          : 'border-morandi-container hover:border-opacity-70 bg-white'
                      )}
                      style={{
                        borderColor: isSelected ? option.color : undefined,
                        ...(isSelected ? { ['--tw-ring-color' as string]: `${option.color}40` } : {})
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: option.color }}
                          />
                          <span
                            className="font-medium text-sm"
                            style={{ color: isSelected ? option.color : undefined }}
                          >
                            {option.label}
                          </span>
                        </div>
                        {isSelected && (
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: option.color }}
                          >
                            <Check size={10} className="text-white" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-morandi-secondary leading-tight mt-0.5">{option.description}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Luxury 風格專屬設定 */}
            {data.coverStyle === 'luxury' && (
              <div className="p-3 rounded-lg border-2 border-dashed" style={{ borderColor: '#2C5F4D50', backgroundColor: '#2C5F4D08' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2C5F4D' }}>
                    <Settings2 size={12} className="text-white" />
                  </div>
                  <span className="text-sm font-medium" style={{ color: '#2C5F4D' }}>Luxury 統計卡片</span>
                  <span className="text-xs text-morandi-secondary">（第一個固定為天數）</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-14 text-xs text-morandi-secondary">卡片 2</span>
                    <Input
                      type="number"
                      value={data.heroStatCard2?.value || ''}
                      onChange={e => updateField('heroStatCard2', {
                        ...data.heroStatCard2,
                        value: e.target.value ? parseInt(e.target.value) : '',
                        label: data.heroStatCard2?.label || ''
                      })}
                      placeholder="數字"
                      className="h-8 w-16"
                      min={0}
                    />
                    <Input
                      type="text"
                      value={data.heroStatCard2?.label || ''}
                      onChange={e => updateField('heroStatCard2', {
                        ...data.heroStatCard2,
                        value: data.heroStatCard2?.value || '',
                        label: e.target.value
                      })}
                      placeholder="如 Fine Dining"
                      className="h-8 flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-14 text-xs text-morandi-secondary">卡片 3</span>
                    <Input
                      type="number"
                      value={data.heroStatCard3?.value || ''}
                      onChange={e => updateField('heroStatCard3', {
                        ...data.heroStatCard3,
                        value: e.target.value ? parseInt(e.target.value) : '',
                        label: data.heroStatCard3?.label || ''
                      })}
                      placeholder="數字"
                      className="h-8 w-16"
                      min={0}
                    />
                    <Input
                      type="text"
                      value={data.heroStatCard3?.label || ''}
                      onChange={e => updateField('heroStatCard3', {
                        ...data.heroStatCard3,
                        value: data.heroStatCard3?.value || '',
                        label: e.target.value
                      })}
                      placeholder="如 Attractions"
                      className="h-8 flex-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 基本資訊 */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1">標籤文字</label>
                <Input
                  type="text"
                  value={data.tagline || ''}
                  onChange={e => updateField('tagline', e.target.value)}
                  placeholder="Venturo Travel 2025 秋季精選"
                  className="h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-morandi-primary mb-1">主標題</label>
                  <Input
                    type="text"
                    value={data.title || ''}
                    onChange={e => updateField('title', e.target.value)}
                    placeholder="漫遊福岡"
                    className="h-9"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-morandi-primary mb-1">副標題</label>
                  <Input
                    type="text"
                    value={data.subtitle || ''}
                    onChange={e => updateField('subtitle', e.target.value)}
                    placeholder={data.coverStyle === 'art' ? 'Odyssey' : '半自由行'}
                    className="h-9"
                  />
                  {data.coverStyle === 'art' && !data.subtitle && (
                    <p className="text-xs text-morandi-secondary mt-1">
                      💡 藝術雜誌風格預設為「Odyssey」，可自訂為旅行主題
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1">描述</label>
                <Input
                  type="text"
                  value={data.description || ''}
                  onChange={e => updateField('description', e.target.value)}
                  placeholder="2日市區自由活動 · 保證入住溫泉飯店 · 柳川遊船 · 阿蘇火山"
                  className="h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-morandi-primary mb-1">國家</label>
                  <Combobox
                    value={selectedCountry}
                    onChange={newCountry => {
                      setSelectedCountry(newCountry)
                      const code = countryNameToCode[newCountry]
                      setSelectedCountryCode(code || '')
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-morandi-primary mb-1">出發日期</label>
                  <Input
                    type="text"
                    value={data.departureDate || ''}
                    onChange={e => {
                      let value = toHalfWidth(e.target.value)
                      value = value.replace(/[^\d/]/g, '')
                      if (/^\d{8}$/.test(value)) {
                        value = `${value.slice(0, 4)}/${value.slice(4, 6)}/${value.slice(6, 8)}`
                      } else if (/^\d{7}$/.test(value)) {
                        const year = value.slice(0, 4)
                        const rest = value.slice(4)
                        const month1 = rest.slice(0, 2)
                        const day1 = rest.slice(2)
                        if (parseInt(month1) <= 12 && parseInt(day1) >= 1 && parseInt(day1) <= 31) {
                          value = `${year}/${month1}/${day1}`
                        } else {
                          const month2 = rest.slice(0, 1)
                          const day2 = rest.slice(1)
                          value = `${year}/${month2}/${day2}`
                        }
                      } else if (/^\d{6}$/.test(value)) {
                        value = `${value.slice(0, 4)}/${value.slice(4, 5)}/${value.slice(5, 6)}`
                      }
                      updateField('departureDate', value)
                    }}
                    onBlur={e => {
                      const value = e.target.value
                      const match = value.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
                      if (match) {
                        const [, year, month, day] = match
                        const formatted = `${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`
                        if (formatted !== value) {
                          updateField('departureDate', formatted)
                        }
                      }
                    }}
                    placeholder="2025/10/21"
                    className="h-9"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-morandi-primary mb-1">行程代碼</label>
                  <Input
                    type="text"
                    value={data.tourCode || ''}
                    onChange={e => updateField('tourCode', e.target.value)}
                    placeholder="25JFO21CIG"
                    className="h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-morandi-primary mb-1">價格</label>
                  <Input
                    type="text"
                    value={data.price || ''}
                    onChange={e => {
                      const halfWidthValue = toHalfWidth(e.target.value)
                      const rawValue = halfWidthValue.replace(/[^\d]/g, '')
                      const formattedValue = rawValue ? Number(rawValue).toLocaleString('en-US') : ''
                      updateField('price', formattedValue)
                    }}
                    placeholder="39,800"
                    className="h-9"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-morandi-primary mb-1">單位</label>
                  <select
                    value={data.priceNote || '/人'}
                    onChange={e => updateField('priceNote', e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="/人">/人</option>
                    <option value="起">起</option>
                    <option value="/人起">/人起</option>
                    <option value="">(不顯示)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 封面圖片 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-morandi-primary">封面圖片</label>

              {/* 城市圖片選擇 */}
              {cityImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
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
                      <img src={image.url} alt={image.label} className="w-full h-20 object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                        <p className="text-white text-xs">{image.label}</p>
                      </div>
                      {data.coverImage === image.url && (
                        <div className="absolute top-1 right-1 bg-morandi-gold text-white text-[10px] px-1.5 py-0.5 rounded">✓</div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* 上傳圖片 */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  disabled={uploading}
                  className="hidden"
                  id="cover-image-upload-modal"
                />
                <label
                  htmlFor="cover-image-upload-modal"
                  className={`flex items-center gap-1.5 px-3 py-1.5 bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-lg text-sm cursor-pointer transition-colors ${
                    uploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload size={14} />
                  {uploading ? '上傳中...' : '上傳圖片'}
                </label>
                <span className="text-xs text-morandi-secondary">最大 5MB</span>
              </div>

              {/* 目前圖片預覽 */}
              {data.coverImage && (
                <div
                  className="relative rounded-lg overflow-hidden border-2 border-morandi-gold cursor-pointer group"
                  onClick={() => setShowPositionEditor(true)}
                >
                  <img
                    src={data.coverImage}
                    alt="封面預覽"
                    className="w-full h-28 object-cover transition-all group-hover:brightness-75"
                    style={getImagePositionStyle(data.coverImagePosition)}
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowPositionEditor(true) }}
                    className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 hover:bg-black/80 rounded text-white text-xs flex items-center gap-1"
                  >
                    <Crop size={12} />
                    調整位置
                  </button>
                </div>
              )}
            </div>

            {/* 完成按鈕 */}
            <Button
              onClick={() => setShowCoverSettings(false)}
              className="w-full"
              style={{ backgroundColor: currentStyleColor }}
            >
              完成設定
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 圖片位置調整器 */}
      <ImagePositionEditor
        open={showPositionEditor}
        onClose={() => setShowPositionEditor(false)}
        imageSrc={data.coverImage || ''}
        currentPosition={data.coverImagePosition}
        onConfirm={handlePositionConfirm}
        aspectRatio={16 / 9}
        title="調整封面圖片"
      />

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
                void alert('圖片僅用於此行程！', 'success')
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
