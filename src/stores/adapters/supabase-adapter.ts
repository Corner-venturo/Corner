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
      let query: any = (supabase as any)
        .from(this.tableName)
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
      const result: any = await (supabase as any)
        .from(this.tableName)
        .insert(data as any)
        .select()
        .single()

      if (result.error) throw result.error

      logger.log(`☁️ [${this.tableName}] Supabase insert:`, result.data.id)
      return result.data as T
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
      const result: any = await (supabase as any).from(this.tableName).select('*').eq('id', id).single()

      if (result.error) throw result.error

      return result.data as T
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
      const result: any = await (supabase as any).from(this.tableName).upsert(item as any)

      if (result.error) {
        logger.error(`❌ [${this.tableName}] Supabase upsert 錯誤詳情:`, {
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint,
          code: result.error.code,
        })
        throw result.error
      }

      logger.log(`☁️ [${this.tableName}] Supabase upsert:`, item.id)
    } catch (error: any) {
      logger.error(`❌ [${this.tableName}] Supabase upsert 失敗:`, {
        message: error?.message || '未知錯誤',
        details: error?.details || '',
        hint: error?.hint || '',
        code: error?.code || '',
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
        delete (cleanedData as any).description
      }

      const { supabase } = await import('@/lib/supabase/client')
      const result: any = await (supabase as any).from(this.tableName).update(cleanedData as any).eq('id', id)

      if (result.error) throw result.error

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
      const result: any = await (supabase as any).from(this.tableName).delete().eq('id', id)

      if (result.error) throw result.error

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
