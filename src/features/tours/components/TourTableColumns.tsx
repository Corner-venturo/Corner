/**
 * TourTableColumns - Table column definitions for tours list
 */

'use client'

import { useMemo } from 'react'
import { TableColumn } from '@/components/ui/enhanced-table'
import { Tour } from '@/stores/types'
import { cn } from '@/lib/utils'
import { DateCell } from '@/components/table-cells'

interface UseTourTableColumnsParams {
  getStatusColor: (status: string) => string
}

export function useTourTableColumns({ getStatusColor }: UseTourTableColumnsParams) {
  return useMemo<TableColumn[]>(
    () => [
      {
        key: 'code',
        label: '團號',
        sortable: true,
        width: '110px',
        render: (value) => <span className="text-sm text-morandi-primary">{String(value || "")}</span>,
      },
      {
        key: 'name',
        label: '旅遊團名稱',
        sortable: true,
        // 不設寬度，讓它填滿剩餘空間
        render: (value) => <span className="text-sm text-morandi-primary">{String(value || "")}</span>,
      },
      {
        key: 'departure_date',
        label: '出發日期',
        sortable: true,
        width: '100px',
        render: (value, row) => {
          const tour = row as Tour
          return <DateCell date={tour.departure_date} showIcon={false} />
        },
      },
      {
        key: 'status',
        label: '狀態',
        sortable: true,
        width: '80px',
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
    [getStatusColor]
  )
}
