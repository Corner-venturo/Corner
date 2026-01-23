'use client'

/**
 * useRoomAssignmentInline - 分房管理 Hook（內嵌版本）
 *
 * 類似 useVehicleAssignment，提供完整的分房管理功能
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores'
import type { TourRoomStatus, CreateTourRoomData } from '@/types/room-vehicle.types'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'

interface RoomMember {
  id: string
  chinese_name: string | null
  passport_name: string | null
  order_code?: string
}

interface RoomAssignment {
  id: string
  room_id: string
  order_member_id: string
}

interface UseRoomAssignmentInlineProps {
  tourId: string
  workspaceId: string
}

export function useRoomAssignmentInline({ tourId, workspaceId }: UseRoomAssignmentInlineProps) {
  const user = useAuthStore(state => state.user)
  const [rooms, setRooms] = useState<TourRoomStatus[]>([])
  const [members, setMembers] = useState<RoomMember[]>([])
  const [assignments, setAssignments] = useState<RoomAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tourNights, setTourNights] = useState(0)

  // 載入資料
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // 載入 tour 資訊取得天數
      const { data: tourData } = await supabase
        .from('tours')
        .select('id, departure_date, return_date')
        .eq('id', tourId)
        .single()

      if (tourData) {
        const startDate = new Date(tourData.departure_date + 'T00:00:00')
        const endDate = new Date(tourData.return_date + 'T00:00:00')
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        setTourNights(Math.max(days - 1, 0))
      }

      // 載入房間
      const { data: roomsData } = await supabase
        .from('tour_rooms_status')
        .select('*')
        .eq('tour_id', tourId)
        .order('night_number')
        .order('display_order')

      setRooms((roomsData as TourRoomStatus[]) || [])

      // 載入成員
      const { data: orders } = await supabase
        .from('orders')
        .select('id, order_number')
        .eq('tour_id', tourId)

      if (orders && orders.length > 0) {
        const orderIds = orders.map(o => o.id)
        const orderCodeMap = new Map(orders.map(o => [o.id, o.order_number]))

        const { data: membersData } = await supabase
          .from('order_members')
          .select('id, chinese_name, passport_name, order_id')
          .in('order_id', orderIds)

        const membersWithOrderCode = (membersData || []).map(m => ({
          ...m,
          order_code: orderCodeMap.get(m.order_id) || undefined,
        }))
        setMembers(membersWithOrderCode as RoomMember[])
      } else {
        setMembers([])
      }

      // 載入分配
      if (roomsData && roomsData.length > 0) {
        const roomIds = (roomsData as TourRoomStatus[]).map(r => r.id)
        const { data: assignmentsData } = await supabase
          .from('tour_room_assignments')
          .select('id, room_id, order_member_id')
          .in('room_id', roomIds)

        setAssignments((assignmentsData as RoomAssignment[]) || [])
      } else {
        setAssignments([])
      }
    } catch (error) {
      logger.error('載入分房資料失敗:', error)
    } finally {
      setLoading(false)
    }
  }, [tourId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 新增房間
  const addRoom = useCallback(async (roomData: Omit<CreateTourRoomData, 'tour_id'> & { night_number: number }) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('tour_rooms')
        .insert({
          ...roomData,
          tour_id: tourId,
          workspace_id: workspaceId,
        })

      if (error) throw error
      toast.success('房間已新增')
      await loadData()
    } catch (error) {
      logger.error('新增房間失敗:', error)
      toast.error('新增房間失敗')
    } finally {
      setSaving(false)
    }
  }, [tourId, workspaceId, loadData])

  // 更新房間
  const updateRoom = useCallback(async (roomId: string, updates: Partial<CreateTourRoomData>) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('tour_rooms')
        .update(updates)
        .eq('id', roomId)

      if (error) throw error
      toast.success('房間已更新')
      await loadData()
    } catch (error) {
      logger.error('更新房間失敗:', error)
      toast.error('更新房間失敗')
    } finally {
      setSaving(false)
    }
  }, [loadData])

  // 刪除房間
  const deleteRoom = useCallback(async (roomId: string) => {
    setSaving(true)
    try {
      // 先刪除該房間的分配
      await supabase
        .from('tour_room_assignments')
        .delete()
        .eq('room_id', roomId)

      const { error } = await supabase
        .from('tour_rooms')
        .delete()
        .eq('id', roomId)

      if (error) throw error
      toast.success('房間已刪除')
      await loadData()
    } catch (error) {
      logger.error('刪除房間失敗:', error)
      toast.error('刪除房間失敗')
    } finally {
      setSaving(false)
    }
  }, [loadData])

  // 分配成員到房間
  const assignMemberToRoom = useCallback(async (memberId: string, roomId: string | null, nightNumber: number) => {
    setSaving(true)
    try {
      // 先移除該成員在該晚的現有分配
      const nightRoomIds = rooms
        .filter(r => r.night_number === nightNumber)
        .map(r => r.id)

      const existingAssignment = assignments.find(
        a => a.order_member_id === memberId && nightRoomIds.includes(a.room_id)
      )

      if (existingAssignment) {
        await supabase
          .from('tour_room_assignments')
          .delete()
          .eq('id', existingAssignment.id)
      }

      // 如果 roomId 為 null，表示移除分配
      if (roomId === null) {
        toast.success('已移除分配')
        await loadData()
        return
      }

      // 檢查房間是否已滿
      const room = rooms.find(r => r.id === roomId)
      if (room && room.is_full) {
        toast.error('此房間已滿')
        setSaving(false)
        return
      }

      // 新增分配
      const { error } = await supabase
        .from('tour_room_assignments')
        .insert({
          room_id: roomId,
          order_member_id: memberId,
          workspace_id: user?.workspace_id || workspaceId,
        })

      if (error) {
        if (error.code === '23505') {
          toast.error('此團員已分配到這個房間')
        } else {
          throw error
        }
        return
      }

      toast.success('已分配')
      await loadData()
    } catch (error) {
      logger.error('分配失敗:', error)
      toast.error('分配失敗')
    } finally {
      setSaving(false)
    }
  }, [rooms, assignments, loadData, user?.workspace_id, workspaceId])

  // 取得某房間的成員
  const getMembersForRoom = useCallback((roomId: string): RoomMember[] => {
    const roomAssignments = assignments.filter(a => a.room_id === roomId)
    return roomAssignments
      .map(a => members.find(m => m.id === a.order_member_id))
      .filter((m): m is RoomMember => m !== undefined)
  }, [assignments, members])

  // 取得某晚未分配的成員
  const getUnassignedMembersForNight = useCallback((nightNumber: number): RoomMember[] => {
    const nightRoomIds = rooms
      .filter(r => r.night_number === nightNumber)
      .map(r => r.id)
    const assignedMemberIds = assignments
      .filter(a => nightRoomIds.includes(a.room_id))
      .map(a => a.order_member_id)
    return members.filter(m => !assignedMemberIds.includes(m.id))
  }, [rooms, assignments, members])

  // 取得某晚的房間
  const getRoomsForNight = useCallback((nightNumber: number): TourRoomStatus[] => {
    return rooms.filter(r => r.night_number === nightNumber)
  }, [rooms])

  return {
    rooms,
    members,
    assignments,
    loading,
    saving,
    tourNights,
    addRoom,
    updateRoom,
    deleteRoom,
    assignMemberToRoom,
    getMembersForRoom,
    getUnassignedMembersForNight,
    getRoomsForNight,
    reload: loadData,
  }
}
