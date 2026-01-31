'use client'
import React from 'react'
import { TourFormData, CityOption, CoverStyleType } from '../../types'
import { Combobox } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toHalfWidth } from '@/lib/utils/text'
import { RichTextInput } from '@/components/ui/rich-text-input'
import { CalendarIcon, Loader2 } from 'lucide-react'

interface CoverInfoFormProps {
  data: TourFormData
  selectedCountry: string
  setSelectedCountry: (country: string) => void
  setSelectedCountryCode: (code: string) => void
  allDestinations: CityOption[]
  availableCities: CityOption[]
  countryNameToCode: Record<string, string>
  updateField: (field: string, value: unknown) => void
  updateCity: (city: string) => void
  onChange: (data: TourFormData) => void
  coverStyleOptions: Array<{
    value: CoverStyleType
    label: string
    description: string
    color: string
    previewImage?: string
  }>
  onCoverStyleChange: (style: CoverStyleType) => void
  templatesLoading: boolean
}

export function CoverInfoForm({
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
  coverStyleOptions,
  onCoverStyleChange,
  templatesLoading,
}: CoverInfoFormProps) {
  return (
    <div className="space-y-4">
      {/* 封面風格選擇器 */}
      <div>
        <label className="block text-sm font-medium text-morandi-primary mb-2">主題風格</label>
        {templatesLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-morandi-gold" />
          </div>
        ) : (
          <div className="flex gap-2">
            {coverStyleOptions.map((option) => {
              const isSelected = (data.coverStyle || 'original') === option.value
              // 取第一個字作為代表
              const shortLabel = option.value === 'gemini' ? 'G' : option.label.charAt(0)
              return (
                <button
                  key={option.value}
                  type="button"
                  title={option.label}
                  onClick={() => onCoverStyleChange(option.value)}
                  className={cn(
                    'w-10 h-10 rounded-lg border-2 transition-all flex items-center justify-center text-sm',
                    isSelected
                      ? 'ring-2 ring-offset-1'
                      : 'border-morandi-container hover:border-opacity-70 bg-card'
                  )}
                  style={{
                    borderColor: isSelected ? option.color : undefined,
                    backgroundColor: isSelected ? option.color : undefined,
                    color: isSelected ? 'white' : option.color,
                    ...(isSelected ? { ['--tw-ring-color' as string]: `${option.color}40` } : {})
                  }}
                >
                  {shortLabel}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 基本資訊 */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">
            標籤文字
            <span className="ml-2 text-xs text-morandi-secondary font-normal">選取文字可調整樣式</span>
          </label>
          <RichTextInput
            value={data.tagline || ''}
            onChange={value => updateField('tagline', value)}
            placeholder="Venturo Travel 2025 秋季精選"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">主標題</label>
            <RichTextInput
              value={data.title || ''}
              onChange={value => updateField('title', value)}
              placeholder="漫遊福岡"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">副標題</label>
            <RichTextInput
              value={data.subtitle || ''}
              onChange={value => updateField('subtitle', value)}
              placeholder={data.coverStyle === 'art' ? 'Odyssey' : '半自由行'}
            />
            {data.coverStyle === 'art' && !data.subtitle && (
              <p className="text-xs text-morandi-secondary mt-1">
                藝術雜誌風格預設為「Odyssey」，可自訂為旅行主題
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">描述</label>
          <RichTextInput
            value={data.description || ''}
            onChange={value => updateField('description', value)}
            placeholder="2日市區自由活動 · 保證入住溫泉飯店 · 柳川遊船 · 阿蘇火山"
            singleLine={false}
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
              options={availableCities.map(city => ({ value: city.code, label: city.name }))}
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full h-9 justify-start text-left font-normal',
                    !data.departureDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.departureDate || '選擇日期'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.departureDate ? new Date(data.departureDate.replace(/\//g, '-')) : undefined}
                  onSelect={(date) => {
                    if (date && date instanceof Date) {
                      const formatted = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
                      updateField('departureDate', formatted)
                    }
                  }}
                  defaultMonth={data.departureDate ? new Date(data.departureDate.replace(/\//g, '-')) : new Date()}
                />
              </PopoverContent>
            </Popover>
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
            <Select value={data.priceNote || '/人'} onValueChange={(value) => updateField('priceNote', value)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="選擇單位" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="/人">/人</SelectItem>
                <SelectItem value="起">起</SelectItem>
                <SelectItem value="/人起">/人起</SelectItem>
                <SelectItem value="__hidden__">(不顯示)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
