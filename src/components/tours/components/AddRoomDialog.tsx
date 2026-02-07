'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BedDouble, Plus, Trash2, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'
import { generateUUID } from '../hooks/room-utils'
import { format, addDays } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { parseLocalDate } from '@/lib/utils/format-date'

interface NewRoomRow {
  id: string
  roomName: string
  capacity: number
  count: number
  amount: string
  bookingCode: string
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
  defaultHotelName?: string  // 從行程表自動帶入的飯店名稱
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
  defaultHotelName = '',
}: AddRoomDialogProps) {
  const [newRoomRows, setNewRoomRows] = useState<NewRoomRow[]>([
    { id: generateUUID(), roomName: defaultHotelName, capacity: 0, count: 0, amount: '', bookingCode: '' }
  ])
  
  // 當 defaultHotelName 變更時，更新第一列的飯店名稱（如果用戶還沒改過）
  useEffect(() => {
    if (defaultHotelName && open) {
      setNewRoomRows(prev => {
        // 只更新空白的 roomName
        if (prev.length === 1 && !prev[0].roomName) {
          return [{ ...prev[0], roomName: defaultHotelName }]
        }
        return prev
      })
    }
  }, [defaultHotelName, open])

  const getNightDate = (nightNumber: number): string => {
    if (!tour?.departure_date) return ''
    const startDate = parseLocalDate(tour.departure_date)
    if (!startDate) return ''
    const nightDate = addDays(startDate, nightNumber - 1)
    return format(nightDate, 'M/d (EEE)', { locale: zhTW })
  }

  const resetForm = () => {
    setNewRoomRows([
      { id: generateUUID(), roomName: defaultHotelName, capacity: 0, count: 0, amount: '', bookingCode: '' }
    ])
  }

  const addRow = () => {
    setNewRoomRows(prev => [...prev, {
      id: generateUUID(),
      roomName: '',
      capacity: 0,
      count: 0,
      amount: '',
      bookingCode: ''
    }])
  }

  const removeRow = (id: string) => {
    if (newRoomRows.length <= 1) return
    setNewRoomRows(prev => prev.filter(row => row.id !== id))
  }

  const updateRow = (id: string, field: keyof NewRoomRow, value: string | number) => {
    setNewRoomRows(prev => prev.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ))
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
      <DialogContent level={3} className="max-w-3xl w-full">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <BedDouble className="h-5 w-5 text-morandi-gold" />
            新增房間 - 第 {selectedNight} 晚
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
          <Button type="button" variant="outline" size="sm" onClick={addRow} className="mr-8">
            <Plus className="mr-1 h-4 w-4" />
            新增一列
          </Button>
        </DialogHeader>

        {/* 表格式輸入 - 請款單樣式 */}
        <div className="border border-border/60 rounded-lg overflow-hidden mt-4">
          {/* 標題列 */}
          <div className="grid grid-cols-12 px-3 py-2 bg-muted/50 text-sm font-medium text-muted-foreground">
            <div className="col-span-4 border-r border-border/20 pr-2">
              飯店/房型 {defaultHotelName && <span className="text-xs text-morandi-gold ml-1">(已從行程表帶入)</span>}
            </div>
            <div className="col-span-2 border-r border-border/20 px-2 text-center">入住人數</div>
            <div className="col-span-1 border-r border-border/20 px-2 text-center">間數</div>
            <div className="col-span-2 border-r border-border/20 px-2 text-right">金額</div>
            <div className="col-span-2 border-r border-border/20 px-2">訂房代號</div>
            <div className="col-span-1 pl-2 text-center">操作</div>
          </div>

          {/* 資料列 - 固定 6 列高度，超過時滾動 */}
          <div className="h-[288px] overflow-y-auto">
            {newRoomRows.map((row, index) => (
              <div key={row.id} className={`grid grid-cols-12 px-3 py-2 items-center ${index > 0 ? 'border-t border-border/20' : ''}`}>
                <div className="col-span-4 border-r border-border/20 pr-2">
                  <input
                    type="text"
                    value={row.roomName}
                    onChange={e => updateRow(row.id, 'roomName', e.target.value)}
                    placeholder="豪華雙人房、海景房..."
                    className="w-full h-8 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                  />
                </div>
                <div className="col-span-2 border-r border-border/20 px-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={row.capacity || ''}
                    onChange={e => updateRow(row.id, 'capacity', parseInt(e.target.value) || 0)}
                    className="w-full h-8 bg-transparent border-none outline-none text-sm text-center"
                  />
                </div>
                <div className="col-span-1 border-r border-border/20 px-2">
                  <input
                    type="number"
                    min="0"
                    value={row.count || ''}
                    onChange={e => updateRow(row.id, 'count', parseInt(e.target.value) || 0)}
                    className="w-full h-8 bg-transparent border-none outline-none text-sm text-center"
                  />
                </div>
                <div className="col-span-2 border-r border-border/20 px-2">
                  <input
                    type="number"
                    min="0"
                    value={row.amount}
                    onChange={e => updateRow(row.id, 'amount', e.target.value)}
                    placeholder="0"
                    className="w-full h-8 bg-transparent border-none outline-none text-sm text-right placeholder:text-muted-foreground"
                  />
                </div>
                <div className="col-span-2 border-r border-border/20 px-2">
                  <input
                    type="text"
                    value={row.bookingCode}
                    onChange={e => updateRow(row.id, 'bookingCode', e.target.value)}
                    placeholder="選填"
                    className="w-full h-8 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                  />
                </div>
                <div className="col-span-1 pl-2 flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(row.id)}
                    disabled={newRoomRows.length <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* 統計 + 按鈕 */}
        <div className="flex items-center justify-between pt-4">
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
              新增 {totalRooms} 間房
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
