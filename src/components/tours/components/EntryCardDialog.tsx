'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Printer, X } from 'lucide-react'
import { JapanEntryCardPrint } from '../JapanEntryCardPrint'
import type { EntryCardSettings } from '../hooks/useTourMemberEditor'

// Generic member type that supports both OrderMember (snake_case) and EditingMember (camelCase)
interface GenericMember {
  id?: string
  // snake_case (OrderMember)
  passport_name?: string | null
  birth_date?: string | null
  passport_number?: string | null
  // camelCase (EditingMember)
  nameEn?: string
  birthday?: string
  passportNumber?: string
}

interface EntryCardDialogProps {
  open: boolean
  members: GenericMember[]
  settings?: EntryCardSettings
  onOpenChange: (open: boolean) => void
  onSettingsChange?: (settings: EntryCardSettings) => void
}

const defaultSettings: EntryCardSettings = {
  flightNumber: '',
  hotelName: '',
  hotelAddress: '',
  hotelPhone: '',
  stayDays: 5,
}

export const EntryCardDialog: React.FC<EntryCardDialogProps> = ({
  open,
  members,
  settings: externalSettings,
  onOpenChange,
  onSettingsChange: externalOnSettingsChange,
}) => {
  // Use internal state if no external settings provided
  const [internalSettings, setInternalSettings] = useState<EntryCardSettings>(defaultSettings)
  const settings = externalSettings ?? internalSettings
  const onSettingsChange = externalOnSettingsChange ?? setInternalSettings
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-auto">
        <div className="no-print flex items-center justify-between mb-4">
          <DialogHeader>
            <DialogTitle>列印日本入境卡</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => onOpenChange(false)}>
              <X size={16} />
              關閉
            </Button>
            <Button className="gap-2" onClick={() => window.print()}>
              <Printer size={16} />
              列印
            </Button>
          </div>
        </div>

        <div className="no-print grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 p-4 bg-morandi-container/20 rounded-lg">
          <div>
            <label className="text-xs font-medium text-morandi-primary mb-1 block">航班號碼</label>
            <Input
              value={settings.flightNumber}
              onChange={e => onSettingsChange({ ...settings, flightNumber: e.target.value })}
              placeholder="例：BR-108"
              className="text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-morandi-primary mb-1 block">飯店名稱</label>
            <Input
              value={settings.hotelName}
              onChange={e => onSettingsChange({ ...settings, hotelName: e.target.value })}
              placeholder="例：東京灣希爾頓"
              className="text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-morandi-primary mb-1 block">飯店地址</label>
            <Input
              value={settings.hotelAddress}
              onChange={e => onSettingsChange({ ...settings, hotelAddress: e.target.value })}
              placeholder="例：東京都港區..."
              className="text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-morandi-primary mb-1 block">飯店電話</label>
            <Input
              value={settings.hotelPhone}
              onChange={e => onSettingsChange({ ...settings, hotelPhone: e.target.value })}
              placeholder="例：03-1234-5678"
              className="text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-morandi-primary mb-1 block">停留天數</label>
            <Input
              type="number"
              min={1}
              max={90}
              value={settings.stayDays}
              onChange={e => onSettingsChange({ ...settings, stayDays: parseInt(e.target.value) || 5 })}
              className="text-sm"
            />
          </div>
        </div>

        <JapanEntryCardPrint
          members={members.map(m => ({
            id: m.id || '',
            // Support both snake_case (OrderMember) and camelCase (EditingMember)
            passport_name: m.nameEn || m.passport_name || '',
            birth_date: m.birthday || m.birth_date || '',
            passport_number: m.passportNumber || m.passport_number || '',
          }))}
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
