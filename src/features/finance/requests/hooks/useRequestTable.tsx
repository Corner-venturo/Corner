import { useMemo, useCallback } from 'react'
import { TableColumn, useEnhancedTable } from '@/components/ui/enhanced-table'
import { PaymentRequest } from '@/stores/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { statusLabels, statusColors } from '../types'

// 狀態排序權重
const STATUS_ORDER: Record<string, number> = {
  pending: 1,
  approved: 2,
  processing: 3,
  confirmed: 4,
  paid: 5,
  rejected: 6,
}

export function useRequestTable(payment_requests: PaymentRequest[]) {
  // Table columns configuration
  const tableColumns: TableColumn<PaymentRequest>[] = useMemo(
    () => [
      {
        key: 'code',
        label: '請款單號',
        sortable: true,
        render: (value) => <div className="font-medium text-morandi-primary">{String(value || '自動產生')}</div>,
      },
      {
        key: 'tour_code',
        label: '關聯團號',
        sortable: true,
        render: (value) => <div className="text-sm text-morandi-secondary">{String(value || '無')}</div>,
      },
      {
        key: 'order_number',
        label: '訂單編號',
        sortable: true,
        render: (value) => <div className="text-sm text-morandi-primary">{String(value || '無')}</div>,
      },
      {
        key: 'created_by_name',
        label: '請款人',
        sortable: true,
        render: (value) => <div className="text-sm text-morandi-primary">{String(value || '-')}</div>,
      },
      {
        key: 'created_at',
        label: '請款日期',
        sortable: true,
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
        render: (_value, row: PaymentRequest) => (
          <div className="font-semibold text-morandi-gold">NT$ {row.amount.toLocaleString()}</div>
        ),
      },
      {
        key: 'status',
        label: '狀態',
        sortable: true,
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
          case 'code':
            aValue = a.code || ''
            bValue = b.code || ''
            break
          case 'tour_code':
            aValue = a.tour_code || ''
            bValue = b.tour_code || ''
            break
          case 'order_number':
            aValue = a.order_number || ''
            bValue = b.order_number || ''
            break
          case 'created_by_name':
            aValue = a.created_by_name || ''
            bValue = b.created_by_name || ''
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
            aValue = a.status ? STATUS_ORDER[a.status] || 99 : 99
            bValue = b.status ? STATUS_ORDER[b.status] || 99 : 99
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
        (!filters.code ||
          (request.code || '').toLowerCase().includes(filters.code.toLowerCase())) &&
        (!filters.tour_code ||
          (request.tour_code || '').toLowerCase().includes(filters.tour_code.toLowerCase())) &&
        (!filters.order_number ||
          (request.order_number || '').toLowerCase().includes(filters.order_number.toLowerCase())) &&
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
