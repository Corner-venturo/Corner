'use client'

import { useState, useEffect } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { usePayments } from '@/features/payments/hooks/usePayments'
import { Plus, FileText } from 'lucide-react'
import { AddRequestDialog } from '@/features/finance/requests/components/AddRequestDialog'
import { BatchRequestDialog } from '@/features/finance/requests/components/BatchRequestDialog'
import { RequestDetailDialog } from '@/features/finance/requests/components/RequestDetailDialog'
import { useRequestTable } from '@/features/finance/requests/hooks/useRequestTable'
import { PaymentRequest } from '@/stores/types'

export default function RequestsPage() {
  const { payment_requests, loadPaymentRequests } = usePayments()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null)

  // 載入資料（只執行一次）
  useEffect(() => {
    loadPaymentRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { tableColumns, filteredAndSortedRequests, handleSort, handleFilter } =
    useRequestTable(payment_requests)

  // 點擊行打開詳細對話框
  const handleRowClick = (request: PaymentRequest) => {
    setSelectedRequest(request)
  }

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
          columns={tableColumns as TableColumn[]}
          data={filteredAndSortedRequests}
          onSort={handleSort}
          onRowClick={handleRowClick}
          selection={undefined}
        />
      </div>

      <AddRequestDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />

      <BatchRequestDialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen} />

      <RequestDetailDialog
        request={selectedRequest}
        open={!!selectedRequest}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
      />
    </div>
  )
}
