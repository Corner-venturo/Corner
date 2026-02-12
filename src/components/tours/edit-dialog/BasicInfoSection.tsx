'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { SimpleDateInput } from '@/components/ui/simple-date-input'
import { Combobox } from '@/components/ui/combobox'
import { COMP_TOURS_LABELS } from '../constants/labels'

interface BasicInfoSectionProps {
  formData: {
    name: string
    countryCode: string
    cityCode: string
    customLocation?: string
    departure_date: string
    return_date: string
    description: string
    isSpecial: boolean
    enable_checkin: boolean
  }
  activeCountries: Array<{ id: string; code: string; name: string }>
  availableCities: Array<{ id: string; code: string; name: string }>
  onFieldChange: (field: string, value: string | boolean) => void
  onCountryChange: (countryCode: string) => void
  onDepartureDateChange: (date: string) => void
}

export function BasicInfoSection({
  formData,
  activeCountries,
  availableCities,
  onFieldChange,
  onCountryChange,
  onDepartureDateChange,
}: BasicInfoSectionProps) {
  return (
    <div className="space-y-4">
      {/* 旅遊團名稱 */}
      <div>
        <label className="text-sm font-medium text-morandi-primary">旅遊團名稱 *</label>
        <Input
          value={formData.name}
          onChange={e => onFieldChange('name', e.target.value)}
          className="mt-1"
        />
      </div>

      {/* 目的地選擇 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-morandi-primary">國家/地區</label>
          <Combobox
            value={formData.countryCode}
            onChange={onCountryChange}
            options={[
              ...activeCountries.map(country => ({
                value: country.code,
                label: country.name,
              })),
              { value: '__custom__', label: COMP_TOURS_LABELS.其他目的地 },
            ]}
            placeholder={COMP_TOURS_LABELS.選擇國家}
            emptyMessage={COMP_TOURS_LABELS.找不到符合的國家}
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-morandi-primary">城市</label>
          {formData.countryCode === '__custom__' ? (
            <Input
              value={formData.customLocation || ''}
              onChange={e => onFieldChange('customLocation', e.target.value)}
              placeholder={COMP_TOURS_LABELS.輸入城市名稱}
              className="mt-1"
            />
          ) : (
            <Combobox
              value={formData.cityCode}
              onChange={cityCode => onFieldChange('cityCode', cityCode)}
              options={availableCities.map(city => ({
                value: city.code || `__no_code_${city.id}`,
                label: city.code ? `${city.name} (${city.code})` : city.name,
                disabled: !city.code,
              }))}
              placeholder={COMP_TOURS_LABELS.選擇城市}
              emptyMessage={COMP_TOURS_LABELS.找不到符合的城市}
              disabled={!formData.countryCode || formData.countryCode === '__custom__'}
              className="mt-1"
            />
          )}
        </div>
      </div>

      {/* 日期 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-morandi-primary">出發日期 *</label>
          <SimpleDateInput
            value={formData.departure_date}
            onChange={onDepartureDateChange}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-morandi-primary">返回日期 *</label>
          <SimpleDateInput
            value={formData.return_date}
            onChange={return_date => onFieldChange('return_date', return_date)}
            min={formData.departure_date}
            className="mt-1"
          />
        </div>
      </div>

      {/* 描述 */}
      <div>
        <label className="text-sm font-medium text-morandi-primary">描述</label>
        <Input
          value={formData.description}
          onChange={e => onFieldChange('description', e.target.value)}
          className="mt-1"
        />
      </div>

      {/* 選項 */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="edit-isSpecial"
            checked={formData.isSpecial}
            onChange={e => onFieldChange('isSpecial', e.target.checked)}
            className="rounded"
          />
          <label htmlFor="edit-isSpecial" className="text-sm text-morandi-primary">
            特殊團
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="edit-enableCheckin"
            checked={formData.enable_checkin}
            onChange={e => onFieldChange('enable_checkin', e.target.checked)}
            className="rounded"
          />
          <label htmlFor="edit-enableCheckin" className="text-sm text-morandi-primary">
            開啟報到功能
          </label>
        </div>
      </div>
    </div>
  )
}
