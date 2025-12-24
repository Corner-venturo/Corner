'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import { JapanEntryCardPrint } from '../JapanEntryCardPrint'
import { OrderMember } from '../types'

interface EntryCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  members: OrderMember[]
}

export function EntryCardDialog({ open, onOpenChange, members }: EntryCardDialogProps) {
  const [settings, setSettings] = useState({
    flightNumber: '',
    hotelName: '',
    hotelAddress: '',
    hotelPhone: '',
    stayDays: 5,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-auto">
        <div className="no-print flex items-center justify-between mb-4">
          <DialogHeader>
            <DialogTitle>列印日本入境卡</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              關閉
            </Button>
            <Button
              onClick={() => window.print()}
            >
              <Printer size={16} className="mr-1" />
              列印
            </Button>
          </div>
        </div>

        {/* Settings section */}
        <div className="no-print grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 p-4 bg-morandi-container/20 rounded-lg">
          <div>
            <label className="text-xs font-medium text-morandi-secondary mb-1 block">航班號碼</label>
            <Input
              value={settings.flightNumber}
              onChange={e => setSettings(prev => ({ ...prev, flightNumber: e.target.value }))}
              placeholder="例：BR-108"
              className="text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-morandi-secondary mb-1 block">飯店名稱</label>
            <Input
              value={settings.hotelName}
              onChange={e => setSettings(prev => ({ ...prev, hotelName: e.target.value }))}
              placeholder="例：東京灣希爾頓"
              className="text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-morandi-secondary mb-1 block">飯店地址</label>
            <Input
              value={settings.hotelAddress}
              onChange={e => setSettings(prev => ({ ...prev, hotelAddress: e.target.value }))}
              placeholder="例：東京都港區..."
              className="text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-morandi-secondary mb-1 block">飯店電話</label>
            <Input
              value={settings.hotelPhone}
              onChange={e => setSettings(prev => ({ ...prev, hotelPhone: e.target.value }))}
              placeholder="例：03-1234-5678"
              className="text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-morandi-secondary mb-1 block">停留天數</label>
            <Input
              type="number"
              min={1}
              max={90}
              value={settings.stayDays}
              onChange={e => setSettings(prev => ({ ...prev, stayDays: parseInt(e.target.value) || 5 }))}
              className="text-sm"
            />
          </div>
        </div>

        {/* Preview section */}
        <JapanEntryCardPrint
          members={members}
          flightNumber={settings.flightNumber || 'BR-XXX'}
          hotelName={settings.hotelName}
          hotelAddress={settings.hotelAddress}
          hotelPhone={settings.hotelPhone}
          stayDays={settings.stayDays}
        />
      </DialogContent>
    </Dialog>
  )
}
