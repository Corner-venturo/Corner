/**
 * OrderSelectDialog - 訂單選擇對話框
 * 團體模式新增成員時選擇訂單
 */

'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface TourOrder {
  id: string
  order_number: string | null
}

interface OrderSelectDialogProps {
  isOpen: boolean
  orders: TourOrder[]
  onClose: () => void
  onSelect: (orderId: string) => void
}

export function OrderSelectDialog({
  isOpen,
  orders,
  onClose,
  onSelect,
}: OrderSelectDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>選擇訂單</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <p className="text-sm text-morandi-muted mb-4">
            請選擇要新增成員的訂單：
          </p>
          {orders.map((order) => (
            <Button
              key={order.id}
              variant="outline"
              className="w-full justify-start text-left"
              onClick={() => {
                onSelect(order.id)
                onClose()
              }}
            >
              {order.order_number || '未命名訂單'}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
