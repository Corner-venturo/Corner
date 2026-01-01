/**
 * TourTableColumns - Table column definitions for tours list
 */

'use client'

import { useMemo } from 'react'
import { TableColumn } from '@/components/ui/enhanced-table'
import { Tour, Order } from '@/stores/types'
import { cn } from '@/lib/utils'
import { DateCell } from '@/components/table-cells'

interface UseTourTableColumnsParams {
  orders: Order[]
  getStatusColor: (status: string) => string
}

export function useTourTableColumns({ orders, getStatusColor }: UseTourTableColumnsParams) {
  return useMemo<TableColumn[]>(
    () => [
      {
        key: 'code',
        label: '團號',
        sortable: true,
        render: (value) => <span className="text-sm text-morandi-primary">{String(value || "")}</span>,
      },
      {
        key: 'name',
        label: '旅遊團名稱',
        sortable: true,
        render: (value) => <span className="text-sm text-morandi-primary">{String(value || "")}</span>,
      },
      {
        key: 'departure_date',
        label: '出發日期',
        sortable: true,
        render: (value, row) => {
          const tour = row as Tour
          return <DateCell date={tour.departure_date} showIcon={false} />
        },
      },
      {
        key: 'return_date',
        label: '回程日期',
        sortable: true,
        render: (value, row) => {
          const tour = row as Tour
          return <DateCell date={tour.return_date} fallback="-" showIcon={false} />
        },
      },
      {
        key: 'participants',
        label: '人數',
        render: (value, row) => {
          const tour = row as Tour
          const tourOrders = orders.filter(order => order.tour_id === tour.id)
          // 計算預計人數：訂單的 member_count 加總
          const plannedCount = tourOrders.reduce((sum, order) => sum + (order.member_count || 0), 0)
          return <span className="text-sm text-morandi-primary">{plannedCount}</span>
        },
      },
      {
        key: 'status',
        label: '狀態',
        sortable: true,
        render: (value, row) => {
          const tour = row as Tour
          const status = tour.status || ''
          return (
            <span className={cn('text-sm font-medium', getStatusColor(status))}>
              {status}
            </span>
          )
        },
      },
    ],
    [orders, getStatusColor]
  )
}
