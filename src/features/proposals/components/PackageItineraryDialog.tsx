/**
 * PackageItineraryDialog - 提案套件行程表對話框
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
import { Plus, FileText, Loader2, MapPin, Save, AlertCircle, X, ArrowLeft, Book, Globe, DollarSign, ExternalLink } from 'lucide-react'
import { useAuthStore } from '@/stores'
import { useItineraries } from '@/hooks/cloud-hooks'
import { supabase } from '@/lib/supabase/client'
import type { Itinerary } from '@/stores/types'
import type { ProposalPackage, Proposal } from '@/types/proposal.types'
import { logger } from '@/lib/utils/logger'
import { alert } from '@/lib/ui/alert-dialog'
import { stripHtml } from '@/lib/utils/string-utils'
import { hasFullFeatures } from '@/lib/feature-restrictions'

interface ItineraryFormData {
  title: string
  tagline: string
  subtitle: string
  description: string
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
  const router = useRouter()
  const { items: itineraries, fetchAll, create, isLoading: loading } = useItineraries()
  const { user: currentUser } = useAuthStore()

  // 判斷是否有完整功能
  const hasFullEditor = useMemo(() => {
    return hasFullFeatures(currentUser?.workspace_code)
  }, [currentUser?.workspace_code])

  // 根據權限決定行程表頁面路徑
  const getItineraryUrl = (itineraryId: string) => {
    if (hasFullEditor) {
      return `/itinerary/new?itinerary_id=${itineraryId}`
    }
    return `/itinerary/print?itinerary_id=${itineraryId}`
  }

  const [isCreating, setIsCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [formData, setFormData] = useState<ItineraryFormData>({
    title: '',
    tagline: 'Corner Travel 2025',
    subtitle: '',
    description: '',
  })

  // 載入行程表資料
  useEffect(() => {
    if (isOpen) {
      fetchAll()
      setCreateError(null)
      setFormData({
        title: proposal.title || pkg.version_name,
        tagline: 'Corner Travel 2025',
        subtitle: '',
        description: '',
      })
      // 直接進入行程表表單（不管有沒有已存在的行程）
      setShowForm(true)
    }
  }, [isOpen, proposal.title, pkg.version_name, pkg.itinerary_id])

  // 已關聯此套件的行程表
  const linkedItineraries = useMemo(() => {
    return itineraries.filter(i => {
      const item = i as Itinerary & { _deleted?: boolean; proposal_package_id?: string }
      return item.proposal_package_id === pkg.id && !item._deleted
    })
  }, [itineraries, pkg.id])

  // 開啟新增表單
  const handleOpenForm = () => {
    setFormData({
      title: proposal.title || pkg.version_name,
      tagline: 'Corner Travel 2025',
      subtitle: '',
      description: '',
    })
    setShowForm(true)
  }

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

  // 當打開表單時初始化每日行程（若已有行程表則載入現有資料）
  useEffect(() => {
    if (showForm) {
      // 檢查是否有現有行程表
      const itinerary = linkedItineraries.find(i => i.id === pkg.itinerary_id)
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
        // 更新表單標題
        setFormData(prev => ({
          ...prev,
          title: stripHtml(itinerary.title) || prev.title,
          tagline: itinerary.tagline || prev.tagline,
          subtitle: itinerary.subtitle || prev.subtitle,
        }))
      } else {
        setDailySchedule(initializeDailySchedule())
      }
    }
  }, [showForm, pkg.start_date, pkg.end_date, pkg.itinerary_id, linkedItineraries])

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

  // 判斷是否為編輯模式
  const isEditMode = Boolean(pkg.itinerary_id)
  const existingItinerary = linkedItineraries.find(i => i.id === pkg.itinerary_id)

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

        const { error: updateError } = await supabase
          .from('itineraries')
          .update({
            title: formData.title,
            daily_itinerary: formattedDailyItinerary,
            tagline: formData.tagline,
            subtitle: formData.subtitle,
            city: destinationDisplay,
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
        logger.log('建立行程表資料:', {
          title: formData.title,
          proposal_package_id: pkg.id,
          country: pkg.country_id,
          airport_code: pkg.main_city_id,
          departure_date: pkg.start_date,
        })

        const newItinerary = await create({
          title: formData.title,
          tour_id: null,
          tour_code: '',
          status: '提案',
          author_name: authorName,
          departure_date: pkg.start_date || '',
          city: destinationDisplay,
          daily_itinerary: formattedDailyItinerary,
          tagline: formData.tagline,
          subtitle: formData.subtitle,
          description: formData.description,
          cover_image: '',
          country: pkg.country_id || '',
          features: [],
          focus_cards: [],
          proposal_package_id: pkg.id,
        } as unknown as Omit<Itinerary, 'id' | 'created_at' | 'updated_at'>)

        if (newItinerary?.id) {
          logger.log('行程表建立成功:', newItinerary.id)

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

  // 查看已連結的行程表
  const handleViewItinerary = (itinerary: Itinerary) => {
    onClose()
    router.push(getItineraryUrl(itinerary.id))
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className={showForm ? "max-w-4xl max-h-[90vh] overflow-hidden" : "max-w-md h-[500px] flex flex-col overflow-hidden"}>
        {!showForm ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-morandi-gold" />
                <span>行程表管理</span>
                <span className="text-sm text-morandi-secondary font-normal">- {pkg.version_name}</span>
              </DialogTitle>
            </DialogHeader>

            {/* 行程表卡片 */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden border border-border rounded-lg">
              {/* 卡片標題 */}
              <div className="flex-shrink-0 px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-morandi-primary" />
                  <span className="text-sm font-medium text-morandi-primary">行程表</span>
                </div>
                <p className="text-xs text-morandi-secondary mt-1">管理此套件的行程表</p>
              </div>

              {/* 分割線 */}
              <div className="mx-4">
                <div className="border-t border-border" />
              </div>

              {/* 內容區域 */}
              <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-morandi-secondary" />
                  </div>
                ) : linkedItineraries.length === 0 ? (
                  <div className="text-center py-8 text-sm text-morandi-secondary">
                    尚無行程表
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 行程表資訊 */}
                    {linkedItineraries.map((itinerary) => (
                      <div key={itinerary.id} className="p-4 rounded-lg border border-border/50 bg-morandi-container/20">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-4 h-4 text-morandi-gold" />
                          <span className="text-sm font-medium text-morandi-primary">
                            {stripHtml(itinerary.title) || '未命名'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-morandi-secondary mb-4">
                          {itinerary.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {itinerary.city}
                            </span>
                          )}
                          {itinerary.daily_itinerary?.length > 0 && (
                            <span>{itinerary.daily_itinerary.length} 天</span>
                          )}
                        </div>

                        {/* 操作按鈕 */}
                        <div className="grid grid-cols-3 gap-2">
                          {/* 轉報價單 */}
                          <button
                            onClick={() => {
                              onClose()
                              if (pkg.quote_id) {
                                router.push(`/quotes/${pkg.quote_id}`)
                              } else {
                                // 如果沒有報價單，可以提示或自動建立
                                void alert('尚無報價單，請先建立行程表並點擊「建立行程與報價」', 'info')
                              }
                            }}
                            className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border hover:border-morandi-gold/50 hover:bg-morandi-gold/5 transition-colors"
                          >
                            <DollarSign className="w-5 h-5 text-morandi-gold" />
                            <span className="text-xs text-morandi-primary">報價單</span>
                          </button>

                          {/* 手冊 */}
                          <button
                            onClick={() => {
                              onClose()
                              router.push(`/itinerary/print?itinerary_id=${itinerary.id}`)
                            }}
                            className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border hover:border-morandi-gold/50 hover:bg-morandi-gold/5 transition-colors"
                          >
                            <Book className="w-5 h-5 text-morandi-primary" />
                            <span className="text-xs text-morandi-primary">手冊</span>
                          </button>

                          {/* 網頁行程表 */}
                          <button
                            onClick={() => handleViewItinerary(itinerary)}
                            className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border hover:border-morandi-gold/50 hover:bg-morandi-gold/5 transition-colors"
                          >
                            <Globe className="w-5 h-5 text-morandi-green" />
                            <span className="text-xs text-morandi-primary">網頁行程</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 分割線 */}
              <div className="mx-4">
                <div className="border-t border-border" />
              </div>

              {/* 新增按鈕 */}
              <div className="flex-shrink-0 p-4">
                <button
                  onClick={handleOpenForm}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-morandi-gold hover:bg-morandi-gold-hover rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  新增
                </button>
              </div>
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
                                className="w-3 h-3 rounded border-gray-300 text-morandi-gold focus:ring-morandi-gold"
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
                                className="w-3 h-3 rounded border-gray-300 text-morandi-gold focus:ring-morandi-gold"
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
