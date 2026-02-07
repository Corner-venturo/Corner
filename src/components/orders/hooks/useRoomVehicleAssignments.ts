'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'

interface UseRoomVehicleAssignmentsParams {
  tourId: string
}

// 飯店欄位資訊
export interface HotelColumn {
  id: string  // hotel_name 作為 id
  name: string
  shortName: string  // 縮寫（前2字）
  checkIn: string
  checkOut: string
  nightNumbers: number[]
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
  roomAssignments: Record<string, string>  // 舊格式，合併顯示
  roomAssignmentsByHotel: Record<string, Record<string, string>>  // 新格式：hotelName -> memberId -> 房型
  hotelColumns: HotelColumn[]  // 飯店欄位列表
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
  const [roomAssignmentsByHotel, setRoomAssignmentsByHotel] = useState<Record<string, Record<string, string>>>({})
  const [hotelColumns, setHotelColumns] = useState<HotelColumn[]>([])
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

        // 收集所有不同的飯店（按 night_number 排序）
        const uniqueHotels = [...new Map(
          rooms.sort((a, b) => a.night_number - b.night_number)
               .map(r => [r.hotel_name, r.night_number])
        ).entries()]

        // 為每個飯店創建縮寫（取前2個字）
        const hotelAbbrev: Record<string, string> = {}
        uniqueHotels.forEach(([name]) => {
          if (name) {
            hotelAbbrev[name] = name.slice(0, 2)
          }
        })

        // 按成員分組所有房間分配
        const memberRooms: Record<string, { hotel: string; type: string; num: number; nightNum: number }[]> = {}

        // 計算每個飯店內的房間編號（簡化版：直接按順序編號）
        const roomNumbers: Record<string, number> = {}
        const counters: Record<string, number> = {}
        
        // 房間已按 night_number + display_order 排序（來自 SQL）
        rooms.forEach(room => {
          // 用「飯店+房型+晚數」作為分組 key
          const groupKey = `${room.hotel_name || ''}_${room.room_type}_${room.night_number}`
          if (!counters[groupKey]) {
            counters[groupKey] = 0
          }
          counters[groupKey]++
          roomNumbers[room.id] = counters[groupKey]
        })

        // 第一晚的房間用於排序
        const firstNightRooms = rooms.filter(r => r.night_number === 1)
        const roomOrderMap: Record<string, number> = {}
        firstNightRooms.forEach((room, index) => {
          roomOrderMap[room.id] = index
        })

        assignments.forEach(a => {
          const room = rooms.find(r => r.id === a.room_id)
          if (room) {
            const memberId = a.order_member_id
            if (!memberRooms[memberId]) {
              memberRooms[memberId] = []
            }
            
            // 房型標籤（簡化）
            const typeLabel = room.room_type === 'single' ? '單' :
                             room.room_type === 'double' ? '雙' :
                             room.room_type === 'twin' ? '雙床' :
                             room.room_type === 'triple' ? '三' :
                             room.room_type === 'quad' ? '四' :
                             room.room_type === 'suite' ? '套' : 
                             room.room_type.slice(0, 2)
            
            memberRooms[memberId].push({
              hotel: room.hotel_name || '',
              type: typeLabel,
              num: roomNumbers[room.id] || 1,
              nightNum: room.night_number
            })

            // 用第一晚的房間做排序
            if (room.night_number === 1) {
              const roomOrder = roomOrderMap[room.id] ?? 999
              const existingSortKeys = Object.values(sortKeys).filter(v => Math.floor(v / 10) === roomOrder)
              sortKeys[memberId] = roomOrder * 10 + existingSortKeys.length
            }
          }
        })

        // 組合顯示文字（舊格式，合併顯示）
        Object.entries(memberRooms).forEach(([memberId, roomList]) => {
          // 按 nightNum 排序，去重（同飯店只顯示一次）
          const uniqueByHotel = roomList
            .sort((a, b) => a.nightNum - b.nightNum)
            .filter((r, i, arr) => arr.findIndex(x => x.hotel === r.hotel) === i)
          
          if (uniqueByHotel.length === 1) {
            // 只有一間飯店，顯示房型+編號
            const r = uniqueByHotel[0]
            map[memberId] = `${r.type}${r.num}`
          } else {
            // 多間飯店，顯示縮寫
            map[memberId] = uniqueByHotel
              .map(r => `${hotelAbbrev[r.hotel] || ''}${r.type}${r.num}`)
              .join(' / ')
          }
        })

        // 建立飯店欄位資訊
        const hotelColsMap = new Map<string, HotelColumn>()
        rooms.forEach(room => {
          const hotelName = room.hotel_name || '未指定'
          if (!hotelColsMap.has(hotelName)) {
            hotelColsMap.set(hotelName, {
              id: hotelName,
              name: hotelName,
              shortName: hotelName.slice(0, 4),  // 取前4字作為縮寫
              checkIn: '',
              checkOut: '',
              nightNumbers: []
            })
          }
          const col = hotelColsMap.get(hotelName)!
          if (!col.nightNumbers.includes(room.night_number)) {
            col.nightNumbers.push(room.night_number)
          }
        })
        
        // 排序並計算入住/退房日期
        const sortedHotelCols = Array.from(hotelColsMap.values())
          .sort((a, b) => Math.min(...a.nightNumbers) - Math.min(...b.nightNumbers))
        
        // 按飯店分組的分房資料
        const byHotel: Record<string, Record<string, string>> = {}
        Object.entries(memberRooms).forEach(([memberId, roomList]) => {
          roomList.forEach(r => {
            if (!byHotel[r.hotel]) {
              byHotel[r.hotel] = {}
            }
            // 只保留每個飯店第一次出現的房間（因為同飯店多晚房間相同）
            if (!byHotel[r.hotel][memberId]) {
              byHotel[r.hotel][memberId] = `${r.type}${r.num}`
            }
          })
        })

        setRoomAssignments(map)
        setRoomAssignmentsByHotel(byHotel)
        setHotelColumns(sortedHotelCols)
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
    roomAssignmentsByHotel,
    hotelColumns,
    roomSortKeys,
    vehicleAssignments,
    loadRoomAssignments,
    loadVehicleAssignments,
  }
}
