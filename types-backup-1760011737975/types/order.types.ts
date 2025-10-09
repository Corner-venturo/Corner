/**
 * 訂單相關型別定義
 */

import { BaseEntity } from './base.types';

// ============================================
// 訂單介面
// ============================================

/**
 * Order - 訂單資料
 */
export interface Order extends BaseEntity {
  code: string;              // 訂單編號
  tour_id: string;           // 旅遊團 ID
  tour_code?: string;        // 旅遊團編號（冗餘欄位,方便查詢）
  tour_name?: string;        // 旅遊團名稱（冗餘欄位）
  customer_id: string;       // 客戶 ID
  customer_name?: string;    // 客戶姓名（冗餘欄位）
  contact_person: string;    // 聯絡人
  contact_phone: string;     // 聯絡電話
  contact_email?: string;    // 聯絡 Email
  status: OrderStatus;       // 訂單狀態
  payment_status: PaymentStatus; // 付款狀態
  total_amount: number;      // 總金額
  paid_amount: number;       // 已付金額
  remaining_amount: number;  // 待付金額
  number_of_people: number;  // 人數
  adult_count: number;       // 成人數
  child_count: number;       // 兒童數
  infant_count: number;      // 嬰兒數
  notes?: string;            // 備註
  special_requests?: string; // 特殊需求
  is_active: boolean;        // 是否啟用
}

// ============================================
// 團員介面
// ============================================

/**
 * Member - 團員資料
 */
export interface Member extends BaseEntity {
  order_id: string;          // 訂單 ID
  tour_id: string;           // 旅遊團 ID
  name: string;              // 姓名
  english_name?: string;     // 英文姓名
  gender: Gender;            // 性別
  date_of_birth: string;     // 出生日期 (ISO 8601)
  age?: number;              // 年齡（可計算）
  age_category: AgeCategory; // 年齡分類
  id_number?: string;        // 身分證字號
  passport_number?: string;  // 護照號碼
  passport_expiry?: string;  // 護照到期日 (ISO 8601)
  phone?: string;            // 電話
  email?: string;            // Email
  emergency_contact?: string; // 緊急聯絡人
  emergency_phone?: string;  // 緊急聯絡電話
  dietary_restrictions?: string; // 飲食限制
  medical_conditions?: string;   // 醫療狀況
  room_type?: RoomType;      // 房型
  room_mate_id?: string;     // 室友 ID
  seat_preference?: string;  // 座位偏好
  notes?: string;            // 備註
}

// ============================================
// 訂單狀態
// ============================================

/**
 * OrderStatus - 訂單狀態
 */
export type OrderStatus =
  | 'pending'    // 待確認
  | 'confirmed'  // 已確認
  | 'completed'  // 已完成
  | 'cancelled'; // 已取消

/**
 * PaymentStatus - 付款狀態
 */
export type PaymentStatus =
  | 'unpaid'     // 未付款
  | 'partial'    // 部分付款
  | 'paid'       // 已付清
  | 'refunded';  // 已退款

/**
 * Gender - 性別
 */
export type Gender = 'male' | 'female' | 'other';

/**
 * AgeCategory - 年齡分類
 */
export type AgeCategory =
  | 'adult'   // 成人
  | 'child'   // 兒童
  | 'infant'; // 嬰兒

/**
 * RoomType - 房型
 */
export type RoomType =
  | 'single'   // 單人房
  | 'double'   // 雙人房
  | 'twin'     // 雙床房
  | 'triple'   // 三人房
  | 'quad';    // 四人房

// ============================================
// 訂單建立與更新
// ============================================

/**
 * CreateOrderData - 建立訂單所需資料
 */
export interface CreateOrderData {
  code: string;
  tour_id: string;
  customer_id: string;
  contact_person: string;
  contact_phone: string;
  contact_email?: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_amount: number;
  paid_amount: number;
  number_of_people: number;
  adult_count: number;
  child_count: number;
  infant_count: number;
  notes?: string;
  special_requests?: string;
  is_active: boolean;
}

/**
 * UpdateOrderData - 更新訂單資料
 */
export interface UpdateOrderData {
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  total_amount?: number;
  paid_amount?: number;
  number_of_people?: number;
  adult_count?: number;
  child_count?: number;
  infant_count?: number;
  notes?: string;
  special_requests?: string;
  is_active?: boolean;
}

/**
 * CreateMemberData - 建立團員所需資料
 */
export interface CreateMemberData {
  order_id: string;
  tour_id: string;
  name: string;
  english_name?: string;
  gender: Gender;
  date_of_birth: string;
  age_category: AgeCategory;
  id_number?: string;
  passport_number?: string;
  passport_expiry?: string;
  phone?: string;
  email?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  dietary_restrictions?: string;
  medical_conditions?: string;
  room_type?: RoomType;
  room_mate_id?: string;
  seat_preference?: string;
  notes?: string;
}

/**
 * UpdateMemberData - 更新團員資料
 */
export interface UpdateMemberData {
  name?: string;
  english_name?: string;
  gender?: Gender;
  date_of_birth?: string;
  age_category?: AgeCategory;
  id_number?: string;
  passport_number?: string;
  passport_expiry?: string;
  phone?: string;
  email?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  dietary_restrictions?: string;
  medical_conditions?: string;
  room_type?: RoomType;
  room_mate_id?: string;
  seat_preference?: string;
  notes?: string;
}

// ============================================
// 訂單查詢與篩選
// ============================================

/**
 * OrderFilter - 訂單篩選條件
 */
export interface OrderFilter {
  tour_id?: string;
  customer_id?: string;
  status?: OrderStatus | OrderStatus[];
  payment_status?: PaymentStatus | PaymentStatus[];
  date_from?: string;
  date_to?: string;
  search_term?: string; // 搜尋訂單編號、聯絡人
}

/**
 * OrderListItem - 訂單列表項目（精簡版）
 */
export interface OrderListItem {
  id: string;
  code: string;
  tour_code?: string;
  tour_name?: string;
  customer_name?: string;
  contact_person: string;
  contact_phone: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_amount: number;
  paid_amount: number;
  number_of_people: number;
  created_at: string;
}

// ============================================
// 訂單統計
// ============================================

/**
 * OrderStats - 訂單統計資料
 */
export interface OrderStats {
  total_orders: number;
  confirmed_orders: number;
  pending_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  total_paid: number;
  total_remaining: number;
  total_people: number;
}
