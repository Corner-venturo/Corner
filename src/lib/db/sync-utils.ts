/**
 * 同步狀態工具函數
 * 提供同步狀態管理的輔助功能
 *
 * FastIn 架構：
 * - _needs_sync: 是否待同步
 * - _synced_at: 最後同步時間
 * - _deleted: 軟刪除標記
 */

import type { SyncableEntity } from '@/types';

/**
 * 為新建立的實體加入同步欄位
 * @param data - 原始資料
 * @param isSynced - 是否已同步（true: 已同步, false: 待同步）
 * @returns 加入同步欄位的資料
 */
export function withSyncFields<T extends Record<string, unknown>>(
  data: T,
  isSynced: boolean = false
): T & Partial<SyncableEntity> {
  return {
    ...data,
    _needs_sync: !isSynced,
    _synced_at: isSynced ? new Date().toISOString() : null,
    _deleted: false,
  };
}

/**
 * 標記為已同步
 * @param data - 原始資料
 * @returns 更新同步狀態的資料
 */
export function markAsSynced<T extends Record<string, unknown>>(
  data: T
): T & Partial<SyncableEntity> {
  return {
    ...data,
    _needs_sync: false,
    _synced_at: new Date().toISOString(),
  };
}

/**
 * 標記為待同步
 * @param data - 原始資料
 * @returns 更新同步狀態的資料
 */
export function markAsPending<T extends Record<string, unknown>>(
  data: T
): T & Partial<SyncableEntity> {
  return {
    ...data,
    _needs_sync: true,
    _synced_at: null,
  };
}

/**
 * 標記為軟刪除（待同步刪除）
 * @param data - 原始資料
 * @returns 更新刪除狀態的資料
 */
export function markAsDeleted<T extends Record<string, unknown>>(
  data: T
): T & Partial<SyncableEntity> {
  return {
    ...data,
    _deleted: true,
    _needs_sync: true,
    _synced_at: null,
  };
}

/**
 * 檢查實體是否已同步
 */
export function isSynced(entity: Partial<SyncableEntity>): boolean {
  return entity._needs_sync === false && entity._synced_at !== null;
}

/**
 * 檢查實體是否待同步
 */
export function isPending(entity: Partial<SyncableEntity>): boolean {
  return entity._needs_sync === true;
}

/**
 * 檢查實體是否已軟刪除
 */
export function isDeleted(entity: Partial<SyncableEntity>): boolean {
  return entity._deleted === true;
}

