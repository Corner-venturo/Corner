'use client'

import { supabase as supabaseClient } from '@/lib/supabase/client'
import type { TourRoomStatus } from '@/types/room-vehicle.types'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'

const supabase = supabaseClient as any

interface OrderMember {
  id: string
  chinese_name: string | null
  passport_name: string | null
}

interface UseRoomAssignmentProps {
  rooms: TourRoomStatus[]
  assignments: Array<{ id: string; room_id: string; order_member_id: string }>
  members: OrderMember[]
  reload: () => void
}

export function useRoomAssignment({ rooms, assignments, members, reload }: UseRoomAssignmentProps) {
  const getRoomMembers = (roomId: string) => {
    const roomAssignments = assignments.filter(a => a.room_id === roomId)
    return roomAssignments.map(a => {
      const member = members.find(m => m.id === a.order_member_id)
      return { assignment: a, member }
    })
  }

  const getUnassignedMembers = (nightNumber: number) => {
    const nightRoomIds = rooms
      .filter(r => r.night_number === nightNumber)
      .map(r => r.id)
    const assignedMemberIds = assignments
      .filter(a => nightRoomIds.includes(a.room_id))
      .map(a => a.order_member_id)
    return members.filter(m => !assignedMemberIds.includes(m.id))
  }

  const handleAssignMember = async (roomId: string, memberId: string) => {
    const room = rooms.find(r => r.id === roomId)
    if (room && room.is_full) {
      toast.error('此房間已滿')
      return
    }

    const nightRoomIds = rooms
      .filter(r => r.night_number === room?.night_number)
      .map(r => r.id)
    const existingAssignment = assignments.find(
      a => a.order_member_id === memberId && nightRoomIds.includes(a.room_id)
    )
    if (existingAssignment) {
      toast.error('此團員已分配到這晚的其他房間')
      return
    }

    try {
      const result = await supabase.from('tour_room_assignments').insert({
        room_id: roomId,
        order_member_id: memberId,
      }).select()

      if (result.error) {
        logger.error('Supabase 錯誤詳情:', result.error)
        if (result.error.code === '23505') {
          toast.error('此團員已分配到這個房間')
        } else {
          toast.error(`分配失敗: ${result.error.message || result.error.code || '未知錯誤'}`)
        }
        return
      }

      if (!result.data || result.data.length === 0) {
        logger.error('插入成功但無返回資料')
      }

      toast.success('已分配')
      reload()
    } catch (error) {
      logger.error('分配失敗 (catch):', error)
      const err = error as Error
      toast.error(`分配失敗: ${err.message || '未知錯誤'}`)
    }
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('tour_room_assignments')
        .delete()
        .eq('id', assignmentId)

      if (error) throw error

      toast.success('已移除')
      reload()
    } catch (error) {
      logger.error('移除失敗:', error)
      toast.error('移除失敗')
    }
  }

  const handleClearRoom = async (roomId: string) => {
    const roomAssignments = assignments.filter(a => a.room_id === roomId)
    if (roomAssignments.length === 0) {
      toast.info('此房間沒有分配任何團員')
      return
    }

    try {
      const { error } = await supabase
        .from('tour_room_assignments')
        .delete()
        .eq('room_id', roomId)

      if (error) throw error

      toast.success('已清空房間')
      reload()
    } catch (error) {
      logger.error('清空房間失敗:', error)
      toast.error('清空房間失敗')
    }
  }

  return {
    getRoomMembers,
    getUnassignedMembers,
    handleAssignMember,
    handleRemoveAssignment,
    handleClearRoom,
  }
}
