'use client';

import { Edit2, Trash2 } from 'lucide-react';
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table';
import { cn } from '@/lib/utils';
import { getVisaStatusLabel } from '@/constants/status-maps';
import type { Visa } from '@/stores/types';

interface VisasListProps {
  filteredVisas: Visa[];
  canManageVisas: boolean;
  selectedRows: string[];
  onSelectionChange: (rows: string[]) => void;
  onDelete: (id: string) => void;
}

export function VisasList({
  filteredVisas,
  canManageVisas,
  selectedRows,
  onSelectionChange,
  onDelete,
}: VisasListProps) {
  // Table 欄位定義
  const columns: TableColumn[] = [
    {
      key: 'applicant_name',
      label: '申請人',
      sortable: true,
      render: (value) => <span className="text-sm text-morandi-primary">{value}</span>,
    },
    {
      key: 'contact_person',
      label: '聯絡人',
      render: (value) => <span className="text-sm text-morandi-primary">{value}</span>,
    },
    {
      key: 'contact_phone',
      label: '聯絡電話',
      render: (value) => <span className="text-sm text-morandi-primary">{value}</span>,
    },
    {
      key: 'country',
      label: '簽證',
      render: (value) => <span className="text-sm text-morandi-primary">{value}</span>,
    },
    {
      key: 'status',
      label: '狀態',
      render: (value, visa) => (
        <span className={cn(
          'text-sm font-medium',
          visa.status === 'submitted' ? 'text-morandi-gold' :
          visa.status === 'issued' ? 'text-morandi-green' :
          'text-morandi-secondary'
        )}>
          {getVisaStatusLabel(visa.status)}
        </span>
      ),
    },
    {
      key: 'submission_date',
      label: '送件時間',
      render: (value) => <span className="text-sm text-morandi-secondary">{value ? new Date(value).toLocaleDateString() : '-'}</span>,
    },
    {
      key: 'received_date',
      label: '下件時間',
      render: (value) => <span className="text-sm text-morandi-secondary">{value ? new Date(value).toLocaleDateString() : '-'}</span>,
    },
    {
      key: 'fee',
      label: '代辦費',
      render: (value) => <span className="text-sm text-morandi-primary">NT$ {value.toLocaleString()}</span>,
    },
  ];

  const renderActions = (visa: Visa) => {
    if (!canManageVisas) return null;

    return (
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            // 編輯功能
          }}
          className="p-1 text-morandi-gold hover:bg-morandi-gold/10 rounded transition-colors"
          title="編輯"
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('確定要刪除此簽證記錄嗎？')) {
              onDelete(visa.id);
            }
          }}
          className="p-1 text-morandi-red/60 hover:text-morandi-red hover:bg-morandi-red/10 rounded transition-colors"
          title="刪除"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  };

  return (
    <EnhancedTable
      className="min-h-full"
      columns={columns}
      data={filteredVisas}
      loading={false}
      selection={canManageVisas ? {
        selected: selectedRows,
        onChange: onSelectionChange,
      } : undefined}
      actions={renderActions}
      bordered={true}
    />
  );
}
