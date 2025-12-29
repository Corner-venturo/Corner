'use client'

import React from 'react'
import { Tour } from '@/stores/types'
import { DollarSign, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTourPayments } from './hooks/useTourPayments'
import { PaymentSummary } from './components/PaymentSummary'
import { PaymentRow } from './components/PaymentRow'
import { AddPaymentDialog } from './components/AddPaymentDialog'
import { InvoiceDialog } from './components/InvoiceDialog'

interface TourPaymentsProps {
  tour: Tour
  orderFilter?: string
  triggerAdd?: boolean
  onTriggerAddComplete?: () => void
  showSummary?: boolean
}

export const TourPayments = React.memo(function TourPayments({
  tour,
  orderFilter,
  triggerAdd,
  onTriggerAddComplete,
  showSummary = true,
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
            新增收款
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
                  收款紀錄
                </th>
              </tr>
              {/* 欄位標題行 */}
              <tr className="bg-morandi-container/30">
                <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                  日期
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                  類型
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                  金額
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                  說明
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                  付款方式
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                  訂單
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                  狀態
                </th>
                <th className="text-center py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                  操作
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
                    <p>尚無收款紀錄</p>
                    <p className="text-sm mt-1">點擊上方「新增收款」按鈕開始記錄收款</p>
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
