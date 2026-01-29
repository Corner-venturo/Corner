/**
 * OrderSelectDialog - 訂單選擇對話框
 * 團體模式新增成員時選擇訂單
 */

'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { Check, X } from 'lucide-react'

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
  const [selectedOrderId, setSelectedOrderId] = useState<string>('')

  // 將 orders 轉換為 Combobox 選項格式
  const orderOptions = orders.map((order) => ({
    value: order.id,
    label: order.order_number || '未命名訂單',
    data: order,
  }))

  const handleConfirm = () => {
    if (selectedOrderId) {
      onSelect(selectedOrderId)
      onClose()
      setSelectedOrderId('')
    }
  }

  const handleClose = () => {
    onClose()
    setSelectedOrderId('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        nested level={2}
        className="max-w-md"
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement
          if (
            target.closest('[role="listbox"]') ||
            target.closest('[data-radix-select-viewport]') ||
            target.closest('[cmdk-root]')
          ) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>選擇訂單</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <label className="text-sm font-medium text-morandi-primary mb-2 block">
            請選擇要新增成員的訂單
          </label>
          <Combobox
            options={orderOptions}
            value={selectedOrderId}
            onChange={setSelectedOrderId}
            placeholder="搜尋或選擇訂單..."
            emptyMessage="找不到符合的訂單"
            showSearchIcon
            showClearButton
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} className="gap-2">
            <X size={16} />
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedOrderId}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
          >
            <Check size={16} />
            選擇訂單
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
