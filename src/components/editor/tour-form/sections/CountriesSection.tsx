import React from 'react'
import { TourFormData, TourCountry } from '../types'
import { X } from 'lucide-react'
import { Combobox, ComboboxOption } from '@/components/ui/combobox'
import { COMP_EDITOR_LABELS } from '../../constants/labels'

interface CountriesSectionProps {
  data: TourFormData
  allCountries: Array<{ id: string; code: string; name: string }>
  availableCities: Array<{ id: string; code: string; name: string }>
  getCitiesByCountryId: (countryId: string) => Array<{ id: string; code: string; name: string }>
  onChange: (data: TourFormData) => void
}

export function CountriesSection({
  data,
  allCountries,
  availableCities,
  getCitiesByCountryId,
  onChange,
}: CountriesSectionProps) {
  // 穩定國家選項（避免無限循環）
  const countryOptions = React.useMemo(
    () => allCountries.map(c => ({ value: c.id, label: c.name })),
    [allCountries]
  )

  // 初始化 countries 陣列（如果沒有的話，從現有的 country/city 建立）
  const hasInitializedRef = React.useRef(false)

  React.useEffect(() => {
    // 只初始化一次，避免觸發無限循環
    if (hasInitializedRef.current) return
    if (!data.countries || data.countries.length === 0) {
      if (data.country && allCountries.length > 0) {
        const country = allCountries.find(c => c.name === data.country)
        if (country) {
          const cities = getCitiesByCountryId(country.id)
          const city = cities.find(c => c.name === data.city)

          hasInitializedRef.current = true
          onChange({
            ...data,
            countries: [
              {
                country_id: country.id,
                country_name: country.name,
                country_code: country.code,
                main_city_id: city?.id,
                main_city_name: city?.name || data.city,
                is_primary: true,
              },
            ],
          })
        }
      }
    } else {
      hasInitializedRef.current = true
    }
  }, [allCountries.length])

  const countries = data.countries || []
  const primaryCountry = countries.find(c => c.is_primary)

  // 穩定主要城市選項（避免無限循環）
  const primaryCityOptions = React.useMemo(() => {
    if (!primaryCountry?.country_id) return []
    return getCitiesByCountryId(primaryCountry.country_id).map(c => ({
      value: c.id,
      label: `${c.name} (${c.code})`,
    }))
  }, [primaryCountry?.country_id, getCitiesByCountryId])

  // 為每個國家建立穩定的城市選項映射
  const cityOptionsMap = React.useMemo(() => {
    const map: Record<string, Array<{ value: string; label: string }>> = {}
    countries.forEach(country => {
      if (country.country_id) {
        map[country.country_id] = getCitiesByCountryId(country.country_id).map(c => ({
          value: c.id,
          label: `${c.name} (${c.code})`,
        }))
      }
    })
    return map
  }, [countries, getCitiesByCountryId])

  const addCountry = () => {
    const newCountry: TourCountry = {
      country_id: '',
      country_name: '',
      country_code: '',
      main_city_id: '',
      main_city_name: '',
      is_primary: false,
    }

    onChange({
      ...data,
      countries: [...countries, newCountry],
    })
  }

  const updateCountry = (index: number, field: keyof TourCountry, value: string | boolean) => {
    const updated = [...countries]

    if (field === 'country_id') {
      // 當選擇國家時，自動填入國家名稱和代碼
      const country = allCountries.find(c => c.id === value)
      if (country) {
        updated[index] = {
          ...updated[index],
          country_id: country.id,
          country_name: country.name,
          country_code: country.code,
          main_city_id: '',
          main_city_name: '',
        }
      }
    } else if (field === 'main_city_id') {
      // 當選擇城市時，自動填入城市名稱
      const cities = getCitiesByCountryId(updated[index].country_id)
      const city = cities.find(c => c.id === value)
      if (city) {
        updated[index] = {
          ...updated[index],
          main_city_id: city.id,
          main_city_name: city.name,
        }
      }
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      }
    }

    onChange({
      ...data,
      countries: updated,
    })
  }

  const removeCountry = (index: number) => {
    const updated = countries.filter((_, i) => i !== index)
    onChange({
      ...data,
      countries: updated,
    })
  }

  return (
    <div className="space-y-4">
      <div className="border-b-2 border-[#B8A99A] pb-2">
        <h2 className="text-lg font-bold text-morandi-primary">🌍 旅遊國家/地區</h2>
        <p className="text-xs text-morandi-primary mt-1">
          設定此行程會前往的國家，方便後續選擇景點
        </p>
      </div>

      {/* 主要國家 */}
      {primaryCountry && (
        <div className="p-4 bg-[#F9F8F6] border-2 border-[#C6B9AC] rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-[#333333]">主要國家</label>
            <span className="text-xs bg-[#B8A99A] text-white px-2 py-0.5 rounded">主要</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-morandi-primary mb-1">國家</label>
              <Combobox
                value={primaryCountry.country_id}
                onChange={value => {
                  const index = countries.findIndex(c => c.is_primary)
                  if (index !== -1) {
                    updateCountry(index, 'country_id', value)
                  }
                }}
                options={countryOptions}
                placeholder={COMP_EDITOR_LABELS.搜尋或選擇國家}
                showSearchIcon
                showClearButton
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-morandi-primary mb-1">
                主要城市（選填）
              </label>
              <Combobox
                value={primaryCountry.main_city_id || ''}
                onChange={value => {
                  const index = countries.findIndex(c => c.is_primary)
                  if (index !== -1) {
                    updateCountry(index, 'main_city_id', value)
                  }
                }}
                options={primaryCityOptions}
                placeholder={COMP_EDITOR_LABELS.搜尋或選擇城市}
                showSearchIcon
                showClearButton
                disabled={!primaryCountry.country_id}
              />
            </div>
          </div>
        </div>
      )}

      {/* 其他國家 */}
      {countries
        .filter(c => !c.is_primary)
        .map((country, index) => {
          const actualIndex = countries.findIndex(
            c => c.country_id === country.country_id && !c.is_primary
          )
          return (
            <div key={actualIndex} className="p-4 bg-muted border border-border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-morandi-primary">
                  其他國家 #{index + 1}
                </label>
                <button
                  onClick={() => removeCountry(actualIndex)}
                  className="text-[#8C8C8C] hover:text-[#8C8C8C] text-sm flex items-center gap-1"
                >
                  <X size={14} />
                  刪除
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-morandi-primary mb-1">
                    國家
                  </label>
                  <Combobox
                    value={country.country_id}
                    onChange={value => updateCountry(actualIndex, 'country_id', value)}
                    options={countryOptions}
                    placeholder={COMP_EDITOR_LABELS.搜尋或選擇國家}
                    showSearchIcon
                    showClearButton
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-morandi-primary mb-1">
                    主要城市（選填）
                  </label>
                  <Combobox
                    value={country.main_city_id || ''}
                    onChange={value => updateCountry(actualIndex, 'main_city_id', value)}
                    options={cityOptionsMap[country.country_id] || []}
                    placeholder={COMP_EDITOR_LABELS.搜尋或選擇城市}
                    showSearchIcon
                    showClearButton
                    disabled={!country.country_id}
                  />
                </div>
              </div>
            </div>
          )
        })}

      {/* 新增按鈕 */}
      <button
        onClick={addCountry}
        className="w-full px-4 py-2.5 border-2 border-dashed border-[#E8E4E0] rounded-lg text-sm text-morandi-secondary hover:border-[#B8A99A] hover:text-[#333333] hover:bg-[#F9F8F6] transition-colors"
      >
        + 新增其他國家
      </button>
    </div>
  )
}
