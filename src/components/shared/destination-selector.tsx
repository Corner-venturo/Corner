'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'
import { useRegionsStore } from '@/stores/region-store'

interface DestinationSelectorProps {
  countryCode: string
  cityCode: string
  customLocation?: string
  customCountry?: string
  customCityCode?: string
  onCountryChange: (
    countryCode: string,
    cities: Array<{ id: string; code: string; name: string }>
  ) => void
  onCityChange: (cityCode: string) => void
  onCustomLocationChange?: (location: string) => void
  onCustomCountryChange?: (country: string) => void
  onCustomCityCodeChange?: (code: string) => void
  showCustomFields?: boolean // 是否顯示自訂國家和城市代號欄位
}

export function DestinationSelector({
  countryCode,
  cityCode,
  customLocation,
  customCountry,
  customCityCode,
  onCountryChange,
  onCityChange,
  onCustomLocationChange,
  onCustomCountryChange,
  onCustomCityCodeChange,
  showCustomFields = true,
}: DestinationSelectorProps) {
  const regionStore = useRegionsStore()
  const [availableCities, setAvailableCities] = useState<
    Array<{ id: string; code: string; name: string }>
  >([])

  // 載入地區資料（只在需要時載入）
  useEffect(() => {
    // ✅ 只在 countries 為空時才載入，避免重複請求
    if (!regionStore.countries || regionStore.countries.length === 0) {
      regionStore.fetchAll()
    }
  }, [])

  // 取得啟用的國家列表
  const activeCountries = (regionStore.countries || [])
    .filter(r => r.is_active)
    .map(r => ({ id: r.id, code: r.code || r.id, name: r.name }))

  // 根據國家 ID 取得主要城市列表（只顯示有機場的主要城市）
  const getCitiesByCountryId = (countryId: string) => {
    return regionStore.getCitiesByCountry(countryId)
      .filter(c => c.is_active && c.is_major) // 只顯示主要城市
      .map(c => ({ id: c.id, code: c.airport_code || c.id, name: c.name }))
  }

  const handleCountryChange = (selectedCountryCode: string) => {
    const selectedCountry = activeCountries.find(c => c.code === selectedCountryCode)
    const cities =
      selectedCountryCode === '__custom__'
        ? []
        : selectedCountry
          ? getCitiesByCountryId(selectedCountry.id)
          : []
    setAvailableCities(cities)
    onCountryChange(selectedCountryCode, cities)
  }

  return (
    <>
      {/* 國家/城市選擇 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-morandi-secondary mb-2 block">
            國家/地區 <span className="text-morandi-red">*</span>
          </label>
          <Combobox
            value={countryCode}
            onChange={handleCountryChange}
            options={[
              ...activeCountries.map(country => ({
                value: country.code,
                label: country.name,
              })),
              { value: '__custom__', label: '+ 新增其他目的地' },
            ]}
            placeholder="輸入或選擇國家..."
            emptyMessage="找不到符合的國家"
            showSearchIcon={true}
            showClearButton={true}
            className="border-morandi-container/30"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-morandi-secondary mb-2 block">
            城市 <span className="text-morandi-red">*</span>
          </label>
          {countryCode === '__custom__' ? (
            <Input
              value={customLocation || ''}
              onChange={e => onCustomLocationChange?.(e.target.value)}
              placeholder="輸入城市名稱 (如：曼谷)"
              className="border-morandi-container/30"
            />
          ) : (
            <Combobox
              value={cityCode}
              onChange={onCityChange}
              options={availableCities.map(city => ({
                value: city.code,
                label: `${city.name} (${city.code})`,
              }))}
              placeholder="輸入或選擇城市..."
              emptyMessage="找不到符合的城市"
              showSearchIcon={true}
              showClearButton={true}
              disabled={!countryCode || countryCode === '__custom__'}
              className="border-morandi-container/30"
            />
          )}
        </div>
      </div>

      {/* 自訂目的地詳細資訊 */}
      {showCustomFields && countryCode === '__custom__' && (
        <>
          <div>
            <label className="text-sm font-medium text-morandi-secondary mb-2 block">
              國家名稱
            </label>
            <Input
              value={customCountry || ''}
              onChange={e => onCustomCountryChange?.(e.target.value)}
              placeholder="輸入國家名稱 (如：泰國)"
              className="border-morandi-container/30"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-secondary mb-2 block">
              3 碼城市代號
            </label>
            <Input
              value={customCityCode || ''}
              onChange={e => {
                const value = e.target.value.toUpperCase().slice(0, 3)
                onCustomCityCodeChange?.(value)
              }}
              placeholder="輸入 3 碼代號 (如：BKK)"
              maxLength={3}
              className="border-morandi-container/30"
            />
          </div>
        </>
      )}
    </>
  )
}
