'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'

interface UseRoomVehicleAssignmentsParams {
  tourId: string
}

interface UseRoomVehicleAssignmentsReturn {
  showRoomManager: boolean
  setShowRoomManager: (show: boolean) => void
  showVehicleManager: boolean
  setShowVehicleManager: (show: boolean) => void
  showRoomColumn: boolean
  setShowRoomColumn: (show: boolean) => void
  showVehicleColumn: boolean
  setShowVehicleColumn: (show: boolean) => void
  roomAssignments: Record<string, string>
  roomSortKeys: Record<string, number>
  vehicleAssignments: Record<string, string>
  loadRoomAssignments: () => Promise<void>
  loadVehicleAssignments: () => Promise<void>
}

export function useRoomVehicleAssignments({
  tourId,
}: UseRoomVehicleAssignmentsParams): UseRoomVehicleAssignmentsReturn {
  // 分房分車相關狀態
  const [showRoomManager, setShowRoomManager] = useState(false)
  const [showVehicleManager, setShowVehicleManager] = useState(false)
  const [showRoomColumn, setShowRoomColumn] = useState(false)
  const [showVehicleColumn, setShowVehicleColumn] = useState(false)
  const [roomAssignments, setRoomAssignments] = useState<Record<string, string>>({})
  const [roomSortKeys, setRoomSortKeys] = useState<Record<string, number>>({})
  const [vehicleAssignments, setVehicleAssignments] = useState<Record<string, string>>({})

  // 載入分房資訊
  const loadRoomAssignments = async () => {
    if (!tourId) return
    try {
      const { data: rooms } = await supabase
        .from('tour_rooms')
        .select('id, room_number, room_type, display_order, night_number, hotel_name')
        .eq('tour_id', tourId)
        .order('night_number')
        .order('display_order')

      if (!rooms || rooms.length === 0) {
        setRoomAssignments({})
        setRoomSortKeys({})
        return
      }

      const { data: assignments } = await supabase
        .from('tour_room_assignments')
        .select('order_member_id, room_id')
        .in('room_id', rooms.map(r => r.id))

      if (assignments) {
        const map: Record<string, string> = {}
        const sortKeys: Record<string, number> = {}

        // 只處理第一晚的房間順序（作為主要排序依據）
        const firstNightRooms = rooms.filter(r => r.night_number === 1)

        // 計算每種房型的編號（用於顯示）
        const roomCounters: Record<string, number> = {}
        const roomNumbers: Record<string, number> = {}
        firstNightRooms.forEach(room => {
          const roomKey = `${room.hotel_name || ''}_${room.room_type}`
          if (!roomCounters[roomKey]) {
            roomCounters[roomKey] = 1
          }
          roomNumbers[room.id] = roomCounters[roomKey]++
        })

        // 建立 room_id -> display_order 的映射（用於排序）
        const roomOrderMap: Record<string, number> = {}
        firstNightRooms.forEach((room, index) => {
          roomOrderMap[room.id] = index
        })

        assignments.forEach(a => {
          const room = rooms.find(r => r.id === a.room_id)
          if (room) {
            // 只有第一晚的房間用於顯示和排序
            if (room.night_number === 1) {
              const roomNum = roomNumbers[room.id] || 1
              // 房型標籤（簡化顯示）
              const typeLabel = room.room_type === 'single' ? '單人房' :
                               room.room_type === 'double' ? '雙人房' :
                               room.room_type === 'twin' ? '雙床房' :
                               room.room_type === 'triple' ? '三人房' :
                               room.room_type === 'quad' ? '四人房' :
                               room.room_type === 'suite' ? '套房' : 
                               room.room_type.length > 10 ? room.room_type.slice(0, 10) + '...' : room.room_type
              // 只顯示房型和編號，不含飯店名稱
              map[a.order_member_id] = `${typeLabel} ${roomNum}`

              // 設定排序權重：房間順序 * 10 + 房間內成員順序
              const roomOrder = roomOrderMap[room.id] ?? 999
              const existingSortKeys = Object.values(sortKeys).filter(v => Math.floor(v / 10) === roomOrder)
              sortKeys[a.order_member_id] = roomOrder * 10 + existingSortKeys.length
            }
          }
        })

        setRoomAssignments(map)
        setRoomSortKeys(sortKeys)
        // 有分房資料時自動顯示欄位
        if (Object.keys(map).length > 0) {
          setShowRoomColumn(true)
        }
      }
    } catch (error) {
      logger.error('載入分房資訊失敗:', error)
    }
  }

  // 載入分車資訊
  const loadVehicleAssignments = async () => {
    if (!tourId) return
    try {
      const { data: vehicles } = await supabase
        .from('tour_vehicles')
        .select('id, vehicle_name, vehicle_type')
        .eq('tour_id', tourId)

      if (!vehicles || vehicles.length === 0) return

      const { data: assignments } = await supabase
        .from('tour_vehicle_assignments')
        .select('order_member_id, vehicle_id')
        .in('vehicle_id', vehicles.map(v => v.id))

      if (assignments) {
        const map: Record<string, string> = {}
        assignments.forEach(a => {
          const vehicle = vehicles.find(v => v.id === a.vehicle_id)
          if (vehicle) {
            map[a.order_member_id] = vehicle.vehicle_name || vehicle.vehicle_type || '已分車'
          }
        })
        setVehicleAssignments(map)
        // 有分車資料時自動顯示欄位
        if (Object.keys(map).length > 0) {
          setShowVehicleColumn(true)
        }
      }
    } catch (error) {
      logger.error('載入分車資訊失敗:', error)
    }
  }

  return {
    showRoomManager,
    setShowRoomManager,
    showVehicleManager,
    setShowVehicleManager,
    showRoomColumn,
    setShowRoomColumn,
    showVehicleColumn,
    setShowVehicleColumn,
    roomAssignments,
    roomSortKeys,
    vehicleAssignments,
    loadRoomAssignments,
    loadVehicleAssignments,
  }
}
