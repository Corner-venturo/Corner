/**
 * Store 核心型別定義
 */

import { BaseEntity } from '@/types';
import { TableName } from '@/lib/db/schemas';

/**
 * Store 狀態介面
 */
export interface StoreState<T extends BaseEntity> {
  // 資料狀態
  items: T[];
  loading: boolean;
  error: string | null;

  // 🔧 請求取消控制器
  _abortController?: AbortController;

  // CRUD 操作
  fetchAll: () => Promise<void>;
  fetchById: (id: string) => Promise<T | null>;
  create: (data: Omit<T, 'id' | 'created_at' | 'updated_at'>) => Promise<T>;
  update: (id: string, data: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;

  // 批次操作
  createMany: (dataArray: Omit<T, 'id' | 'created_at' | 'updated_at'>[]) => Promise<T[]>;
  deleteMany: (ids: string[]) => Promise<void>;

  // 查詢操作
  findByField: (field: keyof T, value: unknown) => T[];
  filter: (predicate: (item: T) => boolean) => T[];
  count: () => number;

  // 工具方法
  clear: () => Promise<void>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  cancelRequests: () => void;

  // 🔄 同步方法
  syncPending?: () => Promise<void>;
}

/**
 * 編號生成配置
 */
export interface CodeConfig {
  prefix: string; // 前綴（如 'T', 'O', 'C'）
  year?: number;  // 年份（預設當前年份）
}

/**
 * Store 配置選項
 */
export interface StoreConfig {
  /** 資料表名稱 */
  tableName: TableName;
  /** 編號前綴（可選，如 'T', 'O', 'C'） */
  codePrefix?: string;
  /** 是否啟用 Supabase 同步（預設讀取環境變數） */
  enableSupabase?: boolean;
  /** FastIn 模式：本地先寫入 IndexedDB → 背景同步 Supabase（預設 true） */
  fastInsert?: boolean;
}

/**
 * 同步狀態
 */
export interface SyncState {
  isPending: boolean;
  lastSyncedAt: string | null;
  pendingCount: number;
}

/**
 * 適配器介面
 */
export interface StorageAdapter<T extends BaseEntity> {
  getAll: () => Promise<T[]>;
  getById: (id: string) => Promise<T | null>;
  put: (item: T) => Promise<void>;
  update: (id: string, data: Partial<T>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}

/**
 * 遠端適配器介面（Supabase）
 */
export interface RemoteAdapter<T extends BaseEntity> extends StorageAdapter<T> {
  fetchAll: (signal?: AbortSignal) => Promise<T[]>;
  insert: (data: Omit<T, 'id' | 'created_at' | 'updated_at'>) => Promise<T>;
}
