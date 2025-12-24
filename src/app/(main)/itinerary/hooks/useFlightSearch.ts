'use client'

import { useState, useCallback } from 'react'
import { searchFlightAction } from '@/features/dashboard/actions/flight-actions'
import { alertError } from '@/lib/ui/alert-dialog'

interface FlightInfo {
  flightNumber: string
  airline: string
  departureAirport: string
  arrivalAirport: string
  departureTime: string
  arrivalTime: string
  departureDate: string
}

interface UseFlightSearchProps {
  outboundFlight: FlightInfo | null
  setOutboundFlight: (flight: FlightInfo | null) => void
  returnFlight: FlightInfo | null
  setReturnFlight: (flight: FlightInfo | null) => void
  departureDate: string
  days: string
}

/**
 * Hook for managing flight search logic
 * Includes: outbound and return flight search
 */
export function useFlightSearch({
  outboundFlight,
  setOutboundFlight,
  returnFlight,
  setReturnFlight,
  departureDate,
  days,
}: UseFlightSearchProps) {
  const [loadingOutboundFlight, setLoadingOutboundFlight] = useState(false)
  const [loadingReturnFlight, setLoadingReturnFlight] = useState(false)

  // Search outbound flight
  const handleSearchOutboundFlight = useCallback(async () => {
    const flightNumber = outboundFlight?.flightNumber
    if (!flightNumber) {
      await alertError('請先輸入航班號碼')
      return
    }

    setLoadingOutboundFlight(true)
    try {
      const result = await searchFlightAction(flightNumber, departureDate || new Date().toISOString().split('T')[0])
      if (result.error) {
        await alertError(result.error)
        return
      }
      if (result.data) {
        const flightData = result.data
        setOutboundFlight({
          flightNumber: flightNumber,
          airline: flightData.airline,
          departureAirport: flightData.departure.iata,
          arrivalAirport: flightData.arrival.iata,
          departureTime: flightData.departure.time,
          arrivalTime: flightData.arrival.time,
          departureDate: outboundFlight?.departureDate || '',
        })
      }
    } catch {
      await alertError('查詢航班時發生錯誤')
    } finally {
      setLoadingOutboundFlight(false)
    }
  }, [outboundFlight?.flightNumber, outboundFlight?.departureDate, departureDate, setOutboundFlight])

  // Search return flight
  const handleSearchReturnFlight = useCallback(async () => {
    const flightNumber = returnFlight?.flightNumber
    if (!flightNumber) {
      await alertError('請先輸入航班號碼')
      return
    }

    // Calculate return date
    let returnDateStr = new Date().toISOString().split('T')[0]
    if (departureDate && days) {
      const returnDate = new Date(departureDate)
      returnDate.setDate(returnDate.getDate() + parseInt(days) - 1)
      returnDateStr = returnDate.toISOString().split('T')[0]
    }

    setLoadingReturnFlight(true)
    try {
      const result = await searchFlightAction(flightNumber, returnDateStr)
      if (result.error) {
        await alertError(result.error)
        return
      }
      if (result.data) {
        const flightData = result.data
        setReturnFlight({
          flightNumber: flightNumber,
          airline: flightData.airline,
          departureAirport: flightData.departure.iata,
          arrivalAirport: flightData.arrival.iata,
          departureTime: flightData.departure.time,
          arrivalTime: flightData.arrival.time,
          departureDate: returnFlight?.departureDate || '',
        })
      }
    } catch {
      await alertError('查詢航班時發生錯誤')
    } finally {
      setLoadingReturnFlight(false)
    }
  }, [returnFlight?.flightNumber, returnFlight?.departureDate, departureDate, days, setReturnFlight])

  return {
    loadingOutboundFlight,
    loadingReturnFlight,
    handleSearchOutboundFlight,
    handleSearchReturnFlight,
  }
}
