import React, { useState, useMemo } from 'react'
import { TourFormData, CityOption } from '../types'
import { Settings2 } from 'lucide-react'
import { logger } from '@/lib/utils/logger'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { ImagePositionSettings } from '@/components/ui/image-position-editor'
import { PreviewPanel } from '../components/PreviewPanel'
// Hero 組件
import { TourHeroSection } from '@/features/tours/components/sections/TourHeroSection'
import { TourHeroNature } from '@/features/tours/components/sections/TourHeroNature'
import { TourHeroLuxury } from '@/features/tours/components/sections/TourHeroLuxury'
import { TourHeroArt } from '@/features/tours/components/sections/TourHeroArt'
import { TourHeroGemini } from '@/features/tours/components/sections/TourHeroGemini'
import { TourHeroDreamscape } from '@/features/tours/components/sections/TourHeroDreamscape'
import { TourHeroCollage } from '@/features/tours/components/sections/TourHeroCollage'
// 拆分的模組
import { useCoverInfo } from './cover/hooks/useCoverInfo'
import { AirportImageLibrary } from './cover/AirportImageLibrary'
import { CoverInfoForm } from './cover/CoverInfoForm'

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
  const [showCoverSettings, setShowCoverSettings] = useState(false)

  const {
    coverStyleOptions,
    currentStyleOption,
    currentStyleColor,
    templatesLoading,
    handleCoverStyleChange,
  } = useCoverInfo({ data, onChange })

  // 從城市名稱取得機場代碼
  const airportCode = useMemo(() => {
    if (!data.city) return ''
    const city = availableCities.find(c => c.name === data.city)
    return city?.code || ''
  }, [data.city, availableCities])

  // 處理圖片選擇
  const handleImageSelect = (url: string) => {
    logger.log('[CoverInfoSection] handleImageSelect:', { url })
    updateField('coverImage', url)
  }

  // 處理圖片上傳
  const handleImageUpload = (url: string) => {
    logger.log('[CoverInfoSection] handleImageUpload:', { url })
    // 同時更新 coverImage 和 coverImagePosition，避免 stale closure 問題
    onChange({
      ...data,
      coverImage: url,
      coverImagePosition: { x: 50, y: 50, scale: 1 },
    })
  }

  // 生成預覽用資料
  const getHeroData = () => ({
    coverImage: data.coverImage,
    tagline: data.tagline || 'Corner Travel',
    title: data.title || '行程標題',
    subtitle: data.subtitle || '副標題',
    description: data.description || '此處顯示行程描述',
    departureDate: data.departureDate || '2025/01/01',
    tourCode: data.tourCode || 'CODE',
    price: data.price || '',
    priceNote: data.priceNote === '__hidden__' ? '' : (data.priceNote || '/人'),
    country: selectedCountry || '',
    city: data.city || '',
    dailyItinerary: data.dailyItinerary,
  })

  // 根據風格渲染對應的 Hero 組件
  const renderHeroPreview = (viewMode: 'desktop' | 'mobile') => {
    const heroData = getHeroData()

    switch (data.coverStyle) {
      case 'luxury':
        return <TourHeroLuxury data={heroData} viewMode={viewMode} />
      case 'art':
        return <TourHeroArt data={heroData} viewMode={viewMode} />
      case 'nature':
        return <TourHeroNature data={heroData} viewMode={viewMode} />
      case 'gemini':
        return <TourHeroGemini data={heroData} viewMode={viewMode} />
      case 'dreamscape':
        return <TourHeroDreamscape data={heroData} viewMode={viewMode} />
      case 'collage':
        return <TourHeroCollage data={heroData} viewMode={viewMode} />
      default:
        return <TourHeroSection data={heroData} viewMode={viewMode} />
    }
  }

  return (
    <div className="space-y-2">
      {/* 封面設定按鈕 - 點擊打開 Modal */}
      <button
        type="button"
        onClick={() => setShowCoverSettings(true)}
        className="w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all hover:shadow-md"
        style={{ borderColor: `${currentStyleColor}50`, backgroundColor: `${currentStyleColor}08` }}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: currentStyleColor }}
        >
          <Settings2 size={20} className="text-white" />
        </div>
        <div className="text-left flex-1">
          <h2 className="text-base font-bold text-morandi-primary">封面設定</h2>
          <p className="text-xs text-morandi-secondary">
            風格：{currentStyleOption?.label || '經典全屏'}
            {airportCode && ` · ${airportCode}`}
          </p>
        </div>
      </button>

      {/* 封面設定 Modal */}
      <Dialog open={showCoverSettings} onOpenChange={setShowCoverSettings}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden p-0">
          <div className="flex h-full">
            {/* 左側：設定表單 */}
            <div className="w-1/2 p-6 overflow-y-auto max-h-[90vh] border-r border-morandi-container">
              <DialogHeader className="mb-4">
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
                {/* 表單區塊 */}
                <CoverInfoForm
                  data={data}
                  selectedCountry={selectedCountry}
                  setSelectedCountry={setSelectedCountry}
                  setSelectedCountryCode={setSelectedCountryCode}
                  allDestinations={allDestinations}
                  availableCities={availableCities}
                  countryNameToCode={countryNameToCode}
                  updateField={updateField}
                  updateCity={updateCity}
                  onChange={onChange}
                  coverStyleOptions={coverStyleOptions}
                  onCoverStyleChange={handleCoverStyleChange}
                  templatesLoading={templatesLoading}
                />

                {/* 封面圖片 - 使用新的機場圖片庫 */}
                <AirportImageLibrary
                  airportCode={airportCode}
                  selectedImage={data.coverImage}
                  onImageSelect={handleImageSelect}
                  onImageUpload={handleImageUpload}
                  position={data.coverImagePosition as ImagePositionSettings}
                  onPositionChange={(pos) => updateField('coverImagePosition', pos)}
                />

                {/* 完成按鈕 */}
                <Button
                  onClick={() => setShowCoverSettings(false)}
                  className="w-full"
                  style={{ backgroundColor: currentStyleColor }}
                >
                  完成設定
                </Button>
              </div>
            </div>

            {/* 右側：實時預覽 */}
            <PreviewPanel
              styleLabel={currentStyleOption?.label || '經典全屏'}
              styleColor={currentStyleColor}
            >
              {renderHeroPreview}
            </PreviewPanel>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
