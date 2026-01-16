'use client'

import { useState, useMemo, useCallback } from 'react'
import { Combobox } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTourDestinations } from '@/features/tours/hooks/useTourDestinations'

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
    destinations,
    countries: hookCountries,
    loading: destinationsLoading,
    addDestination,
  } = useTourDestinations()

  // 新增機場代碼狀態
  const [showAddNew, setShowAddNew] = useState(false)
  const [newCity, setNewCity] = useState('')
  const [newAirportCode, setNewAirportCode] = useState('')
  const [saving, setSaving] = useState(false)

  // 國家選項（優先使用外部傳入的）
  const countryOptions = useMemo(() => {
    if (externalCountries) {
      return externalCountries
        .filter(c => c.is_active)
        .map(c => ({ value: c.name, label: c.name }))
    }
    return hookCountries.map(c => ({ value: c, label: c }))
  }, [externalCountries, hookCountries])

  // 根據國家取得機場代碼列表
  const availableAirports = useMemo(() => {
    if (!country) return []
    return destinations
      .filter(d => d.country === country)
      .map(d => ({
        value: d.airport_code,
        label: `${d.city} (${d.airport_code})`,
      }))
  }, [country, destinations])

  // 處理國家變更
  const handleCountryChange = useCallback((newCountry: string) => {
    const isTaiwan = isTaiwanCountry(newCountry)
    onCountryChange(newCountry, isTaiwan ? 'TW' : '')
    setShowAddNew(false)
    setNewCity('')
    setNewAirportCode('')
  }, [onCountryChange])

  // 處理機場代碼變更
  const handleAirportChange = useCallback((code: string) => {
    const dest = destinations.find(d => d.airport_code === code)
    onAirportChange(code, dest?.city || code)
  }, [destinations, onAirportChange])

  // 新增機場代碼
  const handleAddAirport = useCallback(async () => {
    if (!country || !newCity.trim() || !newAirportCode.trim()) return

    setSaving(true)
    try {
      const result = await addDestination(country, newCity, newAirportCode)
      if (result.success) {
        const code = newAirportCode.trim().toUpperCase()
        onAirportChange(code, newCity.trim())
        setShowAddNew(false)
        setNewCity('')
        setNewAirportCode('')
      }
    } finally {
      setSaving(false)
    }
  }, [country, newCity, newAirportCode, addDestination, onAirportChange])

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
            emptyMessage={destinationsLoading ? '載入中...' : (countryOptions.length === 0 ? '無可用國家' : '找不到符合的國家')}
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
            <div className="flex gap-2">
              <Combobox
                value={airportCode}
                onChange={handleAirportChange}
                options={availableAirports}
                placeholder={!country ? '請先選擇國家' : '選擇城市...'}
                emptyMessage={destinationsLoading ? '載入中...' : '找不到城市，點 + 新增'}
                showSearchIcon
                showClearButton
                disabled={!country}
                className="flex-1 min-w-0"
                disablePortal={disablePortal}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowAddNew(true)}
                disabled={!country}
                className="h-9 px-2 shrink-0"
                title="新增城市"
              >
                +
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center">
            {showLabels && <div className="mb-2 h-5" />}
            <p className="text-sm text-morandi-secondary">國內旅遊不需選擇城市</p>
          </div>
        )}
      </div>

      {/* 新增機場代碼區塊 */}
      {country && !isTaiwan && showAddNew && (
        <div className="border border-border rounded-lg p-3 space-y-3 bg-morandi-container/20">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-morandi-primary">
              新增 {country} 的機場代碼
            </span>
            <button
              type="button"
              onClick={() => {
                setShowAddNew(false)
                setNewCity('')
                setNewAirportCode('')
              }}
              className="text-morandi-secondary hover:text-morandi-primary text-sm"
            >
              取消
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={newCity}
              onChange={e => setNewCity(e.target.value)}
              placeholder="城市（如：東京）"
            />
            <Input
              value={newAirportCode}
              onChange={e => {
                const halfWidth = e.target.value
                  .replace(/[Ａ-Ｚａ-ｚ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
                  .replace(/[^A-Za-z]/g, '')
                  .toUpperCase()
                setNewAirportCode(halfWidth)
              }}
              placeholder="代碼（如：NRT）"
              maxLength={4}
            />
          </div>
          <Button
            type="button"
            onClick={handleAddAirport}
            disabled={!newCity.trim() || !newAirportCode.trim() || saving}
            className="w-full bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            size="sm"
          >
            {saving ? '新增中...' : '新增並選擇'}
          </Button>
        </div>
      )}

      {/* 顯示當前選擇的城市代碼（非台灣團）*/}
      {airportCode && !isTaiwan && (
        <p className="text-xs text-morandi-secondary">
          團號城市代碼：<span className="font-mono font-semibold">{airportCode}</span>
        </p>
      )}
    </div>
  )
}
