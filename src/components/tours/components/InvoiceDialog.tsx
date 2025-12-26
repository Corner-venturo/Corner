'use client'

import React from 'react'
import { Order } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Plus, Trash2 } from 'lucide-react'
import { TravelInvoiceItem, BuyerInfo } from '@/stores/useTravelInvoiceStore'

interface InvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tourOrders: Order[]
  invoiceOrderId: string
  onInvoiceOrderIdChange: (id: string) => void
  invoiceDate: string
  onInvoiceDateChange: (date: string) => void
  reportStatus: 'unreported' | 'reported'
  onReportStatusChange: (status: 'unreported' | 'reported') => void
  invoiceBuyer: BuyerInfo
  onInvoiceBuyerChange: (buyer: BuyerInfo) => void
  invoiceItems: TravelInvoiceItem[]
  onAddInvoiceItem: () => void
  onRemoveInvoiceItem: (index: number) => void
  onUpdateInvoiceItem: (index: number, field: keyof TravelInvoiceItem, value: unknown) => void
  invoiceRemark: string
  onInvoiceRemarkChange: (remark: string) => void
  invoiceTotal: number
  isInvoiceLoading: boolean
  onIssueInvoice: () => void
}

export const InvoiceDialog = React.memo(function InvoiceDialog({
  open,
  onOpenChange,
  tourOrders,
  invoiceOrderId,
  onInvoiceOrderIdChange,
  invoiceDate,
  onInvoiceDateChange,
  reportStatus,
  onReportStatusChange,
  invoiceBuyer,
  onInvoiceBuyerChange,
  invoiceItems,
  onAddInvoiceItem,
  onRemoveInvoiceItem,
  onUpdateInvoiceItem,
  invoiceRemark,
  onInvoiceRemarkChange,
  invoiceTotal,
  isInvoiceLoading,
  onIssueInvoice,
}: InvoiceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={20} />
            開立代轉發票
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 基本資訊 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>開立日期</Label>
              <DatePicker
                value={invoiceDate}
                onChange={(date) => onInvoiceDateChange(date)}
                placeholder="選擇日期"
              />
            </div>
            <div>
              <Label>關聯訂單</Label>
              <Select
                value={invoiceOrderId}
                onValueChange={orderId => {
                  onInvoiceOrderIdChange(orderId)
                  if (orderId) {
                    const order = tourOrders.find(o => o.id === orderId)
                    if (order) {
                      onInvoiceBuyerChange({
                        ...invoiceBuyer,
                        buyerName: order.contact_person || '',
                        buyerMobile: order.contact_phone || '',
                      })
                    }
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="- 不關聯訂單 -" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">- 不關聯訂單 -</SelectItem>
                  {tourOrders.map(order => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.order_number} - {order.contact_person}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>申報註記</Label>
              <div className="flex items-center gap-4 h-10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="invoiceReportStatus"
                    checked={reportStatus === 'unreported'}
                    onChange={() => onReportStatusChange('unreported')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">未申報</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="invoiceReportStatus"
                    checked={reportStatus === 'reported'}
                    onChange={() => onReportStatusChange('reported')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">已申報</span>
                </label>
              </div>
            </div>
          </div>

          {/* 買受人資訊 */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h4 className="font-medium mb-3">買受人資訊</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>買受人名稱 *</Label>
                <Input
                  value={invoiceBuyer.buyerName}
                  onChange={e => onInvoiceBuyerChange({ ...invoiceBuyer, buyerName: e.target.value })}
                  placeholder="請輸入買受人名稱"
                />
              </div>
              <div>
                <Label>統一編號</Label>
                <Input
                  value={invoiceBuyer.buyerUBN || ''}
                  onChange={e => onInvoiceBuyerChange({ ...invoiceBuyer, buyerUBN: e.target.value })}
                  placeholder="8 碼數字"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={invoiceBuyer.buyerEmail || ''}
                  onChange={e => onInvoiceBuyerChange({ ...invoiceBuyer, buyerEmail: e.target.value })}
                  placeholder="用於寄送電子收據"
                />
              </div>
              <div>
                <Label>手機號碼</Label>
                <Input
                  value={invoiceBuyer.buyerMobile || ''}
                  onChange={e => onInvoiceBuyerChange({ ...invoiceBuyer, buyerMobile: e.target.value })}
                  placeholder="09xxxxxxxx"
                />
              </div>
            </div>
          </div>

          {/* 商品明細 - 表格式 */}
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted/50 text-sm font-medium text-muted-foreground">
              <div className="col-span-4">摘要</div>
              <div className="col-span-1 text-center">數量</div>
              <div className="col-span-2 text-right">單價</div>
              <div className="col-span-2 text-center">單位</div>
              <div className="col-span-2 text-right">金額</div>
              <div className="col-span-1 text-center">處理</div>
            </div>

            <div className="divide-y">
              {invoiceItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 px-3 py-2 items-center">
                  <div className="col-span-4">
                    <Input
                      value={item.item_name}
                      onChange={e => onUpdateInvoiceItem(index, 'item_name', e.target.value)}
                      placeholder="商品名稱"
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      min="1"
                      value={item.item_count}
                      onChange={e => onUpdateInvoiceItem(index, 'item_count', parseInt(e.target.value) || 1)}
                      className="h-8 text-center"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      value={item.item_price || ''}
                      onChange={e => onUpdateInvoiceItem(index, 'item_price', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="h-8 text-right"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={item.item_unit}
                      onChange={e => onUpdateInvoiceItem(index, 'item_unit', e.target.value)}
                      className="h-8 text-center"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="h-8 flex items-center justify-end px-2 bg-muted/30 rounded text-sm font-medium">
                      {item.itemAmt.toLocaleString()}
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveInvoiceItem(index)}
                      disabled={invoiceItems.length <= 1}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-3 py-2 border-t">
              <Button type="button" variant="outline" size="sm" onClick={onAddInvoiceItem}>
                <Plus className="mr-1 h-4 w-4" />
                新增一列
              </Button>
            </div>

            {/* 備註 */}
            <div className="px-3 py-2 border-t">
              <div className="flex items-center gap-3">
                <Label className="shrink-0">備註</Label>
                <Input
                  value={invoiceRemark}
                  onChange={e => onInvoiceRemarkChange(e.target.value.slice(0, 50))}
                  placeholder="請輸入備註（限 50 字）"
                  maxLength={50}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground shrink-0">
                  {invoiceRemark.length}/50
                </span>
              </div>
            </div>

            {/* 總計 */}
            <div className="px-3 py-3 border-t bg-muted/30">
              <div className="flex justify-end items-center gap-4">
                <span className="text-sm font-medium">總計</span>
                <span className="text-lg font-bold text-primary">
                  NT$ {invoiceTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 超開提醒 */}
          {invoiceOrderId && (() => {
            const order = tourOrders.find(o => o.id === invoiceOrderId)
            if (order && invoiceTotal > (order.paid_amount ?? 0)) {
              return (
                <div className="p-3 bg-status-warning-bg border border-status-warning/30 rounded-md text-sm text-status-warning">
                  ⚠️ 發票金額超過已收款金額！已收款：NT$ {(order.paid_amount ?? 0).toLocaleString()}
                </div>
              )
            }
            return null
          })()}

          {/* 按鈕 */}
          <div className="flex justify-center gap-4 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="min-w-[100px]"
            >
              取消
            </Button>
            <Button
              onClick={onIssueInvoice}
              disabled={isInvoiceLoading}
              className="min-w-[100px]"
            >
              {isInvoiceLoading ? '開立中...' : '確定開立'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})
