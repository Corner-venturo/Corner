/**
 * VENTURO 5.0 - 統一快取策略
 *
 * 三層快取架構：
 * - L1 (熱快取): Memory - 當前頁面正在使用的資料
 * - L2 (溫快取): SessionStorage - 跨頁面可能使用的資料
 * - L3 (冷快取): IndexedDB - 持久化備份資料
 */

import { localDB } from '@/lib/db';
import { logger } from '@/lib/utils/logger';

type CacheKey = string;
type CacheValue = any;

interface CacheOptions {
  /** 快取層級 */
  level?: 'hot' | 'warm' | 'cold';
  /** 過期時間（毫秒），0 表示永不過期 */
  ttl?: number;
  /** 是否壓縮儲存（針對大型資料） */
  compress?: boolean;
}

interface CacheEntry {
  value: CacheValue;
  timestamp: number;
  ttl: number;
}

class CacheStrategy {
  // L1: 熱快取 - 記憶體（不過期，頁面關閉即清除）
  private hotCache = new Map<CacheKey, CacheEntry>();

  // L2: 溫快取 - SessionStorage（瀏覽器關閉才清除）
  private warmCacheKey = 'venturo-warm-cache';

  // L3: 冷快取使用 IndexedDB（已在 localDB 中實作）

  /**
   * 獲取快取資料
   * 自動依序查找：熱 → 溫 → 冷
   */
  async get<T = CacheValue>(key: CacheKey): Promise<T | null> {
    // 1. 查找熱快取
    const hotEntry = this.hotCache.get(key);
    if (hotEntry && !this.isExpired(hotEntry)) {
      return hotEntry.value as T;
    }

    // 2. 查找溫快取
    const warmEntry = this.getFromSessionStorage(key);
    if (warmEntry && !this.isExpired(warmEntry)) {
      // 提升到熱快取
      this.hotCache.set(key, warmEntry);
      return warmEntry.value as T;
    }

    // 3. 查找冷快取（IndexedDB）
    try {
      const coldValue = await this.getFromIndexedDB(key);
      if (coldValue !== null) {
        // 提升到熱快取和溫快取
        const entry: CacheEntry = {
          value: coldValue,
          timestamp: Date.now(),
          ttl: 0 // IndexedDB 的資料不設過期
        };
        this.hotCache.set(key, entry);
        this.setToSessionStorage(key, entry);
        return coldValue as T;
      }
    } catch (error) {
      logger.warn(`從 IndexedDB 讀取快取失敗: ${key}`, error);
    }

    return null;
  }

  /**
   * 設定快取資料
   */
  async set(
    key: CacheKey,
    value: CacheValue,
    options: CacheOptions = {}
  ): Promise<void> {
    const { level = 'hot', ttl = 0, compress = false } = options;

    const entry: CacheEntry = {
      value,
      timestamp: Date.now(),
      ttl
    };

    // 根據層級儲存
    switch (level) {
      case 'hot':
        // 只存記憶體
        this.hotCache.set(key, entry);
        break;

      case 'warm':
        // 存記憶體 + SessionStorage
        this.hotCache.set(key, entry);
        this.setToSessionStorage(key, entry);
        break;

      case 'cold':
        // 存所有三層
        this.hotCache.set(key, entry);
        this.setToSessionStorage(key, entry);
        await this.setToIndexedDB(key, value);
        break;
    }
  }

  /**
   * 刪除快取
   */
  async delete(key: CacheKey): Promise<void> {
    // 從所有層級刪除
    this.hotCache.delete(key);
    this.deleteFromSessionStorage(key);
    await this.deleteFromIndexedDB(key);
  }

  /**
   * 清除特定層級的所有快取
   */
  async clear(level?: 'hot' | 'warm' | 'cold'): Promise<void> {
    if (!level || level === 'hot') {
      this.hotCache.clear();
    }

    if (!level || level === 'warm') {
      this.clearSessionStorage();
    }

    if (!level || level === 'cold') {
      // IndexedDB 的清除由 localDB 管理
      // 這裡不主動清除，因為那是持久化資料
    }
  }

  /**
   * 獲取快取統計資訊
   */
  getStats() {
    const warmCache = this.getAllFromSessionStorage();

    return {
      hot: {
        size: this.hotCache.size,
        keys: Array.from(this.hotCache.keys())
      },
      warm: {
        size: Object.keys(warmCache).length,
        keys: Object.keys(warmCache)
      }
    };
  }

  // ==================== 私有方法 ====================

  /**
   * 檢查快取是否過期
   */
  private isExpired(entry: CacheEntry): boolean {
    if (entry.ttl === 0) return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * SessionStorage 操作
   */
  private getFromSessionStorage(key: CacheKey): CacheEntry | null {
    if (typeof window === 'undefined') return null;

    try {
      const warmCache = sessionStorage.getItem(this.warmCacheKey);
      if (!warmCache) return null;

      const cache = JSON.parse(warmCache);
      return cache[key] || null;
    } catch {
      return null;
    }
  }

  private setToSessionStorage(key: CacheKey, entry: CacheEntry): void {
    if (typeof window === 'undefined') return;

    try {
      const warmCache = sessionStorage.getItem(this.warmCacheKey);
      const cache = warmCache ? JSON.parse(warmCache) : {};
      cache[key] = entry;
      sessionStorage.setItem(this.warmCacheKey, JSON.stringify(cache));
    } catch (error) {
      logger.warn('SessionStorage 寫入失敗，可能空間不足', error);
    }
  }

  private deleteFromSessionStorage(key: CacheKey): void {
    if (typeof window === 'undefined') return;

    try {
      const warmCache = sessionStorage.getItem(this.warmCacheKey);
      if (!warmCache) return;

      const cache = JSON.parse(warmCache);
      delete cache[key];
      sessionStorage.setItem(this.warmCacheKey, JSON.stringify(cache));
    } catch {
      // 忽略錯誤
    }
  }

  private clearSessionStorage(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(this.warmCacheKey);
  }

  private getAllFromSessionStorage(): Record<string, CacheEntry> {
    if (typeof window === 'undefined') return {};

    try {
      const warmCache = sessionStorage.getItem(this.warmCacheKey);
      return warmCache ? JSON.parse(warmCache) : {};
    } catch {
      return {};
    }
  }

  /**
   * IndexedDB 操作
   */
  private async getFromIndexedDB(key: CacheKey): Promise<CacheValue | null> {
    if (typeof window === 'undefined') return null;

    try {
      // 使用特殊的 cache 表
      const value = await localDB.read('cache' as unknown, key);
      return value || null;
    } catch {
      return null;
    }
  }

  private async setToIndexedDB(key: CacheKey, value: CacheValue): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      await localDB.create('cache' as unknown, { id: key, data: value });
    } catch (error) {
      logger.warn('IndexedDB 寫入失敗', error);
    }
  }

  private async deleteFromIndexedDB(key: CacheKey): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      await localDB.delete('cache' as unknown, key);
    } catch {
      // 忽略錯誤
    }
  }
}

// 匯出單例
export const cacheStrategy = new CacheStrategy();

// 匯出類型
export type { CacheKey, CacheValue, CacheOptions };
