/**
 * 旅遊團相關型別定義
 */

import { BaseEntity } from './base.types'
import { FlightInfo } from '@/stores/types'

// ============================================
// 旅遊團介面
// ============================================

/**
 * Tour - 旅遊團資料
 * 注意：所有可選欄位使用 | null 以符合 Supabase PostgreSQL 規範
 */
export interface Tour extends BaseEntity {
  code: string // 團號（統一使用 code）
  name: string // 團名
  location?: string | null // 目的地（相容舊欄位：destination）
  country_id?: string | null // 國家 ID
  main_city_id?: string | null // 主要城市 ID
  departure_date: string // 出發日期 (ISO 8601)（相容舊欄位：start_date）
  return_date: string // 返回日期 (ISO 8601)（相容舊欄位：end_date）
  status?: string | null // 狀態（英文）
  price?: number | null // 基本價格
  max_participants?: number | null // 最大參與人數（相容舊欄位：max_people）
  current_participants?: number | null // 當前參與人數
  contract_status: string // 合約狀態
  total_revenue: number // 總收入
  total_cost: number // 總成本
  profit: number // 利潤
  description?: string | null // 團體說明/描述
  archived?: boolean | null // 是否已封存
  is_active?: boolean | null // 是否啟用
  features?: unknown // 行程特色（用於展示頁面，對應 Supabase Json）
  quote_id?: string | null // 關聯的報價單ID
  quote_cost_structure?: unknown // 報價成本結構快照（對應 Supabase Json）
  proposal_package_id?: string | null // 關聯的提案套件 ID（來源提案）

  // 合約相關欄位
  contract_template?: string | null // 合約範本
  contract_content?: string | null // 合約內容
  contract_notes?: string | null // 合約備註
  contract_completed?: boolean | null // 合約是否完成
  contract_created_at?: string | null // 合約建立時間
  contract_archived_date?: string | null // 合約封存日期
  envelope_records?: string | null // 信封記錄

  // 結團相關欄位
  closing_status?: string | null // 結團狀態：open(進行中), closing(結團中), closed(已結團)
  closing_date?: string | null // 結團日期
  closed_by?: string | null // 結團操作人員 ID

  // 團控人員
  controller_id?: string | null // 團控人員 ID（負責開團的人）

  // 報到功能欄位
  enable_checkin?: boolean | null // 是否開啟報到功能
  checkin_qrcode?: string | null // 團體報到 QR Code 內容

  // 航班資訊
  outbound_flight?: FlightInfo | null // 去程航班
  return_flight?: FlightInfo | null // 回程航班

  // 版本鎖定欄位已移除 - 公司規範：一團一份，不需版本鎖定

  // 同步欄位
  _deleted?: boolean | null // 軟刪除標記
  _needs_sync?: boolean | null // 需要同步
  _synced_at?: string | null // 最後同步時間
}

// ============================================
// 旅遊團狀態
// ============================================

/**
 * TourStatus - 旅遊團狀態（中文）
 *
 * 生命週期流程:
 * 提案 → 進行中 → 結案
 *          ↓
 *   (解鎖回提案修改)
 *
 * - 提案：可編輯行程
 * - 進行中：已確認出團，行程鎖定
 * - 結案：團結束，結算獎金
 * - 取消：取消
 */
export type TourStatus =
  | '提案'      // 可編輯行程
  | '進行中'    // 已確認出團，行程鎖定
  | '結案'      // 團結束，結算獎金
  | '取消'      // 已取消

/**
 * ContractStatus - 合約狀態（英文）
 */
export type ContractStatus =
  | 'pending' // 未簽署
  | 'partial' // 部分簽署
  | 'signed' // 已簽署

/**
 * ContractTemplate - 合約範本類型
 */
export type ContractTemplate =
  | 'domestic' // 國內旅遊定型化契約（1120908修訂版）
  | 'international' // 國外旅遊定型化契約（1120908修訂版）
  | 'individual_international' // 國外個別旅遊定型化契約（1120908修訂版）

/**
 * TourCategory - 旅遊團分類
 */
export type TourCategory =
  | 'domestic' // 國內
  | 'international' // 國外
  | 'group' // 團體
  | 'custom' // 客製化
  | 'cruise' // 郵輪
  | 'study' // 遊學

// ============================================
// 旅遊團建立與更新
// ============================================

/**
 * CreateTourData - 建立旅遊團所需資料
 */
export interface CreateTourData {
  code?: string // 可選，由 createStore 自動生成
  name: string
  location: string
  departure_date: string
  return_date: string
  status: TourStatus
  price: number
  max_participants: number
  contract_status: ContractStatus
  total_revenue: number
  total_cost: number
  profit: number
  quote_id?: string
  quote_cost_structure?: unknown
}

/**
 * UpdateTourData - 更新旅遊團資料
 */
export interface UpdateTourData {
  code?: string
  name?: string
  location?: string
  departure_date?: string
  return_date?: string
  status?: TourStatus
  price?: number
  max_participants?: number
  contract_status?: ContractStatus
  total_revenue?: number
  total_cost?: number
  profit?: number
  quote_id?: string
  quote_cost_structure?: unknown
}

// ============================================
// 旅遊團查詢與篩選
// ============================================

/**
 * TourFilter - 旅遊團篩選條件
 */
export interface TourFilter {
  status?: TourStatus | TourStatus[]
  category?: TourCategory | TourCategory[]
  destination?: string
  start_date_from?: string
  start_date_to?: string
  is_active?: boolean
  search_term?: string // 搜尋團號或團名
}

/**
 * TourListItem - 旅遊團列表項目（精簡版）
 */
export interface TourListItem {
  id: string
  code: string
  name: string
  location: string
  departure_date: string
  return_date: string
  status: TourStatus
  max_participants: number
  price: number
}

// ============================================
// 旅遊團統計
// ============================================

/**
 * TourStats - 旅遊團統計資料
 */
export interface TourStats {
  total_tours: number
  active_tours: number
  completed_tours: number
  cancelled_tours: number
  total_revenue: number
  average_price: number
}
