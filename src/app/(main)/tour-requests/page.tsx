'use client'

/**
 * 需求管理看板頁面
 * 按團分組顯示需求單，一目了然掌握專案進度
 */

import React, { useState, useMemo, useCallback } from 'react'
import {
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  Plane,
  Hotel,
  Car,
  Utensils,
  Ticket,
  User,
  Map as MapIcon,
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
} from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StatusCell, BadgeCell } from '@/components/table-cells'
import { useTourRequests } from '@/stores/tour-request-store'
import { logger } from '@/lib/utils/logger'
import type { Database } from '@/lib/supabase/types'
import { TourRequestDialog } from './components'
import { TourRequestDetailDialog } from './components/TourRequestDetailDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

type TourRequest = Database['public']['Tables']['tour_requests']['Row']

// 類別圖示對應
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  flight: Plane,
  hotel: Hotel,
  transport: Car,
  restaurant: Utensils,
  ticket: Ticket,
  guide: User,
  itinerary: MapIcon,
  other: MoreHorizontal,
}

// 類別標籤
const CATEGORY_LABELS: Record<string, string> = {
  flight: '機票',
  hotel: '住宿',
  transport: '交通',
  restaurant: '餐廳',
  ticket: '門票',
  guide: '導遊',
  itinerary: '行程',
  other: '其他',
}

// 狀態圖示
const STATUS_ICONS: Record<string, string> = {
  draft: '📝',
  pending: '⏳',
  in_progress: '🔄',
  replied: '💬',
  confirmed: '✅',
  completed: '🎉',
  cancelled: '❌',
}

// 團需求分組
interface TourGroup {
  tourId: string
  tourCode: string | null
  tourName: string | null
  requests: TourRequest[]
  totalCount: number
  completedCount: number
  progressPercent: number
}

export default function TourRequestsPage() {
  const { items: tourRequests, isLoading: loading, delete: deleteRequest, fetchAll } = useTourRequests()

  // 搜尋
  const [searchQuery, setSearchQuery] = useState('')

  // 展開狀態
  const [expandedTours, setExpandedTours] = useState<Set<string>>(new Set())

  // Dialog 狀態
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<TourRequest | null>(null)
  const [selectedTourIdForCreate, setSelectedTourIdForCreate] = useState<string | null>(null)

  // 按團分組
  const tourGroups = useMemo((): TourGroup[] => {
    const groupMap = new Map<string, TourGroup>()

    tourRequests.forEach((req) => {
      const tourId = req.tour_id
      if (!groupMap.has(tourId)) {
        groupMap.set(tourId, {
          tourId,
          tourCode: req.tour_code,
          tourName: req.tour_name,
          requests: [],
          totalCount: 0,
          completedCount: 0,
          progressPercent: 0,
        })
      }

      const group = groupMap.get(tourId)!
      group.requests.push(req)
      group.totalCount++
      if (req.status === 'completed' || req.status === 'confirmed') {
        group.completedCount++
      }
    })

    // 計算進度百分比
    groupMap.forEach((group) => {
      group.progressPercent = group.totalCount > 0
        ? Math.round((group.completedCount / group.totalCount) * 100)
        : 0
    })

    // 轉換為陣列並排序（按團號降序）
    return Array.from(groupMap.values()).sort((a, b) => {
      const codeA = a.tourCode || ''
      const codeB = b.tourCode || ''
      return codeB.localeCompare(codeA)
    })
  }, [tourRequests])

  // 過濾搜尋結果
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return tourGroups

    const query = searchQuery.toLowerCase()
    return tourGroups
      .map((group) => ({
        ...group,
        requests: group.requests.filter(
          (req) =>
            req.code.toLowerCase().includes(query) ||
            req.title.toLowerCase().includes(query) ||
            group.tourCode?.toLowerCase().includes(query) ||
            group.tourName?.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.requests.length > 0)
  }, [tourGroups, searchQuery])

  // 展開/收起團
  const toggleTour = useCallback((tourId: string) => {
    setExpandedTours((prev) => {
      const next = new Set(prev)
      if (next.has(tourId)) {
        next.delete(tourId)
      } else {
        next.add(tourId)
      }
      return next
    })
  }, [])

  // 全部展開/收起
  const toggleAll = useCallback(() => {
    if (expandedTours.size === filteredGroups.length) {
      setExpandedTours(new Set())
    } else {
      setExpandedTours(new Set(filteredGroups.map((g) => g.tourId)))
    }
  }, [expandedTours.size, filteredGroups])

  // 點擊需求項目
  const handleRequestClick = useCallback((request: TourRequest) => {
    setSelectedRequest(request)
    setShowDetailDialog(true)
  }, [])

  // 編輯需求
  const handleEdit = useCallback((request: TourRequest, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedRequest(request)
    setShowCreateDialog(true)
  }, [])

  // 刪除需求
  const handleDelete = useCallback(async (request: TourRequest, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm(`確定要刪除需求「${request.title}」嗎？`)) {
      try {
        await deleteRequest(request.id)
        logger.log('需求單已刪除')
      } catch (error) {
        logger.error('刪除失敗:', error)
      }
    }
  }, [deleteRequest])

  // 新增需求（指定團）
  const handleAddToTour = useCallback((tourId: string) => {
    setSelectedTourIdForCreate(tourId)
    setSelectedRequest(null)
    setShowCreateDialog(true)
  }, [])

  // 新增需求（通用）
  const handleAdd = useCallback(() => {
    setSelectedTourIdForCreate(null)
    setSelectedRequest(null)
    setShowCreateDialog(true)
  }, [])

  // 進度條顏色
  const getProgressColor = (percent: number) => {
    if (percent >= 80) return 'bg-morandi-green'
    if (percent >= 50) return 'bg-morandi-gold'
    if (percent >= 20) return 'bg-orange-400'
    return 'bg-morandi-red'
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <ResponsiveHeader
        title="需求管理"
        icon={ClipboardList}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '需求管理', href: '/tour-requests' },
        ]}
        actions={
          <Button
            onClick={handleAdd}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
          >
            <Plus size={16} />
            新增需求
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-border flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-morandi-secondary" size={16} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋團號、需求名稱..."
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={toggleAll}>
          {expandedTours.size === filteredGroups.length ? '全部收起' : '全部展開'}
        </Button>
        <div className="text-sm text-morandi-secondary">
          共 {tourGroups.length} 個專案，{tourRequests.length} 個需求
        </div>
      </div>

      {/* 看板內容 */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-morandi-secondary">
            載入中...
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-morandi-secondary">
            <ClipboardList size={48} className="mb-4 opacity-50" />
            <p>尚無需求單</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map((group) => {
              const isExpanded = expandedTours.has(group.tourId)

              return (
                <div
                  key={group.tourId}
                  className="bg-card border border-border rounded-lg overflow-hidden"
                >
                  {/* 團標題列 */}
                  <div
                    className="flex items-center gap-4 px-4 py-3 bg-morandi-container/40 cursor-pointer hover:bg-morandi-container/60 transition-colors"
                    onClick={() => toggleTour(group.tourId)}
                  >
                    {/* 展開/收起箭頭 */}
                    <div className="text-morandi-secondary">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>

                    {/* 團資訊 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-morandi-primary">
                          {group.tourCode || '未指定團號'}
                        </span>
                        {group.tourName && (
                          <span className="text-morandi-secondary truncate">
                            - {group.tourName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 進度統計 */}
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-morandi-secondary">
                        {group.completedCount}/{group.totalCount}
                      </div>
                      <div className="w-24 h-2 bg-morandi-container rounded-full overflow-hidden">
                        <div
                          className={cn('h-full transition-all', getProgressColor(group.progressPercent))}
                          style={{ width: `${group.progressPercent}%` }}
                        />
                      </div>
                      <div className="w-12 text-right text-sm font-medium text-morandi-primary">
                        {group.progressPercent}%
                      </div>

                      {/* 新增需求按鈕 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddToTour(group.tourId)
                        }}
                        className="text-morandi-gold hover:text-morandi-gold-hover"
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>

                  {/* 需求列表 */}
                  {isExpanded && (
                    <div className="divide-y divide-border">
                      {group.requests.map((request) => {
                        const CategoryIcon = CATEGORY_ICONS[request.category] || MoreHorizontal

                        return (
                          <div
                            key={request.id}
                            className="flex items-center gap-4 px-4 py-3 hover:bg-morandi-container/20 cursor-pointer transition-colors"
                            onClick={() => handleRequestClick(request)}
                          >
                            {/* 類別圖示 */}
                            <div className="w-8 h-8 rounded-full bg-morandi-container flex items-center justify-center text-morandi-secondary">
                              <CategoryIcon size={16} />
                            </div>

                            {/* 需求資訊 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-morandi-primary truncate">
                                  {request.title}
                                </span>
                                <BadgeCell
                                  text={CATEGORY_LABELS[request.category] || request.category}
                                  variant="info"
                                />
                              </div>
                              <div className="text-xs text-morandi-secondary mt-0.5">
                                {request.code}
                                {request.service_date && ` · ${request.service_date}`}
                              </div>
                            </div>

                            {/* 狀態 */}
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {STATUS_ICONS[request.status || 'pending']}
                              </span>
                              <StatusCell
                                type="todo"
                                status={request.status || 'pending'}
                              />
                            </div>

                            {/* 操作選單 */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  handleRequestClick(request)
                                }}>
                                  <Eye size={14} className="mr-2" />
                                  檢視
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => handleEdit(request, e)}>
                                  <Edit2 size={14} className="mr-2" />
                                  編輯
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => handleDelete(request, e)}
                                  className="text-morandi-red"
                                >
                                  <Trash2 size={14} className="mr-2" />
                                  刪除
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 新增/編輯 Dialog */}
      <TourRequestDialog
        isOpen={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false)
          setSelectedTourIdForCreate(null)
        }}
        request={selectedRequest}
        defaultTourId={selectedTourIdForCreate}
      />

      {/* 詳情 Dialog */}
      <TourRequestDetailDialog
        isOpen={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        request={selectedRequest}
        onEdit={() => {
          setShowDetailDialog(false)
          setShowCreateDialog(true)
        }}
      />
    </div>
  )
}
