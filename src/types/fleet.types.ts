/**
 * 車隊管理類型定義
 */

export type VehicleType = 'large_bus' | 'medium_bus' | 'mini_bus' | 'van' | 'car'
export type VehicleStatus = 'available' | 'maintenance' | 'retired'
export type ScheduleStatus = 'pending' | 'confirmed' | 'cancelled'

// 車型選項
export const VEHICLE_TYPE_OPTIONS = [
  { value: 'large_bus', label: '大巴 (45人)', capacity: 45 },
  { value: 'medium_bus', label: '中巴 (28人)', capacity: 28 },
  { value: 'mini_bus', label: '小巴 (20人)', capacity: 20 },
  { value: 'van', label: '商務車 (9人)', capacity: 9 },
  { value: 'car', label: '轎車 (4人)', capacity: 4 },
] as const

// 車輛狀態選項
export const VEHICLE_STATUS_OPTIONS = [
  { value: 'available', label: '可用', color: 'bg-morandi-green' },
  { value: 'maintenance', label: '維修中', color: 'bg-morandi-gold' },
  { value: 'retired', label: '已退役', color: 'bg-morandi-secondary' },
] as const

// 調度狀態選項
export const SCHEDULE_STATUS_OPTIONS = [
  { value: 'pending', label: '待確認', color: 'bg-morandi-gold' },
  { value: 'confirmed', label: '已確認', color: 'bg-morandi-green' },
  { value: 'cancelled', label: '已取消', color: 'bg-morandi-red' },
] as const

/**
 * 車輛資料
 */
export interface FleetVehicle {
  id: string
  workspace_id: string
  license_plate: string
  vehicle_name: string | null
  vehicle_type: VehicleType
  capacity: number
  driver_name: string | null
  driver_phone: string | null
  status: VehicleStatus
  notes: string | null
  display_order: number
  created_at: string
  updated_at: string
}

/**
 * 車輛調度
 */
export interface FleetSchedule {
  id: string
  workspace_id: string
  vehicle_id: string
  start_date: string
  end_date: string
  client_name: string | null
  tour_name: string | null
  tour_code: string | null
  contact_person: string | null
  contact_phone: string | null
  driver_name: string | null
  driver_phone: string | null
  status: ScheduleStatus
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

/**
 * 車輛調度（含車輛資訊）
 */
export interface FleetScheduleWithVehicle extends FleetSchedule {
  license_plate: string
  vehicle_name: string | null
  vehicle_type: VehicleType
  capacity: number
  effective_driver_name: string | null
  effective_driver_phone: string | null
}

/**
 * 領隊調度
 */
export interface LeaderSchedule {
  id: string
  workspace_id: string
  leader_id: string
  start_date: string
  end_date: string
  tour_id: string | null
  tour_name: string | null
  tour_code: string | null
  destination: string | null
  status: ScheduleStatus
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

/**
 * 領隊調度（含領隊資訊）
 */
export interface LeaderScheduleWithLeader extends LeaderSchedule {
  leader_name: string
  leader_name_en: string | null
  leader_phone: string | null
  languages: string[] | null
  specialties: string[] | null
}

/**
 * 車輛表單資料
 */
export interface FleetVehicleFormData {
  license_plate: string
  vehicle_name: string
  vehicle_type: VehicleType
  capacity: number
  driver_name: string
  driver_phone: string
  status: VehicleStatus
  notes: string
}

/**
 * 調度表單資料
 */
export interface FleetScheduleFormData {
  vehicle_id: string
  start_date: string
  end_date: string
  client_name: string
  tour_name: string
  tour_code: string
  contact_person: string
  contact_phone: string
  driver_name: string
  driver_phone: string
  notes: string
}

/**
 * 領隊調度表單資料
 */
export interface LeaderScheduleFormData {
  leader_id: string
  start_date: string
  end_date: string
  tour_id: string
  tour_name: string
  tour_code: string
  destination: string
  notes: string
}

// Helper functions
export function getVehicleTypeLabel(type: VehicleType): string {
  return VEHICLE_TYPE_OPTIONS.find(o => o.value === type)?.label || type
}

export function getVehicleStatusLabel(status: VehicleStatus): string {
  return VEHICLE_STATUS_OPTIONS.find(o => o.value === status)?.label || status
}

export function getVehicleStatusColor(status: VehicleStatus): string {
  return VEHICLE_STATUS_OPTIONS.find(o => o.value === status)?.color || 'bg-gray-500'
}

export function getScheduleStatusLabel(status: ScheduleStatus): string {
  return SCHEDULE_STATUS_OPTIONS.find(o => o.value === status)?.label || status
}

export function getScheduleStatusColor(status: ScheduleStatus): string {
  return SCHEDULE_STATUS_OPTIONS.find(o => o.value === status)?.color || 'bg-gray-500'
}
