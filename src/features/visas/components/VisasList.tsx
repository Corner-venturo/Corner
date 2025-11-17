'use client'

import { Edit2, Trash2 } from 'lucide-react'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { cn } from '@/lib/utils'
import { getVisaStatusLabel } from '@/constants/status-maps'
import type { Visa } from '@/stores/types'
import { ConfirmDialog } from '@/components/dialog/confirm-dialog'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'

interface VisasListProps {
  filteredVisas: Visa[]
  canManageVisas: boolean
  selectedRows: string[]
  onSelectionChange: (rows: string[]) => void
  onDelete: (id: string) => void
  onUpdateStatus: (id: string, status: Visa['status']) => void
}

export function VisasList({
  filteredVisas,
  canManageVisas,
  selectedRows,
  onSelectionChange,
  onDelete,
  onUpdateStatus,
}: VisasListProps) {
  const { confirm, confirmDialogProps } = useConfirmDialog()

  // Table 欄位定義
  const columns: TableColumn[] = [
    {
      key: 'applicant_name',
      label: '申請人',
      sortable: true,
      render: (value) => <span className="text-sm text-morandi-primary">{String(value || '')}</span>,
    },
    {
      key: 'contact_person',
      label: '聯絡人',
      render: (value) => <span className="text-sm text-morandi-primary">{String(value || '')}</span>,
    },
    {
      key: 'contact_phone',
      label: '聯絡電話',
      render: (value) => <span className="text-sm text-morandi-primary">{String(value || '')}</span>,
    },
    {
      key: 'country',
      label: '簽證',
      render: (value) => <span className="text-sm text-morandi-primary">{String(value || '')}</span>,
    },
    {
      key: 'status',
      label: '狀態',
      render: (value, visa) => (
        <span
          className={cn(
            'text-sm font-medium',
            visa.status === 'submitted'
              ? 'text-morandi-gold'
              : visa.status === 'issued'
                ? 'text-morandi-green'
                : 'text-morandi-secondary'
          )}
        >
          {getVisaStatusLabel(visa.status)}
        </span>
      ),
    },
    {
      key: 'submission_date',
      label: '送件時間',
      render: (value) => (
        <span className="text-sm text-morandi-secondary">
          {value ? new Date(String(value)).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'received_date',
      label: '下件時間',
      render: (value) => (
        <span className="text-sm text-morandi-secondary">
          {value ? new Date(String(value)).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'fee',
      label: '代辦費',
      render: (value) => (
        <span className="text-sm text-morandi-primary">NT$ {Number(value || 0).toLocaleString()}</span>
      ),
    },
  ]

  const renderActions = (visa: Visa) => {
    if (!canManageVisas) return null

    return (
      <div className="flex items-center gap-1">
        <button
          onClick={async e => {
            e.stopPropagation()
            const confirmed = await confirm({
              type: 'danger',
              title: '刪除簽證記錄',
              message: '確定要刪除此簽證記錄嗎？',
              details: ['此操作無法復原'],
              confirmLabel: '確認刪除',
              cancelLabel: '取消',
            })
            if (confirmed) {
              onDelete(visa.id)
            }
          }}
          className="p-1 text-morandi-red/60 hover:text-morandi-red hover:bg-morandi-red/10 rounded transition-colors"
          title="刪除"
        >
          <Trash2 size={14} />
        </button>
      </div>
    )
  }

  return (
    <>
      <EnhancedTable
        className="min-h-full"
        columns={columns}
        data={filteredVisas}
        loading={false}
        selection={
          canManageVisas
            ? {
                selected: selectedRows,
                onChange: onSelectionChange,
              }
            : undefined
        }
        actions={renderActions}
        bordered={true}
      />
      <ConfirmDialog {...confirmDialogProps} />
    </>
  )
}
