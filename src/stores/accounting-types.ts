// 記帳功能的類型定義

// 帳戶類型
export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'investment' | 'other';
  balance: number;
  currency: string;
  icon: string;
  color: string;
  isActive: boolean;
  description?: string;
  // 信用卡相關欄位
  creditLimit?: number; // 信用額度
  availableCredit?: number; // 可用額度
  createdAt: string;
  updatedAt: string;
}

// 交易分類
export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'transfer';
  icon: string;
  color: string;
  parentId?: string; // 可以有子分類
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 交易記錄
export interface Transaction {
  id: string;
  accountId: string;
  accountName: string;
  categoryId: string;
  categoryName: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  description?: string;
  date: string; // 交易日期
  // 轉帳相關
  toAccountId?: string; // 轉入帳戶ID（轉帳時使用）
  toAccountName?: string;
  // 附件和標籤
  tags?: string[];
  attachments?: string[];
  // 系統欄位
  createdAt: string;
  updatedAt: string;
}

// 預算設定
export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  period: 'monthly' | 'yearly';
  startDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 統計資料
export interface AccountingStats {
  totalAssets: number;
  totalIncome: number;
  totalExpense: number;
  monthlyIncome: number;
  monthlyExpense: number;
  netWorth: number;
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    amount: number;
    percentage: number;
  }[];
}