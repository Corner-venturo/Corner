'use client'

import { useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Tour } from '@/stores/types'
import { useRegionsStore } from '@/stores'
import { useTourPageState } from './useTourPageState'
import { useEmployees } from '@/hooks/cloud-hooks'
import { useQuotesListSlim } from '@/hooks/useListSlim'

interface UseToursFormReturn {
  handleOpenCreateDialog: (fromQuoteId?: string) => Promise<void>
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
  const { countries, fetchAll: fetchRegions, getCitiesByCountry } = useRegionsStore()
  const { items: employees, fetchAll: fetchEmployees } = useEmployees()
  const { items: quotes } = useQuotesListSlim()

  const {
    setNewTour,
    setAvailableCities,
    setNewOrder,
    setFormError,
  } = state

  // Lazy load: only load regions and employees when opening create dialog
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

      if (countries.length === 0) {
        await fetchRegions()
      }
      if (employees.length === 0) {
        await fetchEmployees()
      }
      openDialog('create', undefined, fromQuoteId)
    },
    [countries.length, employees.length, fetchRegions, fetchEmployees, openDialog, setNewTour, setAvailableCities]
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

  // Handle edit mode: load tour data when dialog opens in edit mode
  const handleEditDialogEffect = useCallback(() => {
    if (dialog.type !== 'edit' || !dialog.data || countries.length === 0) return

    const tour = dialog.data as Tour
    if (countries.length === 0) {
      fetchRegions()
      return
    }

    // Load country and city data
    const activeCountries = countries
      .filter(c => c.is_active)
      .sort((a, b) => a.display_order - b.display_order)
      .map(c => ({ id: c.id, code: c.code || '', name: c.name }))

    let countryCode = ''
    let cityCode = ''

    // Try to find by IDs first
    if (tour.country_id && tour.main_city_id) {
      const matchedCountry = activeCountries.find(c => c.id === tour.country_id)
      if (matchedCountry) {
        countryCode = matchedCountry.code
        const citiesInCountry = getCitiesByCountry(matchedCountry.id)
          .filter(c => c.is_active)
          .map(c => ({ id: c.id, code: c.airport_code || '', name: c.name, country_id: c.country_id }))
        setAvailableCities(citiesInCountry)
        const matchedCity = citiesInCountry.find(city => city.id === tour.main_city_id)
        if (matchedCity) cityCode = matchedCity.code
      }
    }

    // Fallback to location text matching
    if (!countryCode && tour.location) {
      for (const country of activeCountries) {
        const citiesInCountry = getCitiesByCountry(country.id)
          .filter(c => c.is_active)
          .map(c => ({ id: c.id, code: c.airport_code || '', name: c.name, country_id: c.country_id }))
        const matchedCity = citiesInCountry.find(city => city.name === tour.location)
        if (matchedCity) {
          countryCode = country.code
          cityCode = matchedCity.code
          setAvailableCities(citiesInCountry)
          break
        }
      }
    }

    if (!countryCode) {
      countryCode = '__custom__'
      cityCode = '__custom__'
    }

    // Extract flight info
    const outboundFlight = tour.outbound_flight as { airline?: string; flightNumber?: string; departureTime?: string; arrivalTime?: string } | null
    const returnFlight = tour.return_flight as { airline?: string; flightNumber?: string; departureTime?: string; arrivalTime?: string } | null

    setNewTour({
      name: tour.name,
      countryCode,
      cityCode,
      customLocation: countryCode === '__custom__' ? (tour.location || undefined) : undefined,
      customCountry: countryCode === '__custom__' ? undefined : undefined,
      customCityCode: countryCode === '__custom__' ? (tour.code?.substring(0, 3) || undefined) : undefined,
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
  }, [dialog.type, dialog.data, countries, fetchRegions, getCitiesByCountry, setAvailableCities, setNewTour])

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
    resetForm,
    handleEditDialogEffect,
    handleNavigationEffect,
  }
}
