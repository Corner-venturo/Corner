/**
 * DisbursementColumns
 * 表格欄位配置
 */

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableColumn } from '@/components/ui/enhanced-table'
import { X, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTW } from '@/lib/utils/format-date'
import {
  STATUS_LABELS,
  STATUS_COLORS,
  DISBURSEMENT_STATUS_LABELS,
  DISBURSEMENT_STATUS_COLORS,
} from '../constants'
import { DisbursementOrder, PaymentRequest } from '../types'

type PendingTableRow = PaymentRequest & {
  tour_name?: string
}

type CurrentOrderTableRow = PaymentRequest & {
  tour_name?: string
}

type HistoryTableRow = DisbursementOrder

interface UsePendingColumnsProps {
  selectedRequests: string[]
  onSelectRequest: (requestId: string) => void
}

export function usePendingColumns({ selectedRequests, onSelectRequest }: UsePendingColumnsProps) {
  return useMemo<TableColumn[]>(
    () => [
      {
        key: 'select',
        label: '',
        width: '50px',
        render: (_value: unknown, row: unknown) => {
          const typedRow = row as PendingTableRow
          return (
            <input
              type="checkbox"
              checked={selectedRequests.includes(typedRow.id)}
              onChange={() => onSelectRequest(typedRow.id)}
              className="rounded border-morandi-secondary"
            />
          )
        },
      },
      {
        key: 'request_number',
        label: '請款單號',
        sortable: true,
        render: (value: unknown) => <div className="font-medium text-morandi-primary">{value as string}</div>,
      },
      {
        key: 'code',
        label: '團號',
        sortable: true,
        render: (value: unknown) => <div className="font-medium">{value as string}</div>,
      },
      {
        key: 'tour_name',
        label: '團體名稱',
        sortable: true,
        render: (value: unknown) => (
          <div className="text-sm text-morandi-secondary truncate max-w-[200px]">{value as string}</div>
        ),
      },
      {
        key: 'amount',
        label: '金額',
        sortable: true,
        render: (value: unknown) => <div className="font-medium text-right">NT$ {(value as number).toLocaleString()}</div>,
      },
      {
        key: 'request_date',
        label: '請款日期',
        sortable: true,
        render: (value: unknown) => <div className="text-sm text-morandi-secondary">{value as string}</div>,
      },
      {
        key: 'status',
        label: '狀態',
        render: (value: unknown) => (
          <Badge className={cn('text-white', STATUS_COLORS[value as keyof typeof STATUS_COLORS])}>
            {STATUS_LABELS[value as keyof typeof STATUS_LABELS]}
          </Badge>
        ),
      },
    ],
    [selectedRequests, onSelectRequest]
  )
}

interface UseCurrentOrderColumnsProps {
  currentOrder: DisbursementOrder | null
  onRemove: (requestId: string) => void
}

export function useCurrentOrderColumns({ currentOrder, onRemove }: UseCurrentOrderColumnsProps) {
  return useMemo<TableColumn[]>(
    () => [
      {
        key: 'request_number',
        label: '請款單號',
        sortable: true,
        render: (value: unknown) => <div className="font-medium text-morandi-primary">{value as string}</div>,
      },
      {
        key: 'code',
        label: '團號',
        sortable: true,
        render: (value: unknown) => <div className="font-medium">{value as string}</div>,
      },
      {
        key: 'tour_name',
        label: '團體名稱',
        sortable: true,
        render: (value: unknown) => (
          <div className="text-sm text-morandi-secondary truncate max-w-[200px]">{value as string}</div>
        ),
      },
      {
        key: 'amount',
        label: '金額',
        sortable: true,
        render: (value: unknown) => <div className="font-medium text-right">NT$ {(value as number).toLocaleString()}</div>,
      },
      {
        key: 'request_date',
        label: '請款日期',
        sortable: true,
        render: (value: unknown) => <div className="text-sm text-morandi-secondary">{value as string}</div>,
      },
      {
        key: 'actions',
        label: '操作',
        width: '80px',
        render: (_value: unknown, row: unknown) => {
          const typedRow = row as CurrentOrderTableRow
          return (
            <button
              onClick={() => onRemove(typedRow.id)}
              disabled={currentOrder?.status !== 'pending'}
              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="移除"
            >
              <X size={14} />
            </button>
          )
        },
      },
    ],
    [currentOrder, onRemove]
  )
}

interface UseHistoryColumnsProps {
  onPrintPDF: (order: DisbursementOrder) => void
}

export function useHistoryColumns({ onPrintPDF }: UseHistoryColumnsProps) {
  return useMemo<TableColumn[]>(
    () => [
      {
        key: 'order_number',
        label: '出納單號',
        sortable: true,
        render: (value: unknown) => <div className="font-medium text-morandi-primary">{value as string}</div>,
      },
      {
        key: 'disbursement_date',
        label: '出帳日期',
        sortable: true,
        render: (value: unknown) => <div className="text-sm text-morandi-secondary">{value as string}</div>,
      },
      {
        key: 'amount',
        label: '總金額',
        sortable: true,
        render: (value: unknown) => <div className="font-medium text-right">NT$ {(value as number).toLocaleString()}</div>,
      },
      {
        key: 'payment_request_ids',
        label: '請款單數',
        render: (value: unknown) => <div className="text-center">{(value as string[]).length} 筆</div>,
      },
      {
        key: 'status',
        label: '狀態',
        render: (value: unknown) => (
          <Badge
            className={cn(
              'text-white',
              DISBURSEMENT_STATUS_COLORS[value as keyof typeof DISBURSEMENT_STATUS_COLORS]
            )}
          >
            {DISBURSEMENT_STATUS_LABELS[value as keyof typeof DISBURSEMENT_STATUS_LABELS]}
          </Badge>
        ),
      },
      {
        key: 'created_at',
        label: '建立時間',
        sortable: true,
        render: (value: unknown) => (
          <div className="text-sm text-morandi-secondary">
            {formatDateTW(value as string)}
          </div>
        ),
      },
      {
        key: 'actions',
        label: '操作',
        width: '100px',
        render: (_value: unknown, row: unknown) => {
          const typedRow = row as HistoryTableRow
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPrintPDF(typedRow)}
              className="text-morandi-gold border-morandi-gold hover:bg-morandi-gold/10"
            >
              <FileText size={14} className="mr-1" />
              PDF
            </Button>
          )
        },
      },
    ],
    [onPrintPDF]
  )
}
