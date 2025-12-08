/**
 * CreateQuoteFromItineraryButton - 從行程資料建立報價單的按鈕組件
 * 包含：建立新報價單、連結現有報價單、管理已關聯報價單
 */

'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Calculator, Loader2, Plus, Link, ChevronLeft, FilePlus, FileEdit, X, ExternalLink, Unlink, AlertTriangle, Check } from 'lucide-react'
import { useQuoteStore } from '@/stores'
import { DEFAULT_CATEGORIES } from '@/features/quotes/constants'
import { generateCode } from '@/stores/utils/code-generator'
import { useAuthStore } from '@/stores/auth-store'
import type { Quote } from '@/stores/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'


// 取得當前 workspace code 的輔助函數
const getWorkspaceCodeFromUser = () => {
  const { user } = useAuthStore.getState()

  // 如果是跨 workspace 的角色，從 selected_workspace_id 取得
  if (user?.roles?.[0] === 'super_admin' && user.selected_workspace_id) {
    const workspaceMap: Record<string, string> = {}
    return workspaceMap[user.selected_workspace_id] || 'TP'
  }

  return 'TP'
}

// 本地型別定義
interface LocalTourData {
  tagline: string
  title: string
  subtitle: string
  description: string
  departureDate: string
  tourCode: string
  coverImage?: string
  country: string
  city: string
  status: string
  dailyItinerary: any[]
  [key: string]: any
}

interface CreateQuoteFromItineraryButtonProps {
  tourData: LocalTourData
  itineraryId?: string | null
  className?: string
}

// 從行程資料提取餐食資訊（排除自理，早餐通常包含在住宿中不計入）
// 只提取主行程，排除備選行程（isAlternative = true）
const extractMealsFromItinerary = (tourData: LocalTourData) => {
  const meals: Array<{ day: number; type: string; name: string; note?: string }> = []

  if (tourData.dailyItinerary) {
    // 只取主行程（非備選）
    const mainItinerary = tourData.dailyItinerary.filter(day => !day.isAlternative)

    mainItinerary.forEach((day, index) => {
      const dayNumber = index + 1

      if (day.meals) {
        // 早餐通常包含在飯店住宿中，不列入報價單餐食項目
        // if (day.meals.breakfast && !day.meals.breakfast.includes('自理')) {
        //   meals.push({ day: dayNumber, type: '早餐', name: day.meals.breakfast, note: day.note || day.description })
        // }
        if (day.meals.lunch && !day.meals.lunch.includes('自理')) {
          meals.push({ day: dayNumber, type: '午餐', name: day.meals.lunch, note: day.note || day.description })
        }
        if (day.meals.dinner && !day.meals.dinner.includes('自理')) {
          meals.push({ day: dayNumber, type: '晚餐', name: day.meals.dinner, note: day.note || day.description })
        }
      }
    })
  }

  return meals
}

// 從行程資料提取住宿資訊
// 只提取主行程，排除備選行程（isAlternative = true）
const extractHotelsFromItinerary = (tourData: LocalTourData) => {
  const hotels: Array<{ day: number; name: string; note?: string }> = []

  if (tourData.dailyItinerary) {
    // 只取主行程（非備選）
    const mainItinerary = tourData.dailyItinerary.filter(day => !day.isAlternative)

    mainItinerary.forEach((day, index) => {
      if (day.hotel || day.accommodation) {
        const hotelName = day.hotel || day.accommodation
        if (hotelName && hotelName.trim()) {
          hotels.push({ day: index + 1, name: hotelName, note: day.note || day.description })
        }
      }
    })
  }

  return hotels
}

// 從行程資料提取景點活動資訊
// 只提取主行程，排除備選行程（isAlternative = true）
const extractActivitiesFromItinerary = (tourData: LocalTourData) => {
  const activities: Array<{ day: number; title: string; description?: string }> = []

  if (tourData.dailyItinerary) {
    // 只取主行程（非備選）
    const mainItinerary = tourData.dailyItinerary.filter(day => !day.isAlternative)

    mainItinerary.forEach((day, index) => {
      if (day.activities) {
        day.activities.forEach((activity: { title: string; description?: string }) => {
          activities.push({ day: index + 1, title: activity.title, description: activity.description })
        })
      }
    })
  }

  return activities
}

// 計算行程天數（只算主行程，排除備選）
const calculateDays = (tourData: LocalTourData) => {
  if (tourData.dailyItinerary && tourData.dailyItinerary.length > 0) {
    // 只算主行程（非備選）
    const mainItinerary = tourData.dailyItinerary.filter(day => !day.isAlternative)
    return mainItinerary.length
  }
  return tourData.departureDate ? 5 : 1
}

// 從行程資料建立報價單資料
const createQuoteFromTourData = (tourData: LocalTourData) => {
  const meals = extractMealsFromItinerary(tourData)
  const hotels = extractHotelsFromItinerary(tourData)
  const activities = extractActivitiesFromItinerary(tourData)
  const days = calculateDays(tourData)
  const nights = days > 0 ? days - 1 : 0

  // 從行程資料取得人數（如果有的話）
  const groupSize = tourData.groupSize || tourData.group_size || tourData.pax || 1
  const adultCount = tourData.adultCount || tourData.adult_count || groupSize

  const quoteData = {
    name: tourData.title || '未命名行程',
    destination: tourData.city || tourData.country || '未指定',
    start_date: tourData.departureDate ? new Date(tourData.departureDate.replace(/\//g, '-')).toISOString().split('T')[0] : undefined,
    days: days,
    nights: nights,
    customer_name: '待指定',
    group_size: groupSize,
    status: 'proposed' as const,
    quote_type: 'standard' as const,
    is_active: true,
    is_pinned: false,
    categories: DEFAULT_CATEGORIES,
    total_cost: 0,
    accommodation_days: nights, // ⭐ 住宿天數 = 晚數
    participant_counts: {
      adult: adultCount,
      child_with_bed: tourData.childWithBed || tourData.child_with_bed || 0,
      child_no_bed: tourData.childNoBed || tourData.child_no_bed || 0,
      single_room: tourData.singleRoom || tourData.single_room || 0,
      infant: tourData.infant || 0,
    },
  }

  return { quoteData, mealsData: meals, hotelsData: hotels, activitiesData: activities }
}

// 對話框步驟
type DialogStep = 'select' | 'version' | 'confirm'

// 差異確認資訊
interface DifferenceInfo {
  versionIndex: number | null
  itineraryNights: number
  quoteNights: number
  itineraryMeals: number // 行程餐食數量（不含自理）
  quoteMeals: number // 報價單餐食項目數量
  hasNightsDiff: boolean
  hasMealsDiff: boolean
}

export const CreateQuoteFromItineraryButton: React.FC<CreateQuoteFromItineraryButtonProps> = ({
  tourData,
  itineraryId,
  className = '',
}) => {
  const router = useRouter()
  const { create, update, items: quotes, fetchAll, loading: quotesLoading } = useQuoteStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogStep, setDialogStep] = useState<DialogStep>('select')
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [differenceInfo, setDifferenceInfo] = useState<DifferenceInfo | null>(null)
  const [autoAdjust, setAutoAdjust] = useState({ nights: true, meals: true })

  // 組件載入時就載入報價單資料（用於偵測已關聯的報價單）
  useEffect(() => {
    if (itineraryId && quotes.length === 0) {
      fetchAll()
    }
  }, [itineraryId, quotes.length, fetchAll])

  // 當對話框打開時，確保資料最新
  useEffect(() => {
    if (isDialogOpen) {
      fetchAll()
    }
  }, [isDialogOpen, fetchAll])

  // 當對話框關閉時，重置狀態
  useEffect(() => {
    if (!isDialogOpen) {
      setDialogStep('select')
      setSelectedQuote(null)
      setDifferenceInfo(null)
      setAutoAdjust({ nights: true, meals: true })
    }
  }, [isDialogOpen])

  // 計算行程餐食數量（不含自理）
  const getItineraryMealsCount = () => {
    const meals = extractMealsFromItinerary(tourData)
    return meals.length
  }

  // 計算報價單版本的餐食項目數量
  const getQuoteMealsCount = (versionIndex: number | null) => {
    if (!selectedQuote) return 0

    let categories
    if (versionIndex === null) {
      categories = selectedQuote.categories
    } else {
      categories = selectedQuote.versions?.[versionIndex]?.categories
    }

    if (!categories) return 0
    const mealsCategory = categories.find(cat => cat.id === 'meals')
    return mealsCategory?.items?.length || 0
  }

  // 查找已關聯此行程的報價單（同時檢查 itinerary_id 和舊的 tour_id 以向後相容）
  const linkedQuotes = useMemo(() => {
    if (!itineraryId) return []
    return quotes.filter(quote => quote.itinerary_id === itineraryId || quote.tour_id === itineraryId)
  }, [quotes, itineraryId])

  // 查找未連動過的報價單
  const availableQuotes = useMemo(() => {
    return quotes.filter(quote =>
      quote.quote_type === 'standard' &&
      !quote.itinerary_id &&
      !quote.tour_id // 同時檢查舊欄位
    )
  }, [quotes])

  // 處理按鈕點擊
  const handleButtonClick = () => {
    setIsDialogOpen(true)
  }

  // 選擇報價單後進入版本選擇步驟
  const handleSelectQuote = (quote: Quote) => {
    setSelectedQuote(quote)
    setDialogStep('version')
  }

  // 返回報價單選擇
  const handleBackToSelect = () => {
    setDialogStep('select')
    setSelectedQuote(null)
  }

  // 建立新報價單
  const handleCreateNewQuote = async () => {
    try {
      setIsLoading(true)
      setIsDialogOpen(false)

      const { quoteData, mealsData, hotelsData, activitiesData } = createQuoteFromTourData(tourData)

      console.log('[CreateQuote] 提取的資料:', {
        quoteData,
        mealsData,
        hotelsData,
        activitiesData,
        tourData: {
          title: tourData.title,
          dailyItinerary: tourData.dailyItinerary?.map(d => ({
            hotel: d.hotel,
            accommodation: d.accommodation,
            meals: d.meals,
          }))
        }
      })

      const workspaceCode = getWorkspaceCodeFromUser()
      const code = generateCode(workspaceCode, { quoteType: 'standard' }, quotes)

      const finalQuoteData = {
        ...quoteData,
        code,
        ...(itineraryId && { itinerary_id: itineraryId }), // 使用新的 itinerary_id 欄位
        ...(tourData.tourCode && { tour_code: tourData.tourCode }),
      }

      const newQuote = await create(finalQuoteData as Parameters<typeof create>[0])

      if (newQuote?.id) {
        const urlParams = new URLSearchParams({
          meals: JSON.stringify(mealsData),
          hotels: JSON.stringify(hotelsData),
          activities: JSON.stringify(activitiesData),
          from_itinerary: 'true'
        })
        router.push(`/quotes/${newQuote.id}?${urlParams.toString()}`)
      }
    } catch (error) {
      console.error('建立報價單失敗:', error)
      alert('建立報價單失敗，請重試')
    } finally {
      setIsLoading(false)
    }
  }

  // 檢查差異並決定是否需要確認
  const checkDifferencesAndProceed = (versionIndex: number | null) => {
    if (!selectedQuote) return

    const itineraryNights = calculateDays(tourData) - 1
    const quoteNights = versionIndex === null
      ? (selectedQuote.accommodation_days || 0)
      : (selectedQuote.versions?.[versionIndex]?.accommodation_days || 0)

    const itineraryMeals = getItineraryMealsCount()
    const quoteMeals = getQuoteMealsCount(versionIndex)

    const hasNightsDiff = quoteNights > 0 && quoteNights !== itineraryNights
    const hasMealsDiff = quoteMeals > 0 && quoteMeals !== itineraryMeals

    // 如果有差異，進入確認步驟
    if (hasNightsDiff || hasMealsDiff) {
      setDifferenceInfo({
        versionIndex,
        itineraryNights,
        quoteNights,
        itineraryMeals,
        quoteMeals,
        hasNightsDiff,
        hasMealsDiff,
      })
      setDialogStep('confirm')
    } else {
      // 沒有差異，直接連結
      handleLinkToVersion(versionIndex, false, false)
    }
  }

  // 連結到現有報價單的某個版本
  const handleLinkToVersion = async (
    versionIndex: number | null,
    adjustNights: boolean = false,
    adjustMeals: boolean = false
  ) => {
    if (!selectedQuote) return

    try {
      setIsLoading(true)

      if (itineraryId) {
        await update(selectedQuote.id, {
          itinerary_id: itineraryId, // 使用新的 itinerary_id 欄位
          tour_code: tourData.tourCode,
        })
      }

      const { mealsData, hotelsData, activitiesData } = createQuoteFromTourData(tourData)
      setIsDialogOpen(false)

      const urlParams = new URLSearchParams({
        meals: JSON.stringify(mealsData),
        hotels: JSON.stringify(hotelsData),
        activities: JSON.stringify(activitiesData),
        from_itinerary: 'true',
        link_itinerary: itineraryId || '',
        ...(versionIndex !== null && { version: versionIndex.toString() }),
        ...(adjustNights && { adjust_nights: 'true' }),
        ...(adjustMeals && { adjust_meals: 'true' }),
      })

      router.push(`/quotes/${selectedQuote.id}?${urlParams.toString()}`)
    } catch (error) {
      console.error('連結報價單失敗:', error)
      alert(`連結報價單失敗：${error instanceof Error ? error.message : '未知錯誤'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 確認後執行連結
  const handleConfirmLink = () => {
    if (!differenceInfo) return
    handleLinkToVersion(
      differenceInfo.versionIndex,
      autoAdjust.nights && differenceInfo.hasNightsDiff,
      autoAdjust.meals && differenceInfo.hasMealsDiff
    )
  }

  // 建立新版本並連結
  const handleCreateNewVersion = async () => {
    if (!selectedQuote) return

    try {
      setIsLoading(true)

      const { mealsData, hotelsData, activitiesData } = createQuoteFromTourData(tourData)

      if (itineraryId) {
        await update(selectedQuote.id, {
          itinerary_id: itineraryId, // 使用新的 itinerary_id 欄位
          tour_code: tourData.tourCode,
        })
      }

      setIsDialogOpen(false)

      const urlParams = new URLSearchParams({
        meals: JSON.stringify(mealsData),
        hotels: JSON.stringify(hotelsData),
        activities: JSON.stringify(activitiesData),
        from_itinerary: 'true',
        link_itinerary: itineraryId || '',
        create_new_version: 'true',
      })

      router.push(`/quotes/${selectedQuote.id}?${urlParams.toString()}`)
    } catch (error) {
      console.error('建立新版本失敗:', error)
      alert(`建立新版本失敗：${error instanceof Error ? error.message : '未知錯誤'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 取消關聯
  const handleUnlink = async (quoteId: string) => {
    if (!confirm('確定要取消此報價單與行程的關聯嗎？')) return

    try {
      setIsLoading(true)
      await update(quoteId, {
        itinerary_id: null, // 清除新欄位
        tour_id: null, // 同時清除舊欄位（向後相容）
        tour_code: null,
      })
      // 重新載入
      await fetchAll()
    } catch (error) {
      console.error('取消關聯失敗:', error)
      alert(`取消關聯失敗：${error instanceof Error ? error.message : '未知錯誤'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 前往報價單
  const handleGoToQuote = (quoteId: string) => {
    router.push(`/quotes/${quoteId}`)
  }

  // 如果有已關聯的報價單，顯示管理介面
  if (linkedQuotes.length > 0) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`h-8 px-3 flex items-center gap-2 border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ${className}`}
          >
            <Calculator size={14} />
            報價單
            <span className="bg-emerald-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {linkedQuotes.length}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2" align="end">
          <div className="space-y-2">
            <div className="text-xs font-medium text-morandi-secondary px-2 py-1">已關聯的報價單</div>

            {linkedQuotes.map((quote) => (
              <div
                key={quote.id}
                className="flex items-center gap-2 p-2 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-morandi-primary truncate">{quote.code}</div>
                  <div className="text-xs text-morandi-secondary truncate">{quote.name}</div>
                </div>
                <button
                  onClick={() => handleGoToQuote(quote.id)}
                  className="p-1.5 rounded hover:bg-white transition-colors"
                  title="開啟報價單"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-morandi-secondary" />
                </button>
                <button
                  onClick={() => handleUnlink(quote.id)}
                  disabled={isLoading}
                  className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                  title="取消關聯"
                >
                  <Unlink className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <div className="border-t pt-2 mt-2">
              <button
                onClick={handleButtonClick}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-md text-sm text-morandi-primary hover:bg-morandi-primary/5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                新增關聯
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  // 沒有已關聯的報價單，顯示原本的按鈕
  return (
    <>
      <Button
        onClick={handleButtonClick}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className={`h-8 px-3 flex items-center gap-2 text-morandi-primary border-morandi-primary hover:bg-morandi-primary hover:text-white transition-colors ${className}`}
      >
        {isLoading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Calculator size={14} />
        )}
        {isLoading ? '處理中...' : '製作報價單'}
      </Button>

      {/* 選擇對話框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          {dialogStep === 'select' ? (
            <>
              <DialogHeader>
                <DialogTitle>製作報價單</DialogTitle>
                <DialogDescription>
                  將行程資料自動帶入報價單（住宿、餐食、備註等）
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* 新建報價單區域 */}
                <div className="p-4 border border-morandi-primary/20 rounded-lg bg-morandi-primary/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Plus className="w-4 h-4 text-morandi-primary" />
                    <span className="font-medium text-morandi-primary">建立新報價單</span>
                  </div>
                  <p className="text-sm text-morandi-secondary mb-3">
                    為此行程建立全新的報價單，自動帶入住宿、餐食等詳細資料
                  </p>
                  <Button
                    onClick={handleCreateNewQuote}
                    disabled={isLoading}
                    className="w-full bg-morandi-primary hover:bg-morandi-primary/90 text-white"
                  >
                    {isLoading ? '建立中...' : '建立新報價單'}
                  </Button>
                </div>

                {/* 連結現有報價單區域 */}
                <div className="p-3 border border-gray-200 rounded-lg bg-gray-50/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Link className="w-3.5 h-3.5 text-morandi-secondary" />
                    <span className="text-sm font-medium text-morandi-text">連結現有報價單</span>
                  </div>

                  {quotesLoading ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-morandi-secondary" />
                      <span className="text-xs text-morandi-secondary">載入中...</span>
                    </div>
                  ) : availableQuotes.length > 0 ? (
                    <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
                      {availableQuotes.map((quote) => (
                        <button
                          key={quote.id}
                          onClick={() => handleSelectQuote(quote)}
                          disabled={isLoading}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-left text-sm border border-transparent bg-white hover:bg-morandi-primary/5 hover:border-morandi-primary/20 transition-colors disabled:opacity-50"
                        >
                          <span className="font-medium text-morandi-primary shrink-0">{quote.code}</span>
                          <span className="text-morandi-secondary truncate">{quote.name}</span>
                          {quote.versions && quote.versions.length > 0 && (
                            <span className="text-xs bg-morandi-primary/10 text-morandi-primary px-1.5 py-0.5 rounded shrink-0">
                              {quote.versions.length + 1} 版
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-morandi-secondary py-1">
                      目前沒有可連結的報價單
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : dialogStep === 'version' ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBackToSelect}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <DialogTitle className="text-base">
                      {selectedQuote?.code} - 選擇版本
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      行程：{calculateDays(tourData)} 天 {calculateDays(tourData) - 1} 晚
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-3">
                {/* 建立新版本 */}
                <button
                  onClick={handleCreateNewVersion}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-morandi-primary/30 bg-morandi-primary/5 hover:bg-morandi-primary/10 hover:border-morandi-primary/50 transition-colors text-left disabled:opacity-50"
                >
                  <FilePlus className="w-5 h-5 text-morandi-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-morandi-primary">建立新版本</div>
                    <div className="text-xs text-morandi-secondary">以行程資料建立新的報價版本</div>
                  </div>
                </button>

                {/* 現有版本列表 */}
                <div className="space-y-1.5">
                  <div className="text-xs text-morandi-secondary px-1">或選擇現有版本帶入資料：</div>

                  {/* 主版本 */}
                  {(() => {
                    const itineraryNights = calculateDays(tourData) - 1
                    const quoteNights = selectedQuote?.accommodation_days || 0
                    const mismatch = quoteNights > 0 && quoteNights !== itineraryNights
                    return (
                      <button
                        onClick={() => checkDifferencesAndProceed(null)}
                        disabled={isLoading}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-md border bg-white hover:bg-gray-50 transition-colors text-left disabled:opacity-50 ${mismatch ? 'border-amber-300' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <FileEdit className="w-4 h-4 text-morandi-secondary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-morandi-text flex items-center gap-2">
                            主版本
                            {mismatch && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                {quoteNights}晚 ≠ {itineraryNights}晚
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-morandi-secondary">
                            {selectedQuote?.group_size || 0} 人
                            {selectedQuote?.selling_prices?.adult ? ` · NT$ ${selectedQuote.selling_prices.adult.toLocaleString()}` : ''}
                          </div>
                        </div>
                      </button>
                    )
                  })()}

                  {/* 其他版本 */}
                  {selectedQuote?.versions?.map((version, index) => {
                    const itineraryNights = calculateDays(tourData) - 1
                    const versionNights = version.accommodation_days || 0
                    const mismatch = versionNights > 0 && versionNights !== itineraryNights
                    return (
                      <button
                        key={version.id}
                        onClick={() => checkDifferencesAndProceed(index)}
                        disabled={isLoading}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-md border bg-white hover:bg-gray-50 transition-colors text-left disabled:opacity-50 ${mismatch ? 'border-amber-300' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <FileEdit className="w-4 h-4 text-morandi-secondary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-morandi-text flex items-center gap-2">
                            {version.note || `版本 ${version.version}`}
                            {mismatch && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                {versionNights}晚 ≠ {itineraryNights}晚
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-morandi-secondary">
                            {version.group_size} 人
                            {version.selling_prices?.adult ? ` · NT$ ${version.selling_prices.adult.toLocaleString()}` : ''}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          ) : dialogStep === 'confirm' && differenceInfo ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDialogStep('version')}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <DialogTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      確認差異
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      行程與報價單版本資料不一致，請確認是否自動調整
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* 差異列表 */}
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-3">
                  {differenceInfo.hasNightsDiff && (
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="adjust-nights"
                        checked={autoAdjust.nights}
                        onChange={(e) => setAutoAdjust(prev => ({ ...prev, nights: e.target.checked }))}
                        className="mt-1 rounded border-amber-400 text-morandi-primary focus:ring-morandi-primary"
                      />
                      <label htmlFor="adjust-nights" className="flex-1 cursor-pointer">
                        <div className="text-sm font-medium text-amber-800">住宿天數不符</div>
                        <div className="text-xs text-amber-700">
                          行程 {differenceInfo.itineraryNights} 晚，報價單 {differenceInfo.quoteNights} 晚
                        </div>
                        <div className="text-xs text-morandi-secondary mt-0.5">
                          勾選後將自動補齊住宿天數
                        </div>
                      </label>
                    </div>
                  )}

                  {differenceInfo.hasMealsDiff && (
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="adjust-meals"
                        checked={autoAdjust.meals}
                        onChange={(e) => setAutoAdjust(prev => ({ ...prev, meals: e.target.checked }))}
                        className="mt-1 rounded border-amber-400 text-morandi-primary focus:ring-morandi-primary"
                      />
                      <label htmlFor="adjust-meals" className="flex-1 cursor-pointer">
                        <div className="text-sm font-medium text-amber-800">餐食數量不符</div>
                        <div className="text-xs text-amber-700">
                          行程 {differenceInfo.itineraryMeals} 餐，報價單 {differenceInfo.quoteMeals} 餐
                        </div>
                        <div className="text-xs text-morandi-secondary mt-0.5">
                          勾選後將依行程餐食數量調整
                        </div>
                      </label>
                    </div>
                  )}
                </div>

                {/* 按鈕 */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => setDialogStep('version')}
                    variant="outline"
                    className="flex-1"
                  >
                    返回
                  </Button>
                  <Button
                    onClick={handleConfirmLink}
                    disabled={isLoading}
                    className="flex-1 bg-morandi-primary hover:bg-morandi-primary/90 text-white"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    ) : (
                      <Check className="w-4 h-4 mr-1.5" />
                    )}
                    確認連結
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
