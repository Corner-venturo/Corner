/**
 * 🎯 Venturo v4.0 - 離線管理器
 *
 * 核心功能：
 * - 統一管理 localStorage + IndexedDB
 * - 自動選擇最佳儲存方案
 * - 管理同步佇列
 * - 提供統一的 CRUD 介面
 */

import { getOfflineDB } from './offline-database';
import type { StoreName } from './offline-database';
import { generateUUID, toSupabase, fromSupabase } from './unified-types';

// Re-export StoreName for convenience
export type { StoreName } from './offline-database';

// ===========================
// 同步佇列項目
// ===========================

export interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  tableName: StoreName;
  recordId: string;
  data?: any;
  createdAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  error?: string;
}

// ===========================
// 離線管理器類別
// ===========================

export class OfflineManager {
  private db = getOfflineDB();
  private localStorage = window.localStorage;

  /**
   * 建立資料 (新增)
   */
  async create<T extends Record<string, any>>(
    storeName: StoreName,
    data: Partial<T>
  ): Promise<T> {
    const now = new Date().toISOString();
    const record: any = {
      ...data,
      id: generateUUID(),
      createdAt: now,
      updatedAt: now,
      synced: false,
      lastSyncedAt: undefined,
      syncError: undefined,
      version: 1
    };

    // 儲存到 IndexedDB
    await this.db.add(storeName, record);

    // 加入同步佇列
    await this.addToSyncQueue('create', storeName, record.id, record);

    console.log(`✅ 建立資料:`, storeName, record.id);
    return record as T;
  }

  /**
   * 更新資料
   */
  async update<T extends Record<string, any>>(
    storeName: StoreName,
    id: string,
    updates: Partial<T>
  ): Promise<T> {
    // 讀取現有資料
    const existing = await this.db.get<any>(storeName, id);
    if (!existing) {
      throw new Error(`找不到資料: ${id}`);
    }

    // 合併更新
    const updated: any = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      synced: false,
      version: (existing.version || 1) + 1
    };

    // 儲存到 IndexedDB
    await this.db.update(storeName, updated);

    // 加入同步佇列
    await this.addToSyncQueue('update', storeName, id, updated);

    console.log(`✅ 更新資料:`, storeName, id);
    return updated as T;
  }

  /**
   * 刪除資料
   */
  async delete(storeName: StoreName, id: string): Promise<void> {
    // 從 IndexedDB 刪除
    await this.db.delete(storeName, id);

    // 加入同步佇列
    await this.addToSyncQueue('delete', storeName, id);

    console.log(`✅ 刪除資料:`, storeName, id);
  }

  /**
   * 讀取單筆資料
   */
  async get<T>(storeName: StoreName, id: string): Promise<T | null> {
    return await this.db.get<T>(storeName, id);
  }

  /**
   * 讀取所有資料
   */
  async getAll<T>(storeName: StoreName): Promise<T[]> {
    return await this.db.getAll<T>(storeName);
  }

  /**
   * 使用索引查詢
   */
  async getByIndex<T>(
    storeName: StoreName,
    indexName: string,
    value: any
  ): Promise<T[]> {
    return await this.db.getByIndex<T>(storeName, indexName, value);
  }

  /**
   * 批次建立
   */
  async createBatch<T extends Record<string, any>>(
    storeName: StoreName,
    dataList: Partial<T>[]
  ): Promise<T[]> {
    const now = new Date().toISOString();
    const records: any[] = dataList.map(data => ({
      ...data,
      id: generateUUID(),
      createdAt: now,
      updatedAt: now,
      synced: false,
      version: 1
    }));

    // 批次儲存到 IndexedDB
    await this.db.addBatch(storeName, records);

    // 批次加入同步佇列
    for (const record of records) {
      await this.addToSyncQueue('create', storeName, record.id, record);
    }

    console.log(`✅ 批次建立 ${records.length} 筆資料:`, storeName);
    return records as T[];
  }

  /**
   * 清空 Store
   */
  async clear(storeName: StoreName): Promise<void> {
    await this.db.clear(storeName);
    console.log(`✅ 清空:`, storeName);
  }

  /**
   * 取得資料數量
   */
  async count(storeName: StoreName): Promise<number> {
    return await this.db.count(storeName);
  }

  // ===========================
  // 同步佇列管理
  // ===========================

  /**
   * 加入同步佇列
   */
  private async addToSyncQueue(
    operation: SyncQueueItem['operation'],
    tableName: StoreName,
    recordId: string,
    data?: any
  ): Promise<void> {
    const queueItem: SyncQueueItem = {
      id: generateUUID(),
      operation,
      tableName,
      recordId,
      data,
      createdAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0
    };

    await this.db.add('syncQueue', queueItem);
    console.log(`📤 加入同步佇列:`, operation, tableName, recordId);
  }

  /**
   * 取得待同步項目
   */
  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    return await this.db.getByIndex<SyncQueueItem>('syncQueue', 'status', 'pending');
  }

  /**
   * 標記同步項目為完成
   */
  async markSyncCompleted(queueItemId: string): Promise<void> {
    const item = await this.db.get<SyncQueueItem>('syncQueue', queueItemId);
    if (item) {
      item.status = 'completed';
      await this.db.update('syncQueue', item);

      // 同時標記原始資料為已同步
      await this.db.markAsSynced(item.tableName, item.recordId);
    }
  }

  /**
   * 標記同步項目為失敗
   */
  async markSyncFailed(queueItemId: string, error: string): Promise<void> {
    const item = await this.db.get<SyncQueueItem>('syncQueue', queueItemId);
    if (item) {
      item.status = 'failed';
      item.error = error;
      item.retryCount += 1;
      await this.db.update('syncQueue', item);
    }
  }

  /**
   * 清空已完成的同步佇列
   */
  async clearCompletedSync(): Promise<void> {
    const completed = await this.db.getByIndex<SyncQueueItem>(
      'syncQueue',
      'status',
      'completed'
    );

    for (const item of completed) {
      await this.db.delete('syncQueue', item.id);
    }

    console.log(`✅ 清空 ${completed.length} 筆已完成同步項目`);
  }

  // ===========================
  // localStorage 輔助方法
  // ===========================

  /**
   * 儲存設定到 localStorage
   */
  saveSetting(key: string, value: any): void {
    try {
      this.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('localStorage 儲存失敗:', error);
    }
  }

  /**
   * 從 localStorage 讀取設定
   */
  getSetting<T>(key: string, defaultValue?: T): T | null {
    try {
      const value = this.localStorage.getItem(key);
      return value ? JSON.parse(value) : (defaultValue || null);
    } catch (error) {
      console.error('localStorage 讀取失敗:', error);
      return defaultValue || null;
    }
  }

  /**
   * 刪除 localStorage 設定
   */
  removeSetting(key: string): void {
    this.localStorage.removeItem(key);
  }

  // ===========================
  // 狀態查詢
  // ===========================

  /**
   * 取得離線資料統計
   */
  async getStats() {
    const stats: Record<string, number> = {};

    const storeNames: StoreName[] = [
      'tours',
      'orders',
      'quotes',
      'paymentRequests',
      'todos',
      'suppliers',
      'customers'
    ];

    for (const storeName of storeNames) {
      stats[storeName] = await this.db.count(storeName);
    }

    const pendingSync = await this.getPendingSyncItems();
    stats.pendingSync = pendingSync.length;

    return stats;
  }

  /**
   * 檢查是否有未同步資料
   */
  async hasUnsyncedData(): Promise<boolean> {
    const pending = await this.getPendingSyncItems();
    return pending.length > 0;
  }
}

// ===========================
// 單例模式
// ===========================

let offlineManager: OfflineManager | null = null;

export function getOfflineManager(): OfflineManager {
  if (!offlineManager) {
    offlineManager = new OfflineManager();
  }
  return offlineManager;
}
