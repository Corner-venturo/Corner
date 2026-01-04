'use client'

/**
 * 需求管理頁面
 * 使用標準 ListPageLayout 佈局
 */

import React, { useState, useCallback } from 'react'
import {
  ClipboardList,
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
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { StatusCell, DateCell, ActionCell, BadgeCell } from '@/components/table-cells'
import { useTourRequests } from '@/stores/tour-request-store'
import { logger } from '@/lib/utils/logger'
import type { Database } from '@/lib/supabase/types'
import type { TableColumn } from '@/components/ui/enhanced-table'
import { TourRequestDialog } from './components'
import { TourRequestDetailDialog } from './components/TourRequestDetailDialog'

type TourRequest = Database['public']['Tables']['tour_requests']['Row']

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

// 類別 Badge 顏色
const CATEGORY_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  flight: 'info',
  hotel: 'success',
  transport: 'warning',
  restaurant: 'danger',
  ticket: 'info',
  guide: 'default',
  itinerary: 'success',
  other: 'default',
}

// 優先級標籤
const PRIORITY_LABELS: Record<string, string> = {
  urgent: '緊急',
  high: '高',
  normal: '一般',
  low: '低',
}

// 優先級 Badge 顏色
const PRIORITY_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  urgent: 'danger',
  high: 'warning',
  normal: 'default',
  low: 'info',
}

// 狀態 Tab 配置（與 status-config.ts tour_request 保持一致）
const STATUS_TABS = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待處理' },
  { value: 'in_progress', label: '處理中' },
  { value: 'replied', label: '已回復' },
  { value: 'confirmed', label: '已確認' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

export default function TourRequestsPage() {
  const { items: tourRequests, isLoading: loading, delete: deleteRequest } = useTourRequests()

  // Dialog 狀態
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<TourRequest | null>(null)

  // 點擊需求項目
  const handleRowClick = useCallback((request: TourRequest) => {
    setSelectedRequest(request)
    setShowDetailDialog(true)
  }, [])

  // 編輯需求
  const handleEdit = useCallback((request: TourRequest) => {
    setSelectedRequest(request)
    setShowCreateDialog(true)
  }, [])

  // 刪除需求
  const handleDelete = useCallback(async (request: TourRequest) => {
    if (window.confirm(`確定要刪除需求「${request.title}」嗎？`)) {
      try {
        await deleteRequest(request.id)
        logger.log('需求單已刪除')
      } catch (error) {
        logger.error('刪除失敗:', error)
      }
    }
  }, [deleteRequest])



  // 表格欄位定義
  const columns: TableColumn<TourRequest>[] = [
    {
      key: 'code',
      label: '編號',
      width: '140px',
      render: (_, row) => (
        <span className="font-mono text-sm text-morandi-primary">{row.code}</span>
      ),
    },
    {
      key: 'title',
      label: '需求名稱',
      width: '200px',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {(() => {
            const Icon = CATEGORY_ICONS[row.category] || MoreHorizontal
            return <Icon size={16} className="text-morandi-secondary flex-shrink-0" />
          })()}
          <span className="font-medium text-morandi-primary truncate">{row.title}</span>
        </div>
      ),
    },
    {
      key: 'category',
      label: '類別',
      width: '80px',
      render: (_, row) => (
        <BadgeCell
          text={CATEGORY_LABELS[row.category] || row.category}
          variant={CATEGORY_VARIANTS[row.category] || 'default'}
        />
      ),
    },
    {
      key: 'tour_code',
      label: '團號',
      width: '130px',
      render: (_, row) => (
        <span className="font-mono text-sm text-morandi-primary">
          {row.tour_code || '-'}
        </span>
      ),
    },
    {
      key: 'service_date',
      label: '服務日期',
      width: '120px',
      render: (_, row) => <DateCell date={row.service_date} showIcon={false} />,
    },
    {
      key: 'priority',
      label: '優先級',
      width: '80px',
      render: (_, row) => (
        <BadgeCell
          text={PRIORITY_LABELS[row.priority || 'normal'] || '一般'}
          variant={PRIORITY_VARIANTS[row.priority || 'normal'] || 'default'}
        />
      ),
    },
    {
      key: 'status',
      label: '狀態',
      width: '100px',
      render: (_, row) => (
        <StatusCell type="tour_request" status={row.status || 'pending'} />
      ),
    },
    {
      key: 'handler_type',
      label: '處理方式',
      width: '100px',
      render: (_, row) => (
        <span className="text-sm text-morandi-secondary">
          {row.handler_type === 'internal' ? '內部處理' : '外部供應商'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '100px',
      render: (_, row) => (
        <ActionCell
          actions={[
            {
              icon: Eye,
              label: '檢視',
              onClick: () => handleRowClick(row),
            },
            {
              icon: Edit2,
              label: '編輯',
              onClick: () => handleEdit(row),
            },
            {
              icon: Trash2,
              label: '刪除',
              onClick: () => handleDelete(row),
              variant: 'danger',
            },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <ListPageLayout
        title="需求管理"
        icon={ClipboardList}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '需求管理', href: '/tour-requests' },
        ]}
        data={tourRequests}
        loading={loading}
        columns={columns}
        onRowClick={handleRowClick}
        searchable
        searchPlaceholder="搜尋編號、需求名稱、團號..."
        searchFields={['code', 'title', 'tour_code', 'tour_name']}
        statusTabs={STATUS_TABS}
        statusField="status"
        defaultStatusTab="all"
      />

      {/* 新增/編輯 Dialog */}
      <TourRequestDialog
        isOpen={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false)
          setSelectedRequest(null)
        }}
        request={selectedRequest}
        defaultTourId={null}
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
    </>
  )
}
