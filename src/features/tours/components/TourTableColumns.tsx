'use client'
/**
 * TourTableColumns - Table column definitions for tours list
 */


import { useMemo } from 'react'
import Link from 'next/link'
import { TableColumn } from '@/components/ui/enhanced-table'
import { Tour } from '@/stores/types'
import { cn } from '@/lib/utils'
import { DateCell } from '@/components/table-cells'
import { TOUR_TABLE } from '../constants'

interface UseTourTableColumnsParams {
  getStatusColor: (status: string) => string
}

export function useTourTableColumns({ getStatusColor }: UseTourTableColumnsParams) {

  return useMemo<TableColumn[]>(
    () => [
      {
        key: 'code',
        label: TOUR_TABLE.col_code,
        sortable: true,
        width: '110px',
        render: (value, row) => {
          const tour = row as Tour & { __isProposal?: boolean }
          const code = String(value || "")
          // 提案不顯示連結
          if (tour.__isProposal) {
            return <span className="text-sm text-morandi-primary">{code}</span>
          }
          return (
            <Link
              href={`/tours/${code}`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm text-morandi-gold hover:text-morandi-gold-hover hover:underline font-medium"
            >
              {code}
            </Link>
          )
        },
      },
      {
        key: 'name',
        label: TOUR_TABLE.col_name,
        sortable: true,
        width: '180px',
        render: (value) => <span className="text-sm text-morandi-primary">{String(value || "")}</span>,
      },
      {
        key: 'departure_date',
        label: TOUR_TABLE.col_departure,
        sortable: true,
        width: '100px',
        render: (value, row) => {
          const tour = row as Tour
          return <DateCell date={tour.departure_date} showIcon={false} />
        },
      },
      {
        key: 'status',
        label: TOUR_TABLE.col_status,
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
