/**
 * 分車功能相關型別定義
 * 基於現有的 tour_vehicles 和 tour_vehicle_assignments 表結構
 */

import { BaseEntity } from './base.types'

// ============================================
// 車輛資訊介面（對應 tour_vehicles 表）
// ============================================

/**
 * TourVehicle - 旅遊團車輛資料
 */
export interface TourVehicle {
  id: string
  tour_id: string
  vehicle_name: string // 車輛名稱（如：1號車、2號車）
  vehicle_type?: string | null // 車型（如：43人座大巴）
  capacity: number // 座位數
  license_plate?: string | null // 車牌號碼
  driver_name?: string | null // 司機姓名
  driver_phone?: string | null // 司機電話
  notes?: string | null // 備註
  display_order?: number | null // 顯示順序
  created_at: string | null
  updated_at: string | null
}

/**
 * CreateTourVehicleData - 建立車輛所需資料
 */
export interface CreateTourVehicleData {
  tour_id: string
  vehicle_name: string
  vehicle_type?: string
  capacity?: number
  license_plate?: string
  driver_name?: string
  driver_phone?: string
  notes?: string
  display_order?: number
}

/**
 * UpdateTourVehicleData - 更新車輛資料
 */
export interface UpdateTourVehicleData {
  vehicle_name?: string
  vehicle_type?: string | null
  capacity?: number
  license_plate?: string | null
  driver_name?: string | null
  driver_phone?: string | null
  notes?: string | null
  display_order?: number | null
}

// ============================================
// 車輛分配介面（對應 tour_vehicle_assignments 表）
// ============================================

/**
 * TourVehicleAssignment - 車輛分配記錄
 */
export interface TourVehicleAssignment {
  id: string
  vehicle_id: string
  order_member_id: string
  seat_number?: number | null
  created_at: string | null
  updated_at: string | null
}

// ============================================
// UI 用的組合介面
// ============================================

/**
 * VehicleMember - 分車成員（用於 UI 顯示）
 */
export interface VehicleMember {
  id: string
  order_id: string
  chinese_name: string | null
  passport_name: string | null
  vehicle_id?: string | null // 分配的車輛 ID
  seat_number?: number | null // 座位號碼
  order_code?: string | null // 訂單編號
}

/**
 * VehicleWithMembers - 車輛及其成員（用於 UI）
 */
export interface VehicleWithMembers {
  vehicle: TourVehicle
  members: VehicleMember[]
  assignedCount: number
}

// ============================================
// 常用車型選項
// ============================================

export const VEHICLE_TYPES = [
  { value: '9人座', label: '9人座小巴' },
  { value: '20人座', label: '20人座中巴' },
  { value: '28人座', label: '28人座中巴' },
  { value: '35人座', label: '35人座大巴' },
  { value: '43人座', label: '43人座大巴' },
  { value: '45人座', label: '45人座大巴' },
  { value: '49人座', label: '49人座大巴' },
] as const
