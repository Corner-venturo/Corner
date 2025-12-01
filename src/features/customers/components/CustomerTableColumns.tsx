import { Customer } from '@/types/customer.types'
import { ColumnDef } from '@/components/ui/enhanced-table'
import { ActionCell, TextCell, BadgeCell, DateCell } from '@/components/table-cells'
import { format } from 'date-fns'

export function getCustomerTableColumns(
  onEdit: (customer: Customer) => void,
  onDelete: (id: string) => void
): ColumnDef<Customer>[] {
  return [
    {
      header: '客戶編號',
      accessorKey: 'code',
      cell: (row) => <TextCell value={row.code} className="font-mono" />,
      sortable: true,
    },
    {
      header: '姓名',
      accessorKey: 'name',
      cell: (row) => (
        <div>
          <div className="font-medium">{row.name}</div>
          {row.english_name && (
            <div className="text-xs text-morandi-secondary">{row.english_name}</div>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      header: '電話',
      accessorKey: 'phone',
      cell: (row) => <TextCell value={row.phone} />,
    },
    {
      header: 'Email',
      accessorKey: 'email',
      cell: (row) => <TextCell value={row.email} className="text-xs" />,
    },
    {
      header: 'VIP',
      accessorKey: 'is_vip',
      cell: (row) => {
        if (!row.is_vip) return <TextCell value="-" />

        const vipColors = {
          bronze: 'bg-orange-100 text-orange-700',
          silver: 'bg-gray-100 text-gray-700',
          gold: 'bg-yellow-100 text-yellow-700',
          platinum: 'bg-blue-100 text-blue-700',
          diamond: 'bg-purple-100 text-purple-700',
        }

        const vipLabels = {
          bronze: '銅卡',
          silver: '銀卡',
          gold: '金卡',
          platinum: '白金',
          diamond: '鑽石',
        }

        return (
          <BadgeCell
            value={vipLabels[row.vip_level || 'bronze']}
            className={vipColors[row.vip_level || 'bronze']}
          />
        )
      },
      sortable: true,
    },
    {
      header: '驗證狀態',
      accessorKey: 'verification_status',
      cell: (row) => {
        const statusConfig = {
          verified: { label: '已驗證', className: 'bg-emerald-100 text-emerald-700' },
          unverified: { label: '待驗證', className: 'bg-amber-100 text-amber-700' },
          rejected: { label: '已拒絕', className: 'bg-red-100 text-red-700' },
        }

        const config = statusConfig[row.verification_status || 'unverified']
        return <BadgeCell value={config.label} className={config.className} />
      },
      sortable: true,
    },
    {
      header: '訂單數',
      accessorKey: 'total_orders',
      cell: (row) => <TextCell value={row.total_orders?.toString() || '0'} />,
      sortable: true,
    },
    {
      header: '總消費',
      accessorKey: 'total_spent',
      cell: (row) => (
        <TextCell
          value={row.total_spent ? `NT$ ${row.total_spent.toLocaleString()}` : '-'}
        />
      ),
      sortable: true,
    },
    {
      header: '建立時間',
      accessorKey: 'created_at',
      cell: (row) => <DateCell value={row.created_at} />,
      sortable: true,
    },
    {
      header: '操作',
      accessorKey: 'id',
      cell: (row) => (
        <ActionCell
          onEdit={() => onEdit(row)}
          onDelete={() => onDelete(row.id)}
        />
      ),
    },
  ]
}
