'use client'

import React from 'react'
import type { Order } from '@/stores/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, X } from 'lucide-react'

interface AddPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tourOrders: Order[]
  selectedOrderId: string
  onSelectedOrderIdChange: (id: string) => void
  newPayment: {
    amount: number
    description: string
    method: string
    status: '已確認' | '待確認'
  }
  onNewPaymentChange: (payment: { amount: number; description: string; method: string; status: '已確認' | '待確認' }) => void
  onAddPayment: () => void
}

export const AddPaymentDialog = React.memo(function AddPaymentDialog({
  open,
  onOpenChange,
  tourOrders,
  selectedOrderId,
  onSelectedOrderIdChange,
  newPayment,
  onNewPaymentChange,
  onAddPayment,
}: AddPaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新增收款紀錄</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary">關聯訂單 (選填)</label>
            <Select value={selectedOrderId || '__none__'} onValueChange={(v) => onSelectedOrderIdChange(v === '__none__' ? '' : v)}>
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="- 不關聯特定訂單 -" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">- 不關聯特定訂單 -</SelectItem>
                {tourOrders.map(order => (
                  <SelectItem key={order.id} value={order.id}>
                    {order.order_number} - {order.contact_person}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-morandi-primary">收款金額</label>
            <Input
              type="number"
              value={newPayment.amount || ''}
              onChange={e =>
                onNewPaymentChange({ ...newPayment, amount: Number(e.target.value) })
              }
              placeholder="0"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-morandi-primary">收款說明</label>
            <Input
              value={newPayment.description}
              onChange={e => onNewPaymentChange({ ...newPayment, description: e.target.value })}
              placeholder="例：王小明訂金"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-morandi-primary">付款方式</label>
            <Select
              value={newPayment.method}
              onValueChange={value => onNewPaymentChange({ ...newPayment, method: value })}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">銀行轉帳</SelectItem>
                <SelectItem value="credit_card">信用卡</SelectItem>
                <SelectItem value="cash">現金</SelectItem>
                <SelectItem value="check">支票</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-morandi-primary">確認狀態</label>
            <Select
              value={newPayment.status}
              onValueChange={value =>
                onNewPaymentChange({ ...newPayment, status: value as '已確認' | '待確認' })
              }
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="已確認">已確認</SelectItem>
                <SelectItem value="待確認">待確認</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" className="gap-2" onClick={() => onOpenChange(false)}>
              <X size={16} />
              取消
            </Button>
            <Button
              onClick={onAddPayment}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
            >
              <Plus size={16} />
              新增
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})
