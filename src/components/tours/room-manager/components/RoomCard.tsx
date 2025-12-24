'use client'

import { X, Check, UserMinus, Trash2, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROOM_TYPES } from '@/types/room-vehicle.types'
import type { TourRoomStatus, TourRoomAssignment } from '@/types/room-vehicle.types'

interface OrderMember {
  id: string
  chinese_name: string | null
  passport_name: string | null
}

interface RoomMember {
  assignment: TourRoomAssignment
  member?: OrderMember
}

interface RoomCardProps {
  room: TourRoomStatus
  roomNumber: number
  roomMembers: RoomMember[]
  onClearRoom: (roomId: string) => void
  onEditRoom: (room: TourRoomStatus) => void
  onDeleteRoom: (roomId: string) => void
  onRemoveAssignment: (assignmentId: string) => void
}

export function RoomCard({
  room,
  roomNumber,
  roomMembers,
  onClearRoom,
  onEditRoom,
  onDeleteRoom,
  onRemoveAssignment,
}: RoomCardProps) {
  const typeLabel = ROOM_TYPES.find(t => t.value === room.room_type)?.label || ''
  const displayName = room.hotel_name
    ? `${room.hotel_name}${typeLabel} ${roomNumber}`
    : `${typeLabel} ${roomNumber}`

  return (
    <div
      className={cn(
        "p-3 rounded-lg border",
        room.is_full ? "border-morandi-green bg-morandi-green/5" : "border-border"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-morandi-primary">
          {displayName}
        </span>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs",
            room.is_full ? "text-morandi-green" : "text-morandi-muted"
          )}>
            {room.assigned_count}/{room.capacity}
            {room.is_full && <Check className="h-3 w-3 inline ml-0.5" />}
          </span>
          {room.assigned_count > 0 && (
            <button
              onClick={() => onClearRoom(room.id)}
              className="text-morandi-muted hover:text-morandi-gold transition-colors"
              title="清空房間"
            >
              <UserMinus className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => onEditRoom(room)}
            className="text-morandi-muted hover:text-morandi-blue transition-colors"
            title="編輯房間"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDeleteRoom(room.id)}
            className="text-morandi-muted hover:text-morandi-red transition-colors"
            title="刪除房間"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {(room.booking_code || room.amount) && (
        <div className="text-xs text-morandi-muted mb-1">
          {room.booking_code && <span className="mr-2">代號: {room.booking_code}</span>}
          {room.amount && <span>費用: ${room.amount.toLocaleString()}</span>}
        </div>
      )}
      <div className="flex flex-wrap gap-1 min-h-[24px]">
        {roomMembers.map(({ assignment, member }) => (
          <span
            key={assignment.id}
            className="inline-flex items-center gap-1 bg-morandi-container text-morandi-primary text-xs px-2 py-1 rounded"
          >
            {member?.chinese_name || '未知'}
            <button
              onClick={() => onRemoveAssignment(assignment.id)}
              className="hover:text-morandi-red"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {room.remaining_beds > 0 && roomMembers.length === 0 && (
          <span className="text-xs text-morandi-muted">空房</span>
        )}
      </div>
    </div>
  )
}
