'use client'

import { useState } from 'react'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { StatusCell, ActionCell, CurrencyCell } from '@/components/table-cells'
import { useEsims, deleteEsim } from '@/data'
import { STATUS_CONFIG } from '@/lib/status-config'
import { Button } from '@/components/ui/button'
import type { Esim } from '@/types/esim.types'
import { EsimSearchDialog } from '@/features/esims/components/EsimSearchDialog'
import { EsimCreateDialog } from '@/features/esims/components/EsimCreateDialog'
import { confirm } from '@/lib/ui/alert-dialog'
import { ESIMS_LABELS } from './constants/labels'

export default function EsimsPage() {
  const router = useRouter()
  const { items } = useEsims()
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [search, setSearch] = useState('')

  // 簡單的客戶端過濾
  const filteredItems = (items || []).filter((item: Esim) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      item.esim_number?.toLowerCase().includes(searchLower) ||
      item.group_code?.toLowerCase().includes(searchLower) ||
      item.order_number?.toLowerCase().includes(searchLower) ||
      item.supplier_order_number?.toLowerCase().includes(searchLower) ||
      item.email?.toLowerCase().includes(searchLower)
    )
  })

  const handleDelete = async (id: string) => {
    const confirmed = await confirm(ESIMS_LABELS.CONFIRM_DELETE, {
      title: ESIMS_LABELS.DELETE_TITLE,
      type: 'warning',
    })
    if (confirmed) {
      try {
        await deleteEsim(id)
      } catch (error) {
        const { alert } = await import('@/lib/ui/alert-dialog')
        await alert(ESIMS_LABELS.DELETE_FAILED, 'error')
      }
    }
  }

  const handleRowClick = (esim: Esim) => {
    router.push(`/esims/${esim.esim_number}`)
  }

  const columns = [
    {
      key: 'esim_number',
      label: ESIMS_LABELS.COL_ESIM_NUMBER,
      render: (_: unknown, row: Esim) => (
        <button
          onClick={() => handleRowClick(row)}
          className="font-medium text-morandi-primary hover:underline"
        >
          {row.esim_number}
        </button>
      ),
    },
    {
      key: 'tour_name',
      label: ESIMS_LABELS.COL_TOUR_NAME,
      render: (_: unknown, row: Esim) => (
        <span className="text-morandi-text-primary">{row.tour?.name || row.group_code}</span>
      ),
    },
    {
      key: 'order_number',
      label: ESIMS_LABELS.COL_ORDER_NUMBER,
      render: (_: unknown, row: Esim) => (
        <span className="text-morandi-text-primary">{row.order_number || '-'}</span>
      ),
    },
    {
      key: 'product_id',
      label: ESIMS_LABELS.COL_PRODUCT_ID,
      render: (_: unknown, row: Esim) => (
        <span className="text-morandi-text-secondary text-xs">{row.product_id || '-'}</span>
      ),
    },
    {
      key: 'quantity',
      label: ESIMS_LABELS.COL_QUANTITY,
      render: (_: unknown, row: Esim) => (
        <span className="text-morandi-text-primary">{row.quantity} {ESIMS_LABELS.QUANTITY_UNIT}</span>
      ),
    },
    {
      key: 'price',
      label: ESIMS_LABELS.COL_UNIT_PRICE,
      render: (_: unknown, row: Esim) => (
        row.price ? <CurrencyCell amount={row.price} /> : <span className="text-morandi-text-secondary">-</span>
      ),
    },
    {
      key: 'total_amount',
      label: ESIMS_LABELS.COL_TOTAL,
      render: (_: unknown, row: Esim) => (
        row.price ? <CurrencyCell amount={row.price * row.quantity} /> : <span className="text-morandi-text-secondary">-</span>
      ),
    },
    {
      key: 'supplier_order_number',
      label: ESIMS_LABELS.COL_SUPPLIER_ORDER,
      render: (_: unknown, row: Esim) => (
        <span className="text-morandi-text-secondary text-xs font-mono">
          {row.supplier_order_number || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      label: ESIMS_LABELS.COL_STATUS,
      render: (_: unknown, row: Esim) => (
        <StatusCell type="esim" status={row.status?.toString() || '0'} />
      ),
    },
    {
      key: 'actions',
      label: ESIMS_LABELS.COL_ACTIONS,
      render: (_: unknown, row: Esim) => (
        <ActionCell
          actions={[
            { icon: Edit2, label: ESIMS_LABELS.ACTION_EDIT, onClick: () => router.push(`/esims/${row.esim_number}`) },
            { icon: Trash2, label: ESIMS_LABELS.ACTION_DELETE, onClick: () => handleDelete(row.id), variant: 'danger' },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <ListPageLayout
        title={ESIMS_LABELS.PAGE_TITLE}
        data={filteredItems}
        columns={columns}
        searchPlaceholder={ESIMS_LABELS.SEARCH_PLACEHOLDER}
        headerActions={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsSearchDialogOpen(true)}>
              <Search className="h-4 w-4 mr-2" />
              {ESIMS_LABELS.ADVANCED_SEARCH}
            </Button>
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              {ESIMS_LABELS.ADD_ESIM}
            </button>
          </div>
        }
      />

      <EsimSearchDialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen} />
      <EsimCreateDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </>
  )
}
