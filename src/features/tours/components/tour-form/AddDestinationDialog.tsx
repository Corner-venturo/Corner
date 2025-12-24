'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface AddDestinationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pendingCountry: string
  pendingCity: string
  setPendingCity: (city: string) => void
  newAirportCode: string
  setNewAirportCode: (code: string) => void
  savingDestination: boolean
  handleAddDestination: () => Promise<void>
}

export function AddDestinationDialog({
  open,
  onOpenChange,
  pendingCountry,
  pendingCity,
  setPendingCity,
  newAirportCode,
  setNewAirportCode,
  savingDestination,
  handleAddDestination,
}: AddDestinationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>新增目的地城市</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-morandi-secondary">
            為「<span className="font-medium text-morandi-primary">{pendingCountry}</span>」新增城市
          </p>
          <div>
            <label className="text-sm font-medium text-morandi-primary">城市名稱</label>
            <Input
              value={pendingCity}
              onChange={e => setPendingCity(e.target.value)}
              placeholder="例如: 清邁、曼谷"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-primary">機場代碼 (IATA)</label>
            <Input
              value={newAirportCode}
              onChange={e => setNewAirportCode(e.target.value.toUpperCase().slice(0, 3))}
              placeholder="例如: CNX, BKK, NRT"
              className="mt-1 font-mono uppercase"
              maxLength={3}
            />
            <p className="text-xs text-morandi-secondary mt-1">
              請輸入該城市主要機場的 3 位數 IATA 代碼
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={savingDestination}
          >
            取消
          </Button>
          <Button
            onClick={handleAddDestination}
            disabled={savingDestination || newAirportCode.length !== 3}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            {savingDestination ? (
              <>
                <Loader2 size={14} className="animate-spin mr-1" />
                儲存中...
              </>
            ) : (
              '確認新增'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
