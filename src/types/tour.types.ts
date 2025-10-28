/**
 * 旅遊團相關型別定義
 */

import { BaseEntity } from './base.types';

// ============================================
// 旅遊團介面
// ============================================

/**
 * Tour - 旅遊團資料
 */
export interface Tour extends BaseEntity {
  code: string;              // 團號（統一使用 code）
  name: string;              // 團名
  location?: string;         // 目的地（相容舊欄位：destination）
  country_id?: string;       // 國家 ID
  main_city_id?: string;     // 主要城市 ID
  departure_date: string;    // 出發日期 (ISO 8601)（相容舊欄位：start_date）
  return_date: string;       // 返回日期 (ISO 8601)（相容舊欄位：end_date）
  status?: string;           // 狀態（英文）
  price?: number;            // 基本價格
  max_participants?: number; // 最大參與人數（相容舊欄位：max_people）
  current_participants?: number; // 當前參與人數
  contract_status: string;   // 合約狀態
  total_revenue: number;     // 總收入
  total_cost: number;        // 總成本
  profit: number;            // 利潤
  description?: string;      // 團體說明/描述
  archived?: boolean;        // 是否已封存
  is_active?: boolean;       // 是否啟用
  features?: unknown;        // 行程特色（用於展示頁面）
  quote_id?: string;         // 關聯的報價單ID
  quote_cost_structure?: unknown; // 報價成本結構快照

  // 合約相關欄位
  contract_template?: string;     // 合約範本
  contract_content?: string;      // 合約內容
  contract_notes?: string;        // 合約備註
  contract_completed?: boolean;   // 合約是否完成
  contract_created_at?: string;   // 合約建立時間
  contract_archived_date?: string; // 合約封存日期
  envelope_records?: string;      // 信封記錄

  // 同步欄位
  _deleted?: boolean;        // 軟刪除標記
  _needs_sync?: boolean;     // 需要同步
  _synced_at?: string;       // 最後同步時間
}

// ============================================
// 旅遊團狀態
// ============================================

/**
 * TourStatus - 旅遊團狀態（英文）
 */
export type TourStatus =
  | 'draft'          // 提案階段
  | 'active'         // 進行中
  | 'pending_close'  // 待結案
  | 'closed'         // 已結案
  | 'cancelled'      // 已取消
  | 'special';       // 特殊團

/**
 * ContractStatus - 合約狀態（英文）
 */
export type ContractStatus =
  | 'pending'  // 未簽署
  | 'partial'  // 部分簽署
  | 'signed';  // 已簽署

/**
 * TourCategory - 旅遊團分類
 */
export type TourCategory =
  | 'domestic'      // 國內
  | 'international' // 國外
  | 'group'         // 團體
  | 'custom'        // 客製化
  | 'cruise'        // 郵輪
  | 'study';        // 遊學

// ============================================
// 旅遊團建立與更新
// ============================================

/**
 * CreateTourData - 建立旅遊團所需資料
 */
export interface CreateTourData {
  code?: string;             // 可選，由 createStore 自動生成
  name: string;
  location: string;
  departure_date: string;
  return_date: string;
  status: TourStatus;
  price: number;
  max_participants: number;
  contract_status: ContractStatus;
  total_revenue: number;
  total_cost: number;
  profit: number;
  quote_id?: string;
  quote_cost_structure?: unknown[];
}

/**
 * UpdateTourData - 更新旅遊團資料
 */
export interface UpdateTourData {
  code?: string;
  name?: string;
  location?: string;
  departure_date?: string;
  return_date?: string;
  status?: TourStatus;
  price?: number;
  max_participants?: number;
  contract_status?: ContractStatus;
  total_revenue?: number;
  total_cost?: number;
  profit?: number;
  quote_id?: string;
  quote_cost_structure?: unknown[];
}

// ============================================
// 旅遊團查詢與篩選
// ============================================

/**
 * TourFilter - 旅遊團篩選條件
 */
export interface TourFilter {
  status?: TourStatus | TourStatus[];
  category?: TourCategory | TourCategory[];
  destination?: string;
  start_date_from?: string;
  start_date_to?: string;
  is_active?: boolean;
  search_term?: string; // 搜尋團號或團名
}

/**
 * TourListItem - 旅遊團列表項目（精簡版）
 */
export interface TourListItem {
  id: string;
  code: string;
  name: string;
  location: string;
  departure_date: string;
  return_date: string;
  status: TourStatus;
  max_participants: number;
  price: number;
}

// ============================================
// 旅遊團統計
// ============================================

/**
 * TourStats - 旅遊團統計資料
 */
export interface TourStats {
  total_tours: number;
  active_tours: number;
  completed_tours: number;
  cancelled_tours: number;
  total_revenue: number;
  average_price: number;
}
