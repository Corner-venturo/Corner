/**
 * ERP 會計模組類型定義
 */

// ============================================
// 基本類型
// ============================================

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | 'cost'

export type AccountingEventType =
  | 'customer_receipt_posted'    // 客戶收款過帳
  | 'supplier_payment_posted'    // 供應商付款過帳
  | 'group_settlement_posted'    // 結團過帳
  | 'bonus_paid'                 // 獎金付款
  | 'tax_paid'                   // 代收稅金繳納
  | 'manual_voucher'             // 手動傳票

export type AccountingEventStatus = 'posted' | 'reversed'

export type VoucherStatus = 'draft' | 'posted' | 'reversed' | 'locked'

export type SubledgerType = 'customer' | 'supplier' | 'bank' | 'group' | 'employee'

// ============================================
// 科目表
// ============================================

export interface Account {
  id: string
  workspace_id: string
  code: string
  name: string
  account_type: AccountType  // 資料庫欄位名稱
  type?: AccountType  // 向下相容別名
  parent_id: string | null
  is_system_locked: boolean
  is_active: boolean
  description: string | null
  created_at: string
  updated_at: string
  // 關聯
  children?: Account[]
  parent?: Account
}

export interface AccountFormData {
  code: string
  name: string
  account_type: AccountType
  parent_id: string | null
  description: string | null
  is_active: boolean
}

// ============================================
// 銀行帳戶
// ============================================

export interface BankAccount {
  id: string
  workspace_id: string
  name: string
  bank_name: string | null
  account_number: string | null
  account_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // 關聯
  account?: Account
}

// ============================================
// 會計事件
// ============================================

export interface AccountingEventMeta {
  // 收款相關
  payment_method?: 'cash' | 'transfer' | 'credit_card'
  gross_amount?: number
  fee_rate?: number
  fee_amount?: number
  net_amount?: number
  // 結團相關
  group_revenue?: number
  original_cost?: number
  participants?: number
  admin_fee_per_person?: number
  admin_fee?: number
  tax_rate?: number
  tax_amount?: number
  sales_bonus?: number
  op_bonus?: number
  team_bonus?: number
  // 其他
  [key: string]: unknown
}

export interface AccountingEvent {
  id: string
  workspace_id: string
  event_type: AccountingEventType
  source_type: string | null
  source_id: string | null
  group_id: string | null
  tour_id: string | null
  event_date: string
  currency: string
  meta: AccountingEventMeta
  status: AccountingEventStatus
  reversal_event_id: string | null
  memo: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // 關聯
  voucher?: JournalVoucher
  tour?: { tour_code: string; tour_name: string }
}

// ============================================
// 傳票
// ============================================

export interface JournalVoucher {
  id: string
  workspace_id: string
  voucher_no: string
  voucher_date: string
  memo: string | null
  company_unit: string
  event_id: string | null
  status: VoucherStatus
  total_debit: number
  total_credit: number
  created_by: string | null
  created_at: string
  updated_at: string
  // 關聯
  event?: AccountingEvent
  lines?: JournalLine[]
}

export interface JournalLine {
  id: string
  voucher_id: string
  line_no: number
  account_id: string
  subledger_type: SubledgerType | null
  subledger_id: string | null
  description: string | null
  debit_amount: number
  credit_amount: number
  created_at: string | null
  updated_at: string | null
  // 關聯
  account?: Account
}

// ============================================
// 過帳規則
// ============================================

export interface PostingRuleConfig {
  lines: {
    account_code: string
    description_template: string
    debit_formula?: string
    credit_formula?: string
    subledger_type?: SubledgerType
  }[]
}

export interface PostingRule {
  id: string
  workspace_id: string
  event_type: AccountingEventType
  rule_name: string
  rule_config: PostingRuleConfig
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================
// 會計期間
// ============================================

export interface AccountingPeriod {
  id: string
  workspace_id: string
  period_name: string
  start_date: string
  end_date: string
  is_closed: boolean
  closed_at: string | null
  closed_by: string | null
  created_at: string | null
  updated_at: string | null
}

// ============================================
// API 請求/響應類型
// ============================================

// 客戶收款過帳
export interface PostCustomerReceiptRequest {
  receipt_id: string
  payment_method: 'cash' | 'transfer' | 'credit_card'
  amount: number
  fee_rate?: number  // 刷卡手續費率
  bank_account_id?: string
  tour_id?: string
  memo?: string
}

// 供應商付款過帳
export interface PostSupplierPaymentRequest {
  payout_id: string
  amount: number
  bank_account_id: string
  tour_id?: string
  memo?: string
}

// 結團過帳
export interface PostGroupSettlementRequest {
  tour_id: string
  group_revenue: number      // 團收入（預收團款總額）
  original_cost: number      // 原始團務成本（預付團務成本總額）
  participants: number       // 參加人數
  admin_fee_per_person?: number  // 行政費單價，預設 10
  tax_rate?: number          // 稅率，預設 0.12
  sales_bonus?: number       // 業務獎金
  op_bonus?: number          // OP 獎金
  team_bonus?: number        // 團績獎金
  bank_account_id: string    // 付款銀行帳戶
  memo?: string
}

// 獎金付款
export interface PostBonusPaidRequest {
  tour_id?: string
  employee_id: string
  amount: number
  bonus_type: 'team_bonus' | 'other'
  bank_account_id: string
  memo?: string
}

// 代收稅金繳納
export interface PostTaxPaidRequest {
  period: string  // 如 2025-01
  amount: number
  bank_account_id: string
  memo?: string
}

// 反沖請求
export interface ReverseVoucherRequest {
  voucher_id: string
  reason: string
}

// ============================================
// 報表類型
// ============================================

export interface AccountBalance {
  account_id: string
  account_code: string
  account_name: string
  account_type: AccountType
  debit_total: number
  credit_total: number
  balance: number
}

export interface TrialBalance {
  period: string
  accounts: AccountBalance[]
  total_debit: number
  total_credit: number
  is_balanced: boolean
}

// ============================================
// 預設科目表
// ============================================

export const DEFAULT_ACCOUNTS: Omit<Account, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>[] = [
  // 資產
  { code: '1100', name: '銀行存款', account_type: 'asset', type: 'asset', parent_id: null, is_system_locked: true, is_active: true, description: null },
  { code: '1110', name: '現金', account_type: 'asset', type: 'asset', parent_id: null, is_system_locked: true, is_active: true, description: null },
  { code: '1200', name: '預付團務成本', account_type: 'asset', type: 'asset', parent_id: null, is_system_locked: true, is_active: true, description: '未結團的預付成本' },
  // 負債
  { code: '2100', name: '預收團款', account_type: 'liability', type: 'liability', parent_id: null, is_system_locked: true, is_active: true, description: '未結團的預收款項' },
  { code: '2200', name: '代收稅金（應付）', account_type: 'liability', type: 'liability', parent_id: null, is_system_locked: true, is_active: true, description: '12% 代收稅金' },
  { code: '2300', name: '獎金應付帳款', account_type: 'liability', type: 'liability', parent_id: null, is_system_locked: true, is_active: true, description: null },
  { code: '2400', name: '代收款－員工自付', account_type: 'liability', type: 'liability', parent_id: null, is_system_locked: true, is_active: true, description: '勞健保等' },
  // 權益
  { code: '3100', name: '股本', account_type: 'equity', type: 'equity', parent_id: null, is_system_locked: true, is_active: true, description: '實收資本' },
  { code: '3200', name: '本期損益', account_type: 'equity', type: 'equity', parent_id: null, is_system_locked: true, is_active: true, description: '期末結轉用，匯集損益科目餘額' },
  { code: '3300', name: '保留盈餘', account_type: 'equity', type: 'equity', parent_id: null, is_system_locked: true, is_active: true, description: '累積盈虧，本期損益結轉至此' },
  // 收入
  { code: '4100', name: '團費收入', account_type: 'revenue', type: 'revenue', parent_id: null, is_system_locked: true, is_active: true, description: '結團才認列' },
  { code: '4200', name: '其他收入－行政費收入', account_type: 'revenue', type: 'revenue', parent_id: null, is_system_locked: true, is_active: true, description: null },
  // 成本
  { code: '5100', name: '團務成本', account_type: 'cost', type: 'cost', parent_id: null, is_system_locked: true, is_active: true, description: '結團才成立' },
  { code: '5110', name: '團務成本－行政費', account_type: 'cost', type: 'cost', parent_id: null, is_system_locked: true, is_active: true, description: null },
  { code: '5120', name: '團務成本－代收稅金', account_type: 'cost', type: 'cost', parent_id: null, is_system_locked: true, is_active: true, description: '12%' },
  { code: '5130', name: '團務成本－業務獎金', account_type: 'cost', type: 'cost', parent_id: null, is_system_locked: true, is_active: true, description: null },
  { code: '5140', name: '團務成本－OP獎金', account_type: 'cost', type: 'cost', parent_id: null, is_system_locked: true, is_active: true, description: null },
  { code: '5150', name: '團務成本－團績獎金', account_type: 'cost', type: 'cost', parent_id: null, is_system_locked: true, is_active: true, description: null },
  // 費用
  { code: '6100', name: '刷卡手續費費用', account_type: 'expense', type: 'expense', parent_id: null, is_system_locked: true, is_active: true, description: '實扣 1.68%' },
  { code: '6200', name: '勞健保費用', account_type: 'expense', type: 'expense', parent_id: null, is_system_locked: true, is_active: true, description: '公司負擔' },
  { code: '6300', name: '利息費用', account_type: 'expense', type: 'expense', parent_id: null, is_system_locked: true, is_active: true, description: null },
]
