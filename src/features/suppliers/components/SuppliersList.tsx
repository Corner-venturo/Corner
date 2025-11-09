/**
 * SuppliersList - 供應商列表（含類別顯示）
 */

'use client'

import React, { useMemo } from 'react'
import { EnhancedTable, type TableColumn } from '@/components/ui/enhanced-table'
import { Badge } from '@/components/ui/badge'
import { Supplier } from '../types'
import { useSupplierCategoryStore } from '@/stores'

interface SuppliersListProps {
  suppliers: Supplier[]
  loading?: boolean
}

export const SuppliersList: React.FC<SuppliersListProps> = ({ suppliers, loading = false }) => {
  const { items: categories } = useSupplierCategoryStore()

  // 建立類別 lookup
  const categoryMap = useMemo(() => {
    const map = new Map()
    categories.forEach(cat => map.set(cat.id, cat))
    return map
  }, [categories])

  const columns: TableColumn[] = [
    {
      key: 'name',
      label: '供應商名稱',
      sortable: true,
      render: value => <span className="font-medium text-morandi-primary">{value}</span>,
    },
    {
      key: 'category_id',
      label: '類別',
      sortable: true,
      render: (value: string) => {
        const category = categoryMap.get(value)
        if (!category) return <span className="text-morandi-muted">-</span>
        return (
          <Badge variant="secondary" className="text-xs">
            {category.icon && <span className="mr-1">{category.icon}</span>}
            {category.name}
          </Badge>
        )
      },
    },
    {
      key: 'bank_name',
      label: '銀行名稱',
      sortable: true,
      render: value => <span className="text-morandi-primary">{value || '-'}</span>,
    },
    {
      key: 'bank_account',
      label: '銀行帳號',
      sortable: true,
      render: value => <span className="text-morandi-secondary">{value || '-'}</span>,
    },
    {
      key: 'notes',
      label: '備註',
      sortable: false,
      render: value => <span className="text-sm text-morandi-muted">{value || '-'}</span>,
    },
  ]

  return (
    <EnhancedTable className="min-h-full" columns={columns} data={suppliers} loading={loading} />
  )
}
