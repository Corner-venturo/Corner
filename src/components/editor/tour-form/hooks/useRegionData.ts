import React from 'react'
import { useRegionsStore } from '@/stores'
import { CityOption } from '../types'

export function useRegionData(data: { country?: string }) {
  const [selectedCountry, setSelectedCountry] = React.useState<string>(data.country || '')
  const [selectedCountryCode, setSelectedCountryCode] = React.useState<string>('')
  const { countries, cities, fetchAll } = useRegionsStore()

  // 懶載入：進入表單時載入 regions（只執行一次）
  const hasFetchedRef = React.useRef(false)
  // 追蹤是否已經初始化過 country code
  const hasInitializedCodeRef = React.useRef(false)

  React.useEffect(() => {
    if (countries.length === 0 && !hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchAll()
    }
  }, [countries.length, fetchAll])

  // 從 countries 取得所有國家列表
  const allDestinations = React.useMemo(() => {
    return countries.filter(c => c.is_active).map(c => ({ id: c.id, code: c.code || '', name: c.name }))
  }, [countries])

  // 建立國家名稱到代碼的對照
  const countryNameToCode = React.useMemo(() => {
    const map: Record<string, string> = {}
    allDestinations.forEach(dest => {
      map[dest.name] = dest.code
    })
    return map
  }, [allDestinations])

  // 根據選中的國家代碼取得城市列表
  const availableCities = React.useMemo<CityOption[]>(() => {
    if (!selectedCountryCode) return []
    // 根據 country code 找到對應的 country_id
    const country = countries.find(c => c.code === selectedCountryCode)
    if (!country) return []
    // 返回該國家的所有啟用城市
    return cities
      .filter(c => c.country_id === country.id && c.is_active)
      .map(c => ({ id: c.id, code: c.airport_code || c.name, name: c.name }))
  }, [selectedCountryCode, countries, cities])

  // 初始化：當 countries 載入完成後，設定初始的 country code
  React.useEffect(() => {
    if (countries.length === 0) return
    if (hasInitializedCodeRef.current) return
    if (!data.country) return

    // 初始化 selectedCountry（如果 state 和 data 不同）
    if (selectedCountry !== data.country) {
      setSelectedCountry(data.country)
    }

    // 查找對應的 country code
    const matchedCountry = countries.find(c => c.name === data.country)
    if (matchedCountry?.code) {
      setSelectedCountryCode(matchedCountry.code)
      hasInitializedCodeRef.current = true
    }
  }, [countries, data.country, selectedCountry])

  // 同步：當 data.country 從外部改變時同步（例如用戶選擇了新國家）
  React.useEffect(() => {
    if (countries.length === 0) return

    // 當 selectedCountry 與 data.country 不同時，可能是外部更新
    // 但我們要避免初始化時的重複設定
    if (data.country && selectedCountry !== data.country && hasInitializedCodeRef.current) {
      setSelectedCountry(data.country)
      const matchedCountry = countries.find(c => c.name === data.country)
      if (matchedCountry?.code) {
        setSelectedCountryCode(matchedCountry.code)
      }
    }
  }, [data.country, countries, selectedCountry])

  return {
    selectedCountry,
    setSelectedCountry,
    selectedCountryCode,
    setSelectedCountryCode,
    allDestinations,
    availableCities,
    countryNameToCode,
  }
}
