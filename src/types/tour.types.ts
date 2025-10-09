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
  destination: string;       // 目的地
  start_date: string;        // 出發日期 (ISO 8601)
  end_date: string;          // 結束日期 (ISO 8601)
  days: number;              // 天數
  nights: number;            // 夜數
  status: TourStatus;        // 狀態
  category?: TourCategory;   // 分類
  min_people?: number;       // 最低成團人數
  max_people?: number;       // 最高人數
  current_people?: number;   // 當前報名人數
  price?: number;            // 基本價格
  description?: string;      // 說明
  notes?: string;            // 備註
  is_active: boolean;        // 是否啟用
  leader_id?: string;        // 領隊 ID
  leader_name?: string;      // 領隊名稱
}

// ============================================
// 旅遊團狀態
// ============================================

/**
 * TourStatus - 旅遊團狀態
 */
export type TourStatus =
  | 'draft'      // 草稿
  | 'active'     // 進行中
  | 'completed'  // 已完成
  | 'cancelled'; // 已取消

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
  code: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  days: number;
  nights: number;
  status: TourStatus;
  category?: TourCategory;
  min_people?: number;
  max_people?: number;
  price?: number;
  description?: string;
  notes?: string;
  is_active: boolean;
  leader_id?: string;
  leader_name?: string;
}

/**
 * UpdateTourData - 更新旅遊團資料
 */
export interface UpdateTourData {
  code?: string;
  name?: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  days?: number;
  nights?: number;
  status?: TourStatus;
  category?: TourCategory;
  min_people?: number;
  max_people?: number;
  current_people?: number;
  price?: number;
  description?: string;
  notes?: string;
  is_active?: boolean;
  leader_id?: string;
  leader_name?: string;
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
  destination: string;
  start_date: string;
  end_date: string;
  status: TourStatus;
  current_people?: number;
  max_people?: number;
  price?: number;
  leader_name?: string;
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
