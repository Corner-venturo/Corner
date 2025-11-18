/**
 * LocalDatabase 核心類別
 */

import type { TableName } from './schemas'
import type { QueryOptions, FilterCondition } from './types'
import { initDatabase } from './utils/connection'
import { exportData, importData } from './migrations'
import * as ReadOps from './operations/read'
import * as WriteOps from './operations/write'
import * as DeleteOps from './operations/delete'
import * as QueryOps from './operations/query'

/**
 * LocalDatabase 類別
 * 管理所有 IndexedDB 操作
 */
export class LocalDatabase {
  private db: IDBDatabase | null = null
  private initPromise: Promise<IDBDatabase> | null = null

  /**
   * 初始化資料庫
   */
  async init(): Promise<IDBDatabase> {
    return initDatabase(
      this.db,
      this.initPromise,
      (db: IDBDatabase) => {
        this.db = db
      },
      (promise: Promise<IDBDatabase> | null) => {
        this.initPromise = promise
      }
    )
  }

  /**
   * 確保資料庫已初始化
   */
  private async ensureInit(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init()
    }

    if (!this.db) {
      throw new Error('資料庫初始化失敗')
    }

    return this.db
  }

  // ============================================
  // 基本 CRUD 操作
  // ============================================

  /**
   * Put 資料（更新或新增）
   * 如果 ID 存在則更新，不存在則新增
   */
  async put<T extends { id: string }>(tableName: TableName, data: T): Promise<T> {
    const db = await this.ensureInit()
    return WriteOps.put(db, tableName, data)
  }

  /**
   * 建立單筆資料
   */
  async create<T extends { id: string }>(tableName: TableName, data: T): Promise<T> {
    const db = await this.ensureInit()
    return WriteOps.create(db, tableName, data)
  }

  /**
   * 讀取單筆資料
   */
  async read<T>(tableName: TableName, id: string): Promise<T | null> {
    const db = await this.ensureInit()
    return ReadOps.read<T>(db, tableName, id)
  }

  /**
   * 更新單筆資料
   */
  async update<T extends { id: string }>(
    tableName: TableName,
    id: string,
    data: Partial<T>
  ): Promise<T> {
    const db = await this.ensureInit()
    return WriteOps.update<T>(db, tableName, id, data, ReadOps.read)
  }

  /**
   * 刪除單筆資料
   */
  async delete(tableName: TableName, id: string): Promise<void> {
    const db = await this.ensureInit()
    return DeleteOps.deleteRecord(db, tableName, id)
  }

  // ============================================
  // 批次操作
  // ============================================

  /**
   * 批次建立資料
   */
  async createMany<T extends { id: string }>(tableName: TableName, dataArray: T[]): Promise<T[]> {
    const db = await this.ensureInit()
    return WriteOps.createMany(db, tableName, dataArray)
  }

  /**
   * 批次更新資料
   */
  async updateMany<T extends { id: string }>(
    tableName: TableName,
    updates: Array<{ id: string; data: Partial<T> }>
  ): Promise<T[]> {
    const db = await this.ensureInit()
    return WriteOps.updateMany<T>(db, tableName, updates, WriteOps.update as any)
  }

  /**
   * 批次刪除資料
   */
  async deleteMany(tableName: TableName, ids: string[]): Promise<void> {
    const db = await this.ensureInit()
    return DeleteOps.deleteMany(db, tableName, ids)
  }

  // ============================================
  // 查詢功能
  // ============================================

  /**
   * 取得所有資料
   */
  async getAll<T>(tableName: TableName, options?: QueryOptions): Promise<T[]> {
    const db = await this.ensureInit()
    return ReadOps.getAll<T>(db, tableName, options)
  }

  /**
   * 根據索引查詢
   */
  async findByIndex<T>(tableName: TableName, indexName: string, value: unknown): Promise<T[]> {
    const db = await this.ensureInit()
    return ReadOps.findByIndex<T>(db, tableName, indexName, value)
  }

  /**
   * 過濾查詢
   */
  async filter<T>(tableName: TableName, conditions: FilterCondition[]): Promise<T[]> {
    const db = await this.ensureInit()
    return QueryOps.filter<T>(db, tableName, conditions)
  }

  /**
   * 計算資料筆數
   */
  async count(tableName: TableName): Promise<number> {
    const db = await this.ensureInit()
    return QueryOps.count(db, tableName)
  }

  /**
   * 檢查資料是否存在
   */
  async exists(tableName: TableName, id: string): Promise<boolean> {
    const db = await this.ensureInit()
    return QueryOps.exists(db, tableName, id, ReadOps.read)
  }

  /**
   * 清空資料表
   */
  async clear(tableName: TableName): Promise<void> {
    const db = await this.ensureInit()
    return DeleteOps.clear(db, tableName)
  }

  // ============================================
  // 工具方法
  // ============================================

  /**
   * 清空所有資料表
   */
  async clearAll(): Promise<void> {
    const db = await this.ensureInit()
    await DeleteOps.clearAll(db)
  }

  /**
   * 匯出資料
   */
  async export(): Promise<Record<string, unknown[]>> {
    const db = await this.ensureInit()
    return exportData(db)
  }

  /**
   * 匯入資料
   */
  async import(data: Record<string, unknown[]>): Promise<void> {
    const db = await this.ensureInit()
    await importData(db, data)
  }

  /**
   * 關閉資料庫連線
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
      this.initPromise = null
    }
  }

  /**
   * 重置資料庫實例（強制清除所有狀態）
   */
  reset(): void {
    if (this.db) {
      this.db.close()
    }
    this.db = null
    this.initPromise = null
  }
}
