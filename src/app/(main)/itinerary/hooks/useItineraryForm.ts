'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { alertError } from '@/lib/ui/alert-dialog'
import type { Itinerary } from '@/stores/types'

interface FlightInfo {
  flightNumber: string
  airline: string
  departureAirport: string
  arrivalAirport: string
  departureTime: string
  arrivalTime: string
  departureDate: string
}

interface DailyData {
  title: string
  breakfast: string
  lunch: string
  dinner: string
  accommodation: string
}

interface UseItineraryFormProps {
  createItinerary: (data: Omit<Itinerary, 'id' | 'created_at' | 'updated_at'>) => Promise<Itinerary>
  userId?: string
}

/**
 * Hook for managing itinerary form state and logic
 * Includes: form fields, flight info, daily data, and creation logic
 */
export function useItineraryForm({ createItinerary, userId }: UseItineraryFormProps) {
  const router = useRouter()

  // Basic form fields
  const [newItineraryTitle, setNewItineraryTitle] = useState('')
  const [newItineraryTourCode, setNewItineraryTourCode] = useState('')
  const [newItineraryCountry, setNewItineraryCountry] = useState('')
  const [newItineraryCity, setNewItineraryCity] = useState('')
  const [newItineraryDepartureDate, setNewItineraryDepartureDate] = useState('')
  const [newItineraryDays, setNewItineraryDays] = useState('')

  // Flight info
  const [newItineraryOutboundFlight, setNewItineraryOutboundFlight] = useState<FlightInfo | null>(null)
  const [newItineraryReturnFlight, setNewItineraryReturnFlight] = useState<FlightInfo | null>(null)

  // Daily data
  const [newItineraryDailyData, setNewItineraryDailyData] = useState<DailyData[]>([])

  // Loading states
  const [isCreatingItinerary, setIsCreatingItinerary] = useState(false)

  // Auto-fill outbound flight date when departure date changes
  useEffect(() => {
    if (newItineraryDepartureDate) {
      const date = new Date(newItineraryDepartureDate)
      const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
      setNewItineraryOutboundFlight(prev => ({
        flightNumber: prev?.flightNumber || '',
        airline: prev?.airline || '',
        departureAirport: prev?.departureAirport || 'TPE',
        arrivalAirport: prev?.arrivalAirport || '',
        departureTime: prev?.departureTime || '',
        arrivalTime: prev?.arrivalTime || '',
        departureDate: dateStr,
      }))
    }
  }, [newItineraryDepartureDate])

  // Auto-fill return flight date when days change
  useEffect(() => {
    if (newItineraryDepartureDate && newItineraryDays) {
      const returnDate = new Date(newItineraryDepartureDate)
      returnDate.setDate(returnDate.getDate() + parseInt(newItineraryDays) - 1)
      const dateStr = `${String(returnDate.getMonth() + 1).padStart(2, '0')}/${String(returnDate.getDate()).padStart(2, '0')}`
      setNewItineraryReturnFlight(prev => ({
        flightNumber: prev?.flightNumber || '',
        airline: prev?.airline || '',
        departureAirport: prev?.departureAirport || '',
        arrivalAirport: prev?.arrivalAirport || 'TPE',
        departureTime: prev?.departureTime || '',
        arrivalTime: prev?.arrivalTime || '',
        departureDate: dateStr,
      }))
    }
  }, [newItineraryDepartureDate, newItineraryDays])

  // Initialize daily data when days change
  useEffect(() => {
    if (newItineraryDays) {
      const days = parseInt(newItineraryDays)
      const initialData = Array.from({ length: days }, (_, i) => {
        const dayNum = i + 1
        const isFirst = dayNum === 1
        const isLast = dayNum === days
        return {
          title: isFirst ? '抵達目的地' : isLast ? '返回台灣' : '',
          breakfast: isFirst ? '溫暖的家' : '飯店內早餐',
          lunch: '敬請自理',
          dinner: '敬請自理',
          accommodation: isLast ? '' : '待確認',
        }
      })
      setNewItineraryDailyData(initialData)
    } else {
      setNewItineraryDailyData([])
    }
  }, [newItineraryDays])

  // Reset form
  const resetForm = useCallback(() => {
    setNewItineraryTitle('')
    setNewItineraryTourCode('')
    setNewItineraryCountry('')
    setNewItineraryCity('')
    setNewItineraryDepartureDate('')
    setNewItineraryDays('')
    setNewItineraryOutboundFlight(null)
    setNewItineraryReturnFlight(null)
    setNewItineraryDailyData([])
  }, [])

  // Create itinerary
  const handleCreateItinerary = useCallback(async () => {
    if (!newItineraryTitle.trim()) {
      await alertError('請填寫行程名稱')
      return
    }
    if (!newItineraryDepartureDate || !newItineraryDays) {
      await alertError('請填寫出發日期和行程天數')
      return
    }

    const days = parseInt(newItineraryDays)

    // Calculate return date
    const returnDate = new Date(newItineraryDepartureDate)
    returnDate.setDate(returnDate.getDate() + days - 1)

    setIsCreatingItinerary(true)
    try {
      // Generate daily itinerary
      const dailyItinerary = []
      for (let i = 1; i <= days; i++) {
        const date = new Date(newItineraryDepartureDate)
        date.setDate(date.getDate() + i - 1)
        const dateStr = date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
        const weekday = date.toLocaleDateString('zh-TW', { weekday: 'short' })

        const dayData = newItineraryDailyData[i - 1]

        dailyItinerary.push({
          dayLabel: `Day ${i}`,
          date: `${dateStr} (${weekday})`,
          title: dayData?.title || (i === 1 ? '抵達目的地' : i === days ? '返回台灣' : ''),
          highlight: '',
          description: '',
          images: [],
          activities: [],
          recommendations: [],
          meals: {
            breakfast: dayData?.breakfast || (i === 1 ? '溫暖的家' : '飯店內早餐'),
            lunch: dayData?.lunch || '敬請自理',
            dinner: dayData?.dinner || '敬請自理',
          },
          accommodation: dayData?.accommodation || (i === days ? '' : '待確認'),
        })
      }

      // Format date for display
      const formatDateForDisplay = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/')
      }

      const newItinerary = {
        tagline: 'Corner Travel 2025',
        title: newItineraryTitle.trim(),
        subtitle: '',
        description: '',
        departure_date: formatDateForDisplay(newItineraryDepartureDate),
        tour_code: newItineraryTourCode.trim() || '',
        cover_image: '',
        country: newItineraryCountry,
        city: '', // 城市欄位已移除，不再從表單取值
        status: '提案' as const,
        outbound_flight: newItineraryOutboundFlight ? {
          airline: newItineraryOutboundFlight.airline,
          flightNumber: newItineraryOutboundFlight.flightNumber,
          departureAirport: newItineraryOutboundFlight.departureAirport,
          departureTime: newItineraryOutboundFlight.departureTime,
          departureDate: newItineraryOutboundFlight.departureDate,
          arrivalAirport: newItineraryOutboundFlight.arrivalAirport,
          arrivalTime: newItineraryOutboundFlight.arrivalTime,
          duration: '',
        } : {
          airline: '',
          flightNumber: '',
          departureAirport: 'TPE',
          departureTime: '',
          departureDate: new Date(newItineraryDepartureDate).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }).replace(/\//g, '/'),
          arrivalAirport: '',
          arrivalTime: '',
          duration: '',
        },
        return_flight: newItineraryReturnFlight ? {
          airline: newItineraryReturnFlight.airline,
          flightNumber: newItineraryReturnFlight.flightNumber,
          departureAirport: newItineraryReturnFlight.departureAirport,
          departureTime: newItineraryReturnFlight.departureTime,
          departureDate: newItineraryReturnFlight.departureDate,
          arrivalAirport: newItineraryReturnFlight.arrivalAirport,
          arrivalTime: newItineraryReturnFlight.arrivalTime,
          duration: '',
        } : {
          airline: '',
          flightNumber: '',
          departureAirport: '',
          departureTime: '',
          departureDate: returnDate.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }).replace(/\//g, '/'),
          arrivalAirport: 'TPE',
          arrivalTime: '',
          duration: '',
        },
        features: [],
        focus_cards: [],
        leader: { name: '', domesticPhone: '', overseasPhone: '' },
        meeting_info: { time: '', location: '' },
        itinerary_subtitle: `${days}天${days - 1}夜精彩旅程規劃`,
        daily_itinerary: dailyItinerary,
        created_by: userId,
      }

      const createdItinerary = await createItinerary(newItinerary as Omit<Itinerary, 'id' | 'created_at' | 'updated_at'>)

      if (createdItinerary?.id) {
        resetForm()
        router.push(`/itinerary/new?itinerary_id=${createdItinerary.id}`)
        return true
      } else {
        await alertError('建立失敗，請稍後再試')
        return false
      }
    } catch (error) {
      console.error('建立行程失敗:', error)
      await alertError('建立失敗，請稍後再試')
      return false
    } finally {
      setIsCreatingItinerary(false)
    }
  }, [
    newItineraryTitle,
    newItineraryTourCode,
    newItineraryCountry,
    newItineraryCity,
    newItineraryDepartureDate,
    newItineraryDays,
    newItineraryOutboundFlight,
    newItineraryReturnFlight,
    newItineraryDailyData,
    createItinerary,
    userId,
    router,
    resetForm,
  ])

  return {
    // Form fields
    newItineraryTitle,
    setNewItineraryTitle,
    newItineraryTourCode,
    setNewItineraryTourCode,
    newItineraryCountry,
    setNewItineraryCountry,
    newItineraryCity,
    setNewItineraryCity,
    newItineraryDepartureDate,
    setNewItineraryDepartureDate,
    newItineraryDays,
    setNewItineraryDays,

    // Flight info
    newItineraryOutboundFlight,
    setNewItineraryOutboundFlight,
    newItineraryReturnFlight,
    setNewItineraryReturnFlight,

    // Daily data
    newItineraryDailyData,
    setNewItineraryDailyData,

    // Loading states
    isCreatingItinerary,

    // Actions
    resetForm,
    handleCreateItinerary,
  }
}
