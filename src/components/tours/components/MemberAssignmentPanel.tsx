'use client'

import { useState } from 'react'
import { Users, BedDouble, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ROOM_TYPES } from '@/types/room-vehicle.types'
import type { TourRoomStatus } from '@/types/room-vehicle.types'
import { calculateRoomNumbers } from '../hooks/room-utils'
import type { OrderMember } from '@/components/orders/order-member.types'

// 此元件只需要 OrderMember 的部分欄位
type MemberForAssignment = Pick<OrderMember, 'id' | 'chinese_name' | 'passport_name'>

interface MemberAssignmentPanelProps {
  rooms: TourRoomStatus[]
  selectedNight: number
  unassignedMembers: MemberForAssignment[]
  totalAssigned: number
  totalCapacity: number
  onAssignMember: (roomId: string, memberId: string) => void
}

export function MemberAssignmentPanel({
  rooms,
  selectedNight,
  unassignedMembers,
  totalAssigned,
  totalCapacity,
  onAssignMember,
}: MemberAssignmentPanelProps) {
  const [memberFilter, setMemberFilter] = useState('')

  const currentNightRooms = rooms.filter(r => r.night_number === selectedNight)
  const availableRooms = currentNightRooms.filter(r => !r.is_full)

  // 計算所有房間編號（包含已滿的）
  const allRoomNumbers = calculateRoomNumbers(currentNightRooms)

  const filteredUnassignedMembers = unassignedMembers.filter(m => {
    if (!memberFilter.trim()) return true
    const name = m.chinese_name || m.passport_name || ''
    return name.toLowerCase().includes(memberFilter.toLowerCase())
  })

  return (
    <div className="flex flex-col min-h-0 bg-morandi-container rounded-lg p-4 border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-morandi-secondary" />
        <h3 className="font-medium text-morandi-primary text-sm">待分配團員</h3>
        <span className="text-xs px-2 py-1 bg-card rounded text-morandi-secondary border border-border">
          {unassignedMembers.length} 人
        </span>
        <Input
          value={memberFilter}
          onChange={e => setMemberFilter(e.target.value)}
          placeholder="搜尋..."
          className="h-7 w-24 text-xs ml-auto"
        />
      </div>

      {currentNightRooms.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-morandi-muted">
          <BedDouble className="h-8 w-8 mb-2" />
          <span className="text-xs">請先設定房間</span>
        </div>
      ) : (
        <div className="flex-1 overflow-auto space-y-1.5">
          {filteredUnassignedMembers.map(member => (
            <div
              key={member.id}
              className="flex items-center justify-between p-2 bg-card rounded border border-border hover:border-morandi-gold transition-colors"
            >
              <span className="text-sm text-morandi-primary">
                {member.chinese_name || member.passport_name || '未知'}
              </span>
              <div className="flex gap-1 flex-wrap justify-end max-w-[200px]">
                {availableRooms.map(room => {
                  const roomNum = allRoomNumbers[room.id]
                  const typeLabel = ROOM_TYPES.find(t => t.value === room.room_type)?.label?.slice(0, 2) || ''
                  const prefix = room.hotel_name ? `${room.hotel_name}` : ''

                  return (
                    <button
                      key={room.id}
                      className="text-xs px-1.5 py-0.5 rounded border border-border text-morandi-secondary hover:border-morandi-gold hover:text-morandi-gold transition-all"
                      onClick={() => onAssignMember(room.id, member.id)}
                      title={`${room.hotel_name ? room.hotel_name : ''}${ROOM_TYPES.find(t => t.value === room.room_type)?.label} ${room.assigned_count}/${room.capacity} 人`}
                    >
                      {prefix}{typeLabel}{roomNum}
                    </button>
                  )
                })}
                {availableRooms.length === 0 && (
                  <span className="text-xs text-morandi-muted">房間已滿</span>
                )}
              </div>
            </div>
          ))}
          {filteredUnassignedMembers.length === 0 && unassignedMembers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 text-morandi-muted">
              <Check className="h-6 w-6 mb-1" />
              <span className="text-xs">全部已分配</span>
            </div>
          )}
          {filteredUnassignedMembers.length === 0 && unassignedMembers.length > 0 && (
            <div className="flex flex-col items-center justify-center py-6 text-morandi-muted">
              <span className="text-xs">無符合的團員</span>
            </div>
          )}
        </div>
      )}

      {currentNightRooms.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border text-xs text-morandi-secondary">
          已分配 {totalAssigned}/{totalCapacity} 人
        </div>
      )}
    </div>
  )
}
