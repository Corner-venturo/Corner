import { useMemo, useCallback } from 'react'
import { TableColumn, useEnhancedTable } from '@/components/ui/enhanced-table'
import { PaymentRequest } from '@/stores/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { statusLabels, statusColors } from '../types' // Assuming statusLabels and statusColors are now correctly typed

export function useRequestTable(payment_requests: PaymentRequest[]) {
  // Table columns configuration
  const tableColumns: TableColumn<PaymentRequest>[] = useMemo(
    () => [
      {
        key: 'request_number',
        label: '請款單號',
        sortable: true,
        filterable: true,
        render: (value: unknown, row: PaymentRequest) => <div className="font-medium text-morandi-primary">{value as string}</div>,
      },
      {
        key: 'tour_name',
        label: '團名', // Changed from '團號' to '團名' as per PaymentRequest type has tour_name
        sortable: true,
        filterable: true,
        render: (value: unknown, row: PaymentRequest) => <div className="font-medium text-morandi-primary">{value as string}</div>,
      },
      {
        key: 'order_number',
        label: '訂單編號',
        sortable: true,
        filterable: true,
        render: (value: unknown, row: PaymentRequest) => <div className="text-sm text-morandi-primary">{value as string || '無'}</div>,
      },
      {
        key: 'request_date',
        label: '請款日期',
        sortable: true,
        filterable: true,
        filterType: 'date',
        render: (value: unknown, row: PaymentRequest) => (
          <div className="text-sm">
            <div
              className={
                row.is_special_billing ? 'text-morandi-gold font-medium' : 'text-morandi-secondary'
              }
            >
              {value ? new Date(value as string).toLocaleDateString('zh-TW') : '未設定'}
            </div>
            {row.is_special_billing && <div className="text-xs text-morandi-gold">⚠️ 特殊出帳</div>}
          </div>
        ),
      },
      {
        key: 'amount', // Renamed from total_amount
        label: '金額',
        sortable: true,
        filterable: true,
        filterType: 'number',
        render: (value: unknown, row: PaymentRequest) => ( // Value is number for amount
          <div className="font-semibold text-morandi-gold">NT$ {(value as number).toLocaleString()}</div>
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
          { value: 'approved', label: '已確認' }, // Statuses from PaymentRequest
          { value: 'paid', label: '已付款' },
        ],
        render: (value: unknown, row: PaymentRequest) => { // Value is string | null
          const statusBadge = getStatusBadge(value as PaymentRequest['status'])
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
          case 'tour_name':
            aValue = a.tour_name || ''
            bValue = b.tour_name || ''
            break
          case 'order_number':
            aValue = a.order_number || ''
            bValue = b.order_number || ''
            break
          case 'request_date':
            aValue = new Date(a.request_date || 0) // Now request_date exists
            bValue = new Date(b.request_date || 0)
            break
          case 'amount': // Renamed from total_amount
            aValue = a.amount
            bValue = b.amount
            break
          case 'status':
            // Provide default 'pending' if status is null for indexing
            aValue = statusLabels[(a.status || 'pending') as 'pending' | 'approved' | 'paid']
            bValue = statusLabels[(b.status || 'pending') as 'pending' | 'approved' | 'paid']
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
      const requestStatus = request.status || 'pending'; // Provide default for filtering
      return (
        (!filters.request_number ||
          request.request_number.toLowerCase().includes(filters.request_number.toLowerCase())) &&
        (!filters.tour_name ||
          (request.tour_name || '').toLowerCase().includes(filters.tour_name.toLowerCase())) &&
        (!filters.order_number ||
          (request.order_number || '')
            .toLowerCase()
            .includes(filters.order_number.toLowerCase())) &&
        (!filters.request_date || (request.request_date || '').includes(filters.request_date)) &&
        (!filters.amount || request.amount.toString().includes(filters.amount)) && // Renamed from total_amount
        (!filters.status || requestStatus === filters.status)
      )
    })
  }, [])

  // Use PaymentRequest[] as the generic type for useEnhancedTable
  const {
    data: filteredAndSortedRequests,
    handleSort,
    handleFilter,
  } = useEnhancedTable<PaymentRequest>(payment_requests, sortFunction, filterFunction)

  return {
    tableColumns,
    filteredAndSortedRequests,
    handleSort,
    handleFilter,
  }
}

// Helper function for status badge, explicitly typed
function getStatusBadge(status: PaymentRequest['status']) {
  const currentStatus = (status || 'pending') as 'pending' | 'approved' | 'paid'; // Default to 'pending' if null
  return {
    label: statusLabels[currentStatus],
    color: statusColors[currentStatus],
  }
}

