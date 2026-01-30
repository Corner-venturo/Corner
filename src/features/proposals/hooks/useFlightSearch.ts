/**
 * 航班搜索 Hook
 * 處理去程和回程航班的搜索、選擇邏輯
 */

import { useState, useCallback } from 'react'
import { searchFlightAction } from '@/features/dashboard/actions/flight-actions'
import type { FlightInfo } from '@/types/flight.types'

interface FlightSearchState {
  // 去程
  outboundFlightNumber: string
  outboundFlightDate: string
  searchingOutbound: boolean
  outboundSegments: FlightInfo[]
  // 回程
  returnFlightNumber: string
  returnFlightDate: string
  searchingReturn: boolean
  returnSegments: FlightInfo[]
  // 錯誤
  errors: { outbound?: string; return?: string }
}

interface UseFlightSearchOptions {
  initialOutboundDate?: string
  initialReturnDate?: string
  onOutboundFound: (flight: FlightInfo) => void
  onReturnFound: (flight: FlightInfo) => void
}

// 將 FlightData 轉換為 FlightInfo
const flightDataToInfo = (data: {
  flightNumber: string
  airline: string
  departure: { iata: string; time: string }
  arrival: { iata: string; time: string }
}): FlightInfo => ({
  flightNumber: data.flightNumber,
  airline: data.airline,
  departureAirport: data.departure.iata,
  arrivalAirport: data.arrival.iata,
  departureTime: data.departure.time,
  arrivalTime: data.arrival.time,
})

export function useFlightSearch({
  initialOutboundDate = '',
  initialReturnDate = '',
  onOutboundFound,
  onReturnFound,
}: UseFlightSearchOptions) {
  const [state, setState] = useState<FlightSearchState>({
    outboundFlightNumber: '',
    outboundFlightDate: initialOutboundDate,
    searchingOutbound: false,
    outboundSegments: [],
    returnFlightNumber: '',
    returnFlightDate: initialReturnDate,
    searchingReturn: false,
    returnSegments: [],
    errors: {},
  })

  // 更新單一欄位
  const updateField = useCallback(<K extends keyof FlightSearchState>(
    field: K,
    value: FlightSearchState[K]
  ) => {
    setState(prev => ({ ...prev, [field]: value }))
  }, [])

  // 設定去程航班號碼
  const setOutboundFlightNumber = useCallback((value: string) => {
    updateField('outboundFlightNumber', value)
  }, [updateField])

  // 設定去程日期
  const setOutboundFlightDate = useCallback((value: string) => {
    updateField('outboundFlightDate', value)
  }, [updateField])

  // 設定回程航班號碼
  const setReturnFlightNumber = useCallback((value: string) => {
    updateField('returnFlightNumber', value)
  }, [updateField])

  // 設定回程日期
  const setReturnFlightDate = useCallback((value: string) => {
    updateField('returnFlightDate', value)
  }, [updateField])

  // 查詢去程航班
  const searchOutbound = useCallback(async () => {
    if (!state.outboundFlightNumber.trim() || !state.outboundFlightDate) {
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, outbound: '請輸入航班號碼和日期' },
      }))
      return
    }

    setState(prev => ({
      ...prev,
      searchingOutbound: true,
      errors: { ...prev.errors, outbound: undefined },
      outboundSegments: [],
    }))

    try {
      const result = await searchFlightAction(
        state.outboundFlightNumber.trim(),
        state.outboundFlightDate
      )

      if (result.error) {
        setState(prev => ({
          ...prev,
          errors: { ...prev.errors, outbound: result.error },
        }))
      } else if (result.segments && result.segments.length > 1) {
        // 多航段：顯示選擇器
        setState(prev => ({
          ...prev,
          outboundSegments: result.segments!.map(flightDataToInfo),
        }))
      } else if (result.data) {
        // 單一航段：直接設定
        onOutboundFound(flightDataToInfo(result.data))
        setState(prev => ({
          ...prev,
          outboundFlightNumber: '',
          errors: result.warning
            ? { ...prev.errors, outbound: result.warning }
            : prev.errors,
        }))
      }
    } finally {
      setState(prev => ({ ...prev, searchingOutbound: false }))
    }
  }, [state.outboundFlightNumber, state.outboundFlightDate, onOutboundFound])

  // 選擇去程航段
  const selectOutboundSegment = useCallback((segment: FlightInfo) => {
    onOutboundFound(segment)
    setState(prev => ({
      ...prev,
      outboundSegments: [],
      outboundFlightNumber: '',
    }))
  }, [onOutboundFound])

  // 查詢回程航班
  const searchReturn = useCallback(async () => {
    if (!state.returnFlightNumber.trim() || !state.returnFlightDate) {
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, return: '請輸入航班號碼和日期' },
      }))
      return
    }

    setState(prev => ({
      ...prev,
      searchingReturn: true,
      errors: { ...prev.errors, return: undefined },
      returnSegments: [],
    }))

    try {
      const result = await searchFlightAction(
        state.returnFlightNumber.trim(),
        state.returnFlightDate
      )

      if (result.error) {
        setState(prev => ({
          ...prev,
          errors: { ...prev.errors, return: result.error },
        }))
      } else if (result.segments && result.segments.length > 1) {
        // 多航段：顯示選擇器
        setState(prev => ({
          ...prev,
          returnSegments: result.segments!.map(flightDataToInfo),
        }))
      } else if (result.data) {
        // 單一航段：直接設定
        onReturnFound(flightDataToInfo(result.data))
        setState(prev => ({
          ...prev,
          returnFlightNumber: '',
          errors: result.warning
            ? { ...prev.errors, return: result.warning }
            : prev.errors,
        }))
      }
    } finally {
      setState(prev => ({ ...prev, searchingReturn: false }))
    }
  }, [state.returnFlightNumber, state.returnFlightDate, onReturnFound])

  // 選擇回程航段
  const selectReturnSegment = useCallback((segment: FlightInfo) => {
    onReturnFound(segment)
    setState(prev => ({
      ...prev,
      returnSegments: [],
      returnFlightNumber: '',
    }))
  }, [onReturnFound])

  // 清除錯誤
  const clearError = useCallback((type: 'outbound' | 'return') => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [type]: undefined },
    }))
  }, [])

  // 重置狀態
  const reset = useCallback((outboundDate?: string, returnDate?: string) => {
    setState({
      outboundFlightNumber: '',
      outboundFlightDate: outboundDate || '',
      searchingOutbound: false,
      outboundSegments: [],
      returnFlightNumber: '',
      returnFlightDate: returnDate || '',
      searchingReturn: false,
      returnSegments: [],
      errors: {},
    })
  }, [])

  return {
    // State
    outboundFlightNumber: state.outboundFlightNumber,
    outboundFlightDate: state.outboundFlightDate,
    searchingOutbound: state.searchingOutbound,
    outboundSegments: state.outboundSegments,
    returnFlightNumber: state.returnFlightNumber,
    returnFlightDate: state.returnFlightDate,
    searchingReturn: state.searchingReturn,
    returnSegments: state.returnSegments,
    errors: state.errors,
    // Setters
    setOutboundFlightNumber,
    setOutboundFlightDate,
    setReturnFlightNumber,
    setReturnFlightDate,
    // Actions
    searchOutbound,
    searchReturn,
    selectOutboundSegment,
    selectReturnSegment,
    clearError,
    reset,
  }
}
