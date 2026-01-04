'use client'

import { useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Tour } from '@/stores/types'
import { useTourPageState } from './useTourPageState'
import { useEmployees } from '@/hooks/cloud-hooks'
import { useQuotesListSlim } from '@/hooks/useListSlim'
import { useTourDestinations } from './useTourDestinations'

interface UseToursFormReturn {
  handleOpenCreateDialog: (fromQuoteId?: string) => Promise<void>
  handleOpenEditDialog: (tour: Tour) => Promise<void>
  resetForm: () => void
  handleEditDialogEffect: () => void
  handleNavigationEffect: () => void
}

interface UseToursFormParams {
  state: ReturnType<typeof useTourPageState>
  openDialog: (type: string, data?: unknown, meta?: unknown) => void
  dialog: { type: string | null; data: unknown }
}

export function useToursForm({ state, openDialog, dialog }: UseToursFormParams): UseToursFormReturn {
  const searchParams = useSearchParams()
  const { items: employees, fetchAll: fetchEmployees } = useEmployees()
  const { items: quotes } = useQuotesListSlim()
  const { destinations, loading: destinationsLoading } = useTourDestinations()

  const {
    setNewTour,
    setAvailableCities,
    setNewOrder,
    setFormError,
  } = state

  // Lazy load: only load employees when opening create dialog
  const handleOpenCreateDialog = useCallback(
    async (fromQuoteId?: string) => {
      setNewTour({
        name: '',
        countryCode: '',
        cityCode: '',
        departure_date: '',
        return_date: '',
        price: 0,
        status: '提案',
        isSpecial: false,
        max_participants: 20,
        description: '',
      })
      setAvailableCities([])

      if (employees.length === 0) {
        await fetchEmployees()
      }
      openDialog('create', undefined, fromQuoteId)
    },
    [employees.length, fetchEmployees, openDialog, setNewTour, setAvailableCities]
  )

  const resetForm = useCallback(() => {
    setNewTour({
      name: '',
      countryCode: '',
      cityCode: '',
      departure_date: '',
      return_date: '',
      price: 0,
      status: '提案',
      isSpecial: false,
      max_participants: 20,
      description: '',
    })
    setAvailableCities([])
    setNewOrder({
      contact_person: '',
      sales_person: '',
      assistant: '',
      member_count: 1,
      total_amount: 0,
    })
    setFormError(null)
  }, [setNewTour, setAvailableCities, setNewOrder, setFormError])

  // 打開編輯對話框
  const handleOpenEditDialog = useCallback(
    async (tour: Tour) => {
      if (employees.length === 0) {
        await fetchEmployees()
      }
      // 打開對話框，handleEditDialogEffect 會處理資料填入
      openDialog('edit', tour)
    },
    [employees.length, fetchEmployees, openDialog]
  )

  // Handle edit mode: load tour data when dialog opens in edit mode
  const handleEditDialogEffect = useCallback(() => {
    if (dialog.type !== 'edit' || !dialog.data || destinationsLoading) return

    const tour = dialog.data as Tour

    let countryCode = ''
    let cityCode = ''

    // 用 location（城市名稱）在 tour_destinations 中查找
    if (tour.location) {
      const matchedDest = destinations.find(d => d.city === tour.location)
      if (matchedDest) {
        countryCode = matchedDest.country
        cityCode = matchedDest.airport_code
      }
    }

    // 如果找不到，嘗試從團號提取城市代碼
    if (!countryCode && tour.code) {
      const codePrefix = tour.code.substring(0, 3)
      const matchedDest = destinations.find(d => d.airport_code === codePrefix)
      if (matchedDest) {
        countryCode = matchedDest.country
        cityCode = matchedDest.airport_code
      }
    }

    // Extract flight info
    const outboundFlight = tour.outbound_flight as { airline?: string; flightNumber?: string; departureTime?: string; arrivalTime?: string } | null
    const returnFlight = tour.return_flight as { airline?: string; flightNumber?: string; departureTime?: string; arrivalTime?: string } | null

    setNewTour({
      name: tour.name,
      countryCode,
      cityCode,
      cityName: tour.location || '',
      departure_date: tour.departure_date || '',
      return_date: tour.return_date || '',
      price: tour.price ?? 0,
      status: (tour.status || '提案'),
      isSpecial: tour.status === '特殊團',
      max_participants: tour.max_participants || 20,
      description: tour.description || '',
      outbound_flight_number: outboundFlight?.flightNumber || '',
      outbound_flight_text: outboundFlight
        ? `${outboundFlight.airline || ''} ${outboundFlight.flightNumber || ''} ${outboundFlight.departureTime || ''}-${outboundFlight.arrivalTime || ''}`.trim()
        : '',
      return_flight_number: returnFlight?.flightNumber || '',
      return_flight_text: returnFlight
        ? `${returnFlight.airline || ''} ${returnFlight.flightNumber || ''} ${returnFlight.departureTime || ''}-${returnFlight.arrivalTime || ''}`.trim()
        : '',
      enable_checkin: tour.enable_checkin || false,
    })
  }, [dialog.type, dialog.data, destinations, destinationsLoading, setNewTour])

  // Handle navigation from quote
  const handleNavigationEffect = useCallback(() => {
    const fromQuoteId = searchParams.get('fromQuote')
    const departure_date = searchParams.get('departure_date')
    const shouldOpenDialog = searchParams.get('openDialog')

    if (fromQuoteId) {
      const sourceQuote = quotes.find(quote => quote.id === fromQuoteId)
      if (sourceQuote) {
        setNewTour(prev => ({
          ...prev,
          name: sourceQuote.name || prev.name,
          price: Math.round((sourceQuote.total_cost ?? 0) / (sourceQuote.group_size ?? 1)),
        }))
        handleOpenCreateDialog(fromQuoteId)
      }
    }

    if (departure_date && shouldOpenDialog === 'true') {
      setNewTour(prev => ({
        ...prev,
        departure_date: departure_date,
      }))
      handleOpenCreateDialog()
    }
  }, [searchParams, quotes, handleOpenCreateDialog, setNewTour])

  return {
    handleOpenCreateDialog,
    handleOpenEditDialog,
    resetForm,
    handleEditDialogEffect,
    handleNavigationEffect,
  }
}
