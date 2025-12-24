'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase as supabaseClient } from '@/lib/supabase/client'
import type { TourRoomStatus, TourRoomAssignment } from '@/types/room-vehicle.types'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'

const supabase = supabaseClient as unknown as typeof supabaseClient

interface OrderMember {
  id: string
  chinese_name: string | null
  passport_name: string | null
}

interface UseRoomDataProps {
  tourId: string
  open: boolean
}

interface UseRoomDataReturn {
  rooms: TourRoomStatus[]
  assignments: TourRoomAssignment[]
  loading: boolean
  loadRooms: () => Promise<void>
  loadAssignments: () => Promise<void>
  deleteRoom: (roomId: string) => Promise<void>
  clearRoom: (roomId: string) => Promise<void>
  assignMember: (roomId: string, memberId: string, members: OrderMember[], rooms: TourRoomStatus[], assignments: TourRoomAssignment[]) => Promise<void>
  removeAssignment: (assignmentId: string) => Promise<void>
  updateRoom: (roomId: string, updates: Record<string, unknown>) => Promise<void>
  addRooms: (newRooms: Array<{
    tour_id: string
    hotel_name: string
    room_type: string
    capacity: number
    night_number: number
    display_order: number
    booking_code: string | null
    amount: number | null
  }>) => Promise<void>
  sortAndSaveRooms: (rooms: TourRoomStatus[], assignments: TourRoomAssignment[], members: OrderMember[]) => Promise<void>
}

export function useRoomData({ tourId, open }: UseRoomDataProps): UseRoomDataReturn {
  const [rooms, setRooms] = useState<TourRoomStatus[]>([])
  const [assignments, setAssignments] = useState<TourRoomAssignment[]>([])
  const [loading, setLoading] = useState(true)

  const loadRooms = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tour_rooms_status')
        .select('*')
        .eq('tour_id', tourId)
        .order('night_number')
        .order('display_order')

      if (error) throw error
      setRooms((data || []) as TourRoomStatus[])
    } catch (error) {
      logger.error('載入房間失敗:', error)
    } finally {
      setLoading(false)
    }
  }, [tourId])

  const loadAssignments = useCallback(async () => {
    try {
      const { data: roomsData } = await supabase
        .from('tour_rooms')
        .select('id')
        .eq('tour_id', tourId)

      if (!roomsData || roomsData.length === 0) {
        setAssignments([])
        return
      }

      const roomIds = roomsData.map((r: { id: string }) => r.id)

      const { data, error } = await supabase
        .from('tour_room_assignments')
        .select('*')
        .in('room_id', roomIds)

      if (error) throw error
      setAssignments((data || []) as TourRoomAssignment[])
    } catch (error) {
      logger.error('載入分配失敗:', error)
    }
  }, [tourId])

  useEffect(() => {
    if (open) {
      loadRooms()
      loadAssignments()
    }
  }, [open, loadRooms, loadAssignments])

  const deleteRoom = useCallback(async (roomId: string) => {
    try {
      const { error } = await supabase.from('tour_rooms').delete().eq('id', roomId)
      if (error) throw error

      toast.success('房間已刪除')
      await loadRooms()
      await loadAssignments()
    } catch (error) {
      logger.error('刪除房間失敗:', error)
      toast.error('刪除房間失敗')
      throw error
    }
  }, [loadRooms, loadAssignments])

  const clearRoom = useCallback(async (roomId: string) => {
    const roomAssignments = assignments.filter(a => a.room_id === roomId)
    if (roomAssignments.length === 0) {
      toast.info('此房間沒有分配任何團員')
      return
    }

    try {
      const { error } = await supabase.from('tour_room_assignments').delete().eq('room_id', roomId)
      if (error) throw error

      toast.success('已清空房間')
      await loadRooms()
      await loadAssignments()
    } catch (error) {
      logger.error('清空房間失敗:', error)
      toast.error('清空房間失敗')
    }
  }, [assignments, loadRooms, loadAssignments])

  const assignMember = useCallback(async (
    roomId: string,
    memberId: string,
    members: OrderMember[],
    currentRooms: TourRoomStatus[],
    currentAssignments: TourRoomAssignment[]
  ) => {
    const room = currentRooms.find(r => r.id === roomId)
    if (room && room.is_full) {
      toast.error('此房間已滿')
      return
    }

    const nightRoomIds = currentRooms.filter(r => r.night_number === room?.night_number).map(r => r.id)
    const existingAssignment = currentAssignments.find(
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
        const errorMessage = result.error.code === '23505'
          ? '此團員已分配到這個房間'
          : `分配失敗: ${result.error.message || result.error.code || '未知錯誤'}`
        toast.error(errorMessage)
        return
      }

      if (!result.data || result.data.length === 0) {
        logger.error('插入成功但無返回資料')
      }

      toast.success('已分配')
      await loadRooms()
      await loadAssignments()
    } catch (error) {
      logger.error('分配失敗 (catch):', error)
      const err = error as Error
      toast.error(`分配失敗: ${err.message || '未知錯誤'}`)
    }
  }, [loadRooms, loadAssignments])

  const removeAssignment = useCallback(async (assignmentId: string) => {
    try {
      const { error } = await supabase.from('tour_room_assignments').delete().eq('id', assignmentId)
      if (error) throw error

      toast.success('已移除')
      await loadRooms()
      await loadAssignments()
    } catch (error) {
      logger.error('移除失敗:', error)
      toast.error('移除失敗')
    }
  }, [loadRooms, loadAssignments])

  const updateRoom = useCallback(async (roomId: string, updates: Record<string, unknown>) => {
    try {
      const { error } = await supabase.from('tour_rooms').update(updates).eq('id', roomId)
      if (error) throw error

      toast.success('房間已更新')
      await loadRooms()
    } catch (error) {
      logger.error('更新房間失敗:', error)
      toast.error('更新房間失敗')
      throw error
    }
  }, [loadRooms])

  const addRooms = useCallback(async (newRooms: Array<{
    tour_id: string
    hotel_name: string
    room_type: string
    capacity: number
    night_number: number
    display_order: number
    booking_code: string | null
    amount: number | null
  }>) => {
    try {
      const { error } = await supabase.from('tour_rooms').insert(newRooms)
      if (error) throw error

      toast.success(`已新增 ${newRooms.length} 間房間`)
      await loadRooms()
    } catch (error) {
      logger.error('新增房間失敗:', error)
      toast.error('新增房間失敗')
      throw error
    }
  }, [loadRooms])

  const sortAndSaveRooms = useCallback(async (
    currentRooms: TourRoomStatus[],
    currentAssignments: TourRoomAssignment[],
    members: OrderMember[]
  ) => {
    try {
      const nightNumbers = [...new Set(currentRooms.map(r => r.night_number))]
      const allUpdates = []

      for (const night of nightNumbers) {
        const nightRooms = currentRooms.filter(r => r.night_number === night)
        const roomSortKeys = new Map<string, number>()

        for (const room of nightRooms) {
          const roomAssignments = currentAssignments.filter(a => a.room_id === room.id)
          const memberIdsInRoom = roomAssignments.map(a => a.order_member_id)

          if (memberIdsInRoom.length === 0) {
            roomSortKeys.set(room.id, Infinity)
            continue
          }

          const minIndex = Math.min(
            ...memberIdsInRoom.map(memberId => {
              const index = members.findIndex(m => m.id === memberId)
              return index === -1 ? Infinity : index
            })
          )
          roomSortKeys.set(room.id, minIndex)
        }

        const sortedNightRooms = [...nightRooms].sort((a, b) => {
          const keyA = roomSortKeys.get(a.id) ?? Infinity
          const keyB = roomSortKeys.get(b.id) ?? Infinity
          return keyA - keyB
        })

        const nightUpdates = sortedNightRooms.map((room, index) => ({
          id: room.id,
          display_order: index,
        }))

        allUpdates.push(...nightUpdates)
      }

      if (allUpdates.length > 0) {
        // 使用批量 update 而非 upsert（upsert 需要完整必要欄位）
        for (const update of allUpdates) {
          const { error } = await supabase
            .from('tour_rooms')
            .update({ display_order: update.display_order })
            .eq('id', update.id)
          if (error) {
            logger.error('Supabase update error:', error)
            throw error
          }
        }
      }

      toast.success("房間順序已儲存")
    } catch (error) {
      logger.error("排序失敗:", error)
      toast.error("儲存排序失敗")
      throw error
    }
  }, [])

  return {
    rooms,
    assignments,
    loading,
    loadRooms,
    loadAssignments,
    deleteRoom,
    clearRoom,
    assignMember,
    removeAssignment,
    updateRoom,
    addRooms,
    sortAndSaveRooms,
  }
}
