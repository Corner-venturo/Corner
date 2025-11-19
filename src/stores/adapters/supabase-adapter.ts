/**
 * Supabase 適配器
 * 封裝所有 Supabase 操作
 */

import type { BaseEntity } from '@/types'
import type { TableName } from '@/lib/db/schemas'
import type { RemoteAdapter } from '../core/types'
import { logger } from '@/lib/utils/logger'
import { getWorkspaceFilterForQuery } from '@/lib/workspace-filter'

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
      const { supabase } = await import('@/lib/supabase/client')
      // Dynamic table name - using TableName type from schemas
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = supabase
        .from(this.tableName as any)
        .select('*')
        .order('created_at', { ascending: true })

      // 套用 workspace 篩選（如果有的話）
      const workspaceId = getWorkspaceFilterForQuery(this.tableName)
      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId)
        logger.log(`🔍 [${this.tableName}] 套用 workspace 篩選:`, workspaceId)
      }

      if (signal) {
        query.abortSignal(signal)
      }

      const { data, error } = await query

      if (error) throw error

      const items = (data || []) as T[]
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
      const { supabase } = await import('@/lib/supabase/client')
      // Dynamic table name - using TableName type from schemas
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: insertedData, error } = await supabase
        .from(this.tableName as any)
        .insert(data)
        .select()
        .single()

      if (error) throw error

      logger.log(`☁️ [${this.tableName}] Supabase insert:`, insertedData.id)
      return insertedData as T
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
      const { supabase } = await import('@/lib/supabase/client')
      // Dynamic table name - using TableName type from schemas
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase.from(this.tableName as any).select('*').eq('id', id).single()

      if (error) throw error

      return data as T
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
   * 新增或更新資料
   */
  async put(item: T): Promise<void> {
    // Supabase 使用 upsert
    if (!this.enabled || typeof window === 'undefined') {
      return
    }

    try {
      const { supabase } = await import('@/lib/supabase/client')
      // Dynamic table name - using TableName type from schemas
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from(this.tableName as any).upsert(item)

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
      // 清理過時欄位（特別是 todos 的 description）
      const cleanedData = { ...data }
      if (this.tableName === 'todos' && 'description' in cleanedData) {
        delete cleanedData.description
      }

      const { supabase } = await import('@/lib/supabase/client')
      // Dynamic table name - using TableName type from schemas
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from(this.tableName as any).update(cleanedData).eq('id', id)

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
      const { supabase } = await import('@/lib/supabase/client')
      // Dynamic table name - using TableName type from schemas
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from(this.tableName as any).delete().eq('id', id)

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
