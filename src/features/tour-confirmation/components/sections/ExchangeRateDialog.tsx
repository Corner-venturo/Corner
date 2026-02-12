/**
 * 匯率設定對話框
 */

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EXCHANGE_RATE_DIALOG_LABELS, TOUR_CONFIRMATION_SHEET_PAGE_LABELS } from '../../constants/labels';

interface ExchangeRateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  destinationCurrency: string | null
  exchangeRateInput: string
  onExchangeRateInputChange: (value: string) => void
  onSave: () => void
}

export function ExchangeRateDialog({
  open,
  onOpenChange,
  destinationCurrency,
  exchangeRateInput,
  onExchangeRateInputChange,
  onSave,
}: ExchangeRateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent level={1} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>設定匯率</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-morandi-secondary">
            設定 {destinationCurrency || TOUR_CONFIRMATION_SHEET_PAGE_LABELS.外幣} 對台幣的匯率，用於換算預計支出
          </p>
          <div className="space-y-2">
            <Label htmlFor="exchange-rate">1 {destinationCurrency || '外幣'} = ? TWD</Label>
            <Input
              id="exchange-rate"
              type="number"
              step="0.001"
              placeholder={EXCHANGE_RATE_DIALOG_LABELS.例如_0_22_日圓_或_0_9_泰銖}
              value={exchangeRateInput}
              onChange={(e) => onExchangeRateInputChange(e.target.value)}
            />
            <p className="text-xs text-morandi-secondary">
              例：日圓約 0.22，泰銖約 0.9，韓元約 0.024
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={onSave}>
            確認
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
