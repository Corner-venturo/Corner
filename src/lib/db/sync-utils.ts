/**
 * 同步狀態工具函數
 * 提供同步狀態管理的輔助功能
 */

import type { SyncStatus, SyncableEntity } from '@/types';

/**
 * 為新建立的實體加入同步欄位
 * @param data - 原始資料
 * @param isSynced - 是否已同步（true: 'synced', false: 'pending'）
 * @returns 加入同步欄位的資料
 */
export function withSyncFields<T extends Record<string, any>>(
  data: T,
  isSynced: boolean = false
): T & Partial<SyncableEntity> {
  return {
    ...data,
    sync_status: (isSynced ? 'synced' : 'pending') as SyncStatus,
  };
}

/**
 * 標記為已同步
 * @param data - 原始資料
 * @returns 更新同步狀態的資料
 */
export function markAsSynced<T extends Record<string, any>>(
  data: T
): T & Partial<SyncableEntity> {
  return {
    ...data,
    sync_status: 'synced' as SyncStatus,
  };
}

/**
 * 標記為待同步
 * @param data - 原始資料
 * @returns 更新同步狀態的資料
 */
export function markAsPending<T extends Record<string, any>>(
  data: T
): T & Partial<SyncableEntity> {
  return {
    ...data,
    sync_status: 'pending' as SyncStatus,
  };
}

/**
 * 標記為衝突
 * @param data - 原始資料
 * @returns 更新同步狀態的資料
 */
export function markAsConflict<T extends Record<string, any>>(
  data: T
): T & Partial<SyncableEntity> {
  return {
    ...data,
    sync_status: 'conflict' as SyncStatus,
  };
}

/**
 * 檢查實體是否已同步
 */
export function isSynced(entity: Partial<SyncableEntity>): boolean {
  return entity.sync_status === 'synced';
}

/**
 * 檢查實體是否待同步
 */
export function isPending(entity: Partial<SyncableEntity>): boolean {
  return entity.sync_status === 'pending';
}

/**
 * 檢查實體是否有衝突
 */
export function hasConflict(entity: Partial<SyncableEntity>): boolean {
  return entity.sync_status === 'conflict';
}

