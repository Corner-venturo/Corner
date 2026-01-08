'use client'

import { getTodayString } from '@/lib/utils/format-date'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Tour, FlightInfo } from '@/stores/types'
import type { Json } from '@/lib/supabase/types'
import { useRegionsStore } from '@/stores'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { mutate } from 'swr'
import { searchFlightAction } from '@/features/dashboard/actions/flight-actions'
import { logger } from '@/lib/utils/logger'

interface EditFormData {
  name: string
  countryCode: string
  cityCode: string
  customLocation?: string
  departure_date: string
  return_date: string
  description: string
  outboundFlight: FlightInfo
  returnFlight: FlightInfo
  isSpecial: boolean
  enable_checkin: boolean
}

const emptyFlightInfo: FlightInfo = {
  airline: '',
  flightNumber: '',
  departureAirport: 'TPE',
  departureTime: '',
  departureDate: '',
  arrivalAirport: '',
  arrivalTime: '',
  duration: '',
}

export function useTourEditDialog(tour: Tour | null, isOpen: boolean, onClose: () => void, onSuccess?: (updatedTour: Tour) => void) {
  const { countries, fetchAll: fetchRegions, getCitiesByCountry } = useRegionsStore()
  const [submitting, setSubmitting] = useState(false)
  const [availableCities, setAvailableCities] = useState<Array<{ id: string; code: string; name: string }>>([])
  const initializedRef = useRef(false)
  const [loadingOutbound, setLoadingOutbound] = useState(false)
  const [loadingReturn, setLoadingReturn] = useState(false)

  const [formData, setFormData] = useState<EditFormData>({
    name: '',
    countryCode: '',
    cityCode: '',
    departure_date: '',
    return_date: '',
    description: '',
    outboundFlight: { ...emptyFlightInfo },
    returnFlight: { ...emptyFlightInfo, departureAirport: '', arrivalAirport: 'TPE' },
    isSpecial: false,
    enable_checkin: false,
  })

  // 載入國家/城市資料
  useEffect(() => {
    if (isOpen && countries.length === 0) {
      fetchRegions()
    }
  }, [isOpen, countries.length, fetchRegions])

  // 重置 initialized 狀態
  useEffect(() => {
    if (!isOpen) {
      initializedRef.current = false
    }
  }, [isOpen])

  // 取得可用國家
  const activeCountries = useMemo(() => {
    return countries
      .filter(c => c.is_active)
      .map(c => ({ id: c.id, code: c.code || '', name: c.name }))
  }, [countries])

  // 初始化表單資料（只在開啟時執行一次）
  useEffect(() => {
    if (!isOpen || !tour || initializedRef.current) return

    // 如果國家資料還沒載入，先設定基本資料
    if (activeCountries.length === 0) {
      const tourOutbound = tour.outbound_flight as FlightInfo | null
      const tourReturn = tour.return_flight as FlightInfo | null

      setFormData({
        name: tour.name,
        countryCode: '__custom__',
        cityCode: '__custom__',
        customLocation: tour.location || undefined,
        departure_date: tour.departure_date || '',
        return_date: tour.return_date || '',
        description: tour.description || '',
        outboundFlight: tourOutbound || { ...emptyFlightInfo },
        returnFlight: tourReturn || { ...emptyFlightInfo, departureAirport: '', arrivalAirport: 'TPE' },
        isSpecial: tour.status === '特殊團',
        enable_checkin: tour.enable_checkin || false,
      })
      return
    }

    // 國家資料已載入，進行完整初始化
    initializedRef.current = true

    let countryCode = ''
    let cityCode = ''
    let citiesList: Array<{ id: string; code: string; name: string }> = []

    // 根據 country_id 和 main_city_id 查找
    if (tour.country_id && tour.main_city_id) {
      const matchedCountry = activeCountries.find(c => c.id === tour.country_id)
      if (matchedCountry) {
        countryCode = matchedCountry.code
        citiesList = getCitiesByCountry(matchedCountry.id)
          .filter(c => c.is_active)
          .map(c => ({
            id: c.id,
            code: c.airport_code || '',
            name: c.name,
          }))
        const matchedCity = citiesList.find(city => city.id === tour.main_city_id)
        if (matchedCity) {
          cityCode = matchedCity.code
        }
      }
    }

    // Fallback: 用 location 文字匹配
    if (!countryCode && tour.location) {
      for (const country of activeCountries) {
        const citiesInCountry = getCitiesByCountry(country.id)
          .filter(c => c.is_active)
          .map(c => ({
            id: c.id,
            code: c.airport_code || '',
            name: c.name,
          }))
        const matchedCity = citiesInCountry.find(city => city.name === tour.location)
        if (matchedCity) {
          countryCode = country.code
          cityCode = matchedCity.code
          citiesList = citiesInCountry
          break
        }
      }
    }

    if (!countryCode) {
      countryCode = '__custom__'
      cityCode = '__custom__'
    }

    const tourOutbound = tour.outbound_flight as FlightInfo | null
    const tourReturn = tour.return_flight as FlightInfo | null

    setAvailableCities(citiesList)
    setFormData({
      name: tour.name,
      countryCode,
      cityCode,
      customLocation: countryCode === '__custom__' ? tour.location || undefined : undefined,
      departure_date: tour.departure_date || '',
      return_date: tour.return_date || '',
      description: tour.description || '',
      outboundFlight: tourOutbound || { ...emptyFlightInfo },
      returnFlight: tourReturn || { ...emptyFlightInfo, departureAirport: '', arrivalAirport: 'TPE' },
      isSpecial: tour.status === '特殊團',
      enable_checkin: tour.enable_checkin || false,
    })
  }, [isOpen, tour, activeCountries, getCitiesByCountry])

  // 取得城市列表
  const getCitiesByCountryId = useCallback(
    (countryId: string) => {
      return getCitiesByCountry(countryId)
        .filter(c => c.is_active)
        .map(c => ({
          id: c.id,
          code: c.airport_code || '',
          name: c.name,
          country_id: c.country_id,
        }))
    },
    [getCitiesByCountry]
  )

  // 更新航班欄位
  const updateFlightField = useCallback((
    flightType: 'outboundFlight' | 'returnFlight',
    field: keyof FlightInfo,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [flightType]: {
        ...prev[flightType],
        [field]: value,
      },
    }))
  }, [])

  // 查詢去程航班
  const handleSearchOutbound = useCallback(async () => {
    const flightNumber = formData.outboundFlight.flightNumber
    if (!flightNumber) {
      toast.error('請先輸入航班號碼')
      return
    }

    // 組合日期
    let fullDate = ''
    if (formData.departure_date) {
      fullDate = formData.departure_date
    } else {
      fullDate = getTodayString()
    }

    setLoadingOutbound(true)
    try {
      const result = await searchFlightAction(flightNumber, fullDate)
      if (result.error) {
        toast.error(result.error)
        return
      }
      if (result.data) {
        setFormData(prev => ({
          ...prev,
          outboundFlight: {
            ...prev.outboundFlight,
            airline: result.data!.airline,
            departureAirport: result.data!.departure.iata,
            arrivalAirport: result.data!.arrival.iata,
            departureTime: result.data!.departure.time,
            arrivalTime: result.data!.arrival.time,
            duration: result.data!.duration || '',
          },
        }))
        // 顯示警告（如果資料不完整）
        if (result.warning) {
          toast.warning(result.warning, { duration: 5000 })
        } else {
          toast.success('航班資料已更新')
        }
      }
    } catch {
      toast.error('查詢航班時發生錯誤')
    } finally {
      setLoadingOutbound(false)
    }
  }, [formData.outboundFlight.flightNumber, formData.departure_date])

  // 查詢回程航班
  const handleSearchReturn = useCallback(async () => {
    const flightNumber = formData.returnFlight.flightNumber
    if (!flightNumber) {
      toast.error('請先輸入航班號碼')
      return
    }

    // 組合日期
    let fullDate = ''
    if (formData.return_date) {
      fullDate = formData.return_date
    } else {
      fullDate = getTodayString()
    }

    setLoadingReturn(true)
    try {
      const result = await searchFlightAction(flightNumber, fullDate)
      if (result.error) {
        toast.error(result.error)
        return
      }
      if (result.data) {
        setFormData(prev => ({
          ...prev,
          returnFlight: {
            ...prev.returnFlight,
            airline: result.data!.airline,
            departureAirport: result.data!.departure.iata,
            arrivalAirport: result.data!.arrival.iata,
            departureTime: result.data!.departure.time,
            arrivalTime: result.data!.arrival.time,
            duration: result.data!.duration || '',
          },
        }))
        // 顯示警告（如果資料不完整）
        if (result.warning) {
          toast.warning(result.warning, { duration: 5000 })
        } else {
          toast.success('航班資料已更新')
        }
      }
    } catch {
      toast.error('查詢航班時發生錯誤')
    } finally {
      setLoadingReturn(false)
    }
  }, [formData.returnFlight.flightNumber, formData.return_date])

  // 處理儲存
  const handleSubmit = useCallback(async () => {
    if (!tour) return
    if (!formData.name.trim() || !formData.departure_date || !formData.return_date) {
      toast.error('請填寫必要欄位')
      return
    }

    setSubmitting(true)
    try {
      // 找出選擇的國家和城市
      let location = formData.customLocation
      let countryId = tour.country_id
      let mainCityId = tour.main_city_id

      if (formData.countryCode !== '__custom__') {
        const selectedCountry = activeCountries.find(c => c.code === formData.countryCode)
        if (selectedCountry) {
          countryId = selectedCountry.id
          const selectedCity = availableCities.find(c => c.code === formData.cityCode)
          if (selectedCity) {
            mainCityId = selectedCity.id
            location = selectedCity.name
          }
        }
      }

      // 清理空的航班資料（轉換為 Json 類型供 Supabase 使用）
      const cleanFlightInfo = (flight: FlightInfo): Json | null => {
        if (!flight.flightNumber && !flight.airline && !flight.departureTime && !flight.arrivalTime) {
          return null
        }
        return flight as unknown as Json
      }

      const updates = {
        name: formData.name.trim(),
        location,
        country_id: countryId,
        main_city_id: mainCityId,
        departure_date: formData.departure_date,
        return_date: formData.return_date,
        description: formData.description.trim(),
        outbound_flight: cleanFlightInfo(formData.outboundFlight),
        return_flight: cleanFlightInfo(formData.returnFlight),
        status: formData.isSpecial ? '特殊團' : tour.status,
        enable_checkin: formData.enable_checkin,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('tours')
        .update(updates)
        .eq('id', tour.id)
        .select()
        .single()

      if (error) throw error

      toast.success('旅遊團資料已更新')

      // 重新載入資料
      mutate(`tour-${tour.id}`)
      mutate('tours')

      onSuccess?.(data as Tour)
      onClose()
    } catch (error) {
      logger.error('更新旅遊團失敗:', error)
      toast.error('更新失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }, [tour, formData, activeCountries, availableCities, onSuccess, onClose])

  return {
    formData,
    setFormData,
    submitting,
    activeCountries,
    availableCities,
    setAvailableCities,
    loadingOutbound,
    loadingReturn,
    getCitiesByCountryId,
    updateFlightField,
    handleSearchOutbound,
    handleSearchReturn,
    handleSubmit,
  }
}
