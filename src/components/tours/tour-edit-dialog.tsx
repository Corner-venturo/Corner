'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SimpleDateInput } from '@/components/ui/simple-date-input'
import { Combobox } from '@/components/ui/combobox'
import { Tour, FlightInfo } from '@/stores/types'
import type { Json } from '@/lib/supabase/types'
import { useRegionsStore } from '@/stores'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { mutate } from 'swr'
import { Search, Loader2, Plane } from 'lucide-react'
import { searchFlightAction } from '@/features/dashboard/actions/flight-actions'

interface TourEditDialogProps {
  isOpen: boolean
  onClose: () => void
  tour: Tour
  onSuccess?: (updatedTour: Tour) => void
}

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

export function TourEditDialog({ isOpen, onClose, tour, onSuccess }: TourEditDialogProps) {
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
        isSpecial: tour.status === 'special',
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
      isSpecial: tour.status === 'special',
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
      fullDate = new Date().toISOString().split('T')[0]
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
        toast.success('航班資料已更新')
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
      fullDate = new Date().toISOString().split('T')[0]
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
        toast.success('航班資料已更新')
      }
    } catch {
      toast.error('查詢航班時發生錯誤')
    } finally {
      setLoadingReturn(false)
    }
  }, [formData.returnFlight.flightNumber, formData.return_date])

  // 處理儲存
  const handleSubmit = async () => {
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
        status: formData.isSpecial ? 'special' : tour.status,
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
      console.error('更新旅遊團失敗:', error)
      toast.error('更新失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        aria-describedby={undefined}
        onInteractOutside={e => {
          const target = e.target as HTMLElement
          if (target.closest('[role="listbox"]') || target.closest('select')) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>編輯旅遊團基本資料</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 旅遊團名稱 */}
          <div>
            <label className="text-sm font-medium text-morandi-primary">旅遊團名稱 *</label>
            <Input
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1"
            />
          </div>

          {/* 目的地選擇 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">國家/地區</label>
              <Combobox
                value={formData.countryCode}
                onChange={countryCode => {
                  const selectedCountry = activeCountries.find(c => c.code === countryCode)
                  const cities =
                    countryCode === '__custom__'
                      ? []
                      : selectedCountry
                        ? getCitiesByCountryId(selectedCountry.id)
                        : []
                  setAvailableCities(cities)
                  setFormData(prev => ({
                    ...prev,
                    countryCode,
                    cityCode: countryCode === '__custom__' ? '__custom__' : '',
                  }))
                }}
                options={[
                  ...activeCountries.map(country => ({
                    value: country.code,
                    label: country.name,
                  })),
                  { value: '__custom__', label: '+ 其他目的地' },
                ]}
                placeholder="選擇國家..."
                emptyMessage="找不到符合的國家"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">城市</label>
              {formData.countryCode === '__custom__' ? (
                <Input
                  value={formData.customLocation || ''}
                  onChange={e => setFormData(prev => ({ ...prev, customLocation: e.target.value }))}
                  placeholder="輸入城市名稱"
                  className="mt-1"
                />
              ) : (
                <Combobox
                  value={formData.cityCode}
                  onChange={cityCode => setFormData(prev => ({ ...prev, cityCode }))}
                  options={availableCities.map(city => ({
                    value: city.code || `__no_code_${city.id}`,
                    label: city.code ? `${city.name} (${city.code})` : city.name,
                    disabled: !city.code,
                  }))}
                  placeholder="選擇城市..."
                  emptyMessage="找不到符合的城市"
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
                onChange={departure_date => {
                  setFormData(prev => ({
                    ...prev,
                    departure_date,
                    return_date: prev.return_date && prev.return_date < departure_date
                      ? departure_date
                      : prev.return_date,
                  }))
                }}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">返回日期 *</label>
              <SimpleDateInput
                value={formData.return_date}
                onChange={return_date => setFormData(prev => ({ ...prev, return_date }))}
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
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1"
            />
          </div>

          {/* 航班資訊 */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Plane className="w-4 h-4 text-morandi-gold" />
              <label className="text-sm font-medium text-morandi-primary">航班資訊（選填）</label>
            </div>

            {/* 去程航班 */}
            <div className="bg-morandi-container/30 p-3 rounded-lg mb-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-morandi-primary">去程航班</h4>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleSearchOutbound}
                  disabled={loadingOutbound || !formData.outboundFlight.flightNumber}
                  className="h-7 text-xs gap-1"
                >
                  {loadingOutbound ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Search size={12} />
                  )}
                  查詢航班
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">航班號碼</label>
                  <Input
                    value={formData.outboundFlight.flightNumber}
                    onChange={e => updateFlightField('outboundFlight', 'flightNumber', e.target.value)}
                    placeholder="BR158"
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">航空公司</label>
                  <Input
                    value={formData.outboundFlight.airline}
                    onChange={e => updateFlightField('outboundFlight', 'airline', e.target.value)}
                    placeholder="長榮航空"
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">出發機場</label>
                  <Input
                    value={formData.outboundFlight.departureAirport}
                    onChange={e => updateFlightField('outboundFlight', 'departureAirport', e.target.value)}
                    placeholder="TPE"
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">抵達機場</label>
                  <Input
                    value={formData.outboundFlight.arrivalAirport}
                    onChange={e => updateFlightField('outboundFlight', 'arrivalAirport', e.target.value)}
                    placeholder="NRT"
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">出發時間</label>
                  <Input
                    value={formData.outboundFlight.departureTime}
                    onChange={e => updateFlightField('outboundFlight', 'departureTime', e.target.value)}
                    placeholder="08:30"
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">抵達時間</label>
                  <Input
                    value={formData.outboundFlight.arrivalTime}
                    onChange={e => updateFlightField('outboundFlight', 'arrivalTime', e.target.value)}
                    placeholder="12:30"
                    className="text-xs h-8"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">飛行時間</label>
                  <Input
                    value={formData.outboundFlight.duration || ''}
                    onChange={e => updateFlightField('outboundFlight', 'duration', e.target.value)}
                    placeholder="3h 30m"
                    className="text-xs h-8"
                  />
                </div>
              </div>
            </div>

            {/* 回程航班 */}
            <div className="bg-morandi-container/20 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-morandi-primary">回程航班</h4>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleSearchReturn}
                  disabled={loadingReturn || !formData.returnFlight.flightNumber}
                  className="h-7 text-xs gap-1"
                >
                  {loadingReturn ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Search size={12} />
                  )}
                  查詢航班
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">航班號碼</label>
                  <Input
                    value={formData.returnFlight.flightNumber}
                    onChange={e => updateFlightField('returnFlight', 'flightNumber', e.target.value)}
                    placeholder="BR157"
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">航空公司</label>
                  <Input
                    value={formData.returnFlight.airline}
                    onChange={e => updateFlightField('returnFlight', 'airline', e.target.value)}
                    placeholder="長榮航空"
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">出發機場</label>
                  <Input
                    value={formData.returnFlight.departureAirport}
                    onChange={e => updateFlightField('returnFlight', 'departureAirport', e.target.value)}
                    placeholder="NRT"
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">抵達機場</label>
                  <Input
                    value={formData.returnFlight.arrivalAirport}
                    onChange={e => updateFlightField('returnFlight', 'arrivalAirport', e.target.value)}
                    placeholder="TPE"
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">出發時間</label>
                  <Input
                    value={formData.returnFlight.departureTime}
                    onChange={e => updateFlightField('returnFlight', 'departureTime', e.target.value)}
                    placeholder="14:00"
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">抵達時間</label>
                  <Input
                    value={formData.returnFlight.arrivalTime}
                    onChange={e => updateFlightField('returnFlight', 'arrivalTime', e.target.value)}
                    placeholder="17:00"
                    className="text-xs h-8"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">飛行時間</label>
                  <Input
                    value={formData.returnFlight.duration || ''}
                    onChange={e => updateFlightField('returnFlight', 'duration', e.target.value)}
                    placeholder="3h 30m"
                    className="text-xs h-8"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 選項 */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-isSpecial"
                checked={formData.isSpecial}
                onChange={e => setFormData(prev => ({ ...prev, isSpecial: e.target.checked }))}
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
                onChange={e => setFormData(prev => ({ ...prev, enable_checkin: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="edit-enableCheckin" className="text-sm text-morandi-primary">
                開啟報到功能
              </label>
            </div>
          </div>
        </div>

        {/* 按鈕 */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !formData.name.trim() || !formData.departure_date || !formData.return_date}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            {submitting ? '儲存中...' : '儲存變更'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
