'use client'

/**
 * TourRequests - 顯示特定團的需求列表
 * 用於 TourDetailDialog 的需求 Tab
 */

import { useState, useMemo, useCallback } from 'react'
import {
  Plus,
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
  ClipboardList,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusCell, BadgeCell } from '@/components/table-cells'
import { useTourRequests } from '@/stores/tour-request-store'
import { logger } from '@/lib/utils/logger'
import type { Database } from '@/lib/supabase/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TourRequestDialog, TourRequestDetailDialog } from '@/app/(main)/tour-requests/components'

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

interface TourRequestsProps {
  tourId: string
}

export function TourRequests({ tourId }: TourRequestsProps) {
  const { items: allRequests, isLoading: loading, delete: deleteRequest } = useTourRequests()

  // Dialog 狀態
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<TourRequest | null>(null)

  // 過濾當前團的需求
  const tourRequests = useMemo(() => {
    return allRequests.filter((req) => req.tour_id === tourId)
  }, [allRequests, tourId])

  // 計算統計
  const stats = useMemo(() => {
    const total = tourRequests.length
    const completed = tourRequests.filter(
      (r) => r.status === 'completed' || r.status === 'confirmed'
    ).length
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, percent }
  }, [tourRequests])

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

  // 新增需求
  const handleAdd = useCallback(() => {
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
    <div className="flex flex-col h-full border border-border rounded-lg overflow-hidden bg-card">
      {/* 區塊標題行 */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-morandi-container/50 border-b border-border/60">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-morandi-primary">需求管理</span>
          <span className="text-sm text-morandi-secondary">({tourRequests.length} 筆)</span>
          <div className="flex items-center gap-2 text-xs text-morandi-secondary">
            <span>進度 {stats.completed}/{stats.total}</span>
            <div className="w-16 h-1.5 bg-morandi-container rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${getProgressColor(stats.percent)}`}
                style={{ width: `${stats.percent}%` }}
              />
            </div>
            <span>{stats.percent}%</span>
          </div>
        </div>
        <Button
          onClick={handleAdd}
          size="sm"
          className="bg-morandi-gold hover:bg-morandi-gold-hover text-white h-7 text-xs"
        >
          <Plus size={12} className="mr-1" />
          新增需求
        </Button>
      </div>

      {/* 需求列表 */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-morandi-secondary">
            載入中...
          </div>
        ) : tourRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-morandi-secondary">
            <ClipboardList size={32} className="mb-2 opacity-50" />
            <p>尚無需求單</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tourRequests.map((request) => {
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

      {/* 新增/編輯 Dialog */}
      <TourRequestDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        request={selectedRequest}
        defaultTourId={tourId}
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
