/**
 * DisbursementColumns
 * 表格欄位配置
 */

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { TableColumn } from '@/components/ui/enhanced-table';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_LABELS, STATUS_COLORS, DISBURSEMENT_STATUS_LABELS, DISBURSEMENT_STATUS_COLORS } from '../constants';
import { DisbursementOrder } from '../types';

interface UsePendingColumnsProps {
  selectedRequests: string[];
  onSelectRequest: (requestId: string) => void;
}

export function usePendingColumns({ selectedRequests, onSelectRequest }: UsePendingColumnsProps) {
  return useMemo<TableColumn[]>(
    () => [
      {
        key: 'select',
        label: '',
        width: '50px',
        render: (_value: unknown, row: any) => (
          <input
            type="checkbox"
            checked={selectedRequests.includes(row.id)}
            onChange={() => onSelectRequest(row.id)}
            className="rounded border-morandi-secondary"
          />
        )
      },
      {
        key: 'request_number',
        label: '請款單號',
        sortable: true,
        render: (value) => <div className="font-medium text-morandi-primary">{value}</div>
      },
      {
        key: 'code',
        label: '團號',
        sortable: true,
        render: (value) => <div className="font-medium">{value}</div>
      },
      {
        key: 'tour_name',
        label: '團體名稱',
        sortable: true,
        render: (value) => <div className="text-sm text-morandi-secondary truncate max-w-[200px]">{value}</div>
      },
      {
        key: 'total_amount',
        label: '金額',
        sortable: true,
        render: (value) => <div className="font-medium text-right">NT$ {value.toLocaleString()}</div>
      },
      {
        key: 'request_date',
        label: '請款日期',
        sortable: true,
        render: (value) => <div className="text-sm text-morandi-secondary">{value}</div>
      },
      {
        key: 'status',
        label: '狀態',
        render: (value) => (
          <Badge className={cn('text-white', STATUS_COLORS[value as keyof typeof STATUS_COLORS])}>
            {STATUS_LABELS[value as keyof typeof STATUS_LABELS]}
          </Badge>
        )
      }
    ],
    [selectedRequests, onSelectRequest]
  );
}

interface UseCurrentOrderColumnsProps {
  currentOrder: DisbursementOrder | null;
  onRemove: (requestId: string) => void;
}

export function useCurrentOrderColumns({ currentOrder, onRemove }: UseCurrentOrderColumnsProps) {
  return useMemo<TableColumn[]>(
    () => [
      {
        key: 'request_number',
        label: '請款單號',
        sortable: true,
        render: (value) => <div className="font-medium text-morandi-primary">{value}</div>
      },
      {
        key: 'code',
        label: '團號',
        sortable: true,
        render: (value) => <div className="font-medium">{value}</div>
      },
      {
        key: 'tour_name',
        label: '團體名稱',
        sortable: true,
        render: (value) => <div className="text-sm text-morandi-secondary truncate max-w-[200px]">{value}</div>
      },
      {
        key: 'total_amount',
        label: '金額',
        sortable: true,
        render: (value) => <div className="font-medium text-right">NT$ {value.toLocaleString()}</div>
      },
      {
        key: 'request_date',
        label: '請款日期',
        sortable: true,
        render: (value) => <div className="text-sm text-morandi-secondary">{value}</div>
      },
      {
        key: 'actions',
        label: '操作',
        width: '80px',
        render: (_value, row) => (
          <button
            onClick={() => onRemove(row.id)}
            disabled={currentOrder?.status !== 'pending'}
            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="移除"
          >
            <X size={14} />
          </button>
        )
      }
    ],
    [currentOrder, onRemove]
  );
}

export function useHistoryColumns() {
  return useMemo<TableColumn[]>(
    () => [
      {
        key: 'order_number',
        label: '出納單號',
        sortable: true,
        render: (value) => <div className="font-medium text-morandi-primary">{value}</div>
      },
      {
        key: 'disbursementDate',
        label: '出帳日期',
        sortable: true,
        render: (value) => <div className="text-sm text-morandi-secondary">{value}</div>
      },
      {
        key: 'total_amount',
        label: '總金額',
        sortable: true,
        render: (value) => <div className="font-medium text-right">NT$ {value.toLocaleString()}</div>
      },
      {
        key: 'paymentRequestIds',
        label: '請款單數',
        render: (value) => <div className="text-center">{value.length} 筆</div>
      },
      {
        key: 'status',
        label: '狀態',
        render: (value) => (
          <Badge className={cn('text-white', DISBURSEMENT_STATUS_COLORS[value as keyof typeof DISBURSEMENT_STATUS_COLORS])}>
            {DISBURSEMENT_STATUS_LABELS[value as keyof typeof DISBURSEMENT_STATUS_LABELS]}
          </Badge>
        )
      },
      {
        key: 'created_at',
        label: '建立時間',
        sortable: true,
        render: (value) => <div className="text-sm text-morandi-secondary">{new Date(value).toLocaleDateString('zh-TW')}</div>
      }
    ],
    []
  );
}
