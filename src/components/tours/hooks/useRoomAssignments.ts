'use client'

import { useState } from 'react'
import { logger } from '@/lib/utils/logger'
import { supabase as supabaseClient } from '@/lib/supabase/client'
import { getRoomTypeLabel } from '../utils/room-utils'

const supabase = supabaseClient as any

/**
 * Hook for managing room assignments
 * Handles loading room assignment information
 */
export function useRoomAssignments(tourId: string) {
  const [roomAssignments, setRoomAssignments] = useState<Record<string, string>>({})

  const loadRoomAssignments = async () => {
    if (!tourId) return

    try {
      // Get all rooms for this tour (sorted by display_order)
      const { data: rooms } = await supabase
        .from('tour_rooms')
        .select('id, room_type, hotel_name, room_number, display_order')
        .eq('tour_id', tourId)
        .order('display_order', { ascending: true })

      if (!rooms || rooms.length === 0) return

      // Get all assignment records
      const roomIds = rooms.map((r: { id: string }) => r.id)
      const { data: assignments } = await supabase
        .from('tour_room_assignments')
        .select('room_id, order_member_id')
        .in('room_id', roomIds)

      if (!assignments || assignments.length === 0) return

      // Build room_id -> room info mapping
      const roomMap: Record<string, { room_type: string; hotel_name: string | null; room_number: string | null; display_order: number }> = {}
      rooms.forEach((room: { id: string; room_type: string; hotel_name: string | null; room_number: string | null; display_order: number }) => {
        roomMap[room.id] = {
          room_type: room.room_type,
          hotel_name: room.hotel_name,
          room_number: room.room_number,
          display_order: room.display_order,
        }
      })

      // Calculate room numbers for each room type (sorted by display_order)
      const roomCounters: Record<string, number> = {}
      const roomNumbers: Record<string, number> = {}
      rooms.forEach((room: { id: string; room_type: string; hotel_name: string | null; display_order: number }) => {
        const roomKey = `${room.hotel_name || ''}_${room.room_type}`
        if (!roomCounters[roomKey]) {
          roomCounters[roomKey] = 1
        }
        roomNumbers[room.id] = roomCounters[roomKey]++
      })

      // Build member_id -> room name mapping
      const assignmentMap: Record<string, string> = {}
      assignments.forEach((a: { room_id: string; order_member_id: string }) => {
        const room = roomMap[a.room_id]
        if (room) {
          const roomTypeLabel = getRoomTypeLabel(room.room_type)
          const variant = room.hotel_name ? `${room.hotel_name} ` : ''
          const roomNum = roomNumbers[a.room_id] || 1
          assignmentMap[a.order_member_id] = `${variant}${roomTypeLabel} ${roomNum}`
        }
      })

      setRoomAssignments(assignmentMap)
    } catch (err) {
      logger.error('載入房間分配失敗:', err)
    }
  }

  return {
    roomAssignments,
    loadRoomAssignments,
  }
}
