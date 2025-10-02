/**
 * 🎯 Venturo v4.0 - 統一資料模型
 *
 * 規範：
 * - 前端統一使用 camelCase
 * - Supabase 使用 snake_case
 * - 所有轉換在此檔案統一處理
 */

// ===========================
// 核心基礎類型
// ===========================

/** 時間戳記 */
export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

/** 資料同步狀態 */
export interface SyncMetadata {
  /** 本地唯一 ID (UUID) */
  id: string;
  /** 是否已同步到 Supabase */
  synced: boolean;
  /** 最後同步時間 */
  lastSyncedAt?: string;
  /** 同步失敗原因 */
  syncError?: string;
  /** 資料版本號 (用於衝突偵測) */
  version: number;
}

// ===========================
// 團體資料模型
// ===========================

export interface Tour extends Timestamps, SyncMetadata {
  /** 團號 (注意：使用 code 不是 tourCode) */
  code: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: number;
  nights: number;
  adultCount: number;
  childCount: number;
  infantCount: number;
  status: 'planning' | 'confirmed' | 'completed' | 'cancelled';
  totalCost: number;
  totalRevenue: number;
  profitMargin: number;
  leadGuide?: string;
  notes?: string;
}

// ===========================
// 訂單資料模型
// ===========================

export interface Order extends Timestamps, SyncMetadata {
  orderNumber: string;
  tourId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  adultCount: number;
  childCount: number;
  infantCount: number;
  totalAmount: number;
  paidAmount: number;
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
  paymentMethod?: 'cash' | 'transfer' | 'credit_card';
  notes?: string;
}

// ===========================
// 報價單資料模型
// ===========================

export interface Quote extends Timestamps, SyncMetadata {
  quoteNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: number;
  adultCount: number;
  childCount: number;
  infantCount: number;
  totalCost: number;
  profitMargin: number;
  sellingPrice: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  validUntil: string;
  notes?: string;
}

// ===========================
// 請款單資料模型
// ===========================

export interface PaymentRequest extends Timestamps, SyncMetadata {
  requestNumber: string;
  tourId?: string;
  supplierId?: string;
  supplierName: string;
  category: 'accommodation' | 'transport' | 'meals' | 'tickets' | 'guide' | 'other';
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'processing' | 'approved' | 'paid' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
  paymentMethod?: 'cash' | 'transfer' | 'cheque';
  receiptUrl?: string;
  notes?: string;
}

// ===========================
// 待辦事項資料模型
// ===========================

export interface Todo extends Timestamps, SyncMetadata {
  title: string;
  description?: string;
  priority: 1 | 2 | 3 | 4 | 5;
  deadline?: string;
  completed: boolean;
  completedAt?: string;
  assigneeId?: string;
  assigneeName?: string;
  relatedType?: 'tour' | 'order' | 'quote' | 'payment';
  relatedId?: string;
  tags?: string[];
}

// ===========================
// 供應商資料模型
// ===========================

export interface Supplier extends Timestamps, SyncMetadata {
  name: string;
  category: 'hotel' | 'restaurant' | 'transport' | 'attraction' | 'insurance' | 'other';
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  website?: string;
  taxId?: string;
  bankAccount?: string;
  paymentTerms?: string;
  rating?: number;
  status: 'active' | 'inactive' | 'suspended';
  notes?: string;
}

// ===========================
// 客戶資料模型
// ===========================

export interface Customer extends Timestamps, SyncMetadata {
  name: string;
  phone: string;
  email?: string;
  idNumber?: string;
  birthday?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  vipLevel?: number;
  totalOrders?: number;
  totalSpent?: number;
  source?: 'website' | 'referral' | 'ads' | 'walk_in' | 'other';
  notes?: string;
}

// ===========================
// Supabase ↔ Frontend 轉換器
// ===========================

/** Supabase 資料庫格式 (snake_case) */
export type SupabaseRow<T> = {
  [K in keyof T as K extends string
    ? (K extends 'createdAt' ? 'created_at' :
       K extends 'updatedAt' ? 'updated_at' :
       K extends 'syncedAt' ? 'synced_at' :
       K extends 'lastSyncedAt' ? 'last_synced_at' :
       K extends 'syncError' ? 'sync_error' :
       K extends 'tourId' ? 'tour_id' :
       K extends 'customerId' ? 'customer_id' :
       K extends 'supplierId' ? 'supplier_id' :
       K extends 'customerName' ? 'customer_name' :
       K extends 'customerPhone' ? 'customer_phone' :
       K extends 'customerEmail' ? 'customer_email' :
       K extends 'supplierName' ? 'supplier_name' :
       K extends 'adultCount' ? 'adult_count' :
       K extends 'childCount' ? 'child_count' :
       K extends 'infantCount' ? 'infant_count' :
       K extends 'totalAmount' ? 'total_amount' :
       K extends 'totalCost' ? 'total_cost' :
       K extends 'totalRevenue' ? 'total_revenue' :
       K extends 'totalOrders' ? 'total_orders' :
       K extends 'totalSpent' ? 'total_spent' :
       K extends 'paidAmount' ? 'paid_amount' :
       K extends 'profitMargin' ? 'profit_margin' :
       K extends 'sellingPrice' ? 'selling_price' :
       K extends 'orderNumber' ? 'order_number' :
       K extends 'quoteNumber' ? 'quote_number' :
       K extends 'requestNumber' ? 'request_number' :
       K extends 'startDate' ? 'start_date' :
       K extends 'endDate' ? 'end_date' :
       K extends 'dueDate' ? 'due_date' :
       K extends 'validUntil' ? 'valid_until' :
       K extends 'completedAt' ? 'completed_at' :
       K extends 'approvedBy' ? 'approved_by' :
       K extends 'approvedAt' ? 'approved_at' :
       K extends 'paidAt' ? 'paid_at' :
       K extends 'paymentMethod' ? 'payment_method' :
       K extends 'receiptUrl' ? 'receipt_url' :
       K extends 'leadGuide' ? 'lead_guide' :
       K extends 'contactPerson' ? 'contact_person' :
       K extends 'taxId' ? 'tax_id' :
       K extends 'bankAccount' ? 'bank_account' :
       K extends 'paymentTerms' ? 'payment_terms' :
       K extends 'idNumber' ? 'id_number' :
       K extends 'emergencyContact' ? 'emergency_contact' :
       K extends 'vipLevel' ? 'vip_level' :
       K extends 'assigneeId' ? 'assignee_id' :
       K extends 'assigneeName' ? 'assignee_name' :
       K extends 'relatedType' ? 'related_type' :
       K extends 'relatedId' ? 'related_id' :
       string)
    : never]: T[K];
};

/** Frontend → Supabase 轉換 */
export function toSupabase<T extends Record<string, any>>(data: T): SupabaseRow<T> {
  const result: any = {};

  for (const [key, value] of Object.entries(data)) {
    // 轉換 key 為 snake_case
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    result[snakeKey] = value;
  }

  return result;
}

/** Supabase → Frontend 轉換 */
export function fromSupabase<T>(data: any): T {
  const result: any = {};

  for (const [key, value] of Object.entries(data)) {
    // 轉換 key 為 camelCase
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }

  return result as T;
}

/** 批次轉換：Frontend → Supabase */
export function toSupabaseBatch<T extends Record<string, any>>(data: T[]): SupabaseRow<T>[] {
  return data.map(item => toSupabase(item));
}

/** 批次轉換：Supabase → Frontend */
export function fromSupabaseBatch<T>(data: any[]): T[] {
  return data.map(item => fromSupabase<T>(item));
}

// ===========================
// 資料驗證
// ===========================

/** 驗證必填欄位 */
export function validateRequired<T>(data: Partial<T>, requiredFields: (keyof T)[]): string[] {
  const errors: string[] = [];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`${String(field)} 為必填欄位`);
    }
  }

  return errors;
}

/** 驗證 Email 格式 */
export function validateEmail(email?: string): boolean {
  if (!email) return true; // optional field
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** 驗證手機格式 (台灣) */
export function validatePhone(phone: string): boolean {
  return /^09\d{8}$/.test(phone.replace(/[-\s]/g, ''));
}

/** 驗證日期格式 */
export function validateDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
}

// ===========================
// UUID 生成
// ===========================

/** 生成本地 UUID */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** 生成帶前綴的 ID */
export function generatePrefixedId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `${prefix}-${timestamp}-${random}`;
}
