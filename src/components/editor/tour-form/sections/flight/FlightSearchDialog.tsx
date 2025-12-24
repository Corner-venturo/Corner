'use client'

import React, { useState, useCallback } from 'react'
import { TourFormData } from '../../types'
import { searchFlightAction } from '@/features/dashboard/actions/flight-actions'
import { alert } from '@/lib/ui/alert-dialog'
import { parseDate } from './utils'

interface FlightSearchDialogProps {
  data: TourFormData
  updateFlightField: (
    flightType: 'outboundFlight' | 'returnFlight',
    field: string,
    value: string | boolean
  ) => void
  updateFlightFields?: (
    flightType: 'outboundFlight' | 'returnFlight',
    fields: Record<string, string>
  ) => void
}

export function useFlightSearch({
  data,
  updateFlightField,
  updateFlightFields,
}: FlightSearchDialogProps) {
  const [loadingOutbound, setLoadingOutbound] = useState(false)
  const [loadingReturn, setLoadingReturn] = useState(false)

  // 查詢去程航班
  const handleSearchOutbound = useCallback(async () => {
    const flightNumber = data.outboundFlight?.flightNumber
    const dateStr = data.outboundFlight?.departureDate // 格式 MM/DD

    if (!flightNumber) {
      void alert('請先輸入航班號碼', 'warning')
      return
    }

    // 組合完整日期 YYYY-MM-DD
    let fullDate = ''
    if (dateStr && data.departureDate) {
      const depDate = parseDate(data.departureDate)
      if (depDate) {
        const [month, day] = dateStr.split('/').map(Number)
        const year = depDate.getFullYear()
        fullDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      }
    }

    if (!fullDate) {
      // 使用今天日期
      fullDate = new Date().toISOString().split('T')[0]
    }

    setLoadingOutbound(true)
    try {
      const result = await searchFlightAction(flightNumber, fullDate)
      if (result.error) {
        void alert(result.error, 'error')
        return
      }
      if (result.data) {
        // 使用批次更新（一次更新所有欄位）
        const fields: Record<string, string> = {
          airline: result.data.airline,
          departureAirport: result.data.departure.iata,
          arrivalAirport: result.data.arrival.iata,
          departureTime: result.data.departure.time,
          arrivalTime: result.data.arrival.time,
        }
        if (result.data.duration) {
          fields.duration = result.data.duration
        }

        if (updateFlightFields) {
          updateFlightFields('outboundFlight', fields)
        } else {
          // fallback: 逐一更新
          Object.entries(fields).forEach(([key, value]) => {
            updateFlightField('outboundFlight', key, value)
          })
        }
      }
    } catch {
      void alert('查詢航班時發生錯誤', 'error')
    } finally {
      setLoadingOutbound(false)
    }
  }, [data.outboundFlight?.flightNumber, data.outboundFlight?.departureDate, data.departureDate, updateFlightField, updateFlightFields])

  // 查詢回程航班
  const handleSearchReturn = useCallback(async () => {
    const flightNumber = data.returnFlight?.flightNumber
    const dateStr = data.returnFlight?.departureDate // 格式 MM/DD

    if (!flightNumber) {
      void alert('請先輸入航班號碼', 'warning')
      return
    }

    // 組合完整日期 YYYY-MM-DD
    let fullDate = ''
    if (dateStr && data.departureDate) {
      const depDate = parseDate(data.departureDate)
      if (depDate) {
        const [month, day] = dateStr.split('/').map(Number)
        let year = depDate.getFullYear()
        // 如果回程月份小於出發月份，表示跨年
        if (month < depDate.getMonth() + 1) {
          year += 1
        }
        fullDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      }
    }

    if (!fullDate) {
      fullDate = new Date().toISOString().split('T')[0]
    }

    setLoadingReturn(true)
    try {
      const result = await searchFlightAction(flightNumber, fullDate)
      if (result.error) {
        void alert(result.error, 'error')
        return
      }
      if (result.data) {
        // 使用批次更新（一次更新所有欄位）
        const fields: Record<string, string> = {
          airline: result.data.airline,
          departureAirport: result.data.departure.iata,
          arrivalAirport: result.data.arrival.iata,
          departureTime: result.data.departure.time,
          arrivalTime: result.data.arrival.time,
        }
        if (result.data.duration) {
          fields.duration = result.data.duration
        }

        if (updateFlightFields) {
          updateFlightFields('returnFlight', fields)
        } else {
          // fallback: 逐一更新
          Object.entries(fields).forEach(([key, value]) => {
            updateFlightField('returnFlight', key, value)
          })
        }
      }
    } catch {
      void alert('查詢航班時發生錯誤', 'error')
    } finally {
      setLoadingReturn(false)
    }
  }, [data.returnFlight?.flightNumber, data.returnFlight?.departureDate, data.departureDate, updateFlightField, updateFlightFields])

  return {
    loadingOutbound,
    loadingReturn,
    handleSearchOutbound,
    handleSearchReturn,
  }
}
