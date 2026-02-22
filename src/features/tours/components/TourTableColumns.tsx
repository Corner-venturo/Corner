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
import { getStatusConfig } from '@/lib/status-config'

interface UseTourTableColumnsParams {
  ordersByTourId?: Map<string, { sales_person: string | null; assistant: string | null }>
}

export function useTourTableColumns({ ordersByTourId }: UseTourTableColumnsParams) {

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
        key: 'return_date',
        label: TOUR_TABLE.col_return,
        sortable: true,
        width: '100px',
        render: (value, row) => {
          const tour = row as Tour
          return <DateCell date={tour.return_date} showIcon={false} />
        },
      },
      {
        key: 'salesperson',
        label: TOUR_TABLE.col_salesperson,
        width: '80px',
        render: (_value, row) => {
          const tour = row as Tour
          const orderInfo = ordersByTourId?.get(tour.id)
          return <span className="text-sm text-morandi-primary">{orderInfo?.sales_person || '-'}</span>
        },
      },
      {
        key: 'assistant',
        label: TOUR_TABLE.col_assistant,
        width: '80px',
        render: (_value, row) => {
          const tour = row as Tour
          const orderInfo = ordersByTourId?.get(tour.id)
          return <span className="text-sm text-morandi-primary">{orderInfo?.assistant || '-'}</span>
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
          const config = getStatusConfig('tour', status)
          return (
            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', config.bgColor, config.color, config.borderColor)}>
              {status}
            </span>
          )
        },
      },
    ],
    [ordersByTourId]
  )
}
