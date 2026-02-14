'use client'

import React from 'react'
import { Tour } from '@/stores/types'
import { DollarSign, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTourPayments } from '../hooks/useTourPayments'
import { PaymentSummary } from './PaymentSummary'
import { PaymentRow } from './PaymentRow'
import { AddPaymentDialog } from './AddPaymentDialog'
import { InvoiceDialog } from './InvoiceDialog'
import { COMP_TOURS_LABELS } from '../constants/labels'

interface TourPaymentsProps {
  tour: Tour
  orderFilter?: string
  triggerAdd?: boolean
  onTriggerAddComplete?: () => void
  showSummary?: boolean
  onChildDialogChange?: (hasOpen: boolean) => void
}

export const TourPayments = React.memo(function TourPayments({
  tour,
  orderFilter,
  triggerAdd,
  onTriggerAddComplete,
  showSummary = true,
  onChildDialogChange,
}: TourPaymentsProps) {
  const {
    // 資料
    tourOrders,
    tourPayments,

    // 統計
    totalConfirmed,
    totalPending,
    totalPayments,
    remaining_amount,

    // 新增收款對話框狀態
    isAddDialogOpen,
    setIsAddDialogOpen,
    selectedOrderId,
    setSelectedOrderId,
    newPayment,
    setNewPayment,
    handleAddPayment,

    // 發票對話框狀態
    isInvoiceDialogOpen,
    setIsInvoiceDialogOpen,
    invoiceOrderId,
    setInvoiceOrderId,
    invoiceDate,
    setInvoiceDate,
    reportStatus,
    setReportStatus,
    invoiceBuyer,
    setInvoiceBuyer,
    invoiceItems,
    setInvoiceItems,
    invoiceRemark,
    setInvoiceRemark,
    invoiceTotal,
    isInvoiceLoading,

    // 發票相關函數
    addInvoiceItem,
    removeInvoiceItem,
    updateInvoiceItem,
    openInvoiceDialog,
    handleIssueInvoice,
  } = useTourPayments({ tour, orderFilter, triggerAdd, onTriggerAddComplete })

  // 注意：已移除 onChildDialogChange 邏輯，改用 Dialog level 系統處理多重遮罩

  return (
    <div className="space-y-4">
      {/* 統計 + 新增按鈕 */}
      {showSummary && (
        <div className="flex items-center justify-between">
          <PaymentSummary
            totalConfirmed={totalConfirmed}
            totalPending={totalPending}
            totalPayments={totalPayments}
            remaining_amount={remaining_amount}
          />
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            size="sm"
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            <Plus size={14} className="mr-1" />
            {COMP_TOURS_LABELS.ADD_3548}
          </Button>
        </div>
      )}

      {/* 收款紀錄表格 */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {/* 區塊標題行 */}
              <tr className="bg-morandi-container/50 border-b border-border/60">
                <th colSpan={8} className="text-left py-2 px-4 text-sm font-medium text-morandi-primary">
                  {COMP_TOURS_LABELS.LABEL_8600}
                </th>
              </tr>
              {/* 欄位標題行 */}
              <tr className="bg-morandi-container/30">
                <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                  {COMP_TOURS_LABELS.日期}
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                  {COMP_TOURS_LABELS.TYPE}
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                  {COMP_TOURS_LABELS.AMOUNT}
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                  {COMP_TOURS_LABELS.LABEL_5591}
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                  {COMP_TOURS_LABELS.LABEL_7778}
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                  {COMP_TOURS_LABELS.訂單}
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                  {COMP_TOURS_LABELS.STATUS}
                </th>
                <th className="text-center py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                  {COMP_TOURS_LABELS.ACTIONS}
                </th>
              </tr>
            </thead>
            <tbody>
              {tourPayments.length > 0 ? (
                tourPayments.map(payment => {
                  const relatedOrder = tourOrders.find(order => order.id === payment.order_id)
                  return (
                    <PaymentRow
                      key={payment.id}
                      payment={payment}
                      relatedOrder={relatedOrder}
                      onOpenInvoice={openInvoiceDialog}
                    />
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-morandi-secondary">
                    <DollarSign size={24} className="mx-auto mb-4 opacity-50" />
                    <p>{COMP_TOURS_LABELS.EMPTY_3087}</p>
                    <p className="text-sm mt-1">{COMP_TOURS_LABELS.ADD_6738}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新增收款對話框 */}
      <AddPaymentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        tourOrders={tourOrders}
        selectedOrderId={selectedOrderId}
        onSelectedOrderIdChange={setSelectedOrderId}
        newPayment={newPayment}
        onNewPaymentChange={setNewPayment}
        onAddPayment={handleAddPayment}
      />

      {/* 開立代轉發票對話框 */}
      <InvoiceDialog
        open={isInvoiceDialogOpen}
        onOpenChange={setIsInvoiceDialogOpen}
        tourOrders={tourOrders}
        invoiceOrderId={invoiceOrderId}
        onInvoiceOrderIdChange={setInvoiceOrderId}
        invoiceDate={invoiceDate}
        onInvoiceDateChange={setInvoiceDate}
        reportStatus={reportStatus}
        onReportStatusChange={setReportStatus}
        invoiceBuyer={invoiceBuyer}
        onInvoiceBuyerChange={setInvoiceBuyer}
        invoiceItems={invoiceItems}
        onAddInvoiceItem={addInvoiceItem}
        onRemoveInvoiceItem={removeInvoiceItem}
        onUpdateInvoiceItem={updateInvoiceItem}
        invoiceRemark={invoiceRemark}
        onInvoiceRemarkChange={setInvoiceRemark}
        invoiceTotal={invoiceTotal}
        isInvoiceLoading={isInvoiceLoading}
        onIssueInvoice={handleIssueInvoice}
      />
    </div>
  )
})
