/**
 * RequirementSyncDialog - 需求確認單
 *
 * 功能：
 * 1. 自動從報價單讀取資料
 * 2. 比對現有需求單，顯示 diff
 * 3. 綠色=新增，紅色刪除線=移除
 * 4. 點「同步」才真正更新
 *
 * 支援兩種模式：
 * - ProposalPackage 模式：提案階段使用
 * - Tour 模式：開團後使用（資料來源相同，都是從 quote_id 讀取）
 */

'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DIALOG_SIZES,
} from '@/components/ui/dialog'
import { logger } from '@/lib/utils/logger'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  AlertCircle,
  ClipboardList,
  Plus,
  X,
  Trash2,
  RefreshCw,
  Check,
  FileText,
} from 'lucide-react'
import { TourRequestFormDialog } from './TourRequestFormDialog'
import { AddManualRequestDialog } from './AddManualRequestDialog'
import { supabase } from '@/lib/supabase/client'
import type { Json } from '@/lib/supabase/types'
import { useToast } from '@/components/ui/use-toast'
import { useAuthStore } from '@/stores'
import type { ProposalPackage, Proposal, ConfirmedRequirementItem, ConfirmedRequirementsSnapshot } from '@/types/proposal.types'
import type { Tour } from '@/stores/types'
import type { CostCategory } from '@/features/quotes/types'
import { Checkbox } from '@/components/ui/checkbox'
import { Printer } from 'lucide-react'

interface RequirementSyncDialogProps {
  isOpen: boolean
  onClose: () => void
  // 提案套件模式
  pkg?: ProposalPackage | null
  proposal?: Proposal | null
  // 旅遊團模式
  tour?: Tour | null
  onSyncComplete?: () => void
}

// 需求單類型
interface TourRequest {
  id: string
  category: string
  supplier_name: string
  title: string
  service_date: string | null
  quantity: number | null
  note?: string | null  // 備註（交通的航班資訊）
}

// 報價單項目（用於比對）
interface QuoteItem {
  category: string  // transport, hotel, restaurant, activity, other
  supplierName: string
  title: string
  serviceDate: string | null
  quantity: number
  key: string  // 用於比對的唯一 key
  note?: string  // 備註（交通用於存放航班資訊）
}

// Diff 項目
interface DiffItem {
  type: 'normal' | 'modified' | 'add' | 'remove'
  quoteItem?: QuoteItem
  requestItem?: TourRequest
  changeDescription?: string  // 變更說明（如：原：餐廳A）
}

// 變更追蹤項目（比較確認快照與目前資料）
interface ChangeTrackItem {
  type: 'confirmed' | 'new' | 'cancelled'  // 已確認(黑)/新增(藍)/取消(紅)
  item: ConfirmedRequirementItem | QuoteItem
  checked?: boolean  // 是否已勾選確認
}

// 分類配置
type CategoryKey = 'transport' | 'hotel' | 'restaurant' | 'activity' | 'other'
const CATEGORIES: { key: CategoryKey; label: string; quoteCategoryId: string }[] = [
  { key: 'transport', label: '交通', quoteCategoryId: 'transport' },
  { key: 'hotel', label: '住宿', quoteCategoryId: 'accommodation' },
  { key: 'restaurant', label: '餐食', quoteCategoryId: 'meals' },
  { key: 'activity', label: '門票/活動', quoteCategoryId: 'activities' },
  { key: 'other', label: '其他', quoteCategoryId: 'others' }, // 注意：quote 用 'others' (複數)
]

// 航班資訊類型
interface FlightInfo {
  airline?: string
  flightNumber?: string
  departureTime?: string
  arrivalTime?: string
  departureAirport?: string
  arrivalAirport?: string
}

// 每日餐食類型
interface DailyMealsData {
  breakfast: string
  lunch: string
  dinner: string
}

// 每日行程類型（從行程表讀取）
interface DailyItineraryDayData {
  dayLabel: string
  date: string
  title: string
  meals: DailyMealsData
  accommodation: string
}

export function RequirementSyncDialog({
  isOpen,
  onClose,
  pkg,
  proposal,
  tour,
  onSyncComplete,
}: RequirementSyncDialogProps) {
  const { toast } = useToast()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [existingRequests, setExistingRequests] = useState<TourRequest[]>([])
  const [quoteCategories, setQuoteCategories] = useState<CostCategory[]>([])
  const [startDate, setStartDate] = useState<string | null>(null)
  const [outboundFlight, setOutboundFlight] = useState<FlightInfo | null>(null)
  const [returnFlight, setReturnFlight] = useState<FlightInfo | null>(null)
  const [dailyItinerary, setDailyItinerary] = useState<DailyItineraryDayData[]>([])

  // 已確認需求快照
  const [confirmedSnapshot, setConfirmedSnapshot] = useState<ConfirmedRequirementItem[]>([])
  const [confirmingChanges, setConfirmingChanges] = useState(false)

  // 變更確認勾選狀態（key = category-supplierName-title-date）
  const [checkedChanges, setCheckedChanges] = useState<Set<string>>(new Set())

  // 需求單 Dialog 狀態
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [selectedRequestData, setSelectedRequestData] = useState<{
    category: string
    supplierName: string
    items: { id?: string; serviceDate: string | null; title: string; quantity: number; note?: string }[]
  } | null>(null)

  // 手動新增需求 Dialog 狀態
  const [addManualDialogOpen, setAddManualDialogOpen] = useState(false)

  // 判斷模式：Tour 模式 或 ProposalPackage 模式
  const mode = tour ? 'tour' : 'package'

  // 統一資料來源
  const source = useMemo(() => {
    if (tour) {
      return {
        id: tour.id,
        quoteId: tour.quote_id || tour.locked_quote_id || null,
        itineraryId: tour.locked_itinerary_id || null,
        startDate: tour.departure_date || null,
        code: tour.code,
        title: tour.name,
        groupSize: tour.current_participants || tour.max_participants || null,
        workspaceId: tour.workspace_id || user?.workspace_id || '',
        // Tour 模式：航班從 tour 直接取
        outboundFlight: tour.outbound_flight as FlightInfo | null,
        returnFlight: tour.return_flight as FlightInfo | null,
      }
    }
    if (pkg) {
      return {
        id: pkg.id,
        quoteId: pkg.quote_id || null,
        itineraryId: pkg.itinerary_id || null,
        startDate: pkg.start_date || null,
        code: proposal?.code || '',
        title: proposal?.title || '',
        groupSize: proposal?.group_size || null,
        workspaceId: proposal?.workspace_id || user?.workspace_id || '',
        outboundFlight: null as FlightInfo | null,
        returnFlight: null as FlightInfo | null,
      }
    }
    return null
  }, [tour, pkg, proposal, user])

  // 載入資料
  useEffect(() => {
    if (!isOpen || !source) return

    const loadData = async () => {
      setLoading(true)

      try {
        // 1. 載入報價單的 categories
        if (source.quoteId) {
          const { data: quote } = await supabase
            .from('quotes')
            .select('categories, start_date')
            .eq('id', source.quoteId)
            .single()

          if (quote) {
            setQuoteCategories((quote.categories as unknown as CostCategory[]) || [])
            setStartDate(quote.start_date || source.startDate || null)
          }
        } else {
          // 沒有報價單時重設
          setQuoteCategories([])
          setStartDate(source.startDate)
        }

        // 1.5 載入行程表的航班資訊和每日行程（餐食、住宿）
        // Tour 模式：航班從 tour 直接取；Package 模式：從行程表取
        if (mode === 'tour' && source.outboundFlight) {
          setOutboundFlight(source.outboundFlight)
          setReturnFlight(source.returnFlight)
        }

        if (source.itineraryId) {
          const { data: itinerary } = await supabase
            .from('itineraries')
            .select('outbound_flight, return_flight, daily_itinerary, departure_date')
            .eq('id', source.itineraryId)
            .single()

          if (itinerary) {
            const itineraryData = itinerary as unknown as {
              outbound_flight: FlightInfo | null
              return_flight: FlightInfo | null
              daily_itinerary: DailyItineraryDayData[] | null
              departure_date: string | null
            }
            // 如果 tour 沒有航班資訊，從行程表取
            if (!source.outboundFlight) {
              setOutboundFlight(itineraryData.outbound_flight)
              setReturnFlight(itineraryData.return_flight)
            }
            setDailyItinerary(itineraryData.daily_itinerary || [])
            // 優先使用行程表的出發日期
            if (itineraryData.departure_date) {
              setStartDate(itineraryData.departure_date)
            }
          }
        } else {
          setDailyItinerary([])
        }

        // 2. 載入已建立的需求單
        // Tour 模式：用 tour_id；Package 模式：用 proposal_package_id
        if (mode === 'tour') {
          const { data: requests } = await supabase
            .from('tour_requests')
            .select('id, category, supplier_name, title, service_date, quantity, note')
            .eq('tour_id', source.id)
            .order('created_at', { ascending: true })
          setExistingRequests((requests as TourRequest[]) || [])
        } else {
          const { data: requests } = await supabase
            .from('tour_requests')
            .select('id, category, supplier_name, title, service_date, quantity, note')
            .eq('proposal_package_id', source.id)
            .order('created_at', { ascending: true })
          setExistingRequests((requests as TourRequest[]) || [])
        }

        // 3. 載入已確認的需求快照
        if (mode === 'tour') {
          const { data: tourData } = await supabase
            .from('tours')
            .select('confirmed_requirements')
            .eq('id', source.id)
            .single()
          if (tourData?.confirmed_requirements && typeof tourData.confirmed_requirements === 'object') {
            const snapshot = (tourData.confirmed_requirements as unknown as ConfirmedRequirementsSnapshot)?.snapshot
            setConfirmedSnapshot(snapshot || [])
          } else {
            setConfirmedSnapshot([])
          }
        } else {
          const { data: pkgData } = await (supabase as any)
            .from('proposal_packages')
            .select('confirmed_requirements')
            .eq('id', source.id)
            .single()

          if (pkgData?.confirmed_requirements?.snapshot) {
            setConfirmedSnapshot(pkgData.confirmed_requirements.snapshot as ConfirmedRequirementItem[])
          } else {
            setConfirmedSnapshot([])
          }
        }
      } catch (error) {
        logger.error('載入資料失敗:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isOpen, source, mode])

  // 計算日期
  const calculateDate = useCallback((dayNum: number): string | null => {
    if (!startDate) return null
    const date = new Date(startDate)
    date.setDate(date.getDate() + dayNum - 1)
    return date.toISOString().split('T')[0]
  }, [startDate])

  // 格式化航班資訊
  const formatFlightInfo = useCallback((flight: FlightInfo | null, type: '去程' | '回程'): string => {
    if (!flight) return ''
    const parts: string[] = []
    if (flight.flightNumber) parts.push(flight.flightNumber)
    if (flight.departureAirport && flight.arrivalAirport) {
      parts.push(`${flight.departureAirport}→${flight.arrivalAirport}`)
    }
    if (flight.departureTime && flight.arrivalTime) {
      parts.push(`${flight.departureTime}-${flight.arrivalTime}`)
    }
    return parts.length > 0 ? `【${type}】${parts.join(' ')}` : ''
  }, [])

  // 從報價單和行程表解析項目
  const quoteItems = useMemo((): QuoteItem[] => {
    const items: QuoteItem[] = []

    for (const cat of CATEGORIES) {
      // 交通：從行程表航班資訊讀取
      if (cat.key === 'transport') {
        if (outboundFlight || returnFlight) {
          const flightInfos: string[] = []
          const outboundInfo = formatFlightInfo(outboundFlight, '去程')
          const returnInfo = formatFlightInfo(returnFlight, '回程')
          if (outboundInfo) flightInfos.push(outboundInfo)
          if (returnInfo) flightInfos.push(returnInfo)

          if (flightInfos.length > 0) {
            const airline = outboundFlight?.airline || returnFlight?.airline || '航空公司'
            const key = 'transport-機票'
            items.push({
              category: 'transport',
              supplierName: airline,
              title: '機票',
              serviceDate: startDate,
              quantity: 1,
              key,
              note: flightInfos.join('\n'),
            })
          }
        }
        continue
      }

      const quoteCategory = quoteCategories.find(c => c.id === cat.quoteCategoryId)
      if (!quoteCategory?.items) continue

      for (const item of quoteCategory.items) {
        if (!item.name) continue

        let supplierName = ''
        let title = item.name
        let serviceDate: string | null = null

        if (cat.key === 'hotel') {
          supplierName = item.name
          title = item.name
          if (item.day) {
            serviceDate = calculateDate(item.day)
          }
        } else if (cat.key === 'restaurant') {
          // 支援兩種格式：
          // 1. 匯入格式：Day 1 早餐：餐廳名
          // 2. 手動格式：Day 1 午餐 - 餐廳名
          const match = item.name.match(/Day\s*(\d+)\s*(早餐|午餐|晚餐)\s*(?:[：:]|\s*-\s*)\s*(.+)/)
          if (match) {
            const dayNum = parseInt(match[1])
            const mealType = match[2]
            supplierName = match[3].trim()  // 餐廳名稱
            title = mealType  // 只顯示餐別（早餐/午餐/晚餐）
            serviceDate = calculateDate(dayNum)
          }
        } else if (cat.key === 'activity') {
          title = item.name
          if (item.day) {
            serviceDate = calculateDate(item.day)
          }
        } else {
          title = item.name
        }

        // 生成唯一 key 用於比對
        const key = `${cat.key}-${supplierName}-${title}-${serviceDate || ''}`

        items.push({
          category: cat.key,
          supplierName,
          title,
          serviceDate,
          quantity: item.quantity || 1,
          key,
        })
      }
    }

    return items
  }, [quoteCategories, calculateDate, startDate, outboundFlight, returnFlight, formatFlightInfo])

  // 生成項目的唯一 key（用於比對）
  const generateItemKey = useCallback((category: string, supplierName: string, title: string, date: string | null) => {
    return `${category}-${supplierName}-${title}-${date || ''}`
  }, [])

  // 計算變更追蹤（比較確認快照與目前報價單資料）
  const changeTrackByCategory = useMemo(() => {
    const result: Record<CategoryKey, ChangeTrackItem[]> = {
      transport: [],
      hotel: [],
      restaurant: [],
      activity: [],
      other: [],
    }

    // 如果沒有確認快照，所有項目都是「新的」
    if (confirmedSnapshot.length === 0) {
      for (const item of quoteItems) {
        const cat = item.category as CategoryKey
        result[cat].push({
          type: 'new',
          item: item,
        })
      }
      return result
    }

    // 建立確認快照的 key set
    const snapshotKeys = new Map<string, ConfirmedRequirementItem>()
    for (const snap of confirmedSnapshot) {
      const key = generateItemKey(snap.category, snap.supplier_name, snap.title, snap.service_date)
      snapshotKeys.set(key, snap)
    }

    // 建立目前報價單的 key set
    const quoteKeys = new Set<string>()
    for (const item of quoteItems) {
      const key = generateItemKey(item.category, item.supplierName, item.title, item.serviceDate)
      quoteKeys.add(key)
    }

    // 處理目前報價單項目
    for (const item of quoteItems) {
      const cat = item.category as CategoryKey
      const key = generateItemKey(item.category, item.supplierName, item.title, item.serviceDate)

      if (snapshotKeys.has(key)) {
        // 在快照中存在 → 已確認（黑色）
        result[cat].push({
          type: 'confirmed',
          item: item,
        })
      } else {
        // 不在快照中 → 新增（藍色）
        result[cat].push({
          type: 'new',
          item: item,
        })
      }
    }

    // 處理要取消的項目（在快照中但不在目前報價單中）
    for (const snap of confirmedSnapshot) {
      const cat = snap.category as CategoryKey
      const key = generateItemKey(snap.category, snap.supplier_name, snap.title, snap.service_date)

      if (!quoteKeys.has(key)) {
        // 不在目前報價單中 → 取消（紅色）
        result[cat].push({
          type: 'cancelled',
          item: snap,
        })
      }
    }

    // 按日期排序，讓同一天的項目放在一起
    const getDate = (trackItem: ChangeTrackItem): string => {
      const itemData = trackItem.item
      return ('serviceDate' in itemData ? itemData.serviceDate : itemData.service_date) || ''
    }

    for (const cat of Object.keys(result) as CategoryKey[]) {
      result[cat].sort((a, b) => {
        const dateA = getDate(a)
        const dateB = getDate(b)
        return dateA.localeCompare(dateB)
      })
    }

    return result
  }, [quoteItems, confirmedSnapshot, generateItemKey])

  // 檢查是否有需要處理的變更（新增或取消）
  const hasUnconfirmedChanges = useMemo(() => {
    for (const cat of CATEGORIES) {
      const items = changeTrackByCategory[cat.key]
      if (items.some(item => item.type === 'new' || item.type === 'cancelled')) {
        return true
      }
    }
    return false
  }, [changeTrackByCategory])

  // 取得所有取消的項目（用於列印取消單）
  const cancelledItems = useMemo(() => {
    const items: ConfirmedRequirementItem[] = []
    for (const cat of CATEGORIES) {
      const categoryItems = changeTrackByCategory[cat.key]
      for (const trackItem of categoryItems) {
        if (trackItem.type === 'cancelled') {
          items.push(trackItem.item as ConfirmedRequirementItem)
        }
      }
    }
    return items
  }, [changeTrackByCategory])

  // 計算 diff（新邏輯：第一次開啟不標示，後續只標示變更）
  const diffByCategory = useMemo(() => {
    const result: Record<CategoryKey, DiffItem[]> = {
      transport: [],
      hotel: [],
      restaurant: [],
      activity: [],
      other: [],
    }

    const isFirstTime = existingRequests.length === 0

    // 第一次開啟：所有項目都是 normal（不需要任何標示）
    if (isFirstTime) {
      for (const item of quoteItems) {
        const cat = item.category as CategoryKey
        result[cat].push({
          type: 'normal',
          quoteItem: item,
        })
      }
      return result
    }

    // 後續開啟：比較變更
    // 建立現有需求單的 slot map（用日期+分類作為 slot key）
    const existingBySlot = new Map<string, TourRequest>()
    const existingByFullKey = new Map<string, TourRequest>()
    for (const req of existingRequests) {
      // slot key: 用於比對同一位置（如同一天的午餐）
      const slotKey = `${req.category}-${req.service_date || ''}-${req.title.split('：')[0] || ''}`
      existingBySlot.set(slotKey, req)
      // full key: 完整比對
      const fullKey = `${req.category}-${req.supplier_name}-${req.title}-${req.service_date || ''}`
      existingByFullKey.set(fullKey, req)
    }

    // 建立報價單項目的 key set
    const quoteKeys = new Set<string>()
    const quoteSlotKeys = new Set<string>()
    for (const item of quoteItems) {
      quoteKeys.add(item.key)
      const slotKey = `${item.category}-${item.serviceDate || ''}-${item.title.split('：')[0] || ''}`
      quoteSlotKeys.add(slotKey)
    }

    // 處理報價單項目
    for (const item of quoteItems) {
      const cat = item.category as CategoryKey

      // 先檢查完整 key 是否匹配（完全相同）
      const existingByFull = existingByFullKey.get(item.key)
      if (existingByFull) {
        // 完全相同，標記為 normal（不需要標示）
        result[cat].push({
          type: 'normal',
          quoteItem: item,
          requestItem: existingByFull,
        })
        continue
      }

      // 檢查 slot 是否有舊資料（同位置但內容不同 = 修改）
      const slotKey = `${item.category}-${item.serviceDate || ''}-${item.title.split('：')[0] || ''}`
      const existingBySlotItem = existingBySlot.get(slotKey)

      if (existingBySlotItem && existingBySlotItem.supplier_name !== item.supplierName) {
        // 同位置但供應商/餐廳不同 = 修改
        result[cat].push({
          type: 'modified',
          quoteItem: item,
          requestItem: existingBySlotItem,
          changeDescription: `原：${existingBySlotItem.supplier_name || existingBySlotItem.title}`,
        })
      } else {
        // 真正的新增項目
        result[cat].push({
          type: 'add',
          quoteItem: item,
        })
      }
    }

    // 處理要移除的需求單（在需求單中但不在報價單中）
    for (const req of existingRequests) {
      const slotKey = `${req.category}-${req.service_date || ''}-${req.title.split('：')[0] || ''}`
      const fullKey = `${req.category}-${req.supplier_name}-${req.title}-${req.service_date || ''}`

      // 如果 slot 在報價單中還存在（可能只是換了內容），不算移除
      // 只有 slot 完全不存在才算移除
      if (!quoteSlotKeys.has(slotKey) && !quoteKeys.has(fullKey)) {
        const cat = req.category as CategoryKey
        if (result[cat]) {
          result[cat].push({
            type: 'remove',
            requestItem: req,
          })
        }
      }
    }

    return result
  }, [quoteItems, existingRequests])

  // 檢查是否有變更（需要同步）
  const hasChanges = useMemo(() => {
    for (const cat of CATEGORIES) {
      const items = diffByCategory[cat.key]
      if (items.some(item => item.type === 'add' || item.type === 'remove' || item.type === 'modified')) {
        return true
      }
    }
    return false
  }, [diffByCategory])

  // 是否為第一次開啟（用於決定是否顯示同步按鈕）
  const isFirstTime = existingRequests.length === 0

  // 同步操作
  const handleSync = useCallback(async () => {
    if (!source || !user || !user.workspace_id) return

    setSyncing(true)

    try {
      const workspaceId = user.workspace_id

      // 1. 刪除要移除的項目
      const toRemove = Object.values(diffByCategory)
        .flat()
        .filter(item => item.type === 'remove' && item.requestItem)
        .map(item => item.requestItem!.id)

      if (toRemove.length > 0) {
        await supabase.from('tour_requests').delete().in('id', toRemove)
      }

      // 2. 更新修改的項目（同一位置但內容變更）
      const toUpdate = Object.values(diffByCategory)
        .flat()
        .filter(item => item.type === 'modified' && item.quoteItem && item.requestItem)

      for (const item of toUpdate) {
        await supabase
          .from('tour_requests')
          .update({
            supplier_name: item.quoteItem!.supplierName,
            title: item.quoteItem!.title,
            quantity: item.quoteItem!.quantity,
            note: item.quoteItem!.note || null,
          })
          .eq('id', item.requestItem!.id)
      }

      // 3. 新增項目（第一次同步或真正的新增）
      const toAdd = Object.values(diffByCategory)
        .flat()
        .filter(item => (item.type === 'add' || item.type === 'normal') && item.quoteItem && !item.requestItem)
        .map((item, idx) => ({
          code: `RQ${Date.now().toString().slice(-6)}${idx}`,
          workspace_id: workspaceId,
          // 根據模式設定關聯欄位
          ...(mode === 'tour' ? { tour_id: source.id } : { proposal_package_id: source.id }),
          category: item.quoteItem!.category,
          supplier_name: item.quoteItem!.supplierName,
          title: item.quoteItem!.title,
          service_date: item.quoteItem!.serviceDate,
          quantity: item.quoteItem!.quantity,
          note: item.quoteItem!.note || null,
          status: 'draft',
          handler_type: 'internal',
          created_by: user.id,
          created_by_name: user.name || '',
        }))

      if (toAdd.length > 0) {
        await supabase.from('tour_requests').insert(toAdd)
      }

      // 4. 重新載入
      const filterField = mode === 'tour' ? 'tour_id' : 'proposal_package_id'
      const { data } = await supabase
        .from('tour_requests')
        .select('id, category, supplier_name, title, service_date, quantity, note')
        .eq(filterField, source.id)
        .order('created_at', { ascending: true })

      if (data) {
        setExistingRequests(data as TourRequest[])
      }

      toast({ title: '同步完成' })
      onSyncComplete?.()
    } catch (error) {
      logger.error('同步失敗:', error)
      toast({ title: '同步失敗', variant: 'destructive' })
    } finally {
      setSyncing(false)
    }
  }, [source, mode, user, diffByCategory, toast, onSyncComplete])

  // 儲存取消單到 tour_documents
  const saveCancellationToTourDocuments = useCallback(async (supplierName: string, htmlContent: string) => {
    // Tour 模式直接用 tour.id，Package 模式用 proposal.converted_tour_id
    const tourId = tour?.id || proposal?.converted_tour_id
    if (!tourId || !user?.workspace_id) {
      logger.log('無法存檔取消單：尚未轉團或缺少 workspace_id')
      return
    }

    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
      const fileName = `取消通知單_${supplierName}_${timestamp}.html`
      const filePath = `${tourId}/${fileName}`

      const blob = new Blob([htmlContent], { type: 'text/html' })

      const { error: uploadError } = await supabase.storage
        .from('tour-documents')
        .upload(filePath, blob, {
          contentType: 'text/html',
          upsert: false,
        })

      if (uploadError) {
        logger.warn('上傳取消單失敗:', uploadError)
        return
      }

      const { data: urlData } = supabase.storage
        .from('tour-documents')
        .getPublicUrl(filePath)

       
      const { error: insertError } = await (supabase as any)
        .from('tour_documents')
        .insert({
          tour_id: tourId,
          workspace_id: user.workspace_id,
          name: `取消通知單 - ${supplierName}`,
          description: `團號: ${proposal?.code || '-'}`,
          file_path: filePath,
          public_url: urlData?.publicUrl || '',
          file_name: fileName,
          file_size: blob.size,
          mime_type: 'text/html',
          uploaded_by: null,
        })

      if (insertError) {
        logger.warn('記錄取消單失敗:', insertError)
      } else {
        toast({ title: '取消單已存檔' })
      }
    } catch (err) {
      logger.error('存檔取消單失敗:', err)
    }
  }, [proposal, user, toast])

  // 列印取消單（新視窗）
  const handlePrintCancellation = useCallback((supplierName: string, items: ConfirmedRequirementItem[]) => {
    // 格式化日期
    const formatDateStr = (dateStr: string | null) => {
      if (!dateStr) return '-'
      return new Date(dateStr).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    }

    // 生成列印內容
    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>取消通知單 - ${supplierName}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "Microsoft JhengHei", "PingFang TC", sans-serif; font-size: 12pt; line-height: 1.6; color: #333; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #c9aa7c; padding-bottom: 15px; }
    .header h1 { font-size: 20pt; color: #3a3633; margin-bottom: 5px; }
    .header .subtitle { font-size: 11pt; color: #8b8680; }
    .info-section { margin-bottom: 20px; }
    .info-row { display: flex; margin-bottom: 8px; }
    .info-label { width: 100px; font-weight: bold; color: #3a3633; }
    .info-value { flex: 1; }
    .notice-box { background: #fff5f5; border: 1px solid #c08374; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
    .notice-box p { color: #c08374; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { border: 1px solid #d4c4b0; padding: 10px; text-align: left; }
    th { background: #f6f4f1; color: #3a3633; font-weight: bold; }
    .cancelled { color: #c08374; text-decoration: line-through; }
    .footer { margin-top: 40px; text-align: center; font-size: 10pt; color: #8b8680; }
    .print-controls { padding: 16px; border-bottom: 1px solid #eee; text-align: right; }
    .print-controls button { padding: 8px 16px; margin-left: 8px; cursor: pointer; border-radius: 6px; }
    .btn-outline { background: white; border: 1px solid #ddd; }
    .btn-primary { background: #c9aa7c; color: white; border: none; }
    @media print { .print-controls { display: none; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="print-controls">
    <button class="btn-outline" onclick="window.close()">關閉</button>
    <button class="btn-primary" onclick="window.print()">列印</button>
  </div>

  <div class="header">
    <h1>取消通知單</h1>
    <div class="subtitle">CANCELLATION NOTICE</div>
  </div>

  <div class="info-section">
    <div class="info-row">
      <span class="info-label">供應商：</span>
      <span class="info-value">${supplierName}</span>
    </div>
    <div class="info-row">
      <span class="info-label">團號：</span>
      <span class="info-value">${proposal?.code || '-'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">團名：</span>
      <span class="info-value">${proposal?.title || '-'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">發單日期：</span>
      <span class="info-value">${new Date().toLocaleDateString('zh-TW')}</span>
    </div>
  </div>

  <div class="notice-box">
    <p>因行程變化，煩請取消以下預訂項目：</p>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 80px;">日期</th>
        <th style="width: 100px;">分類</th>
        <th>項目說明</th>
        <th style="width: 80px;">數量</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td class="cancelled">${formatDateStr(item.service_date)}</td>
          <td class="cancelled">${CATEGORIES.find(c => c.key === item.category)?.label || item.category}</td>
          <td class="cancelled">${item.title}${item.note ? `<br><small>${item.note}</small>` : ''}</td>
          <td class="cancelled">${item.quantity}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>如有任何疑問，請與我們聯繫。謝謝您的配合！</p>
  </div>
</body>
</html>
`

    // 儲存到文件管理（背景執行）
    saveCancellationToTourDocuments(supplierName, printContent)

    // 開啟新視窗列印
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) {
      toast({ title: '請允許彈出視窗以進行列印', variant: 'destructive' })
      return
    }

    printWindow.document.write(printContent)
    printWindow.document.close()
  }, [proposal, toast, saveCancellationToTourDocuments])

  // 確認變更（更新快照）
  const handleConfirmChanges = useCallback(async () => {
    if (!source || !user) return

    setConfirmingChanges(true)

    try {
      // 建立新的快照（目前報價單的所有項目）
      const newSnapshot: ConfirmedRequirementItem[] = quoteItems.map(item => ({
        id: crypto.randomUUID(),
        category: item.category,
        supplier_name: item.supplierName,
        service_date: item.serviceDate,
        title: item.title,
        quantity: item.quantity,
        note: item.note,
      }))

      const snapshotData: ConfirmedRequirementsSnapshot = {
        snapshot: newSnapshot,
        confirmed_at: new Date().toISOString(),
        confirmed_by: user.id,
      }

      // 根據模式更新對應的資料庫表
      if (mode === 'tour') {
        const { error } = await supabase
          .from('tours')
          .update({ confirmed_requirements: snapshotData as unknown as Json })
          .eq('id', source.id)
        if (error) throw error
      } else {
        const { error } = await (supabase as any)
          .from('proposal_packages')
          .update({ confirmed_requirements: snapshotData as unknown as Json })
          .eq('id', source.id)
        if (error) throw error
      }

      // 更新本地狀態
      setConfirmedSnapshot(newSnapshot)
      setCheckedChanges(new Set())

      toast({ title: '需求確認完成' })
    } catch (error) {
      logger.error('確認變更失敗:', error)
      toast({ title: '確認失敗', variant: 'destructive' })
    } finally {
      setConfirmingChanges(false)
    }
  }, [source, mode, user, quoteItems, toast])

  // 格式化日期
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
    })
  }

  // 開啟需求單 Dialog（收集同一供應商的所有項目）
  const openRequestDialog = useCallback((category: string, supplierName: string) => {
    // 收集同一供應商的所有非取消項目
    const categoryItems = changeTrackByCategory[category as CategoryKey] || []
    const items = categoryItems
      .filter(trackItem => {
        if (trackItem.type === 'cancelled') return false
        const itemData = trackItem.item
        const itemSupplier = 'supplierName' in itemData ? itemData.supplierName : itemData.supplier_name
        return itemSupplier === supplierName
      })
      .map(trackItem => {
        const itemData = trackItem.item
        return {
          serviceDate: 'serviceDate' in itemData ? itemData.serviceDate : itemData.service_date,
          title: itemData.title,
          quantity: itemData.quantity,
          note: itemData.note,
        }
      })

    setSelectedRequestData({
      category,
      supplierName,
      items,
    })
    setRequestDialogOpen(true)
  }, [changeTrackByCategory])

  if (!source) return null

  // 任何子 Dialog 開啟時，主 Dialog 完全不渲染（避免多重遮罩）
  const hasChildDialogOpen = requestDialogOpen || addManualDialogOpen

  return (
    <>
    {/* 主 Dialog：子 Dialog 開啟時完全不渲染（避免多重遮罩） */}
    {!hasChildDialogOpen && (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal={true}>
      <DialogContent nested className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList size={18} className="text-morandi-gold" />
            需求確認單
            {mode === 'tour' && <span className="text-xs font-normal text-morandi-secondary ml-1">({source.code})</span>}
            {hasUnconfirmedChanges && (
              <span className="text-xs font-normal text-morandi-gold ml-2">
                (有變更待確認)
              </span>
            )}
          </DialogTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddManualDialogOpen(true)}
            className="gap-1.5 text-morandi-gold border-morandi-gold/50 hover:bg-morandi-gold hover:text-white"
          >
            <Plus size={14} />
            新增需求
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="animate-spin text-morandi-gold" size={24} />
            </div>
          ) : !source.quoteId ? (
            <div className="h-48 flex flex-col items-center justify-center text-morandi-secondary">
              <AlertCircle size={32} className="mb-2 opacity-50" />
              <p>尚無報價單資料</p>
              <p className="text-xs mt-1">{mode === 'tour' ? '此團尚未關聯報價單' : '請先建立報價單'}</p>
            </div>
          ) : quoteItems.length === 0 && existingRequests.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-morandi-secondary">
              <AlertCircle size={32} className="mb-2 opacity-50" />
              <p>報價單尚無交通/住宿/餐食/活動資料</p>
              <p className="text-xs mt-1">請先在報價單填寫相關項目</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 統一表格 */}
              <div className="border border-border rounded-lg overflow-hidden">
                {/*
                  表格欄位寬度說明：
                  - table-fixed: 讓表格尊重設定的寬度
                  - w-[Xpx]: 固定寬度欄位
                  - 不設寬度: 彈性欄位，自動填滿剩餘空間
                */}
                <table className="w-full text-sm table-fixed">
                  {/* 表頭 */}
                  <thead>
                    <tr className="bg-morandi-container/50 border-b border-border">
                      <th className="px-3 py-2 text-left font-medium text-morandi-primary w-[60px]">分類</th>
                      <th className="px-3 py-2 text-left font-medium text-morandi-primary w-[70px]">日期</th>
                      <th className="px-3 py-2 text-left font-medium text-morandi-primary w-[150px]">供應商</th>
                      <th className="px-3 py-2 text-left font-medium text-morandi-primary w-[200px]">項目說明</th>
                      <th className="px-3 py-2 text-center font-medium text-morandi-primary">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CATEGORIES.map((cat) => {
                      const trackItems = changeTrackByCategory[cat.key]

                      if (trackItems.length === 0) return null

                      // 按供應商分組取消項目（用於列印取消單）
                      const cancelledBySupplier = new Map<string, ConfirmedRequirementItem[]>()
                      trackItems.forEach(ti => {
                        if (ti.type === 'cancelled') {
                          const snap = ti.item as ConfirmedRequirementItem
                          const existing = cancelledBySupplier.get(snap.supplier_name) || []
                          existing.push(snap)
                          cancelledBySupplier.set(snap.supplier_name, existing)
                        }
                      })

                      return (
                        <React.Fragment key={cat.key}>
                          {/* 分類標題行 */}
                          <tr className="bg-morandi-container/30 border-t border-border">
                            <td colSpan={5} className="px-3 py-1.5">
                              <span className="font-medium text-morandi-primary">{cat.label}</span>
                            </td>
                          </tr>

                          {/* 項目列表 */}
                          {trackItems.map((trackItem, idx) => {
                            const isCancelled = trackItem.type === 'cancelled'
                            const isNew = trackItem.type === 'new'
                            const isConfirmed = trackItem.type === 'confirmed'

                            // 取得項目資料
                            const itemData = trackItem.item
                            const supplierName = 'supplierName' in itemData ? itemData.supplierName : itemData.supplier_name
                            const serviceDate = 'serviceDate' in itemData ? itemData.serviceDate : itemData.service_date
                            const title = itemData.title
                            const note = itemData.note

                            // 決定文字顏色（使用莫蘭迪色系）
                            // 取消 = 莫蘭迪紅色刪除線，新增 = 莫蘭迪金色，已確認 = 黑色
                            let textClass = ''
                            let rowBgClass = ''
                            if (isCancelled) {
                              textClass = 'text-morandi-red line-through'
                              rowBgClass = 'bg-morandi-red/10'
                            } else if (isNew) {
                              textClass = 'text-morandi-gold'
                              rowBgClass = 'bg-morandi-gold/10'
                            }

                            return (
                              <tr
                                key={`${cat.key}-${idx}`}
                                className={`border-t border-border/50 ${rowBgClass}`}
                              >
                                <td className={`px-3 py-2 text-xs ${textClass || 'text-morandi-secondary'}`}>
                                  {cat.label}
                                </td>
                                <td className={`px-3 py-2 ${textClass}`}>
                                  {formatDate(serviceDate)}
                                </td>
                                <td className={`px-3 py-2 ${textClass}`}>
                                  {supplierName || '-'}
                                </td>
                                <td className={`px-3 py-2 ${textClass}`}>
                                  <div>
                                    {title}
                                    {/* 備註（航班資訊）*/}
                                    {note && (
                                      <div className={`text-xs mt-1 whitespace-pre-line ${isCancelled ? 'text-morandi-red/80' : isNew ? 'text-morandi-gold/80' : 'text-morandi-secondary'}`}>
                                        {note}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {/* 狀態標籤 */}
                                    {isCancelled && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-morandi-red/20 text-morandi-red">
                                        <Trash2 size={10} />
                                        取消
                                      </span>
                                    )}
                                    {isNew && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-morandi-gold/20 text-morandi-gold">
                                        <Plus size={10} />
                                        新增
                                      </span>
                                    )}
                                    {/* 列印取消單按鈕：只對取消項目顯示 */}
                                    {isCancelled && supplierName && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const items = cancelledBySupplier.get(supplierName)
                                          if (items) handlePrintCancellation(supplierName, items)
                                        }}
                                        className="h-6 w-6 p-0 text-morandi-red hover:text-morandi-red/80 hover:bg-morandi-red/10"
                                        title="列印取消單"
                                      >
                                        <Printer size={14} />
                                      </Button>
                                    )}
                                    {/* 產生需求單按鈕：只對非取消且有供應商的項目顯示 */}
                                    {!isCancelled && supplierName && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openRequestDialog(cat.key, supplierName)}
                                        className="h-6 w-6 p-0 text-morandi-gold hover:text-morandi-gold-hover hover:bg-morandi-gold/10"
                                        title="產生需求單"
                                      >
                                        <FileText size={14} />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* 說明：有變更時顯示 */}
              {hasUnconfirmedChanges && (
                <div className="flex items-center gap-4 text-xs text-morandi-secondary px-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-morandi-red/20 rounded border border-morandi-red/50" />
                    <span className="text-morandi-red">取消</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-morandi-gold/20 rounded border border-morandi-gold/50" />
                    <span className="text-morandi-gold">新增</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-card rounded border border-border" />
                    <span>已確認</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="flex justify-between items-center gap-2 pt-4 border-t border-border">
          <div className="text-xs text-morandi-secondary">
            {confirmedSnapshot.length === 0 ? (
              <span>尚未確認需求，點擊「確認需求」開始追蹤變更</span>
            ) : hasUnconfirmedChanges ? (
              <span className="text-morandi-gold">
                發現變更：
                {cancelledItems.length > 0 && <span className="text-morandi-red ml-1">{cancelledItems.length} 項取消</span>}
                {cancelledItems.length > 0 && quoteItems.filter(q => !confirmedSnapshot.some(s => generateItemKey(s.category, s.supplier_name, s.title, s.service_date) === generateItemKey(q.category, q.supplierName, q.title, q.serviceDate))).length > 0 && '、'}
                {quoteItems.filter(q => !confirmedSnapshot.some(s => generateItemKey(s.category, s.supplier_name, s.title, s.service_date) === generateItemKey(q.category, q.supplierName, q.title, q.serviceDate))).length > 0 && (
                  <span className="text-morandi-gold ml-1">
                    {quoteItems.filter(q => !confirmedSnapshot.some(s => generateItemKey(s.category, s.supplier_name, s.title, s.service_date) === generateItemKey(q.category, q.supplierName, q.title, q.serviceDate))).length} 項新增
                  </span>
                )}
              </span>
            ) : (
              <span className="text-morandi-green">需求已確認，無變更</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="gap-2">
              <X size={16} />
              關閉
            </Button>
            {/* 有變更時：顯示「確認變更」（會更新快照）*/}
            {(confirmedSnapshot.length === 0 || hasUnconfirmedChanges) && quoteItems.length > 0 && (
              <Button
                onClick={handleConfirmChanges}
                disabled={confirmingChanges}
                className="gap-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                {confirmingChanges ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                {confirmedSnapshot.length === 0 ? '確認需求' : '確認變更'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    )}

    {/* 需求單 Dialog - 必須在外層 Dialog 外面，避免 z-index 衝突 */}
    {selectedRequestData && (
      <TourRequestFormDialog
        isOpen={requestDialogOpen}
        onClose={() => {
          setRequestDialogOpen(false)
          setSelectedRequestData(null)
        }}
        pkg={pkg}
        proposal={proposal}
        tour={tour}
        category={selectedRequestData.category}
        supplierName={selectedRequestData.supplierName}
        items={selectedRequestData.items}
        tourCode={source.code}
        tourName={source.title}
        departureDate={startDate || undefined}
        pax={source.groupSize || undefined}
      />
    )}

    {/* 手動新增需求 Dialog */}
    <AddManualRequestDialog
      isOpen={addManualDialogOpen}
      onClose={() => setAddManualDialogOpen(false)}
      tourId={mode === 'tour' ? source.id : undefined}
      proposalPackageId={mode === 'package' ? source.id : undefined}
      tourCode={source.code}
      tourName={source.title}
      startDate={startDate}
      onSuccess={async () => {
        // 重新載入需求單
        const filterField = mode === 'tour' ? 'tour_id' : 'proposal_package_id'
        const { data } = await supabase
          .from('tour_requests')
          .select('id, category, supplier_name, title, service_date, quantity, note')
          .eq(filterField, source.id)
          .order('created_at', { ascending: true })
        if (data) {
          setExistingRequests(data as TourRequest[])
        }
      }}
    />
    </>
  )
}
