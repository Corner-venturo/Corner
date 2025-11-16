import React from 'react'
import { TourFormData, CityOption } from '../types'
import { Combobox } from '@/components/ui/combobox'

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
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-morandi-primary border-b-2 border-morandi-gold pb-2">
        封面設定
      </h2>

      <div>
        <label className="block text-sm font-medium text-morandi-primary mb-1">標籤文字</label>
        <input
          type="text"
          value={data.tagline || ''}
          onChange={e => updateField('tagline', e.target.value)}
          className="w-full px-3 py-2 border border-morandi-container rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold transition-colors"
          placeholder="Venturo Travel 2025 秋季精選"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">主標題</label>
          <input
            type="text"
            value={data.title || ''}
            onChange={e => updateField('title', e.target.value)}
            className="w-full px-3 py-2 border border-morandi-container rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold transition-colors"
            placeholder="漫遊福岡"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">副標題</label>
          <input
            type="text"
            value={data.subtitle || ''}
            onChange={e => updateField('subtitle', e.target.value)}
            className="w-full px-3 py-2 border border-morandi-container rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold transition-colors"
            placeholder="半自由行"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-morandi-primary mb-1">描述</label>
        <input
          type="text"
          value={data.description || ''}
          onChange={e => updateField('description', e.target.value)}
          className="w-full px-3 py-2 border border-morandi-container rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold transition-colors"
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
          <input
            type="text"
            value={data.departureDate || ''}
            onChange={e => updateField('departureDate', e.target.value)}
            className="w-full px-3 py-2 border border-morandi-container rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold transition-colors"
            placeholder="2025/10/21"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">行程代碼</label>
          <input
            type="text"
            value={data.tourCode || ''}
            onChange={e => updateField('tourCode', e.target.value)}
            className="w-full px-3 py-2 border border-morandi-container rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold transition-colors"
            placeholder="25JFO21CIG"
          />
        </div>
      </div>
    </div>
  )
}
