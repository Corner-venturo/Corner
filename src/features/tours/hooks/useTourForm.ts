'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useItineraryStore, useQuoteStore } from '@/stores'
import { useTourDestinations } from './useTourDestinations'
import { searchFlightAction } from '@/features/dashboard/actions/flight-actions'
import { toast } from 'sonner'
import type { NewTourData } from '../types'
import type { OrderFormData } from '@/components/orders/add-order-form'

interface UseTourFormProps {
  isOpen: boolean
  mode: 'create' | 'edit'
  newTour: NewTourData
  setNewTour: React.Dispatch<React.SetStateAction<NewTourData>>
  selectedItineraryId?: string | null
  setSelectedItineraryId?: (id: string | null) => void
  selectedQuoteId?: string | null
  setSelectedQuoteId?: (id: string | null) => void
}

export function useTourForm({
  isOpen,
  mode,
  newTour,
  setNewTour,
  selectedItineraryId,
  setSelectedItineraryId,
  selectedQuoteId,
  setSelectedQuoteId,
}: UseTourFormProps) {
  // 載入行程表和報價單資料
  const { items: itineraries, fetchAll: fetchItineraries } = useItineraryStore()
  const { items: quotes, fetchAll: fetchQuotes } = useQuoteStore()

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
  const [cityInput, setCityInput] = useState('')
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

    const flightDate = newTour.departure_date || new Date().toISOString().split('T')[0]

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

    const flightDate = newTour.return_date || new Date().toISOString().split('T')[0]

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

  // 打開對話框時載入資料
  useEffect(() => {
    if (isOpen && mode === 'create') {
      fetchItineraries()
      fetchQuotes()
    }
  }, [isOpen, mode, fetchItineraries, fetchQuotes])

  // 過濾可用的行程表（未關聯旅遊團的）
  const availableItineraries = useMemo(() => {
    return itineraries
      .filter(i => !i.tour_id && !(i as { _deleted?: boolean })._deleted)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
  }, [itineraries])

  // 過濾可用的報價單（未關聯旅遊團的）
  const availableQuotes = useMemo(() => {
    return quotes
      .filter(q => !q.tour_id && !(q as { _deleted?: boolean })._deleted)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
  }, [quotes])

  // 處理選擇行程表
  const handleItinerarySelect = (itineraryId: string) => {
    if (!itineraryId) {
      setSelectedItineraryId?.(null)
      return
    }

    const itinerary = itineraries.find(i => i.id === itineraryId)
    if (itinerary) {
      setSelectedItineraryId?.(itineraryId)
      setSelectedQuoteId?.(null)
      setNewTour(prev => ({
        ...prev,
        name: itinerary.title || prev.name,
        departure_date: itinerary.departure_date
          ? itinerary.departure_date.replace(/\//g, '-')
          : prev.departure_date,
      }))
    }
  }

  // 處理選擇報價單
  const handleQuoteSelect = (quoteId: string) => {
    if (!quoteId) {
      setSelectedQuoteId?.(null)
      return
    }

    const quote = quotes.find(q => q.id === quoteId)
    if (quote) {
      setSelectedQuoteId?.(quoteId)
      setSelectedItineraryId?.(null)
      setNewTour(prev => ({
        ...prev,
        name: quote.name || prev.name,
        price: Math.round((quote.total_cost ?? 0) / (quote.group_size ?? 1)),
        max_participants: quote.group_size || prev.max_participants,
      }))
    }
  }

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
    // 資料
    itineraries,
    quotes,
    availableItineraries,
    availableQuotes,

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
    handleItinerarySelect,
    handleQuoteSelect,
    handleAddDestination,
    openAddDestinationDialog,
  }
}
