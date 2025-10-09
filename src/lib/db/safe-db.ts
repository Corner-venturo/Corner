/**
 * SafeDB - 防禦性資料庫查詢層
 *
 * 確保所有資料庫操作永遠不會返回 undefined
 * 提供安全的錯誤處理和預設值
 *
 * Phase 1 緊急修復
 */

import { localDB } from '@/lib/db';

export class SafeDB {
  /**
   * 安全的 getAll - 永遠返回陣列
   */
  static async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const result = await localDB.getAll<T>(storeName);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error(`❌ SafeDB.getAll('${storeName}') 失敗:`, error);
      return [];
    }
  }

  /**
   * 安全的 getById - 返回 null 而非 undefined
   */
  static async getById<T>(storeName: string, id: string): Promise<T | null> {
    try {
      const result = await localDB.getById<T>(storeName, id);
      return result || null;
    } catch (error) {
      console.error(`❌ SafeDB.getById('${storeName}', '${id}') 失敗:`, error);
      return null;
    }
  }

  /**
   * 安全的 create - 捕捉錯誤並返回結果或 null
   */
  static async create<T extends { id: string }>(
    storeName: string,
    data: T
  ): Promise<T | null> {
    try {
      const result = await localDB.create<T>(storeName, data);
      return result;
    } catch (error) {
      console.error(`❌ SafeDB.create('${storeName}') 失敗:`, error);
      return null;
    }
  }

  /**
   * 安全的 update - 捕捉錯誤並返回結果或 null
   */
  static async update<T>(
    storeName: string,
    id: string,
    data: Partial<T>
  ): Promise<T | null> {
    try {
      const result = await localDB.update<T>(storeName, id, data);
      return result;
    } catch (error) {
      console.error(`❌ SafeDB.update('${storeName}', '${id}') 失敗:`, error);
      return null;
    }
  }

  /**
   * 安全的 delete - 返回 boolean 表示是否成功
   */
  static async delete(storeName: string, id: string): Promise<boolean> {
    try {
      await localDB.delete(storeName, id);
      return true;
    } catch (error) {
      console.error(`❌ SafeDB.delete('${storeName}', '${id}') 失敗:`, error);
      return false;
    }
  }

  /**
   * 安全的條件查詢 - 永遠返回陣列
   */
  static async find<T>(
    storeName: string,
    predicate: (item: T) => boolean
  ): Promise<T[]> {
    try {
      const allItems = await this.getAll<T>(storeName);
      return allItems.filter(predicate);
    } catch (error) {
      console.error(`❌ SafeDB.find('${storeName}') 失敗:`, error);
      return [];
    }
  }

  /**
   * 安全的單一項目查詢 - 返回第一個符合的項目或 null
   */
  static async findOne<T>(
    storeName: string,
    predicate: (item: T) => boolean
  ): Promise<T | null> {
    try {
      const allItems = await this.getAll<T>(storeName);
      return allItems.find(predicate) || null;
    } catch (error) {
      console.error(`❌ SafeDB.findOne('${storeName}') 失敗:`, error);
      return null;
    }
  }

  /**
   * 安全的計數 - 永遠返回數字
   */
  static async count(storeName: string): Promise<number> {
    try {
      const items = await this.getAll(storeName);
      return items.length;
    } catch (error) {
      console.error(`❌ SafeDB.count('${storeName}') 失敗:`, error);
      return 0;
    }
  }

  /**
   * 檢查項目是否存在
   */
  static async exists(storeName: string, id: string): Promise<boolean> {
    try {
      const item = await this.getById(storeName, id);
      return item !== null;
    } catch (error) {
      console.error(`❌ SafeDB.exists('${storeName}', '${id}') 失敗:`, error);
      return false;
    }
  }
}
