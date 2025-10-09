/**
 * 記帳功能類型定義
 */

import type { BaseEntity } from './base.types';

// ============================================
// 帳戶
// ============================================
export interface Account extends BaseEntity {
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'credit_card' | 'investment' | 'other';
  balance: number;
  currency: string;
  icon: string;
  color: string;
  is_active: boolean;
  description?: string;
  // 信用卡相關欄位
  credit_limit?: number; // 信用額度
  available_credit?: number; // 可用額度
}

// ============================================
// 交易分類
// ============================================
export interface TransactionCategory extends BaseEntity {
  name: string;
  type: 'income' | 'expense' | 'transfer';
  icon: string;
  color: string;
  parent_id?: string; // 可以有子分類
  is_active: boolean;
}

// ============================================
// 交易記錄
// ============================================
export interface Transaction extends BaseEntity {
  account_id: string;
  account_name: string;
  category_id: string;
  category_name: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  description?: string;
  date: string; // 交易日期
  // 轉帳相關
  to_account_id?: string; // 轉入帳戶ID（轉帳時使用）
  to_account_name?: string;
  // 附件和標籤
  tags?: string[];
  attachments?: string[];
}

// ============================================
// 預算設定
// ============================================
export interface Budget extends BaseEntity {
  category_id: string;
  category_name: string;
  amount: number;
  period: 'monthly' | 'yearly';
  start_date: string;
  is_active: boolean;
}

// ============================================
// 統計資料
// ============================================
export interface AccountingStats {
  total_assets: number;
  total_income: number;
  total_expense: number;
  monthly_income: number;
  monthly_expense: number;
  net_worth: number;
  category_breakdown: {
    category_id: string;
    category_name: string;
    amount: number;
    percentage: number;
  }[];
}

// ============================================
// CRUD 資料型別
// ============================================
export type CreateAccountData = Omit<Account, keyof BaseEntity>;
export type UpdateAccountData = Partial<CreateAccountData>;
export type CreateTransactionCategoryData = Omit<TransactionCategory, keyof BaseEntity>;
export type UpdateTransactionCategoryData = Partial<CreateTransactionCategoryData>;
export type CreateTransactionData = Omit<Transaction, keyof BaseEntity>;
export type UpdateTransactionData = Partial<CreateTransactionData>;
export type CreateBudgetData = Omit<Budget, keyof BaseEntity>;
export type UpdateBudgetData = Partial<CreateBudgetData>;
