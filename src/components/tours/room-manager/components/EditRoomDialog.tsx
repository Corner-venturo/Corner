'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil } from 'lucide-react'
import { ROOM_TYPES } from '@/types/room-vehicle.types'
import type { TourRoomStatus } from '@/types/room-vehicle.types'

interface EditRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  room: TourRoomStatus | null
  onSave: (roomId: string, updates: Record<string, unknown>) => Promise<void>
}

interface EditRoomData {
  hotel_name: string
  room_type: string
  capacity: number
  booking_code: string
  amount: string
}

export function EditRoomDialog({ open, onOpenChange, room, onSave }: EditRoomDialogProps) {
  const [editRoomData, setEditRoomData] = useState<EditRoomData>({
    hotel_name: '',
    room_type: 'double',
    capacity: 2,
    booking_code: '',
    amount: '',
  })

  useEffect(() => {
    if (room) {
      setEditRoomData({
        hotel_name: room.hotel_name || '',
        room_type: room.room_type || 'double',
        capacity: room.capacity || 2,
        booking_code: room.booking_code || '',
        amount: room.amount?.toString() || '',
      })
    }
  }, [room])

  const handleSave = async () => {
    if (!room) return

    const updateData: Record<string, unknown> = {
      hotel_name: editRoomData.hotel_name.trim() || null,
      room_type: editRoomData.room_type,
      capacity: editRoomData.capacity,
      booking_code: editRoomData.booking_code.trim() || null,
      amount: editRoomData.amount ? parseFloat(editRoomData.amount) : null,
    }

    await onSave(room.id, updateData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-morandi-blue" />
            編輯房間
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* 飯店名稱 */}
          <div>
            <label className="block text-sm font-medium text-morandi-secondary mb-1">飯店名稱</label>
            <Input
              value={editRoomData.hotel_name}
              onChange={e => setEditRoomData(prev => ({ ...prev, hotel_name: e.target.value }))}
              placeholder="輸入飯店名稱"
            />
          </div>

          {/* 房型 */}
          <div>
            <label className="block text-sm font-medium text-morandi-secondary mb-1">房型</label>
            <select
              value={editRoomData.room_type}
              onChange={e => setEditRoomData(prev => ({ ...prev, room_type: e.target.value }))}
              className="w-full h-10 px-3 border border-input rounded-md bg-white text-sm"
            >
              {ROOM_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* 入住人數 */}
          <div>
            <label className="block text-sm font-medium text-morandi-secondary mb-1">入住人數</label>
            <Input
              type="number"
              min={1}
              max={10}
              value={editRoomData.capacity}
              onChange={e => setEditRoomData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
              placeholder="輸入入住人數"
            />
          </div>

          {/* 訂房代號 */}
          <div>
            <label className="block text-sm font-medium text-morandi-secondary mb-1">訂房代號</label>
            <Input
              value={editRoomData.booking_code}
              onChange={e => setEditRoomData(prev => ({ ...prev, booking_code: e.target.value }))}
              placeholder="輸入訂房代號"
            />
          </div>

          {/* 費用 */}
          <div>
            <label className="block text-sm font-medium text-morandi-secondary mb-1">費用</label>
            <Input
              type="number"
              value={editRoomData.amount}
              onChange={e => setEditRoomData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="輸入費用"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>
            儲存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
