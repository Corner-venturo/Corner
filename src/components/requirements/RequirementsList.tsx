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
 * - 手動新增需求
 * - 產生團確單
 */

import { useEffect, useState, useMemo, useCallback } from 'react'
import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  FileText,
  Plus,
  EyeOff,
  Eye,
  ChevronDown,
  ChevronRight,
  ClipboardList,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores'
import { AddManualRequestDialog } from '@/features/proposals/components/AddManualRequestDialog'
import type { Tour } from '@/stores/types'
import type { CostCategory } from '@/features/quotes/types'
import type { ProposalPackage } from '@/types/proposal.types'
import { useToast } from '@/components/ui/use-toast'
import { logger } from '@/lib/utils/logger'
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

// FlightInfo 已移至 @/types/flight.types.ts

// 分類配置（統一使用 accommodation/meal）
// quoteCategoryId 對應報價單的 category.id（複數形式）
type CategoryKey = 'transport' | 'accommodation' | 'meal' | 'activity' | 'other'
const CATEGORIES: { key: CategoryKey; label: string; quoteCategoryId: string }[] = [
  { key: 'transport', label: '交通', quoteCategoryId: 'transport' },
  { key: 'accommodation', label: '住宿', quoteCategoryId: 'accommodation' },
  { key: 'meal', label: '餐食', quoteCategoryId: 'meals' },
  { key: 'activity', label: '活動', quoteCategoryId: 'activities' },
  { key: 'other', label: '其他', quoteCategoryId: 'others' },
]

// 安全地取得 CategoryKey（防止未知類別導致錯誤）
function safeGetCategoryKey(category: string): CategoryKey {
  const validKeys: CategoryKey[] = ['transport', 'accommodation', 'meal', 'activity', 'other']
  return validKeys.includes(category as CategoryKey) ? (category as CategoryKey) : 'other'
}

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
  const [generatingSheet, setGeneratingSheet] = useState(false)

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
      // 交通：從報價單的 transport 和 group-transport 讀取
      if (cat.key === 'transport') {
        // 讀取 transport category（機票等）
        const transportCategory = quoteCategories.find(c => c.id === 'transport')
        if (transportCategory?.items) {
          for (const item of transportCategory.items) {
            if (!item.name) continue
            // 排除身份票種（成人/兒童/嬰兒），這些不需要建立需求單
            if (['成人', '兒童', '嬰兒'].includes(item.name)) continue

            const supplierName = item.name
            const title = item.name
            const key = `transport-${supplierName}-${title}-`
            items.push({
              category: 'transport',
              supplierName,
              title,
              serviceDate: null,
              quantity: item.quantity || 1,
              key,
              resourceType: item.resource_type,
              resourceId: item.resource_id,
              quotedPrice: item.unit_price,
            })
          }
        }

        // 讀取 group-transport category（遊覽車等）
        const groupTransportCategory = quoteCategories.find(c => c.id === 'group-transport')
        if (groupTransportCategory?.items) {
          for (const item of groupTransportCategory.items) {
            if (!item.name) continue
            // 排除「領隊分攤」，這不是需求項目
            if (item.name === '領隊分攤') continue

            const supplierName = item.name
            const title = item.name
            const key = `transport-${supplierName}-${title}-`
            items.push({
              category: 'transport',
              supplierName,
              title,
              serviceDate: null,
              quantity: item.quantity || 1,
              key,
              resourceType: item.resource_type,
              resourceId: item.resource_id,
              quotedPrice: item.unit_price,
            })
          }
        }
        continue
      }

      const quoteCategory = quoteCategories.find(c => c.id === cat.quoteCategoryId)
      if (!quoteCategory?.items) continue

      for (const item of quoteCategory.items) {
        if (!item.name) continue
        // 跳過自理項目（不需要產生需求單）
        // 檢查 is_self_arranged 標記，或名稱包含「自理」
        if (item.is_self_arranged || item.name.includes('自理')) continue

        let supplierName = ''
        let title = item.name
        let serviceDate: string | null = null

        if (cat.key === 'accommodation') {
          supplierName = item.name
          title = item.name
          if (item.day) serviceDate = calculateDate(item.day)
        } else if (cat.key === 'meal') {
          const match = item.name.match(/Day\s*(\d+)\s*(早餐|午餐|晚餐)\s*(?:[：:]|\s*-\s*)\s*(.+)/)
          if (match) {
            const dayNum = parseInt(match[1])
            supplierName = match[3].trim()
            title = match[2]
            serviceDate = calculateDate(dayNum)
          }
        } else if (cat.key === 'activity') {
          // 活動：活動名稱 = 供應商名稱
          supplierName = item.name
          title = item.name
          if (item.day) serviceDate = calculateDate(item.day)
        } else if (cat.key === 'other') {
          // 其他：項目名稱 = 供應商名稱
          supplierName = item.name
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
  }, [quoteCategories, calculateDate])

  // 按分類整理項目
  const itemsByCategory = useMemo(() => {
    const result: Record<CategoryKey, QuoteItem[]> = {
      transport: [], accommodation: [], meal: [], activity: [], other: [],
    }

    for (const item of quoteItems) {
      const cat = safeGetCategoryKey(item.category)
      result[cat].push(item)
    }

    // 按日期排序
    for (const cat of Object.keys(result) as CategoryKey[]) {
      result[cat].sort((a, b) => {
        const dateA = a.serviceDate || ''
        const dateB = b.serviceDate || ''
        return dateA.localeCompare(dateB)
      })
    }

    return result
  }, [quoteItems])

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

  // 插入團確單項目
  const insertConfirmationItems = useCallback(async (sheetId: string) => {
    if (!user || !tour) return

    const workspaceId = tour.workspace_id || user.workspace_id || ''
    const allItems: Array<{
      sheet_id: string
      category: string
      service_date: string
      supplier_name: string
      title: string
      description?: string | null
      expected_cost?: number | null
      quantity?: number | null
      booking_status: string
      sort_order: number
      workspace_id: string
      resource_type?: string | null
      resource_id?: string | null
      latitude?: number | null
      longitude?: number | null
      google_maps_url?: string | null
      notes?: string | null
    }> = []

    // 1. 航班資訊（放在最前面）
    if (outboundFlight) {
      allItems.push({
        sheet_id: sheetId,
        category: 'transport',
        service_date: tour.departure_date || '',
        supplier_name: outboundFlight.airline || '',
        title: `去程 ${outboundFlight.flightNumber || ''} ${outboundFlight.departureAirport || ''}→${outboundFlight.arrivalAirport || ''}`,
        description: outboundFlight.departureTime && outboundFlight.arrivalTime
          ? `${outboundFlight.departureAirport} ${outboundFlight.departureTime} → ${outboundFlight.arrivalAirport} ${outboundFlight.arrivalTime}`
          : null,
        booking_status: 'confirmed',
        sort_order: 0,
        workspace_id: workspaceId,
        notes: outboundFlight.duration || null,
      })
    }

    if (returnFlight) {
      allItems.push({
        sheet_id: sheetId,
        category: 'transport',
        service_date: tour.return_date || '',
        supplier_name: returnFlight.airline || '',
        title: `回程 ${returnFlight.flightNumber || ''} ${returnFlight.departureAirport || ''}→${returnFlight.arrivalAirport || ''}`,
        description: returnFlight.departureTime && returnFlight.arrivalTime
          ? `${returnFlight.departureAirport} ${returnFlight.departureTime} → ${returnFlight.arrivalAirport} ${returnFlight.arrivalTime}`
          : null,
        booking_status: 'confirmed',
        sort_order: 1,
        workspace_id: workspaceId,
        notes: returnFlight.duration || null,
      })
    }

    // 2. 從報價單項目產生（排除自理）
    const quoteItemsFiltered = quoteItems
      .filter(item => !item.title.includes('自理') && !item.supplierName.includes('自理'))

    quoteItemsFiltered.forEach((item, index) => {
      allItems.push({
        sheet_id: sheetId,
        category: item.category,
        service_date: item.serviceDate || tour.departure_date || '',
        supplier_name: item.supplierName || '',
        title: item.title,
        expected_cost: item.quotedPrice || null,
        quantity: item.quantity || 1,
        booking_status: 'pending',
        sort_order: index + 10, // 航班後面
        workspace_id: workspaceId,
        resource_type: item.resourceType || null,
        resource_id: item.resourceId || null,
        latitude: item.latitude || null,
        longitude: item.longitude || null,
        google_maps_url: item.googleMapsUrl || null,
        notes: item.notes || null,
      })
    })

    if (allItems.length > 0) {
      const { error } = await supabase
        .from('tour_confirmation_items')
        .insert(allItems)

      if (error) throw error
    }
  }, [user, tour, quoteItems, outboundFlight, returnFlight])

  // 產生團確單
  const handleGenerateConfirmationSheet = useCallback(async () => {
    if (!user || mode !== 'tour' || !tourId || !tour) {
      toast({ title: '只有旅遊團模式可以產生團確單', variant: 'destructive' })
      return
    }

    const workspaceId = tour.workspace_id || user.workspace_id
    if (!workspaceId) {
      toast({ title: '缺少 workspace 資訊', variant: 'destructive' })
      return
    }

    setGeneratingSheet(true)
    try {
      // 1. 檢查是否已有團確單
      const { data: existingSheet } = await supabase
        .from('tour_confirmation_sheets')
        .select('id')
        .eq('tour_id', tourId)
        .maybeSingle()

      if (existingSheet) {
        // 已有團確單，刪除舊的項目重新產生
        await supabase
          .from('tour_confirmation_items')
          .delete()
          .eq('sheet_id', existingSheet.id)

        // 插入新項目
        await insertConfirmationItems(existingSheet.id)
        toast({ title: '團確單已更新' })
      } else {
        // 建立新的團確單
        const { data: newSheet, error: sheetError } = await supabase
          .from('tour_confirmation_sheets')
          .insert({
            tour_id: tourId,
            tour_code: tour.code,
            tour_name: tour.name,
            departure_date: tour.departure_date,
            return_date: tour.return_date,
            workspace_id: workspaceId,
            status: 'draft',
          })
          .select()
          .single()

        if (sheetError) throw sheetError

        // 插入項目
        await insertConfirmationItems(newSheet.id)
        toast({ title: '團確單已產生' })
      }
    } catch (error) {
      logger.error('產生團確單失敗:', error)
      toast({ title: '產生團確單失敗', variant: 'destructive' })
    } finally {
      setGeneratingSheet(false)
    }
  }, [user, mode, tourId, tour, toast, insertConfirmationItems])

  // 格式化日期
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })
  }

  // 開啟需求單 Dialog
  const openRequestDialog = useCallback((category: string, supplierName: string) => {
    if (!onOpenRequestDialog) return

    const categoryItems = itemsByCategory[category as CategoryKey] || []
    const items = categoryItems
      .filter(item => item.supplierName === supplierName)
      .map(item => ({
        serviceDate: item.serviceDate,
        title: item.title,
        quantity: item.quantity,
        notes: item.notes,
      }))

    onOpenRequestDialog({
      category,
      supplierName,
      items,
      tour: tour || undefined,
      pkg: pkg || undefined,
      startDate,
    })
  }, [itemsByCategory, tour, pkg, startDate, onOpenRequestDialog])

  // 總項目數
  const totalItems = useMemo(() => {
    return quoteItems.length
  }, [quoteItems])

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
            {mode === 'tour' && quoteItems.length > 0 && (
              <Button
                size="sm"
                onClick={handleGenerateConfirmationSheet}
                disabled={generatingSheet}
                className="gap-1 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                {generatingSheet ? <Loader2 size={14} className="animate-spin" /> : <ClipboardList size={14} />}
                產生團確單
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
                  const categoryItems = itemsByCategory[cat.key]
                  if (categoryItems.length === 0) return null

                  // 輔助函數：找匹配的需求單
                  const findMatchingRequest = (item: QuoteItem) => {
                    if (item.resourceId) {
                      const byResourceId = existingRequests.find(r =>
                        r.category === cat.key && r.resource_id === item.resourceId
                      )
                      if (byResourceId) return byResourceId
                    }
                    return existingRequests.find(r =>
                      r.category === cat.key &&
                      r.supplier_name === item.supplierName &&
                      r.service_date === item.serviceDate
                    )
                  }

                  // 輔助函數：取得供應商識別 key
                  const getSupplierKey = (item: QuoteItem) => {
                    if (item.resourceId) return item.resourceId
                    if (item.supplierName === '飯店早餐') return `飯店早餐-${item.serviceDate || ''}`
                    if (item.supplierName) return item.supplierName
                    return `${item.title}-${item.serviceDate || ''}`
                  }

                  // 計算隱藏與可見項目
                  const visibleItems: QuoteItem[] = []
                  const hiddenItems: QuoteItem[] = []

                  for (const item of categoryItems) {
                    const existingRequest = findMatchingRequest(item)
                    if (existingRequest?.hidden) {
                      hiddenItems.push(item)
                    } else {
                      visibleItems.push(item)
                    }
                  }

                  const isHiddenExpanded = expandedHiddenCategories.has(cat.key)

                  const categoryTotal = visibleItems.reduce((sum, item) => {
                    const existing = findMatchingRequest(item)
                    return sum + (existing?.quoted_cost || 0)
                  }, 0)

                  // 追蹤已顯示操作按鈕的供應商
                  const renderedSuppliers = new Set<string>()

                  // 渲染單一項目
                  const renderItem = (item: QuoteItem, idx: number, isHidden: boolean) => {
                    const existingRequest = findMatchingRequest(item)
                    const supplierKey = getSupplierKey(item)
                    const isFirstRowForSupplier = !renderedSuppliers.has(supplierKey)
                    if (isFirstRowForSupplier) renderedSuppliers.add(supplierKey)

                    // 狀態配置
                    let statusLabel = '待作業'
                    let statusClass = ''
                    if (!existingRequest) {
                      const config = getStatusConfig('tour_request', 'pending')
                      statusClass = `${config.bgColor} ${config.color}`
                    } else {
                      const s = existingRequest.status || 'pending'
                      const config = getStatusConfig('tour_request', s)
                      statusLabel = config.label
                      statusClass = `${config.bgColor} ${config.color}`
                    }

                    return (
                      <tr
                        key={`${cat.key}-${isHidden ? 'hidden' : 'visible'}-${idx}`}
                        className={cn(
                          'border-t border-border/50 hover:bg-morandi-container/20',
                          isHidden && 'bg-morandi-muted/5'
                        )}
                      >
                        <td className="px-3 py-2.5">{formatDate(item.serviceDate)}</td>
                        <td className="px-3 py-2.5">{item.supplierName || '-'}</td>
                        <td className="px-3 py-2.5">
                          <div>
                            <span>{item.title}</span>
                            {item.notes && (
                              <div className="text-xs mt-0.5 text-morandi-secondary whitespace-pre-line">
                                {item.notes}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-morandi-secondary">
                          {item.quotedPrice ? `$${item.quotedPrice.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-morandi-primary">
                          {existingRequest?.quoted_cost ? `$${existingRequest.quoted_cost.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', statusClass)}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* 隱藏/恢復按鈕 */}
                            {(isHidden || isFirstRowForSupplier) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleHidden(
                                  existingRequest?.id || null,
                                  !isHidden,
                                  !existingRequest ? {
                                    category: cat.key,
                                    supplierName: item.supplierName || '',
                                    title: item.title,
                                    serviceDate: item.serviceDate,
                                    quantity: item.quantity,
                                    notes: item.notes,
                                    resourceId: item.resourceId,
                                    resourceType: cat.key === 'accommodation' ? 'hotel' : cat.key === 'meal' ? 'restaurant' : cat.key === 'activity' ? 'attraction' : undefined,
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
                            {/* 產生需求單按鈕 */}
                            {isFirstRowForSupplier && item.supplierName && onOpenRequestDialog && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openRequestDialog(cat.key, item.supplierName)}
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
                              ({visibleItems.length} 項)
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
