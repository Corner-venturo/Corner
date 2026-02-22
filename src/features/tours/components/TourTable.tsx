'use client'

import React from 'react'
import { MapPin } from 'lucide-react'
import { Tour } from '@/stores/types'
import { EnhancedTable } from '@/components/ui/enhanced-table'
import { TourMobileCard } from './TourMobileCard'
import { useTourTableColumns } from './TourTableColumns'
import { TOUR_TABLE } from '../constants'

interface TourTableProps {
  tours: Tour[]
  loading: boolean
  onSort: (field: string, order: 'asc' | 'desc') => void
  onRowClick: (row: unknown) => void
  renderActions: (row: unknown) => React.ReactNode
  getStatusColor?: (status: string) => string
  ordersByTourId?: Map<string, { sales_person: string | null; assistant: string | null }>
}

export const TourTable: React.FC<TourTableProps> = ({
  tours,
  loading,
  onSort,
  onRowClick,
  renderActions,
  getStatusColor,
  ordersByTourId,
}) => {
  const columns = useTourTableColumns({ ordersByTourId })

  return (
    <>
      {/* 桌面模式：表格 */}
      <div className="hidden md:block h-full">
        <EnhancedTable
          columns={columns}
          data={tours}
          loading={loading}
          onSort={onSort}
          actions={renderActions}
          actionsWidth="50px"
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
            <p className="text-morandi-secondary">{TOUR_TABLE.empty_title}</p>
            <p className="text-sm text-morandi-secondary/70 mt-1">{TOUR_TABLE.empty_subtitle}</p>
          </div>
        ) : (
          tours.map(tour => (
            <TourMobileCard
              key={tour.id}
              tour={tour}
              onClick={() => onRowClick(tour)}
              getStatusColor={getStatusColor || (() => '')}

            />
          ))
        )}
      </div>
    </>
  )
}
