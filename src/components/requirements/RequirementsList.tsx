'use client'

/**
 * RequirementsList - 需求總覽共用組件
 *
 * 支援兩種模式：
 * - tourId: 旅遊團模式（開團後使用）
 * - proposalPackageId: 提案套件模式（提案階段使用）
 *
 * 功能：
 * - 從報價單解析需求項目
 * - 變更追蹤（新增/已確認/取消）
 * - 確認變更並建立需求單
 * - 手動新增需求
 */

import { useEffect, useState, useMemo, useCallback } from 'react'
import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Check,
  FileText,
  Plus,
  Printer,
  EyeOff,
  Eye,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores'
import { AddManualRequestDialog } from '@/features/proposals/components/AddManualRequestDialog'
import type { Tour } from '@/stores/types'
import type { CostCategory } from '@/features/quotes/types'
import type { ConfirmedRequirementItem, ConfirmedRequirementsSnapshot, ProposalPackage } from '@/types/proposal.types'
import type { Json } from '@/lib/supabase/types'
import { useToast } from '@/components/ui/use-toast'
import { logger } from '@/lib/utils/logger'
import { generateTourRequestCode } from '@/stores/utils/code-generator'
import { getStatusConfig } from '@/lib/status-config'
import type { FlightInfo } from '@/types/flight.types'

// ============================================
// Types
// ============================================

interface RequirementsListProps {
  // 來源（二擇一）
  tourId?: string
  proposalPackageId?: string
  // 報價單 ID（可選，會自動從 tour/package 查詢）
  quoteId?: string | null
  // 開啟需求單 Dialog 的回調
  onOpenRequestDialog?: (data: {
    category: string
    supplierName: string
    items: { serviceDate: string | null; title: string; quantity: number; note?: string }[]
    tour?: Tour
    pkg?: ProposalPackage
    startDate: string | null
  }) => void
  // 樣式
  className?: string
}

// 需求單類型
interface TourRequest {
  id: string
  code: string
  category: string
  supplier_name: string
  title: string
  service_date: string | null
  quantity: number | null
  note?: string | null
  status?: string | null
  quoted_cost?: number | null
  hidden?: boolean | null
  resource_id?: string | null
  resource_type?: string | null
}

// 報價單項目
interface QuoteItem {
  category: string
  supplierName: string
  title: string
  serviceDate: string | null
  quantity: number
  key: string
  notes?: string
  resourceType?: string | null
  resourceId?: string | null
  latitude?: number | null
  longitude?: number | null
  googleMapsUrl?: string | null
  // 報價（業務報給客戶的價格）
  quotedPrice?: number | null
}

// 變更追蹤項目
interface ChangeTrackItem {
  type: 'confirmed' | 'new' | 'cancelled'
  item: ConfirmedRequirementItem | QuoteItem
}

// FlightInfo 已移至 @/types/flight.types.ts

// 分類配置
type CategoryKey = 'transport' | 'hotel' | 'restaurant' | 'activity' | 'other'
const CATEGORIES: { key: CategoryKey; label: string; quoteCategoryId: string }[] = [
  { key: 'transport', label: '交通', quoteCategoryId: 'transport' },
  { key: 'hotel', label: '住宿', quoteCategoryId: 'accommodation' },
  { key: 'restaurant', label: '餐食', quoteCategoryId: 'meals' },
  { key: 'activity', label: '門票/活動', quoteCategoryId: 'activities' },
  { key: 'other', label: '其他', quoteCategoryId: 'others' },
]

// ============================================
// Component
// ============================================

export function RequirementsList({
  tourId,
  proposalPackageId,
  quoteId: propQuoteId,
  onOpenRequestDialog,
  className,
}: RequirementsListProps) {
  const { toast } = useToast()
  const { user } = useAuthStore()

  // 狀態
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tour, setTour] = useState<Tour | null>(null)
  const [pkg, setPkg] = useState<ProposalPackage | null>(null)
  const [linkedQuoteId, setLinkedQuoteId] = useState<string | null>(propQuoteId || null)
  const [existingRequests, setExistingRequests] = useState<TourRequest[]>([])
  const [quoteCategories, setQuoteCategories] = useState<CostCategory[]>([])
  const [startDate, setStartDate] = useState<string | null>(null)
  const [outboundFlight, setOutboundFlight] = useState<FlightInfo | null>(null)
  const [returnFlight, setReturnFlight] = useState<FlightInfo | null>(null)
  const [confirmedSnapshot, setConfirmedSnapshot] = useState<ConfirmedRequirementItem[]>([])
  const [confirmingChanges, setConfirmingChanges] = useState(false)

  // Dialog 狀態
  const [addManualDialogOpen, setAddManualDialogOpen] = useState(false)
  const [addManualCategory, setAddManualCategory] = useState<string>('transport')

  // 隱藏項目展開狀態（按分類）
  const [expandedHiddenCategories, setExpandedHiddenCategories] = useState<Set<string>>(new Set())

  // 判斷模式
  const mode = tourId ? 'tour' : 'proposal'

  // ============================================
  // 載入資料
  // ============================================
  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    else setRefreshing(true)

    try {
      let quoteId = propQuoteId || null
      let workspaceId: string | null = null

      if (mode === 'tour' && tourId) {
        // 旅遊團模式：載入團資料
        const { data: tourData } = await supabase
          .from('tours')
          .select('*')
          .eq('id', tourId)
          .single()

        if (!tourData) return

        setTour(tourData as Tour)
        workspaceId = (tourData as Tour).workspace_id || null

        // 取得報價單 ID
        quoteId = quoteId || (tourData as { quote_id?: string | null }).quote_id || null

        // 載入航班資訊
        if (tourData.outbound_flight) {
          setOutboundFlight(tourData.outbound_flight as FlightInfo)
          setReturnFlight(tourData.return_flight as FlightInfo | null)
        }

        // 載入已確認快照
        if (tourData.confirmed_requirements && typeof tourData.confirmed_requirements === 'object') {
          const snapshot = (tourData.confirmed_requirements as unknown as ConfirmedRequirementsSnapshot)?.snapshot
          setConfirmedSnapshot(snapshot || [])
        } else {
          setConfirmedSnapshot([])
        }

        // 載入現有需求單
        const { data: requests } = await supabase
          .from('tour_requests')
          .select('id, code, category, supplier_name, title, service_date, quantity, notes, status, quoted_cost, hidden, resource_id, resource_type')
          .eq('tour_id', tourId)
          .order('created_at', { ascending: true })
        setExistingRequests((requests as TourRequest[]) || [])

      } else if (mode === 'proposal' && proposalPackageId) {
        // 提案套件模式：載入套件資料
        const { data: pkgData } = await supabase
          .from('proposal_packages')
          .select('*, proposals(*)')
          .eq('id', proposalPackageId)
          .single()

        if (!pkgData) return

        setPkg(pkgData as unknown as ProposalPackage)
        workspaceId = (pkgData as { workspace_id?: string }).workspace_id || null

        // 取得報價單 ID
        quoteId = quoteId || (pkgData as { quote_id?: string | null }).quote_id || null

        // 載入已確認快照
        if (pkgData.confirmed_requirements && typeof pkgData.confirmed_requirements === 'object') {
          const snapshot = (pkgData.confirmed_requirements as unknown as ConfirmedRequirementsSnapshot)?.snapshot
          setConfirmedSnapshot(snapshot || [])
        } else {
          setConfirmedSnapshot([])
        }

        // 載入現有需求單
        const { data: requests } = await supabase
          .from('tour_requests')
          .select('id, code, category, supplier_name, title, service_date, quantity, notes, status, quoted_cost, hidden, resource_id, resource_type')
          .eq('proposal_package_id', proposalPackageId)
          .order('created_at', { ascending: true })
        setExistingRequests((requests as TourRequest[]) || [])
      }

      setLinkedQuoteId(quoteId)

      // 載入報價單內容
      if (quoteId) {
        const { data: quote } = await supabase
          .from('quotes')
          .select('categories, start_date')
          .eq('id', quoteId)
          .single()

        if (quote) {
          setQuoteCategories((quote.categories as unknown as CostCategory[]) || [])
          setStartDate(quote.start_date || (tour?.departure_date) || null)
        }
      } else {
        setQuoteCategories([])
        setStartDate(tour?.departure_date || null)
      }
    } catch (error) {
      logger.error('載入需求資料失敗:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [tourId, proposalPackageId, propQuoteId, mode, tour?.departure_date])

  useEffect(() => {
    loadData(true)
  }, [loadData])

  // ============================================
  // 計算邏輯
  // ============================================

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

  // 從報價單解析項目
  const quoteItems = useMemo((): QuoteItem[] => {
    const items: QuoteItem[] = []

    for (const cat of CATEGORIES) {
      // 交通：從航班資訊
      if (cat.key === 'transport') {
        if (outboundFlight || returnFlight) {
          const flightInfos: string[] = []
          const outboundInfo = formatFlightInfo(outboundFlight, '去程')
          const returnInfo = formatFlightInfo(returnFlight, '回程')
          if (outboundInfo) flightInfos.push(outboundInfo)
          if (returnInfo) flightInfos.push(returnInfo)

          if (flightInfos.length > 0) {
            const airline = outboundFlight?.airline || returnFlight?.airline || '航空公司'
            items.push({
              category: 'transport',
              supplierName: airline,
              title: '機票',
              serviceDate: startDate,
              quantity: 1,
              key: 'transport-機票',
              notes: flightInfos.join('\n'),
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
          if (item.day) serviceDate = calculateDate(item.day)
        } else if (cat.key === 'restaurant') {
          const match = item.name.match(/Day\s*(\d+)\s*(早餐|午餐|晚餐)\s*(?:[：:]|\s*-\s*)\s*(.+)/)
          if (match) {
            const dayNum = parseInt(match[1])
            supplierName = match[3].trim()
            title = match[2]
            serviceDate = calculateDate(dayNum)
          }
        } else if (cat.key === 'activity') {
          title = item.name
          if (item.day) serviceDate = calculateDate(item.day)
        } else {
          title = item.name
        }

        const key = `${cat.key}-${supplierName}-${title}-${serviceDate || ''}`
        items.push({
          category: cat.key,
          supplierName,
          title,
          serviceDate,
          quantity: item.quantity || 1,
          key,
          resourceType: item.resource_type,
          resourceId: item.resource_id,
          latitude: item.resource_latitude,
          longitude: item.resource_longitude,
          googleMapsUrl: item.resource_google_maps_url,
          quotedPrice: item.unit_price,
        })
      }
    }

    return items
  }, [quoteCategories, calculateDate, startDate, outboundFlight, returnFlight, formatFlightInfo])

  // 生成項目 key
  const generateItemKey = useCallback((category: string, supplierName: string, title: string, date: string | null) => {
    return `${category}-${supplierName}-${title}-${date || ''}`
  }, [])

  // 計算變更追蹤
  const changeTrackByCategory = useMemo(() => {
    const result: Record<CategoryKey, ChangeTrackItem[]> = {
      transport: [], hotel: [], restaurant: [], activity: [], other: [],
    }

    if (confirmedSnapshot.length === 0) {
      for (const item of quoteItems) {
        const cat = item.category as CategoryKey
        result[cat].push({ type: 'new', item })
      }
      return result
    }

    const snapshotKeys = new Map<string, ConfirmedRequirementItem>()
    for (const snap of confirmedSnapshot) {
      const key = generateItemKey(snap.category, snap.supplier_name, snap.title, snap.service_date)
      snapshotKeys.set(key, snap)
    }

    const quoteKeys = new Set<string>()
    for (const item of quoteItems) {
      const key = generateItemKey(item.category, item.supplierName, item.title, item.serviceDate)
      quoteKeys.add(key)
    }

    for (const item of quoteItems) {
      const cat = item.category as CategoryKey
      const key = generateItemKey(item.category, item.supplierName, item.title, item.serviceDate)
      if (snapshotKeys.has(key)) {
        result[cat].push({ type: 'confirmed', item })
      } else {
        result[cat].push({ type: 'new', item })
      }
    }

    for (const snap of confirmedSnapshot) {
      const cat = snap.category as CategoryKey
      const key = generateItemKey(snap.category, snap.supplier_name, snap.title, snap.service_date)
      if (!quoteKeys.has(key)) {
        result[cat].push({ type: 'cancelled', item: snap })
      }
    }

    // 按日期排序
    for (const cat of Object.keys(result) as CategoryKey[]) {
      result[cat].sort((a, b) => {
        const dateA = ('serviceDate' in a.item ? a.item.serviceDate : a.item.service_date) || ''
        const dateB = ('serviceDate' in b.item ? b.item.serviceDate : b.item.service_date) || ''
        return dateA.localeCompare(dateB)
      })
    }

    return result
  }, [quoteItems, confirmedSnapshot, generateItemKey])

  // 是否有變更
  const hasUnconfirmedChanges = useMemo(() => {
    for (const cat of CATEGORIES) {
      if (changeTrackByCategory[cat.key].some(item => item.type === 'new' || item.type === 'cancelled')) {
        return true
      }
    }
    return false
  }, [changeTrackByCategory])

  // ============================================
  // 動作
  // ============================================

  // 隱藏/恢復需求（支援尚未建立需求單的項目）
  const handleToggleHidden = useCallback(async (
    existingRequestId: string | null,
    hidden: boolean,
    itemData?: {
      category: string
      supplierName: string
      title: string
      serviceDate: string | null
      quantity: number
      notes?: string
      resourceId?: string | null
      resourceType?: string | null
    }
  ) => {
    try {
      if (existingRequestId) {
        // 已有需求單，直接更新
        const { error } = await supabase
          .from('tour_requests')
          .update({ hidden })
          .eq('id', existingRequestId)

        if (error) throw error

        // 更新本地狀態
        setExistingRequests(prev =>
          prev.map(r => r.id === existingRequestId ? { ...r, hidden } : r)
        )
      } else if (itemData && user?.workspace_id) {
        // 尚未建立需求單，創建一個並標記為隱藏
        const code = `RQ${Date.now().toString().slice(-8)}`
        const insertData = {
          code,
          workspace_id: user.workspace_id,
          tour_id: tourId || null,
          proposal_package_id: proposalPackageId || null,
          tour_code: tour?.code || pkg?.version_name || null,
          tour_name: tour?.name || pkg?.version_name || null,
          category: itemData.category,
          supplier_name: itemData.supplierName || null,
          title: itemData.title,
          service_date: itemData.serviceDate || null,
          quantity: itemData.quantity,
          notes: itemData.notes || null,
          status: 'draft',
          hidden: true,
          resource_id: itemData.resourceId || null,
          resource_type: itemData.resourceType || null,
          created_by: user.id,
          created_by_name: user.display_name || user.chinese_name || '',
        }

        const { data: newRequest, error } = await supabase
          .from('tour_requests')
          .insert(insertData)
          .select('id, code, category, supplier_name, title, service_date, quantity, notes, status, quoted_cost, hidden, resource_id, resource_type')
          .single()

        if (error) throw error

        // 添加到本地狀態
        if (newRequest) {
          setExistingRequests(prev => [...prev, newRequest as TourRequest])
        }
      }

      toast({ title: hidden ? '已隱藏' : '已恢復顯示' })
    } catch (error) {
      logger.error('更新隱藏狀態失敗:', error)
      toast({ title: '操作失敗', variant: 'destructive' })
    }
  }, [toast, user, tourId, proposalPackageId, tour, pkg])

  // 切換分類隱藏項目的展開狀態
  const toggleHiddenCategory = useCallback((category: string) => {
    setExpandedHiddenCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }, [])

  // 開啟新增需求對話框（指定分類）
  const openAddManualDialog = useCallback((category: string) => {
    setAddManualCategory(category)
    setAddManualDialogOpen(true)
  }, [])

  // 確認需求
  const handleConfirmChanges = useCallback(async () => {
    if (!user) return

    // 來源資訊
    const source = mode === 'tour' && tour
      ? { id: tour.id, code: tour.code || '', title: tour.name, workspaceId: tour.workspace_id || user.workspace_id || '', startDate }
      : pkg
        ? { id: pkg.id, code: '', title: pkg.version_name || '', workspaceId: user.workspace_id || '', startDate }
        : null

    if (!source) return

    setConfirmingChanges(true)
    try {
      const newSnapshot: ConfirmedRequirementItem[] = quoteItems.map(item => ({
        id: crypto.randomUUID(),
        category: item.category,
        supplier_name: item.supplierName,
        service_date: item.serviceDate,
        title: item.title,
        quantity: item.quantity,
        notes: item.notes,
      }))

      const snapshotData: ConfirmedRequirementsSnapshot = {
        snapshot: newSnapshot,
        confirmed_at: new Date().toISOString(),
        confirmed_by: user.id,
      }

      // 收集新增項目
      const newItems: QuoteItem[] = []
      for (const cat of CATEGORIES) {
        for (const trackItem of changeTrackByCategory[cat.key]) {
          if (trackItem.type === 'new') {
            newItems.push(trackItem.item as QuoteItem)
          }
        }
      }

      // 建立需求單
      if (newItems.length > 0) {
        const { data: existingCodes } = await supabase
          .from('tour_requests')
          .select('code')
          .or(tourId ? `tour_id.eq.${tourId}` : `proposal_package_id.eq.${proposalPackageId}`)

        const itemsBySupplier = new Map<string, QuoteItem[]>()
        for (const item of newItems) {
          const key = `${item.category}-${item.supplierName}`
          if (!itemsBySupplier.has(key)) itemsBySupplier.set(key, [])
          itemsBySupplier.get(key)!.push(item)
        }

        const requestsToInsert = []
        for (const [, items] of itemsBySupplier) {
          const firstItem = items[0]
          const code = generateTourRequestCode(
            source.code || 'PKG',
            [...(existingCodes || []), ...requestsToInsert.map(r => ({ code: r.code }))]
          )

          const serviceDates = items.map(i => i.serviceDate).filter((d): d is string => !!d).sort()

          requestsToInsert.push({
            code,
            tour_id: tourId || null,
            proposal_package_id: proposalPackageId || null,
            tour_code: source.code,
            tour_name: source.title,
            handler_type: 'external',
            supplier_name: firstItem.supplierName,
            category: firstItem.category,
            service_date: serviceDates[0] || null,
            title: `${firstItem.supplierName} - ${CATEGORIES.find(c => c.key === firstItem.category)?.label || firstItem.category}`,
            quantity: items.reduce((sum, i) => sum + i.quantity, 0),
            status: 'pending',
            workspace_id: source.workspaceId,
            created_by: user.id,
            created_by_name: user.name || user.email || '',
          })
        }

        if (requestsToInsert.length > 0) {
          await supabase.from('tour_requests').insert(requestsToInsert)
        }
      }

      // 更新快照
      if (mode === 'tour' && tourId) {
        await supabase
          .from('tours')
          .update({ confirmed_requirements: snapshotData as unknown as Json })
          .eq('id', tourId)
      } else if (proposalPackageId) {
        await supabase
          .from('proposal_packages')
          .update({ confirmed_requirements: snapshotData as unknown as Json })
          .eq('id', proposalPackageId)
      }

      setConfirmedSnapshot(newSnapshot)
      await loadData(false)

      toast({ title: '需求確認完成' })
    } catch (error) {
      logger.error('確認需求失敗:', error)
      toast({ title: '確認失敗', variant: 'destructive' })
    } finally {
      setConfirmingChanges(false)
    }
  }, [tour, pkg, user, quoteItems, changeTrackByCategory, tourId, proposalPackageId, mode, startDate, loadData, toast])

  // 格式化日期
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })
  }

  // 開啟需求單 Dialog
  const openRequestDialog = useCallback((category: string, supplierName: string) => {
    if (!onOpenRequestDialog) return

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
          quantity: 'quantity' in itemData ? itemData.quantity : 1,
          notes: itemData.notes,
        }
      })

    onOpenRequestDialog({
      category,
      supplierName,
      items,
      tour: tour || undefined,
      pkg: pkg || undefined,
      startDate,
    })
  }, [changeTrackByCategory, tour, pkg, startDate, onOpenRequestDialog])

  // 取得按供應商分組的取消項目
  const cancelledBySupplier = useMemo(() => {
    const result = new Map<string, ConfirmedRequirementItem[]>()
    for (const cat of CATEGORIES) {
      const trackItems = changeTrackByCategory[cat.key]
      for (const ti of trackItems) {
        if (ti.type === 'cancelled') {
          const snap = ti.item as ConfirmedRequirementItem
          const existing = result.get(snap.supplier_name) || []
          existing.push(snap)
          result.set(snap.supplier_name, existing)
        }
      }
    }
    return result
  }, [changeTrackByCategory])

  // 列印取消單
  const handlePrintCancellation = useCallback((supplierName: string, items: ConfirmedRequirementItem[]) => {
    const formatDateStr = (dateStr: string | null) => {
      if (!dateStr) return '-'
      return new Date(dateStr).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    }

    const tourCode = tour?.code || pkg?.version_name || ''
    const tourName = tour?.name || pkg?.version_name || ''

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
      <span class="info-value">${tourCode || '-'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">團名：</span>
      <span class="info-value">${tourName || '-'}</span>
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
          <td class="cancelled">${item.title}${item.notes ? `<br><small>${item.notes}</small>` : ''}</td>
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

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) {
      toast({ title: '請允許彈出視窗以進行列印', variant: 'destructive' })
      return
    }

    printWindow.document.write(printContent)
    printWindow.document.close()
  }, [tour, pkg, toast])

  // 總項目數
  const totalItems = useMemo(() => {
    let count = 0
    for (const cat of CATEGORIES) {
      count += changeTrackByCategory[cat.key].filter(t => t.type !== 'cancelled').length
    }
    return count
  }, [changeTrackByCategory])

  // ============================================
  // Render
  // ============================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-morandi-gold" size={32} />
      </div>
    )
  }

  return (
    <>
      <div className={cn('space-y-4', className)}>
        {/* 標題列 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-morandi-secondary">共 {totalItems} 項</span>
            {hasUnconfirmedChanges && (
              <span className="text-xs text-morandi-gold">(有變更待確認)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(false)}
              disabled={refreshing}
              className="gap-1"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              刷新
            </Button>
            {(confirmedSnapshot.length === 0 || hasUnconfirmedChanges) && quoteItems.length > 0 && (
              <Button
                size="sm"
                onClick={handleConfirmChanges}
                disabled={confirmingChanges}
                className="gap-1 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                {confirmingChanges ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {confirmedSnapshot.length === 0 ? '確認需求' : '確認變更'}
              </Button>
            )}
          </div>
        </div>

        {/* 主表格 */}
        {!linkedQuoteId ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <AlertCircle className="mx-auto text-morandi-muted mb-3" size={48} />
            <p className="text-morandi-secondary mb-2">尚無報價單資料</p>
            <p className="text-xs text-morandi-muted">
              {mode === 'tour' ? '請到「總覽」頁籤點擊「報價單」按鈕進行綁定' : '請先建立報價單'}
            </p>
          </div>
        ) : quoteItems.length === 0 && existingRequests.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <AlertCircle className="mx-auto text-morandi-muted mb-3" size={48} />
            <p className="text-morandi-secondary">報價單尚無需求項目</p>
            <p className="text-xs text-morandi-muted mt-1">請先在報價單填寫交通/住宿/餐食/活動資料</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden bg-card">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="bg-morandi-container/50 border-b border-border">
                  <th className="px-3 py-2.5 text-left font-medium text-morandi-primary w-[70px]">日期</th>
                  <th className="px-3 py-2.5 text-left font-medium text-morandi-primary w-[140px]">供應商</th>
                  <th className="px-3 py-2.5 text-left font-medium text-morandi-primary w-[200px]">項目說明</th>
                  <th className="px-3 py-2.5 text-right font-medium text-morandi-primary w-[80px]">報價</th>
                  <th className="px-3 py-2.5 text-right font-medium text-morandi-primary w-[80px]">成本</th>
                  <th className="px-3 py-2.5 text-center font-medium text-morandi-primary w-[80px]">狀態</th>
                  <th className="px-3 py-2.5 text-center font-medium text-morandi-primary w-[70px]">操作</th>
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.map((cat) => {
                  const trackItems = changeTrackByCategory[cat.key]
                  if (trackItems.length === 0) return null

                  // 輔助函數：找匹配的需求單（優先用 resource_id，其次用 supplier_name + service_date）
                  const findMatchingRequest = (itemData: ChangeTrackItem['item']) => {
                    const itemResourceId = 'resourceId' in itemData ? itemData.resourceId : undefined
                    const itemSupplierName = 'supplierName' in itemData ? itemData.supplierName : itemData.supplier_name
                    const itemServiceDate = 'serviceDate' in itemData ? itemData.serviceDate : itemData.service_date

                    // 優先用 resource_id 匹配（更可靠）
                    if (itemResourceId) {
                      const byResourceId = existingRequests.find(r =>
                        r.category === cat.key && r.resource_id === itemResourceId
                      )
                      if (byResourceId) return byResourceId
                    }

                    // 其次用 supplier_name + service_date 匹配（避免同名供應商在不同日期混淆）
                    return existingRequests.find(r =>
                      r.category === cat.key &&
                      r.supplier_name === itemSupplierName &&
                      r.service_date === itemServiceDate
                    )
                  }

                  // 輔助函數：取得供應商識別 key（優先 resource_id）
                  const getSupplierKey = (itemData: ChangeTrackItem['item']) => {
                    const itemResourceId = 'resourceId' in itemData ? itemData.resourceId : undefined
                    const itemSupplierName = 'supplierName' in itemData ? itemData.supplierName : itemData.supplier_name
                    const serviceDate = 'serviceDate' in itemData ? itemData.serviceDate : itemData.service_date

                    // 優先用 resourceId
                    if (itemResourceId) {
                      return itemResourceId
                    }

                    // 「飯店早餐」是固定文字，但每天可能是不同飯店，需要用日期區分
                    if (itemSupplierName === '飯店早餐') {
                      return `飯店早餐-${serviceDate || ''}`
                    }

                    // 一般供應商用名稱分組
                    if (itemSupplierName) {
                      return itemSupplierName
                    }

                    // 沒有供應商時，用 title + date 作為唯一 key
                    return `${itemData.title}-${serviceDate || ''}`
                  }

                  // 計算隱藏與可見項目
                  const visibleItems: typeof trackItems = []
                  const hiddenItems: typeof trackItems = []

                  for (const trackItem of trackItems) {
                    const existingRequest = findMatchingRequest(trackItem.item)
                    // 如果有對應的需求單且被隱藏，則放入隱藏區
                    if (existingRequest?.hidden) {
                      hiddenItems.push(trackItem)
                    } else {
                      visibleItems.push(trackItem)
                    }
                  }

                  const isHiddenExpanded = expandedHiddenCategories.has(cat.key)

                  const categoryTotal = visibleItems.reduce((sum, ti) => {
                    if (ti.type === 'cancelled') return sum
                    const existing = findMatchingRequest(ti.item)
                    return sum + (existing?.quoted_cost || 0)
                  }, 0)

                  // 追蹤已顯示操作按鈕的供應商（同一供應商只在第一行顯示按鈕）
                  const renderedSuppliers = new Set<string>()

                  // 渲染單一項目的函數
                  const renderItem = (trackItem: ChangeTrackItem, idx: number, isHidden: boolean) => {
                    const isCancelled = trackItem.type === 'cancelled'
                    const isNew = trackItem.type === 'new'
                    const itemData = trackItem.item
                    const supplierName = 'supplierName' in itemData ? itemData.supplierName : itemData.supplier_name
                    const serviceDate = 'serviceDate' in itemData ? itemData.serviceDate : itemData.service_date
                    const title = itemData.title
                    const notes = itemData.notes
                    const quantity = 'quantity' in itemData ? itemData.quantity : 1
                    const resourceId = 'resourceId' in itemData ? itemData.resourceId : undefined

                    // 找匹配的需求單
                    const existingRequest = findMatchingRequest(itemData)

                    // 判斷是否為該供應商的第一行（只有第一行顯示操作按鈕）
                    const supplierKey = getSupplierKey(itemData)
                    const isFirstRowForSupplier = !renderedSuppliers.has(supplierKey)
                    if (isFirstRowForSupplier) {
                      renderedSuppliers.add(supplierKey)
                    }

                    // 使用統一狀態配置
                    let statusLabel = ''
                    let statusClass = ''
                    if (isCancelled) {
                      statusLabel = '待取消'
                      const config = getStatusConfig('tour_request', 'cancelled')
                      statusClass = `${config.bgColor} ${config.color}`
                    } else if (isNew || !existingRequest) {
                      statusLabel = '待作業'
                      const config = getStatusConfig('tour_request', 'pending')
                      statusClass = `${config.bgColor} ${config.color}`
                    } else {
                      const s = existingRequest.status || 'pending'
                      const config = getStatusConfig('tour_request', s)
                      statusLabel = config.label
                      statusClass = `${config.bgColor} ${config.color}`
                    }

                    const quotedCost = existingRequest?.quoted_cost
                    // 報價（從報價單帶入）
                    const quotedPrice = 'quotedPrice' in itemData ? itemData.quotedPrice : null

                    return (
                      <tr
                        key={`${cat.key}-${isHidden ? 'hidden' : 'visible'}-${idx}`}
                        className={cn(
                          'border-t border-border/50 hover:bg-morandi-container/20',
                          isCancelled && 'bg-morandi-red/5',
                          isHidden && 'bg-morandi-muted/5'
                        )}
                      >
                        <td className={cn('px-3 py-2.5', isCancelled && 'line-through text-morandi-muted')}>
                          {formatDate(serviceDate)}
                        </td>
                        <td className={cn('px-3 py-2.5', isCancelled && 'line-through text-morandi-muted')}>
                          {supplierName || '-'}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className={cn(isCancelled && 'line-through text-morandi-muted')}>
                            <span>{title}</span>
                            {notes && (
                              <div className="text-xs mt-0.5 text-morandi-secondary whitespace-pre-line">
                                {notes}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-morandi-secondary">
                          {quotedPrice ? `$${quotedPrice.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-morandi-primary">
                          {quotedCost ? `$${quotedCost.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', statusClass)}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* 隱藏/恢復按鈕 - 隱藏項目一定要顯示恢復按鈕，不受 isFirstRowForSupplier 限制 */}
                            {!isCancelled && (isHidden || isFirstRowForSupplier) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleHidden(
                                  existingRequest?.id || null,
                                  !isHidden,
                                  !existingRequest ? {
                                    category: cat.key,
                                    supplierName: supplierName || '',
                                    title,
                                    serviceDate,
                                    quantity,
                                    notes: notes || undefined,
                                    resourceId,
                                    resourceType: cat.key === 'hotel' ? 'hotel' : cat.key === 'restaurant' ? 'restaurant' : cat.key === 'activity' ? 'attraction' : undefined,
                                  } : undefined
                                )}
                                className={cn(
                                  'h-7 w-7 p-0',
                                  isHidden
                                    ? 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/50'
                                    : 'text-morandi-muted hover:text-morandi-secondary hover:bg-morandi-container/30'
                                )}
                                title={isHidden ? '恢復顯示' : '隱藏'}
                              >
                                {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                              </Button>
                            )}
                            {/* 列印取消單按鈕 */}
                            {isFirstRowForSupplier && isCancelled && supplierName && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const items = cancelledBySupplier.get(supplierName)
                                  if (items) handlePrintCancellation(supplierName, items)
                                }}
                                className="h-7 w-7 p-0 text-morandi-red hover:text-morandi-red/80 hover:bg-morandi-red/10"
                                title="列印取消單"
                              >
                                <Printer size={14} />
                              </Button>
                            )}
                            {/* 產生需求單按鈕 */}
                            {isFirstRowForSupplier && !isCancelled && supplierName && onOpenRequestDialog && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openRequestDialog(cat.key, supplierName)}
                                className="h-7 w-7 p-0 text-morandi-gold hover:text-morandi-gold-hover hover:bg-morandi-gold/10"
                                title="產生需求單"
                              >
                                <FileText size={14} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <React.Fragment key={cat.key}>
                      {/* 分類標題行 */}
                      <tr className="bg-morandi-container/30 border-t border-border">
                        <td colSpan={3} className="px-3 py-2">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-morandi-primary">{cat.label}</span>
                            <span className="text-xs text-morandi-secondary">
                              ({visibleItems.filter(t => t.type !== 'cancelled').length} 項)
                            </span>
                            {/* 已隱藏指示器 */}
                            {hiddenItems.length > 0 && (
                              <button
                                onClick={() => toggleHiddenCategory(cat.key)}
                                className="flex items-center gap-1 text-xs text-morandi-muted hover:text-morandi-secondary transition-colors"
                              >
                                {isHiddenExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                <EyeOff size={12} />
                                <span>已隱藏({hiddenItems.length})</span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td></td>{/* 報價欄 */}
                        <td className="px-3 py-2 text-right font-medium text-morandi-primary">
                          {categoryTotal > 0 ? `$${categoryTotal.toLocaleString()}` : ''}
                        </td>
                        <td></td>{/* 狀態欄 */}
                        <td className="px-3 py-2 text-center">
                          {/* 新增按鈕 */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAddManualDialog(cat.key)}
                            className="h-7 px-2 text-xs text-morandi-gold hover:text-morandi-gold-hover hover:bg-morandi-gold/10 gap-1"
                          >
                            <Plus size={14} />
                            新增
                          </Button>
                        </td>
                      </tr>

                      {/* 可見項目 */}
                      {visibleItems.map((trackItem, idx) => renderItem(trackItem, idx, false))}

                      {/* 隱藏項目（展開時顯示）*/}
                      {isHiddenExpanded && hiddenItems.length > 0 && (
                        <>
                          <tr className="bg-morandi-muted/10 border-t border-dashed border-morandi-muted/30">
                            <td colSpan={7} className="px-3 py-1.5 text-xs text-morandi-muted">
                              <div className="flex items-center gap-1">
                                <EyeOff size={12} />
                                <span>已隱藏的項目</span>
                              </div>
                            </td>
                          </tr>
                          {hiddenItems.map((trackItem, idx) => renderItem(trackItem, idx, true))}
                        </>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 底部說明 */}
        {hasUnconfirmedChanges && (
          <div className="flex items-center gap-4 text-xs text-morandi-secondary px-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-morandi-red/20 rounded border border-morandi-red/50" />
              <span className="text-morandi-red">取消</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-amber-100 rounded border border-amber-300" />
              <span className="text-amber-700">待作業</span>
            </div>
          </div>
        )}
      </div>

      {/* 手動新增需求 Dialog */}
      <AddManualRequestDialog
        isOpen={addManualDialogOpen}
        onClose={() => setAddManualDialogOpen(false)}
        tourId={tourId}
        proposalPackageId={proposalPackageId}
        tourCode={tour?.code || pkg?.version_name || ''}
        tourName={tour?.name || pkg?.version_name || ''}
        startDate={startDate}
        defaultCategory={addManualCategory}
        onSuccess={() => loadData(false)}
      />
    </>
  )
}
