import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuotes } from './useQuotes'
import { useTourStore, useRegionStore, useOrderStore } from '@/stores'
import { CostCategory, ParticipantCounts, SellingPrices, costCategories } from '../types'

export const useQuoteState = () => {
  const params = useParams()
  const router = useRouter()
  const { quotes, updateQuote } = useQuotes()
  const { items: tours, create: addTour } = useTourStore()
  const { items: orders } = useOrderStore()
  const regionStore = useRegionStore()
  const { items: regions } = regionStore

  const quote_id = params.id as string
  const quote = quotes.find(q => q.id === quote_id)

  // 檢查是否為特殊團報價單
  const relatedTour = quote?.tour_id ? tours.find(t => t.id === quote.tour_id) : null
  const isSpecialTour = relatedTour?.status === 'special'
  const isReadOnly = isSpecialTour // 特殊團報價單設為唯讀

  // 計算旅遊團的實際預計人數（從訂單的 member_count 加總）
  const tourPlannedParticipants = useMemo(() => {
    if (!relatedTour) return 0
    const tourOrders = orders.filter(order => order.tour_id === relatedTour.id)
    return tourOrders.reduce((sum, order) => sum + (order.member_count || 0), 0)
  }, [relatedTour, orders])

  // 懶載入 regions（只在報價單頁面才載入）
  useEffect(() => {
    if (regions.length === 0) {
      regionStore.fetchAll()
    }
  }, [regions.length, regionStore])

  // 從 regions 取得啟用的國家清單
  const activeCountries = useMemo(() => {
    return regions
      .filter(r => r.type === 'country' && r.status === 'active' && !r._deleted)
      .map(r => ({ code: r.code, name: r.name }))
  }, [regions])

  // 根據國家代碼取得城市清單
  const getCitiesByCountryCode = useCallback(
    (countryCode: string) => {
      return regions
        .filter(
          r =>
            r.type === 'city' &&
            r.country_code === countryCode &&
            r.status === 'active' &&
            !r._deleted
        )
        .map(r => ({ code: r.code, name: r.name }))
    },
    [regions]
  )

  // 從旅遊團的 location 反查國家和城市代碼
  const getCountryAndCityFromLocation = useCallback(
    (location: string) => {
      for (const country of activeCountries) {
        const cities = getCitiesByCountryCode(country.code)
        const matchedCity = cities.find(city => city.name === location)
        if (matchedCity) {
          return { countryCode: country.code, cityCode: matchedCity.code }
        }
      }
      return { countryCode: '', cityCode: '' }
    },
    [activeCountries, getCitiesByCountryCode]
  )

  // 國家和城市選擇 state
  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    if (relatedTour) {
      return getCountryAndCityFromLocation(relatedTour.location).countryCode
    }
    return activeCountries[0]?.code || ''
  })

  const [selectedCity, setSelectedCity] = useState<string>(() => {
    if (relatedTour) {
      return getCountryAndCityFromLocation(relatedTour.location).cityCode
    }
    const defaultCities = selectedCountry ? getCitiesByCountryCode(selectedCountry) : []
    return defaultCities[0]?.code || ''
  })

  const [availableCities, setAvailableCities] = useState(() => {
    return selectedCountry ? getCitiesByCountryCode(selectedCountry) : []
  })

  const [categories, setCategories] = useState<CostCategory[]>(() => {
    const initialCategories = quote?.categories || costCategories
    // 確保每個分類的總計都正確計算
    return initialCategories.map(cat => ({
      ...cat,
      total: cat.items.reduce((sum, item) => sum + (item.total || 0), 0),
    }))
  })

  const [accommodationDays, setAccommodationDays] = useState<number>(quote?.accommodation_days || 0)

  // 多身份人數統計
  const [participantCounts, setParticipantCounts] = useState<ParticipantCounts>(
    quote?.participant_counts || {
      adult: 1,
      child_with_bed: 0,
      child_no_bed: 0,
      single_room: 0,
      infant: 0,
    }
  )

  // 總人數：優先使用旅遊團訂單的預計人數，其次用 max_participants，最後從參與人數加總
  const groupSize =
    tourPlannedParticipants ||
    relatedTour?.max_participants ||
    participantCounts.adult +
      participantCounts.child_with_bed +
      participantCounts.child_no_bed +
      participantCounts.single_room +
      participantCounts.infant

  // 導遊費用分攤人數（不含嬰兒）：優先使用旅遊團訂單的預計人數，其次用 max_participants，最後從參與人數加總
  const groupSizeForGuide =
    tourPlannedParticipants ||
    relatedTour?.max_participants ||
    participantCounts.adult +
      participantCounts.child_with_bed +
      participantCounts.child_no_bed +
      participantCounts.single_room

  const [quoteName, setQuoteName] = useState<string>(quote?.name || '')
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState<boolean>(false)
  const [versionName, setVersionName] = useState<string>('')

  // 多身份售價
  const [sellingPrices, setSellingPrices] = useState<SellingPrices>(
    quote?.selling_prices || {
      adult: 0,
      child_with_bed: 0,
      child_no_bed: 0,
      single_room: 0,
      infant: 0,
    }
  )

  // 如果找不到報價單，返回列表頁（只有在資料已載入時才判斷）
  useEffect(() => {
    // 只有當 quotes 陣列有資料（表示已載入）且找不到對應的 quote 時，才跳轉
    if (quotes.length > 0 && !quote) {
      router.push('/quotes')
    }
  }, [quote, quotes.length, router])

  // 當國家改變時，更新城市清單
  useEffect(() => {
    if (selectedCountry && !relatedTour) {
      const cities = getCitiesByCountryCode(selectedCountry)
      setAvailableCities(cities)
      if (cities.length > 0) {
        setSelectedCity(cities[0].code)
      }
    }
  }, [selectedCountry, relatedTour, getCitiesByCountryCode])

  return {
    quote_id,
    quote,
    relatedTour,
    isSpecialTour,
    isReadOnly,
    regions,
    activeCountries,
    getCitiesByCountryCode,
    getCountryAndCityFromLocation,
    selectedCountry,
    setSelectedCountry,
    selectedCity,
    setSelectedCity,
    availableCities,
    setAvailableCities,
    categories,
    setCategories,
    accommodationDays,
    setAccommodationDays,
    participantCounts,
    setParticipantCounts,
    groupSize,
    groupSizeForGuide,
    quoteName,
    setQuoteName,
    saveSuccess,
    setSaveSuccess,
    isSaveDialogOpen,
    setIsSaveDialogOpen,
    versionName,
    setVersionName,
    sellingPrices,
    setSellingPrices,
    updateQuote,
    addTour,
    router,
  }
}
