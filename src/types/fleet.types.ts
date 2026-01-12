/**
 * 車庫管理系統 - TypeScript 類型定義
 */

// ============================================
// 車輛類型
// ============================================

export type VehicleType = 'large_bus' | 'medium_bus' | 'mini_bus' | 'van' | 'car'
export type VehicleStatus = 'available' | 'in_use' | 'maintenance' | 'retired'

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
  { value: 'in_use', label: '使用中', color: 'bg-status-info' },
  { value: 'maintenance', label: '維修中', color: 'bg-morandi-gold' },
  { value: 'retired', label: '停用', color: 'bg-morandi-secondary' },
] as const

export interface VehicleDocument {
  type: 'registration' | 'insurance' | 'inspection' | 'maintenance' | 'other'
  name: string
  url: string
  uploaded_at: string
}

/**
 * 車輛資料（擴充版）
 */
export interface FleetVehicle {
  id: string
  workspace_id: string

  // 基本資訊
  license_plate: string
  vehicle_name: string | null
  vehicle_type: VehicleType
  brand: string | null
  model: string | null
  year: number | null
  capacity: number
  vin: string | null

  // 預設司機
  default_driver_id: string | null
  // 向後兼容（資料庫仍保留這些欄位）
  driver_name?: string | null
  driver_phone?: string | null

  // 重要日期（新增）
  registration_date: string | null
  inspection_due_date: string | null
  insurance_due_date: string | null
  last_maintenance_date: string | null
  next_maintenance_date: string | null
  next_maintenance_km: number | null
  current_mileage: number

  // 文件
  documents: VehicleDocument[]

  // 狀態
  status: VehicleStatus
  notes: string | null
  display_order: number

  // 追蹤
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null

  // 關聯（前端 join）
  default_driver?: FleetDriver
}

// ============================================
// 司機類型
// ============================================

export type DriverStatus = 'active' | 'inactive' | 'suspended'
export type LicenseType = 'professional' | 'regular'

export const DRIVER_STATUS_OPTIONS = [
  { value: 'active', label: '在職', color: 'bg-morandi-green' },
  { value: 'inactive', label: '離職', color: 'bg-morandi-secondary' },
  { value: 'suspended', label: '停權', color: 'bg-morandi-red' },
] as const

/**
 * 司機資料
 */
export interface FleetDriver {
  id: string
  workspace_id: string
  employee_id: string | null

  // 基本資訊
  name: string
  phone: string | null
  id_number: string | null

  // 駕照
  license_number: string | null
  license_type: LicenseType
  license_expiry_date: string | null
  license_image_url: string | null

  // 職業駕照（大客車）
  professional_license_number: string | null
  professional_license_expiry: string | null
  professional_license_image_url: string | null

  // 健康檢查
  health_check_date: string | null
  health_check_expiry: string | null
  health_check_document_url: string | null

  // 狀態
  status: DriverStatus
  notes: string | null

  // 追蹤
  created_at: string
  updated_at: string
}

// ============================================
// 維護記錄類型
// ============================================

export type LogType =
  | 'inspection'   // 驗車
  | 'maintenance'  // 保養
  | 'repair'       // 維修
  | 'insurance'    // 保險
  | 'mileage'      // 里程更新
  | 'incident'     // 事故
  | 'fuel'         // 加油

export const LOG_TYPE_OPTIONS = [
  { value: 'inspection', label: '驗車', icon: '🔍' },
  { value: 'maintenance', label: '保養', icon: '🔧' },
  { value: 'repair', label: '維修', icon: '🛠️' },
  { value: 'insurance', label: '保險', icon: '📋' },
  { value: 'mileage', label: '里程', icon: '📏' },
  { value: 'incident', label: '事故', icon: '⚠️' },
  { value: 'fuel', label: '加油', icon: '⛽' },
] as const

export interface LogDocument {
  name: string
  url: string
}

/**
 * 車輛維護記錄
 */
export interface FleetVehicleLog {
  id: string
  workspace_id: string
  vehicle_id: string

  log_type: LogType
  log_date: string
  description: string | null
  cost: number | null
  mileage: number | null
  next_due_date: string | null
  next_due_mileage: number | null
  vendor_name: string | null
  documents: LogDocument[]
  notes: string | null

  created_at: string
  updated_at: string
  created_by: string | null

  // 關聯
  vehicle?: FleetVehicle
}

// ============================================
// 調度類型
// ============================================

export type ScheduleStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

export const SCHEDULE_STATUS_OPTIONS = [
  { value: 'pending', label: '待確認', color: 'bg-morandi-gold' },
  { value: 'confirmed', label: '已確認', color: 'bg-morandi-green' },
  { value: 'in_progress', label: '進行中', color: 'bg-status-info' },
  { value: 'completed', label: '已完成', color: 'bg-morandi-secondary' },
  { value: 'cancelled', label: '已取消', color: 'bg-morandi-red' },
] as const

/**
 * 車輛調度
 */
export interface FleetSchedule {
  id: string
  workspace_id: string
  vehicle_id: string
  driver_id: string | null

  // 日期
  start_date: string
  end_date: string

  // 客戶資訊
  client_workspace_id: string | null
  client_name: string | null
  tour_id: string | null
  tour_name: string | null
  tour_code: string | null
  contact_person: string | null
  contact_phone: string | null

  // 路線
  pickup_location: string | null
  destination: string | null
  route_notes: string | null

  // 費用
  rental_fee: number | null

  // 狀態
  status: ScheduleStatus
  notes: string | null

  // 向後兼容（資料庫仍保留這些欄位）
  driver_name?: string | null
  driver_phone?: string | null

  created_at: string
  updated_at: string

  // 關聯
  vehicle?: FleetVehicle
  driver?: FleetDriver
}

/**
 * 車輛調度（含車輛資訊）- 向後相容
 */
export interface FleetScheduleWithVehicle extends FleetSchedule {
  license_plate: string
  vehicle_name: string | null
  vehicle_type: VehicleType
  capacity: number
  effective_driver_name: string | null
  effective_driver_phone: string | null
}

// ============================================
// 領隊調度（保留原有）
// ============================================

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

export interface LeaderScheduleWithLeader extends LeaderSchedule {
  leader_name: string
  leader_name_en: string | null
  leader_phone: string | null
  languages: string[] | null
  specialties: string[] | null
}

// ============================================
// 表單類型
// ============================================

export interface FleetVehicleFormData {
  license_plate: string
  vehicle_name: string
  vehicle_type: VehicleType
  brand: string
  model: string
  year: number | null
  capacity: number
  vin: string

  // 日期
  registration_date: string
  inspection_due_date: string
  insurance_due_date: string
  next_maintenance_date: string
  next_maintenance_km: number | null
  current_mileage: number

  status: VehicleStatus
  notes: string
}

export interface FleetDriverFormData {
  name: string
  phone: string
  id_number: string
  license_number: string
  license_type: LicenseType
  license_expiry_date: string
  professional_license_number: string
  professional_license_expiry: string
  health_check_expiry: string
  status: DriverStatus
  notes: string
}

export interface FleetScheduleFormData {
  vehicle_id: string
  driver_id: string
  start_date: string
  end_date: string
  client_name: string
  tour_name: string
  tour_code: string
  contact_person: string
  contact_phone: string
  pickup_location: string
  destination: string
  rental_fee: number | null
  notes: string
  // 向後兼容（資料庫仍保留這些欄位）
  driver_name?: string
  driver_phone?: string
}

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

// ============================================
// 提醒類型
// ============================================

export type ReminderType = 'inspection' | 'maintenance' | 'insurance' | 'license' | 'health_check'

export interface FleetReminder {
  type: ReminderType
  target: 'vehicle' | 'driver'
  targetId: string
  targetName: string
  dueDate: string
  daysUntilDue: number
  isOverdue: boolean
}

// ============================================
// Helper Functions
// ============================================

export function getVehicleTypeLabel(type: VehicleType): string {
  return VEHICLE_TYPE_OPTIONS.find(o => o.value === type)?.label || type
}

export function getVehicleStatusLabel(status: VehicleStatus): string {
  return VEHICLE_STATUS_OPTIONS.find(o => o.value === status)?.label || status
}

export function getVehicleStatusColor(status: VehicleStatus): string {
  return VEHICLE_STATUS_OPTIONS.find(o => o.value === status)?.color || 'bg-morandi-secondary'
}

export function getDriverStatusLabel(status: DriverStatus): string {
  return DRIVER_STATUS_OPTIONS.find(o => o.value === status)?.label || status
}

export function getDriverStatusColor(status: DriverStatus): string {
  return DRIVER_STATUS_OPTIONS.find(o => o.value === status)?.color || 'bg-morandi-secondary'
}

export function getScheduleStatusLabel(status: ScheduleStatus): string {
  return SCHEDULE_STATUS_OPTIONS.find(o => o.value === status)?.label || status
}

export function getScheduleStatusColor(status: ScheduleStatus): string {
  return SCHEDULE_STATUS_OPTIONS.find(o => o.value === status)?.color || 'bg-morandi-secondary'
}

export function getLogTypeLabel(type: LogType): string {
  return LOG_TYPE_OPTIONS.find(o => o.value === type)?.label || type
}

export function getLogTypeIcon(type: LogType): string {
  return LOG_TYPE_OPTIONS.find(o => o.value === type)?.icon || '📝'
}

/**
 * 計算距離到期日的天數
 */
export function getDaysUntilDue(dueDate: string | null): number | null {
  if (!dueDate) return null
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * 取得到期狀態顏色
 */
export function getDueStatusColor(daysUntilDue: number | null): string {
  if (daysUntilDue === null) return 'text-morandi-secondary'
  if (daysUntilDue < 0) return 'text-morandi-red'  // 已過期
  if (daysUntilDue <= 7) return 'text-morandi-red'  // 7天內
  if (daysUntilDue <= 30) return 'text-morandi-gold'  // 30天內
  return 'text-morandi-green'  // 正常
}
