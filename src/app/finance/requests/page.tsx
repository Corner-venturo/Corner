'use client'

import { useState } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { EnhancedTable } from '@/components/ui/enhanced-table'
import { usePayments } from '@/features/payments/hooks/usePayments'
import { Plus, FileText } from 'lucide-react'
import { AddRequestDialog } from '@/features/finance/requests/components/AddRequestDialog'
import { BatchRequestDialog } from '@/features/finance/requests/components/BatchRequestDialog'
import { useRequestTable } from '@/features/finance/requests/hooks/useRequestTable'

export default function RequestsPage() {
  const { payment_requests } = usePayments()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false)

  const { tableColumns, filteredAndSortedRequests, handleSort, handleFilter } =
    useRequestTable(payment_requests)

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="請款管理"
        actions={
          <>
            <button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
            >
              <Plus size={16} className="mr-2" />
              新增請款
            </button>
            <button
              onClick={() => setIsBatchDialogOpen(true)}
              className="bg-morandi-primary hover:bg-morandi-primary/90 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
            >
              <FileText size={16} className="mr-2" />
              批次請款
            </button>
          </>
        }
      />

      <div className="flex-1 overflow-auto">
        <EnhancedTable
          className="min-h-full"
          columns={tableColumns}
          data={filteredAndSortedRequests}
          onSort={handleSort}
          onFilter={handleFilter}
          selection={undefined}
        />
      </div>

      <AddRequestDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />

      <BatchRequestDialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen} />
    </div>
  )
}
