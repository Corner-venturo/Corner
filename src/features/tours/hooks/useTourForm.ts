'use client'

import { getTodayString } from '@/lib/utils/format-date'

import { useState, useCallback } from 'react'
import { searchFlightAction } from '@/features/dashboard/actions/flight-actions'
import { toast } from 'sonner'
import type { NewTourData } from '../types'

interface UseTourFormProps {
  newTour: NewTourData
  setNewTour: React.Dispatch<React.SetStateAction<NewTourData>>
}

export function useTourForm({
  newTour,
  setNewTour,
}: UseTourFormProps) {
  // 航班查詢狀態
  const [loadingOutbound, setLoadingOutbound] = useState(false)
  const [loadingReturn, setLoadingReturn] = useState(false)

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
        // 顯示警告（如果資料不完整）
        if (result.warning) {
          toast.warning(result.warning, { duration: 5000 })
        } else {
          toast.success(`已查詢到航班: ${result.data.airline} ${result.data.flightNumber}`)
        }
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
        // 顯示警告（如果資料不完整）
        if (result.warning) {
          toast.warning(result.warning, { duration: 5000 })
        } else {
          toast.success(`已查詢到航班: ${result.data.airline} ${result.data.flightNumber}`)
        }
      }
    } catch {
      toast.error('查詢航班時發生錯誤')
    } finally {
      setLoadingReturn(false)
    }
  }, [newTour.return_flight_number, newTour.return_date, setNewTour])

  return {
    // 航班狀態
    loadingOutbound,
    loadingReturn,

    // 處理函數
    handleSearchOutbound,
    handleSearchReturn,
  }
}
