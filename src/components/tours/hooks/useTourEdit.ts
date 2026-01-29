'use client'

import { getTodayString } from '@/lib/utils/format-date'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Tour, FlightInfo, Itinerary, DailyItineraryDay } from '@/stores/types'
import type { Json } from '@/lib/supabase/types'
import { useCountries, useCities } from '@/data'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { mutate } from 'swr'
import { searchFlightAction } from '@/features/dashboard/actions/flight-actions'
import { logger } from '@/lib/utils/logger'
import { differenceInDays, addDays, format, parseISO } from 'date-fns'
import { zhTW } from 'date-fns/locale'

// ================================
// Types
// ================================

export interface EditFormData {
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

export interface ItinerarySyncInfo {
  itinerary: Itinerary
  currentDays: number
  newDays: number
  action: 'increase' | 'decrease'
}

interface UseTourEditParams {
  tour: Tour | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: (updatedTour: Tour) => void
}

// ================================
// Constants
// ================================

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

// ================================
// Hook
// ================================

export function useTourEdit(params: UseTourEditParams) {
  const { tour, isOpen, onClose, onSuccess } = params

  const { items: countries } = useCountries()
  const { items: cities } = useCities()

  // Form state
  const [submitting, setSubmitting] = useState(false)
  const [availableCities, setAvailableCities] = useState<Array<{ id: string; code: string; name: string }>>([])
  const initializedRef = useRef(false)
  const [loadingOutbound, setLoadingOutbound] = useState(false)
  const [loadingReturn, setLoadingReturn] = useState(false)

  // Sync dialog state
  const [syncDialogOpen, setSyncDialogOpen] = useState(false)
  const [syncInfo, setSyncInfo] = useState<ItinerarySyncInfo | null>(null)
  const [pendingUpdatedTour, setPendingUpdatedTour] = useState<Tour | null>(null)

  // Helper function to get cities by country
  const getCitiesByCountry = useCallback((countryId: string) => {
    return cities.filter(c => c.country_id === countryId)
  }, [cities])

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

  // Reset initialized state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      initializedRef.current = false
    }
  }, [isOpen])

  // Get active countries
  const activeCountries = useMemo(() => {
    return countries
      .filter(c => c.is_active)
      .map(c => ({ id: c.id, code: c.code || '', name: c.name }))
  }, [countries])

  // Initialize form data (only once when dialog opens)
  useEffect(() => {
    if (!isOpen || !tour || initializedRef.current) return

    // If country data not loaded yet, set basic data first
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

    // Country data loaded, do full initialization
    initializedRef.current = true

    let countryCode = ''
    let cityCode = ''
    let citiesList: Array<{ id: string; code: string; name: string }> = []

    // Find by country_id and main_city_id
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

    // Fallback: match by location text
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

  // Get cities list by country id
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

  // Update flight field
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

  // Search outbound flight
  const handleSearchOutbound = useCallback(async () => {
    const flightNumber = formData.outboundFlight.flightNumber
    if (!flightNumber) {
      toast.error('請先輸入航班號碼')
      return
    }

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

  // Search return flight
  const handleSearchReturn = useCallback(async () => {
    const flightNumber = formData.returnFlight.flightNumber
    if (!flightNumber) {
      toast.error('請先輸入航班號碼')
      return
    }

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

  // Calculate tour days from dates
  const calculateTourDays = useCallback((departureDate: string, returnDate: string): number => {
    if (!departureDate || !returnDate) return 0
    return differenceInDays(parseISO(returnDate), parseISO(departureDate)) + 1
  }, [])

  // Check if itinerary needs sync after tour update
  const checkItinerarySync = useCallback(async (
    tourId: string,
    newDepartureDate: string,
    newReturnDate: string
  ): Promise<ItinerarySyncInfo | null> => {
    // Fetch linked itinerary
    const { data: itinerary, error } = await supabase
      .from('itineraries')
      .select('*')
      .eq('tour_id', tourId)
      .single()

    if (error || !itinerary) {
      // No linked itinerary, no sync needed
      return null
    }

    const newDays = calculateTourDays(newDepartureDate, newReturnDate)
    const dailyItinerary = itinerary.daily_itinerary as unknown as DailyItineraryDay[] | null
    const currentDays = dailyItinerary?.length || 0

    if (newDays === currentDays) {
      // Days match, no sync needed
      return null
    }

    return {
      itinerary: itinerary as unknown as Itinerary,
      currentDays,
      newDays,
      action: newDays > currentDays ? 'increase' : 'decrease',
    }
  }, [calculateTourDays])

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!tour) return
    if (!formData.name.trim() || !formData.departure_date || !formData.return_date) {
      toast.error('請填寫必要欄位')
      return
    }

    setSubmitting(true)
    try {
      // Find selected country and city
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

      // Clean empty flight info (convert to Json for Supabase)
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

      // Reload data
      mutate(`tour-${tour.id}`)
      mutate('tours')

      const updatedTour = data as Tour

      // Check if dates changed and itinerary needs sync
      const datesChanged = tour.departure_date !== formData.departure_date ||
        tour.return_date !== formData.return_date

      if (datesChanged) {
        const syncNeeded = await checkItinerarySync(
          tour.id,
          formData.departure_date,
          formData.return_date
        )

        if (syncNeeded) {
          // Store updated tour and show sync dialog
          setPendingUpdatedTour(updatedTour)
          setSyncInfo(syncNeeded)
          setSyncDialogOpen(true)
          setSubmitting(false)
          return // Don't close yet, wait for sync decision
        }
      }

      // No sync needed, close dialog
      onSuccess?.(updatedTour)
      onClose()
    } catch (error) {
      logger.error('更新旅遊團失敗:', error)
      toast.error('更新失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }, [tour, formData, activeCountries, availableCities, onSuccess, onClose, checkItinerarySync])

  // Generate date label for itinerary day
  const generateDateLabel = useCallback((departureDate: string, dayIndex: number): string => {
    const date = addDays(parseISO(departureDate), dayIndex)
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    const weekday = weekdays[date.getDay()]
    return `${format(date, 'M/d', { locale: zhTW })} (${weekday})`
  }, [])

  // Handle itinerary sync
  const handleSync = useCallback(async (
    action: 'adjust' | 'ignore',
    daysToRemove?: number[]
  ) => {
    if (!syncInfo || !pendingUpdatedTour) {
      closeSyncDialog()
      onSuccess?.(pendingUpdatedTour!)
      onClose()
      return
    }

    if (action === 'ignore') {
      // User chose to ignore, close everything
      closeSyncDialog()
      onSuccess?.(pendingUpdatedTour)
      onClose()
      return
    }

    // action === 'adjust'
    try {
      const itinerary = syncInfo.itinerary
      const dailyItinerary = [...(itinerary.daily_itinerary || [])] as DailyItineraryDay[]

      if (syncInfo.action === 'decrease' && daysToRemove) {
        // Remove selected days (sort descending to avoid index shift issues)
        const sortedIndices = [...daysToRemove].sort((a, b) => b - a)
        for (const idx of sortedIndices) {
          dailyItinerary.splice(idx, 1)
        }

        // Update day labels and dates
        dailyItinerary.forEach((day, idx) => {
          day.dayLabel = `Day ${idx + 1}`
          day.date = generateDateLabel(formData.departure_date, idx)
        })
      } else if (syncInfo.action === 'increase') {
        // Add new days at the end
        const daysToAdd = syncInfo.newDays - syncInfo.currentDays

        // Find the last day's template (usually "返回台灣" pattern)
        const lastDay = dailyItinerary[dailyItinerary.length - 1]

        for (let i = 0; i < daysToAdd; i++) {
          const newDayIndex = dailyItinerary.length
          const newDay: DailyItineraryDay = {
            dayLabel: `Day ${newDayIndex + 1}`,
            date: generateDateLabel(formData.departure_date, newDayIndex),
            title: '自由活動',
            highlight: '',
            description: '',
            activities: [],
            recommendations: [],
            meals: {
              breakfast: '飯店早餐',
              lunch: '敬請自理',
              dinner: '敬請自理',
            },
            accommodation: lastDay?.accommodation || '',
            images: [],
          }
          dailyItinerary.push(newDay)
        }

        // Update all day dates based on new departure date
        dailyItinerary.forEach((day, idx) => {
          day.dayLabel = `Day ${idx + 1}`
          day.date = generateDateLabel(formData.departure_date, idx)
        })
      }

      // Update itinerary in database
      const { error } = await supabase
        .from('itineraries')
        .update({
          daily_itinerary: dailyItinerary as unknown as Json,
          departure_date: formData.departure_date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itinerary.id)

      if (error) {
        logger.error('同步行程表失敗:', error)
        toast.error('同步行程表失敗')
      } else {
        toast.success('行程表已同步更新')
        // Invalidate itinerary cache
        mutate(`itinerary-${itinerary.id}`)
        mutate('itineraries')
      }
    } catch (error) {
      logger.error('同步行程表失敗:', error)
      toast.error('同步行程表失敗')
    }

    closeSyncDialog()
    onSuccess?.(pendingUpdatedTour)
    onClose()
  }, [syncInfo, pendingUpdatedTour, formData.departure_date, generateDateLabel, onSuccess, onClose])

  // Close sync dialog
  const closeSyncDialog = useCallback(() => {
    setSyncDialogOpen(false)
    setSyncInfo(null)
    setPendingUpdatedTour(null)
  }, [])

  return {
    // Form state
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
    // Sync dialog state
    syncDialogOpen,
    syncInfo,
    handleSync,
    closeSyncDialog,
  }
}
