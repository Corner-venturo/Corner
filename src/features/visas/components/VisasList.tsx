'use client'

import { Edit2, Trash2 } from 'lucide-react'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { DateCell, CurrencyCell, TextCell, ActionCell } from '@/components/table-cells'
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
      label: '申請人',
      width: '100',
      sortable: true,
      render: (value) => <TextCell text={String(value || '')} />,
    },
    {
      key: 'contact_person',
      label: '聯絡人',
      width: '100',
      render: (value) => <TextCell text={String(value || '')} />,
    },
    {
      key: 'contact_phone',
      label: '電話',
      width: '110',
      render: (value) => <TextCell text={String(value || '')} />,
    },
    {
      key: 'country',
      label: '簽證',
      width: '80',
      render: (value) => <TextCell text={String(value || '')} />,
    },
    {
      key: 'is_urgent',
      label: '急件',
      width: '50',
      render: (value) => (
        <span className={cn('text-sm', value ? 'text-morandi-red font-medium' : 'text-morandi-secondary')}>
          {value ? '是' : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      label: '狀態',
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
      label: '收件',
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
      label: '送件',
      width: '100',
      render: (value) => <DateCell date={value as string | null} />,
    },
    {
      key: 'expected_issue_date',
      label: '預計下件',
      width: '100',
      render: (value) => <DateCell date={value as string | null} />,
    },
    {
      key: 'vendor',
      label: '送件單位',
      width: '100',
      render: (value) => <TextCell text={typeof value === 'string' ? value : ''} />,
    },
    {
      key: 'documents_returned_date',
      label: '歸還',
      width: '100',
      render: (value) => <DateCell date={value as string | null} />,
    },
    {
      key: 'fee',
      label: '代辦費',
      width: '90',
      render: (value) => <CurrencyCell amount={Number(value || 0)} />,
    },
    {
      key: 'cost',
      label: '成本',
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
            label: '編輯',
            onClick: () => onEdit?.(visa),
          },
          {
            icon: Trash2,
            label: '刪除',
            variant: 'danger',
            onClick: async () => {
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
