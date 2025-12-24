'use client'

import { useState, useEffect } from 'react'
import { supabase as supabaseClient } from '@/lib/supabase/client'
import type { TourRoomStatus, TourRoomAssignment } from '@/types/room-vehicle.types'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'

const supabase = supabaseClient as unknown as typeof supabaseClient

interface UseContinueFromPreviousProps {
  tourId: string
  rooms: TourRoomStatus[]
  assignments: TourRoomAssignment[]
  loadRooms: () => Promise<void>
  loadAssignments: () => Promise<void>
}

interface UseContinueFromPreviousReturn {
  continueFromPrevious: Set<number>
  toggleContinueFromPrevious: (nightNumber: number) => Promise<void>
}

export function useContinueFromPrevious({
  tourId,
  rooms,
  assignments,
  loadRooms,
  loadAssignments,
}: UseContinueFromPreviousProps): UseContinueFromPreviousReturn {
  const [continueFromPrevious, setContinueFromPrevious] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (rooms.length > 0) {
      const maxNight = Math.max(...rooms.map(r => r.night_number))
      const continuedNights = new Set<number>()
      const nightHotels: Record<number, string> = {}

      for (let night = 1; night <= maxNight; night++) {
        const nightRooms = rooms.filter(r => r.night_number === night)
        if (nightRooms.length > 0) {
          const hotelName = nightRooms[0]?.hotel_name || ''
          nightHotels[night] = hotelName

          if (night > 1) {
            const prevHotel = nightHotels[night - 1]
            if (prevHotel && prevHotel === hotelName) {
              continuedNights.add(night)
            }
          }
        }
      }

      setContinueFromPrevious(continuedNights)
    }
  }, [rooms])

  const toggleContinueFromPrevious = async (nightNumber: number) => {
    if (nightNumber <= 1) return

    const newContinued = new Set(continueFromPrevious)
    if (newContinued.has(nightNumber)) {
      newContinued.delete(nightNumber)
      setContinueFromPrevious(newContinued)
    } else {
      newContinued.add(nightNumber)

      let sourceNight = nightNumber - 1
      while (newContinued.has(sourceNight) && sourceNight > 1) {
        sourceNight--
      }

      const sourceRooms = rooms.filter(r => r.night_number === sourceNight)
      if (sourceRooms.length === 0) {
        toast.error('前一晚尚未設定房間')
        return
      }

      try {
        const currentNightRoomIds = rooms.filter(r => r.night_number === nightNumber).map(r => r.id)
        if (currentNightRoomIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('tour_rooms')
            .delete()
            .in('id', currentNightRoomIds)
          if (deleteError) throw deleteError
        }

        const newRooms = sourceRooms.map((room, index) => ({
          tour_id: tourId,
          hotel_name: room.hotel_name,
          room_type: room.room_type,
          capacity: room.capacity,
          night_number: nightNumber,
          display_order: index,
          booking_code: room.booking_code,
          amount: room.amount,
        }))

        const { data: insertedRooms, error: insertError } = await supabase
          .from('tour_rooms')
          .insert(newRooms)
          .select('id')
        if (insertError) throw insertError

        if (insertedRooms && insertedRooms.length > 0) {
          const sourceRoomIds = sourceRooms.map(r => r.id)
          const sourceAssignments = assignments.filter(a => sourceRoomIds.includes(a.room_id))

          if (sourceAssignments.length > 0) {
            const roomIdMapping: Record<string, string> = {}
            sourceRooms.forEach((sourceRoom, index) => {
              if (insertedRooms[index]) {
                roomIdMapping[sourceRoom.id] = insertedRooms[index].id
              }
            })

            const newAssignments = sourceAssignments
              .filter(a => roomIdMapping[a.room_id])
              .map(a => ({
                room_id: roomIdMapping[a.room_id],
                order_member_id: a.order_member_id,
              }))

            if (newAssignments.length > 0) {
              const { error: assignError } = await supabase
                .from('tour_room_assignments')
                .insert(newAssignments)
              if (assignError) {
                logger.error('複製分配失敗:', assignError)
              }
            }
          }
        }

        setContinueFromPrevious(newContinued)
        toast.success(`已複製第 ${sourceNight} 晚的房間設定及分配`)
        await loadRooms()
        await loadAssignments()
      } catch (error) {
        logger.error('續住設定失敗:', error)
        toast.error('續住設定失敗')
      }
    }
  }

  return {
    continueFromPrevious,
    toggleContinueFromPrevious,
  }
}
