'use client'

import { getTodayString } from '@/lib/utils/format-date'

import { useState, useCallback } from 'react'
import { useTourDestinations } from './useTourDestinations'
import { searchFlightAction } from '@/features/dashboard/actions/flight-actions'
import { toast } from 'sonner'
import type { NewTourData } from '../types'

interface UseTourFormProps {
  isOpen: boolean
  mode: 'create' | 'edit'
  newTour: NewTourData
  setNewTour: React.Dispatch<React.SetStateAction<NewTourData>>
}

export function useTourForm({
  isOpen,
  mode,
  newTour,
  setNewTour,
}: UseTourFormProps) {
  // 使用目的地系統
  const {
    destinations,
    countries,
    loading: destinationsLoading,
    getCitiesByCountry,
    getAirportCode,
    addDestination,
  } = useTourDestinations()

  // 航班查詢狀態
  const [loadingOutbound, setLoadingOutbound] = useState(false)
  const [loadingReturn, setLoadingReturn] = useState(false)

  // 目的地輸入狀態
  const [showAirportCodeDialog, setShowAirportCodeDialog] = useState(false)
  const [newAirportCode, setNewAirportCode] = useState('')
  const [pendingCity, setPendingCity] = useState('')
  const [pendingCountry, setPendingCountry] = useState('')
  const [savingDestination, setSavingDestination] = useState(false)

  // 查詢去程航班
  const handleSearchOutbound = useCallback(async () => {
    const flightNumber = newTour.outbound_flight_number
    if (!flightNumber) {
      toast.warning('請先輸入航班號碼')
      return
    }

    const flightDate = newTour.departure_date || getTodayString()

    setLoadingOutbound(true)
    try {
      const result = await searchFlightAction(flightNumber, flightDate)
      if (result.error) {
        toast.error(result.error)
        return
      }
      if (result.data) {
        const flightText = `${result.data.airline} ${result.data.flightNumber} ${result.data.departure.time}-${result.data.arrival.time}`
        setNewTour(prev => ({
          ...prev,
          outbound_flight_text: flightText,
          outbound_flight_number: result.data!.flightNumber,
        }))
        toast.success(`已查詢到航班: ${result.data.airline} ${result.data.flightNumber}`)
      }
    } catch {
      toast.error('查詢航班時發生錯誤')
    } finally {
      setLoadingOutbound(false)
    }
  }, [newTour.outbound_flight_number, newTour.departure_date, setNewTour])

  // 查詢回程航班
  const handleSearchReturn = useCallback(async () => {
    const flightNumber = newTour.return_flight_number
    if (!flightNumber) {
      toast.warning('請先輸入航班號碼')
      return
    }

    const flightDate = newTour.return_date || getTodayString()

    setLoadingReturn(true)
    try {
      const result = await searchFlightAction(flightNumber, flightDate)
      if (result.error) {
        toast.error(result.error)
        return
      }
      if (result.data) {
        const flightText = `${result.data.airline} ${result.data.flightNumber} ${result.data.departure.time}-${result.data.arrival.time}`
        setNewTour(prev => ({
          ...prev,
          return_flight_text: flightText,
          return_flight_number: result.data!.flightNumber,
        }))
        toast.success(`已查詢到航班: ${result.data.airline} ${result.data.flightNumber}`)
      }
    } catch {
      toast.error('查詢航班時發生錯誤')
    } finally {
      setLoadingReturn(false)
    }
  }, [newTour.return_flight_number, newTour.return_date, setNewTour])

  // 處理新增目的地
  const handleAddDestination = async () => {
    if (newAirportCode.length !== 3) {
      toast.error('機場代碼必須是 3 個字母')
      return
    }
    setSavingDestination(true)
    try {
      const result = await addDestination(pendingCountry, pendingCity, newAirportCode)
      if (result.success) {
        setNewTour(prev => ({ ...prev, cityCode: newAirportCode }))
        toast.success(`已新增目的地: ${pendingCity} (${newAirportCode})`)
        setShowAirportCodeDialog(false)
        setPendingCity('')
        setPendingCountry('')
        setNewAirportCode('')
      } else {
        toast.error(result.error || '新增失敗')
      }
    } finally {
      setSavingDestination(false)
    }
  }

  // 打開新增目的地對話框
  const openAddDestinationDialog = () => {
    if (!newTour.countryCode) {
      toast.warning('請先選擇國家')
      return
    }
    setPendingCity('')
    setPendingCountry(newTour.countryCode)
    setNewAirportCode('')
    setShowAirportCodeDialog(true)
  }

  return {
    // 目的地系統
    destinations,
    countries,
    destinationsLoading,
    getCitiesByCountry,
    getAirportCode,

    // 航班狀態
    loadingOutbound,
    loadingReturn,

    // 目的地對話框狀態
    showAirportCodeDialog,
    setShowAirportCodeDialog,
    newAirportCode,
    setNewAirportCode,
    pendingCity,
    setPendingCity,
    pendingCountry,
    savingDestination,

    // 處理函數
    handleSearchOutbound,
    handleSearchReturn,
    handleAddDestination,
    openAddDestinationDialog,
  }
}
