'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BedDouble, Plus, Trash2, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'
import { generateUUID } from '../hooks/room-utils'
import { format, addDays, parseISO } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface NewRoomRow {
  id: string
  roomName: string
  capacity: number
  count: number
  amount: string
  bookingCode: string
  customFields: Record<string, string>
}

interface TourInfo {
  id: string
  departure_date: string
  return_date: string
}

interface AddRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tourId: string
  selectedNight: number
  tour?: TourInfo
  currentRoomCount: number
  continueFromPrevious: Set<number>
  onToggleContinue: (night: number) => void
  onSuccess: () => void
}

export function AddRoomDialog({
  open,
  onOpenChange,
  tourId,
  selectedNight,
  tour,
  currentRoomCount,
  continueFromPrevious,
  onToggleContinue,
  onSuccess,
}: AddRoomDialogProps) {
  const [customFieldNames, setCustomFieldNames] = useState<string[]>([])
  const [newRoomRows, setNewRoomRows] = useState<NewRoomRow[]>([
    { id: generateUUID(), roomName: '', capacity: 2, count: 1, amount: '', bookingCode: '', customFields: {} }
  ])

  const getNightDate = (nightNumber: number): string => {
    if (!tour?.departure_date) return ''
    try {
      const startDate = parseISO(tour.departure_date)
      const nightDate = addDays(startDate, nightNumber - 1)
      return format(nightDate, 'M/d (EEE)', { locale: zhTW })
    } catch {
      return ''
    }
  }

  const resetForm = () => {
    setNewRoomRows([
      { id: generateUUID(), roomName: '', capacity: 2, count: 1, amount: '', bookingCode: '', customFields: {} }
    ])
    setCustomFieldNames([])
  }

  const removeRoomRow = (id: string) => {
    if (newRoomRows.length <= 1) return
    setNewRoomRows(prev => prev.filter(row => row.id !== id))
  }

  const addCustomField = () => {
    const fieldName = `欄位${customFieldNames.length + 1}`
    setCustomFieldNames(prev => [...prev, fieldName])
  }

  const removeCustomField = (index: number) => {
    const fieldName = customFieldNames[index]
    setCustomFieldNames(prev => prev.filter((_, i) => i !== index))
    setNewRoomRows(prev => prev.map(row => {
      const newCustomFields = { ...row.customFields }
      delete newCustomFields[fieldName]
      return { ...row, customFields: newCustomFields }
    }))
  }

  const updateCustomFieldName = (index: number, newName: string) => {
    const oldName = customFieldNames[index]
    setCustomFieldNames(prev => prev.map((name, i) => i === index ? newName : name))
    setNewRoomRows(prev => prev.map(row => {
      const newCustomFields = { ...row.customFields }
      if (oldName in newCustomFields) {
        newCustomFields[newName] = newCustomFields[oldName]
        delete newCustomFields[oldName]
      }
      return { ...row, customFields: newCustomFields }
    }))
  }

  const handleAddRooms = async () => {
    const validRows = newRoomRows.filter(row => row.count > 0 && row.capacity > 0)
    if (validRows.length === 0) {
      toast.error('請至少新增一間房間')
      return
    }

    const getCustomRoomType = (capacity: number): string => {
      if (capacity <= 1) return 'single'
      if (capacity === 2) return 'double'
      if (capacity === 3) return 'triple'
      return 'quad'
    }

    try {
      const newRooms: Array<{
        tour_id: string
        hotel_name: string
        room_type: string
        capacity: number
        night_number: number
        display_order: number
        booking_code: string | null
        amount: number | null
      }> = []
      let order = currentRoomCount

      for (const row of validRows) {
        for (let i = 0; i < row.count; i++) {
          newRooms.push({
            tour_id: tourId,
            hotel_name: row.roomName.trim(),
            room_type: getCustomRoomType(row.capacity),
            capacity: row.capacity,
            night_number: selectedNight,
            display_order: order++,
            booking_code: row.bookingCode?.trim() || null,
            amount: row.amount ? parseFloat(row.amount) : null,
          })
        }
      }

      const { error } = await supabase.from('tour_rooms').insert(newRooms)
      if (error) throw error

      const totalCount = validRows.reduce((sum, row) => sum + row.count, 0)
      toast.success(`已新增 ${totalCount} 間房間`)
      resetForm()
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      logger.error('新增房間失敗:', error)
      toast.error('新增房間失敗')
    }
  }

  const totalRooms = newRoomRows.reduce((sum, r) => sum + r.count, 0)
  const totalBeds = newRoomRows.reduce((sum, r) => sum + r.count * r.capacity, 0)

  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) resetForm(); }}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BedDouble className="h-5 w-5 text-morandi-gold" />
            批次新增房間 - 第 {selectedNight} 晚
            {tour?.departure_date && (
              <span className="text-sm font-normal text-morandi-muted ml-2">
                {getNightDate(selectedNight)}
              </span>
            )}
            <label className="flex items-center gap-1.5 ml-4 cursor-pointer">
              <input
                type="checkbox"
                checked={continueFromPrevious.has(selectedNight)}
                onChange={() => onToggleContinue(selectedNight)}
                disabled={selectedNight <= 1}
                className="w-4 h-4 rounded border-border text-morandi-gold focus:ring-morandi-gold"
              />
              <span className={`text-sm ${selectedNight <= 1 ? 'text-morandi-muted' : 'text-morandi-secondary'}`}>
                續住
              </span>
            </label>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* 標題列 */}
          <div className="grid gap-3 px-2 text-sm font-medium text-morandi-secondary items-center" style={{ gridTemplateColumns: `180px 100px 100px 120px 140px ${customFieldNames.map(() => '120px').join(' ')} auto 40px` }}>
            <span>名稱</span>
            <span>入住人數</span>
            <span>間數</span>
            <span>金額</span>
            <span>訂房代號</span>
            {customFieldNames.map((fieldName, fieldIndex) => (
              <div key={fieldIndex} className="flex items-center gap-1">
                <Input
                  value={fieldName}
                  onChange={e => updateCustomFieldName(fieldIndex, e.target.value)}
                  className="h-7 text-xs"
                />
                <button
                  onClick={() => removeCustomField(fieldIndex)}
                  className="text-morandi-muted hover:text-morandi-red flex-shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              onClick={addCustomField}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-dashed border-morandi-muted text-morandi-muted hover:border-morandi-gold hover:text-morandi-gold transition-colors whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              新增欄位
            </button>
            <span></span>
          </div>

          {/* 房間列表 */}
          <div className="space-y-2 max-h-[300px] overflow-auto">
            {newRoomRows.map((row, index) => (
              <div key={row.id} className="grid gap-3 items-center" style={{ gridTemplateColumns: `180px 100px 100px 120px 140px ${customFieldNames.map(() => '120px').join(' ')} auto 40px` }}>
                <Input
                  value={row.roomName}
                  onChange={e => setNewRoomRows(prev => prev.map(r => r.id === row.id ? { ...r, roomName: e.target.value } : r))}
                  placeholder="豪華、海景..."
                  className="h-10"
                />
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={row.capacity || ''}
                  onChange={e => setNewRoomRows(prev => prev.map(r => r.id === row.id ? { ...r, capacity: parseInt(e.target.value) || 0 } : r))}
                  placeholder="2"
                  className="h-10 text-center"
                />
                <Input
                  type="number"
                  min="0"
                  value={row.count || ''}
                  onChange={e => setNewRoomRows(prev => prev.map(r => r.id === row.id ? { ...r, count: parseInt(e.target.value) || 0 } : r))}
                  className="h-10 text-center"
                />
                <Input
                  type="number"
                  min="0"
                  value={row.amount}
                  onChange={e => setNewRoomRows(prev => prev.map(r => r.id === row.id ? { ...r, amount: e.target.value } : r))}
                  placeholder="0"
                  className="h-10 text-center"
                />
                <Input
                  value={row.bookingCode}
                  onChange={e => setNewRoomRows(prev => prev.map(r => r.id === row.id ? { ...r, bookingCode: e.target.value } : r))}
                  placeholder="訂房代號"
                  className="h-10"
                />
                {customFieldNames.map((fieldName, fieldIndex) => (
                  <Input
                    key={fieldIndex}
                    value={row.customFields[fieldName] || ''}
                    onChange={e => setNewRoomRows(prev => prev.map(r => r.id === row.id ? {
                      ...r,
                      customFields: { ...r.customFields, [fieldName]: e.target.value }
                    } : r))}
                    placeholder={fieldName}
                    className="h-10"
                  />
                ))}
                <div></div>
                {index === 0 ? (
                  <button
                    onClick={() => setNewRoomRows(prev => [{
                      id: generateUUID(),
                      roomName: '',
                      capacity: 2,
                      count: 1,
                      amount: '',
                      bookingCode: '',
                      customFields: {}
                    }, ...prev])}
                    className="w-8 h-8 rounded flex items-center justify-center text-morandi-gold hover:bg-morandi-gold/10"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => removeRoomRow(row.id)}
                    className="w-8 h-8 rounded flex items-center justify-center text-morandi-secondary hover:text-morandi-red"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* 統計 + 按鈕 */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-4">
              <span className="text-sm text-morandi-secondary">
                共 <span className="font-medium text-morandi-primary">{totalRooms}</span> 間房間
              </span>
              <span className="text-sm text-morandi-secondary">
                共 <span className="font-medium text-morandi-primary">{totalBeds}</span> 床位
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-1" onClick={() => { onOpenChange(false); resetForm() }}>
                <X size={16} />
                取消
              </Button>
              <Button
                onClick={handleAddRooms}
                disabled={totalRooms === 0}
                className="btn-morandi-primary gap-1"
              >
                <Check size={16} />
                確認新增 ({totalRooms} 間)
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
