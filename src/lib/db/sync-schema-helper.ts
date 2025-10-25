/**
 * 同步 Schema 輔助工具
 * 為所有業務表自動加入同步相關索引
 */

import type { IndexSchema } from './schemas';

/**
 * 同步相關的索引定義
 * 所有業務表都需要這些索引
 */
export const SYNC_INDEXES: IndexSchema[] = [
  { name: 'sync_status', keyPath: 'sync_status', unique: false },
  { name: 'temp_code', keyPath: 'temp_code', unique: false },
  { name: 'synced_at', keyPath: 'synced_at', unique: false },
];

/**
 * 需要加入同步索引的業務表清單
 * 不包括系統表（如 syncQueue）和 UI 狀態表
 */
export const SYNCABLE_TABLES = [
  // 核心業務
  'employees',
  'tours',
  'itineraries',
  'orders',
  'members',
  'tour_addons',
  'customers',

  // 財務
  'payments',
  'payment_requests',
  'disbursement_orders',
  'receipt_orders',

  // 報價與供應商
  'quotes',
  'quote_items',
  'suppliers',

  // 附加功能
  'visas',
  'todos',
  'calendar_events',

  // 系統
  'regions',
  'templates',
  'workspace_items',
  'timebox_sessions',
] as const;

/**
 * 檢查表是否需要同步索引
 */
export function isSyncableTable(tableName: string): boolean {
  return SYNCABLE_TABLES.includes(tableName as any);
}

/**
 * 為表結構加入同步索引
 * 如果索引已存在則跳過
 */
export function addSyncIndexes(existingIndexes: IndexSchema[]): IndexSchema[] {
  const indexNames = new Set(existingIndexes.map(idx => idx.name));
  const newIndexes = [...existingIndexes];

  for (const syncIndex of SYNC_INDEXES) {
    if (!indexNames.has(syncIndex.name)) {
      newIndexes.push(syncIndex);
    }
  }

  return newIndexes;
}
