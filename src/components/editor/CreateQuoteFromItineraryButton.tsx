/**
 * CreateQuoteFromItineraryButton - 從行程資料建立報價單的按鈕組件
 */

'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Calculator, Loader2, Plus, Link } from 'lucide-react'
import { useQuoteStore } from '@/stores'
import { DEFAULT_CATEGORIES } from '@/features/quotes/constants'
import { generateCode } from '@/stores/utils/code-generator'
import { useAuthStore } from '@/stores/auth-store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

// 取得當前 workspace code 的輔助函數
const getWorkspaceCodeFromUser = () => {
  const { user } = useAuthStore.getState()
  
  // 如果是跨 workspace 的角色，從 selected_workspace_id 取得
  if (user?.roles?.[0] === 'super_admin' && user.selected_workspace_id) {
    // 簡化的 workspace code 映射（避免依賴 workspace store）
    const workspaceMap: Record<string, string> = {
      // 可以根據實際的 workspace IDs 來設定
      // 暫時使用預設值
    }
    return workspaceMap[user.selected_workspace_id] || 'TP'
  }
  
  // 一般使用者，從 workspace_id 推算或使用預設
  // 簡化處理：如果沒有 workspace 資訊，使用 TP 作為預設
  return 'TP'
}

// 本地型別定義（與行程編輯頁面相同）
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

// 從行程資料提取餐食資訊（排除自理）
const extractMealsFromItinerary = (tourData: LocalTourData) => {
  const meals: Array<{ day: number; type: string; name: string; note?: string }> = []
  
  if (tourData.dailyItinerary) {
    tourData.dailyItinerary.forEach((day, index) => {
      const dayNumber = index + 1
      
      if (day.meals) {
        // 早餐
        if (day.meals.breakfast && !day.meals.breakfast.includes('自理')) {
          meals.push({
            day: dayNumber,
            type: '早餐',
            name: day.meals.breakfast,
            note: day.note || day.description // 加入當日備註
          })
        }
        
        // 午餐
        if (day.meals.lunch && !day.meals.lunch.includes('自理')) {
          meals.push({
            day: dayNumber,
            type: '午餐',
            name: day.meals.lunch,
            note: day.note || day.description
          })
        }
        
        // 晚餐
        if (day.meals.dinner && !day.meals.dinner.includes('自理')) {
          meals.push({
            day: dayNumber,
            type: '晚餐',
            name: day.meals.dinner,
            note: day.note || day.description
          })
        }
      }
    })
  }
  
  return meals
}

// 從行程資料提取住宿資訊
const extractHotelsFromItinerary = (tourData: LocalTourData) => {
  const hotels: Array<{ day: number; name: string; note?: string }> = []
  
  if (tourData.dailyItinerary) {
    tourData.dailyItinerary.forEach((day, index) => {
      const dayNumber = index + 1
      
      // 檢查住宿資訊
      if (day.hotel || day.accommodation) {
        const hotelName = day.hotel || day.accommodation
        if (hotelName && hotelName.trim()) {
          hotels.push({
            day: dayNumber,
            name: hotelName,
            note: day.note || day.description
          })
        }
      }
    })
  }
  
  return hotels
}

// 從行程資料提取景點活動資訊
const extractActivitiesFromItinerary = (tourData: LocalTourData) => {
  const activities: Array<{ day: number; title: string; description?: string }> = []
  
  if (tourData.dailyItinerary) {
    tourData.dailyItinerary.forEach((day, index) => {
      if (day.activities) {
        day.activities.forEach(activity => {
          activities.push({
            day: index + 1,
            title: activity.title,
            description: activity.description
          })
        })
      }
    })
  }
  
  return activities
}

// 計算行程天數
const calculateDays = (tourData: LocalTourData) => {
  if (tourData.dailyItinerary && tourData.dailyItinerary.length > 0) {
    return tourData.dailyItinerary.length
  }
  
  // 如果沒有逐日行程，嘗試從日期計算
  if (tourData.departureDate) {
    // 預設為5天行程，之後可以更精確計算
    return 5
  }
  
  return 1
}

// 從行程資料建立報價單資料
const createQuoteFromTourData = (tourData: LocalTourData) => {
  const meals = extractMealsFromItinerary(tourData)
  const hotels = extractHotelsFromItinerary(tourData)
  const activities = extractActivitiesFromItinerary(tourData)
  const days = calculateDays(tourData)
  
  // 建立報價單基本資訊
  const quoteData = {
    name: tourData.title || '未命名行程',
    destination: tourData.city || tourData.country || '未指定',
    start_date: tourData.departureDate ? new Date(tourData.departureDate.replace(/\//g, '-')).toISOString().split('T')[0] : undefined,
    days: days,
    nights: days > 0 ? days - 1 : 0,
    customer_name: '待指定',
    group_size: 1, // 預設1人，使用者可後續修改
    status: 'proposed' as const,
    quote_type: 'standard' as const,
    is_active: true,
    is_pinned: false,
    categories: DEFAULT_CATEGORIES,
    total_cost: 0,
    // 人數配置
    participant_counts: {
      adult: 1,
      child_with_bed: 0,
      child_no_bed: 0,
      single_room: 0,
      infant: 0,
    },
  }
  
  return {
    quoteData,
    mealsData: meals,
    hotelsData: hotels,
    activitiesData: activities,
  }
}

export const CreateQuoteFromItineraryButton: React.FC<CreateQuoteFromItineraryButtonProps> = ({
  tourData,
  itineraryId,
  className = '',
}) => {
  const router = useRouter()
  const { create, update, items: quotes } = useQuoteStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // 查找現有的團體報價單（未連動過的）
  const existingGroupQuotes = useMemo(() => {
    return quotes.filter(quote => 
      quote.quote_type === 'standard' && 
      !quote.tour_id
    )
  }, [quotes])

  // 處理按鈕點擊：直接顯示選擇對話框
  const handleButtonClick = () => {
    setIsDialogOpen(true)
  }

  // 建立新報價單
  const handleCreateNewQuote = async () => {
    try {
      setIsLoading(true)
      setIsDialogOpen(false)
      
      // 從行程資料建立報價單
      const { quoteData, mealsData, hotelsData, activitiesData } = createQuoteFromTourData(tourData)
      
      // 生成正確的報價單編號
      const workspaceCode = getWorkspaceCodeFromUser()
      const code = generateCode(workspaceCode, { quoteType: 'standard' }, quotes)
      
      // 如果有行程ID，關聯到報價單
      const finalQuoteData = {
        ...quoteData,
        code, // 使用正確生成的編號
        ...(itineraryId && { tour_id: itineraryId }),
        ...(tourData.tourCode && { tour_code: tourData.tourCode }),
      }
      
      // 建立報價單
      const newQuote = await create(finalQuoteData as any)
      
      if (newQuote?.id) {
        // 跳轉到報價單編輯頁面，並攜帶行程資料
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

  // 連結到現有報價單
  const handleLinkToExistingQuote = async (quoteId: string) => {
    try {
      setIsLoading(true)
      
      console.log('🔗 開始連結報價單:', quoteId)
      
      // 如果有行程ID，更新報價單的 tour_id，建立連結關係
      if (itineraryId) {
        console.log('📝 更新報價單 tour_id:', itineraryId)
        await update(quoteId, {
          tour_id: itineraryId,
          tour_code: tourData.tourCode,
        })
      }
      
      // 從行程資料提取資料
      const { mealsData, hotelsData, activitiesData } = createQuoteFromTourData(tourData)
      
      console.log('📦 提取的資料:', { 
        mealsCount: mealsData.length, 
        hotelsCount: hotelsData.length, 
        activitiesCount: activitiesData.length 
      })
      
      // 關閉對話框
      setIsDialogOpen(false)
      
      // 跳轉到現有報價單編輯頁面，並攜帶行程資料
      const urlParams = new URLSearchParams({
        meals: JSON.stringify(mealsData),
        hotels: JSON.stringify(hotelsData),
        activities: JSON.stringify(activitiesData),
        from_itinerary: 'true',
        link_itinerary: itineraryId || ''
      })
      
      console.log('🚀 跳轉到報價單頁面:', `/quotes/${quoteId}`)
      router.push(`/quotes/${quoteId}?${urlParams.toString()}`)
    } catch (error) {
      console.error('❌ 連結報價單失敗:', error)
      alert(`連結報價單失敗：${error instanceof Error ? error.message : '未知錯誤'}`)
      setIsDialogOpen(true) // 重新顯示對話框
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={handleButtonClick}
        disabled={isLoading}
        variant="outline"
        className={`flex items-center gap-2 text-morandi-primary border-morandi-primary hover:bg-morandi-primary hover:text-white transition-colors ${className}`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Calculator className="w-4 h-4" />
        )}
        {isLoading ? '處理中...' : '製作報價單'}
      </Button>

      {/* 選擇對話框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
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
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <Link className="w-4 h-4 text-morandi-secondary" />
                <span className="font-medium text-morandi-text">連結現有報價單</span>
              </div>
              
              {existingGroupQuotes.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-morandi-secondary mb-3">
                    選擇未連結的報價單，將此行程的資料帶入
                  </p>
                  {existingGroupQuotes.map((quote) => (
                    <Button
                      key={quote.id}
                      onClick={() => handleLinkToExistingQuote(quote.id)}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full justify-start gap-3 h-auto p-3 border-morandi-primary/30 hover:bg-morandi-primary/10 hover:border-morandi-primary/50"
                    >
                      <div className="text-left flex-1">
                        <div className="font-medium text-morandi-text">{quote.code || '未命名'}</div>
                        <div className="text-sm text-morandi-secondary">
                          {quote.name} • {quote.destination}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-morandi-secondary">
                  目前沒有可連結的相關報價單
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}