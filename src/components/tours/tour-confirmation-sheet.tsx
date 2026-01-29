'use client'

/**
 * TourConfirmationSheet - 團確單總覽
 *
 * 從行程表的 daily_itinerary 讀取住宿/餐食資料，
 * 按供應商分組顯示，並提供「產生需求單」按鈕
 *
 * 流程：
 * 行程表 → 團確單（內部確認） → 產生需求單 → 發給供應商
 */

import { useMemo, useState, useCallback } from 'react'
import {
  Hotel,
  Utensils,
  Plus,
  Check,
  Loader2,
  Calendar,
  FileText,
  DollarSign,
  Building2,
  Bus,
  Ticket,
  UtensilsCrossed,
  Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useItineraries } from '@/data'
import { useTourRequests } from '@/stores/tour-request-store'
import { useToursSlim } from '@/data'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/components/ui/use-toast'
import { QuickRequestFromItemDialog } from '@/features/finance/requests/components/QuickRequestFromItemDialog'
import type { DailyItineraryDay } from '@/stores/types/tour.types'

interface TourConfirmationSheetProps {
  tourId: string
}

// 住宿項目（從行程表解析）
interface AccommodationItem {
  dayIndex: number
  dayLabel: string
  date: string
  hotelName: string
}

// 餐食項目（從行程表解析）
interface MealItem {
  dayIndex: number
  dayLabel: string
  date: string
  mealType: '早餐' | '午餐' | '晚餐'
  restaurantName: string
}

// 按供應商分組的結果
interface SupplierGroup<T> {
  supplierName: string
  items: T[]
}

export function TourConfirmationSheet({ tourId }: TourConfirmationSheetProps) {
  const { items: tours } = useToursSlim()
  const { items: itineraries, loading: itineraryLoading } = useItineraries()
  const { items: existingRequests, fetchAll: refreshRequests } = useTourRequests()
  const { user: currentUser } = useAuthStore()
  const { toast } = useToast()

  const [generatingFor, setGeneratingFor] = useState<string | null>(null)

  // 快速請款對話框狀態
  const [quickRequestItem, setQuickRequestItem] = useState<{
    id: string
    category: string
    title: string
    supplierName: string
    supplierId: string
    estimatedCost: number
    tourId: string
    tourCode: string
    tourName: string
  } | null>(null)

  // 找到當前團
  const tour = useMemo(() => {
    return tours.find(t => t.id === tourId)
  }, [tours, tourId])

  // 找到關聯的行程表
  const itinerary = useMemo(() => {
    if (!tour) return null
    // 優先使用鎖定的行程 ID，否則嘗試用 tour_id 匹配
    if (tour.locked_itinerary_id) {
      return itineraries.find(i => i.id === tour.locked_itinerary_id)
    }
    // 備用：用 tour_id 找
    return itineraries.find(i => i.tour_id === tourId)
  }, [tour, itineraries, tourId])

  // 解析住宿資料並按飯店分組
  const hotelGroups = useMemo((): SupplierGroup<AccommodationItem>[] => {
    if (!itinerary?.daily_itinerary) return []

    const items: AccommodationItem[] = []
    const dailyItinerary = itinerary.daily_itinerary as DailyItineraryDay[]

    dailyItinerary.forEach((day, index) => {
      if (day.accommodation && day.accommodation.trim() && day.accommodation !== '溫暖的家') {
        items.push({
          dayIndex: index,
          dayLabel: day.dayLabel || `Day ${index + 1}`,
          date: day.date || '',
          hotelName: day.accommodation.trim(),
        })
      }
    })

    // 按飯店名稱分組
    const grouped: Record<string, AccommodationItem[]> = {}
    items.forEach(item => {
      const name = item.hotelName
      if (!grouped[name]) {
        grouped[name] = []
      }
      grouped[name].push(item)
    })

    return Object.entries(grouped).map(([supplierName, items]) => ({
      supplierName,
      items: items.sort((a, b) => a.dayIndex - b.dayIndex),
    }))
  }, [itinerary])

  // 解析餐食資料並按餐廳分組
  const restaurantGroups = useMemo((): SupplierGroup<MealItem>[] => {
    if (!itinerary?.daily_itinerary) return []

    const items: MealItem[] = []
    const dailyItinerary = itinerary.daily_itinerary as DailyItineraryDay[]

    dailyItinerary.forEach((day, index) => {
      const meals = day.meals
      if (!meals) return

      // 早餐
      if (meals.breakfast && !isDefaultMeal(meals.breakfast)) {
        items.push({
          dayIndex: index,
          dayLabel: day.dayLabel || `Day ${index + 1}`,
          date: day.date || '',
          mealType: '早餐',
          restaurantName: meals.breakfast.trim(),
        })
      }

      // 午餐
      if (meals.lunch && !isDefaultMeal(meals.lunch)) {
        items.push({
          dayIndex: index,
          dayLabel: day.dayLabel || `Day ${index + 1}`,
          date: day.date || '',
          mealType: '午餐',
          restaurantName: meals.lunch.trim(),
        })
      }

      // 晚餐
      if (meals.dinner && !isDefaultMeal(meals.dinner)) {
        items.push({
          dayIndex: index,
          dayLabel: day.dayLabel || `Day ${index + 1}`,
          date: day.date || '',
          mealType: '晚餐',
          restaurantName: meals.dinner.trim(),
        })
      }
    })

    // 按餐廳名稱分組
    const grouped: Record<string, MealItem[]> = {}
    items.forEach(item => {
      const name = item.restaurantName
      if (!grouped[name]) {
        grouped[name] = []
      }
      grouped[name].push(item)
    })

    return Object.entries(grouped).map(([supplierName, items]) => ({
      supplierName,
      items: items.sort((a, b) => a.dayIndex - b.dayIndex),
    }))
  }, [itinerary])

  // 過濾出有供應商的需求單（可請款）
  const requestsWithSupplier = useMemo(() => {
    return existingRequests.filter(req =>
      req.tour_id === tourId &&
      req.supplier_id // 有供應商 ID 才能請款
    )
  }, [existingRequests, tourId])

  // 檢查是否已產生需求單
  const hasExistingRequest = useCallback((supplierName: string, category: string) => {
    return existingRequests.some(req =>
      req.tour_id === tourId &&
      req.supplier_name === supplierName &&
      req.category === category
    )
  }, [existingRequests, tourId])

  // 取得類別圖標
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hotel':
      case '住宿':
        return <Hotel size={14} className="text-blue-600" />
      case 'transportation':
      case '交通':
        return <Bus size={14} className="text-green-600" />
      case 'activity':
      case 'ticket':
      case '門票':
        return <Ticket size={14} className="text-purple-600" />
      case 'restaurant':
      case 'meal':
      case '餐食':
        return <UtensilsCrossed size={14} className="text-orange-600" />
      default:
        return <Package size={14} className="text-morandi-secondary" />
    }
  }

  // 處理請款按鈕點擊
  const handleRequestPayment = (request: typeof existingRequests[0]) => {
    if (!tour) return

    setQuickRequestItem({
      id: request.id,
      category: request.category,
      title: request.title,
      supplierName: request.supplier_name || '未知供應商',
      supplierId: request.supplier_id || '',
      estimatedCost: request.estimated_cost || 0,
      tourId: tourId,
      tourCode: tour.code || '',
      tourName: tour.name || '',
    })
  }

  // 產生需求單
  const handleGenerateRequest = useCallback(async (
    supplierName: string,
    category: 'hotel' | 'restaurant',
    items: AccommodationItem[] | MealItem[]
  ) => {
    if (!tour) return

    setGeneratingFor(`${category}-${supplierName}`)

    try {
      // 計算服務日期範圍
      const dates = items.map(item => item.date).filter(Boolean)
      const serviceDate = dates[0] || ''
      const serviceDateEnd = dates.length > 1 ? dates[dates.length - 1] : serviceDate

      // 產生描述
      let description = ''
      if (category === 'hotel') {
        const hotelItems = items as AccommodationItem[]
        description = hotelItems.map(item => `${item.dayLabel} (${item.date})`).join('\n')
      } else {
        const mealItems = items as MealItem[]
        description = mealItems.map(item => `${item.dayLabel} ${item.mealType} (${item.date})`).join('\n')
      }

      // 透過 API 建立需求單（API 會自動產生編號）
      const response = await fetch('/api/tour-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: tour.workspace_id || '',
          tour_id: tourId,
          tour_code: tour.code,
          tour_name: tour.name,
          title: `${supplierName} - ${category === 'hotel' ? '住宿預訂' : '餐食預訂'}`,
          category,
          supplier_name: supplierName,
          service_date: serviceDate,
          service_date_end: serviceDateEnd,
          quantity: items.length,
          description,
          status: 'draft',
          handler_type: 'internal',
          created_by: currentUser?.id || '',
          created_by_name: currentUser?.name || '',
        }),
      })

      if (!response.ok) {
        throw new Error('API request failed')
      }

      // 重新載入需求單列表
      await refreshRequests()

      toast({
        title: '需求單已建立',
        description: `${supplierName} 的需求單已建立為草稿`,
      })
    } catch (error) {
      toast({
        title: '建立失敗',
        description: '無法建立需求單，請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setGeneratingFor(null)
    }
  }, [tour, tourId, currentUser, refreshRequests, toast])

  // Loading 狀態
  if (itineraryLoading) {
    return (
      <div className="flex items-center justify-center h-32 text-morandi-secondary">
        <Loader2 className="animate-spin mr-2" size={20} />
        載入中...
      </div>
    )
  }

  // 沒有行程表
  if (!itinerary) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-morandi-secondary">
        <FileText size={32} className="mb-2 opacity-50" />
        <p>此團尚未關聯行程表</p>
        <p className="text-xs mt-1">請先建立或關聯行程表</p>
      </div>
    )
  }

  // 沒有任何住宿/餐食資料
  if (hotelGroups.length === 0 && restaurantGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-morandi-secondary">
        <Calendar size={32} className="mb-2 opacity-50" />
        <p>行程表尚無住宿/餐食資料</p>
        <p className="text-xs mt-1">請先在行程表填寫每日住宿和餐食</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {/* 住宿表 */}
      {hotelGroups.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-blue-500 text-white">
            <Hotel size={18} />
            <span className="font-medium">住宿表</span>
            <span className="text-blue-100 text-sm">({hotelGroups.length} 間飯店)</span>
          </div>
          <div className="bg-card p-4 space-y-4">
            {hotelGroups.map(group => {
              const hasRequest = hasExistingRequest(group.supplierName, 'hotel')
              const isGenerating = generatingFor === `hotel-${group.supplierName}`

              return (
                <div key={group.supplierName} className="border border-border rounded-lg overflow-hidden">
                  {/* 飯店名稱標題 */}
                  <div className="flex items-center justify-between px-4 py-2 bg-morandi-container/50 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Hotel size={14} className="text-morandi-gold" />
                      <span className="font-medium text-morandi-primary">{group.supplierName}</span>
                      <span className="text-xs text-morandi-secondary">({group.items.length} 晚)</span>
                    </div>
                    {hasRequest ? (
                      <span className="flex items-center gap-1 text-xs text-morandi-green">
                        <Check size={14} />
                        已建立需求單
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleGenerateRequest(group.supplierName, 'hotel', group.items)}
                        disabled={isGenerating}
                        className="h-7 text-xs bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                      >
                        {isGenerating ? (
                          <Loader2 size={12} className="animate-spin mr-1" />
                        ) : (
                          <Plus size={12} className="mr-1" />
                        )}
                        產生需求單
                      </Button>
                    )}
                  </div>

                  {/* 日期列表 */}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-morandi-container/30 text-morandi-secondary">
                        <th className="text-left px-3 py-2 font-medium w-24">日期</th>
                        <th className="text-left px-3 py-2 font-medium">天數</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {group.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-morandi-container/10">
                          <td className="px-3 py-2 text-morandi-primary">{item.date}</td>
                          <td className="px-3 py-2 text-morandi-secondary">{item.dayLabel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 餐食表 */}
      {restaurantGroups.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-orange-500 text-white">
            <Utensils size={18} />
            <span className="font-medium">餐食表</span>
            <span className="text-orange-100 text-sm">({restaurantGroups.length} 間餐廳)</span>
          </div>
          <div className="bg-card p-4 space-y-4">
            {restaurantGroups.map(group => {
              const hasRequest = hasExistingRequest(group.supplierName, 'restaurant')
              const isGenerating = generatingFor === `restaurant-${group.supplierName}`

              return (
                <div key={group.supplierName} className="border border-border rounded-lg overflow-hidden">
                  {/* 餐廳名稱標題 */}
                  <div className="flex items-center justify-between px-4 py-2 bg-morandi-container/50 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Utensils size={14} className="text-morandi-gold" />
                      <span className="font-medium text-morandi-primary">{group.supplierName}</span>
                      <span className="text-xs text-morandi-secondary">({group.items.length} 餐)</span>
                    </div>
                    {hasRequest ? (
                      <span className="flex items-center gap-1 text-xs text-morandi-green">
                        <Check size={14} />
                        已建立需求單
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleGenerateRequest(group.supplierName, 'restaurant', group.items)}
                        disabled={isGenerating}
                        className="h-7 text-xs bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                      >
                        {isGenerating ? (
                          <Loader2 size={12} className="animate-spin mr-1" />
                        ) : (
                          <Plus size={12} className="mr-1" />
                        )}
                        產生需求單
                      </Button>
                    )}
                  </div>

                  {/* 餐別列表 */}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-morandi-container/30 text-morandi-secondary">
                        <th className="text-left px-3 py-2 font-medium w-24">日期</th>
                        <th className="text-left px-3 py-2 font-medium w-20">天數</th>
                        <th className="text-left px-3 py-2 font-medium">餐別</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {group.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-morandi-container/10">
                          <td className="px-3 py-2 text-morandi-primary">{item.date}</td>
                          <td className="px-3 py-2 text-morandi-secondary">{item.dayLabel}</td>
                          <td className="px-3 py-2 text-morandi-primary">{item.mealType}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 需求單項目（有供應商可請款） */}
      {requestsWithSupplier.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-morandi-gold text-white">
            <DollarSign size={18} />
            <span className="font-medium">需求單項目</span>
            <span className="text-white/80 text-sm">({requestsWithSupplier.length} 項可請款)</span>
          </div>
          <div className="bg-card divide-y divide-border">
            {requestsWithSupplier.map(request => (
              <div
                key={request.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-morandi-container/20"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="mt-0.5">{getCategoryIcon(request.category)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-morandi-primary truncate">
                        {request.title}
                      </span>
                      {request.status && (
                        <span className={`
                          text-xs px-1.5 py-0.5 rounded
                          ${request.status === 'confirmed' ? 'bg-morandi-green/20 text-morandi-green' : ''}
                          ${request.status === 'draft' ? 'bg-morandi-container text-morandi-secondary' : ''}
                          ${request.status === 'processing' ? 'bg-morandi-gold/20 text-morandi-gold' : ''}
                        `}>
                          {request.status === 'confirmed' ? '已確認' :
                           request.status === 'draft' ? '草稿' :
                           request.status === 'processing' ? '處理中' : request.status}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-morandi-secondary mt-1">
                      <span className="flex items-center gap-1">
                        <Building2 size={12} />
                        {request.supplier_name || '未知供應商'}
                      </span>
                      {request.service_date && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {request.service_date}
                          {request.service_date_end && request.service_date_end !== request.service_date && (
                            <> ~ {request.service_date_end}</>
                          )}
                        </span>
                      )}
                    </div>
                    {(request.estimated_cost || request.final_cost) && (
                      <div className="text-xs text-morandi-secondary mt-1">
                        {request.final_cost
                          ? `確認成本：NT$ ${request.final_cost.toLocaleString()}`
                          : `預估成本：NT$ ${(request.estimated_cost || 0).toLocaleString()}`}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleRequestPayment(request)}
                  className="h-8 px-3 gap-1.5 bg-morandi-gold hover:bg-morandi-gold-hover text-white flex-shrink-0"
                >
                  <DollarSign size={14} />
                  請款
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 快速請款對話框 */}
      {quickRequestItem && (
        <QuickRequestFromItemDialog
          open={!!quickRequestItem}
          onOpenChange={(open) => {
            if (!open) setQuickRequestItem(null)
          }}
          item={quickRequestItem}
          onSuccess={() => {
            refreshRequests()
            toast({
              title: '請款單已建立',
              description: `${quickRequestItem.supplierName} 的請款單已建立`,
            })
          }}
        />
      )}
    </div>
  )
}

// 判斷是否為預設餐食（不需要建立需求單）
function isDefaultMeal(meal: string): boolean {
  const defaultMeals = [
    '敬請自理',
    '自理',
    '飯店內早餐',
    '飯店早餐',
    '機上餐食',
    '溫暖的家',
    '機上用餐',
    '-',
    '',
  ]
  return defaultMeals.some(d => meal.includes(d))
}
