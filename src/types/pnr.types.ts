/**
 * PNR (Passenger Name Record) 型別定義
 */

import type { EnhancedSSR, EnhancedOSI } from '@/lib/pnr-parser'

export interface PNR {
  id: string;
  record_locator: string; // Amadeus 6位訂位代號
  workspace_id: string;
  employee_id: string | null;

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
}

export interface CreatePNRInput {
  record_locator: string;
  workspace_id: string;
  employee_id?: string;
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
