/**
 * IndexedDB 資料表結構定義
 * 定義所有資料表的 Schema 和索引
 */

export interface TableSchema {
  name: string
  keyPath: string
  autoIncrement: boolean
  indexes: IndexSchema[]
}

export interface IndexSchema {
  name: string
  keyPath: string | string[]
  unique: boolean
}

/**
 * 資料庫版本
 * v1: 完整的 Offline-First 架構，包含所有資料表（含 regions 和 workspace）
 * v2: 新增 countries 和 cities 表（不刪除任何資料）
 * v3: 新增 cost_templates 和 supplier_categories 表（供應商管理系統）
 */
export const DB_VERSION = 3

/**
 * 資料庫名稱
 * 快取優先架構專用資料庫
 */
export const DB_NAME = 'VenturoOfflineDB'

/**
 * 所有資料表的 Schema 定義
 */
export const TABLE_SCHEMAS: TableSchema[] = [
  // 同步佇列表
  {
    name: 'syncQueue',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'status', keyPath: 'status', unique: false },
      { name: 'table_name', keyPath: 'table_name', unique: false },
      { name: 'operation', keyPath: 'operation', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'retry_count', keyPath: 'retry_count', unique: false },
    ],
  },

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
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
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
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
    ],
  },

  // 行程表
  {
    name: 'itineraries',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'code', keyPath: 'code', unique: true },
      { name: 'tour_id', keyPath: 'tour_id', unique: false },
      { name: 'status', keyPath: 'status', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
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
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
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
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
    ],
  },

  // 團體加購項目表
  {
    name: 'tour_addons',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'tour_id', keyPath: 'tour_id', unique: false },
      { name: 'name', keyPath: 'name', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
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
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
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
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
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
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
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
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
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
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
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
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
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
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
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
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
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
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
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
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
    ],
  },

  // 成本模板表（供應商報價用）
  {
    name: 'cost_templates',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'supplier_id', keyPath: 'supplier_id', unique: false },
      { name: 'city_id', keyPath: 'city_id', unique: false },
      { name: 'attraction_id', keyPath: 'attraction_id', unique: false },
      { name: 'category', keyPath: 'category', unique: false },
      { name: 'unit', keyPath: 'unit', unique: false },
      { name: 'season', keyPath: 'season', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
    ],
  },

  // 供應商類別表
  {
    name: 'supplier_categories',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'name', keyPath: 'name', unique: false },
      { name: 'display_order', keyPath: 'display_order', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
    ],
  },

  // ============================================
  // 地區管理系統（三層架構：Countries > Regions > Cities）
  // ============================================

  // 國家表
  {
    name: 'countries',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'name', keyPath: 'name', unique: false },
      { name: 'name_en', keyPath: 'name_en', unique: false },
      { name: 'code', keyPath: 'code', unique: true },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'display_order', keyPath: 'display_order', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
    ],
  },

  // 地區表（某些國家有，如日本的關東/關西）
  {
    name: 'regions',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'country_id', keyPath: 'country_id', unique: false },
      { name: 'name', keyPath: 'name', unique: false },
      { name: 'name_en', keyPath: 'name_en', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'display_order', keyPath: 'display_order', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
    ],
  },

  // 城市表
  {
    name: 'cities',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'country_id', keyPath: 'country_id', unique: false },
      { name: 'region_id', keyPath: 'region_id', unique: false },
      { name: 'name', keyPath: 'name', unique: false },
      { name: 'name_en', keyPath: 'name_en', unique: false },
      { name: 'airport_code', keyPath: 'airport_code', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'display_order', keyPath: 'display_order', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
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
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
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
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
    ],
  },

  // 時間箱 - 箱子定義表
  {
    name: 'timebox_boxes',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'user_id', keyPath: 'user_id', unique: false },
      { name: 'type', keyPath: 'type', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
    ],
  },

  // 時間箱 - 週記錄表
  {
    name: 'timebox_weeks',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'user_id', keyPath: 'user_id', unique: false },
      { name: 'week_start', keyPath: 'week_start', unique: false },
      { name: 'archived', keyPath: 'archived', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
    ],
  },

  // 時間箱 - 排程箱子實例表
  {
    name: 'timebox_scheduled_boxes',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'box_id', keyPath: 'box_id', unique: false },
      { name: 'week_id', keyPath: 'week_id', unique: false },
      { name: 'day_of_week', keyPath: 'day_of_week', unique: false },
      { name: 'completed', keyPath: 'completed', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
    ],
  },

  // ============================================
  // Workspace 相關表格（v2 新增）
  // ============================================

  // 工作空間
  {
    name: 'workspaces',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'name', keyPath: 'name', unique: false },
      { name: 'is_active', keyPath: 'is_active', unique: false },
      { name: 'created_by', keyPath: 'created_by', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
    ],
  },

  // 頻道
  {
    name: 'channels',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'workspace_id', keyPath: 'workspace_id', unique: false },
      { name: 'name', keyPath: 'name', unique: false },
      { name: 'type', keyPath: 'type', unique: false },
      { name: 'group_id', keyPath: 'group_id', unique: false },
      { name: 'tour_id', keyPath: 'tour_id', unique: false },
      { name: 'is_favorite', keyPath: 'is_favorite', unique: false },
      { name: 'created_by', keyPath: 'created_by', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
    ],
  },

  // 頻道群組
  {
    name: 'channel_groups',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'workspace_id', keyPath: 'workspace_id', unique: false },
      { name: 'name', keyPath: 'name', unique: false },
      { name: 'order', keyPath: 'order', unique: false },
      { name: 'is_collapsed', keyPath: 'is_collapsed', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
    ],
  },

  // 訊息
  {
    name: 'messages',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'channel_id', keyPath: 'channel_id', unique: false },
      { name: 'author_id', keyPath: 'author_id', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'edited_at', keyPath: 'edited_at', unique: false },
    ],
  },

  // 公告
  {
    name: 'bulletins',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'workspace_id', keyPath: 'workspace_id', unique: false },
      { name: 'type', keyPath: 'type', unique: false },
      { name: 'priority', keyPath: 'priority', unique: false },
      { name: 'is_pinned', keyPath: 'is_pinned', unique: false },
      { name: 'author_id', keyPath: 'author_id', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
    ],
  },

  // 代墊清單
  {
    name: 'advance_lists',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'channel_id', keyPath: 'channel_id', unique: false },
      { name: 'created_by', keyPath: 'created_by', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
    ],
  },

  // 分享訂單清單
  {
    name: 'shared_order_lists',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'channel_id', keyPath: 'channel_id', unique: false },
      { name: 'created_by', keyPath: 'created_by', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
    ],
  },

  // eSIM 網卡管理
  {
    name: 'esims',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'workspace_id', keyPath: 'workspace_id', unique: false },
      { name: 'iccid', keyPath: 'iccid', unique: false },
      { name: 'status', keyPath: 'status', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
    ],
  },

  // 確認單系統（住宿、機票）
  {
    name: 'confirmations',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'workspace_id', keyPath: 'workspace_id', unique: false },
      { name: 'type', keyPath: 'type', unique: false },
      { name: 'status', keyPath: 'status', unique: false },
      { name: 'booking_number', keyPath: 'booking_number', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
    ],
  },

  // PNR 管理（Amadeus 電報）
  {
    name: 'pnrs',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'record_locator', keyPath: 'record_locator', unique: true },
      { name: 'workspace_id', keyPath: 'workspace_id', unique: false },
      { name: 'employee_id', keyPath: 'employee_id', unique: false },
      { name: 'ticketing_deadline', keyPath: 'ticketing_deadline', unique: false },
      { name: 'status', keyPath: 'status', unique: false },
      { name: 'created_at', keyPath: 'created_at', unique: false },
      { name: 'updated_at', keyPath: 'updated_at', unique: false },
      // Offline-First 同步欄位
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
    ],
  },
]

/**
 * 取得所有資料表名稱
 */
export const TABLE_NAMES = TABLE_SCHEMAS.map(schema => schema.name)

/**
 * 資料表名稱常數（用於型別安全）
 */
export const TABLES = {
  SYNC_QUEUE: 'syncQueue',
  EMPLOYEES: 'employees',
  TOURS: 'tours',
  ITINERARIES: 'itineraries',
  ORDERS: 'orders',
  MEMBERS: 'members',
  TOUR_ADDONS: 'tour_addons',
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
  COST_TEMPLATES: 'cost_templates',
  SUPPLIER_CATEGORIES: 'supplier_categories',
  // 地區管理系統（三層架構）
  COUNTRIES: 'countries',
  REGIONS: 'regions',
  CITIES: 'cities',
  CALENDAR_EVENTS: 'calendar_events',
  ACCOUNTS: 'accounts',
  CATEGORIES: 'categories',
  TRANSACTIONS: 'transactions',
  WORKSPACE_ITEMS: 'workspace_items',
  TIMEBOX_BOXES: 'timebox_boxes',
  TIMEBOX_WEEKS: 'timebox_weeks',
  TIMEBOX_SCHEDULED_BOXES: 'timebox_scheduled_boxes',
  // Workspace 相關（v2 新增）
  WORKSPACES: 'workspaces',
  CHANNELS: 'channels',
  CHANNEL_GROUPS: 'channel_groups',
  MESSAGES: 'messages',
  BULLETINS: 'bulletins',
  ADVANCE_LISTS: 'advance_lists',
  SHARED_ORDER_LISTS: 'shared_order_lists',
  ESIMS: 'esims',
  CONFIRMATIONS: 'confirmations',
  PNRS: 'pnrs',
} as const

export type TableName = (typeof TABLES)[keyof typeof TABLES]
