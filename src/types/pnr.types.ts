/**
 * PNR (Passenger Name Record) 型別定義
 */

import type { EnhancedSSR, EnhancedOSI } from '@/lib/pnr-parser'

export interface PNR {
  id: string;
  record_locator: string; // Amadeus 6位訂位代號
  workspace_id: string;
  employee_id: string | null;
  tour_id: string | null; // 關聯的團號

  // 電報原始內容
  raw_pnr: string;

  // 解析後的欄位
  passenger_names: string[];
  ticketing_deadline: string | null; // ISO timestamp
  cancellation_deadline: string | null; // ISO timestamp

  // 航班資訊
  segments: PNRSegment[];

  // SSR/OSI (JSON格式儲存)
  special_requests: EnhancedSSR[] | null;
  other_info: EnhancedOSI[] | null;

  // 狀態
  status: 'active' | 'ticketed' | 'cancelled' | 'completed';

  // 備註
  notes: string | null;

  // 系統欄位
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface PNRSegment {
  lineNumber?: number;
  airline: string; // 航空公司代碼 (e.g., "UA", "BR")
  flightNumber: string; // 航班號碼
  class: string; // 艙等 (Y, C, F, etc.)
  departureDate: string; // DDMMM format (e.g., "18JUL")
  origin: string; // 出發地 IATA 代碼
  destination: string; // 目的地 IATA 代碼
  status: string; // HK (confirmed), TK (ticketed), UC (unconfirmed), etc.
  passengers: number; // 人數
  departureTime?: string; // HHMM
  arrivalTime?: string; // HHMM
  aircraft?: string; // 機型
  // === 擴充欄位 (2026-01-04) - 列印時顯示 ===
  departureTerminal?: string; // 出發航站 (e.g., "2", "T2")
  arrivalTerminal?: string; // 抵達航站 (e.g., "3", "T3")
  meal?: string; // 航班餐食 (e.g., "午餐", "晚餐", "無")
  isDirect?: boolean; // 是否直飛
  duration?: string; // 飛行時間 (e.g., "01小時45分")
}

export interface CreatePNRInput {
  record_locator: string;
  workspace_id: string;
  employee_id?: string;
  tour_id?: string | null;
  raw_pnr: string;
  passenger_names: string[];
  ticketing_deadline?: Date | null;
  cancellation_deadline?: Date | null;
  segments: PNRSegment[];
  special_requests?: EnhancedSSR[];
  other_info?: EnhancedOSI[];
  status?: PNR['status'];
  notes?: string;
  created_by?: string;
  updated_by?: string | null;
}

export interface UpdatePNRInput {
  raw_pnr?: string;
  passenger_names?: string[];
  ticketing_deadline?: Date | null;
  cancellation_deadline?: Date | null;
  segments?: PNRSegment[];
  special_requests?: string[];
  other_info?: string[];
  status?: PNR['status'];
  notes?: string;
}

// =====================================================
// PNR Enhancement Types (2025-12-29)
// =====================================================

/**
 * 票價資料
 */
export interface FareData {
  fareBasis?: string
  currency: string
  baseFare: number
  taxes: number
  totalFare: number
  source: 'telegram' | 'manual' | 'api'
}

/**
 * 票價歷史記錄
 */
export interface PnrFareHistory {
  id: string
  workspace_id: string
  pnr_id: string
  fare_basis: string | null
  currency: string
  base_fare: number | null
  taxes: number | null
  total_fare: number
  source: 'telegram' | 'manual' | 'api'
  raw_fare_data: Record<string, unknown> | null
  recorded_at: string
  recorded_by: string | null
  created_at: string
}

/**
 * 票價警報類型
 */
export type FareAlertType = 'price_increase' | 'price_decrease' | 'threshold'

/**
 * 票價警報設定
 */
export interface PnrFareAlert {
  id: string
  workspace_id: string
  pnr_id: string
  alert_type: FareAlertType
  threshold_amount: number | null
  threshold_percent: number | null
  is_active: boolean
  last_fare: number | null
  last_checked_at: string | null
  notify_channel_id: string | null
  notify_employee_ids: string[] | null
  created_at: string
  updated_at: string
}

/**
 * 訂位狀態
 */
export type BookingStatus = 'HK' | 'TK' | 'UC' | 'XX' | 'HL' | 'HN' | 'LL' | 'WL' | string

/**
 * 營運狀態
 */
export type OperationalStatus =
  | 'ON_TIME'
  | 'DELAYED'
  | 'CANCELLED'
  | 'GATE_CHANGE'
  | 'DEPARTED'
  | 'ARRIVED'
  | 'DIVERTED'
  | string

/**
 * 航班狀態歷史
 */
export interface PnrFlightStatusHistory {
  id: string
  workspace_id: string
  pnr_id: string
  segment_id: string | null
  airline_code: string
  flight_number: string
  flight_date: string
  booking_status: BookingStatus | null
  operational_status: OperationalStatus | null
  delay_minutes: number | null
  new_departure_time: string | null
  new_arrival_time: string | null
  gate_info: string | null
  remarks: string | null
  source: 'telegram' | 'api' | 'manual'
  external_data: Record<string, unknown> | null
  recorded_at: string
}

/**
 * 通知類型
 */
export type FlightNotifyEvent = 'delay' | 'cancel' | 'gate_change' | 'departed' | 'arrived'

/**
 * 航班訂閱
 */
export interface FlightStatusSubscription {
  id: string
  workspace_id: string
  pnr_id: string | null
  segment_id: string | null
  airline_code: string
  flight_number: string
  flight_date: string
  notify_on: FlightNotifyEvent[]
  notify_channel_id: string | null
  notify_employee_ids: string[] | null
  external_provider: string | null
  external_subscription_id: string | null
  is_active: boolean
  last_checked_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Queue 任務類型
 */
export type QueueType =
  | 'pending_ticket'
  | 'pending_confirm'
  | 'schedule_change'
  | 'name_correction'
  | 'seat_request'
  | 'ssr_pending'
  | 'revalidation'
  | 'reissue'
  | 'refund'
  | 'custom'

/**
 * Queue 狀態
 */
export type QueueStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

/**
 * PNR Queue 項目
 */
export interface PnrQueueItem {
  id: string
  workspace_id: string
  pnr_id: string
  queue_type: QueueType
  priority: number
  due_date: string | null
  reminder_at: string | null
  status: QueueStatus
  assigned_to: string | null
  title: string
  description: string | null
  metadata: Record<string, unknown> | null
  completed_at: string | null
  completed_by: string | null
  resolution_notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

/**
 * Queue 統計
 */
export interface QueueStats {
  pendingTicket: number
  pendingConfirm: number
  scheduleChange: number
  ssrPending: number
  revalidation: number
  reissue: number
  overdue: number
  total: number
}

/**
 * 航變類型
 */
export type ScheduleChangeType =
  | 'time_change'
  | 'flight_change'
  | 'route_change'
  | 'equipment_change'
  | 'cancellation'

/**
 * 航變處理狀態
 */
export type ScheduleChangeStatus =
  | 'pending'
  | 'contacted'
  | 'accepted'
  | 'revalidated'
  | 'reissued'
  | 'refunded'
  | 'cancelled'

/**
 * 航變追蹤
 */
export interface PnrScheduleChange {
  id: string
  workspace_id: string
  pnr_id: string
  segment_id: string | null
  change_type: ScheduleChangeType
  original_flight_number: string | null
  original_departure_time: string | null
  original_arrival_time: string | null
  original_departure_date: string | null
  new_flight_number: string | null
  new_departure_time: string | null
  new_arrival_time: string | null
  new_departure_date: string | null
  requires_revalidation: boolean
  requires_reissue: boolean
  requires_refund: boolean
  status: ScheduleChangeStatus
  processed_by: string | null
  processed_at: string | null
  notes: string | null
  detected_at: string
  created_at: string
  updated_at: string
}

/**
 * AI 查詢記錄
 */
export interface PnrAiQuery {
  id: string
  workspace_id: string
  pnr_id: string | null
  query_text: string
  query_context: Record<string, unknown> | null
  response_text: string | null
  response_metadata: Record<string, unknown> | null
  queried_by: string | null
  created_at: string
}

/**
 * AI 查詢意圖
 */
export type QueryIntent =
  | 'meal'
  | 'deadline'
  | 'times'
  | 'passengers'
  | 'wheelchair'
  | 'baggage'
  | 'status'
  | 'segments'
  | 'unknown'

/**
 * Queue 類型標籤對應
 */
export const QUEUE_TYPE_LABELS: Record<QueueType, string> = {
  pending_ticket: '待開票',
  pending_confirm: '待確認',
  schedule_change: '航變處理',
  name_correction: '姓名更正',
  seat_request: '座位請求',
  ssr_pending: 'SSR 未確認',
  revalidation: '需 Revalidation',
  reissue: '需 Reissue',
  refund: '退票處理',
  custom: '自訂任務',
}

/**
 * 航變類型標籤對應
 */
export const SCHEDULE_CHANGE_TYPE_LABELS: Record<ScheduleChangeType, string> = {
  time_change: '時間變更',
  flight_change: '航班號變更',
  route_change: '航線變更',
  equipment_change: '機型變更',
  cancellation: '航班取消',
}

/**
 * 航變狀態標籤對應
 */
export const SCHEDULE_CHANGE_STATUS_LABELS: Record<ScheduleChangeStatus, string> = {
  pending: '待處理',
  contacted: '已聯繫',
  accepted: '已接受',
  revalidated: '已 Revalidate',
  reissued: '已 Reissue',
  refunded: '已退票',
  cancelled: '無需處理',
}
