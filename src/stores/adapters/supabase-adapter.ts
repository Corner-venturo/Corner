/**
 * Supabase 適配器
 * 封裝所有 Supabase 操作
 */

import type { BaseEntity } from '@/types'
import type { TableName } from '@/lib/db/schemas'
import type { RemoteAdapter } from '../core/types'
import { logger } from '@/lib/utils/logger'
import { getWorkspaceFilterForQuery } from '@/lib/workspace-filter'
import { dynamicFrom, castRows, castRow } from '@/lib/supabase/typed-client'

export class SupabaseAdapter<T extends BaseEntity> implements RemoteAdapter<T> {
  constructor(
    private tableName: TableName,
    private enabled: boolean
  ) {}

  /**
   * 取得所有資料
   */
  async fetchAll(signal?: AbortSignal): Promise<T[]> {
    if (!this.enabled || typeof window === 'undefined') {
      return []
    }

    try {
      // 使用 dynamicFrom 處理動態表名
      let query = dynamicFrom(this.tableName)
        .select('*')
        .order('created_at', { ascending: true })

      // 套用 workspace 篩選（如果有的話）
      const workspaceId = await getWorkspaceFilterForQuery(this.tableName)
      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId)
        logger.log(`🔍 [${this.tableName}] 套用 workspace 篩選:`, workspaceId)
      }

      if (signal) {
        query.abortSignal(signal)
      }

      const { data, error } = await query

      if (error) throw error

      const items = castRows<T>(data)
      logger.log(`☁️ [${this.tableName}] Supabase fetchAll:`, items.length, '筆')

      return items
    } catch (error) {
      logger.warn(`⚠️ [${this.tableName}] Supabase fetchAll 失敗:`, error)
      throw error
    }
  }

  /**
   * 新增資料
   */
  async insert(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    if (!this.enabled || typeof window === 'undefined') {
      throw new Error('Supabase not enabled')
    }

    try {
      // 使用 dynamicFrom 處理動態表名
      const { data: insertedData, error } = await dynamicFrom(this.tableName)
        .insert(data as Record<string, unknown>)
        .select()
        .single()

      if (error) throw error

      const result = castRow<T>(insertedData) as T
      logger.log(`☁️ [${this.tableName}] Supabase insert:`, (result as { id: string }).id)
      return result
    } catch (error) {
      logger.error(`❌ [${this.tableName}] Supabase insert 失敗:`, error)
      throw error
    }
  }

  /**
   * 根據 ID 取得單筆
   */
  async getById(id: string): Promise<T | null> {
    if (!this.enabled || typeof window === 'undefined') {
      throw new Error('Supabase not enabled')
    }

    try {
      // 使用 dynamicFrom 處理動態表名
      const { data, error } = await dynamicFrom(this.tableName).select('*').eq('id', id).single()

      if (error) throw error

      return castRow<T>(data)
    } catch (error) {
      logger.warn(`⚠️ [${this.tableName}] Supabase getById 失敗:`, error)
      throw error
    }
  }

  /**
   * 取得所有資料（別名）
   */
  async getAll(): Promise<T[]> {
    return this.fetchAll()
  }

  /**
   * 清理資料物件，移除未知的欄位
   */
  private cleanDataForTable<D extends Record<string, unknown>>(data: D): Partial<T> {
    const cleaned = { ...data } as Record<string, unknown>

    // payment_requests: 移除 items 欄位（應使用 payment_request_items 關聯表）
    if (this.tableName === 'payment_requests' && 'items' in cleaned) {
      delete cleaned.items
      logger.log(`🧹 [${this.tableName}] 移除未知欄位: items`)
    }

    // todos: 移除過時的 description 欄位
    if (this.tableName === 'todos' && 'description' in cleaned) {
      delete cleaned.description
      logger.log(`🧹 [${this.tableName}] 移除過時欄位: description`)
    }

    return cleaned as Partial<T>
  }

  /**
   * 新增或更新資料
   */
  async put(item: T): Promise<void> {
    // Supabase 使用 upsert
    if (!this.enabled || typeof window === 'undefined') {
      return
    }

    try {
      // 清理資料，移除未知欄位
      const cleanedItem = this.cleanDataForTable(item as unknown as Record<string, unknown>)

      // 使用 dynamicFrom 處理動態表名
      const { error } = await dynamicFrom(this.tableName).upsert(cleanedItem as Record<string, unknown>)

      if (error) {
        logger.error(`❌ [${this.tableName}] Supabase upsert 錯誤詳情:`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw error
      }

      logger.log(`☁️ [${this.tableName}] Supabase upsert:`, item.id)
    } catch (error) {
      const err = error as { message?: string; details?: string; hint?: string; code?: string }
      logger.error(`❌ [${this.tableName}] Supabase upsert 失敗:`, {
        message: err?.message || '未知錯誤',
        details: err?.details || '',
        hint: err?.hint || '',
        code: err?.code || '',
        item_id: item?.id,
      })
      throw error
    }
  }

  /**
   * 更新資料
   */
  async update(id: string, data: Partial<T>): Promise<void> {
    if (!this.enabled || typeof window === 'undefined') {
      return
    }

    try {
      // 清理資料，移除未知欄位
      const cleanedData = this.cleanDataForTable(data)

      // 使用 dynamicFrom 處理動態表名
      const { error } = await dynamicFrom(this.tableName).update(cleanedData as Record<string, unknown>).eq('id', id)

      if (error) throw error

      logger.log(`☁️ [${this.tableName}] Supabase update:`, id)
    } catch (error) {
      logger.error(`❌ [${this.tableName}] Supabase update 失敗:`, error)
      throw error
    }
  }

  /**
   * 刪除資料
   */
  async delete(id: string): Promise<void> {
    if (!this.enabled || typeof window === 'undefined') {
      return
    }

    try {
      // 使用 dynamicFrom 處理動態表名
      const { error } = await dynamicFrom(this.tableName).delete().eq('id', id)

      if (error) throw error

      logger.log(`☁️ [${this.tableName}] Supabase delete:`, id)
    } catch (error) {
      logger.error(`❌ [${this.tableName}] Supabase delete 失敗:`, error)
      throw error
    }
  }

  /**
   * 清空所有資料
   */
  async clear(): Promise<void> {
    logger.warn(`⚠️ [${this.tableName}] Supabase clear 未實作（安全考量）`)
    // 不實作，避免誤刪雲端資料
  }
}
