/**
 * PackageItineraryDialog - 提案套件行程表對話框
 * 功能：建立新行程表 / 查看已關聯行程表
 */

'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Loader2, Save, AlertCircle, X, Plane, Search, Trash2, FilePlus, History, ChevronDown, Wand2, Sparkles, Eye, Edit2, Printer, Clock, Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DatePicker } from '@/components/ui/date-picker'
import { searchFlightAction } from '@/features/dashboard/actions/flight-actions'
import { useAuthStore } from '@/stores'
import { useItineraries, createItinerary } from '@/data'
import { supabase } from '@/lib/supabase/client'
import { dynamicFrom } from '@/lib/supabase/typed-client'
import type { Json } from '@/lib/supabase/types'
import type { Itinerary, ItineraryVersionRecord } from '@/stores/types'
import type { ProposalPackage, Proposal } from '@/types/proposal.types'
import type { Activity } from '@/components/editor/tour-form/types'
import { logger } from '@/lib/utils/logger'
import { alert } from '@/lib/ui/alert-dialog'
import { stripHtml } from '@/lib/utils/string-utils'
import { syncItineraryToQuote } from '@/lib/utils/itinerary-quote-sync'
import { isFeatureAvailable } from '@/lib/feature-restrictions'
import { toast } from 'sonner'
import type { FlightInfo } from '@/types/flight.types'

interface ItineraryFormData {
  title: string
  description: string
  outboundFlight: FlightInfo | null
  returnFlight: FlightInfo | null
}

interface PackageItineraryDialogProps {
  isOpen: boolean
  onClose: () => void
  pkg: ProposalPackage
  proposal: Proposal
  onItineraryCreated?: (itineraryId?: string) => void
}

export function PackageItineraryDialog({
  isOpen,
  onClose,
  pkg,
  proposal,
  onItineraryCreated,
}: PackageItineraryDialogProps) {
  const { items: itineraries, refresh } = useItineraries()
  const create = createItinerary
  const { user: currentUser } = useAuthStore()

  // 判斷是否為國內旅遊（台灣）- 國內旅遊不顯示航班資訊
  const isDomestic = useMemo(() => {
    const dest = pkg.destination?.toLowerCase() || ''
    return dest.includes('台灣') || dest.includes('taiwan') || dest === 'tw'
  }, [pkg.destination])

  const [isCreating, setIsCreating] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [createError, setCreateError] = useState<string | null>(null)
  const [formData, setFormData] = useState<ItineraryFormData>({
    title: '',
    description: '',
    outboundFlight: null,
    returnFlight: null,
  })
  // 航班查詢狀態
  const [outboundFlightNumber, setOutboundFlightNumber] = useState('')
  const [outboundFlightDate, setOutboundFlightDate] = useState('')
  const [returnFlightNumber, setReturnFlightNumber] = useState('')
  const [returnFlightDate, setReturnFlightDate] = useState('')
  const [searchingOutbound, setSearchingOutbound] = useState(false)
  const [searchingReturn, setSearchingReturn] = useState(false)
  const [flightSearchError, setFlightSearchError] = useState<{ outbound?: string; return?: string }>({})
  // 多航段選擇狀態
  const [outboundSegments, setOutboundSegments] = useState<FlightInfo[]>([])
  const [returnSegments, setReturnSegments] = useState<FlightInfo[]>([])

  // 版本控制狀態
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(-1) // -1 = 主版本
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

  // AI 主題選項
  const AI_THEMES = [
    { value: 'classic', label: '經典景點', description: '必訪名勝、熱門打卡點' },
    { value: 'foodie', label: '美食探索', description: '在地美食、特色餐廳' },
    { value: 'culture', label: '文青之旅', description: '文化體驗、藝術展覽' },
    { value: 'nature', label: '自然風光', description: '山林步道、自然景觀' },
    { value: 'family', label: '親子同樂', description: '適合全家的輕鬆行程' },
    { value: 'relax', label: '悠閒慢旅', description: '不趕行程、深度體驗' },
  ]

  // 追蹤是否已初始化每日行程（防止無限迴圈）
  const hasInitializedDailyScheduleRef = React.useRef(false)
  // 追蹤是否已開始載入（防止重複載入）
  const loadingRef = React.useRef(false)
  // 追蹤上次開啟的 dialog 狀態
  const prevIsOpenRef = React.useRef(false)

  // 載入行程表資料
  useEffect(() => {
    // 只在 dialog 從關閉變成開啟時執行
    const justOpened = isOpen && !prevIsOpenRef.current
    prevIsOpenRef.current = isOpen

    if (justOpened && !loadingRef.current) {
      loadingRef.current = true
      // 先重置狀態，顯示載入中
      setIsDataLoading(true)
      setCreateError(null)
      setSelectedVersionIndex(-1)
      setDirectLoadedItinerary(null)
      setViewMode('edit') // 重置為編輯模式
      hasInitializedDailyScheduleRef.current = false // 重置初始化標記
      setFormData({
        title: proposal.title || pkg.version_name,
        description: '',
        outboundFlight: null,
        returnFlight: null,
      })
      // 設定預設航班日期
      setOutboundFlightDate(pkg.start_date || '')
      setReturnFlightDate(pkg.end_date || '')
      setOutboundFlightNumber('')
      setReturnFlightNumber('')
      setFlightSearchError({})

      // 如果有 itinerary_id，直接從資料庫載入
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
        // 同時也更新 SWR 快取
        await refresh()
        setIsDataLoading(false)
        loadingRef.current = false
      }

      loadData()
    } else if (!isOpen) {
      // dialog 關閉時重置載入狀態
      loadingRef.current = false
    }
   
  }, [isOpen])

  // 已關聯此套件的行程表
  const linkedItineraries = useMemo(() => {
    // Debug: 詳細追蹤行程表資料
    logger.log(`[PackageItineraryDialog] pkg.id = ${pkg.id}, pkg.itinerary_id = ${pkg.itinerary_id}`)
    logger.log(`[PackageItineraryDialog] 共 ${itineraries.length} 個行程表`)

    // 同時用 proposal_package_id 和 pkg.itinerary_id 來找行程表
    const filtered = itineraries.filter(i => {
      if (i._deleted) return false
      // 符合 proposal_package_id 或者符合 pkg.itinerary_id
      return i.proposal_package_id === pkg.id || (pkg.itinerary_id && i.id === pkg.itinerary_id)
    })

    logger.log(`[PackageItineraryDialog] 篩選後找到 ${filtered.length} 個行程表`)

    return filtered
  }, [itineraries, pkg.id, pkg.itinerary_id])

  // 計算天數
  const calculateDays = () => {
    if (!pkg.start_date || !pkg.end_date) return pkg.days || 5
    const start = new Date(pkg.start_date)
    const end = new Date(pkg.end_date)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return Math.max(1, Math.min(diffDays, 30))
  }

  // 簡化版活動類型（只包含時間軸需要的欄位）
  interface SimpleActivity {
    id: string
    title: string
    startTime?: string  // 格式 "0900"
    endTime?: string    // 格式 "1030"
  }

  const [dailySchedule, setDailySchedule] = useState<Array<{
    day: number
    route: string
    meals: { breakfast: string; lunch: string; dinner: string }
    accommodation: string
    sameAsPrevious: boolean
    hotelBreakfast: boolean
    activities?: SimpleActivity[]  // 時間軸活動
  }>>([])

  // 時間軸模式切換
  const [isTimelineMode, setIsTimelineMode] = useState(false)
  // 時間軸模式下選中的天數（分頁用）
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)

  // 從行程表或版本記錄載入每日行程（直接函數，不用 useCallback）
  const loadDailyDataFromItinerary = (
    itinerary: Itinerary,
    versionIndex: number,
    days: number
  ) => {
    // 根據版本索引決定從哪裡讀取資料
    const versionRecordsData = (itinerary.version_records || []) as ItineraryVersionRecord[]

    type DailyData = Array<{
      title?: string
      meals?: { breakfast?: string; lunch?: string; dinner?: string }
      accommodation?: string
      activities?: Array<{ id?: string; title?: string; startTime?: string; endTime?: string }>
    }>

    let dailyData: DailyData | null = null

    if (versionIndex === -1) {
      // 主版本：從行程表的 daily_itinerary 讀取
      dailyData = (itinerary.daily_itinerary || []) as unknown as DailyData
    } else if (versionRecordsData[versionIndex]) {
      // 特定版本：從版本記錄讀取
      dailyData = (versionRecordsData[versionIndex].daily_itinerary || []) as unknown as DailyData
    }

    if (dailyData && dailyData.length > 0) {
      const loadedSchedule = dailyData.map((day, idx) => {
        const isHotelBreakfast = day.meals?.breakfast === '飯店早餐'
        let sameAsPrevious = false
        if (idx > 0 && dailyData![idx - 1]?.accommodation) {
          sameAsPrevious = day.accommodation === dailyData![idx - 1].accommodation
        }
        // 載入活動（如果有的話）
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
            lunch: day.meals?.lunch || '',
            dinner: day.meals?.dinner || '',
          },
          accommodation: sameAsPrevious ? '' : (day.accommodation || ''),
          sameAsPrevious,
          hotelBreakfast: isHotelBreakfast,
          activities: activities.length > 0 ? activities : undefined,
        }
      })
      setDailySchedule(loadedSchedule)
      // 如果有任何一天有活動，自動開啟時間軸模式
      if (loadedSchedule.some(d => d.activities && d.activities.length > 0)) {
        setIsTimelineMode(true)
      }
    } else {
      // 使用傳入的天數初始化
      setDailySchedule(Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        route: '',
        meals: { breakfast: '', lunch: '', dinner: '' },
        accommodation: '',
        sameAsPrevious: false,
        hotelBreakfast: false,
        activities: undefined,
      })))
    }

    // 更新表單標題和航班資訊
    setFormData(prev => ({
      ...prev,
      title: stripHtml(itinerary.title) || prev.title,
      outboundFlight: itinerary.flight_info?.outbound || (itinerary as { outbound_flight?: FlightInfo }).outbound_flight || null,
      returnFlight: itinerary.flight_info?.return || (itinerary as { return_flight?: FlightInfo }).return_flight || null,
    }))
  }

  // 當資料載入完成後初始化每日行程（只執行一次）
  useEffect(() => {
    // 防止重複初始化導致無限迴圈
    if (!isDataLoading && isOpen && !hasInitializedDailyScheduleRef.current) {
      hasInitializedDailyScheduleRef.current = true
      const days = calculateDays()

      // 優先使用直接載入的行程表
      const itinerary = directLoadedItinerary || linkedItineraries.find(i =>
        i.id === pkg.itinerary_id || i.proposal_package_id === pkg.id
      )

      if (itinerary) {
        loadDailyDataFromItinerary(itinerary, -1, days) // 初始載入主版本
      } else {
        setDailySchedule(Array.from({ length: days }, (_, i) => ({
          day: i + 1,
          route: '',
          meals: { breakfast: '', lunch: '', dinner: '' },
          accommodation: '',
          sameAsPrevious: false,
          hotelBreakfast: false,
          activities: undefined,
        })))
      }
    }

  }, [isDataLoading, isOpen, directLoadedItinerary])

  // 處理版本切換
  const handleVersionChange = (index: number) => {
    setSelectedVersionIndex(index)
    const itinerary = directLoadedItinerary || linkedItineraries.find(i =>
      i.id === pkg.itinerary_id || i.proposal_package_id === pkg.id
    )
    if (itinerary) {
      loadDailyDataFromItinerary(itinerary, index, calculateDays())
    }
  }

  // 更新每日行程
  const updateDaySchedule = (index: number, field: string, value: string | boolean) => {
    setDailySchedule(prev => {
      const newSchedule = [...prev]
      if (field === 'route' || field === 'accommodation') {
        newSchedule[index] = { ...newSchedule[index], [field]: value }
      } else if (field === 'sameAsPrevious' || field === 'hotelBreakfast') {
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
  }

  // 時間軸模式：新增活動
  const addActivity = (dayIndex: number) => {
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
  }

  // 時間軸模式：移除活動
  const removeActivity = (dayIndex: number, activityIndex: number) => {
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
  }

  // 時間軸模式：更新活動
  const updateActivity = (dayIndex: number, activityIndex: number, field: keyof SimpleActivity, value: string) => {
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
  }

  // 將 FlightData 轉換為 FlightInfo
  const flightDataToInfo = (data: { flightNumber: string; airline: string; departure: { iata: string; time: string }; arrival: { iata: string; time: string } }): FlightInfo => ({
    flightNumber: data.flightNumber,
    airline: data.airline,
    departureAirport: data.departure.iata,
    arrivalAirport: data.arrival.iata,
    departureTime: data.departure.time,
    arrivalTime: data.arrival.time,
  })

  // 查詢去程航班
  const handleSearchOutboundFlight = useCallback(async () => {
    if (!outboundFlightNumber.trim() || !outboundFlightDate) {
      setFlightSearchError(prev => ({ ...prev, outbound: '請輸入航班號碼和日期' }))
      return
    }
    setSearchingOutbound(true)
    setFlightSearchError(prev => ({ ...prev, outbound: undefined }))
    setOutboundSegments([]) // 清空之前的航段選擇
    try {
      const result = await searchFlightAction(outboundFlightNumber.trim(), outboundFlightDate)
      if (result.error) {
        setFlightSearchError(prev => ({ ...prev, outbound: result.error }))
      } else if (result.segments && result.segments.length > 1) {
        // 多航段：顯示選擇器
        setOutboundSegments(result.segments.map(flightDataToInfo))
      } else if (result.data) {
        // 單一航段：直接設定
        setFormData(prev => ({
          ...prev,
          outboundFlight: flightDataToInfo(result.data!),
        }))
        setOutboundFlightNumber('')
        // 顯示警告（如果資料不完整）
        if (result.warning) {
          setFlightSearchError(prev => ({ ...prev, outbound: result.warning }))
        }
      }
    } finally {
      setSearchingOutbound(false)
    }
  }, [outboundFlightNumber, outboundFlightDate])

  // 選擇去程航段
  const handleSelectOutboundSegment = (segment: FlightInfo) => {
    setFormData(prev => ({ ...prev, outboundFlight: segment }))
    setOutboundSegments([])
    setOutboundFlightNumber('')
  }

  // 查詢回程航班
  const handleSearchReturnFlight = useCallback(async () => {
    if (!returnFlightNumber.trim() || !returnFlightDate) {
      setFlightSearchError(prev => ({ ...prev, return: '請輸入航班號碼和日期' }))
      return
    }
    setSearchingReturn(true)
    setFlightSearchError(prev => ({ ...prev, return: undefined }))
    setReturnSegments([]) // 清空之前的航段選擇
    try {
      const result = await searchFlightAction(returnFlightNumber.trim(), returnFlightDate)
      if (result.error) {
        setFlightSearchError(prev => ({ ...prev, return: result.error }))
      } else if (result.segments && result.segments.length > 1) {
        // 多航段：顯示選擇器
        setReturnSegments(result.segments.map(flightDataToInfo))
      } else if (result.data) {
        // 單一航段：直接設定
        setFormData(prev => ({
          ...prev,
          returnFlight: flightDataToInfo(result.data!),
        }))
        setReturnFlightNumber('')
        // 顯示警告（如果資料不完整）
        if (result.warning) {
          setFlightSearchError(prev => ({ ...prev, return: result.warning }))
        }
      }
    } finally {
      setSearchingReturn(false)
    }
  }, [returnFlightNumber, returnFlightDate])

  // 選擇回程航段
  const handleSelectReturnSegment = (segment: FlightInfo) => {
    setFormData(prev => ({ ...prev, returnFlight: segment }))
    setReturnSegments([])
    setReturnFlightNumber('')
  }

  // 檢查住宿是否填寫完整（AI 排行程前置條件）
  const getAccommodationStatus = useCallback(() => {
    const requiredDays = dailySchedule.length - 1 // 最後一天不需要住宿
    let filledCount = 0
    const accommodations: string[] = []

    for (let i = 0; i < requiredDays; i++) {
      const day = dailySchedule[i]
      if (day.accommodation || day.sameAsPrevious) {
        filledCount++
        // 取得實際住宿名稱
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

  // 打開 AI 排行程對話框
  const openAiDialog = useCallback(() => {
    // 移除住宿檢查限制，改為在 AI 對話框中讓用戶選擇住宿城市
    // const status = getAccommodationStatus()
    // if (!status.isComplete) {
    //   toast.error(`請先填寫住宿（已填 ${status.filledCount}/${status.requiredDays} 天）`)
    //   return
    // }

    // 嘗試從航班帶入時間
    if (formData.outboundFlight?.arrivalTime) {
      setAiArrivalTime(formData.outboundFlight.arrivalTime)
    }
    if (formData.returnFlight?.departureTime) {
      setAiDepartureTime(formData.returnFlight.departureTime)
    }

    setAiDialogOpen(true)
  }, [formData.outboundFlight?.arrivalTime, formData.returnFlight?.departureTime])

  // AI 排行程生成
  const handleAiGenerate = useCallback(async () => {
    // 取得目的地：優先使用 destination，其次是 main_city_id 或 country_id
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

    // 移除住宿檢查限制，改為可選
    const status = getAccommodationStatus()

    setAiGenerating(true)
    try {
      const numDays = dailySchedule.length

      // Debug: 顯示發送的資料
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
          cityId: cityId,           // 新增：直接傳城市 ID
          countryId: countryId,     // 新增：傳國家 ID
          numDays,
          departureDate: pkg.start_date,
          arrivalTime: aiArrivalTime,
          departureTime: aiDepartureTime,
          theme: aiTheme,
          accommodations: status.isComplete ? status.accommodations : undefined, // 住宿變為可選
        }),
      })

      const result = await response.json()

      // Debug: 顯示 API 回應
      logger.log('[AI Generate] API Response:', result)
      logger.log('[AI Generate] Generated by:', result.data?.generatedBy)

      if (!response.ok) {
        throw new Error(result.error || '生成失敗')
      }

      if (result.success && result.data?.dailyItinerary) {
        // 轉換 AI 結果為 dailySchedule 格式，保留原有住宿資訊
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
            // 保留原有住宿，不覆蓋
            // 如果 AI 回傳活動，也填入
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
  }, [pkg.destination, pkg.start_date, aiArrivalTime, aiDepartureTime, aiTheme, dailySchedule, getAccommodationStatus])

  // 產生簡易行程表的每日資料（用於預覽和列印）
  const getPreviewDailyData = useCallback(() => {
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
      let accommodation = day.accommodation || ''
      if (day.sameAsPrevious && idx > 0) {
        // 往前找到實際填寫的住宿
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
        meals: { breakfast, lunch: day.meals.lunch, dinner: day.meals.dinner },
        accommodation: isLast ? '' : accommodation,
      }
    })
  }, [dailySchedule, pkg.start_date])

  // 列印簡易行程表
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
          .subtitle { font-size: 14px; color: #8b8680; }
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

  // 取得前一天的住宿（用於續住顯示）
  const getPreviousAccommodation = (index: number): string => {
    if (index === 0) return ''
    // 往前找到實際填寫的住宿
    for (let i = index - 1; i >= 0; i--) {
      if (!dailySchedule[i].sameAsPrevious && dailySchedule[i].accommodation) {
        return dailySchedule[i].accommodation
      }
    }
    return ''
  }

  // 判斷是否為編輯模式（用 proposal_package_id 找已存在的行程表）
  // 優先使用直接載入的行程表
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

  // 取得當前版本名稱
  const getCurrentVersionName = useCallback(() => {
    if (selectedVersionIndex === -1) {
      const firstVersion = versionRecords[0]
      return firstVersion?.note || stripHtml(existingItinerary?.title) || '主版本'
    }
    const record = versionRecords[selectedVersionIndex]
    return record?.note || `版本 ${record?.version || selectedVersionIndex + 1}`
  }, [selectedVersionIndex, versionRecords, existingItinerary])

  // 建立或更新行程表
  const handleSubmit = async () => {
    try {
      setIsCreating(true)
      setCreateError(null)

      // 轉換每日行程格式
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

        // 處理早餐：若勾選「飯店早餐」則填入固定文字
        const breakfast = day.hotelBreakfast ? '飯店早餐' : day.meals.breakfast

        // 處理住宿：若勾選「續住」則使用前一天的住宿
        let accommodation = day.accommodation || ''
        if (day.sameAsPrevious) {
          accommodation = getPreviousAccommodation(idx) || '續住'
        }

        // 轉換活動格式
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
        // 更新現有行程表
        logger.log('更新行程表資料:', {
          id: existingItinerary.id,
          title: formData.title,
        })

        const { error: updateError } = await supabase
          .from('itineraries')
          .update({
            title: formData.title,
            daily_itinerary: formattedDailyItinerary,
            country: pkg.country_id || '',
            city: pkg.main_city_id || '',
            // 同時存到 outbound_flight 和 return_flight（行程編輯器使用的格式）
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

        // 同步餐食/住宿資料到關聯的報價單
        await syncItineraryToQuote(existingItinerary.id, formattedDailyItinerary, pkg.id)

        // 重新載入資料以確保 UI 顯示最新狀態
        const { data: refreshedData } = await supabase
          .from('itineraries')
          .select('*')
          .eq('id', existingItinerary.id)
          .single()
        if (refreshedData) {
          setDirectLoadedItinerary(refreshedData as unknown as Itinerary)
        }

        // 使用 toast 通知，不關閉對話框讓用戶可以繼續編輯
        toast.success('行程表更新成功')
        onItineraryCreated?.(existingItinerary.id)
      } else {
        // 建立新行程表（同時存到兩種航班格式以確保相容性）
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
          // 航班資訊存到 outbound_flight 和 return_flight 欄位
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

        logger.log('建立行程表資料 (完整):', JSON.stringify(createData, null, 2))
        logger.log('proposal_package_id 確認:', pkg.id)

        const newItinerary = await create(createData as unknown as Omit<Itinerary, 'id' | 'created_at' | 'updated_at'>)

        logger.log('建立結果:', newItinerary ? JSON.stringify({
          id: newItinerary.id,
          proposal_package_id: (newItinerary as Itinerary & { proposal_package_id?: string }).proposal_package_id,
          title: newItinerary.title,
        }) : 'null')

        if (newItinerary?.id) {
          logger.log('行程表建立成功:', newItinerary.id)

          // 驗證資料庫中是否有 proposal_package_id
          const { data: dbItinerary, error: fetchError } = await supabase
            .from('itineraries')
            .select('id, proposal_package_id, title')
            .eq('id', newItinerary.id)
            .single()

          if (fetchError) {
            logger.error('查詢剛建立的行程表失敗:', fetchError)
          } else {
            logger.log('資料庫中的行程表:', JSON.stringify(dbItinerary))
            logger.log('資料庫 proposal_package_id:', dbItinerary?.proposal_package_id)
          }

          // 更新套件關聯（只設置 itinerary_id 和 itinerary_type，保留 timeline_data）

          await dynamicFrom('proposal_packages')
            .update({
              itinerary_id: newItinerary.id,
              itinerary_type: 'simple',
              // 注意：不清除 timeline_data，保留快速行程表資料
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
      // 處理不同類型的錯誤
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
  }

  // 另存新版本
  const handleSaveAsNewVersion = async () => {
    if (!existingItinerary?.id) {
      await alert('請先儲存行程表才能另存新版本', 'warning')
      return
    }

    setIsCreating(true)
    try {
      // 準備每日行程格式
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

        // 轉換活動格式
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
          meals: { breakfast, lunch: day.meals.lunch, dinner: day.meals.dinner },
          accommodation,
          images: [],
        }
      })

      // 建立新版本記錄
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

      // 更新行程表
      const { error } = await supabase
        .from('itineraries')
        .update({
          version_records: updatedRecords as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingItinerary.id)

      if (error) throw error

      // 更新本地狀態
      setDirectLoadedItinerary(prev => prev ? { ...prev, version_records: updatedRecords } : null)
      setSelectedVersionIndex(updatedRecords.length - 1)

      // 使用 toast 通知，不關閉對話框
      toast.success('已另存為新版本')
      onItineraryCreated?.(existingItinerary.id)
    } catch (error) {
      logger.error('另存新版本失敗:', error)
      toast.error('另存新版本失敗：' + (error instanceof Error ? error.message : '未知錯誤'))
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
    {/* 主對話框：使用 level={2}（作為子 Dialog 使用） */}
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent level={2} className="max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 載入中 */}
        {isDataLoading ? (
          <div className="h-64 flex items-center justify-center">
            <VisuallyHidden>
              <DialogTitle>載入中...</DialogTitle>
            </VisuallyHidden>
            <Loader2 className="w-6 h-6 animate-spin text-morandi-gold" />
          </div>
        ) : viewMode === 'preview' ? (
          /* 預覽模式：簡易行程表 */
          <div className="flex flex-col h-full max-h-[80vh]">
            <DialogHeader className="flex-shrink-0 flex flex-row items-center justify-between mb-4">
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-morandi-gold" />
                簡易行程表
                <span className="text-sm font-normal text-morandi-secondary">
                  - {formData.title || proposal.title}
                </span>
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode('edit')}
                  className="h-7 text-[11px] gap-1"
                >
                  <Edit2 size={12} />
                  編輯
                </Button>
                <Button
                  size="sm"
                  onClick={handlePrintPreview}
                  className="h-7 text-[11px] gap-1 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                >
                  <Printer size={12} />
                  列印
                </Button>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto border border-border rounded-lg bg-card p-6">
              {/* 標題區 */}
              <div className="border-b-2 border-morandi-gold pb-4 mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-morandi-primary mb-1">
                      {formData.title || '行程表'}
                    </h1>
                  </div>
                  <div className="text-right text-sm text-morandi-secondary">
                    <p className="font-semibold text-morandi-gold">{currentUser?.workspace_code || '旅行社'}</p>
                  </div>
                </div>

                {/* 基本資訊 */}
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div className="flex gap-2">
                    <span className="text-morandi-secondary">目的地：</span>
                    <span className="font-medium">{pkg.destination || pkg.country_id || '-'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-morandi-secondary">出發日期：</span>
                    <span className="font-medium">{pkg.start_date || '-'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-morandi-secondary">行程天數：</span>
                    <span className="font-medium">{dailySchedule.length} 天</span>
                  </div>
                </div>

                {/* 航班資訊 */}
                {!isDomestic && (formData.outboundFlight || formData.returnFlight) && (
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    {formData.outboundFlight && (
                      <div className="flex gap-2">
                        <span className="text-morandi-secondary">去程航班：</span>
                        <span className="font-medium">
                          {formData.outboundFlight.airline} {formData.outboundFlight.flightNumber}
                          <span className="text-morandi-secondary ml-1">
                            ({formData.outboundFlight.departureAirport} {formData.outboundFlight.departureTime} → {formData.outboundFlight.arrivalAirport} {formData.outboundFlight.arrivalTime})
                          </span>
                        </span>
                      </div>
                    )}
                    {formData.returnFlight && (
                      <div className="flex gap-2">
                        <span className="text-morandi-secondary">回程航班：</span>
                        <span className="font-medium">
                          {formData.returnFlight.airline} {formData.returnFlight.flightNumber}
                          <span className="text-morandi-secondary ml-1">
                            ({formData.returnFlight.departureAirport} {formData.returnFlight.departureTime} → {formData.returnFlight.arrivalAirport} {formData.returnFlight.arrivalTime})
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 每日行程表格 */}
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
                  {getPreviewDailyData().map((day, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-card' : 'bg-morandi-container/20'}>
                      <td className="border border-morandi-container px-3 py-2">
                        <div className="font-semibold text-morandi-gold">{day.dayLabel}</div>
                        <div className="text-xs text-morandi-secondary">{day.date}</div>
                      </td>
                      <td className="border border-morandi-container px-3 py-2">
                        <div className="font-medium">{day.title}</div>
                      </td>
                      <td className="border border-morandi-container px-3 py-2 text-center text-xs">
                        {day.meals.breakfast || '-'}
                      </td>
                      <td className="border border-morandi-container px-3 py-2 text-center text-xs">
                        {day.meals.lunch || '-'}
                      </td>
                      <td className="border border-morandi-container px-3 py-2 text-center text-xs">
                        {day.meals.dinner || '-'}
                      </td>
                      <td className="border border-morandi-container px-3 py-2 text-xs">
                        {day.accommodation || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 頁尾 */}
              <div className="mt-6 pt-4 border-t border-morandi-container text-xs text-morandi-secondary text-center">
                <p>本行程表由 {currentUser?.workspace_code || '旅行社'} 提供</p>
              </div>
            </div>
          </div>
        ) : (
          /* 編輯模式 */
          <div className="flex h-full max-h-[80vh]">
            {/* 左側：基本資訊 */}
            <div className="w-1/2 pr-6 border-r border-border overflow-y-auto">
              <DialogHeader className="mb-4">
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-morandi-gold" />
                  {isEditMode ? '編輯行程表' : '建立行程表'}
                  <span className="text-sm font-normal text-morandi-secondary">
                    {pkg.version_name} - {proposal.title}
                  </span>
                  {/* 預覽按鈕 */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode('preview')}
                    className="ml-auto h-6 px-2 text-[10px] gap-1"
                  >
                    <Eye size={10} />
                    預覽
                  </Button>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-morandi-primary">行程標題 *</Label>
                  <Input
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="行程表標題"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-morandi-primary">目的地</Label>
                    <Input
                      value={pkg.country_id && pkg.main_city_id
                        ? `${pkg.country_id} (${pkg.main_city_id})`
                        : pkg.country_id || '(未設定)'}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-morandi-primary">行程天數</Label>
                    <Input
                      value={`${calculateDays()} 天`}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-morandi-primary">出發日期</Label>
                    <Input
                      value={pkg.start_date || '(未設定)'}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-morandi-primary">回程日期</Label>
                    <Input
                      value={pkg.end_date || '(未設定)'}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                {/* 航班資訊（選填）- 國內旅遊隱藏 */}
                {!isDomestic && (
                <div className="space-y-3">
                  <Label className="text-xs text-morandi-primary flex items-center gap-1">
                    <Plane size={12} />
                    航班資訊（選填）
                  </Label>

                  {/* 去程航班 */}
                  <div className="border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-morandi-secondary">去程航班</span>
                      {formData.outboundFlight && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, outboundFlight: null }))}
                          className="text-morandi-red hover:text-morandi-red/80 p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    {formData.outboundFlight ? (
                      <div className="bg-morandi-container/50 rounded p-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-morandi-primary">
                            {formData.outboundFlight.flightNumber}
                          </span>
                          <span className="text-xs text-morandi-secondary">
                            {formData.outboundFlight.airline}
                          </span>
                        </div>
                        <div className="text-xs text-morandi-secondary mt-1">
                          {formData.outboundFlight.departureAirport} → {formData.outboundFlight.arrivalAirport}
                          <span className="ml-2">
                            {formData.outboundFlight.departureTime} - {formData.outboundFlight.arrivalTime}
                          </span>
                        </div>
                      </div>
                    ) : outboundSegments.length > 0 ? (
                      /* 多航段選擇器 */
                      <div className="space-y-2">
                        <p className="text-xs text-morandi-secondary">此航班有多個航段，請選擇：</p>
                        <div className="space-y-1">
                          {outboundSegments.map((seg, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSelectOutboundSegment(seg)}
                              className="w-full text-left p-2 rounded border border-border hover:border-morandi-gold hover:bg-morandi-gold/5 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm text-morandi-primary">
                                  {seg.departureAirport} → {seg.arrivalAirport}
                                </span>
                                <span className="text-xs text-morandi-secondary">
                                  {seg.departureTime} - {seg.arrivalTime}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setOutboundSegments([])}
                          className="text-xs text-morandi-secondary hover:text-morandi-primary"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <>
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
                            className="h-8 text-xs w-32"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleSearchOutboundFlight}
                            disabled={searchingOutbound}
                            className="h-8 px-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                          >
                            {searchingOutbound ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                          </Button>
                        </div>
                        {flightSearchError.outbound && (
                          <p className="text-xs text-morandi-red">{flightSearchError.outbound}</p>
                        )}
                      </>
                    )}
                  </div>

                  {/* 回程航班 */}
                  <div className="border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-morandi-secondary">回程航班</span>
                      {formData.returnFlight && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, returnFlight: null }))}
                          className="text-morandi-red hover:text-morandi-red/80 p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    {formData.returnFlight ? (
                      <div className="bg-morandi-container/50 rounded p-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-morandi-primary">
                            {formData.returnFlight.flightNumber}
                          </span>
                          <span className="text-xs text-morandi-secondary">
                            {formData.returnFlight.airline}
                          </span>
                        </div>
                        <div className="text-xs text-morandi-secondary mt-1">
                          {formData.returnFlight.departureAirport} → {formData.returnFlight.arrivalAirport}
                          <span className="ml-2">
                            {formData.returnFlight.departureTime} - {formData.returnFlight.arrivalTime}
                          </span>
                        </div>
                      </div>
                    ) : returnSegments.length > 0 ? (
                      /* 多航段選擇器 */
                      <div className="space-y-2">
                        <p className="text-xs text-morandi-secondary">此航班有多個航段，請選擇：</p>
                        <div className="space-y-1">
                          {returnSegments.map((seg, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSelectReturnSegment(seg)}
                              className="w-full text-left p-2 rounded border border-border hover:border-morandi-gold hover:bg-morandi-gold/5 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm text-morandi-primary">
                                  {seg.departureAirport} → {seg.arrivalAirport}
                                </span>
                                <span className="text-xs text-morandi-secondary">
                                  {seg.departureTime} - {seg.arrivalTime}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setReturnSegments([])}
                          className="text-xs text-morandi-secondary hover:text-morandi-primary"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <>
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
                            className="h-8 text-xs w-32"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleSearchReturnFlight}
                            disabled={searchingReturn}
                            className="h-8 px-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                          >
                            {searchingReturn ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                          </Button>
                        </div>
                        {flightSearchError.return && (
                          <p className="text-xs text-morandi-red">{flightSearchError.return}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
                )}

                {/* 錯誤訊息 */}
                {createError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{createError}</span>
                  </div>
                )}

                {/* 底部按鈕 */}
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  {/* 左側：AI 排行程 + 版本選擇器 */}
                  <div className="flex items-center gap-2">
                    {/* AI 排行程按鈕 */}
                    {showAiGenerate && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openAiDialog}
                        className="h-7 px-2 text-[11px] gap-1 text-morandi-gold border-morandi-gold/50 hover:bg-morandi-gold/10"
                      >
                        <Wand2 size={12} />
                        AI 排行程
                      </Button>
                    )}
                    {isEditMode && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] gap-1">
                            <History size={12} />
                            {getCurrentVersionName()}
                            <ChevronDown size={10} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 mb-2" align="start">
                          <div className="px-2 py-1.5 text-xs font-medium text-morandi-primary border-b border-border">
                            版本歷史 ({versionRecords.length > 0 ? versionRecords.length : 1})
                          </div>
                          {/* 主版本（當前狀態） */}
                          <DropdownMenuItem
                            className="flex items-center justify-between py-2 px-2 cursor-pointer hover:bg-morandi-container/50"
                            onClick={() => handleVersionChange(-1)}
                          >
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-sm">{stripHtml(existingItinerary?.title) || '主版本'}</span>
                                <span className="text-[10px] text-morandi-secondary bg-morandi-container px-1.5 py-0.5 rounded">主版本</span>
                              </div>
                              <span className="text-xs text-morandi-secondary">
                                {existingItinerary?.updated_at ? new Date(existingItinerary.updated_at).toLocaleString('zh-TW') : '當前編輯中'}
                              </span>
                            </div>
                            {selectedVersionIndex === -1 && (
                              <div className="text-xs bg-morandi-gold text-white px-1.5 py-0.5 rounded">當前</div>
                            )}
                          </DropdownMenuItem>
                          {/* 其他版本記錄 */}
                          {versionRecords.map((record, index) => {
                            const isCurrentVersion = selectedVersionIndex === index
                            return (
                              <DropdownMenuItem
                                key={record.id}
                                className="flex items-center justify-between py-2 px-2 cursor-pointer hover:bg-morandi-container/50"
                                onClick={() => handleVersionChange(index)}
                              >
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium text-sm">{record.note || `版本 ${record.version}`}</span>
                                  </div>
                                  <span className="text-xs text-morandi-secondary">
                                    {record.created_at ? new Date(record.created_at).toLocaleString('zh-TW') : ''}
                                  </span>
                                </div>
                                {isCurrentVersion && (
                                  <div className="text-xs bg-morandi-gold text-white px-1.5 py-0.5 rounded">當前</div>
                                )}
                              </DropdownMenuItem>
                            )
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* 操作按鈕 */}
                  <div className="flex gap-1.5">
                    {isEditMode && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveAsNewVersion}
                        disabled={isCreating || !formData.title.trim()}
                        className="h-7 px-2 text-[11px] gap-1 border-morandi-gold text-morandi-gold hover:bg-morandi-gold/10"
                      >
                        <FilePlus size={12} />
                        另存新版本
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      disabled={isCreating || !formData.title.trim()}
                      className="h-7 px-2 text-[11px] bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-1"
                    >
                      {isCreating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Save className="w-3 h-3" />
                      )}
                      {isEditMode ? '更新行程' : '建立行程'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* 右側：每日行程輸入 */}
            <div className="w-1/2 pl-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-morandi-primary">
                  {isTimelineMode ? '時間軸行程' : '每日行程'}
                </h3>
                {/* 時間軸模式切換按鈕 */}
                <button
                  type="button"
                  onClick={() => setIsTimelineMode(!isTimelineMode)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full transition-all ${
                    isTimelineMode
                      ? 'bg-morandi-gold text-white shadow-sm'
                      : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/50 border border-morandi-container'
                  }`}
                  title={isTimelineMode ? '切換簡易模式' : '切換時間軸模式'}
                >
                  <Clock size={12} />
                  <span>{isTimelineMode ? '簡易模式' : '時間軸'}</span>
                </button>
              </div>

              {/* 簡易模式 */}
              {!isTimelineMode && (
                <div className="space-y-3">
                  {dailySchedule.map((day, idx) => {
                    const isFirst = idx === 0
                    const isLast = idx === dailySchedule.length - 1
                    let dateLabel = ''
                    if (pkg.start_date) {
                      const date = new Date(pkg.start_date)
                      date.setDate(date.getDate() + idx)
                      dateLabel = `${date.getMonth() + 1}/${date.getDate()}`
                    }
                    return (
                      <div key={idx} className="p-3 rounded-lg border border-morandi-muted/30">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-morandi-gold text-white text-xs font-bold px-2 py-0.5 rounded">
                            Day {day.day}
                          </span>
                          {dateLabel && <span className="text-xs text-morandi-secondary">({dateLabel})</span>}
                        </div>
                        <Input
                          value={day.route || ''}
                          onChange={e => updateDaySchedule(idx, 'route', e.target.value)}
                          placeholder={isFirst ? '抵達目的地' : isLast ? '返回台灣' : '今日行程標題'}
                          className="h-8 text-sm mb-2"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <div className="relative">
                            <Input
                              value={day.hotelBreakfast ? '飯店早餐' : (day.meals.breakfast || '')}
                              onChange={e => updateDaySchedule(idx, 'meals.breakfast', e.target.value)}
                              placeholder="早餐"
                              className="h-8 text-xs"
                              disabled={day.hotelBreakfast}
                            />
                            {!isFirst && (
                              <label className="flex items-center gap-1 mt-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={day.hotelBreakfast}
                                  onChange={e => updateDaySchedule(idx, 'hotelBreakfast', e.target.checked)}
                                  className="w-3 h-3 rounded border-border text-morandi-gold focus:ring-morandi-gold"
                                />
                                <span className="text-[10px] text-morandi-secondary">飯店早餐</span>
                              </label>
                            )}
                          </div>
                          <Input
                            value={day.meals.lunch || ''}
                            onChange={e => updateDaySchedule(idx, 'meals.lunch', e.target.value)}
                            placeholder="午餐"
                            className="h-8 text-xs"
                          />
                          <Input
                            value={day.meals.dinner || ''}
                            onChange={e => updateDaySchedule(idx, 'meals.dinner', e.target.value)}
                            placeholder="晚餐"
                            className="h-8 text-xs"
                          />
                        </div>
                        {!isLast && (
                          <div className="mt-2">
                            <Input
                              value={day.sameAsPrevious ? `同上 (${getPreviousAccommodation(idx) || '續住'})` : (day.accommodation || '')}
                              onChange={e => updateDaySchedule(idx, 'accommodation', e.target.value)}
                              placeholder="住宿飯店"
                              className="h-8 text-xs"
                              disabled={day.sameAsPrevious}
                            />
                            {idx > 0 && (
                              <label className="flex items-center gap-1 mt-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={day.sameAsPrevious}
                                  onChange={e => updateDaySchedule(idx, 'sameAsPrevious', e.target.checked)}
                                  className="w-3 h-3 rounded border-border text-morandi-gold focus:ring-morandi-gold"
                                />
                                <span className="text-[10px] text-morandi-secondary">續住</span>
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* 時間軸模式 - 分頁式完整界面 */}
              {isTimelineMode && (
                <div className="flex flex-col h-full">
                  {/* 天數分頁 Tab */}
                  <div className="flex gap-1 mb-4 pb-3 border-b border-morandi-container overflow-x-auto">
                    {dailySchedule.map((day, idx) => {
                      const isSelected = selectedDayIndex === idx
                      const hasActivities = day.activities && day.activities.length > 0
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedDayIndex(idx)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                            isSelected
                              ? 'bg-morandi-gold text-white shadow-sm'
                              : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/50'
                          }`}
                        >
                          Day {day.day}
                          {hasActivities && (
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-morandi-gold'}`} />
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* 選中天的內容 */}
                  {dailySchedule[selectedDayIndex] && (() => {
                    const day = dailySchedule[selectedDayIndex]
                    const idx = selectedDayIndex
                    let dateLabel = ''
                    if (pkg.start_date) {
                      const date = new Date(pkg.start_date)
                      date.setDate(date.getDate() + idx)
                      const weekdays = ['日', '一', '二', '三', '四', '五', '六']
                      dateLabel = `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`
                    }

                    return (
                      <div className="flex-1 overflow-y-auto">
                        {/* Day 標題資訊 */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-morandi-gold">Day {day.day}</span>
                            {dateLabel && <span className="text-sm text-morandi-secondary">{dateLabel}</span>}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => addActivity(idx)}
                            className="h-7 px-2 text-xs gap-1 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                          >
                            <Plus size={12} />
                            新增活動
                          </Button>
                        </div>

                        {/* 今日標題 + 餐食 + 住宿 */}
                        <div className="border border-border rounded-lg p-3 mb-3 space-y-2">
                          {/* 今日標題 */}
                          <Input
                            value={day.route || ''}
                            onChange={e => updateDaySchedule(idx, 'route', e.target.value)}
                            placeholder={idx === 0 ? '抵達目的地' : idx === dailySchedule.length - 1 ? '返回台灣' : '今日行程標題'}
                            className="h-8 text-xs"
                          />

                          {/* 餐食 */}
                          <div className="grid grid-cols-3 gap-2">
                            {/* 早餐 */}
                            <div className="group relative">
                              <input
                                type="text"
                                value={day.hotelBreakfast ? '飯店早餐' : (day.meals.breakfast || '')}
                                onChange={e => updateDaySchedule(idx, 'meals.breakfast', e.target.value)}
                                placeholder="早餐"
                                disabled={day.hotelBreakfast}
                                className="w-full h-8 px-3 text-xs border border-border rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-morandi-gold disabled:text-morandi-secondary"
                              />
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => updateDaySchedule(idx, 'hotelBreakfast', !day.hotelBreakfast)}
                                  className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded transition-all ${
                                    day.hotelBreakfast
                                      ? 'bg-morandi-gold text-white'
                                      : 'text-morandi-secondary opacity-0 group-hover:opacity-100 hover:text-morandi-gold'
                                  }`}
                                >
                                  飯店
                                </button>
                              )}
                            </div>
                            {/* 午餐 */}
                            <input
                              type="text"
                              value={day.meals.lunch || ''}
                              onChange={e => updateDaySchedule(idx, 'meals.lunch', e.target.value)}
                              placeholder="午餐"
                              className="h-8 px-3 text-xs border border-border rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-morandi-gold"
                            />
                            {/* 晚餐 */}
                            <input
                              type="text"
                              value={day.meals.dinner || ''}
                              onChange={e => updateDaySchedule(idx, 'meals.dinner', e.target.value)}
                              placeholder="晚餐"
                              className="h-8 px-3 text-xs border border-border rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-morandi-gold"
                            />
                          </div>

                          {/* 住宿 */}
                          {idx < dailySchedule.length - 1 && (
                            <div className="group relative">
                              <input
                                type="text"
                                value={day.sameAsPrevious ? `同上 (${getPreviousAccommodation(idx) || '續住'})` : (day.accommodation || '')}
                                onChange={e => updateDaySchedule(idx, 'accommodation', e.target.value)}
                                placeholder="住宿飯店"
                                disabled={day.sameAsPrevious}
                                className="w-full h-8 px-3 text-xs border border-border rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-morandi-gold disabled:text-morandi-secondary"
                              />
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => updateDaySchedule(idx, 'sameAsPrevious', !day.sameAsPrevious)}
                                  className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded transition-all ${
                                    day.sameAsPrevious
                                      ? 'bg-morandi-gold text-white'
                                      : 'text-morandi-secondary opacity-0 group-hover:opacity-100 hover:text-morandi-gold'
                                  }`}
                                >
                                  續住
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 活動表格 */}
                        <div className="border border-border rounded-lg overflow-hidden">
                          {/* 表頭 */}
                          <div className="flex items-center bg-morandi-container/30 text-[10px] text-morandi-secondary font-medium">
                            <div className="w-[100px] px-2 py-1.5 text-center border-r border-morandi-container/50">時間</div>
                            <div className="flex-1 px-2 py-1.5">活動內容</div>
                          </div>

                          {/* 活動列表 */}
                          {(day.activities && day.activities.length > 0) ? (
                            day.activities.map((activity, actIdx) => (
                              <div
                                key={activity.id}
                                className="group flex items-stretch border-t border-morandi-container/50 hover:bg-morandi-gold/5"
                              >
                                {/* 時間 */}
                                <div className="w-[100px] flex items-center justify-center border-r border-morandi-container/50">
                                  <input
                                    type="text"
                                    maxLength={5}
                                    value={activity.startTime ? `${activity.startTime.slice(0, 2)}:${activity.startTime.slice(2)}` : ''}
                                    onChange={e => {
                                      let val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4)
                                      updateActivity(idx, actIdx, 'startTime', val)
                                    }}
                                    placeholder="09:00"
                                    className="w-[42px] px-0.5 py-2 text-xs text-center bg-transparent border-0 focus:outline-none focus:bg-white"
                                  />
                                  <span className="text-morandi-muted text-[10px]">~</span>
                                  <input
                                    type="text"
                                    maxLength={5}
                                    value={activity.endTime ? `${activity.endTime.slice(0, 2)}:${activity.endTime.slice(2)}` : ''}
                                    onChange={e => {
                                      let val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4)
                                      updateActivity(idx, actIdx, 'endTime', val)
                                    }}
                                    placeholder="10:30"
                                    className="w-[42px] px-0.5 py-2 text-xs text-center bg-transparent border-0 focus:outline-none focus:bg-white"
                                  />
                                </div>

                                {/* 活動名稱 */}
                                <div className="flex-1 flex items-center">
                                  <textarea
                                    value={activity.title}
                                    onChange={e => updateActivity(idx, actIdx, 'title', e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                      }
                                    }}
                                    placeholder="景點名稱"
                                    rows={1}
                                    className="flex-1 px-2 py-2 text-xs bg-transparent border-0 focus:outline-none focus:bg-white resize-none leading-tight"
                                    style={{ minHeight: '32px' }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeActivity(idx, actIdx)}
                                    className="hidden group-hover:block p-1 mr-1 text-morandi-muted hover:text-morandi-red transition-colors"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4 text-xs text-morandi-muted">
                              點擊「新增活動」加入景點
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* AI 排行程設定對話框（level={3}） */}
    <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
      <DialogContent level={3} className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={18} className="text-morandi-gold" />
            AI 排行程
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* 基本資訊（唯讀） */}
          <div className="flex items-center gap-4 p-3 bg-morandi-container/30 rounded-lg">
            <div className="flex-1">
              <div className="text-[10px] text-morandi-secondary">目的地</div>
              <div className="text-sm font-medium">{pkg.destination || pkg.country_id || '未設定'}</div>
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-morandi-secondary">天數</div>
              <div className="text-sm font-medium">{dailySchedule.length} 天</div>
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-morandi-secondary">住宿狀態</div>
              <div className="text-sm font-medium text-morandi-green">
                ✓ 已填寫 {getAccommodationStatus().filledCount}/{getAccommodationStatus().requiredDays} 天
              </div>
            </div>
          </div>

          {/* 時間設定 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-morandi-primary">第一天抵達時間</Label>
              <Input
                type="time"
                value={aiArrivalTime}
                onChange={(e) => setAiArrivalTime(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-morandi-primary">最後一天離開時間</Label>
              <Input
                type="time"
                value={aiDepartureTime}
                onChange={(e) => setAiDepartureTime(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* 行程風格選擇 */}
          <div className="space-y-2">
            <Label className="text-xs text-morandi-primary">行程風格</Label>
            <div className="grid grid-cols-3 gap-2">
              {AI_THEMES.map((theme) => (
                <button
                  key={theme.value}
                  type="button"
                  onClick={() => setAiTheme(theme.value)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    aiTheme === theme.value
                      ? 'border-morandi-gold bg-morandi-gold/10'
                      : 'border-border hover:border-morandi-gold/50'
                  }`}
                >
                  <div className={`text-xs font-medium ${aiTheme === theme.value ? 'text-morandi-gold' : ''}`}>
                    {theme.label}
                  </div>
                  <div className="text-[10px] text-morandi-secondary mt-0.5">
                    {theme.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 說明 */}
          <p className="text-xs text-morandi-secondary">
            AI 將根據您的住宿地點和選擇的風格，為每一天安排合適的景點和路線
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setAiDialogOpen(false)}
            className="gap-1"
          >
            <X size={14} />
            取消
          </Button>
          <Button
            onClick={handleAiGenerate}
            disabled={aiGenerating}
            className="gap-1 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            {aiGenerating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                生成行程
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
