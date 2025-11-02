/**
 * 收款管理表格欄位定義
 */

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Receipt } from '@/stores';

const RECEIPT_TYPE_OPTIONS = [
  { value: 0, label: '匯款' },
  { value: 1, label: '現金' },
  { value: 2, label: '刷卡' },
  { value: 3, label: '支票' },
  { value: 4, label: 'LinkPay' },
];

export const createPaymentColumns = (onViewDetail: (receipt: Receipt) => void) => [
  {
    key: 'receipt_number',
    label: '收款單號',
    sortable: true,
    render: (value: string) => (
      <div className="font-mono text-sm font-medium text-morandi-primary">
        {value}
      </div>
    )
  },
  {
    key: 'order_number',
    label: '訂單編號',
    sortable: true,
    render: (value: string, row: Receipt) => (
      <div className="text-sm">
        <div className="font-medium text-morandi-primary">{value || '-'}</div>
        <div className="text-xs text-morandi-secondary">{row.receipt_account || '-'}</div>
      </div>
    )
  },
  {
    key: 'receipt_type',
    label: '收款方式',
    sortable: true,
    render: (value: number) => {
      const label = RECEIPT_TYPE_OPTIONS.find(o => o.value === value)?.label || '-';
      return (
        <div className="text-sm text-morandi-primary">
          {label}
        </div>
      );
    }
  },
  {
    key: 'receipt_amount',
    label: '應收金額',
    sortable: true,
    render: (value: number) => (
      <div className="text-sm font-medium text-morandi-primary">
        NT$ {value.toLocaleString()}
      </div>
    )
  },
  {
    key: 'actual_amount',
    label: '實收金額',
    sortable: true,
    render: (value: number, row: Receipt) => {
      if (row.status === 0) {
        return (
          <div className="text-sm text-morandi-secondary italic">
            待確認
          </div>
        );
      }
      return (
        <div className="text-sm font-medium text-morandi-green">
          NT$ {value.toLocaleString()}
        </div>
      );
    }
  },
  {
    key: 'receipt_date',
    label: '收款日期',
    sortable: true,
    render: (value: string) => (
      <div className="text-sm text-morandi-primary">
        {new Date(value).toLocaleDateString('zh-TW')}
      </div>
    )
  },
  {
    key: 'status',
    label: '狀態',
    sortable: true,
    render: (value: number) => {
      const isPending = value === 0;
      return (
        <div className={cn(
          'text-sm font-medium',
          isPending ? 'text-morandi-gold' : 'text-morandi-green'
        )}>
          {isPending ? '🟡' : '✅'} {isPending ? '待確認' : '已確認'}
        </div>
      );
    }
  },
  {
    key: 'actions',
    label: '操作',
    sortable: false,
    render: (_value: unknown, row: Receipt) => (
      <Button
        variant="outline"
        size="sm"
        onClick={() => onViewDetail(row)}
      >
        詳情
      </Button>
    )
  }
];
