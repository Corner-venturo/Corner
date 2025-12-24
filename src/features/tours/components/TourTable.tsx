'use client'

import React, { useCallback } from 'react'
import { MapPin } from 'lucide-react'
import { Tour, Order } from '@/stores/types'
import { EnhancedTable } from '@/components/ui/enhanced-table'
import { TourMobileCard } from './TourMobileCard'
import { TourExpandedView } from './TourExpandedView'
import { useTourTableColumns } from './TourTableColumns'

interface TourTableProps {
  tours: Tour[]
  loading: boolean
  orders: Order[]
  expandedRows: string[]
  activeTabs: Record<string, string>
  tourExtraFields: Record<string, Record<string, string>>
  triggerAddOnAdd: boolean
  triggerPaymentAdd: boolean
  triggerCostAdd: boolean
  onSort: (field: string, order: 'asc' | 'desc') => void
  onExpand: (id: string) => void
  onRowClick: (row: unknown) => void
  onActiveTabChange: (tourId: string, tab: string) => void
  onTourExtraFieldsChange: (fields: Record<string, Record<string, string>>) => void
  onTriggerAddOnAdd: (value: boolean) => void
  onTriggerPaymentAdd: (value: boolean) => void
  onTriggerCostAdd: (value: boolean) => void
  openDialog: (type: string, data?: Tour) => void
  renderActions: (row: unknown) => React.ReactNode
  getStatusColor: (status: string) => string
}

export const TourTable: React.FC<TourTableProps> = ({
  tours,
  loading,
  orders,
  expandedRows,
  activeTabs,
  tourExtraFields,
  triggerAddOnAdd,
  triggerPaymentAdd,
  triggerCostAdd,
  onSort,
  onExpand,
  onRowClick,
  onActiveTabChange,
  onTourExtraFieldsChange,
  onTriggerAddOnAdd,
  onTriggerPaymentAdd,
  onTriggerCostAdd,
  openDialog,
  renderActions,
  getStatusColor,
}) => {
  const columns = useTourTableColumns({ orders, getStatusColor })

  const renderExpanded = useCallback(
    (row: unknown) => {
      const tour = row as Tour
      return (
        <TourExpandedView
          tour={tour}
          orders={orders}
          activeTabs={activeTabs}
          setActiveTab={onActiveTabChange}
          openDialog={openDialog}
          tourExtraFields={tourExtraFields}
          setTourExtraFields={onTourExtraFieldsChange}
          triggerAddOnAdd={triggerAddOnAdd}
          setTriggerAddOnAdd={onTriggerAddOnAdd}
          triggerPaymentAdd={triggerPaymentAdd}
          setTriggerPaymentAdd={onTriggerPaymentAdd}
          triggerCostAdd={triggerCostAdd}
          setTriggerCostAdd={onTriggerCostAdd}
        />
      )
    },
    [
      orders,
      activeTabs,
      onActiveTabChange,
      openDialog,
      tourExtraFields,
      onTourExtraFieldsChange,
      triggerAddOnAdd,
      onTriggerAddOnAdd,
      triggerPaymentAdd,
      onTriggerPaymentAdd,
      triggerCostAdd,
      onTriggerCostAdd,
    ]
  )

  return (
    <>
      {/* 桌面模式：表格 */}
      <div className="hidden md:block h-full">
        <EnhancedTable
          columns={columns}
          data={tours}
          loading={loading}
          onSort={onSort}
          expandable={{
            expanded: expandedRows,
            onExpand,
            renderExpanded,
          }}
          actions={renderActions}
          onRowClick={onRowClick}
          bordered={true}
        />
      </div>

      {/* 手機模式：卡片列表 */}
      <div className="md:hidden space-y-3 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-morandi-gold"></div>
          </div>
        ) : tours.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin size={48} className="text-morandi-secondary/30 mb-4" />
            <p className="text-morandi-secondary">沒有找到旅遊團</p>
            <p className="text-sm text-morandi-secondary/70 mt-1">請調整篩選條件或新增旅遊團</p>
          </div>
        ) : (
          tours.map(tour => (
            <TourMobileCard
              key={tour.id}
              tour={tour}
              onClick={() => onRowClick(tour)}
              getStatusColor={getStatusColor}
            />
          ))
        )}
      </div>
    </>
  )
}
