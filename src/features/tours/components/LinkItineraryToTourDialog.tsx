/**
 * LinkItineraryToTourDialog - 旅遊團行程表對話框
 * 功能：建立新行程表 / 查看已關聯行程表
 */

'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { Plus, FileText, Loader2, ExternalLink, Calendar, MapPin, ArrowLeft, Save, AlertCircle, X } from 'lucide-react'
import { useItineraryStore, useRegionsStore, useAuthStore } from '@/stores'
import type { Tour, Itinerary } from '@/stores/types'
import { logger } from '@/lib/utils/logger'
import { alert } from '@/lib/ui/alert-dialog'

// 去除 HTML 標籤
function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

interface ItineraryFormData {
  title: string
  tagline: string
  subtitle: string
  description: string
}

interface LinkItineraryToTourDialogProps {
  isOpen: boolean
  onClose: () => void
  tour: Tour
}

export function LinkItineraryToTourDialog({
  isOpen,
  onClose,
  tour,
}: LinkItineraryToTourDialogProps) {
  const router = useRouter()
  const { items: itineraries, fetchAll, create, loading } = useItineraryStore()
  const { countries, cities, fetchAll: fetchRegions } = useRegionsStore()
  const { user: currentUser } = useAuthStore()
  const [isCreating, setIsCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [formData, setFormData] = useState<ItineraryFormData>({
    title: '',
    tagline: 'Corner Travel 2025',
    subtitle: '',
    description: '',
  })

  // 載入行程表與區域資料
  useEffect(() => {
    if (isOpen) {
      fetchAll()
      // 載入國家/城市資料（如果還沒載入）
      if (countries.length === 0) {
        fetchRegions()
      }
      // 重設表單狀態
      setShowForm(false)
      setCreateError(null)
      setFormData({
        title: tour.name,
        tagline: 'Corner Travel 2025',
        subtitle: '',
        description: '',
      })
    }
  }, [isOpen, fetchAll, fetchRegions, countries.length, tour.name])

  // 根據 country_id 和 main_city_id 查詢名稱
  const countryName = useMemo(() => {
    if (!tour.country_id) return tour.location || ''
    const country = countries.find(c => c.id === tour.country_id)
    return country?.name || ''
  }, [tour.country_id, tour.location, countries])

  const cityName = useMemo(() => {
    if (!tour.main_city_id) return tour.location || ''
    const city = cities.find(c => c.id === tour.main_city_id)
    return city?.name || tour.location || ''
  }, [tour.main_city_id, tour.location, cities])

  // 已關聯此旅遊團的行程表
  const linkedItineraries = useMemo(() => {
    return itineraries.filter(i => {
      const item = i as Itinerary & { _deleted?: boolean }
      return i.tour_id === tour.id && !item._deleted
    })
  }, [itineraries, tour.id])

  // 開啟新增表單
  const handleOpenForm = () => {
    setFormData({
      title: tour.name,
      tagline: 'Corner Travel 2025',
      subtitle: '',
      description: '',
    })
    setShowForm(true)
  }

  // 建立新行程表
  const handleCreateNew = async () => {
    try {
      setIsCreating(true)
      setCreateError(null)

      // 轉換每日行程格式（符合 DailyItinerary 介面）
      const formattedDailyItinerary = dailySchedule.map((day, idx) => {
        // 計算日期標籤
        let dateLabel = ''
        if (tour.departure_date) {
          const date = new Date(tour.departure_date)
          date.setDate(date.getDate() + idx)
          const weekdays = ['日', '一', '二', '三', '四', '五', '六']
          dateLabel = `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`
        }

        // 使用預設標題（如果用戶未填寫）
        const isFirst = idx === 0
        const isLast = idx === dailySchedule.length - 1
        const defaultTitle = isFirst ? '抵達目的地' : isLast ? '返回台灣' : `第 ${day.day} 天行程`
        const title = day.route?.trim() || defaultTitle

        return {
          dayLabel: `Day ${day.day}`,
          date: dateLabel,
          title: title,
          highlight: '',
          description: '',
          activities: [],
          recommendations: [],
          meals: day.meals,
          accommodation: day.accommodation || '',
          images: [],
        }
      })

      // 取得當前使用者名稱作為作者
      const authorName = currentUser?.display_name || currentUser?.chinese_name || ''

      logger.log('建立行程表資料:', {
        title: formData.title,
        tour_id: tour.id,
        country: countryName,
        city: cityName,
        departure_date: tour.departure_date,
      })

      const newItinerary = await create({
        title: formData.title,
        tour_id: tour.id,
        tour_code: tour.code,
        status: '草稿',
        author_name: authorName,
        departure_date: tour.departure_date || '',
        city: cityName,
        daily_itinerary: formattedDailyItinerary,
        tagline: formData.tagline,
        subtitle: formData.subtitle,
        description: formData.description,
        cover_image: '',
        country: countryName,
        features: [],
        focus_cards: [],
        // 從旅遊團帶入完整航班資訊
        outbound_flight: tour.outbound_flight ? {
          airline: tour.outbound_flight.airline || '',
          flightNumber: tour.outbound_flight.flightNumber || '',
          departureAirport: tour.outbound_flight.departureAirport || 'TPE',
          departureTime: tour.outbound_flight.departureTime || '',
          arrivalAirport: tour.outbound_flight.arrivalAirport || '',
          arrivalTime: tour.outbound_flight.arrivalTime || '',
          departureDate: tour.outbound_flight.departureDate || '',
        } : undefined,
        return_flight: tour.return_flight ? {
          airline: tour.return_flight.airline || '',
          flightNumber: tour.return_flight.flightNumber || '',
          departureAirport: tour.return_flight.departureAirport || '',
          departureTime: tour.return_flight.departureTime || '',
          arrivalAirport: tour.return_flight.arrivalAirport || 'TPE',
          arrivalTime: tour.return_flight.arrivalTime || '',
          departureDate: tour.return_flight.departureDate || '',
        } : undefined,
      } as unknown as Omit<Itinerary, 'id' | 'created_at' | 'updated_at'>)

      if (newItinerary?.id) {
        logger.log('行程表建立成功:', newItinerary.id)
        onClose()
        router.push(`/itinerary/new?itinerary_id=${newItinerary.id}`)
      } else {
        setCreateError('建立失敗：未取得行程表 ID')
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

  // 查看已連結的行程表
  const handleViewItinerary = (itinerary: Itinerary) => {
    onClose()
    router.push(`/itinerary/new?itinerary_id=${itinerary.id}`)
  }

  // 計算天數
  const calculateDays = () => {
    if (!tour.departure_date || !tour.return_date) return 5
    const start = new Date(tour.departure_date)
    const end = new Date(tour.return_date)
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
    }))
  }

  const [dailySchedule, setDailySchedule] = useState<Array<{
    day: number
    route: string
    meals: { breakfast: string; lunch: string; dinner: string }
    accommodation: string
  }>>([])

  // 當打開表單時初始化每日行程
  useEffect(() => {
    if (showForm) {
      setDailySchedule(initializeDailySchedule())
    }
  }, [showForm, tour.departure_date, tour.return_date])

  // 更新每日行程
  const updateDaySchedule = (index: number, field: string, value: string) => {
    setDailySchedule(prev => {
      const newSchedule = [...prev]
      if (field === 'route' || field === 'accommodation') {
        newSchedule[index] = { ...newSchedule[index], [field]: value }
      } else if (field.startsWith('meals.')) {
        const mealType = field.split('.')[1] as 'breakfast' | 'lunch' | 'dinner'
        newSchedule[index] = {
          ...newSchedule[index],
          meals: { ...newSchedule[index].meals, [mealType]: value }
        }
      }
      return newSchedule
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className={showForm ? "max-w-4xl max-h-[90vh] overflow-hidden" : "max-w-lg"}>
        {!showForm ? (
          <>
            <DialogHeader>
              <DialogTitle>行程表</DialogTitle>
              <DialogDescription>
                為「{tour.name}」管理行程表
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* 已關聯的行程表 - 優先顯示 */}
              {linkedItineraries.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-morandi-gold" />
                    <span className="text-sm font-medium text-morandi-primary">已建立的行程表</span>
                  </div>
                  <div className="space-y-2">
                    {linkedItineraries.map(itinerary => (
                      <button
                        key={itinerary.id}
                        onClick={() => handleViewItinerary(itinerary)}
                        className="w-full flex items-center justify-between p-3 rounded-lg border border-morandi-gold/30 bg-morandi-gold/5 hover:bg-morandi-gold/10 transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {itinerary.tour_code && (
                              <span className="font-mono text-sm text-morandi-gold">{itinerary.tour_code}</span>
                            )}
                            <span className="text-morandi-text truncate">{stripHtml(itinerary.title) || '未命名'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-morandi-secondary mt-1">
                            {itinerary.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {itinerary.city}
                              </span>
                            )}
                            {itinerary.departure_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {itinerary.departure_date}
                              </span>
                            )}
                            {itinerary.daily_itinerary?.length > 0 && (
                              <span>{itinerary.daily_itinerary.length} 天</span>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-morandi-secondary shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 建立新行程表 */}
              <button
                onClick={handleOpenForm}
                className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-morandi-primary/30 bg-morandi-primary/5 hover:bg-morandi-primary/10 hover:border-morandi-primary/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-morandi-primary/20 flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5 text-morandi-primary" />
                </div>
                <div>
                  <div className="font-medium text-morandi-primary">建立新行程表</div>
                  <div className="text-sm text-morandi-secondary">填寫每日行程後建立</div>
                </div>
              </button>

              {/* 載入中 */}
              {loading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-morandi-secondary" />
                  <span className="ml-2 text-sm text-morandi-secondary">載入中...</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex h-full max-h-[80vh]">
            {/* 左側：基本資訊 */}
            <div className="w-1/2 pr-6 border-r border-border overflow-y-auto">
              <DialogHeader className="mb-4">
                <DialogTitle className="flex items-center gap-2">
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-1 hover:bg-muted rounded transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  建立行程表
                </DialogTitle>
                <DialogDescription>
                  {tour.code} - {tour.name}
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
                    <Label className="text-xs text-morandi-primary">國家</Label>
                    <Input
                      value={countryName || '(未設定)'}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-morandi-primary">城市</Label>
                    <Input
                      value={cityName || '(未設定)'}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-morandi-primary">出發日期</Label>
                    <Input
                      value={tour.departure_date || ''}
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

                <div className="space-y-2">
                  <Label className="text-xs text-morandi-primary">標語</Label>
                  <Input
                    value={formData.tagline}
                    onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="Corner Travel 2025"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-morandi-primary">副標題</Label>
                  <textarea
                    value={formData.subtitle}
                    onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="詩意文案（可換行）"
                    className="w-full text-sm border border-border rounded-md p-2 min-h-[60px]"
                  />
                </div>

                {/* 航班資訊（從旅遊團帶入） */}
                {(tour.outbound_flight || tour.return_flight) && (
                  <div className="space-y-2 pt-4 border-t border-border">
                    <Label className="text-xs text-morandi-primary">航班資訊（自動帶入）</Label>
                    <div className="text-xs text-morandi-primary bg-muted/50 p-2 rounded space-y-1">
                      {tour.outbound_flight && (
                        <div>去程：{tour.outbound_flight.airline} {tour.outbound_flight.flightNumber} {tour.outbound_flight.departureTime}-{tour.outbound_flight.arrivalTime}</div>
                      )}
                      {tour.return_flight && (
                        <div>回程：{tour.return_flight.airline} {tour.return_flight.flightNumber} {tour.return_flight.departureTime}-{tour.return_flight.arrivalTime}</div>
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
                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <Button variant="outline" onClick={() => setShowForm(false)} disabled={isCreating} className="gap-1">
                    <X size={16} />
                    取消
                  </Button>
                  <Button
                    onClick={handleCreateNew}
                    disabled={isCreating || !formData.title.trim()}
                    className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
                  >
                    {isCreating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    建立並編輯
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
                  if (tour.departure_date) {
                    const date = new Date(tour.departure_date)
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
                        value={day.route}
                        onChange={e => updateDaySchedule(idx, 'route', e.target.value)}
                        placeholder={isFirst ? '抵達目的地' : isLast ? '返回台灣' : '今日行程標題'}
                        className="h-8 text-sm mb-2"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          value={day.meals.breakfast}
                          onChange={e => updateDaySchedule(idx, 'meals.breakfast', e.target.value)}
                          placeholder={isFirst ? '溫暖的家' : '早餐'}
                          className="h-8 text-xs"
                        />
                        <Input
                          value={day.meals.lunch}
                          onChange={e => updateDaySchedule(idx, 'meals.lunch', e.target.value)}
                          placeholder="午餐"
                          className="h-8 text-xs"
                        />
                        <Input
                          value={day.meals.dinner}
                          onChange={e => updateDaySchedule(idx, 'meals.dinner', e.target.value)}
                          placeholder="晚餐"
                          className="h-8 text-xs"
                        />
                      </div>
                      {!isLast && (
                        <Input
                          value={day.accommodation}
                          onChange={e => updateDaySchedule(idx, 'accommodation', e.target.value)}
                          placeholder="住宿飯店"
                          className="h-8 text-xs mt-2"
                        />
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
