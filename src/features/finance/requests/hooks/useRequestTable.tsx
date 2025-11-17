import { useMemo, useCallback } from 'react'
import { TableColumn, useEnhancedTable } from '@/components/ui/enhanced-table'
import { PaymentRequest } from '@/stores/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { statusLabels, statusColors } from '../types'

export function useRequestTable(payment_requests: PaymentRequest[]) {
  // Table columns configuration
  const tableColumns: TableColumn<PaymentRequest>[] = useMemo(
    () => [
      {
        key: 'request_number',
        label: '請款單號',
        sortable: true,
        filterable: true,
        render: (value) => <div className="font-medium text-morandi-primary">{String(value || '')}</div>,
      },
      {
        key: 'tour_id',
        label: '關聯團號',
        sortable: true,
        filterable: true,
        render: (value) => <div className="text-sm text-morandi-secondary">{String(value || '無')}</div>,
      },
      {
        key: 'code',
        label: '訂單編號',
        sortable: true,
        filterable: true,
        render: (value) => <div className="text-sm text-morandi-primary">{String(value || '無')}</div>,
      },
      {
        key: 'created_at',
        label: '請款日期',
        sortable: true,
        filterable: true,
        filterType: 'date',
        render: (value, row: PaymentRequest) => (
          <div className="text-sm">
            <div
              className={
                row.is_special_billing ? 'text-morandi-gold font-medium' : 'text-morandi-secondary'
              }
            >
              {value ? new Date(String(value)).toLocaleDateString('zh-TW') : '未設定'}
            </div>
            {row.is_special_billing && <div className="text-xs text-morandi-gold">⚠️ 特殊出帳</div>}
          </div>
        ),
      },
      {
        key: 'amount',
        label: '金額',
        sortable: true,
        filterable: true,
        filterType: 'number',
        render: (_value, row: PaymentRequest) => (
          <div className="font-semibold text-morandi-gold">NT$ {row.amount.toLocaleString()}</div>
        ),
      },
      {
        key: 'status',
        label: '狀態',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: [
          { value: 'pending', label: '請款中' },
          { value: 'processing', label: '處理中' },
          { value: 'confirmed', label: '已確認' },
          { value: 'paid', label: '已付款' },
        ],
        render: (_value, row: PaymentRequest) => {
          const statusBadge = getStatusBadge(row.status)
          return (
            <Badge className={cn('text-xs text-white', statusBadge.color)}>
              {statusBadge.label}
            </Badge>
          )
        },
      },
    ],
    []
  )

  // Sort function
  const sortFunction = useCallback(
    (data: PaymentRequest[], column: string, direction: 'asc' | 'desc') => {
      return [...data].sort((a, b) => {
        let aValue: string | number | Date, bValue: string | number | Date

        switch (column) {
          case 'request_number':
            aValue = a.request_number
            bValue = b.request_number
            break
          case 'tour_id':
            aValue = a.tour_id || ''
            bValue = b.tour_id || ''
            break
          case 'code':
            aValue = a.code || ''
            bValue = b.code || ''
            break
          case 'created_at':
            aValue = new Date(a.created_at || 0)
            bValue = new Date(b.created_at || 0)
            break
          case 'amount':
            aValue = a.amount
            bValue = b.amount
            break
          case 'status':
            aValue = a.status ? statusLabels[a.status] : ''
            bValue = b.status ? statusLabels[b.status] : ''
            break
          default:
            return 0
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1
        if (aValue > bValue) return direction === 'asc' ? 1 : -1
        return 0
      })
    },
    []
  )

  // Filter function
  const filterFunction = useCallback((data: PaymentRequest[], filters: Record<string, string>) => {
    return data.filter(request => {
      return (
        (!filters.request_number ||
          request.request_number.toLowerCase().includes(filters.request_number.toLowerCase())) &&
        (!filters.tour_id ||
          (request.tour_id || '').toLowerCase().includes(filters.tour_id.toLowerCase())) &&
        (!filters.code ||
          (request.code || '')
            .toLowerCase()
            .includes(filters.code.toLowerCase())) &&
        (!filters.created_at || (request.created_at || '').includes(filters.created_at)) &&
        (!filters.amount || request.amount.toString().includes(filters.amount)) &&
        (!filters.status || request.status === filters.status)
      )
    })
  }, [])

  const {
    data: filteredAndSortedRequests,
    handleSort,
    handleFilter,
  } = useEnhancedTable(payment_requests as PaymentRequest[], sortFunction, filterFunction)

  return {
    tableColumns,
    filteredAndSortedRequests,
    handleSort,
    handleFilter,
  }
}

function getStatusBadge(status: PaymentRequest['status']) {
  return {
    label: status ? statusLabels[status] : '',
    color: status ? statusColors[status] : '',
  }
}
