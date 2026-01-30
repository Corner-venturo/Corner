'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { BedDouble, UserMinus, Pencil, Trash2, X, Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { confirm } from '@/lib/ui/alert-dialog'
import { ROOM_TYPES } from '@/types/room-vehicle.types'
import type { TourRoomStatus } from '@/types/room-vehicle.types'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/utils/logger'
import { calculateRoomNumbers, getRoomDisplayName, getRoomTypeKey } from '../hooks/room-utils'
import { CurrencyCell } from '@/components/table-cells'
import type { OrderMember } from '@/components/orders/order-member.types'

// 此元件只需要 OrderMember 的部分欄位
type MemberBasic = Pick<OrderMember, 'id' | 'chinese_name' | 'passport_name'>

interface RoomListProps {
  rooms: TourRoomStatus[]
  selectedNight: number
  showFullRooms: boolean
  selectedRoomType: string | null
  continueFromPrevious: Set<number>
  getRoomMembers: (roomId: string) => Array<{ assignment: { id: string }; member?: MemberBasic }>
  onToggleShowFull: () => void
  onToggleContinue: (night: number) => void
  onClearRoom: (roomId: string) => void
  onEditRoom: (room: TourRoomStatus) => void
  onDeleteRoom: (roomId: string) => void
  onRemoveAssignment: (assignmentId: string) => void
  onRoomTypeFilter: (key: string | null) => void
}

export function RoomList({
  rooms,
  selectedNight,
  showFullRooms,
  selectedRoomType,
  continueFromPrevious,
  getRoomMembers,
  onToggleShowFull,
  onToggleContinue,
  onClearRoom,
  onEditRoom,
  onDeleteRoom,
  onRemoveAssignment,
  onRoomTypeFilter,
}: RoomListProps) {
  const currentNightRooms = rooms.filter(r => r.night_number === selectedNight)
  const isContinued = continueFromPrevious.has(selectedNight)
  const totalCapacity = currentNightRooms.reduce((sum, r) => sum + r.capacity, 0)

  // 計算房型分類
  const roomTypeKeys = new Set<string>()
  const roomTypeCounts: Record<string, number> = {}
  currentNightRooms.forEach(room => {
    const key = getRoomTypeKey(room)
    roomTypeKeys.add(key)
    roomTypeCounts[key] = (roomTypeCounts[key] || 0) + 1
  })

  // 計算所有房間編號
  const roomNumbers = calculateRoomNumbers(currentNightRooms)

  // 過濾要顯示的房間
  let displayRooms = showFullRooms
    ? currentNightRooms
    : currentNightRooms.filter(r => !r.is_full)

  if (selectedRoomType) {
    displayRooms = displayRooms.filter(r => getRoomTypeKey(r) === selectedRoomType)
  }

  return (
    <div className="col-span-2 flex flex-col min-h-0 bg-morandi-container rounded-lg p-4 border border-border">
      {/* 標題列 */}
      <div className="flex items-center gap-2 mb-2">
        <BedDouble className="h-4 w-4 text-morandi-secondary" />
        <h3 className="font-medium text-morandi-primary text-sm">房間列表</h3>
        {selectedNight > 1 && (
          <button
            onClick={() => onToggleContinue(selectedNight)}
            className={cn(
              "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border transition-all ml-2",
              isContinued
                ? "border-morandi-gold bg-morandi-gold/10 text-morandi-gold"
                : "border-border text-morandi-secondary hover:border-morandi-gold hover:text-morandi-gold"
            )}
          >
            <Copy className="h-3 w-3" />
            {isContinued ? '續住' : '設為續住'}
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

      {/* 房型篩選分頁 */}
      {roomTypeKeys.size > 1 && (
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <button
            onClick={() => onRoomTypeFilter(null)}
            className={cn(
              "text-xs px-2.5 py-1 rounded border transition-all",
              selectedRoomType === null
                ? "border-morandi-gold bg-morandi-gold/10 text-morandi-gold"
                : "border-border text-morandi-secondary hover:border-morandi-gold"
            )}
          >
            全部
          </button>
          {[...roomTypeKeys].map(key => {
            const [hotelName, roomType] = key.includes('_')
              ? key.split('_')
              : ['', key]
            const typeLabel = ROOM_TYPES.find(t => t.value === roomType)?.label || roomType
            const displayLabel = hotelName ? `${hotelName}${typeLabel}` : typeLabel
            const count = roomTypeCounts[key]

            return (
              <button
                key={key}
                onClick={() => onRoomTypeFilter(key)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded border transition-all",
                  selectedRoomType === key
                    ? "border-morandi-gold bg-morandi-gold/10 text-morandi-gold"
                    : "border-border text-morandi-secondary hover:border-morandi-gold"
                )}
              >
                {displayLabel} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* 房間列表 */}
      {currentNightRooms.length > 0 ? (
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 gap-3">
            {displayRooms.map(room => {
              const roomNumber = roomNumbers[room.id]
              const typeLabel = ROOM_TYPES.find(t => t.value === room.room_type)?.label || ''
              const displayName = getRoomDisplayName(room, roomNumber, typeLabel)
              const roomMembers = getRoomMembers(room.id)

              return (
                <div
                  key={room.id}
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
                    <div className="text-xs text-morandi-muted mb-1 flex items-center gap-2">
                      {room.booking_code && <span>代號: {room.booking_code}</span>}
                      {room.amount && <span className="flex items-center gap-1">費用: <CurrencyCell amount={room.amount} className="text-xs" /></span>}
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
            })}
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
