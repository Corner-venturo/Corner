'use client'

/**
 * 開立代轉發票 Dialog
 * 可從發票管理頁面或訂單詳情頁面使用
 */

import React from 'react'
import { FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Order } from '@/types/order.types'
import type { Tour } from '@/types/tour.types'
import { InvoiceForm } from './invoice/InvoiceForm'
import { InvoicePreview } from './invoice/InvoicePreview'
import { useInvoiceDialog } from './invoice/hooks/useInvoiceDialog'
import { FINANCE_LABELS } from '@/features/finance/constants/labels'

interface InvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // 預設值（從訂單開啟時使用）
  defaultOrderId?: string
  defaultTourId?: string
  // 如果提供這些，就不需要選擇
  fixedOrder?: Order
  fixedTour?: Tour
}

export function InvoiceDialog({
  open,
  onOpenChange,
  defaultOrderId,
  defaultTourId,
  fixedOrder,
  fixedTour,
}: InvoiceDialogProps) {
  const {
    selectedTourId,
    selectedOrderId,
    invoiceDate,
    reportStatus,
    customNo,
    buyerInfo,
    items,
    remark,
    totalAmount,
    currentOrder,
    tourOptions,
    orderOptions,
    isLoading,
    ordersLoading,
    toursLoading,
    setSelectedTourId,
    setSelectedOrderId,
    setInvoiceDate,
    setReportStatus,
    setCustomNo,
    setBuyerInfo,
    setRemark,
    addItem,
    removeItem,
    updateItem,
    handleSubmit,
  } = useInvoiceDialog({
    open,
    onOpenChange,
    defaultOrderId,
    defaultTourId,
    fixedOrder,
    fixedTour,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent level={1} className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={20} />
            {FINANCE_LABELS.LABEL_953}
            {customNo && <span className="text-sm font-normal text-muted-foreground">（{customNo}）</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <InvoiceForm
            fixedOrder={fixedOrder}
            fixedTour={fixedTour}
            selectedTourId={selectedTourId}
            selectedOrderId={selectedOrderId}
            invoiceDate={invoiceDate}
            reportStatus={reportStatus}
            customNo={customNo}
            buyerInfo={buyerInfo}
            items={items}
            remark={remark}
            tourOptions={tourOptions}
            orderOptions={orderOptions}
            ordersLoading={ordersLoading}
            toursLoading={toursLoading}
            setSelectedTourId={setSelectedTourId}
            setSelectedOrderId={setSelectedOrderId}
            setInvoiceDate={setInvoiceDate}
            setReportStatus={setReportStatus}
            setCustomNo={setCustomNo}
            setBuyerInfo={setBuyerInfo}
            setRemark={setRemark}
            addItem={addItem}
            removeItem={removeItem}
            updateItem={updateItem}
          />

          <InvoicePreview
            totalAmount={totalAmount}
            currentOrder={currentOrder as Order | undefined}
          />

          {/* 按鈕 */}
          <div className="flex justify-center gap-4 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="min-w-[100px] gap-1">
              <X size={16} />
              {FINANCE_LABELS.CANCEL}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="min-w-[100px] bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              {isLoading ? FINANCE_LABELS.ISSUING : FINANCE_LABELS.ISSUE_INVOICE}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
