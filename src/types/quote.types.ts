/**
 * 報價單相關型別定義
 */

import { BaseEntity } from './base.types';

// ============================================
// 報價單介面
// ============================================

/**
 * Quote - 報價單
 */
export interface Quote extends BaseEntity {
  code: string;              // 報價單編號
  customer_id?: string;      // 客戶 ID
  customer_name?: string;    // 客戶姓名（冗餘欄位）
  name?: string;             // 報價單名稱
  destination: string;       // 目的地
  start_date: string;        // 出發日期 (ISO 8601)
  end_date: string;          // 結束日期 (ISO 8601)
  days: number;              // 天數
  nights: number;            // 夜數
  number_of_people: number;  // 人數
  group_size?: number;       // 團體人數（與 number_of_people 同義，保留向後相容）
  accommodation_days?: number; // 住宿天數
  status: QuoteStatus;       // 報價狀態
  total_amount: number;      // 總金額
  version: number;           // 版本號
  valid_until?: string;      // 有效期限 (ISO 8601)
  notes?: string;            // 備註
  is_active: boolean;        // 是否啟用
  created_by?: string;       // 建立人 ID
  created_by_name?: string;  // 建立人姓名（冗餘欄位）
  converted_to_tour?: boolean; // 是否已轉成旅遊團
  tour_id?: string;          // 轉換後的旅遊團 ID

  // 擴展欄位（用於詳細頁）
  categories?: unknown[];        // 報價分類（前端使用的複雜結構）
  versions?: QuoteVersion[]; // 歷史版本
}

/**
 * QuoteVersion - 報價版本
 */
export interface QuoteVersion extends BaseEntity {
  quote_id: string;          // 報價單 ID
  version: number;           // 版本號
  total_amount: number;      // 總金額
  changes?: string;          // 變更說明
  note?: string;             // 備註說明
  created_by?: string;       // 建立人 ID
  created_by_name?: string;  // 建立人姓名
  snapshot?: string;         // 快照資料（JSON 格式）
}

/**
 * QuoteCategory - 報價分類
 */
export interface QuoteCategory extends BaseEntity {
  quote_id: string;          // 報價單 ID
  name: string;              // 分類名稱
  order: number;             // 排序
  is_active: boolean;        // 是否啟用
}

/**
 * QuoteItem - 報價項目
 */
export interface QuoteItem extends BaseEntity {
  quote_id: string;          // 報價單 ID
  category_id?: string;      // 分類 ID
  category_name?: string;    // 分類名稱（冗餘欄位）
  type: QuoteItemType;       // 項目類型
  name: string;              // 項目名稱
  description?: string;      // 說明
  quantity: number;          // 數量
  unit_price: number;        // 單價
  total_price: number;       // 總價
  order: number;             // 排序
  notes?: string;            // 備註
  is_optional: boolean;      // 是否為選配
  is_active: boolean;        // 是否啟用
}

// ============================================
// 報價單狀態與類型
// ============================================

/**
 * QuoteStatus - 報價狀態
 */
export type QuoteStatus =
  | 'draft'      // 草稿
  | 'sent'       // 已寄出
  | 'accepted'   // 已接受
  | 'rejected'   // 已拒絕
  | 'expired'    // 已過期
  | 'converted'; // 已轉單

/**
 * QuoteItemType - 報價項目類型
 */
export type QuoteItemType =
  | 'accommodation'  // 住宿
  | 'transportation' // 交通
  | 'meals'          // 餐食
  | 'tickets'        // 門票
  | 'insurance'      // 保險
  | 'guide'          // 導遊
  | 'visa'           // 簽證
  | 'shopping'       // 購物
  | 'activity'       // 活動
  | 'other';         // 其他

// ============================================
// 報價單建立與更新
// ============================================

/**
 * CreateQuoteData - 建立報價單
 */
export interface CreateQuoteData {
  code: string;
  customer_id?: string;
  customer_name?: string;
  destination: string;
  start_date: string;
  end_date: string;
  days: number;
  nights: number;
  number_of_people: number;
  status: QuoteStatus;
  total_amount: number;
  valid_until?: string;
  notes?: string;
  is_active: boolean;
}

/**
 * UpdateQuoteData - 更新報價單
 */
export interface UpdateQuoteData {
  customer_id?: string;
  customer_name?: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  days?: number;
  nights?: number;
  number_of_people?: number;
  status?: QuoteStatus;
  total_amount?: number;
  valid_until?: string;
  notes?: string;
  is_active?: boolean;
  converted_to_tour?: boolean;
  tour_id?: string;
}

/**
 * CreateQuoteItemData - 建立報價項目
 */
export interface CreateQuoteItemData {
  quote_id: string;
  category_id?: string;
  type: QuoteItemType;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  order: number;
  notes?: string;
  is_optional: boolean;
  is_active: boolean;
}

/**
 * UpdateQuoteItemData - 更新報價項目
 */
export interface UpdateQuoteItemData {
  category_id?: string;
  type?: QuoteItemType;
  name?: string;
  description?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  order?: number;
  notes?: string;
  is_optional?: boolean;
  is_active?: boolean;
}

// ============================================
// 報價單查詢與篩選
// ============================================

/**
 * QuoteFilter - 報價單篩選條件
 */
export interface QuoteFilter {
  customer_id?: string;
  status?: QuoteStatus | QuoteStatus[];
  destination?: string;
  start_date_from?: string;
  start_date_to?: string;
  is_active?: boolean;
  search_term?: string; // 搜尋報價單編號、客戶姓名
}

/**
 * QuoteListItem - 報價單列表項目（精簡版）
 */
export interface QuoteListItem {
  id: string;
  code: string;
  customer_name?: string;
  destination: string;
  start_date: string;
  end_date: string;
  number_of_people: number;
  status: QuoteStatus;
  total_amount: number;
  valid_until?: string;
  converted_to_tour?: boolean;
  created_at: string;
}

// ============================================
// 報價單統計
// ============================================

/**
 * QuoteStats - 報價單統計資料
 */
export interface QuoteStats {
  total_quotes: number;
  draft_quotes: number;
  sent_quotes: number;
  accepted_quotes: number;
  rejected_quotes: number;
  converted_quotes: number;
  conversion_rate: number;     // 轉換率（百分比）
  total_quoted_amount: number;
  average_quote_amount: number;
}
