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
import { FileText, Loader2, Save, AlertCircle, X, Plane, Search, Trash2, FilePlus, History, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DatePicker } from '@/components/ui/date-picker'
import { searchFlightAction } from '@/features/dashboard/actions/flight-actions'
import { useAuthStore } from '@/stores'
import { useItineraries } from '@/hooks/cloud-hooks'
import { supabase } from '@/lib/supabase/client'
import type { Json } from '@/lib/supabase/types'
import type { Itinerary, ItineraryVersionRecord } from '@/stores/types'
import type { ProposalPackage, Proposal } from '@/types/proposal.types'
import { logger } from '@/lib/utils/logger'
import { alert } from '@/lib/ui/alert-dialog'
import { stripHtml } from '@/lib/utils/string-utils'
import { syncItineraryToQuote } from '@/lib/utils/itinerary-quote-sync'

interface FlightInfo {
  flightNumber: string
  airline: string
  departureAirport: string
  arrivalAirport: string
  departureTime: string
  arrivalTime: string
}

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
  onItineraryCreated?: () => void
}

export function PackageItineraryDialog({
  isOpen,
  onClose,
  pkg,
  proposal,
  onItineraryCreated,
}: PackageItineraryDialogProps) {
  const { items: itineraries, fetchAll, create } = useItineraries()
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

  // 追蹤是否已初始化每日行程（防止無限迴圈）
  const hasInitializedDailyScheduleRef = React.useRef(false)
  // 追蹤是否已開始載入（防止重複載入）
  const isLoadingRef = React.useRef(false)
  // 追蹤上次開啟的 dialog 狀態
  const prevIsOpenRef = React.useRef(false)

  // 載入行程表資料
  useEffect(() => {
    // 只在 dialog 從關閉變成開啟時執行
    const justOpened = isOpen && !prevIsOpenRef.current
    prevIsOpenRef.current = isOpen

    if (justOpened && !isLoadingRef.current) {
      isLoadingRef.current = true
      // 先重置狀態，顯示載入中
      setIsDataLoading(true)
      setCreateError(null)
      setSelectedVersionIndex(-1)
      setDirectLoadedItinerary(null)
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
        await fetchAll()
        setIsDataLoading(false)
        isLoadingRef.current = false
      }

      loadData()
    } else if (!isOpen) {
      // dialog 關閉時重置載入狀態
      isLoadingRef.current = false
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

  const [dailySchedule, setDailySchedule] = useState<Array<{
    day: number
    route: string
    meals: { breakfast: string; lunch: string; dinner: string }
    accommodation: string
    sameAsPrevious: boolean
    hotelBreakfast: boolean
  }>>([])

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
        }
      })
      setDailySchedule(loadedSchedule)
    } else {
      // 使用傳入的天數初始化
      setDailySchedule(Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        route: '',
        meals: { breakfast: '', lunch: '', dinner: '' },
        accommodation: '',
        sameAsPrevious: false,
        hotelBreakfast: false,
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

        return {
          dayLabel: `Day ${day.day}`,
          date: dateLabel,
          title: title,
          highlight: '',
          description: '',
          activities: [],
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

        await alert('行程表更新成功', 'success')
        onItineraryCreated?.()
        onClose()
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

          await (supabase as any)
            .from('proposal_packages')
            .update({
              itinerary_id: newItinerary.id,
              itinerary_type: 'simple',
              // 注意：不清除 timeline_data，保留快速行程表資料
            })
            .eq('id', pkg.id)

          await alert('行程表建立成功', 'success')
          onItineraryCreated?.()
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

        return {
          dayLabel: `Day ${day.day}`,
          date: dateLabel,
          title: title,
          highlight: '',
          description: '',
          activities: [],
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

      await alert('已另存為新版本', 'success')
      onItineraryCreated?.()
    } catch (error) {
      logger.error('另存新版本失敗:', error)
      await alert('另存新版本失敗：' + (error instanceof Error ? error.message : '未知錯誤'), 'error')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 載入中 */}
        {isDataLoading ? (
          <div className="h-64 flex items-center justify-center">
            <VisuallyHidden>
              <DialogTitle>載入中...</DialogTitle>
            </VisuallyHidden>
            <Loader2 className="w-6 h-6 animate-spin text-morandi-gold" />
          </div>
        ) : (
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
                  {/* 版本選擇器 - 編輯模式永遠顯示 */}
                  <div className="flex items-center gap-2">
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
              <h3 className="text-sm font-bold text-morandi-primary mb-4">每日行程</h3>
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
                            placeholder={isFirst ? '溫暖的家' : '早餐'}
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
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
