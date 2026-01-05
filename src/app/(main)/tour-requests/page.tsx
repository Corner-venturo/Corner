'use client'

/**
 * 需求確認單頁面
 * 顯示旅遊團列表，點擊後開啟團確單管理介面
 */

import React, { useState, useCallback, useMemo } from 'react'
import {
  ClipboardList,
  MapPin,
  Calendar,
  Users,
} from 'lucide-react'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { StatusCell, DateCell, DateRangeCell, NumberCell } from '@/components/table-cells'
import { useTours } from '@/hooks/cloud-hooks'
import type { Tour } from '@/stores/types'
import type { TableColumn } from '@/components/ui/enhanced-table'
import { TourConfirmationDialog } from '@/features/tours/components/TourConfirmationDialog'

// 狀態 Tab 配置
const STATUS_TABS = [
  { value: 'all', label: '全部' },
  { value: 'planning', label: '規劃中' },
  { value: 'confirmed', label: '已成團' },
  { value: 'in_progress', label: '出團中' },
  { value: 'completed', label: '已結團' },
]

export default function TourRequestsPage() {
  const { items: tours, isLoading: loading } = useTours()

  // Dialog 狀態
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null)
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)

  // 點擊旅遊團
  const handleRowClick = useCallback((tour: Tour) => {
    setSelectedTour(tour)
    setShowConfirmationDialog(true)
  }, [])

  // 關閉 Dialog
  const handleCloseDialog = useCallback(() => {
    setShowConfirmationDialog(false)
    setSelectedTour(null)
  }, [])

  // 過濾已取消的團（只顯示進行中的團）
  const activeTours = useMemo(() => {
    return tours.filter(tour => tour.status !== 'cancelled')
  }, [tours])

  // 表格欄位定義
  const columns: TableColumn<Tour>[] = [
    {
      key: 'code',
      label: '團號',
      width: '140px',
      render: (_, row) => (
        <span className="font-mono text-sm font-medium text-morandi-primary">{row.code}</span>
      ),
    },
    {
      key: 'name',
      label: '團名',
      width: '200px',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-morandi-secondary flex-shrink-0" />
          <span className="font-medium text-morandi-primary truncate">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'date_range',
      label: '出團日期',
      width: '180px',
      render: (_, row) => (
        <DateRangeCell
          start={row.departure_date}
          end={row.return_date}
          showDuration
        />
      ),
    },
    {
      key: 'pax',
      label: '人數',
      width: '80px',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Users size={14} className="text-morandi-secondary" />
          <NumberCell value={row.current_participants || 0} />
        </div>
      ),
    },
    {
      key: 'status',
      label: '狀態',
      width: '100px',
      render: (_, row) => (
        <StatusCell type="tour" status={row.status || 'planning'} />
      ),
    },
  ]

  return (
    <>
      <ListPageLayout
        title="需求確認單"
        icon={ClipboardList}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '需求確認單', href: '/tour-requests' },
        ]}
        data={activeTours}
        loading={loading}
        columns={columns}
        onRowClick={handleRowClick}
        searchable
        searchPlaceholder="搜尋團號、團名..."
        searchFields={['code', 'name', 'location']}
        statusTabs={STATUS_TABS}
        statusField="status"
        defaultStatusTab="all"
      />

      {/* 團確單 Dialog */}
      <TourConfirmationDialog
        open={showConfirmationDialog}
        tour={selectedTour}
        onClose={handleCloseDialog}
      />
    </>
  )
}
