'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { usePayments } from '@/features/payments/hooks/usePayments'
import { Plus, Layers, Loader2 } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useRequestTable } from '@/features/finance/requests/hooks/useRequestTable'
import { PaymentRequest } from '@/stores/types'

// Dynamic imports for dialogs (reduce initial bundle)
const AddRequestDialog = dynamic(
  () => import('@/features/finance/requests/components/AddRequestDialog').then(m => m.AddRequestDialog),
  { loading: () => null }
)
const BatchAllocateRequestDialog = dynamic(
  () => import('@/features/finance/requests/components/BatchAllocateRequestDialog').then(m => m.BatchAllocateRequestDialog),
  { loading: () => null }
)
const RequestDetailDialog = dynamic(
  () => import('@/features/finance/requests/components/RequestDetailDialog').then(m => m.RequestDetailDialog),
  {
    loading: () => (
      <Dialog open>
        <DialogContent className="bg-transparent border-none shadow-none flex items-center justify-center">
          <Loader2 className="animate-spin text-white" size={32} />
        </DialogContent>
      </Dialog>
    )
  }
)

export default function RequestsPage() {
  const { payment_requests, loadPaymentRequests } = usePayments()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null)

  // 載入資料（只執行一次）
  useEffect(() => {
    loadPaymentRequests()
     
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
              className="border border-morandi-gold text-morandi-gold hover:bg-morandi-gold hover:text-white px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
            >
              <Layers size={16} className="mr-2" />
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

      <BatchAllocateRequestDialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen} />

      <RequestDetailDialog
        request={selectedRequest}
        open={!!selectedRequest}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
      />
    </div>
  )
}
