'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { TourRoomStatus } from '@/types/room-vehicle.types'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'
import { differenceInDays, parseISO } from 'date-fns'

interface NightRoomConfig {
  hotel_name: string
  double_count: number
  triple_count: number
  single_count: number
  quad_count: number
}

interface TourInfo {
  id: string
  departure_date: string
  return_date: string
}

interface UseRoomConfigProps {
  tour?: TourInfo
  tourId: string
  rooms: TourRoomStatus[]
  assignments: Array<{ id: string; room_id: string; order_member_id: string }>
  reload: () => void
}

export function useRoomConfig({ tour, tourId, rooms, assignments, reload }: UseRoomConfigProps) {
  const [nightConfigs, setNightConfigs] = useState<Record<number, NightRoomConfig>>({})
  const [continueFromPrevious, setContinueFromPrevious] = useState<Set<number>>(new Set())

  // 計算行程天數
  const tourNights = useMemo(() => {
    if (!tour?.departure_date || !tour?.return_date) return 0
    try {
      const startDate = parseISO(tour.departure_date)
      const endDate = parseISO(tour.return_date)
      const days = differenceInDays(endDate, startDate) + 1
      return Math.max(days - 1, 0)
    } catch {
      return 0
    }
  }, [tour?.departure_date, tour?.return_date])

  const maxNight = tourNights > 0 ? tourNights : Math.max(...[...new Set(rooms.map(r => r.night_number))], 1)

  // 從現有房間資料建立 nightConfigs
  useEffect(() => {
    if (rooms.length > 0) {
      const configs: Record<number, NightRoomConfig> = {}
      const continuedNights = new Set<number>()

      for (let night = 1; night <= maxNight; night++) {
        const nightRooms = rooms.filter(r => r.night_number === night)
        if (nightRooms.length > 0) {
          const hotelName = nightRooms[0]?.hotel_name || ''
          configs[night] = {
            hotel_name: hotelName,
            double_count: nightRooms.filter(r => r.room_type === 'double').length,
            triple_count: nightRooms.filter(r => r.room_type === 'triple').length,
            single_count: nightRooms.filter(r => r.room_type === 'single').length,
            quad_count: nightRooms.filter(r => r.room_type === 'quad').length,
          }

          if (night > 1) {
            const prevConfig = configs[night - 1]
            if (prevConfig && prevConfig.hotel_name === hotelName) {
              continuedNights.add(night)
            }
          }
        }
      }

      setNightConfigs(configs)
      setContinueFromPrevious(continuedNights)
    }
  }, [rooms, maxNight])

  const getEffectiveConfig = (nightNumber: number): NightRoomConfig | null => {
    if (continueFromPrevious.has(nightNumber) && nightNumber > 1) {
      return getEffectiveConfig(nightNumber - 1)
    }
    return nightConfigs[nightNumber] || null
  }

  const updateNightConfig = (nightNumber: number, updates: Partial<NightRoomConfig>) => {
    setNightConfigs(prev => ({
      ...prev,
      [nightNumber]: {
        ...prev[nightNumber] || { hotel_name: '', double_count: 0, triple_count: 0, single_count: 0, quad_count: 0 },
        ...updates
      }
    }))
  }

  const toggleContinueFromPrevious = async (nightNumber: number) => {
    if (nightNumber <= 1) return

    const newContinued = new Set(continueFromPrevious)
    if (newContinued.has(nightNumber)) {
      // 取消續住
      newContinued.delete(nightNumber)
      setContinueFromPrevious(newContinued)
    } else {
      // 設為續住：複製前一晚的房間設定到這一晚
      newContinued.add(nightNumber)

      // 找到前一晚的房間（遞迴找到非續住的那一晚）
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
        // 先刪除當前晚的房間（會自動刪除關聯的 assignments）
        const currentNightRoomIds = rooms.filter(r => r.night_number === nightNumber).map(r => r.id)
        if (currentNightRoomIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('tour_rooms')
            .delete()
            .in('id', currentNightRoomIds)
          if (deleteError) throw deleteError
        }

        // 複製前一晚的房間到這一晚（包含 booking_code 和 amount）
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

        // 複製團員分配
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
        reload()
      } catch (error) {
        logger.error('續住設定失敗:', error)
        toast.error('續住設定失敗')
      }
    }
  }

  const applyNightConfig = async (nightNumber: number) => {
    const config = getEffectiveConfig(nightNumber)
    if (!config || !config.hotel_name.trim()) {
      toast.error('請輸入飯店名稱')
      return
    }

    try {
      const nightRoomIds = rooms.filter(r => r.night_number === nightNumber).map(r => r.id)
      if (nightRoomIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('tour_rooms')
          .delete()
          .in('id', nightRoomIds)
        if (deleteError) throw deleteError
      }

      const newRooms: Array<{
        tour_id: string
        hotel_name: string
        room_type: string
        capacity: number
        night_number: number
        display_order: number
      }> = []
      let order = 0

      for (let i = 0; i < config.double_count; i++) {
        newRooms.push({
          tour_id: tourId,
          hotel_name: config.hotel_name,
          room_type: 'double',
          capacity: 2,
          night_number: nightNumber,
          display_order: order++,
        })
      }

      for (let i = 0; i < config.triple_count; i++) {
        newRooms.push({
          tour_id: tourId,
          hotel_name: config.hotel_name,
          room_type: 'triple',
          capacity: 3,
          night_number: nightNumber,
          display_order: order++,
        })
      }

      for (let i = 0; i < config.single_count; i++) {
        newRooms.push({
          tour_id: tourId,
          hotel_name: config.hotel_name,
          room_type: 'single',
          capacity: 1,
          night_number: nightNumber,
          display_order: order++,
        })
      }

      for (let i = 0; i < config.quad_count; i++) {
        newRooms.push({
          tour_id: tourId,
          hotel_name: config.hotel_name,
          room_type: 'quad',
          capacity: 4,
          night_number: nightNumber,
          display_order: order++,
        })
      }

      if (newRooms.length > 0) {
        const { error: insertError } = await supabase
          .from('tour_rooms')
          .insert(newRooms)
        if (insertError) throw insertError
      }

      toast.success(`第 ${nightNumber} 晚房間已更新`)
      reload()
    } catch (error) {
      logger.error('套用設定失敗:', error)
      toast.error('套用設定失敗')
    }
  }

  return {
    nightConfigs,
    continueFromPrevious,
    tourNights,
    maxNight,
    getEffectiveConfig,
    updateNightConfig,
    toggleContinueFromPrevious,
    applyNightConfig,
  }
}
