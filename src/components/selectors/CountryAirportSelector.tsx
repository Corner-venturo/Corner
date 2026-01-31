'use client'

import { useState, useMemo, useCallback } from 'react'
import { Combobox } from '@/components/ui/combobox'
import { useAirports, type Airport } from '@/features/tours/hooks/useAirports'

// 判斷是否為台灣（支援多種寫法）
const isTaiwanCountry = (country: string | undefined | null): boolean => {
  if (!country) return false
  const normalized = country.trim().toLowerCase()
  return normalized === '台灣' || normalized === 'taiwan' || normalized === '臺灣'
}

interface CountryAirportSelectorProps {
  /** 國家值 */
  country: string
  /** 機場代碼值 */
  airportCode: string
  /** 國家變更回調 */
  onCountryChange: (country: string, airportCode: string) => void
  /** 機場代碼變更回調 */
  onAirportChange: (airportCode: string, cityName: string) => void
  /** 是否在 Dialog 內使用（禁用 Portal） */
  disablePortal?: boolean
  /** 是否顯示國家標籤 */
  showLabels?: boolean
  /** 國家列表（可選，不傳則從 hook 取得） */
  countries?: Array<{ id: string; name: string; is_active: boolean }>
}

export function CountryAirportSelector({
  country,
  airportCode,
  onCountryChange,
  onAirportChange,
  disablePortal = false,
  showLabels = true,
  countries: externalCountries,
}: CountryAirportSelectorProps) {
  const {
    countries: hookCountries,
    getAirportsByCountry,
    getAirport,
    loading,
  } = useAirports({ enabled: true })

  // 搜尋狀態
  const [searchQuery, setSearchQuery] = useState('')

  // 國家選項（優先使用外部傳入的）
  const countryOptions = useMemo(() => {
    if (externalCountries) {
      return externalCountries
        .filter(c => c.is_active)
        .map(c => ({ value: c.name, label: c.name }))
    }
    return hookCountries.map(c => ({ value: c, label: c }))
  }, [externalCountries, hookCountries])

  // 根據國家取得機場列表
  const availableAirports = useMemo(() => {
    if (!country) return []
    
    const airports = getAirportsByCountry(country)
    
    // favorite 已經排在前面了（由 useAirports 處理）
    return airports.map(a => ({
      value: a.iata_code,
      label: formatAirportLabel(a),
    }))
  }, [country, getAirportsByCountry])

  // 格式化機場顯示
  function formatAirportLabel(airport: Airport): string {
    const city = airport.city_name_zh || airport.city_name_en || ''
    const name = airport.name_zh || airport.english_name || ''
    
    if (city && name && !name.includes(city)) {
      return `${city} - ${name} (${airport.iata_code})`
    }
    if (city) {
      return `${city} (${airport.iata_code})`
    }
    return `${name || airport.iata_code} (${airport.iata_code})`
  }

  // 處理國家變更
  const handleCountryChange = useCallback((newCountry: string) => {
    const isTaiwan = isTaiwanCountry(newCountry)
    onCountryChange(newCountry, isTaiwan ? 'TW' : '')
  }, [onCountryChange])

  // 處理機場代碼變更
  const handleAirportChange = useCallback((code: string) => {
    const airport = getAirport(code)
    const cityName = airport?.city_name_zh || airport?.city_name_en || code
    onAirportChange(code, cityName)
  }, [getAirport, onAirportChange])

  const isTaiwan = isTaiwanCountry(country)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        {/* 國家選擇 */}
        <div>
          {showLabels && (
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              國家
            </label>
          )}
          <Combobox
            value={country}
            onChange={handleCountryChange}
            options={countryOptions}
            placeholder="選擇國家..."
            emptyMessage={loading ? '載入中...' : '找不到符合的國家'}
            showSearchIcon
            showClearButton
            disablePortal={disablePortal}
          />
        </div>

        {/* 機場代碼選擇（台灣不需要） */}
        {!isTaiwan ? (
          <div>
            {showLabels && (
              <label className="text-sm font-medium text-morandi-primary mb-2 block">
                城市 (機場代碼)
              </label>
            )}
            <Combobox
              value={airportCode}
              onChange={handleAirportChange}
              options={availableAirports}
              placeholder={!country ? '請先選擇國家' : '搜尋城市或機場...'}
              emptyMessage={loading ? '載入中...' : '找不到符合的機場'}
              showSearchIcon
              showClearButton
              disabled={!country}
              disablePortal={disablePortal}
            />
          </div>
        ) : (
          <div className="flex items-center">
            {showLabels && <div className="mb-2 h-5" />}
            <p className="text-sm text-morandi-secondary">國內旅遊不需選擇城市</p>
          </div>
        )}
      </div>

      {/* 顯示當前選擇的城市代碼（非台灣團）*/}
      {airportCode && !isTaiwan && (
        <p className="text-xs text-morandi-secondary">
          團號城市代碼：<span className="font-mono font-semibold">{airportCode}</span>
        </p>
      )}
    </div>
  )
}
