'use client'

/**
 * TourItineraryTab - 旅遊團簡易行程表分頁
 *
 * 直接嵌入和提案一樣的左右分欄編輯器：
 * - 左邊：基本資訊 + 航班
 * - 右邊：每日行程
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Loader2, FileText, Save, Eye, Edit2, Printer, Plane, Search, Trash2, Check, ArrowRight, Minus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { logger } from '@/lib/utils/logger'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores'
import { useItineraries, createItinerary, updateItinerary } from '@/data'
import { useFlightSearch } from '@/hooks'
import { syncItineraryToQuote } from '@/lib/utils/itinerary-quote-sync'
import type { Tour, Itinerary } from '@/stores/types'
import type { FlightInfo } from '@/types/flight.types'

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

export function TourItineraryTab({ tour }: TourItineraryTabProps) {
  const { user: currentUser } = useAuthStore()
  const { items: itineraries, refresh } = useItineraries()

  // 狀態
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentItineraryId, setCurrentItineraryId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')

  // 表單資料
  const [title, setTitle] = useState('')
  const [dailySchedule, setDailySchedule] = useState<DailyScheduleItem[]>([])

  // 航班資訊
  const [outboundFlight, setOutboundFlight] = useState<FlightInfo | null>(null)
  const [returnFlight, setReturnFlight] = useState<FlightInfo | null>(null)
  const [outboundFlightNumber, setOutboundFlightNumber] = useState('')
  const [outboundFlightDate, setOutboundFlightDate] = useState('')
  const [returnFlightNumber, setReturnFlightNumber] = useState('')
  const [returnFlightDate, setReturnFlightDate] = useState('')

  // 搜尋用的臨時航班 state
  const [searchOutboundFlight, setSearchOutboundFlight] = useState<FlightInfo | null>(null)
  const [searchReturnFlight, setSearchReturnFlight] = useState<FlightInfo | null>(null)

  useEffect(() => {
    setSearchOutboundFlight(outboundFlightNumber ? { flightNumber: outboundFlightNumber } as FlightInfo : null)
  }, [outboundFlightNumber])

  useEffect(() => {
    setSearchReturnFlight(returnFlightNumber ? { flightNumber: returnFlightNumber } as FlightInfo : null)
  }, [returnFlightNumber])

  // 判斷是否為國內旅遊
  const isDomestic = useMemo(() => {
    const dest = (tour.location || '').toLowerCase()
    return dest.includes('台灣') || dest.includes('taiwan') || dest === 'tw'
  }, [tour.location])

  // 計算天數
  const calculateDays = useCallback(() => {
    if (tour.departure_date && tour.return_date) {
      const start = new Date(tour.departure_date)
      const end = new Date(tour.return_date)
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    }
    return 5
  }, [tour.departure_date, tour.return_date])

  // 航班查詢
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
    days: String(calculateDays()),
  })

  // 初始化每日行程
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

  // 載入行程表
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
              hotelBreakfast: day.meals?.breakfast === '飯店早餐',
              lunchSelf: day.meals?.lunch === '敬請自理',
              dinnerSelf: day.meals?.dinner === '敬請自理',
              sameAsPrevious: day.isSameAccommodation || false,
            }))
            setDailySchedule(schedule)
          } else {
            setDailySchedule(initializeDailySchedule(calculateDays()))
          }
        } else {
          setTitle(tour.name || '')
          setDailySchedule(initializeDailySchedule(calculateDays()))
          setOutboundFlightDate(tour.departure_date || '')
          setReturnFlightDate(tour.return_date || '')
        }
      } catch (err) {
        logger.error('載入行程表失敗', err)
      } finally {
        setLoading(false)
      }
    }

    loadItinerary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour.id, itineraries, tour.name, tour.departure_date, tour.return_date])

  // 更新每日行程
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

  // 取得前一天的住宿
  const getPreviousAccommodation = useCallback((index: number): string => {
    if (index === 0) return ''
    for (let i = index - 1; i >= 0; i--) {
      if (!dailySchedule[i].sameAsPrevious && dailySchedule[i].accommodation) {
        return dailySchedule[i].accommodation
      }
    }
    return ''
  }, [dailySchedule])

  // 產生預覽資料
  const getPreviewDailyData = useCallback(() => {
    return dailySchedule.map((day, idx) => {
      let dateLabel = ''
      if (tour.departure_date) {
        const date = new Date(tour.departure_date)
        date.setDate(date.getDate() + idx)
        const weekdays = ['日', '一', '二', '三', '四', '五', '六']
        dateLabel = `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`
      }
      const isFirst = idx === 0
      const isLast = idx === dailySchedule.length - 1
      const defaultTitle = isFirst ? '抵達目的地' : isLast ? '返回台灣' : `第 ${day.day} 天行程`
      const dayTitle = day.route?.trim() || defaultTitle
      const breakfast = day.hotelBreakfast ? '飯店早餐' : day.meals.breakfast
      const lunch = day.lunchSelf ? '敬請自理' : day.meals.lunch
      const dinner = day.dinnerSelf ? '敬請自理' : day.meals.dinner
      let accommodation = day.accommodation || ''
      if (day.sameAsPrevious && idx > 0) {
        accommodation = getPreviousAccommodation(idx) || '續住'
      }
      return {
        dayLabel: `Day ${day.day}`,
        date: dateLabel,
        title: dayTitle,
        meals: { breakfast, lunch, dinner },
        accommodation: isLast ? '' : accommodation,
      }
    })
  }, [dailySchedule, tour.departure_date, getPreviousAccommodation])

  // 儲存行程表
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('請輸入行程標題')
      return
    }

    setSaving(true)
    try {
      const formattedDailyItinerary = dailySchedule.map((day, idx) => {
        let dateLabel = ''
        if (tour.departure_date) {
          const date = new Date(tour.departure_date)
          date.setDate(date.getDate() + idx)
          const weekdays = ['日', '一', '二', '三', '四', '五', '六']
          dateLabel = `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`
        }

        const isFirst = idx === 0
        const isLast = idx === dailySchedule.length - 1
        const defaultTitle = isFirst ? '抵達目的地' : isLast ? '返回台灣' : `第 ${day.day} 天行程`
        const dayTitle = day.route?.trim() || defaultTitle
        const breakfast = day.hotelBreakfast ? '飯店早餐' : day.meals.breakfast
        const lunch = day.lunchSelf ? '敬請自理' : day.meals.lunch
        const dinner = day.dinnerSelf ? '敬請自理' : day.meals.dinner
        let accommodation = day.accommodation || ''
        if (day.sameAsPrevious) {
          accommodation = getPreviousAccommodation(idx) || '續住'
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
          accommodation: day.sameAsPrevious ? `同上 (${getPreviousAccommodation(idx) || ''})` : accommodation,
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
        status: '提案' as const,
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
        toast.success('行程表已更新')
      } else {
        const newItinerary = await createItinerary({
          ...itineraryData,
          created_by: currentUser?.id || undefined,
        } as Parameters<typeof createItinerary>[0])
        if (newItinerary?.id) {
          setCurrentItineraryId(newItinerary.id)
          toast.success('行程表已建立')
        }
      }
      refresh()
    } catch (error) {
      logger.error('儲存行程表失敗:', error)
      toast.error('儲存失敗')
    } finally {
      setSaving(false)
    }
  }

  // 列印
  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const dailyData = getPreviewDailyData()
    const companyName = currentUser?.workspace_code || '旅行社'
    const destination = tour.location || ''

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title || '行程表'}</title>
        <style>
          @page { size: A4; margin: 10mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; }
          .header { border-bottom: 2px solid #c9aa7c; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 24px; font-weight: bold; color: #3a3633; margin-bottom: 4px; }
          .company { text-align: right; color: #c9aa7c; font-weight: 600; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 16px; font-size: 14px; }
          .info-label { color: #8b8680; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 16px; }
          th { background: #c9aa7c; color: white; padding: 8px; text-align: left; border: 1px solid #c9aa7c; }
          td { padding: 8px; border: 1px solid #e8e5e0; }
          tr:nth-child(even) { background: #f6f4f1; }
          .day-label { font-weight: 600; color: #c9aa7c; }
          .day-date { font-size: 11px; color: #8b8680; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e8e5e0; text-align: center; font-size: 12px; color: #8b8680; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; justify-content: space-between;">
            <div class="title">${title || '行程表'}</div>
            <div class="company">${companyName}</div>
          </div>
          <div class="info-grid">
            <div><span class="info-label">目的地：</span>${destination}</div>
            <div><span class="info-label">出發日期：</span>${tour.departure_date || '-'}</div>
            <div><span class="info-label">行程天數：</span>${dailyData.length} 天</div>
          </div>
          ${!isDomestic && (outboundFlight || returnFlight) ? `
          <div class="info-grid" style="margin-top: 8px;">
            ${outboundFlight ? `<div><span class="info-label">去程航班：</span>${outboundFlight.airline} ${outboundFlight.flightNumber} (${outboundFlight.departureAirport} ${outboundFlight.departureTime} → ${outboundFlight.arrivalAirport} ${outboundFlight.arrivalTime})</div>` : ''}
            ${returnFlight ? `<div><span class="info-label">回程航班：</span>${returnFlight.airline} ${returnFlight.flightNumber} (${returnFlight.departureAirport} ${returnFlight.departureTime} → ${returnFlight.arrivalAirport} ${returnFlight.arrivalTime})</div>` : ''}
          </div>` : ''}
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 80px;">日期</th>
              <th>行程內容</th>
              <th style="width: 70px; text-align: center;">早餐</th>
              <th style="width: 70px; text-align: center;">午餐</th>
              <th style="width: 70px; text-align: center;">晚餐</th>
              <th style="width: 120px;">住宿</th>
            </tr>
          </thead>
          <tbody>
            ${dailyData.map((day) => `
              <tr>
                <td>
                  <div class="day-label">${day.dayLabel}</div>
                  <div class="day-date">${day.date}</div>
                </td>
                <td>${day.title}</td>
                <td style="text-align: center; font-size: 12px;">${day.meals.breakfast || '-'}</td>
                <td style="text-align: center; font-size: 12px;">${day.meals.lunch || '-'}</td>
                <td style="text-align: center; font-size: 12px;">${day.meals.dinner || '-'}</td>
                <td style="font-size: 12px;">${day.accommodation || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          本行程表由 ${companyName} 提供 | 列印日期：${new Date().toLocaleDateString('zh-TW')}
        </div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }, [getPreviewDailyData, title, outboundFlight, returnFlight, tour.departure_date, tour.location, currentUser?.workspace_code, isDomestic])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    )
  }

  // 預覽模式
  if (viewMode === 'preview') {
    const dailyData = getPreviewDailyData()
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-medium">
            <Eye className="w-5 h-5 text-morandi-gold" />
            簡易行程表預覽
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setViewMode('edit')}>
              <Edit2 className="w-4 h-4 mr-1" />
              編輯
            </Button>
            <Button size="sm" onClick={handlePrint} className="bg-morandi-gold hover:bg-morandi-gold-hover text-white">
              <Printer className="w-4 h-4 mr-1" />
              列印
            </Button>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-card">
          <div className="border-b-2 border-morandi-gold pb-4 mb-6">
            <div className="flex items-start justify-between">
              <h1 className="text-xl font-bold text-morandi-primary">{title || '行程表'}</h1>
              <span className="text-sm font-semibold text-morandi-gold">{currentUser?.workspace_code || '旅行社'}</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div><span className="text-muted-foreground">目的地：</span>{tour.location || '-'}</div>
              <div><span className="text-muted-foreground">出發日期：</span>{tour.departure_date || '-'}</div>
              <div><span className="text-muted-foreground">行程天數：</span>{dailyData.length} 天</div>
            </div>
          </div>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-morandi-gold text-white">
                <th className="border border-morandi-gold/50 px-3 py-2 text-left w-20">日期</th>
                <th className="border border-morandi-gold/50 px-3 py-2 text-left">行程內容</th>
                <th className="border border-morandi-gold/50 px-3 py-2 text-center w-16">早餐</th>
                <th className="border border-morandi-gold/50 px-3 py-2 text-center w-16">午餐</th>
                <th className="border border-morandi-gold/50 px-3 py-2 text-center w-16">晚餐</th>
                <th className="border border-morandi-gold/50 px-3 py-2 text-left w-32">住宿</th>
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

  // 編輯模式 - 左右分欄（響應式：小螢幕上下、大螢幕左右）
  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      {/* 左側：基本資訊 + 航班 */}
      <div className="w-full lg:w-1/2 p-4 border-b lg:border-b-0 lg:border-r border-border overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-morandi-primary">
            <FileText className="w-4 h-4 text-morandi-gold" />
            {currentItineraryId ? '編輯行程表' : '建立行程表'}
          </h3>
          <Button variant="outline" size="sm" onClick={() => setViewMode('preview')} className="h-6 px-2 text-[10px] gap-1">
            <Eye size={10} />
            預覽
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-morandi-primary">行程標題 *</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="行程表標題"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-morandi-primary">目的地</Label>
              <Input value={tour.location || '(未設定)'} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-morandi-primary">行程天數</Label>
              <Input value={`${dailySchedule.length} 天`} disabled className="bg-muted" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-morandi-primary">出發日期</Label>
              <Input value={tour.departure_date || '(未設定)'} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-morandi-primary">回程日期</Label>
              <Input value={tour.return_date || '(未設定)'} disabled className="bg-muted" />
            </div>
          </div>

          {/* 航班資訊 - 國內旅遊隱藏 */}
          {!isDomestic && (
            <div className="space-y-3">
              <Label className="text-xs text-morandi-primary flex items-center gap-1">
                <Plane size={12} />
                航班資訊（選填）
              </Label>

              {/* 去程航班 */}
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">去程航班</span>
                  {outboundFlight && (
                    <button type="button" onClick={() => setOutboundFlight(null)} className="text-destructive hover:text-destructive/80 p-1">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                {outboundFlight ? (
                  <div className="bg-muted/50 rounded p-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{outboundFlight.flightNumber}</span>
                      <span className="text-xs text-muted-foreground">{outboundFlight.airline}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {outboundFlight.departureAirport} → {outboundFlight.arrivalAirport}
                      <span className="ml-2">{outboundFlight.departureTime} - {outboundFlight.arrivalTime}</span>
                    </div>
                  </div>
                ) : outboundSegments.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">此航班有多個航段，請選擇：</p>
                    {outboundSegments.map((seg, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectOutboundSegment(seg)}
                        className="w-full text-left p-2 rounded border hover:border-morandi-gold hover:bg-morandi-gold/5 transition-colors text-sm"
                      >
                        {seg.departureAirport} → {seg.arrivalAirport}
                        <span className="text-xs text-muted-foreground ml-2">{seg.departureTime} - {seg.arrivalTime}</span>
                      </button>
                    ))}
                    <button type="button" onClick={clearOutboundSegments} className="text-xs text-muted-foreground hover:text-foreground">取消</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={outboundFlightNumber}
                      onChange={e => setOutboundFlightNumber(e.target.value.toUpperCase())}
                      placeholder="航班號碼 (如 BR108)"
                      className="h-8 text-xs flex-1"
                      onKeyDown={e => e.key === 'Enter' && handleSearchOutboundFlight()}
                    />
                    <DatePicker
                      value={outboundFlightDate}
                      onChange={date => setOutboundFlightDate(date || '')}
                      placeholder="日期"
                      className="h-8 text-xs w-28"
                    />
                    <Button type="button" size="sm" onClick={handleSearchOutboundFlight} disabled={searchingOutbound} className="h-8 px-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white">
                      {searchingOutbound ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    </Button>
                  </div>
                )}
              </div>

              {/* 回程航班 */}
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">回程航班</span>
                  {returnFlight && (
                    <button type="button" onClick={() => setReturnFlight(null)} className="text-destructive hover:text-destructive/80 p-1">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                {returnFlight ? (
                  <div className="bg-muted/50 rounded p-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{returnFlight.flightNumber}</span>
                      <span className="text-xs text-muted-foreground">{returnFlight.airline}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {returnFlight.departureAirport} → {returnFlight.arrivalAirport}
                      <span className="ml-2">{returnFlight.departureTime} - {returnFlight.arrivalTime}</span>
                    </div>
                  </div>
                ) : returnSegments.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">此航班有多個航段，請選擇：</p>
                    {returnSegments.map((seg, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectReturnSegment(seg)}
                        className="w-full text-left p-2 rounded border hover:border-morandi-gold hover:bg-morandi-gold/5 transition-colors text-sm"
                      >
                        {seg.departureAirport} → {seg.arrivalAirport}
                        <span className="text-xs text-muted-foreground ml-2">{seg.departureTime} - {seg.arrivalTime}</span>
                      </button>
                    ))}
                    <button type="button" onClick={clearReturnSegments} className="text-xs text-muted-foreground hover:text-foreground">取消</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={returnFlightNumber}
                      onChange={e => setReturnFlightNumber(e.target.value.toUpperCase())}
                      placeholder="航班號碼 (如 BR107)"
                      className="h-8 text-xs flex-1"
                      onKeyDown={e => e.key === 'Enter' && handleSearchReturnFlight()}
                    />
                    <DatePicker
                      value={returnFlightDate}
                      onChange={date => setReturnFlightDate(date || '')}
                      placeholder="日期"
                      className="h-8 text-xs w-28"
                    />
                    <Button type="button" size="sm" onClick={handleSearchReturnFlight} disabled={searchingReturn} className="h-8 px-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white">
                      {searchingReturn ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 底部按鈕 */}
          <div className="flex justify-end pt-4 border-t">
            <Button size="sm" onClick={handleSave} disabled={saving || !title.trim()} className="h-7 px-3 text-xs bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-1">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              {currentItineraryId ? '更新行程' : '建立行程'}
            </Button>
          </div>
        </div>
      </div>

      {/* 右側：每日行程 */}
      <div className="w-full lg:w-1/2 p-4 overflow-y-auto">
        <h3 className="text-sm font-bold text-morandi-primary mb-4">每日行程</h3>
        <div className="space-y-3">
          {dailySchedule.map((day, idx) => {
            const isFirst = idx === 0
            const isLast = idx === dailySchedule.length - 1
            let dateLabel = ''
            if (tour.departure_date) {
              const date = new Date(tour.departure_date)
              date.setDate(date.getDate() + idx)
              dateLabel = `${date.getMonth() + 1}/${date.getDate()}`
            }
            return (
              <div key={idx} className="p-3 rounded-lg border border-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-morandi-gold text-white text-xs font-bold px-2 py-0.5 rounded">
                      Day {day.day}
                    </span>
                    {dateLabel && <span className="text-xs text-muted-foreground">({dateLabel})</span>}
                  </div>
                  {/* 符號按鈕 */}
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        const currentValue = day.route || ''
                        updateDaySchedule(idx, 'route', currentValue + ' → ')
                      }}
                      className="p-1 bg-muted/50 hover:bg-morandi-gold/20 rounded transition-colors"
                      title="插入箭頭"
                    >
                      <ArrowRight size={12} className="text-morandi-secondary" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const currentValue = day.route || ''
                        updateDaySchedule(idx, 'route', currentValue + ' ⇀ ')
                      }}
                      className="px-1.5 py-0.5 text-[10px] bg-muted/50 hover:bg-morandi-gold/20 rounded transition-colors font-medium text-morandi-secondary"
                      title="插入鉤箭頭"
                    >
                      ⇀
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const currentValue = day.route || ''
                        updateDaySchedule(idx, 'route', currentValue + ' · ')
                      }}
                      className="px-1.5 py-0.5 text-[10px] bg-muted/50 hover:bg-morandi-gold/20 rounded transition-colors font-medium text-morandi-secondary"
                      title="插入間隔點"
                    >
                      ·
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const currentValue = day.route || ''
                        updateDaySchedule(idx, 'route', currentValue + ' | ')
                      }}
                      className="p-1 bg-muted/50 hover:bg-morandi-gold/20 rounded transition-colors"
                      title="插入直線"
                    >
                      <Minus size={12} className="text-morandi-secondary" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const currentValue = day.route || ''
                        updateDaySchedule(idx, 'route', currentValue + ' ⭐ ')
                      }}
                      className="p-1 bg-muted/50 hover:bg-morandi-gold/20 rounded transition-colors"
                      title="插入星號"
                    >
                      <Sparkles size={12} className="text-morandi-gold" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const currentValue = day.route || ''
                        updateDaySchedule(idx, 'route', currentValue + ' ✈ ')
                      }}
                      className="px-1.5 py-0.5 text-[10px] bg-muted/50 hover:bg-morandi-gold/20 rounded transition-colors text-morandi-secondary"
                      title="插入飛機"
                    >
                      ✈
                    </button>
                  </div>
                </div>
                <Input
                  value={day.route || ''}
                  onChange={e => updateDaySchedule(idx, 'route', e.target.value)}
                  placeholder={isFirst ? '抵達目的地' : isLast ? '返回台灣' : '今日行程標題'}
                  className="h-8 text-sm mb-2"
                />
                {/* 餐食（三欄） */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {/* 早餐 */}
                  <div className="relative">
                    <Input
                      value={day.hotelBreakfast ? '飯店早餐' : (day.meals.breakfast || '')}
                      onChange={e => updateDaySchedule(idx, 'meals.breakfast', e.target.value)}
                      placeholder="早餐"
                      className={`h-8 text-xs ${!isFirst ? 'pr-7' : ''}`}
                      disabled={day.hotelBreakfast}
                    />
                    {!isFirst && (
                      <button
                        type="button"
                        onClick={() => updateDaySchedule(idx, 'hotelBreakfast', !day.hotelBreakfast)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                        title="飯店早餐"
                      >
                        <Check
                          size={14}
                          className={`transition-opacity ${day.hotelBreakfast ? 'text-morandi-gold opacity-100' : 'text-morandi-secondary opacity-30 hover:opacity-60'}`}
                        />
                      </button>
                    )}
                  </div>
                  {/* 午餐 */}
                  <div className="relative">
                    <Input
                      value={day.lunchSelf ? '敬請自理' : (day.meals.lunch || '')}
                      onChange={e => updateDaySchedule(idx, 'meals.lunch', e.target.value)}
                      placeholder="午餐"
                      className="h-8 text-xs pr-7"
                      disabled={day.lunchSelf}
                    />
                    <button
                      type="button"
                      onClick={() => updateDaySchedule(idx, 'lunchSelf', !day.lunchSelf)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                      title="敬請自理"
                    >
                      <Check
                        size={14}
                        className={`transition-opacity ${day.lunchSelf ? 'text-morandi-gold opacity-100' : 'text-morandi-secondary opacity-30 hover:opacity-60'}`}
                      />
                    </button>
                  </div>
                  {/* 晚餐 */}
                  <div className="relative">
                    <Input
                      value={day.dinnerSelf ? '敬請自理' : (day.meals.dinner || '')}
                      onChange={e => updateDaySchedule(idx, 'meals.dinner', e.target.value)}
                      placeholder="晚餐"
                      className="h-8 text-xs pr-7"
                      disabled={day.dinnerSelf}
                    />
                    <button
                      type="button"
                      onClick={() => updateDaySchedule(idx, 'dinnerSelf', !day.dinnerSelf)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                      title="敬請自理"
                    >
                      <Check
                        size={14}
                        className={`transition-opacity ${day.dinnerSelf ? 'text-morandi-gold opacity-100' : 'text-morandi-secondary opacity-30 hover:opacity-60'}`}
                      />
                    </button>
                  </div>
                </div>
                {/* 住宿 */}
                {!isLast && (
                  <div className="relative mt-1.5">
                    <Input
                      value={day.sameAsPrevious ? `同上 (${getPreviousAccommodation(idx) || ''})` : (day.accommodation || '')}
                      onChange={e => updateDaySchedule(idx, 'accommodation', e.target.value)}
                      placeholder="住宿飯店"
                      className={`h-8 text-xs ${idx > 0 ? 'pr-7' : ''}`}
                      disabled={day.sameAsPrevious}
                    />
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => updateDaySchedule(idx, 'sameAsPrevious', !day.sameAsPrevious)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                        title="續住"
                      >
                        <Check
                          size={14}
                          className={`transition-opacity ${day.sameAsPrevious ? 'text-morandi-gold opacity-100' : 'text-morandi-secondary opacity-30 hover:opacity-60'}`}
                        />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
