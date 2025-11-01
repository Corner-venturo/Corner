import React from 'react'
import { useRegionsStore } from '@/stores'
import { CityOption } from '../types'

export function useRegionData(data: { country?: string }) {
  const [selectedCountry, setSelectedCountry] = React.useState<string>(data.country || '')
  const [selectedCountryCode, setSelectedCountryCode] = React.useState<string>('')
  const [initialized, setInitialized] = React.useState<boolean>(false)
  const { countries, cities, fetchAll } = useRegionsStore()

  // 懶載入：進入表單時載入 regions（只執行一次）
  const hasFetchedRef = React.useRef(false)

  React.useEffect(() => {
    if (countries.length === 0 && !hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchAll()
    }
  }, [countries.length, fetchAll])

  // 從 countries 取得所有國家列表
  const allDestinations = React.useMemo(() => {
    return countries.filter(c => c.is_active).map(c => ({ code: c.code || '', name: c.name }))
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

  // 初始化和同步 data.country
  React.useEffect(() => {
    // 等待 countries 載入完成
    if (countries.length === 0) return

    // 當 data.country 改變時，更新 selectedCountry 和 selectedCountryCode
    if (data.country) {
      // 如果 selectedCountry 和 data.country 不同，需要同步
      if (selectedCountry !== data.country) {
        setSelectedCountry(data.country)
      }

      // 查找對應的 country code
      const code = countryNameToCode[data.country]
      if (code && code !== selectedCountryCode) {
        setSelectedCountryCode(code)
      }

      // 標記已初始化
      if (!initialized) {
        setInitialized(true)
      }
    }
  }, [
    data.country,
    // 移除 countryNameToCode（已在 useMemo 中穩定）
    // 移除 selectedCountry 和 selectedCountryCode（避免循環）
    countries.length,
  ])

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
