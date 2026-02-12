'use client'

import { Edit2, Trash2 } from 'lucide-react'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { DateCell, CurrencyCell, TextCell, ActionCell } from '@/components/table-cells'
import { cn } from '@/lib/utils'
import { getVisaStatusLabel } from '@/lib/constants/status-maps'
import type { Visa } from '@/stores/types'
import { ConfirmDialog } from '@/components/dialog/confirm-dialog'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { VISA_LIST_LABELS as L } from '../constants/labels'

interface VisasListProps {
  filteredVisas: Visa[]
  canManageVisas: boolean
  selectedRows: string[]
  onSelectionChange: (rows: string[]) => void
  onDelete: (id: string) => void
  onUpdateStatus: (id: string, status: Visa['status']) => void
  onEdit?: (visa: Visa) => void
}

export function VisasList({
  filteredVisas,
  canManageVisas,
  selectedRows,
  onSelectionChange,
  onDelete,
  onUpdateStatus,
  onEdit,
}: VisasListProps) {
  const { confirm, confirmDialogProps } = useConfirmDialog()

  // Table 欄位定義
  const columns: TableColumn[] = [
    {
      key: 'applicant_name',
      label: L.col_applicant,
      width: '100',
      sortable: true,
      render: (value) => <TextCell text={String(value || '')} />,
    },
    {
      key: 'contact_person',
      label: L.col_contact,
      width: '100',
      render: (value) => <TextCell text={String(value || '')} />,
    },
    {
      key: 'contact_phone',
      label: L.col_phone,
      width: '110',
      render: (value) => <TextCell text={String(value || '')} />,
    },
    {
      key: 'country',
      label: L.col_visa,
      width: '80',
      render: (value) => <TextCell text={String(value || '')} />,
    },
    {
      key: 'is_urgent',
      label: L.col_urgent,
      width: '50',
      render: (value) => (
        <span className={cn('text-sm', value ? 'text-morandi-red font-medium' : 'text-morandi-secondary')}>
          {value ? L.urgent_yes : L.urgent_no}
        </span>
      ),
    },
    {
      key: 'status',
      label: L.col_status,
      width: '80',
      render: (value, rowData) => {
        const visa = rowData as Visa
        const statusColors: Record<string, string> = {
          pending: 'text-morandi-gold',
          submitted: 'text-morandi-primary',
          collected: 'text-morandi-green',
          rejected: 'text-morandi-red',
          returned: 'text-morandi-secondary',
        }
        return (
          <span className={cn('text-sm font-medium', statusColors[visa.status] || 'text-morandi-secondary')}>
            {getVisaStatusLabel(visa.status)}
          </span>
        )
      },
    },
    {
      key: 'received_date',
      label: L.col_received,
      width: '100',
      render: (value, rowData) => {
        const visa = rowData as Visa
        // 優先用新欄位，向後相容舊欄位
        const date = value || visa.submission_date
        return <DateCell date={date as string | null} />
      },
    },
    {
      key: 'actual_submission_date',
      label: L.col_submitted,
      width: '100',
      render: (value) => <DateCell date={value as string | null} />,
    },
    {
      key: 'expected_issue_date',
      label: L.col_expected,
      width: '100',
      render: (value) => <DateCell date={value as string | null} />,
    },
    {
      key: 'vendor',
      label: L.col_vendor,
      width: '100',
      render: (value) => <TextCell text={typeof value === 'string' ? value : ''} />,
    },
    {
      key: 'documents_returned_date',
      label: L.col_returned,
      width: '100',
      render: (value) => <DateCell date={value as string | null} />,
    },
    {
      key: 'fee',
      label: L.col_fee,
      width: '90',
      render: (value) => <CurrencyCell amount={Number(value || 0)} />,
    },
    {
      key: 'cost',
      label: L.col_cost,
      width: '90',
      render: (value) => <CurrencyCell amount={Number(value || 0)} variant="default" />,
    },
  ]

  const renderActions = (rowData: unknown) => {
    const visa = rowData as Visa
    if (!canManageVisas) return null

    return (
      <ActionCell
        actions={[
          {
            icon: Edit2,
            label: L.action_edit,
            onClick: () => onEdit?.(visa),
          },
          {
            icon: Trash2,
            label: L.action_delete,
            variant: 'danger',
            onClick: async () => {
              const confirmed = await confirm({
                type: 'danger',
                title: L.confirm_delete_title,
                message: L.confirm_delete_message,
                details: [L.confirm_delete_detail],
                confirmLabel: L.confirm_delete_ok,
                cancelLabel: L.confirm_delete_cancel,
              })
              if (confirmed) {
                onDelete(visa.id)
              }
            },
          },
        ]}
      />
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
