'use client'

/**
 * TourItineraryTab - 旅遊團簡易行程表分頁
 *
 * 上下分欄設計：
 * - 上半部：團層級資料（標題、天數、航班、住宿按鈕）
 * - 下半部：每日分頁 tab（Day 1 | Day 2 | ...）
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Loader2, FileText, Save, Eye, Edit2, Printer, Plane, Search, Trash2, Check, ArrowRight, Minus, Sparkles, Hotel } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Combobox } from '@/components/ui/combobox'
import type { ComboboxOption } from '@/components/ui/combobox'
import { logger } from '@/lib/utils/logger'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores'
import { useItineraries, createItinerary, updateItinerary } from '@/data'
import { useFlightSearch } from '@/hooks'
import { supabase } from '@/lib/supabase/client'
import { syncItineraryToQuote } from '@/lib/utils/itinerary-quote-sync'
import type { Tour } from '@/stores/types'
import type { FlightInfo } from '@/types/flight.types'
import { COMP_TOURS_LABELS, TOUR_ITINERARY_TAB_LABELS } from '../constants/labels'
import {
  getPreviewDailyData as computePreviewData,
  generatePrintHtml,
} from '@/features/proposals/components/package-itinerary/format-itinerary'

// 每日行程項目
interface DailyScheduleItem {
  day: number
  route: string
  meals: { breakfast: string; lunch: string; dinner: string }
  accommodation: string
  hotelBreakfast?: boolean
  lunchSelf?: boolean
  dinnerSelf?: boolean
  sameAsPrevious?: boolean
}

interface TourItineraryTabProps {
  tour: Tour
}

// ============================================================
// AccommodationDialog
// ============================================================
interface AccommodationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dailySchedule: DailyScheduleItem[]
  onUpdateAccommodation: (index: number, field: string, value: string | boolean) => void
  getPreviousAccommodation: (index: number) => string
}

interface HotelOption {
  id: string
  name: string
}

function AccommodationDialog({
  open,
  onOpenChange,
  dailySchedule,
  onUpdateAccommodation,
  getPreviousAccommodation,
}: AccommodationDialogProps) {
  const nights = dailySchedule.length - 1
  const [hotelOptions, setHotelOptions] = useState<ComboboxOption[]>([])
  const [hotelSearches, setHotelSearches] = useState<Record<number, string>>({})

  // Load hotel options from DB
  useEffect(() => {
    if (!open) return
    const loadHotels = async () => {
      try {
        const { data } = await supabase
          .from('hotels')
          .select('id, name')
          .eq('is_active', true)
          .order('name')
          .limit(200)
        if (data) {
          setHotelOptions(
            (data as HotelOption[]).map(h => ({ value: h.id, label: h.name }))
          )
        }
      } catch (err) {
        logger.error('載入飯店失敗', err)
      }
    }
    loadHotels()
  }, [open])

  // Filter options based on search text for each night
  const getFilteredOptions = useCallback((nightIndex: number): ComboboxOption[] => {
    const search = (hotelSearches[nightIndex] || '').toLowerCase()
    if (!search) return hotelOptions
    return hotelOptions.filter(o => o.label.toLowerCase().includes(search))
  }, [hotelOptions, hotelSearches])

  if (nights <= 0) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hotel className="w-5 h-5 text-morandi-gold" />
            {TOUR_ITINERARY_TAB_LABELS.住宿設定}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {Array.from({ length: nights }, (_, i) => {
            const day = dailySchedule[i]
            if (!day) return null
            const isContinueStay = day.sameAsPrevious
            const prevAccom = getPreviousAccommodation(i)

            return (
              <div key={i} className="space-y-2 border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    {TOUR_ITINERARY_TAB_LABELS.第N晚(i + 1)}
                  </Label>
                  {i > 0 && (
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!isContinueStay}
                        onChange={() => onUpdateAccommodation(i, 'sameAsPrevious', !isContinueStay)}
                        className="rounded border-morandi-secondary"
                      />
                      {TOUR_ITINERARY_TAB_LABELS.續住_同上一晚}
                    </label>
                  )}
                </div>

                {isContinueStay ? (
                  <div className="text-sm text-muted-foreground bg-muted/50 rounded px-3 py-2">
                    {TOUR_ITINERARY_TAB_LABELS.同上} ({prevAccom || '-'})
                  </div>
                ) : (
                  <Combobox
                    value={day.accommodation || ''}
                    onChange={(val) => {
                      // If user picked from list, val is the hotel id — find label
                      const opt = hotelOptions.find(o => o.value === val)
                      onUpdateAccommodation(i, 'accommodation', opt ? opt.label : val)
                    }}
                    options={getFilteredOptions(i)}
                    placeholder={TOUR_ITINERARY_TAB_LABELS.搜尋飯店}
                    showSearchIcon
                    showClearButton
                    disablePortal
                  />
                )}
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// DayScheduleEditor — single day editing UI
// ============================================================
interface DayScheduleEditorProps {
  day: DailyScheduleItem
  index: number
  isFirst: boolean
  isLast: boolean
  dateLabel: string
  onUpdate: (index: number, field: string, value: string | boolean) => void
}

function DayScheduleEditor({ day, index, isFirst, isLast, dateLabel, onUpdate }: DayScheduleEditorProps) {
  return (
    <div className="space-y-3">
      {/* Route / title */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="bg-morandi-gold text-white text-xs font-bold px-2 py-0.5 rounded">
              Day {day.day}
            </span>
            {dateLabel && <span className="text-xs text-muted-foreground">({dateLabel})</span>}
          </div>
          {/* Symbol buttons */}
          <div className="flex items-center gap-0.5">
            <button type="button" onClick={() => onUpdate(index, 'route', (day.route || '') + ' → ')}
              className="p-1 bg-muted/50 hover:bg-morandi-gold/20 rounded transition-colors" title={COMP_TOURS_LABELS.插入箭頭}>
              <ArrowRight size={12} className="text-morandi-secondary" />
            </button>
            <button type="button" onClick={() => onUpdate(index, 'route', (day.route || '') + ' ⇀ ')}
              className="px-1.5 py-0.5 text-[10px] bg-muted/50 hover:bg-morandi-gold/20 rounded transition-colors font-medium text-morandi-secondary" title={COMP_TOURS_LABELS.插入鉤箭頭}>
              ⇀
            </button>
            <button type="button" onClick={() => onUpdate(index, 'route', (day.route || '') + ' · ')}
              className="px-1.5 py-0.5 text-[10px] bg-muted/50 hover:bg-morandi-gold/20 rounded transition-colors font-medium text-morandi-secondary" title={COMP_TOURS_LABELS.插入間隔點}>
              ·
            </button>
            <button type="button" onClick={() => onUpdate(index, 'route', (day.route || '') + ' | ')}
              className="p-1 bg-muted/50 hover:bg-morandi-gold/20 rounded transition-colors" title={COMP_TOURS_LABELS.插入直線}>
              <Minus size={12} className="text-morandi-secondary" />
            </button>
            <button type="button" onClick={() => onUpdate(index, 'route', (day.route || '') + ' ⭐ ')}
              className="p-1 bg-muted/50 hover:bg-morandi-gold/20 rounded transition-colors" title={COMP_TOURS_LABELS.插入星號}>
              <Sparkles size={12} className="text-morandi-gold" />
            </button>
            <button type="button" onClick={() => onUpdate(index, 'route', (day.route || '') + ' ✈ ')}
              className="px-1.5 py-0.5 text-[10px] bg-muted/50 hover:bg-morandi-gold/20 rounded transition-colors text-morandi-secondary" title={COMP_TOURS_LABELS.插入飛機}>
              ✈
            </button>
          </div>
        </div>
        <Input
          value={day.route || ''}
          onChange={e => onUpdate(index, 'route', e.target.value)}
          placeholder={isFirst ? COMP_TOURS_LABELS.抵達目的地 : isLast ? COMP_TOURS_LABELS.返回台灣 : COMP_TOURS_LABELS.今日行程標題}
          className="h-8 text-sm"
        />
      </div>

      {/* Meals (3 columns) */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        {/* Breakfast */}
        <div className="relative">
          <Input
            value={day.hotelBreakfast ? COMP_TOURS_LABELS.飯店早餐 : (day.meals.breakfast || '')}
            onChange={e => onUpdate(index, 'meals.breakfast', e.target.value)}
            placeholder={COMP_TOURS_LABELS.早餐}
            className={`h-8 text-xs ${!isFirst ? 'pr-7' : ''}`}
            disabled={day.hotelBreakfast}
          />
          {!isFirst && (
            <button type="button" onClick={() => onUpdate(index, 'hotelBreakfast', !day.hotelBreakfast)}
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer" title={COMP_TOURS_LABELS.飯店早餐}>
              <Check size={14} className={`transition-opacity ${day.hotelBreakfast ? 'text-morandi-gold opacity-100' : 'text-morandi-secondary opacity-30 hover:opacity-60'}`} />
            </button>
          )}
        </div>
        {/* Lunch */}
        <div className="relative">
          <Input
            value={day.lunchSelf ? COMP_TOURS_LABELS.敬請自理 : (day.meals.lunch || '')}
            onChange={e => onUpdate(index, 'meals.lunch', e.target.value)}
            placeholder={COMP_TOURS_LABELS.午餐}
            className="h-8 text-xs pr-7"
            disabled={day.lunchSelf}
          />
          <button type="button" onClick={() => onUpdate(index, 'lunchSelf', !day.lunchSelf)}
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer" title={COMP_TOURS_LABELS.敬請自理}>
            <Check size={14} className={`transition-opacity ${day.lunchSelf ? 'text-morandi-gold opacity-100' : 'text-morandi-secondary opacity-30 hover:opacity-60'}`} />
          </button>
        </div>
        {/* Dinner */}
        <div className="relative">
          <Input
            value={day.dinnerSelf ? COMP_TOURS_LABELS.敬請自理 : (day.meals.dinner || '')}
            onChange={e => onUpdate(index, 'meals.dinner', e.target.value)}
            placeholder={COMP_TOURS_LABELS.晚餐}
            className="h-8 text-xs pr-7"
            disabled={day.dinnerSelf}
          />
          <button type="button" onClick={() => onUpdate(index, 'dinnerSelf', !day.dinnerSelf)}
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer" title={COMP_TOURS_LABELS.敬請自理}>
            <Check size={14} className={`transition-opacity ${day.dinnerSelf ? 'text-morandi-gold opacity-100' : 'text-morandi-secondary opacity-30 hover:opacity-60'}`} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Main Component
// ============================================================
export function TourItineraryTab({ tour }: TourItineraryTabProps) {
  const { user: currentUser } = useAuthStore()
  const { items: itineraries, refresh } = useItineraries()

  // State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentItineraryId, setCurrentItineraryId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')
  const [activeDay, setActiveDay] = useState('0')
  const [accommodationOpen, setAccommodationOpen] = useState(false)

  // Form data
  const [title, setTitle] = useState('')
  const [dailySchedule, setDailySchedule] = useState<DailyScheduleItem[]>([])
  const [numDays, setNumDays] = useState(5)

  // Flight info
  const [outboundFlight, setOutboundFlight] = useState<FlightInfo | null>(null)
  const [returnFlight, setReturnFlight] = useState<FlightInfo | null>(null)
  const [outboundFlightNumber, setOutboundFlightNumber] = useState('')
  const [outboundFlightDate, setOutboundFlightDate] = useState('')
  const [returnFlightNumber, setReturnFlightNumber] = useState('')
  const [returnFlightDate, setReturnFlightDate] = useState('')

  // Search flight state
  const [searchOutboundFlight, setSearchOutboundFlight] = useState<FlightInfo | null>(null)
  const [searchReturnFlight, setSearchReturnFlight] = useState<FlightInfo | null>(null)

  useEffect(() => {
    setSearchOutboundFlight(outboundFlightNumber ? { flightNumber: outboundFlightNumber } as FlightInfo : null)
  }, [outboundFlightNumber])

  useEffect(() => {
    setSearchReturnFlight(returnFlightNumber ? { flightNumber: returnFlightNumber } as FlightInfo : null)
  }, [returnFlightNumber])

  // Domestic check
  const isDomestic = useMemo(() => {
    const dest = (tour.location || '').toLowerCase()
    return dest.includes(TOUR_ITINERARY_TAB_LABELS.TAIWAN) || dest.includes('taiwan') || dest === 'tw'
  }, [tour.location])

  // Calculate days from tour dates
  const calculateDays = useCallback(() => {
    if (tour.departure_date && tour.return_date) {
      const start = new Date(tour.departure_date)
      const end = new Date(tour.return_date)
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    }
    return 5
  }, [tour.departure_date, tour.return_date])

  // Flight search hook
  const {
    loadingOutboundFlight: searchingOutbound,
    loadingReturnFlight: searchingReturn,
    outboundSegments,
    returnSegments,
    handleSearchOutboundFlight,
    handleSearchReturnFlight,
    handleSelectOutboundSegment,
    handleSelectReturnSegment,
    clearOutboundSegments,
    clearReturnSegments,
  } = useFlightSearch({
    outboundFlight: searchOutboundFlight,
    setOutboundFlight: (flight) => {
      setOutboundFlight(flight)
      setOutboundFlightNumber('')
    },
    returnFlight: searchReturnFlight,
    setReturnFlight: (flight) => {
      setReturnFlight(flight)
      setReturnFlightNumber('')
    },
    departureDate: outboundFlightDate || tour.departure_date || '',
    days: String(numDays),
  })

  // Initialize daily schedule
  const initializeDailySchedule = useCallback((days: number) => {
    return Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      route: '',
      meals: { breakfast: '', lunch: '', dinner: '' },
      accommodation: '',
      hotelBreakfast: false,
      lunchSelf: false,
      dinnerSelf: false,
      sameAsPrevious: false,
    }))
  }, [])

  // Adjust daily schedule when numDays changes
  useEffect(() => {
    setDailySchedule(prev => {
      if (prev.length === numDays) return prev
      if (numDays > prev.length) {
        // Add days
        const extra = Array.from({ length: numDays - prev.length }, (_, i) => ({
          day: prev.length + i + 1,
          route: '',
          meals: { breakfast: '', lunch: '', dinner: '' },
          accommodation: '',
          hotelBreakfast: false,
          lunchSelf: false,
          dinnerSelf: false,
          sameAsPrevious: false,
        }))
        return [...prev, ...extra]
      }
      // Remove days
      return prev.slice(0, numDays).map((d, i) => ({ ...d, day: i + 1 }))
    })
    // Clamp activeDay
    setActiveDay(prev => {
      const n = parseInt(prev, 10)
      if (n >= numDays) return String(numDays - 1)
      return prev
    })
  }, [numDays])

  // Load itinerary
  useEffect(() => {
    const loadItinerary = async () => {
      setLoading(true)
      try {
        const itinerary = itineraries.find(i => i.tour_id === tour.id)

        if (itinerary) {
          setCurrentItineraryId(itinerary.id)
          setTitle(itinerary.title || tour.name || '')

          if (itinerary.outbound_flight) {
            setOutboundFlight(itinerary.outbound_flight as FlightInfo)
          }
          if (itinerary.return_flight) {
            setReturnFlight(itinerary.return_flight as FlightInfo)
          }

          if (itinerary.daily_itinerary && Array.isArray(itinerary.daily_itinerary)) {
            const schedule = (itinerary.daily_itinerary as Array<{
              title?: string
              meals?: { breakfast?: string; lunch?: string; dinner?: string }
              accommodation?: string
              isSameAccommodation?: boolean
            }>).map((day, idx) => ({
              day: idx + 1,
              route: day.title || '',
              meals: {
                breakfast: day.meals?.breakfast || '',
                lunch: day.meals?.lunch || '',
                dinner: day.meals?.dinner || '',
              },
              accommodation: day.accommodation || '',
              hotelBreakfast: day.meals?.breakfast === COMP_TOURS_LABELS.飯店早餐,
              lunchSelf: day.meals?.lunch === COMP_TOURS_LABELS.敬請自理,
              dinnerSelf: day.meals?.dinner === COMP_TOURS_LABELS.敬請自理,
              sameAsPrevious: day.isSameAccommodation || false,
            }))
            setDailySchedule(schedule)
            setNumDays(schedule.length)
          } else {
            const days = calculateDays()
            setNumDays(days)
            setDailySchedule(initializeDailySchedule(days))
          }
        } else {
          const days = calculateDays()
          setTitle(tour.name || '')
          setNumDays(days)
          setDailySchedule(initializeDailySchedule(days))
          setOutboundFlightDate(tour.departure_date || '')
          setReturnFlightDate(tour.return_date || '')
        }
      } catch (err) {
        logger.error(TOUR_ITINERARY_TAB_LABELS.載入行程表失敗, err)
      } finally {
        setLoading(false)
      }
    }

    loadItinerary()
  }, [tour.id, itineraries, tour.name, tour.departure_date, tour.return_date])

  // Update day schedule
  const updateDaySchedule = useCallback((index: number, field: string, value: string | boolean) => {
    setDailySchedule(prev => {
      const newSchedule = [...prev]
      if (field.startsWith('meals.')) {
        const mealType = field.split('.')[1] as 'breakfast' | 'lunch' | 'dinner'
        newSchedule[index] = {
          ...newSchedule[index],
          meals: { ...newSchedule[index].meals, [mealType]: value as string },
        }
      } else {
        newSchedule[index] = { ...newSchedule[index], [field]: value }
      }
      return newSchedule
    })
  }, [])

  // Get previous accommodation
  const getPreviousAccommodation = useCallback((index: number): string => {
    if (index === 0) return ''
    for (let i = index - 1; i >= 0; i--) {
      if (!dailySchedule[i].sameAsPrevious && dailySchedule[i].accommodation) {
        return dailySchedule[i].accommodation
      }
    }
    return ''
  }, [dailySchedule])

  // Preview data
  const getPreviewDailyData = useCallback(() => {
    const scheduleForPreview = dailySchedule.map(day => ({
      ...day,
      sameAsPrevious: day.sameAsPrevious || false,
      hotelBreakfast: day.hotelBreakfast || false,
      lunchSelf: day.lunchSelf || false,
      dinnerSelf: day.dinnerSelf || false,
    }))
    return computePreviewData(scheduleForPreview, tour.departure_date || null)
  }, [dailySchedule, tour.departure_date])

  // Save
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error(TOUR_ITINERARY_TAB_LABELS.請輸入行程標題)
      return
    }

    setSaving(true)
    try {
      const formattedDailyItinerary = dailySchedule.map((day, idx) => {
        let dateLabel = ''
        if (tour.departure_date) {
          const date = new Date(tour.departure_date)
          date.setDate(date.getDate() + idx)
          const weekdays = TOUR_ITINERARY_TAB_LABELS.WEEKDAYS
          dateLabel = `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`
        }

        const isFirst = idx === 0
        const isLast = idx === dailySchedule.length - 1
        const defaultTitle = isFirst ? COMP_TOURS_LABELS.抵達目的地 : isLast ? COMP_TOURS_LABELS.返回台灣 : `${TOUR_ITINERARY_TAB_LABELS.第(day.day)} 天行程`
        const dayTitle = day.route?.trim() || defaultTitle
        const breakfast = day.hotelBreakfast ? COMP_TOURS_LABELS.飯店早餐 : day.meals.breakfast
        const lunch = day.lunchSelf ? COMP_TOURS_LABELS.敬請自理 : day.meals.lunch
        const dinner = day.dinnerSelf ? COMP_TOURS_LABELS.敬請自理 : day.meals.dinner
        let accommodation = day.accommodation || ''
        if (day.sameAsPrevious) {
          accommodation = getPreviousAccommodation(idx) || COMP_TOURS_LABELS.續住
        }

        return {
          dayLabel: `Day ${day.day}`,
          date: dateLabel,
          title: dayTitle,
          highlight: '',
          description: '',
          activities: [],
          recommendations: [],
          meals: { breakfast, lunch, dinner },
          accommodation: day.sameAsPrevious ? `${TOUR_ITINERARY_TAB_LABELS.同上} (${getPreviousAccommodation(idx) || ''})` : accommodation,
          isSameAccommodation: day.sameAsPrevious || false,
          images: [],
        }
      })

      const itineraryData = {
        tour_id: tour.id,
        title,
        tagline: '',
        subtitle: '',
        description: '',
        departure_date: tour.departure_date || '',
        tour_code: tour.code || '',
        cover_image: '',
        country: tour.location || '',
        city: '',
        status: '開團' as const,
        features: [],
        focus_cards: [],
        daily_itinerary: formattedDailyItinerary,
        outbound_flight: outboundFlight ? {
          airline: outboundFlight.airline || '',
          flightNumber: outboundFlight.flightNumber || '',
          departureAirport: outboundFlight.departureAirport || '',
          departureTime: outboundFlight.departureTime || '',
          departureDate: '',
          arrivalAirport: outboundFlight.arrivalAirport || '',
          arrivalTime: outboundFlight.arrivalTime || '',
          duration: '',
        } : undefined,
        return_flight: returnFlight ? {
          airline: returnFlight.airline || '',
          flightNumber: returnFlight.flightNumber || '',
          departureAirport: returnFlight.departureAirport || '',
          departureTime: returnFlight.departureTime || '',
          departureDate: '',
          arrivalAirport: returnFlight.arrivalAirport || '',
          arrivalTime: returnFlight.arrivalTime || '',
          duration: '',
        } : undefined,
      }

      if (currentItineraryId) {
        await updateItinerary(currentItineraryId, itineraryData)
        await syncItineraryToQuote(currentItineraryId, formattedDailyItinerary)
        toast.success(TOUR_ITINERARY_TAB_LABELS.行程表已更新)
      } else {
        const newItinerary = await createItinerary({
          ...itineraryData,
          created_by: currentUser?.id || undefined,
        } as Parameters<typeof createItinerary>[0])
        if (newItinerary?.id) {
          setCurrentItineraryId(newItinerary.id)
          toast.success(TOUR_ITINERARY_TAB_LABELS.行程表已建立)
        }
      }
      refresh()
    } catch (error) {
      logger.error(TOUR_ITINERARY_TAB_LABELS.儲存行程表失敗, error)
      toast.error(COMP_TOURS_LABELS.儲存失敗)
    } finally {
      setSaving(false)
    }
  }

  // Print
  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const dailyData = getPreviewDailyData()
    const printContent = generatePrintHtml({
      title: title || TOUR_ITINERARY_TAB_LABELS.行程表,
      companyName: currentUser?.workspace_code || TOUR_ITINERARY_TAB_LABELS.TRAVEL_AGENCY,
      destination: tour.location || '',
      startDate: tour.departure_date || null,
      isDomestic,
      outboundFlight,
      returnFlight,
      dailyData,
    })

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }, [getPreviewDailyData, title, outboundFlight, returnFlight, tour.departure_date, tour.location, currentUser?.workspace_code, isDomestic])

  // Compute date label for a given day index
  const getDateLabel = useCallback((idx: number) => {
    if (!tour.departure_date) return ''
    const date = new Date(tour.departure_date)
    date.setDate(date.getDate() + idx)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }, [tour.departure_date])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    )
  }

  // Preview mode
  if (viewMode === 'preview') {
    const dailyData = getPreviewDailyData()
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-medium">
            <Eye className="w-5 h-5 text-morandi-gold" />
            {TOUR_ITINERARY_TAB_LABELS.簡易行程表預覽}
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setViewMode('edit')}>
              <Edit2 className="w-4 h-4 mr-1" />
              {TOUR_ITINERARY_TAB_LABELS.編輯}
            </Button>
            <Button size="sm" onClick={handlePrint} className="bg-morandi-gold hover:bg-morandi-gold-hover text-white">
              <Printer className="w-4 h-4 mr-1" />
              {TOUR_ITINERARY_TAB_LABELS.列印}
            </Button>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-card">
          <div className="border-b-2 border-morandi-gold pb-4 mb-6">
            <div className="flex items-start justify-between">
              <h1 className="text-xl font-bold text-morandi-primary">{title || TOUR_ITINERARY_TAB_LABELS.行程表}</h1>
              <span className="text-sm font-semibold text-morandi-gold">{currentUser?.workspace_code || TOUR_ITINERARY_TAB_LABELS.TRAVEL_AGENCY}</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div><span className="text-muted-foreground">{TOUR_ITINERARY_TAB_LABELS.目的地_冒號}</span>{tour.location || '-'}</div>
              <div><span className="text-muted-foreground">{TOUR_ITINERARY_TAB_LABELS.出發日期}：</span>{tour.departure_date || '-'}</div>
              <div><span className="text-muted-foreground">{TOUR_ITINERARY_TAB_LABELS.行程天數_冒號}</span>{dailyData.length} {TOUR_ITINERARY_TAB_LABELS.天}</div>
            </div>
          </div>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-morandi-gold text-white">
                <th className="border border-morandi-gold/50 px-3 py-2 text-left w-20">{TOUR_ITINERARY_TAB_LABELS.日期_表頭}</th>
                <th className="border border-morandi-gold/50 px-3 py-2 text-left">{TOUR_ITINERARY_TAB_LABELS.行程內容}</th>
                <th className="border border-morandi-gold/50 px-3 py-2 text-center w-16">{TOUR_ITINERARY_TAB_LABELS.早餐_表頭}</th>
                <th className="border border-morandi-gold/50 px-3 py-2 text-center w-16">{TOUR_ITINERARY_TAB_LABELS.午餐_表頭}</th>
                <th className="border border-morandi-gold/50 px-3 py-2 text-center w-16">{TOUR_ITINERARY_TAB_LABELS.晚餐_表頭}</th>
                <th className="border border-morandi-gold/50 px-3 py-2 text-left w-32">{TOUR_ITINERARY_TAB_LABELS.住宿_表頭}</th>
              </tr>
            </thead>
            <tbody>
              {dailyData.map((day, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
                  <td className="border border-muted px-3 py-2">
                    <div className="font-semibold text-morandi-gold">{day.dayLabel}</div>
                    <div className="text-xs text-muted-foreground">{day.date}</div>
                  </td>
                  <td className="border border-muted px-3 py-2 font-medium">{day.title}</td>
                  <td className="border border-muted px-3 py-2 text-center text-xs">{day.meals.breakfast || '-'}</td>
                  <td className="border border-muted px-3 py-2 text-center text-xs">{day.meals.lunch || '-'}</td>
                  <td className="border border-muted px-3 py-2 text-center text-xs">{day.meals.dinner || '-'}</td>
                  <td className="border border-muted px-3 py-2 text-xs">{day.accommodation || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ============================================================
  // Edit mode — top/bottom layout
  // ============================================================
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Top section: tour-level info ── */}
      <div className="p-4 border-b border-border space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-morandi-primary">
            <FileText className="w-4 h-4 text-morandi-gold" />
            {currentItineraryId ? COMP_TOURS_LABELS.編輯行程表 : COMP_TOURS_LABELS.建立行程表}
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setViewMode('preview')} className="h-7 px-2 text-xs gap-1">
              <Eye size={12} />
              {TOUR_ITINERARY_TAB_LABELS.預覽}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !title.trim()} className="h-7 px-3 text-xs bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-1">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              {currentItineraryId ? COMP_TOURS_LABELS.更新行程 : COMP_TOURS_LABELS.建立行程}
            </Button>
          </div>
        </div>

        {/* Tour name (read-only display) */}
        <div className="text-sm text-muted-foreground">
          {tour.name || COMP_TOURS_LABELS.未設定}
        </div>

        {/* Row: title + days */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 space-y-1">
            <Label className="text-xs text-morandi-primary">{TOUR_ITINERARY_TAB_LABELS.行程標題_必填}</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={TOUR_ITINERARY_TAB_LABELS.行程表標題}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-morandi-primary">{TOUR_ITINERARY_TAB_LABELS.調整天數}</Label>
            <Input
              type="number"
              min={1}
              max={30}
              value={numDays}
              onChange={e => {
                const v = parseInt(e.target.value, 10)
                if (v >= 1 && v <= 30) setNumDays(v)
              }}
              className="h-8 text-sm w-full"
            />
          </div>
        </div>

        {/* Row: flights + accommodation button */}
        <div className="flex flex-wrap items-end gap-3">
          {/* Flights (hidden for domestic) */}
          {!isDomestic && (
            <>
              {/* Outbound flight */}
              <div className="flex-1 min-w-[200px] border rounded-lg p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Plane size={10} />
                    {TOUR_ITINERARY_TAB_LABELS.去程}
                  </span>
                  {outboundFlight && (
                    <button type="button" onClick={() => setOutboundFlight(null)} className="text-destructive hover:text-destructive/80 p-0.5">
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
                {outboundFlight ? (
                  <div className="bg-muted/50 rounded p-1.5 text-xs">
                    <span className="font-bold">{outboundFlight.flightNumber}</span>
                    <span className="text-muted-foreground ml-1">{outboundFlight.airline}</span>
                    <div className="text-muted-foreground">
                      {outboundFlight.departureAirport} → {outboundFlight.arrivalAirport}
                      <span className="ml-1">{outboundFlight.departureTime} - {outboundFlight.arrivalTime}</span>
                    </div>
                  </div>
                ) : outboundSegments.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{TOUR_ITINERARY_TAB_LABELS.此航班有多個航段_請選擇}</p>
                    {outboundSegments.map((seg, i) => (
                      <button key={i} type="button" onClick={() => handleSelectOutboundSegment(seg)}
                        className="w-full text-left p-1.5 rounded border hover:border-morandi-gold hover:bg-morandi-gold/5 transition-colors text-xs">
                        {seg.departureAirport} → {seg.arrivalAirport}
                        <span className="text-muted-foreground ml-1">{seg.departureTime} - {seg.arrivalTime}</span>
                      </button>
                    ))}
                    <button type="button" onClick={clearOutboundSegments} className="text-xs text-muted-foreground hover:text-foreground">{COMP_TOURS_LABELS.取消}</button>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <Input value={outboundFlightNumber} onChange={e => setOutboundFlightNumber(e.target.value.toUpperCase())}
                      placeholder={COMP_TOURS_LABELS.航班號碼_如_BR108} className="h-7 text-xs flex-1"
                      onKeyDown={e => e.key === 'Enter' && handleSearchOutboundFlight()} />
                    <DatePicker value={outboundFlightDate} onChange={date => setOutboundFlightDate(date || '')}
                      placeholder={COMP_TOURS_LABELS.日期} className="h-7 text-xs w-24" />
                    <Button type="button" size="sm" onClick={handleSearchOutboundFlight} disabled={searchingOutbound}
                      className="h-7 px-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white">
                      {searchingOutbound ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                    </Button>
                  </div>
                )}
              </div>

              {/* Return flight */}
              <div className="flex-1 min-w-[200px] border rounded-lg p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Plane size={10} />
                    {TOUR_ITINERARY_TAB_LABELS.回程}
                  </span>
                  {returnFlight && (
                    <button type="button" onClick={() => setReturnFlight(null)} className="text-destructive hover:text-destructive/80 p-0.5">
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
                {returnFlight ? (
                  <div className="bg-muted/50 rounded p-1.5 text-xs">
                    <span className="font-bold">{returnFlight.flightNumber}</span>
                    <span className="text-muted-foreground ml-1">{returnFlight.airline}</span>
                    <div className="text-muted-foreground">
                      {returnFlight.departureAirport} → {returnFlight.arrivalAirport}
                      <span className="ml-1">{returnFlight.departureTime} - {returnFlight.arrivalTime}</span>
                    </div>
                  </div>
                ) : returnSegments.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{TOUR_ITINERARY_TAB_LABELS.此航班有多個航段_請選擇}</p>
                    {returnSegments.map((seg, i) => (
                      <button key={i} type="button" onClick={() => handleSelectReturnSegment(seg)}
                        className="w-full text-left p-1.5 rounded border hover:border-morandi-gold hover:bg-morandi-gold/5 transition-colors text-xs">
                        {seg.departureAirport} → {seg.arrivalAirport}
                        <span className="text-muted-foreground ml-1">{seg.departureTime} - {seg.arrivalTime}</span>
                      </button>
                    ))}
                    <button type="button" onClick={clearReturnSegments} className="text-xs text-muted-foreground hover:text-foreground">{COMP_TOURS_LABELS.取消}</button>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <Input value={returnFlightNumber} onChange={e => setReturnFlightNumber(e.target.value.toUpperCase())}
                      placeholder={COMP_TOURS_LABELS.航班號碼_如_BR107} className="h-7 text-xs flex-1"
                      onKeyDown={e => e.key === 'Enter' && handleSearchReturnFlight()} />
                    <DatePicker value={returnFlightDate} onChange={date => setReturnFlightDate(date || '')}
                      placeholder={COMP_TOURS_LABELS.日期} className="h-7 text-xs w-24" />
                    <Button type="button" size="sm" onClick={handleSearchReturnFlight} disabled={searchingReturn}
                      className="h-7 px-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white">
                      {searchingReturn ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Accommodation button */}
          <Button variant="outline" size="sm" onClick={() => setAccommodationOpen(true)} className="h-8 gap-1">
            <Hotel size={14} />
            {TOUR_ITINERARY_TAB_LABELS.住宿設定}
          </Button>
        </div>
      </div>

      {/* ── Bottom section: daily tabs ── */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeDay} onValueChange={setActiveDay} className="flex flex-col h-full">
          <div className="border-b px-4 overflow-x-auto">
            <TabsList className="h-9">
              {dailySchedule.map((_, idx) => (
                <TabsTrigger key={idx} value={String(idx)} className="text-xs px-3">
                  {TOUR_ITINERARY_TAB_LABELS.DAY_LABEL(idx + 1)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {dailySchedule.map((day, idx) => (
            <TabsContent key={idx} value={String(idx)} className="flex-1 overflow-y-auto p-4 mt-0">
              <DayScheduleEditor
                day={day}
                index={idx}
                isFirst={idx === 0}
                isLast={idx === dailySchedule.length - 1}
                dateLabel={getDateLabel(idx)}
                onUpdate={updateDaySchedule}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Accommodation Dialog */}
      <AccommodationDialog
        open={accommodationOpen}
        onOpenChange={setAccommodationOpen}
        dailySchedule={dailySchedule}
        onUpdateAccommodation={updateDaySchedule}
        getPreviousAccommodation={getPreviousAccommodation}
      />
    </div>
  )
}
