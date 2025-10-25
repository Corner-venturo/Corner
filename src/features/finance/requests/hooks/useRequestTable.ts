import { useMemo, useCallback } from 'react';
import { TableColumn, useEnhancedTable } from '@/components/ui/enhanced-table';
import { PaymentRequest } from '@/stores/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { statusLabels, statusColors } from '../types';

export function useRequestTable(payment_requests: PaymentRequest[]) {
  // Table columns configuration
  const tableColumns: TableColumn[] = useMemo(() => [
    {
      key: 'request_number',
      label: '請款單號',
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="font-medium text-morandi-primary">{value}</div>
      )
    },
    {
      key: 'tour_name',
      label: '團號',
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="font-medium text-morandi-primary">{value}</div>
      )
    },
    {
      key: 'order_number',
      label: '訂單編號',
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="text-sm text-morandi-primary">{value || '無'}</div>
      )
    },
    {
      key: 'request_date',
      label: '請款日期',
      sortable: true,
      filterable: true,
      filterType: 'date',
      render: (value, row) => (
        <div className="text-sm">
          <div className={row.is_special_billing ? 'text-morandi-gold font-medium' : 'text-morandi-secondary'}>
            {value ? new Date(value).toLocaleDateString('zh-TW') : '未設定'}
          </div>
          {row.is_special_billing && (
            <div className="text-xs text-morandi-gold">⚠️ 特殊出帳</div>
          )}
        </div>
      )
    },
    {
      key: 'total_amount',
      label: '金額',
      sortable: true,
      filterable: true,
      filterType: 'number',
      render: (value) => (
        <div className="font-semibold text-morandi-gold">
          NT$ {value.toLocaleString()}
        </div>
      )
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
        { value: 'paid', label: '已付款' }
      ],
      render: (value) => {
        const statusBadge = getStatusBadge(value);
        return (
          <Badge className={cn('text-xs text-white', statusBadge.color)}>
            {statusBadge.label}
          </Badge>
        );
      }
    }
  ], []);

  // Sort function
  const sortFunction = useCallback((data: PaymentRequest[], column: string, direction: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      let aValue: string | number | Date, bValue: string | number | Date;

      switch (column) {
        case 'request_number':
          aValue = a.request_number;
          bValue = b.request_number;
          break;
        case 'tour_name':
          aValue = a.tour_name || '';
          bValue = b.tour_name || '';
          break;
        case 'order_number':
          aValue = a.order_number || '';
          bValue = b.order_number || '';
          break;
        case 'request_date':
          aValue = new Date(a.request_date || 0);
          bValue = new Date(b.request_date || 0);
          break;
        case 'total_amount':
          aValue = a.total_amount;
          bValue = b.total_amount;
          break;
        case 'status':
          aValue = statusLabels[a.status];
          bValue = statusLabels[b.status];
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, []);

  // Filter function
  const filterFunction = useCallback((data: PaymentRequest[], filters: Record<string, string>) => {
    return data.filter(request => {
      return (
        (!filters.request_number || request.request_number.toLowerCase().includes(filters.request_number.toLowerCase())) &&
        (!filters.tour_name || (request.tour_name || '').toLowerCase().includes(filters.tour_name.toLowerCase())) &&
        (!filters.order_number || (request.order_number || '').toLowerCase().includes(filters.order_number.toLowerCase())) &&
        (!filters.request_date || (request.request_date || '').includes(filters.request_date)) &&
        (!filters.total_amount || request.total_amount.toString().includes(filters.total_amount)) &&
        (!filters.status || request.status === filters.status)
      );
    });
  }, []);

  const { data: filteredAndSortedRequests, handleSort, handleFilter } = useEnhancedTable(
    payment_requests as unknown,
    sortFunction,
    filterFunction
  );

  return {
    tableColumns,
    filteredAndSortedRequests,
    handleSort,
    handleFilter
  };
}

function getStatusBadge(status: PaymentRequest['status']) {
  return {
    label: statusLabels[status],
    color: statusColors[status]
  };
}
