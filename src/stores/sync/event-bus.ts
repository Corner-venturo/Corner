/**
 * Store 事件系統
 * 用於 Store 之間的通訊，避免記憶體洩漏
 */

import { logger } from '@/lib/utils/logger';

type EventCallback = () => void;

/**
 * Store 事件總線（單例）
 */
class StoreEventBus {
  private static instance: StoreEventBus;
  private listeners: Map<string, Map<symbol, EventCallback>> = new Map();

  private constructor() {}

  static getInstance(): StoreEventBus {
    if (!StoreEventBus.instance) {
      StoreEventBus.instance = new StoreEventBus();
    }
    return StoreEventBus.instance;
  }

  /**
   * 註冊同步完成監聽器
   * @returns 取消註冊函數
   */
  onSyncCompleted(tableName: string, callback: EventCallback): () => void {
    // 使用 Symbol 作為唯一識別
    const key = Symbol.for(`sync-listener:${tableName}`);

    if (!this.listeners.has(tableName)) {
      this.listeners.set(tableName, new Map());
    }

    const tableListeners = this.listeners.get(tableName)!;

    // 如果已經有舊的監聽器，先移除
    if (tableListeners.has(key)) {
      logger.log(`🧹 [${tableName}] 清理舊的同步監聽器`);
    }

    // 註冊新的監聽器
    tableListeners.set(key, callback);
    logger.log(`📡 [${tableName}] 已註冊同步監聽器`);

    // 返回取消註冊函數
    return () => {
      tableListeners.delete(key);
      logger.log(`🗑️ [${tableName}] 已取消同步監聽器`);
    };
  }

  /**
   * 觸發同步完成事件
   */
  emitSyncCompleted(tableName?: string): void {
    if (tableName) {
      // 觸發特定表格的監聽器
      const tableListeners = this.listeners.get(tableName);
      if (tableListeners) {
        tableListeners.forEach((callback) => callback());
        logger.log(`📢 [${tableName}] 觸發同步完成事件 (${tableListeners.size} 個監聽器)`);
      }
    } else {
      // 觸發所有表格的監聽器
      this.listeners.forEach((tableListeners, table) => {
        tableListeners.forEach((callback) => callback());
        logger.log(`📢 [${table}] 觸發同步完成事件`);
      });
    }
  }

  /**
   * 清理所有監聽器（測試用）
   */
  clear(): void {
    this.listeners.clear();
    logger.log('🧹 已清理所有事件監聽器');
  }

  /**
   * 取得監聽器數量（偵錯用）
   */
  getListenerCount(tableName?: string): number {
    if (tableName) {
      return this.listeners.get(tableName)?.size || 0;
    }
    let total = 0;
    this.listeners.forEach((tableListeners) => {
      total += tableListeners.size;
    });
    return total;
  }
}

// 匯出單例
export const storeEventBus = StoreEventBus.getInstance();
