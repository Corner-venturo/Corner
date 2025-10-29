/**
 * 員工相關型別定義
 */

import { BaseEntity } from './base.types';

// ============================================
// 員工介面
// ============================================

/**
 * Employee - 員工資料
 */
export interface Employee extends BaseEntity {
  employee_number: string; // 員工編號 (例如: william01)
  name: string;            // 姓名
  email: string;           // Email
  phone?: string;          // 電話
  department?: string;     // 部門
  position?: string;       // 職位
  permissions: Permission[]; // 權限列表
  is_active: boolean;      // 是否啟用
  salary?: number;         // 薪資（敏感資訊）
  hire_date?: string;      // 到職日期 (ISO 8601)
  avatar?: string;         // 頭像 URL
}

// ============================================
// 權限相關
// ============================================

/**
 * Permission - 系統權限
 */
export type Permission =
  // 系統權限
  | 'admin'          // 管理員（自動擁有全部權限）
  // 功能模組權限
  | 'quotes'         // 報價單
  | 'tours'          // 旅遊團
  | 'orders'         // 訂單
  | 'payments'       // 收款
  | 'requests'       // 請款管理
  | 'disbursement'   // 出納
  | 'travel_invoice' // 代轉發票/代收轉付
  | 'todos'          // 待辦事項
  | 'hr'             // 人資管理
  | 'reports'        // 報表
  | 'settings'       // 設定
  | 'customers'      // 客戶管理
  | 'suppliers'      // 供應商管理
  | 'database'       // 資料管理
  | 'visas'          // 簽證管理
  | 'contracts'      // 合約管理
  | 'accounting'     // 會計
  | 'templates';     // 模板管理

/**
 * PermissionGroup - 權限群組（用於 UI 分組顯示）
 */
export interface PermissionGroup {
  category: string;
  label: string;
  permissions: Permission[];
}

// ============================================
// 員工建立與更新
// ============================================

/**
 * CreateEmployeeData - 建立員工所需資料
 */
export interface CreateEmployeeData {
  employee_number: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  permissions: Permission[];
  is_active: boolean;
  salary?: number;
  hire_date?: string;
  avatar?: string;
}

/**
 * UpdateEmployeeData - 更新員工資料
 */
export interface UpdateEmployeeData {
  name?: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  permissions?: Permission[];
  is_active?: boolean;
  salary?: number;
  hire_date?: string;
  avatar?: string;
}

// ============================================
// 員工查詢與篩選
// ============================================

/**
 * EmployeeFilter - 員工篩選條件
 */
export interface EmployeeFilter {
  department?: string;
  is_active?: boolean;
  permissions?: Permission[];
  search_term?: string; // 搜尋姓名或員工編號
}

/**
 * EmployeeListItem - 員工列表項目（精簡版）
 */
export interface EmployeeListItem {
  id: string;
  employee_number: string;
  name: string;
  email: string;
  department?: string;
  position?: string;
  is_active: boolean;
}
