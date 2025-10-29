/**
 * SuppliersList - List view for suppliers
 */

'use client';

import React from 'react';
import { EnhancedTable, type TableColumn } from '@/components/ui/enhanced-table';
import { Badge } from '@/components/ui/badge';
import { Supplier } from '../types';
import { SUPPLIER_TYPE_LABELS } from '../constants';

interface SuppliersListProps {
  suppliers: Supplier[];
  loading?: boolean;
}

export const SuppliersList: React.FC<SuppliersListProps> = ({ suppliers, loading = false }) => {
  const columns: TableColumn[] = [
    {
      key: 'name',
      label: '供應商名稱',
      sortable: true,
      render: (value) => <span className="font-medium text-morandi-primary">{value}</span>,
    },
    {
      key: 'supplier_code',
      label: '供應商編號',
      sortable: true,
      render: (value) => <span className="text-morandi-primary">{value || '-'}</span>,
    },
    {
      key: 'country',
      label: '國家',
      sortable: true,
      render: (value) => <span className="text-morandi-primary">{value || '-'}</span>,
    },
    {
      key: 'location',
      label: '地點',
      sortable: true,
      render: (value) => <span className="text-morandi-primary">{value || '-'}</span>,
    },
    {
      key: 'type',
      label: '服務項目',
      sortable: true,
      render: (value) => (
        <Badge variant="secondary" className="text-xs">
          {SUPPLIER_TYPE_LABELS[value as Supplier['type']]}
        </Badge>
      ),
    },
  ];

  return (
    <EnhancedTable
      className="min-h-full"
      columns={columns}
      data={suppliers}
      loading={loading}
    />
  );
};
