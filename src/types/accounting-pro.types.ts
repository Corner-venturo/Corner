/**
 * 會計模組型別定義
 * 建立日期：2025-01-17
 */

import type { BaseEntity } from './base.types'

// ============================================
// 模組管理
// ============================================

/**
 * 模組名稱
 */
export type ModuleName = 'accounting' | 'inventory' | 'bi_analytics'

/**
 * 工作空間模組
 */
export interface WorkspaceModule extends BaseEntity {
  workspace_id: string
  module_name: ModuleName
  is_enabled: boolean
  enabled_at: string
  expires_at: string | null // NULL = 永久授權
}

// ============================================
// 會計科目 (Chart of Accounts)
// ============================================

/**
 * 會計科目類型
 */
export type AccountingSubjectType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'

/**
 * 會計科目
 */
export interface AccountingSubject extends BaseEntity {
  workspace_id?: string | null // NULL = 系統預設科目
  code: string // 科目代碼，如：1101, 1102
  name: string // 科目名稱，如：現金、銀行存款
  type: AccountingSubjectType
  parent_id: string | null // 上層科目 ID
  level: number // 層級：1, 2, 3, 4...
  is_system: boolean // 系統預設科目不可刪除
  is_active: boolean // 是否啟用
  description: string | null
}

// ============================================
// 傳票 (Vouchers)
// ============================================

/**
 * 傳票類型
 */
export type VoucherType = 'manual' | 'auto'

/**
 * 傳票狀態
 */
export type VoucherStatus = 'draft' | 'posted' | 'void'

/**
 * 傳票來源類型
 */
export type VoucherSourceType = 'payment_request' | 'order_payment' | 'tour_closing' | 'manual'

/**
 * 傳票主檔
 */
export interface Voucher extends BaseEntity {
  workspace_id: string
  voucher_no: string // 傳票編號，如：V202501001
  voucher_date: string // 傳票日期 (DATE)
  type: VoucherType // 手動 / 自動
  source_type: VoucherSourceType | null // 來源類型
  source_id: string | null // 來源單據 ID
  description: string | null
  total_debit: number // 借方合計
  total_credit: number // 貸方合計
  status: VoucherStatus
  created_by: string | null // 建立人員
  posted_by: string | null // 過帳人員
  posted_at: string | null // 過帳時間
  voided_by: string | null // 作廢人員
  voided_at: string | null // 作廢時間
  void_reason: string | null // 作廢原因
}

// ============================================
// 傳票分錄
// ============================================

/**
 * 傳票分錄
 */
export interface VoucherEntry extends BaseEntity {
  voucher_id: string // 所屬傳票
  entry_no: number // 分錄編號：1, 2, 3...
  subject_id: string // 會計科目
  debit: number // 借方金額
  credit: number // 貸方金額
  description: string | null
}

// ============================================
// 總分類帳 (General Ledger)
// ============================================

/**
 * 總分類帳彙總
 */
export interface GeneralLedger extends BaseEntity {
  workspace_id: string
  subject_id: string // 會計科目
  year: number // 年度
  month: number // 月份 (1-12)
  opening_balance: number // 期初餘額
  total_debit: number // 當月借方
  total_credit: number // 當月貸方
  closing_balance: number // 期末餘額
  updated_at: string
}

// ============================================
// CRUD 資料型別
// ============================================

export type CreateWorkspaceModuleData = Omit<WorkspaceModule, keyof BaseEntity>
export type UpdateWorkspaceModuleData = Partial<CreateWorkspaceModuleData>

export type CreateAccountingSubjectData = Omit<AccountingSubject, keyof BaseEntity>
export type UpdateAccountingSubjectData = Partial<CreateAccountingSubjectData>

export type CreateVoucherData = Omit<Voucher, keyof BaseEntity>
export type UpdateVoucherData = Partial<CreateVoucherData>

export type CreateVoucherEntryData = Omit<VoucherEntry, keyof BaseEntity>
export type UpdateVoucherEntryData = Partial<CreateVoucherEntryData>

export type CreateGeneralLedgerData = Omit<GeneralLedger, keyof BaseEntity>
export type UpdateGeneralLedgerData = Partial<CreateGeneralLedgerData>

// ============================================
// 自動產生傳票
// ============================================

/**
 * 自動產生傳票 - 從收款
 */
export interface AutoVoucherFromPayment {
  workspace_id: string
  order_id: string // 訂單 ID
  payment_amount: number // 收款金額
  payment_date: string // 收款日期
  payment_method: 'cash' | 'bank' // 收款方式
  bank_account_code?: string // 銀行科目代碼，如：1102-01
  description?: string
}

/**
 * 自動產生傳票 - 從付款
 */
export interface AutoVoucherFromPaymentRequest {
  workspace_id: string
  payment_request_id: string // 付款單 ID
  payment_amount: number // 付款金額
  payment_date: string // 付款日期
  supplier_type: 'transportation' | 'accommodation' | 'meal' | 'ticket' | 'insurance' | 'other'
  description?: string
}

/**
 * 自動產生傳票 - 從結團
 */
export interface AutoVoucherFromTourClosing {
  workspace_id: string
  tour_id: string // 團號 ID
  tour_code: string // 團號代碼
  closing_date: string // 結團日期
  total_revenue: number // 總收入
  costs: {
    transportation: number // 交通費
    accommodation: number // 住宿費
    meal: number // 餐食費
    ticket: number // 門票費
    insurance: number // 保險費
    other: number // 其他費用
  }
}

// ============================================
// 查詢參數
// ============================================

/**
 * 傳票查詢參數
 */
export interface VoucherQueryParams {
  workspace_id: string
  start_date?: string
  end_date?: string
  status?: VoucherStatus
  type?: VoucherType
  source_type?: VoucherSourceType
  keyword?: string // 傳票編號或說明
}

/**
 * 總分類帳查詢參數
 */
export interface GeneralLedgerQueryParams {
  workspace_id: string
  subject_id?: string
  year: number
  month?: number
}

// ============================================
// 報表相關
// ============================================

/**
 * 科目餘額
 */
export interface SubjectBalance {
  subject_id: string
  subject_code: string
  subject_name: string
  subject_type: AccountingSubjectType
  balance: number // 餘額或累積金額
  year: number
  month: number
}

/**
 * 財務報表彙總
 */
export interface FinancialStatement {
  workspace_id: string
  year: number
  month: number
  assets: SubjectBalance[] // 資產
  liabilities: SubjectBalance[] // 負債
  equity: SubjectBalance[] // 權益
  revenue: SubjectBalance[] // 收入
  expenses: SubjectBalance[] // 費用
  total_assets: number
  total_liabilities: number
  total_equity: number
  total_revenue: number
  total_expenses: number
  net_profit: number // 淨利 = 收入 - 費用
}
