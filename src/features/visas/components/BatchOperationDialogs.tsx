'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DatePicker } from '@/components/ui/date-picker'
import { X, Check } from 'lucide-react'

interface BatchPickupDialogProps {
  open: boolean
  selectedCount: number
  pickupDate: string
  onPickupDateChange: (date: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export function BatchPickupDialog({
  open,
  selectedCount,
  pickupDate,
  onPickupDateChange,
  onConfirm,
  onCancel,
}: BatchPickupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>批次取件</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-morandi-secondary">
            已選擇 <span className="font-semibold text-morandi-primary">{selectedCount}</span> 筆簽證
          </p>
          <div>
            <label className="text-sm font-medium text-morandi-primary">取件日期</label>
            <DatePicker
              value={pickupDate}
              onChange={onPickupDateChange}
              className="mt-1"
              placeholder="選擇日期"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="gap-1" onClick={onCancel}>
            <X size={16} />
            取消
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-morandi-green hover:bg-morandi-green/90 gap-1"
          >
            <Check size={16} />
            確認取件
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface BatchRejectDialogProps {
  open: boolean
  selectedCount: number
  rejectDate: string
  onRejectDateChange: (date: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export function BatchRejectDialog({
  open,
  selectedCount,
  rejectDate,
  onRejectDateChange,
  onConfirm,
  onCancel,
}: BatchRejectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>批次退件</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-morandi-secondary">
            已選擇 <span className="font-semibold text-morandi-primary">{selectedCount}</span> 筆簽證
          </p>
          <div>
            <label className="text-sm font-medium text-morandi-primary">退件日期</label>
            <DatePicker
              value={rejectDate}
              onChange={onRejectDateChange}
              className="mt-1"
              placeholder="選擇日期"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="gap-1" onClick={onCancel}>
            <X size={16} />
            取消
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-morandi-red hover:bg-morandi-red/90 gap-1"
          >
            <Check size={16} />
            確認退件
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
