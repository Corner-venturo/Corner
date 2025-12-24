'use client'

import { BedDouble, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TourRoomStatus, TourRoomAssignment } from '@/types/room-vehicle.types'
import { RoomCard } from './RoomCard'

interface OrderMember {
  id: string
  chinese_name: string | null
  passport_name: string | null
}

interface RoomListProps {
  currentNightRooms: TourRoomStatus[]
  selectedNight: number
  continueFromPrevious: Set<number>
  showFullRooms: boolean
  selectedRoomType: string | null
  totalCapacity: number
  assignments: TourRoomAssignment[]
  members: OrderMember[]
  onToggleContinue: (nightNumber: number) => void
  onToggleShowFull: () => void
  onClearRoom: (roomId: string) => void
  onEditRoom: (room: TourRoomStatus) => void
  onDeleteRoom: (roomId: string) => void
  onRemoveAssignment: (assignmentId: string) => void
}

export function RoomList({
  currentNightRooms,
  selectedNight,
  continueFromPrevious,
  showFullRooms,
  selectedRoomType,
  totalCapacity,
  assignments,
  members,
  onToggleContinue,
  onToggleShowFull,
  onClearRoom,
  onEditRoom,
  onDeleteRoom,
  onRemoveAssignment,
}: RoomListProps) {
  const getRoomMembers = (roomId: string) => {
    const roomAssignments = assignments.filter(a => a.room_id === roomId)
    return roomAssignments.map(a => {
      const member = members.find(m => m.id === a.order_member_id)
      return { assignment: a, member }
    })
  }

  return (
    <div className="col-span-2 flex flex-col min-h-0 bg-morandi-container rounded-lg p-4 border border-border">
      <div className="flex items-center gap-2 mb-2">
        <BedDouble className="h-4 w-4 text-morandi-secondary" />
        <h3 className="font-medium text-morandi-primary text-sm">房間列表</h3>
        {selectedNight > 1 && (
          <button
            onClick={() => onToggleContinue(selectedNight)}
            className={cn(
              "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border transition-all ml-2",
              continueFromPrevious.has(selectedNight)
                ? "border-morandi-gold bg-morandi-gold/10 text-morandi-gold"
                : "border-border text-morandi-secondary hover:border-morandi-gold hover:text-morandi-gold"
            )}
          >
            <Copy className="h-3 w-3" />
            {continueFromPrevious.has(selectedNight) ? '續住' : '設為續住'}
          </button>
        )}
        {currentNightRooms.some(r => r.is_full) && (
          <button
            onClick={onToggleShowFull}
            className={cn(
              "text-xs px-2.5 py-1.5 rounded border transition-all",
              showFullRooms
                ? "border-border text-morandi-secondary hover:border-morandi-gold"
                : "border-morandi-gold bg-morandi-gold/10 text-morandi-gold"
            )}
          >
            {showFullRooms ? '隱藏已滿' : '顯示已滿'}
          </button>
        )}
        {currentNightRooms.length > 0 && (
          <span className="ml-auto text-xs px-2 py-1 bg-card rounded text-morandi-secondary border border-border">
            {currentNightRooms.length} 間 · {totalCapacity} 床
          </span>
        )}
      </div>

      {currentNightRooms.length > 0 ? (
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 gap-3">
            {(() => {
              const roomCounters: Record<string, number> = {}
              const roomNumbers: Record<string, number> = {}
              currentNightRooms.forEach(room => {
                const roomKey = `${room.hotel_name || ''}_${room.room_type}`
                if (!roomCounters[roomKey]) {
                  roomCounters[roomKey] = 1
                }
                roomNumbers[room.id] = roomCounters[roomKey]++
              })

              let displayRooms = showFullRooms
                ? currentNightRooms
                : currentNightRooms.filter(r => !r.is_full)

              if (selectedRoomType) {
                displayRooms = displayRooms.filter(r => {
                  const roomKey = r.hotel_name
                    ? `${r.hotel_name}_${r.room_type}`
                    : r.room_type
                  return roomKey === selectedRoomType
                })
              }

              return displayRooms.map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  roomNumber={roomNumbers[room.id]}
                  roomMembers={getRoomMembers(room.id)}
                  onClearRoom={onClearRoom}
                  onEditRoom={onEditRoom}
                  onDeleteRoom={onDeleteRoom}
                  onRemoveAssignment={onRemoveAssignment}
                />
              ))
            })()}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center">
          <BedDouble className="h-12 w-12 text-morandi-muted mb-3" />
          <p className="text-morandi-secondary text-sm">尚未設定房間</p>
          <p className="text-morandi-muted text-xs mt-1">點擊右上角「新增房間」開始設定</p>
        </div>
      )}
    </div>
  )
}
