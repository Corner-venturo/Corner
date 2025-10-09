/**
 * IndexedDB 資料表結構定義
 * 定義所有資料表的 Schema 和索引
 */

export interface TableSchema {
  name: string;
  keyPath: string;
  autoIncrement: boolean;
  indexes: IndexSchema[];
}

export interface IndexSchema {
  name: string;
  keyPath: string | string[];
  unique: boolean;
}

/**
 * 資料庫版本
 * 更新記錄：
 * v4: 初始版本
 * v5: 修正 calendar_events 索引欄位 (2025-10-07)
 * v6: 新增 todos 的 type, parentId, projectId 索引 (2025-10-07)
 * v7: 全面統一使用 snake_case 命名 (2025-10-08)
 */
export const DB_VERSION = 7;

/**
 * 資料庫名稱
 */
export const DB_NAME = 'VenturoLocalDB';

/**
 * 所有資料表的 Schema 定義
 */
export const TABLE_SCHEMAS: TableSchema[] = [
  // 員工表
  {
    name: 'employees',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'employee_number', keyPath: 'employee_number', unique: true },
      { name: 'email', keyPath: 'email', unique: true },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
    ],
  },

  // 旅遊團表
  {
    name: 'tours',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'code', keyPath: 'code', unique: true },
      { name: 'status', keyPath: 'status', unique: false },
      { name: 'start_date', keyPath: 'start_date', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
    ],
  },

  // 訂單表
  {
    name: 'orders',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'code', keyPath: 'code', unique: true },
      { name: 'tour_id', keyPath: 'tour_id', unique: false },
      { name: 'customer_id', keyPath: 'customer_id', unique: false },
      { name: 'status', keyPath: 'status', unique: false },
      { name: 'payment_status', keyPath: 'payment_status', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
    ],
  },

  // 團員表
  {
    name: 'members',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'order_id', keyPath: 'order_id', unique: false },
      { name: 'tour_id', keyPath: 'tour_id', unique: false },
      { name: 'name', keyPath: 'name', unique: false },
      { name: 'id_number', keyPath: 'id_number', unique: false },
      { name: 'passport_number', keyPath: 'passport_number', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
    ],
  },

  // 客戶表
  {
    name: 'customers',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'code', keyPath: 'code', unique: true },
      { name: 'phone', keyPath: 'phone', unique: false },
      { name: 'email', keyPath: 'email', unique: false },
      { name: 'is_vip', keyPath: 'is_vip', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
    ],
  },

  // 付款記錄表
  {
    name: 'payments',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'code', keyPath: 'code', unique: true },
      { name: 'order_id', keyPath: 'order_id', unique: false },
      { name: 'customer_id', keyPath: 'customer_id', unique: false },
      { name: 'status', keyPath: 'status', unique: false },
      { name: 'payment_date', keyPath: 'payment_date', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
    ],
  },

  // 請款單表
  {
    name: 'payment_requests',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'code', keyPath: 'code', unique: true },
      { name: 'tour_id', keyPath: 'tour_id', unique: false },
      { name: 'supplier_id', keyPath: 'supplier_id', unique: false },
      { name: 'requester_id', keyPath: 'requester_id', unique: false },
      { name: 'status', keyPath: 'status', unique: false },
      { name: 'request_date', keyPath: 'request_date', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
    ],
  },

  // 出納單表
  {
    name: 'disbursement_orders',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'code', keyPath: 'code', unique: true },
      { name: 'tour_id', keyPath: 'tour_id', unique: false },
      { name: 'payment_request_id', keyPath: 'payment_request_id', unique: false },
      { name: 'status', keyPath: 'status', unique: false },
      { name: 'payment_date', keyPath: 'payment_date', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
    ],
  },

  // 收款單表
  {
    name: 'receipt_orders',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'code', keyPath: 'code', unique: true },
      { name: 'order_id', keyPath: 'order_id', unique: false },
      { name: 'customer_id', keyPath: 'customer_id', unique: false },
      { name: 'status', keyPath: 'status', unique: false },
      { name: 'receipt_date', keyPath: 'receipt_date', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
    ],
  },

  // 報價單表
  {
    name: 'quotes',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'code', keyPath: 'code', unique: true },
      { name: 'customer_id', keyPath: 'customer_id', unique: false },
      { name: 'status', keyPath: 'status', unique: false },
      { name: 'start_date', keyPath: 'start_date', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
    ],
  },

  // 報價項目表
  {
    name: 'quote_items',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'quote_id', keyPath: 'quote_id', unique: false },
      { name: 'category_id', keyPath: 'category_id', unique: false },
      { name: 'type', keyPath: 'type', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
    ],
  },

  // 待辦事項表
  {
    name: 'todos',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'creator', keyPath: 'creator', unique: false },
      { name: 'assignee', keyPath: 'assignee', unique: false },
      { name: 'status', keyPath: 'status', unique: false },
      { name: 'priority', keyPath: 'priority', unique: false },
      { name: 'due_date', keyPath: 'due_date', unique: false },
      { name: 'type', keyPath: 'type', unique: false },
      { name: 'parent_id', keyPath: 'parent_id', unique: false },
      { name: 'project_id', keyPath: 'project_id', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
    ],
  },

  // 簽證表
  {
    name: 'visas',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'code', keyPath: 'code', unique: true },
      { name: 'tour_id', keyPath: 'tour_id', unique: false },
      { name: 'customer_id', keyPath: 'customer_id', unique: false },
      { name: 'status', keyPath: 'status', unique: false },
      { name: 'application_date', keyPath: 'application_date', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
    ],
  },

  // 供應商表
  {
    name: 'suppliers',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'code', keyPath: 'code', unique: true },
      { name: 'name', keyPath: 'name', unique: false },
      { name: 'type', keyPath: 'type', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
    ],
  },

  // 行事曆事件表
  {
    name: 'calendar_events',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'user_id', keyPath: 'user_id', unique: false },
      { name: 'visibility', keyPath: 'visibility', unique: false },
      { name: 'event_type', keyPath: 'event_type', unique: false },
      { name: 'start_date', keyPath: 'start_date', unique: false },
      { name: 'end_date', keyPath: 'end_date', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
    ],
  },

  // 記帳 - 帳戶
  {
    name: 'accounts',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'type', keyPath: 'type', unique: false },
      { name: 'name', keyPath: 'name', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
    ],
  },

  // 記帳 - 分類
  {
    name: 'categories',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'type', keyPath: 'type', unique: false },
      { name: 'name', keyPath: 'name', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
    ],
  },

  // 記帳 - 交易
  {
    name: 'transactions',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'date', keyPath: 'date', unique: false },
      { name: 'type', keyPath: 'type', unique: false },
      { name: 'account_id', keyPath: 'account_id', unique: false },
      { name: 'category_id', keyPath: 'category_id', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
    ],
  },

  // 記帳 - 預算
  {
    name: 'budgets',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'category_id', keyPath: 'category_id', unique: false },
      { name: 'period', keyPath: 'period', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
    ],
  },

  // 工作空間表
  {
    name: 'workspace_items',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'type', keyPath: 'type', unique: false },
      { name: 'position', keyPath: 'position', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
    ],
  },

  // 時間箱表
  {
    name: 'timebox_sessions',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'date', keyPath: 'date', unique: false },
      { name: 'status', keyPath: 'status', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
    ],
  },

  // 模板表
  {
    name: 'templates',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'type', keyPath: 'type', unique: false },
      { name: 'category', keyPath: 'category', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
    ],
  },
];

/**
 * 取得所有資料表名稱
 */
export const TABLE_NAMES = TABLE_SCHEMAS.map((schema) => schema.name);

/**
 * 資料表名稱常數（用於型別安全）
 */
export const TABLES = {
  EMPLOYEES: 'employees',
  TOURS: 'tours',
  ORDERS: 'orders',
  MEMBERS: 'members',
  CUSTOMERS: 'customers',
  PAYMENTS: 'payments',
  PAYMENT_REQUESTS: 'payment_requests',
  DISBURSEMENT_ORDERS: 'disbursement_orders',
  RECEIPT_ORDERS: 'receipt_orders',
  QUOTES: 'quotes',
  QUOTE_ITEMS: 'quote_items',
  TODOS: 'todos',
  VISAS: 'visas',
  SUPPLIERS: 'suppliers',
  CALENDAR_EVENTS: 'calendar_events',
  ACCOUNTS: 'accounts',
  CATEGORIES: 'categories',
  TRANSACTIONS: 'transactions',
  BUDGETS: 'budgets',
  WORKSPACE_ITEMS: 'workspace_items',
  TIMEBOX_SESSIONS: 'timebox_sessions',
  TEMPLATES: 'templates',
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];
