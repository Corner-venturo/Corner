/**
 * usePackageItinerary - 行程表對話框核心 Hook
 * 管理所有狀態和邏輯
 */

'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/stores'
import { useFlightSearch } from '@/hooks'
import { useItineraries, createItinerary } from '@/data'
import { supabase } from '@/lib/supabase/client'
import { dynamicFrom } from '@/lib/supabase/typed-client'
import type { Json } from '@/lib/supabase/types'
import type { Itinerary, ItineraryVersionRecord } from '@/stores/types'
import type { ProposalPackage, Proposal } from '@/types/proposal.types'
import type { FlightInfo } from '@/types/flight.types'
import { logger } from '@/lib/utils/logger'
import { alert } from '@/lib/ui/alert-dialog'
import { stripHtml } from '@/lib/utils/string-utils'
import { syncItineraryToQuote } from '@/lib/utils/itinerary-quote-sync'
import { isFeatureAvailable } from '@/lib/feature-restrictions'
import { toast } from 'sonner'
import type {
  ItineraryFormData,
  DailyScheduleItem,
  SimpleActivity,
  PreviewDayData,
  AccommodationStatus,
} from './types'

interface UsePackageItineraryOptions {
  isOpen: boolean
  pkg: ProposalPackage
  proposal: Proposal
  onClose: () => void
  onItineraryCreated?: (itineraryId?: string) => void
}

export function usePackageItinerary({
  isOpen,
  pkg,
  proposal,
  onClose,
  onItineraryCreated,
}: UsePackageItineraryOptions) {
  const { items: itineraries, refresh } = useItineraries()
  const create = createItinerary
  const { user: currentUser } = useAuthStore()

  // 判斷是否為國內旅遊（台灣）
  const isDomestic = useMemo(() => {
    const dest = pkg.destination?.toLowerCase() || ''
    return dest.includes('台灣') || dest.includes('taiwan') || dest === 'tw'
  }, [pkg.destination])

  // 基本狀態
  const [isCreating, setIsCreating] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [createError, setCreateError] = useState<string | null>(null)
  const [formData, setFormData] = useState<ItineraryFormData>({
    title: '',
    description: '',
    outboundFlight: null,
    returnFlight: null,
  })

  // 航班搜尋輸入 state
  const [outboundFlightNumber, setOutboundFlightNumber] = useState('')
  const [outboundFlightDate, setOutboundFlightDate] = useState('')
  const [returnFlightNumber, setReturnFlightNumber] = useState('')
  const [returnFlightDate, setReturnFlightDate] = useState('')

  // 搜尋用的臨時航班 state
  const [searchOutboundFlight, setSearchOutboundFlight] = useState<FlightInfo | null>(null)
  const [searchReturnFlight, setSearchReturnFlight] = useState<FlightInfo | null>(null)

  // 當輸入改變時，更新搜尋用 state
  useEffect(() => {
    setSearchOutboundFlight(outboundFlightNumber ? { flightNumber: outboundFlightNumber } : null)
  }, [outboundFlightNumber])

  useEffect(() => {
    setSearchReturnFlight(returnFlightNumber ? { flightNumber: returnFlightNumber } : null)
  }, [returnFlightNumber])

  // 航班查詢（使用共用 hook）
  const flightSearch = useFlightSearch({
    outboundFlight: searchOutboundFlight,
    setOutboundFlight: (flight) => {
      setFormData(prev => ({ ...prev, outboundFlight: flight }))
      setOutboundFlightNumber('')
    },
    returnFlight: searchReturnFlight,
    setReturnFlight: (flight) => {
      setFormData(prev => ({ ...prev, returnFlight: flight }))
      setReturnFlightNumber('')
    },
    departureDate: outboundFlightDate || pkg?.start_date || '',
    days: String(pkg?.days || ''),
  })

  // 版本控制狀態
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(-1)
  const [directLoadedItinerary, setDirectLoadedItinerary] = useState<Itinerary | null>(null)

  // 檢視模式：edit = 編輯模式, preview = 簡易行程表預覽
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')

  // AI 排行程狀態
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiArrivalTime, setAiArrivalTime] = useState('11:00')
  const [aiDepartureTime, setAiDepartureTime] = useState('14:00')
  const [aiTheme, setAiTheme] = useState<string>('classic')
  const showAiGenerate = isFeatureAvailable('ai_suggest', currentUser?.workspace_code)

  // 追蹤 refs
  const hasInitializedDailyScheduleRef = useRef(false)
  const loadingRef = useRef(false)
  const prevIsOpenRef = useRef(false)

  // 每日行程狀態
  const [dailySchedule, setDailySchedule] = useState<DailyScheduleItem[]>([])

  // 時間軸模式
  const [isTimelineMode, setIsTimelineMode] = useState(false)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)

  // 計算天數
  const calculateDays = useCallback(() => {
    if (!pkg.start_date || !pkg.end_date) return pkg.days || 5
    const start = new Date(pkg.start_date)
    const end = new Date(pkg.end_date)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return Math.max(1, Math.min(diffDays, 30))
  }, [pkg.start_date, pkg.end_date, pkg.days])

  // 從行程表載入每日資料
  const loadDailyDataFromItinerary = useCallback((
    itinerary: Itinerary,
    versionIndex: number,
    days: number
  ) => {
    const versionRecordsData = (itinerary.version_records || []) as ItineraryVersionRecord[]

    type DailyData = Array<{
      title?: string
      meals?: { breakfast?: string; lunch?: string; dinner?: string }
      accommodation?: string
      activities?: Array<{ id?: string; title?: string; startTime?: string; endTime?: string }>
    }>

    let dailyData: DailyData | null = null

    if (versionIndex === -1) {
      dailyData = (itinerary.daily_itinerary || []) as unknown as DailyData
    } else if (versionRecordsData[versionIndex]) {
      dailyData = (versionRecordsData[versionIndex].daily_itinerary || []) as unknown as DailyData
    }

    if (dailyData && dailyData.length > 0) {
      const loadedSchedule = dailyData.map((day, idx) => {
        const isHotelBreakfast = day.meals?.breakfast === '飯店早餐'
        const isLunchSelf = day.meals?.lunch === '敬請自理' || day.meals?.lunch === '自理'
        const isDinnerSelf = day.meals?.dinner === '敬請自理' || day.meals?.dinner === '自理'
        let sameAsPrevious = false
        if (idx > 0) {
          const prevAccommodation = dailyData![idx - 1]?.accommodation
          sameAsPrevious = Boolean(day.accommodation?.includes('同上')) ||
            Boolean(prevAccommodation && day.accommodation === prevAccommodation)
        }
        const activities = (day.activities || []).map((act, actIdx) => ({
          id: act.id || `activity-${idx}-${actIdx}`,
          title: act.title || '',
          startTime: act.startTime || '',
          endTime: act.endTime || '',
        }))
        return {
          day: idx + 1,
          route: day.title || '',
          meals: {
            breakfast: isHotelBreakfast ? '' : (day.meals?.breakfast || ''),
            lunch: isLunchSelf ? '' : (day.meals?.lunch || ''),
            dinner: isDinnerSelf ? '' : (day.meals?.dinner || ''),
          },
          accommodation: sameAsPrevious ? '' : (day.accommodation || ''),
          sameAsPrevious,
          hotelBreakfast: isHotelBreakfast,
          lunchSelf: isLunchSelf,
          dinnerSelf: isDinnerSelf,
          activities: activities.length > 0 ? activities : undefined,
        }
      })
      setDailySchedule(loadedSchedule)
      if (loadedSchedule.some(d => d.activities && d.activities.length > 0)) {
        setIsTimelineMode(true)
      }
    } else {
      setDailySchedule(Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        route: '',
        meals: { breakfast: '', lunch: '', dinner: '' },
        accommodation: '',
        sameAsPrevious: false,
        hotelBreakfast: false,
        lunchSelf: false,
        dinnerSelf: false,
        activities: undefined,
      })))
    }

    setFormData(prev => ({
      ...prev,
      title: stripHtml(itinerary.title) || prev.title,
      outboundFlight: itinerary.flight_info?.outbound || (itinerary as { outbound_flight?: FlightInfo }).outbound_flight || null,
      returnFlight: itinerary.flight_info?.return || (itinerary as { return_flight?: FlightInfo }).return_flight || null,
    }))
  }, [])

  // 載入行程表資料
  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current
    prevIsOpenRef.current = isOpen

    if (justOpened && !loadingRef.current) {
      loadingRef.current = true
      setIsDataLoading(true)
      setCreateError(null)
      setSelectedVersionIndex(-1)
      setDirectLoadedItinerary(null)
      setViewMode('edit')
      hasInitializedDailyScheduleRef.current = false
      setFormData({
        title: proposal.title || pkg.version_name,
        description: '',
        outboundFlight: null,
        returnFlight: null,
      })
      setOutboundFlightNumber('')
      setOutboundFlightDate(pkg.start_date || '')
      setReturnFlightNumber('')
      setReturnFlightDate(pkg.end_date || '')

      const loadData = async () => {
        if (pkg.itinerary_id) {
          logger.log('[PackageItineraryDialog] 直接從資料庫載入行程表:', pkg.itinerary_id)
          const { data, error } = await supabase
            .from('itineraries')
            .select('*')
            .eq('id', pkg.itinerary_id)
            .single()

          if (!error && data) {
            logger.log('[PackageItineraryDialog] 載入成功，版本數:', (data.version_records as unknown[])?.length || 0)
            setDirectLoadedItinerary(data as unknown as Itinerary)
          } else {
            logger.error('[PackageItineraryDialog] 載入失敗:', error)
          }
        }
        await refresh()
        setIsDataLoading(false)
        loadingRef.current = false
      }

      loadData()
    } else if (!isOpen) {
      loadingRef.current = false
    }
  }, [isOpen, pkg.itinerary_id, pkg.start_date, pkg.end_date, pkg.version_name, proposal.title, refresh])

  // 已關聯的行程表
  const linkedItineraries = useMemo(() => {
    logger.log(`[PackageItineraryDialog] pkg.id = ${pkg.id}, pkg.itinerary_id = ${pkg.itinerary_id}`)
    const filtered = itineraries.filter(i => {
      if (i._deleted) return false
      return i.proposal_package_id === pkg.id || (pkg.itinerary_id && i.id === pkg.itinerary_id)
    })
    return filtered
  }, [itineraries, pkg.id, pkg.itinerary_id])

  // 當資料載入完成後初始化每日行程
  useEffect(() => {
    if (!isDataLoading && isOpen && !hasInitializedDailyScheduleRef.current) {
      hasInitializedDailyScheduleRef.current = true
      const days = calculateDays()

      const itinerary = directLoadedItinerary || linkedItineraries.find(i =>
        i.id === pkg.itinerary_id || i.proposal_package_id === pkg.id
      )

      if (itinerary) {
        loadDailyDataFromItinerary(itinerary, -1, days)
      } else {
        setDailySchedule(Array.from({ length: days }, (_, i) => ({
          day: i + 1,
          route: '',
          meals: { breakfast: '', lunch: '', dinner: '' },
          accommodation: '',
          sameAsPrevious: false,
          hotelBreakfast: false,
          lunchSelf: false,
          dinnerSelf: false,
          activities: undefined,
        })))
      }
    }
  }, [isDataLoading, isOpen, directLoadedItinerary, linkedItineraries, pkg.itinerary_id, pkg.id, calculateDays, loadDailyDataFromItinerary])

  // 判斷是否為編輯模式
  const existingItinerary = useMemo(() => {
    return directLoadedItinerary || linkedItineraries.find(i =>
      i.id === pkg.itinerary_id || i.proposal_package_id === pkg.id
    )
  }, [directLoadedItinerary, linkedItineraries, pkg.itinerary_id, pkg.id])

  const isEditMode = Boolean(existingItinerary)

  // 版本記錄
  const versionRecords = useMemo(() => {
    return (existingItinerary?.version_records || []) as ItineraryVersionRecord[]
  }, [existingItinerary])

  // 處理版本切換
  const handleVersionChange = useCallback((index: number) => {
    setSelectedVersionIndex(index)
    const itinerary = directLoadedItinerary || linkedItineraries.find(i =>
      i.id === pkg.itinerary_id || i.proposal_package_id === pkg.id
    )
    if (itinerary) {
      loadDailyDataFromItinerary(itinerary, index, calculateDays())
    }
  }, [directLoadedItinerary, linkedItineraries, pkg.itinerary_id, pkg.id, calculateDays, loadDailyDataFromItinerary])

  // 更新每日行程
  const updateDaySchedule = useCallback((index: number, field: string, value: string | boolean) => {
    setDailySchedule(prev => {
      const newSchedule = [...prev]
      if (field === 'route' || field === 'accommodation') {
        newSchedule[index] = { ...newSchedule[index], [field]: value }
      } else if (field === 'sameAsPrevious' || field === 'hotelBreakfast' || field === 'lunchSelf' || field === 'dinnerSelf') {
        newSchedule[index] = { ...newSchedule[index], [field]: value as boolean }
      } else if (field.startsWith('meals.')) {
        const mealType = field.split('.')[1] as 'breakfast' | 'lunch' | 'dinner'
        newSchedule[index] = {
          ...newSchedule[index],
          meals: { ...newSchedule[index].meals, [mealType]: value as string }
        }
      }
      return newSchedule
    })
  }, [])

  // 時間軸活動操作
  const addActivity = useCallback((dayIndex: number) => {
    setDailySchedule(prev => {
      const newSchedule = [...prev]
      const activities = newSchedule[dayIndex].activities || []
      const newActivity: SimpleActivity = {
        id: `activity-${dayIndex}-${Date.now()}`,
        title: '',
        startTime: '',
        endTime: '',
      }
      newSchedule[dayIndex] = {
        ...newSchedule[dayIndex],
        activities: [...activities, newActivity],
      }
      return newSchedule
    })
  }, [])

  const removeActivity = useCallback((dayIndex: number, activityIndex: number) => {
    setDailySchedule(prev => {
      const newSchedule = [...prev]
      const activities = [...(newSchedule[dayIndex].activities || [])]
      activities.splice(activityIndex, 1)
      newSchedule[dayIndex] = {
        ...newSchedule[dayIndex],
        activities: activities.length > 0 ? activities : undefined,
      }
      return newSchedule
    })
  }, [])

  const updateActivity = useCallback((dayIndex: number, activityIndex: number, field: keyof SimpleActivity, value: string) => {
    setDailySchedule(prev => {
      const newSchedule = [...prev]
      const activities = [...(newSchedule[dayIndex].activities || [])]
      activities[activityIndex] = { ...activities[activityIndex], [field]: value }
      newSchedule[dayIndex] = {
        ...newSchedule[dayIndex],
        activities,
      }
      return newSchedule
    })
  }, [])

  // 取得前一天住宿
  const getPreviousAccommodation = useCallback((index: number): string => {
    if (index === 0) return ''
    for (let i = index - 1; i >= 0; i--) {
      if (!dailySchedule[i].sameAsPrevious && dailySchedule[i].accommodation) {
        return dailySchedule[i].accommodation
      }
    }
    return ''
  }, [dailySchedule])

  // 住宿狀態
  const getAccommodationStatus = useCallback((): AccommodationStatus => {
    const requiredDays = dailySchedule.length - 1
    let filledCount = 0
    const accommodations: string[] = []

    for (let i = 0; i < requiredDays; i++) {
      const day = dailySchedule[i]
      if (day.accommodation || day.sameAsPrevious) {
        filledCount++
        if (day.sameAsPrevious) {
          accommodations.push(accommodations[accommodations.length - 1] || '')
        } else {
          accommodations.push(day.accommodation)
        }
      } else {
        accommodations.push('')
      }
    }

    return {
      isComplete: filledCount >= requiredDays,
      filledCount,
      requiredDays,
      accommodations,
    }
  }, [dailySchedule])

  // 當前版本名稱
  const getCurrentVersionName = useCallback(() => {
    if (selectedVersionIndex === -1) {
      const firstVersion = versionRecords[0]
      return firstVersion?.note || stripHtml(existingItinerary?.title) || '主版本'
    }
    const record = versionRecords[selectedVersionIndex]
    return record?.note || `版本 ${record?.version || selectedVersionIndex + 1}`
  }, [selectedVersionIndex, versionRecords, existingItinerary])

  // 產生預覽資料
  const getPreviewDailyData = useCallback((): PreviewDayData[] => {
    return dailySchedule.map((day, idx) => {
      let dateLabel = ''
      if (pkg.start_date) {
        const date = new Date(pkg.start_date)
        date.setDate(date.getDate() + idx)
        const weekdays = ['日', '一', '二', '三', '四', '五', '六']
        dateLabel = `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`
      }
      const isFirst = idx === 0
      const isLast = idx === dailySchedule.length - 1
      const defaultTitle = isFirst ? '抵達目的地' : isLast ? '返回台灣' : `第 ${day.day} 天行程`
      const title = day.route?.trim() || defaultTitle
      const breakfast = day.hotelBreakfast ? '飯店早餐' : day.meals.breakfast
      const lunch = day.lunchSelf ? '敬請自理' : day.meals.lunch
      const dinner = day.dinnerSelf ? '敬請自理' : day.meals.dinner
      let accommodation = day.accommodation || ''
      if (day.sameAsPrevious && idx > 0) {
        for (let i = idx - 1; i >= 0; i--) {
          if (!dailySchedule[i].sameAsPrevious && dailySchedule[i].accommodation) {
            accommodation = dailySchedule[i].accommodation
            break
          }
        }
        if (!accommodation) accommodation = '續住'
      }
      return {
        dayLabel: `Day ${day.day}`,
        date: dateLabel,
        title,
        meals: { breakfast, lunch, dinner },
        accommodation: isLast ? '' : accommodation,
      }
    })
  }, [dailySchedule, pkg.start_date])

  // 列印預覽
  const handlePrintPreview = useCallback(() => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const dailyData = getPreviewDailyData()
    const companyName = currentUser?.workspace_code || '旅行社'
    const destination = pkg.destination || pkg.country_id || ''

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${formData.title || '行程表'}</title>
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
            <div>
              <div class="title">${formData.title || '行程表'}</div>
            </div>
            <div class="company">${companyName}</div>
          </div>
          <div class="info-grid">
            <div><span class="info-label">目的地：</span>${destination}</div>
            <div><span class="info-label">出發日期：</span>${pkg.start_date || '-'}</div>
            <div><span class="info-label">行程天數：</span>${dailyData.length} 天</div>
          </div>
          ${!isDomestic && (formData.outboundFlight || formData.returnFlight) ? `
          <div class="info-grid" style="margin-top: 8px;">
            ${formData.outboundFlight ? `<div><span class="info-label">去程航班：</span>${formData.outboundFlight.airline} ${formData.outboundFlight.flightNumber} (${formData.outboundFlight.departureAirport} ${formData.outboundFlight.departureTime} → ${formData.outboundFlight.arrivalAirport} ${formData.outboundFlight.arrivalTime})</div>` : ''}
            ${formData.returnFlight ? `<div><span class="info-label">回程航班：</span>${formData.returnFlight.airline} ${formData.returnFlight.flightNumber} (${formData.returnFlight.departureAirport} ${formData.returnFlight.departureTime} → ${formData.returnFlight.arrivalAirport} ${formData.returnFlight.arrivalTime})</div>` : ''}
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
  }, [getPreviewDailyData, formData.title, formData.outboundFlight, formData.returnFlight, pkg.start_date, pkg.destination, pkg.country_id, currentUser?.workspace_code, isDomestic])

  // 打開 AI 對話框
  const openAiDialog = useCallback(() => {
    if (formData.outboundFlight?.arrivalTime) {
      setAiArrivalTime(formData.outboundFlight.arrivalTime)
    }
    if (formData.returnFlight?.departureTime) {
      setAiDepartureTime(formData.returnFlight.departureTime)
    }
    setAiDialogOpen(true)
  }, [formData.outboundFlight?.arrivalTime, formData.returnFlight?.departureTime])

  // AI 生成
  const handleAiGenerate = useCallback(async () => {
    const destinationName = pkg.destination || ''
    const cityId = pkg.main_city_id || ''
    const countryId = pkg.country_id || ''

    if (!destinationName && !cityId && !countryId) {
      toast.error('請先設定目的地')
      return
    }
    if (!pkg.start_date) {
      toast.error('請先設定出發日期')
      return
    }

    const status = getAccommodationStatus()

    setAiGenerating(true)
    try {
      const numDays = dailySchedule.length

      logger.log('[AI Generate] Request:', {
        destination: destinationName,
        cityId,
        countryId,
        numDays,
        departureDate: pkg.start_date,
        theme: aiTheme,
      })

      const response = await fetch('/api/itineraries/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: destinationName,
          cityId: cityId,
          countryId: countryId,
          numDays,
          departureDate: pkg.start_date,
          arrivalTime: aiArrivalTime,
          departureTime: aiDepartureTime,
          theme: aiTheme,
          accommodations: status.isComplete ? status.accommodations : undefined,
        }),
      })

      const result = await response.json()

      logger.log('[AI Generate] API Response:', result)

      if (!response.ok) {
        throw new Error(result.error || '生成失敗')
      }

      if (result.success && result.data?.dailyItinerary) {
        interface GeneratedDay {
          title: string
          meals: { breakfast?: string; lunch?: string; dinner?: string }
          activities?: Array<{ id?: string; title: string; startTime?: string; endTime?: string }>
        }
        const newSchedule = dailySchedule.map((existingDay, index) => {
          const aiDay = result.data.dailyItinerary[index] as GeneratedDay | undefined
          if (!aiDay) return existingDay

          return {
            ...existingDay,
            route: aiDay.title || existingDay.route,
            meals: {
              breakfast: aiDay.meals?.breakfast || existingDay.meals.breakfast,
              lunch: aiDay.meals?.lunch || existingDay.meals.lunch,
              dinner: aiDay.meals?.dinner || existingDay.meals.dinner,
            },
            hotelBreakfast: aiDay.meals?.breakfast === '飯店早餐',
            activities: aiDay.activities?.map((act, actIdx) => ({
              id: act.id || `ai-${index}-${actIdx}-${Date.now()}`,
              title: act.title,
              startTime: act.startTime || '',
              endTime: act.endTime || '',
            })) || existingDay.activities,
          }
        })

        setDailySchedule(newSchedule)
        toast.success(`成功生成 ${newSchedule.length} 天行程！`)
        setAiDialogOpen(false)
      } else {
        throw new Error('生成失敗')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '生成失敗，請稍後再試')
    } finally {
      setAiGenerating(false)
    }
  }, [pkg.destination, pkg.start_date, pkg.main_city_id, pkg.country_id, aiArrivalTime, aiDepartureTime, aiTheme, dailySchedule, getAccommodationStatus])

  // 提交表單
  const handleSubmit = useCallback(async () => {
    try {
      setIsCreating(true)
      setCreateError(null)

      const formattedDailyItinerary = dailySchedule.map((day, idx) => {
        let dateLabel = ''
        if (pkg.start_date) {
          const date = new Date(pkg.start_date)
          date.setDate(date.getDate() + idx)
          const weekdays = ['日', '一', '二', '三', '四', '五', '六']
          dateLabel = `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`
        }

        const isFirst = idx === 0
        const isLast = idx === dailySchedule.length - 1
        const defaultTitle = isFirst ? '抵達目的地' : isLast ? '返回台灣' : `第 ${day.day} 天行程`
        const title = day.route?.trim() || defaultTitle
        const breakfast = day.hotelBreakfast ? '飯店早餐' : day.meals.breakfast
        let accommodation = day.accommodation || ''
        if (day.sameAsPrevious) {
          accommodation = getPreviousAccommodation(idx) || '續住'
        }

        const formattedActivities = (day.activities || []).map(act => ({
          icon: '',
          title: act.title,
          description: '',
          startTime: act.startTime,
          endTime: act.endTime,
        }))

        return {
          dayLabel: `Day ${day.day}`,
          date: dateLabel,
          title: title,
          highlight: '',
          description: '',
          activities: formattedActivities,
          recommendations: [],
          meals: {
            breakfast,
            lunch: day.meals.lunch,
            dinner: day.meals.dinner,
          },
          accommodation,
          images: [],
        }
      })

      const authorName = currentUser?.display_name || currentUser?.chinese_name || ''

      if (isEditMode && existingItinerary) {
        logger.log('更新行程表資料:', { id: existingItinerary.id, title: formData.title })

        const { error: updateError } = await supabase
          .from('itineraries')
          .update({
            title: formData.title,
            daily_itinerary: formattedDailyItinerary,
            country: pkg.country_id || '',
            city: pkg.main_city_id || '',
            outbound_flight: formData.outboundFlight ? {
              airline: formData.outboundFlight.airline,
              flightNumber: formData.outboundFlight.flightNumber,
              departureAirport: formData.outboundFlight.departureAirport,
              departureTime: formData.outboundFlight.departureTime,
              departureDate: '',
              arrivalAirport: formData.outboundFlight.arrivalAirport,
              arrivalTime: formData.outboundFlight.arrivalTime,
              duration: '',
            } : null,
            return_flight: formData.returnFlight ? {
              airline: formData.returnFlight.airline,
              flightNumber: formData.returnFlight.flightNumber,
              departureAirport: formData.returnFlight.departureAirport,
              departureTime: formData.returnFlight.departureTime,
              departureDate: '',
              arrivalAirport: formData.returnFlight.arrivalAirport,
              arrivalTime: formData.returnFlight.arrivalTime,
              duration: '',
            } : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingItinerary.id)

        if (updateError) {
          throw new Error(updateError.message)
        }

        logger.log('行程表更新成功')
        await syncItineraryToQuote(existingItinerary.id, formattedDailyItinerary, pkg.id)

        const { data: refreshedData } = await supabase
          .from('itineraries')
          .select('*')
          .eq('id', existingItinerary.id)
          .single()
        if (refreshedData) {
          setDirectLoadedItinerary(refreshedData as unknown as Itinerary)
        }

        toast.success('行程表更新成功')
        onItineraryCreated?.(existingItinerary.id)
      } else {
        const workspaceId = currentUser?.workspace_id
        if (!workspaceId) {
          throw new Error('無法取得 workspace_id，請重新登入')
        }

        const createData = {
          title: formData.title,
          tour_id: null,
          tour_code: '',
          status: '提案',
          author_name: authorName,
          departure_date: pkg.start_date || '',
          country: pkg.country_id || '',
          city: pkg.main_city_id || '',
          daily_itinerary: formattedDailyItinerary,
          description: formData.description,
          cover_image: '',
          features: [],
          focus_cards: [],
          proposal_package_id: pkg.id,
          workspace_id: workspaceId,
          outbound_flight: formData.outboundFlight ? {
            airline: formData.outboundFlight.airline,
            flightNumber: formData.outboundFlight.flightNumber,
            departureAirport: formData.outboundFlight.departureAirport,
            departureTime: formData.outboundFlight.departureTime,
            departureDate: '',
            arrivalAirport: formData.outboundFlight.arrivalAirport,
            arrivalTime: formData.outboundFlight.arrivalTime,
            duration: '',
          } : null,
          return_flight: formData.returnFlight ? {
            airline: formData.returnFlight.airline,
            flightNumber: formData.returnFlight.flightNumber,
            departureAirport: formData.returnFlight.departureAirport,
            departureTime: formData.returnFlight.departureTime,
            departureDate: '',
            arrivalAirport: formData.returnFlight.arrivalAirport,
            arrivalTime: formData.returnFlight.arrivalTime,
            duration: '',
          } : null,
        }

        logger.log('建立行程表資料:', JSON.stringify(createData, null, 2))

        const newItinerary = await create(createData as unknown as Omit<Itinerary, 'id' | 'created_at' | 'updated_at'>)

        if (newItinerary?.id) {
          logger.log('行程表建立成功:', newItinerary.id)

          await dynamicFrom('proposal_packages')
            .update({
              itinerary_id: newItinerary.id,
              itinerary_type: 'simple',
            })
            .eq('id', pkg.id)

          await alert('行程表建立成功', 'success')
          onItineraryCreated?.(newItinerary.id)
          onClose()
        } else {
          setCreateError('建立失敗：未取得行程表 ID')
        }
      }
    } catch (error) {
      let errorMessage = '未知錯誤'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (error && typeof error === 'object') {
        const supabaseError = error as { message?: string; code?: string; details?: string }
        errorMessage = supabaseError.message || supabaseError.code || supabaseError.details || JSON.stringify(error)
      }
      logger.error('建立行程表失敗:', JSON.stringify(error, null, 2))
      setCreateError(errorMessage)
      void alert(`建立失敗: ${errorMessage}`, 'error')
    } finally {
      setIsCreating(false)
    }
  }, [dailySchedule, pkg, formData, isEditMode, existingItinerary, currentUser, getPreviousAccommodation, onItineraryCreated, onClose, create])

  // 另存新版本
  const handleSaveAsNewVersion = useCallback(async () => {
    if (!existingItinerary?.id) {
      await alert('請先儲存行程表才能另存新版本', 'warning')
      return
    }

    setIsCreating(true)
    try {
      const formattedDailyItinerary = dailySchedule.map((day, idx) => {
        let dateLabel = ''
        if (pkg.start_date) {
          const date = new Date(pkg.start_date)
          date.setDate(date.getDate() + idx)
          const weekdays = ['日', '一', '二', '三', '四', '五', '六']
          dateLabel = `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`
        }

        const isFirst = idx === 0
        const isLast = idx === dailySchedule.length - 1
        const defaultTitle = isFirst ? '抵達目的地' : isLast ? '返回台灣' : `第 ${day.day} 天行程`
        const title = day.route?.trim() || defaultTitle
        const breakfast = day.hotelBreakfast ? '飯店早餐' : day.meals.breakfast
        const lunch = day.lunchSelf ? '敬請自理' : day.meals.lunch
        const dinner = day.dinnerSelf ? '敬請自理' : day.meals.dinner
        let accommodation = day.accommodation || ''
        if (day.sameAsPrevious) {
          accommodation = getPreviousAccommodation(idx) || '續住'
        }

        const formattedActivities = (day.activities || []).map(act => ({
          icon: '',
          title: act.title,
          description: '',
          startTime: act.startTime,
          endTime: act.endTime,
        }))

        return {
          dayLabel: `Day ${day.day}`,
          date: dateLabel,
          title: title,
          highlight: '',
          description: '',
          activities: formattedActivities,
          recommendations: [],
          meals: { breakfast, lunch, dinner },
          accommodation: day.sameAsPrevious ? `同上 (${getPreviousAccommodation(idx) || ''})` : accommodation,
          isSameAccommodation: day.sameAsPrevious || false,
          images: [],
        }
      })

      const newVersion: ItineraryVersionRecord = {
        id: crypto.randomUUID(),
        version: versionRecords.length + 1,
        note: `版本 ${versionRecords.length + 1}`,
        daily_itinerary: formattedDailyItinerary,
        features: existingItinerary.features || [],
        focus_cards: existingItinerary.focus_cards || [],
        leader: existingItinerary.leader,
        meeting_info: existingItinerary.meeting_info,
        hotels: existingItinerary.hotels,
        created_at: new Date().toISOString(),
      }

      const updatedRecords = [...versionRecords, newVersion]

      const { error } = await supabase
        .from('itineraries')
        .update({
          version_records: updatedRecords as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingItinerary.id)

      if (error) throw error

      setDirectLoadedItinerary(prev => prev ? { ...prev, version_records: updatedRecords } : null)
      setSelectedVersionIndex(updatedRecords.length - 1)

      toast.success('已另存為新版本')
      onItineraryCreated?.(existingItinerary.id)
    } catch (error) {
      logger.error('另存新版本失敗:', error)
      toast.error('另存新版本失敗：' + (error instanceof Error ? error.message : '未知錯誤'))
    } finally {
      setIsCreating(false)
    }
  }, [existingItinerary, dailySchedule, versionRecords, pkg.start_date, getPreviousAccommodation, onItineraryCreated])

  return {
    // 狀態
    isDataLoading,
    isCreating,
    createError,
    formData,
    setFormData,
    viewMode,
    setViewMode,
    isDomestic,
    isEditMode,
    existingItinerary,
    currentUser,

    // 航班相關
    outboundFlightNumber,
    setOutboundFlightNumber,
    outboundFlightDate,
    setOutboundFlightDate,
    returnFlightNumber,
    setReturnFlightNumber,
    returnFlightDate,
    setReturnFlightDate,
    flightSearch,

    // 版本控制
    selectedVersionIndex,
    versionRecords,
    handleVersionChange,
    getCurrentVersionName,

    // 每日行程
    dailySchedule,
    updateDaySchedule,
    calculateDays,
    getPreviousAccommodation,

    // 時間軸
    isTimelineMode,
    setIsTimelineMode,
    selectedDayIndex,
    setSelectedDayIndex,
    addActivity,
    removeActivity,
    updateActivity,

    // AI 相關
    showAiGenerate,
    aiDialogOpen,
    setAiDialogOpen,
    aiGenerating,
    aiArrivalTime,
    setAiArrivalTime,
    aiDepartureTime,
    setAiDepartureTime,
    aiTheme,
    setAiTheme,
    openAiDialog,
    handleAiGenerate,
    getAccommodationStatus,

    // 預覽
    getPreviewDailyData,
    handlePrintPreview,

    // 提交
    handleSubmit,
    handleSaveAsNewVersion,
  }
}
