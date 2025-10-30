// 記帳功能的類型定義

// 帳戶類型
export interface Account {
  id: string
  name: string
  type: 'cash' | 'bank' | 'credit' | 'investment' | 'other'
  balance: number
  currency: string
  icon: string
  color: string
  is_active: boolean
  description?: string
  // 信用卡相關欄位
  credit_limit?: number // 信用額度
  available_credit?: number // 可用額度
  created_at: string
  updated_at: string
}

// 交易分類
export interface Category {
  id: string
  name: string
  type: 'income' | 'expense' | 'transfer'
  icon: string
  color: string
  parent_id?: string // 可以有子分類
  is_active: boolean
  created_at: string
  updated_at: string
}

// 交易記錄
export interface Transaction {
  id: string
  account_id: string
  account_name: string
  category_id: string
  category_name: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  currency: string
  description?: string
  date: string // 交易日期
  // 轉帳相關
  to_account_id?: string // 轉入帳戶ID（轉帳時使用）
  to_account_name?: string
  // 附件和標籤
  tags?: string[]
  attachments?: string[]
  // 系統欄位
  created_at: string
  updated_at: string
}

// 預算設定
export interface Budget {
  id: string
  category_id: string
  category_name: string
  amount: number
  period: 'monthly' | 'yearly'
  start_date: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// 統計資料
export interface AccountingStats {
  total_assets: number
  total_income: number
  total_expense: number
  monthly_income: number
  monthly_expense: number
  net_worth: number
  category_breakdown: {
    category_id: string
    category_name: string
    amount: number
    percentage: number
  }[]
}
