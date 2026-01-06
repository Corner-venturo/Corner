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
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Loader2, Save, AlertCircle, X, Plane, Search, Trash2 } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import { searchFlightAction } from '@/features/dashboard/actions/flight-actions'
import { useAuthStore } from '@/stores'
import { useItineraries } from '@/hooks/cloud-hooks'
import { supabase } from '@/lib/supabase/client'
import type { Itinerary } from '@/stores/types'
import type { ProposalPackage, Proposal } from '@/types/proposal.types'
import { logger } from '@/lib/utils/logger'
import { alert } from '@/lib/ui/alert-dialog'
import { stripHtml } from '@/lib/utils/string-utils'

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

  // 載入行程表資料
  useEffect(() => {
    if (isOpen) {
      // 先重置狀態，顯示載入中
      setIsDataLoading(true)
      setCreateError(null)
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

      // 等待資料載入完成後顯示表單
      fetchAll().then(() => {
        setIsDataLoading(false)
      })
    }
  }, [isOpen, proposal.title, pkg.version_name, pkg.itinerary_id, pkg.start_date, pkg.end_date])

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

  // 初始化每日行程
  const initializeDailySchedule = () => {
    const days = calculateDays()
    return Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      route: '',
      meals: { breakfast: '', lunch: '', dinner: '' },
      accommodation: '',
      sameAsPrevious: false, // 續住：同上一天的飯店
      hotelBreakfast: false, // 飯店早餐
    }))
  }

  const [dailySchedule, setDailySchedule] = useState<Array<{
    day: number
    route: string
    meals: { breakfast: string; lunch: string; dinner: string }
    accommodation: string
    sameAsPrevious: boolean
    hotelBreakfast: boolean
  }>>([])

  // 當資料載入完成後初始化每日行程（若已有行程表則載入現有資料）
  useEffect(() => {
    if (!isDataLoading && isOpen) {
      // 檢查是否有現有行程表（優先用 pkg.itinerary_id，否則用 proposal_package_id 找）
      const itinerary = linkedItineraries.find(i =>
        i.id === pkg.itinerary_id || i.proposal_package_id === pkg.id
      )
      const dailyData = itinerary?.daily_itinerary
      if (itinerary && dailyData && dailyData.length > 0) {
        // 從現有行程表載入資料
        const loadedSchedule = dailyData.map((day, idx) => {
          const isHotelBreakfast = day.meals?.breakfast === '飯店早餐'
          // 檢測是否為續住（與前一天相同的住宿）
          let sameAsPrevious = false
          if (idx > 0 && dailyData[idx - 1]?.accommodation) {
            sameAsPrevious = day.accommodation === dailyData[idx - 1].accommodation
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
        // 更新表單標題和航班資訊
        setFormData(prev => ({
          ...prev,
          title: stripHtml(itinerary.title) || prev.title,
          outboundFlight: itinerary.flight_info?.outbound || null,
          returnFlight: itinerary.flight_info?.return || null,
        }))
      } else {
        setDailySchedule(initializeDailySchedule())
      }
    }
  }, [isDataLoading, isOpen, pkg.start_date, pkg.end_date, pkg.itinerary_id, linkedItineraries])

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

  // 查詢去程航班
  const handleSearchOutboundFlight = useCallback(async () => {
    if (!outboundFlightNumber.trim() || !outboundFlightDate) {
      setFlightSearchError(prev => ({ ...prev, outbound: '請輸入航班號碼和日期' }))
      return
    }
    setSearchingOutbound(true)
    setFlightSearchError(prev => ({ ...prev, outbound: undefined }))
    try {
      const result = await searchFlightAction(outboundFlightNumber.trim(), outboundFlightDate)
      if (result.error) {
        setFlightSearchError(prev => ({ ...prev, outbound: result.error }))
      } else if (result.data) {
        setFormData(prev => ({
          ...prev,
          outboundFlight: {
            flightNumber: result.data!.flightNumber,
            airline: result.data!.airline,
            departureAirport: result.data!.departure.iata,
            arrivalAirport: result.data!.arrival.iata,
            departureTime: result.data!.departure.time,
            arrivalTime: result.data!.arrival.time,
          },
        }))
        setOutboundFlightNumber('')
      }
    } finally {
      setSearchingOutbound(false)
    }
  }, [outboundFlightNumber, outboundFlightDate])

  // 查詢回程航班
  const handleSearchReturnFlight = useCallback(async () => {
    if (!returnFlightNumber.trim() || !returnFlightDate) {
      setFlightSearchError(prev => ({ ...prev, return: '請輸入航班號碼和日期' }))
      return
    }
    setSearchingReturn(true)
    setFlightSearchError(prev => ({ ...prev, return: undefined }))
    try {
      const result = await searchFlightAction(returnFlightNumber.trim(), returnFlightDate)
      if (result.error) {
        setFlightSearchError(prev => ({ ...prev, return: result.error }))
      } else if (result.data) {
        setFormData(prev => ({
          ...prev,
          returnFlight: {
            flightNumber: result.data!.flightNumber,
            airline: result.data!.airline,
            departureAirport: result.data!.departure.iata,
            arrivalAirport: result.data!.arrival.iata,
            departureTime: result.data!.departure.time,
            arrivalTime: result.data!.arrival.time,
          },
        }))
        setReturnFlightNumber('')
      }
    } finally {
      setSearchingReturn(false)
    }
  }, [returnFlightNumber, returnFlightDate])

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
  const existingItinerary = useMemo(() => {
    return linkedItineraries.find(i =>
      i.id === pkg.itinerary_id || i.proposal_package_id === pkg.id
    )
  }, [linkedItineraries, pkg.itinerary_id, pkg.id])
  const isEditMode = Boolean(existingItinerary)

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

      // 目的地顯示格式：國家 (機場代碼)
      const destinationDisplay = pkg.country_id && pkg.main_city_id
        ? `${pkg.country_id} (${pkg.main_city_id})`
        : pkg.country_id || ''

      if (isEditMode && existingItinerary) {
        // 更新現有行程表
        logger.log('更新行程表資料:', {
          id: existingItinerary.id,
          title: formData.title,
        })

        // 準備航班資訊
        const flightInfo = (formData.outboundFlight || formData.returnFlight) ? {
          outbound: formData.outboundFlight,
          return: formData.returnFlight,
        } : null

        const { error: updateError } = await supabase
          .from('itineraries')
          .update({
            title: formData.title,
            daily_itinerary: formattedDailyItinerary,
            city: destinationDisplay,
            flight_info: flightInfo,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingItinerary.id)

        if (updateError) {
          throw new Error(updateError.message)
        }

        logger.log('行程表更新成功')
        onItineraryCreated?.()
        onClose()
      } else {
        // 建立新行程表
        const createData = {
          title: formData.title,
          tour_id: null,
          tour_code: '',
          status: '提案',
          author_name: authorName,
          departure_date: pkg.start_date || '',
          city: destinationDisplay,
          daily_itinerary: formattedDailyItinerary,
          description: formData.description,
          cover_image: '',
          country: pkg.country_id || '',
          features: [],
          focus_cards: [],
          proposal_package_id: pkg.id,
          flight_info: (formData.outboundFlight || formData.returnFlight) ? {
            outbound: formData.outboundFlight,
            return: formData.returnFlight,
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

          // 更新套件關聯
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('proposal_packages')
            .update({ itinerary_id: newItinerary.id })
            .eq('id', pkg.id)

          onItineraryCreated?.()
          onClose()
        } else {
          setCreateError('建立失敗：未取得行程表 ID')
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤'
      logger.error('建立行程表失敗:', error)
      setCreateError(errorMessage)
      void alert(`建立失敗: ${errorMessage}`, 'error')
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
                </DialogTitle>
                <DialogDescription>
                  {pkg.version_name} - {proposal.title}
                </DialogDescription>
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

                {/* 航班資訊（選填） */}
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

                {/* 錯誤訊息 */}
                {createError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{createError}</span>
                  </div>
                )}

                {/* 底部按鈕 */}
                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <Button variant="outline" onClick={onClose} disabled={isCreating} className="gap-1">
                    <X size={16} />
                    取消
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isCreating || !formData.title.trim()}
                    className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
                  >
                    {isCreating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isEditMode ? '更新行程' : '建立行程'}
                  </Button>
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
