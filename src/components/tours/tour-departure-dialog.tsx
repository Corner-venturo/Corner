'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tour } from '@/types/tour.types'
import { supabase as supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { RefreshCw, Edit2, Save, X, Plus, Trash2, Calculator, Loader2, ExternalLink, Check } from 'lucide-react'
import type {
  TourDepartureData,
  TourDepartureMeal,
  TourDepartureAccommodation,
  TourDepartureActivity,
  TourDepartureOther,
} from '@/types/tour-departure.types'
// Quote 類型由 LinkedQuoteInfo 本地介面取代

const supabase = supabaseClient

// 報價單資訊介面
interface LinkedQuoteInfo {
  id: string
  code: string | null
  name: string | null
  status: string | null
  total_amount: number | null
  created_at: string
}

interface TourDepartureDialogProps {
  tour: Tour
  open: boolean
  onOpenChange: (open: boolean) => void
}

// 定義表格資料的通用介面
interface TableItem {
  id: string
  date: string
  item_name?: string | null
  restaurant_name?: string | null
  hotel_name?: string | null
  venue_name?: string | null
  unit_price?: number | null
  quantity?: number | null
  subtotal?: number | null
  expected_amount?: number | null
  actual_amount?: number | null
  notes?: string | null
}

export function TourDepartureDialog({ tour, open, onOpenChange }: TourDepartureDialogProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [data, setData] = useState<TourDepartureData | null>(null)
  const [meals, setMeals] = useState<TourDepartureMeal[]>([])
  const [accommodations, setAccommodations] = useState<TourDepartureAccommodation[]>([])
  const [activities, setActivities] = useState<TourDepartureActivity[]>([])
  const [others, setOthers] = useState<TourDepartureOther[]>([])

  // 報價單相關狀態
  const [linkedQuotes, setLinkedQuotes] = useState<LinkedQuoteInfo[]>([])
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)
  const [showQuoteSelector, setShowQuoteSelector] = useState(false)
  const [loadingQuotes, setLoadingQuotes] = useState(false)

  // 計算天數
  const tourDays = useMemo(() => {
    if (!tour.departure_date || !tour.return_date) return 0
    const start = new Date(tour.departure_date)
    const end = new Date(tour.return_date)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }, [tour.departure_date, tour.return_date])

  // 載入出團資料
  useEffect(() => {
    if (open) {
      loadDepartureData()
      loadLinkedQuotes()
    }
  }, [open, tour.id])

  // 載入所有關聯的報價單（可能有多個版本）
  const loadLinkedQuotes = async () => {
    try {
      setLoadingQuotes(true)

      // 從 quotes 表查找所有 tour_id 對應的報價單
      const { data: quotes, error } = await supabase
        .from('quotes')
        .select('id, code, name, status, total_amount, created_at')
        .eq('tour_id', tour.id)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('載入報價單失敗:', error)
        return
      }

      const quotesData = (quotes || []) as LinkedQuoteInfo[]
      setLinkedQuotes(quotesData)

      // 如果有報價單，預設選擇最新的
      if (quotesData.length > 0) {
        setSelectedQuoteId(quotesData[0].id)
      } else if (tour.quote_id) {
        // 如果 tour 本身有 quote_id，載入該報價單
        const { data: singleQuote, error: singleError } = await supabase
          .from('quotes')
          .select('id, code, name, status, total_amount, created_at')
          .eq('id', tour.quote_id)
          .single()

        if (!singleError && singleQuote) {
          setLinkedQuotes([singleQuote as LinkedQuoteInfo])
          setSelectedQuoteId(singleQuote.id)
        }
      }
    } catch (error) {
      logger.error('查找報價單失敗:', error)
    } finally {
      setLoadingQuotes(false)
    }
  }

  // 處理報價單選擇
  const handleSelectQuote = (quoteId: string) => {
    setSelectedQuoteId(quoteId)
    setShowQuoteSelector(false)
    loadFromQuoteById(quoteId)
  }

  // 從報價單自動帶入資料
  const loadFromQuote = async () => {
    // 如果有多個報價單，顯示選擇器
    if (linkedQuotes.length > 1) {
      setShowQuoteSelector(true)
      return
    }

    // 如果只有一個報價單，直接帶入
    const quoteId = selectedQuoteId || linkedQuotes[0]?.id || tour.quote_id
    if (!quoteId) {
      toast.error('此團沒有關聯的報價單')
      return
    }

    await loadFromQuoteById(quoteId)
  }

  // 從指定報價單載入資料
  const loadFromQuoteById = async (quoteId: string) => {
    if (!quoteId) {
      toast.error('此團沒有關聯的報價單')
      return
    }

    setLoading(true)
    try {
      logger.info('開始載入報價單資料, quoteId:', quoteId)

      // 載入報價單
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('*, quick_quote_items')
        .eq('id', quoteId)
        .single()

      if (quoteError) {
        logger.error('載入報價單失敗:', quoteError)
        throw quoteError
      }

      logger.info('報價單載入成功:', quote?.id, quote?.name)

      // 載入報價項目
      const { data: quoteItems, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId)
        .order('display_order', { ascending: true })

      if (itemsError) {
        logger.error('載入報價項目失敗:', itemsError)
        throw itemsError
      }

      logger.info('報價項目載入成功, 數量:', quoteItems?.length || 0)

      // 根據項目類型分類
      const mealItems: TourDepartureMeal[] = []
      const accomItems: TourDepartureAccommodation[] = []
      const activityItems: TourDepartureActivity[] = []
      const otherItems: TourDepartureOther[] = []

      // 處理 quote_items
      // 欄位對應: description (名稱), category (分類), item_type (類型)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      quoteItems?.forEach((item: any, index: number) => {
        const baseDate = tour.departure_date || new Date().toISOString().split('T')[0]
        const itemName = item.description || ''
        const category = item.category?.toLowerCase() || ''
        const itemType = item.item_type?.toLowerCase() || ''

        if (itemType === 'meals' || category.includes('餐') || category.includes('meal')) {
          mealItems.push({
            id: `meal-${index}`,
            departure_data_id: data?.id || '',
            date: baseDate,
            restaurant_name: itemName,
            unit_price: item.unit_price,
            quantity: item.quantity,
            subtotal: item.total_price,
            expected_amount: item.total_price,
            notes: item.notes,
            display_order: index,
          })
        } else if (itemType === 'accommodation' || category.includes('住宿') || category.includes('飯店') || category.includes('hotel')) {
          accomItems.push({
            id: `accom-${index}`,
            departure_data_id: data?.id || '',
            date: baseDate,
            hotel_name: itemName,
            unit_price: item.unit_price,
            quantity: item.quantity,
            subtotal: item.total_price,
            expected_amount: item.total_price,
            notes: item.notes,
            display_order: index,
          })
        } else if (itemType === 'tickets' || itemType === 'activity' || category.includes('活動') || category.includes('門票') || category.includes('ticket')) {
          activityItems.push({
            id: `activity-${index}`,
            departure_data_id: data?.id || '',
            date: baseDate,
            venue_name: itemName,
            unit_price: item.unit_price,
            quantity: item.quantity,
            subtotal: item.total_price,
            expected_amount: item.total_price,
            notes: item.notes,
            display_order: index,
          })
        } else {
          otherItems.push({
            id: `other-${index}`,
            departure_data_id: data?.id || '',
            date: baseDate,
            item_name: itemName,
            unit_price: item.unit_price,
            quantity: item.quantity,
            subtotal: item.total_price,
            expected_amount: item.total_price,
            notes: item.notes,
            display_order: index,
          })
        }
      })

      // 也處理快速報價單項目
      const quickItems = quote?.quick_quote_items as Array<{
        id: string
        description: string
        quantity: number
        unit_price: number
        amount: number
        notes?: string
      }> | null

      if (quickItems && Array.isArray(quickItems)) {
        quickItems.forEach((item, index) => {
          const baseDate = tour.departure_date || new Date().toISOString().split('T')[0]
          const desc = item.description?.toLowerCase() || ''

          if (desc.includes('餐') || desc.includes('meal')) {
            mealItems.push({
              id: `quick-meal-${index}`,
              departure_data_id: data?.id || '',
              date: baseDate,
              restaurant_name: item.description,
              unit_price: item.unit_price,
              quantity: item.quantity,
              subtotal: item.amount,
              expected_amount: item.amount,
              notes: item.notes || '',
              display_order: mealItems.length,
            })
          } else if (desc.includes('住') || desc.includes('hotel') || desc.includes('飯店')) {
            accomItems.push({
              id: `quick-accom-${index}`,
              departure_data_id: data?.id || '',
              date: baseDate,
              hotel_name: item.description,
              unit_price: item.unit_price,
              quantity: item.quantity,
              subtotal: item.amount,
              expected_amount: item.amount,
              notes: item.notes || '',
              display_order: accomItems.length,
            })
          } else if (desc.includes('門票') || desc.includes('活動') || desc.includes('ticket')) {
            activityItems.push({
              id: `quick-activity-${index}`,
              departure_data_id: data?.id || '',
              date: baseDate,
              venue_name: item.description,
              unit_price: item.unit_price,
              quantity: item.quantity,
              subtotal: item.amount,
              expected_amount: item.amount,
              notes: item.notes || '',
              display_order: activityItems.length,
            })
          } else {
            otherItems.push({
              id: `quick-other-${index}`,
              departure_data_id: data?.id || '',
              date: baseDate,
              item_name: item.description,
              unit_price: item.unit_price,
              quantity: item.quantity,
              subtotal: item.amount,
              expected_amount: item.amount,
              notes: item.notes || '',
              display_order: otherItems.length,
            })
          }
        })
      }

      setMeals(mealItems)
      setAccommodations(accomItems)
      setActivities(activityItems)
      setOthers(otherItems)

      // 更新基本資料
      setData(prev => ({
        ...prev!,
        sales_person: quote?.handler_name || prev?.sales_person || '',
      }))

      toast.success('已從報價單帶入資料')
    } catch (error) {
      // 更詳細的錯誤記錄
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
      const errorDetails = error && typeof error === 'object' ? {
        message: (error as { message?: string }).message,
        code: (error as { code?: string }).code,
        details: (error as { details?: string }).details,
        hint: (error as { hint?: string }).hint,
      } : error
      logger.error('從報價單載入失敗:', errorDetails, '| quoteId:', quoteId)
      toast.error(`載入失敗: ${errorMessage || '未知錯誤'}`)
    } finally {
      setLoading(false)
    }
  }

  const loadDepartureData = async () => {
    try {
      setLoading(true)

      // 載入主表資料
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: mainData, error: mainError } = await (supabase as any)
        .from('tour_departure_data')
        .select('*')
        .eq('tour_id', tour.id)
        .single()

      if (mainError && mainError.code !== 'PGRST116') {
        throw mainError
      }

      if (mainData) {
        setData(mainData as unknown as TourDepartureData)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: mealsData } = await (supabase as any)
          .from('tour_departure_meals')
          .select('*')
          .eq('departure_data_id', mainData.id)
          .order('date', { ascending: true })
          .order('display_order', { ascending: true })
        setMeals((mealsData || []) as TourDepartureMeal[])

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: accomData } = await (supabase as any)
          .from('tour_departure_accommodations')
          .select('*')
          .eq('departure_data_id', mainData.id)
          .order('date', { ascending: true })
          .order('display_order', { ascending: true })
        setAccommodations((accomData || []) as TourDepartureAccommodation[])

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: activData } = await (supabase as any)
          .from('tour_departure_activities')
          .select('*')
          .eq('departure_data_id', mainData.id)
          .order('date', { ascending: true })
          .order('display_order', { ascending: true })
        setActivities((activData || []) as TourDepartureActivity[])

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: othersData } = await (supabase as any)
          .from('tour_departure_others')
          .select('*')
          .eq('departure_data_id', mainData.id)
          .order('date', { ascending: true })
          .order('display_order', { ascending: true })
        setOthers((othersData || []) as TourDepartureOther[])
      } else {
        setData({
          id: '',
          tour_id: tour.id,
          service_fee_per_person: 1500,
          petty_cash: 0,
        } as unknown as TourDepartureData)
      }
    } catch (error) {
      logger.error('載入出團資料失敗:', error)
      toast.error('載入失敗')
    } finally {
      setLoading(false)
    }
  }

  // 儲存資料
  const handleSave = async () => {
    if (!data) return

    setSaving(true)
    try {
      let departureDataId = data.id

      if (!departureDataId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newData, error } = await (supabase as any)
          .from('tour_departure_data')
          .insert({
            ...data,
            tour_id: tour.id,
          })
          .select()
          .single()

        if (error) throw error
        departureDataId = newData.id
        setData(prev => ({ ...prev!, id: departureDataId }))
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from('tour_departure_data')
          .update(data)
          .eq('id', departureDataId)

        if (error) throw error
      }

      setIsEditing(false)
      toast.success('儲存成功')
    } catch (error) {
      logger.error('儲存失敗:', error)
      toast.error('儲存失敗')
    } finally {
      setSaving(false)
    }
  }

  // 計算總金額
  const totals = useMemo(() => {
    const mealsTotal = meals.reduce((sum, item) => sum + (item.expected_amount || 0), 0)
    const accomTotal = accommodations.reduce((sum, item) => sum + (item.expected_amount || 0), 0)
    const activityTotal = activities.reduce((sum, item) => sum + (item.expected_amount || 0), 0)
    const othersTotal = others.reduce((sum, item) => sum + (item.expected_amount || 0), 0)

    const mealsActual = meals.reduce((sum, item) => sum + (item.actual_amount || 0), 0)
    const accomActual = accommodations.reduce((sum, item) => sum + (item.actual_amount || 0), 0)
    const activityActual = activities.reduce((sum, item) => sum + (item.actual_amount || 0), 0)
    const othersActual = others.reduce((sum, item) => sum + (item.actual_amount || 0), 0)

    const serviceFee = (data?.service_fee_per_person || 0) * (tour.current_participants || 0)
    const pettyCash = data?.petty_cash || 0

    return {
      mealsTotal,
      accomTotal,
      activityTotal,
      othersTotal,
      mealsActual,
      accomActual,
      activityActual,
      othersActual,
      serviceFee,
      pettyCash,
      expectedTotal: mealsTotal + accomTotal + activityTotal + othersTotal + serviceFee + pettyCash,
      actualTotal: mealsActual + accomActual + activityActual + othersActual + serviceFee + pettyCash,
    }
  }, [meals, accommodations, activities, others, data, tour.current_participants])

  // 格式化日期
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      return `${date.getMonth() + 1}/${date.getDate()}`
    } catch {
      return dateStr
    }
  }

  // 格式化金額
  const formatMoney = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '-'
    return amount.toLocaleString('zh-TW')
  }

  // 通用表格渲染
  const renderTable = (
    title: string,
    items: TableItem[],
    nameField: 'restaurant_name' | 'hotel_name' | 'venue_name' | 'item_name',
    nameLabel: string
  ) => (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-morandi-primary">{title}</h2>
        {isEditing && (
          <Button size="sm" variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            新增
          </Button>
        )}
      </div>
      <div className="border border-border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-morandi-container/20">
            <tr>
              <th className="px-3 py-2 text-left text-morandi-secondary font-medium w-20">日期</th>
              <th className="px-3 py-2 text-left text-morandi-secondary font-medium">{nameLabel}</th>
              <th className="px-3 py-2 text-right text-morandi-secondary font-medium w-24">單價</th>
              <th className="px-3 py-2 text-right text-morandi-secondary font-medium w-16">數量</th>
              <th className="px-3 py-2 text-right text-morandi-secondary font-medium w-28">預計支出</th>
              <th className="px-3 py-2 text-right text-morandi-secondary font-medium w-28">實際支出</th>
              <th className="px-3 py-2 text-left text-morandi-secondary font-medium">備註</th>
              {isEditing && <th className="px-3 py-2 w-12"></th>}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={isEditing ? 8 : 7} className="px-3 py-8 text-center text-morandi-secondary">
                  尚無資料{isEditing && '，點擊「新增」開始'}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-3 py-2 text-morandi-secondary">{formatDate(item.date)}</td>
                  <td className="px-3 py-2 text-morandi-primary font-medium">{item[nameField] || '-'}</td>
                  <td className="px-3 py-2 text-right text-morandi-secondary">{formatMoney(item.unit_price)}</td>
                  <td className="px-3 py-2 text-right text-morandi-secondary">{item.quantity || '-'}</td>
                  <td className="px-3 py-2 text-right font-medium text-morandi-primary">{formatMoney(item.expected_amount)}</td>
                  <td className="px-3 py-2 text-right font-medium text-morandi-green">{formatMoney(item.actual_amount)}</td>
                  <td className="px-3 py-2 text-morandi-muted text-xs">{item.notes || '-'}</td>
                  {isEditing && (
                    <td className="px-3 py-2 text-center">
                      <button className="text-morandi-red hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
            {items.length > 0 && (
              <tr className="border-t-2 border-morandi-gold/30 bg-morandi-container/10">
                <td colSpan={4} className="px-3 py-2 text-right text-morandi-secondary font-medium">小計</td>
                <td className="px-3 py-2 text-right font-semibold text-morandi-primary">
                  {formatMoney(items.reduce((sum, item) => sum + (item.expected_amount || 0), 0))}
                </td>
                <td className="px-3 py-2 text-right font-semibold text-morandi-green">
                  {formatMoney(items.reduce((sum, item) => sum + (item.actual_amount || 0), 0))}
                </td>
                <td colSpan={isEditing ? 2 : 1}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  if (loading && !data) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <VisuallyHidden>
            <DialogTitle>載入出團資料中</DialogTitle>
          </VisuallyHidden>
          <div className="py-16 text-center text-morandi-secondary">載入中...</div>
        </DialogContent>
      </Dialog>
    )
  }

  const hasQuotes = linkedQuotes.length > 0 || !!tour.quote_id

  // 格式化報價單狀態
  const formatQuoteStatus = (status: string | null) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      draft: { label: '草稿', color: 'text-morandi-secondary' },
      pending: { label: '待審核', color: 'text-morandi-gold' },
      approved: { label: '已核准', color: 'text-morandi-green' },
      rejected: { label: '已拒絕', color: 'text-morandi-red' },
      sent: { label: '已發送', color: 'text-blue-500' },
      confirmed: { label: '已確認', color: 'text-morandi-green' },
    }
    return statusMap[status || 'draft'] || { label: status || '未知', color: 'text-morandi-secondary' }
  }

  // 報價單選擇器對話框
  const renderQuoteSelector = () => (
    <Dialog open={showQuoteSelector} onOpenChange={setShowQuoteSelector}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg text-morandi-primary flex items-center gap-2">
            <Calculator className="h-5 w-5 text-morandi-gold" />
            選擇報價單版本
          </DialogTitle>
          <DialogDescription className="text-morandi-secondary">
            此團有 {linkedQuotes.length} 個報價單版本，請選擇要帶入的版本
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
          {linkedQuotes.map((quote, index) => {
            const isSelected = selectedQuoteId === quote.id
            const statusInfo = formatQuoteStatus(quote.status)

            return (
              <button
                key={quote.id}
                onClick={() => handleSelectQuote(quote.id)}
                className={`w-full p-4 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-morandi-gold bg-morandi-gold/10'
                    : 'border-border hover:border-morandi-secondary/50 hover:bg-morandi-container/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-morandi-gold flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-morandi-gold">{quote.code || `版本 ${index + 1}`}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${statusInfo.color} bg-current/10`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="text-sm text-morandi-primary mt-1">{quote.name || tour.name}</div>
                      <div className="flex items-center gap-3 text-xs text-morandi-secondary mt-1">
                        <span>建立於 {new Date(quote.created_at).toLocaleDateString('zh-TW')}</span>
                        {quote.total_amount && (
                          <span className="font-medium">NT$ {quote.total_amount.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-morandi-secondary" />
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={() => setShowQuoteSelector(false)}>
            取消
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <>
      {/* 報價單選擇器對話框 */}
      {renderQuoteSelector()}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
          {/* 標題區 */}
          <div className="px-6 py-4 border-b border-border">
            <DialogHeader>
              <DialogTitle className="text-xl text-morandi-primary">
                出團資料表 - {tour.name}
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-3 mt-2 text-sm text-morandi-secondary">
              <span>{tour.departure_date} ~ {tour.return_date}</span>
              <span className="text-morandi-muted">|</span>
              <span>{tourDays} 天</span>
              <span className="text-morandi-muted">|</span>
              <span>{tour.current_participants || 0} 人</span>
            </div>
          </div>

          {/* 工具列（整合報價單資訊） */}
          <div className="px-6 py-3 bg-morandi-container/10 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* 報價單按鈕 */}
              <Button
                variant="outline"
                size="sm"
                onClick={loadFromQuote}
                disabled={loading || loadingQuotes || !hasQuotes}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Calculator size={14} />
                )}
                從報價單帶入
              </Button>

              {/* 報價單狀態顯示 */}
              {loadingQuotes ? (
                <span className="text-xs text-morandi-secondary flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  載入中...
                </span>
              ) : !hasQuotes ? (
                <span className="text-xs text-morandi-red">無報價單</span>
              ) : linkedQuotes.length === 1 ? (
                <span className="text-xs text-morandi-secondary">
                  報價單：<span className="text-morandi-gold font-medium">{linkedQuotes[0].code || linkedQuotes[0].name}</span>
                </span>
              ) : linkedQuotes.length > 1 ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-morandi-secondary">報價單：</span>
                  {linkedQuotes.map((quote) => (
                    <button
                      key={quote.id}
                      onClick={() => setSelectedQuoteId(quote.id)}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                        selectedQuoteId === quote.id
                          ? 'bg-morandi-gold text-white'
                          : 'bg-morandi-container/50 text-morandi-primary hover:bg-morandi-container'
                      }`}
                    >
                      {quote.code || quote.name || '報價單'}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    <X size={14} className="mr-1" />
                    取消
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
                  >
                    <Save size={14} />
                    {saving ? '儲存中...' : '儲存'}
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 size={14} className="mr-1" />
                  編輯
                </Button>
              )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 基本資訊 */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-morandi-primary mb-4">基本資訊</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm text-morandi-secondary">隨團領隊</Label>
                {isEditing ? (
                  <Input
                    value={data?.tour_leader || ''}
                    onChange={e => setData(prev => ({ ...prev!, tour_leader: e.target.value }))}
                    placeholder="領隊姓名"
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-morandi-primary">{data?.tour_leader || '-'}</p>
                )}
              </div>
              <div>
                <Label className="text-sm text-morandi-secondary">領隊聯絡方式</Label>
                {isEditing ? (
                  <Input
                    value={data?.tour_leader_contact || ''}
                    onChange={e => setData(prev => ({ ...prev!, tour_leader_contact: e.target.value }))}
                    placeholder="電話或 Email"
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-morandi-primary">{data?.tour_leader_contact || '-'}</p>
                )}
              </div>
              <div>
                <Label className="text-sm text-morandi-secondary">承辦業務</Label>
                {isEditing ? (
                  <Input
                    value={data?.sales_person || ''}
                    onChange={e => setData(prev => ({ ...prev!, sales_person: e.target.value }))}
                    placeholder="業務姓名"
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-morandi-primary">{data?.sales_person || '-'}</p>
                )}
              </div>
              <div>
                <Label className="text-sm text-morandi-secondary">助理人員</Label>
                {isEditing ? (
                  <Input
                    value={data?.assistant_person || ''}
                    onChange={e => setData(prev => ({ ...prev!, assistant_person: e.target.value }))}
                    placeholder="助理姓名"
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-morandi-primary">{data?.assistant_person || '-'}</p>
                )}
              </div>
              <div className="col-span-2 md:col-span-4">
                <Label className="text-sm text-morandi-secondary">航班資訊</Label>
                {isEditing ? (
                  <Input
                    value={data?.flight_info || ''}
                    onChange={e => setData(prev => ({ ...prev!, flight_info: e.target.value }))}
                    placeholder="去程／回程航班資訊"
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-morandi-primary">{data?.flight_info || '-'}</p>
                )}
              </div>
            </div>
          </div>

          {/* 餐食表 */}
          {renderTable('餐食表', meals as TableItem[], 'restaurant_name', '餐廳名稱')}

          {/* 住宿表 */}
          {renderTable('住宿表', accommodations as TableItem[], 'hotel_name', '飯店名稱')}

          {/* 活動表 */}
          {renderTable('活動表', activities as TableItem[], 'venue_name', '場地／活動名稱')}

          {/* 其他費用 */}
          {renderTable('其他費用', others as TableItem[], 'item_name', '項目名稱')}

          {/* 服務費用設定 */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-morandi-primary mb-4">服務費用設定</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm text-morandi-secondary">領隊服務費（每人）</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={data?.service_fee_per_person || 0}
                    onChange={e => setData(prev => ({ ...prev!, service_fee_per_person: parseInt(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-morandi-primary">{formatMoney(data?.service_fee_per_person)}</p>
                )}
              </div>
              <div>
                <Label className="text-sm text-morandi-secondary">服務費小計</Label>
                <p className="mt-1 font-semibold text-morandi-gold">{formatMoney(totals.serviceFee)}</p>
              </div>
              <div>
                <Label className="text-sm text-morandi-secondary">零用金</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={data?.petty_cash || 0}
                    onChange={e => setData(prev => ({ ...prev!, petty_cash: parseInt(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-morandi-primary">{formatMoney(data?.petty_cash)}</p>
                )}
              </div>
            </div>
          </div>

          {/* 總金額區塊 */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-morandi-primary mb-4">總金額</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-morandi-container/10 rounded-lg">
                <label className="text-sm text-morandi-secondary">餐食</label>
                <div className="mt-1 text-xl font-bold text-morandi-primary">{formatMoney(totals.mealsTotal)}</div>
              </div>
              <div className="p-4 bg-morandi-container/10 rounded-lg">
                <label className="text-sm text-morandi-secondary">住宿</label>
                <div className="mt-1 text-xl font-bold text-morandi-primary">{formatMoney(totals.accomTotal)}</div>
              </div>
              <div className="p-4 bg-morandi-container/10 rounded-lg">
                <label className="text-sm text-morandi-secondary">活動</label>
                <div className="mt-1 text-xl font-bold text-morandi-primary">{formatMoney(totals.activityTotal)}</div>
              </div>
              <div className="p-4 bg-morandi-container/10 rounded-lg">
                <label className="text-sm text-morandi-secondary">其他</label>
                <div className="mt-1 text-xl font-bold text-morandi-primary">{formatMoney(totals.othersTotal)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-morandi-container/20 rounded-lg text-center">
                <label className="text-sm text-morandi-secondary">預計總支出</label>
                <div className="mt-2 text-3xl font-bold text-morandi-primary">
                  NT$ {formatMoney(totals.expectedTotal)}
                </div>
              </div>
              <div className="p-6 bg-morandi-green/10 rounded-lg text-center">
                <label className="text-sm text-morandi-secondary">實際總支出</label>
                <div className="mt-2 text-3xl font-bold text-morandi-green">
                  NT$ {formatMoney(totals.actualTotal)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
