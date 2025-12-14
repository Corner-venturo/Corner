/**
 * 分房分車系統類型定義
 */

import { BaseEntity } from './base.types'

// ============================================
// 房間相關
// ============================================

/**
 * TourRoom - 房間設定
 */
export interface TourRoom extends BaseEntity {
  tour_id: string
  hotel_name: string
  room_type: string
  room_number: string | null
  capacity: number
  night_number: number
  notes: string | null
  display_order: number
}

/**
 * TourRoomStatus - 房間使用狀況 (含分配人數)
 */
export interface TourRoomStatus extends TourRoom {
  assigned_count: number
  remaining_beds: number
  is_full: boolean
}

/**
 * TourRoomAssignment - 房間分配
 */
export interface TourRoomAssignment extends BaseEntity {
  room_id: string
  order_member_id: string
  bed_number: number | null
}

/**
 * CreateTourRoomData - 建立房間
 */
export interface CreateTourRoomData {
  tour_id: string
  hotel_name: string
  room_type: string
  room_number?: string
  capacity?: number
  night_number?: number
  notes?: string
  display_order?: number
}

/**
 * CreateRoomAssignmentData - 分配房間
 */
export interface CreateRoomAssignmentData {
  room_id: string
  order_member_id: string
  bed_number?: number
}

// ============================================
// 車輛相關
// ============================================

/**
 * TourVehicle - 車輛設定
 */
export interface TourVehicle extends BaseEntity {
  tour_id: string
  vehicle_name: string
  vehicle_type: string | null
  capacity: number
  driver_name: string | null
  driver_phone: string | null
  license_plate: string | null
  notes: string | null
  display_order: number
}

/**
 * TourVehicleStatus - 車輛使用狀況 (含分配人數)
 */
export interface TourVehicleStatus extends TourVehicle {
  assigned_count: number
  remaining_seats: number
  is_full: boolean
}

/**
 * TourVehicleAssignment - 車輛分配
 */
export interface TourVehicleAssignment extends BaseEntity {
  vehicle_id: string
  order_member_id: string
  seat_number: number | null
}

/**
 * CreateTourVehicleData - 建立車輛
 */
export interface CreateTourVehicleData {
  tour_id: string
  vehicle_name: string
  vehicle_type?: string
  capacity?: number
  driver_name?: string
  driver_phone?: string
  license_plate?: string
  notes?: string
  display_order?: number
}

/**
 * CreateVehicleAssignmentData - 分配車輛
 */
export interface CreateVehicleAssignmentData {
  vehicle_id: string
  order_member_id: string
  seat_number?: number
}

// ============================================
// 房型常量
// ============================================

export const ROOM_TYPES = [
  { value: 'single', label: '單人房' },
  { value: 'double', label: '雙人房' },
  { value: 'triple', label: '三人房' },
  { value: 'quad', label: '四人房' },
  { value: 'suite', label: '套房' },
] as const

export type RoomTypeValue = typeof ROOM_TYPES[number]['value']

// ============================================
// 車型常量
// ============================================

export const VEHICLE_TYPES = [
  { value: 'large_bus', label: '大巴 (45人)', capacity: 45 },
  { value: 'medium_bus', label: '中巴 (28人)', capacity: 28 },
  { value: 'mini_bus', label: '小巴 (20人)', capacity: 20 },
  { value: 'van', label: '商務車 (9人)', capacity: 9 },
  { value: 'car', label: '轎車 (4人)', capacity: 4 },
] as const

export type VehicleTypeValue = typeof VEHICLE_TYPES[number]['value']
