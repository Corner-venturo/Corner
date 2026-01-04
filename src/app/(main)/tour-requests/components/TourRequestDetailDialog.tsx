'use client'

/**
 * TourRequestDetailDialog - 需求單詳情對話框
 * 顯示需求單完整資訊，支援編輯按鈕
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { StatusCell, BadgeCell, DateCell, CurrencyCell } from '@/components/table-cells'
import {
  Plane,
  Hotel,
  Car,
  Utensils,
  Ticket,
  User,
  Map as MapIcon,
  MoreHorizontal,
  Edit2,
  Calendar,
  DollarSign,
  Users,
  Building2,
  FileText,
  X,
} from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

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

// 優先級標籤
const PRIORITY_LABELS: Record<string, string> = {
  low: '低',
  normal: '一般',
  high: '高',
  urgent: '緊急',
}

// 優先級樣式
const PRIORITY_VARIANTS: Record<string, 'default' | 'info' | 'warning' | 'danger'> = {
  low: 'default',
  normal: 'info',
  high: 'warning',
  urgent: 'danger',
}

// 處理方類型標籤
const HANDLER_TYPE_LABELS: Record<string, string> = {
  internal: '內部處理',
  external: '外部供應商',
}

interface TourRequestDetailDialogProps {
  isOpen: boolean
  onClose: () => void
  request: TourRequest | null
  onEdit: () => void
}

export function TourRequestDetailDialog({
  isOpen,
  onClose,
  request,
  onEdit,
}: TourRequestDetailDialogProps) {
  if (!request) return null

  const CategoryIcon = CATEGORY_ICONS[request.category] || MoreHorizontal

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-morandi-container flex items-center justify-center">
              <CategoryIcon size={20} className="text-morandi-primary" />
            </div>
            <div>
              <div className="text-lg font-semibold text-morandi-primary">
                {request.title}
              </div>
              <div className="text-sm font-mono text-morandi-secondary">
                {request.code}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 狀態與分類 */}
          <div className="flex items-center gap-4 flex-wrap">
            <StatusCell type="tour_request" status={request.status || 'pending'} />
            <BadgeCell
              text={CATEGORY_LABELS[request.category] || request.category}
              variant="info"
            />
            <BadgeCell
              text={PRIORITY_LABELS[request.priority || 'normal']}
              variant={PRIORITY_VARIANTS[request.priority || 'normal']}
            />
            <BadgeCell
              text={HANDLER_TYPE_LABELS[request.handler_type || 'internal']}
              variant="default"
            />
          </div>

          {/* 基本資訊 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 團號 */}
            {request.tour_code && (
              <div className="flex items-start gap-3">
                <FileText size={18} className="text-morandi-secondary mt-0.5" />
                <div>
                  <div className="text-xs text-morandi-secondary">所屬團</div>
                  <div className="font-mono text-morandi-primary">
                    {request.tour_code}
                    {request.tour_name && (
                      <span className="text-morandi-secondary ml-2">
                        {request.tour_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 數量 */}
            <div className="flex items-start gap-3">
              <Users size={18} className="text-morandi-secondary mt-0.5" />
              <div>
                <div className="text-xs text-morandi-secondary">數量</div>
                <div className="text-morandi-primary">{request.quantity || 1}</div>
              </div>
            </div>

            {/* 服務日期 */}
            {request.service_date && (
              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-morandi-secondary mt-0.5" />
                <div>
                  <div className="text-xs text-morandi-secondary">服務日期</div>
                  <div className="text-morandi-primary">
                    <DateCell date={request.service_date} />
                    {request.service_date_end && (
                      <>
                        <span className="mx-1">~</span>
                        <DateCell date={request.service_date_end} />
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 預估費用 */}
            {request.estimated_cost && (
              <div className="flex items-start gap-3">
                <DollarSign size={18} className="text-morandi-secondary mt-0.5" />
                <div>
                  <div className="text-xs text-morandi-secondary">預估費用</div>
                  <CurrencyCell amount={request.estimated_cost} />
                </div>
              </div>
            )}

            {/* 負責人 / 供應商 */}
            {request.handler_type === 'internal' && request.assignee_name && (
              <div className="flex items-start gap-3">
                <User size={18} className="text-morandi-secondary mt-0.5" />
                <div>
                  <div className="text-xs text-morandi-secondary">負責人</div>
                  <div className="text-morandi-primary">{request.assignee_name}</div>
                </div>
              </div>
            )}

            {request.handler_type === 'external' && request.supplier_name && (
              <div className="flex items-start gap-3">
                <Building2 size={18} className="text-morandi-secondary mt-0.5" />
                <div>
                  <div className="text-xs text-morandi-secondary">供應商</div>
                  <div className="text-morandi-primary">{request.supplier_name}</div>
                </div>
              </div>
            )}
          </div>

          {/* 描述 */}
          {request.description && (
            <div className="border-t border-border pt-4">
              <div className="text-sm font-medium text-morandi-primary mb-2">
                詳細描述
              </div>
              <div className="text-morandi-secondary whitespace-pre-wrap">
                {request.description}
              </div>
            </div>
          )}

          {/* 時間戳記 */}
          <div className="border-t border-border pt-4 text-xs text-morandi-secondary">
            <div className="flex justify-between">
              <span className="flex items-center gap-1">建立時間：<DateCell date={request.created_at} format="time" showIcon={false} fallback="-" /></span>
              <span className="flex items-center gap-1">更新時間：<DateCell date={request.updated_at} format="time" showIcon={false} fallback="-" /></span>
            </div>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="gap-2">
            <X size={16} />
            關閉
          </Button>
          <Button
            onClick={onEdit}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
          >
            <Edit2 size={16} />
            編輯
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
