/**
 * 共用型別定義
 * 包含各種通用的型別和介面
 */

// ============================================
// 通用選項與下拉選單
// ============================================

/**
 * SelectOption - 下拉選單選項
 */
export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
  description?: string;
}

/**
 * GroupedSelectOption - 分組下拉選單選項
 */
export interface GroupedSelectOption<T = string> {
  group: string;
  options: SelectOption<T>[];
}

// ============================================
// 地址相關
// ============================================

/**
 * Address - 地址資料
 */
export interface Address {
  street?: string;      // 街道
  city?: string;        // 城市
  district?: string;    // 區域
  postal_code?: string; // 郵遞區號
  country?: string;     // 國家
  full_address?: string; // 完整地址
}

// ============================================
// 聯絡資訊
// ============================================

/**
 * ContactInfo - 聯絡資訊
 */
export interface ContactInfo {
  name: string;
  phone: string;
  email?: string;
  relationship?: string;
}

// ============================================
// 檔案相關
// ============================================

/**
 * FileUpload - 檔案上傳
 */
export interface FileUpload {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploaded_at: string;  // ISO 8601
  uploaded_by?: string;
}

/**
 * FileCategory - 檔案分類
 */
export type FileCategory =
  | 'document'   // 文件
  | 'image'      // 圖片
  | 'contract'   // 合約
  | 'invoice'    // 發票
  | 'receipt'    // 收據
  | 'other';     // 其他

// ============================================
// 時間範圍
// ============================================

/**
 * DateRange - 日期範圍
 */
export interface DateRange {
  from: string;  // ISO 8601
  to: string;    // ISO 8601
}

/**
 * TimeSlot - 時間段
 */
export interface TimeSlot {
  start_time: string;  // HH:mm 格式
  end_time: string;    // HH:mm 格式
}

// ============================================
// 金額與貨幣
// ============================================

/**
 * Money - 金額資料
 */
export interface Money {
  amount: number;
  currency: Currency;
}

/**
 * Currency - 貨幣類型
 */
export type Currency =
  | 'TWD'  // 台幣
  | 'USD'  // 美元
  | 'EUR'  // 歐元
  | 'JPY'  // 日圓
  | 'CNY'  // 人民幣
  | 'HKD'  // 港幣
  | 'KRW'  // 韓元
  | 'SGD'  // 新加坡幣
  | 'THB'; // 泰銖

/**
 * ExchangeRate - 匯率
 */
export interface ExchangeRate {
  from: Currency;
  to: Currency;
  rate: number;
  updated_at: string;  // ISO 8601
}

// ============================================
// 座標與位置
// ============================================

/**
 * Coordinates - 座標
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Location - 位置資訊
 */
export interface Location {
  name: string;
  address?: Address;
  coordinates?: Coordinates;
  notes?: string;
}

// ============================================
// 備註與附件
// ============================================

/**
 * Note - 備註資料
 */
export interface Note {
  id: string;
  content: string;
  created_at: string;   // ISO 8601
  created_by?: string;
  created_by_name?: string;
}

/**
 * Attachment - 附件
 */
export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploaded_at: string;  // ISO 8601
  uploaded_by?: string;
}

// ============================================
// 審核相關
// ============================================

/**
 * ApprovalStatus - 審核狀態
 */
export type ApprovalStatus =
  | 'pending'    // 待審核
  | 'approved'   // 已核准
  | 'rejected'   // 已拒絕
  | 'cancelled'; // 已取消

/**
 * ApprovalRecord - 審核記錄
 */
export interface ApprovalRecord {
  id: string;
  status: ApprovalStatus;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;  // ISO 8601
  comment?: string;
  created_at: string;    // ISO 8601
}

// ============================================
// 標籤與分類
// ============================================

/**
 * Tag - 標籤
 */
export interface Tag {
  id: string;
  name: string;
  color?: string;
  category?: string;
}

/**
 * Category - 分類
 */
export interface Category {
  id: string;
  name: string;
  parent_id?: string;
  order?: number;
  is_active: boolean;
}

// ============================================
// 搜尋相關
// ============================================

/**
 * SearchParams - 搜尋參數
 */
export interface SearchParams {
  query: string;
  filters?: Record<string, unknown>;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

/**
 * SearchResult - 搜尋結果
 */
export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

// ============================================
// 通知相關
// ============================================

/**
 * NotificationType - 通知類型
 */
export type NotificationType =
  | 'info'     // 資訊
  | 'success'  // 成功
  | 'warning'  // 警告
  | 'error';   // 錯誤

/**
 * Notification - 通知
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;  // ISO 8601
  link?: string;
}

// ============================================
// 統計與圖表
// ============================================

/**
 * ChartDataPoint - 圖表資料點
 */
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

/**
 * TimeSeriesData - 時間序列資料
 */
export interface TimeSeriesData {
  timestamp: string;  // ISO 8601
  value: number;
  label?: string;
}

// ============================================
// 設定相關
// ============================================

/**
 * UserPreferences - 使用者偏好設定
 */
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  language?: 'zh-TW' | 'en-US';
  timezone?: string;
  dateFormat?: string;
  currency?: Currency;
  notifications?: NotificationPreferences;
}

/**
 * NotificationPreferences - 通知偏好設定
 */
export interface NotificationPreferences {
  email?: boolean;
  push?: boolean;
  sms?: boolean;
}

// ============================================
// 匯出與匯入
// ============================================

/**
 * ExportFormat - 匯出格式
 */
export type ExportFormat =
  | 'excel'  // Excel
  | 'csv'    // CSV
  | 'pdf'    // PDF
  | 'json';  // JSON

/**
 * ExportOptions - 匯出選項
 */
export interface ExportOptions {
  format: ExportFormat;
  fields?: string[];
  filter?: Record<string, unknown>;
  file_name?: string;
}

/**
 * ImportResult - 匯入結果
 */
export interface ImportResult {
  success: number;
  failed: number;
  errors?: string[];
  warnings?: string[];
}
