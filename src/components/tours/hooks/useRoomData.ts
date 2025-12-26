'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { TourRoomStatus, TourRoomAssignment } from '@/types/room-vehicle.types'
import { logger } from '@/lib/utils/logger'

interface UseRoomDataProps {
  tourId: string
  open: boolean
}

export function useRoomData({ tourId, open }: UseRoomDataProps) {
  const [rooms, setRooms] = useState<TourRoomStatus[]>([])
  const [assignments, setAssignments] = useState<TourRoomAssignment[]>([])
  const [loading, setLoading] = useState(true)

  const loadRooms = async () => {
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
  }

  const loadAssignments = async () => {
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
  }

  const reload = () => {
    loadRooms()
    loadAssignments()
  }

  useEffect(() => {
    if (open) {
      loadRooms()
      loadAssignments()
    }
  }, [open, tourId])

  return {
    rooms,
    setRooms,
    assignments,
    setAssignments,
    loading,
    reload,
  }
}
