'use client'

import { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { StatusCell, ActionCell } from '@/components/table-cells'
import { useEsimStore } from '@/stores/esim-store'
import { STATUS_CONFIG } from '@/lib/status-config'
import { Button } from '@/components/ui/button'
import type { Esim } from '@/types/esim.types'
import { EsimSearchDialog } from '@/features/esims/components/EsimSearchDialog'
import { EsimCreateDialog } from '@/features/esims/components/EsimCreateDialog'

export default function EsimsPage() {
  const router = useRouter()
  const { items, remove, fetchAll: fetchEsims } = useEsimStore()
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [search, setSearch] = useState('')

  // 載入資料
  useEffect(() => {
    fetchEsims()
  }, [])

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
    if (window.confirm('確定要刪除此網卡嗎？')) {
      await remove(id)
    }
  }

  const handleRowClick = (esim: Esim) => {
    router.push(`/esims/${esim.esim_number}`)
  }

  const columns = [
    {
      key: 'esim_number',
      label: '網卡單號',
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
      label: '團名',
      render: (_: unknown, row: Esim) => (
        <span className="text-morandi-text-primary">{row.tour?.name || row.group_code}</span>
      ),
    },
    {
      key: 'order_number',
      label: '訂單編號',
      render: (_: unknown, row: Esim) => (
        <span className="text-morandi-text-primary">{row.order_number || '-'}</span>
      ),
    },
    {
      key: 'product_id',
      label: '商品ID',
      render: (_: unknown, row: Esim) => (
        <span className="text-morandi-text-secondary text-xs">{row.product_id || '-'}</span>
      ),
    },
    {
      key: 'quantity',
      label: '數量',
      render: (_: unknown, row: Esim) => (
        <span className="text-morandi-text-primary">{row.quantity} 張</span>
      ),
    },
    {
      key: 'price',
      label: '單價',
      render: (_: unknown, row: Esim) => (
        <span className="text-morandi-text-primary font-medium">
          {row.price ? `$${row.price}` : '-'}
        </span>
      ),
    },
    {
      key: 'total_amount',
      label: '總金額',
      render: (_: unknown, row: Esim) => (
        <span className="text-morandi-gold font-semibold">
          {row.price ? `$${row.price * row.quantity}` : '-'}
        </span>
      ),
    },
    {
      key: 'supplier_order_number',
      label: '供應商訂單號',
      render: (_: unknown, row: Esim) => (
        <span className="text-morandi-text-secondary text-xs font-mono">
          {row.supplier_order_number || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      label: '狀態',
      render: (_: unknown, row: Esim) => (
        <StatusCell status={row.status} config={STATUS_CONFIG.esim} />
      ),
    },
    {
      key: 'actions',
      label: '操作',
      render: (_: unknown, row: Esim) => (
        <ActionCell
          onEdit={() => router.push(`/esims/${row.esim_number}`)}
          onDelete={() => handleDelete(row.id)}
        />
      ),
    },
  ]

  return (
    <>
      <ListPageLayout
        title="網卡管理"
        data={filteredItems}
        columns={columns}
        searchPlaceholder="搜尋網卡單號、團號、訂單編號..."
        headerActions={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsSearchDialogOpen(true)}>
              <Search className="h-4 w-4 mr-2" />
              詳細搜尋
            </Button>
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              新增網卡
            </button>
          </div>
        }
      />

      <EsimSearchDialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen} />
      <EsimCreateDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </>
  )
}
