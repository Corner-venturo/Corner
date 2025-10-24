/**
 * Supabase 適配器
 * 封裝所有 Supabase 操作
 */

import type { BaseEntity } from '@/types';
import type { TableName } from '@/lib/db/schemas';
import type { RemoteAdapter } from '../core/types';
import { logger } from '@/lib/utils/logger';

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
      return [];
    }

    try {
      const { supabase } = await import('@/lib/supabase/client');
      const query = supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: true });

      if (signal) {
        query.abortSignal(signal);
      }

      const { data, error } = await query;

      if (error) throw error;

      const items = (data || []) as T[];
      logger.log(`☁️ [${this.tableName}] Supabase fetchAll:`, items.length, '筆');

      return items;
    } catch (error) {
      logger.warn(`⚠️ [${this.tableName}] Supabase fetchAll 失敗:`, error);
      throw error;
    }
  }

  /**
   * 新增資料
   */
  async insert(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    if (!this.enabled || typeof window === 'undefined') {
      throw new Error('Supabase not enabled');
    }

    try {
      const { supabase } = await import('@/lib/supabase/client');
      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      logger.log(`☁️ [${this.tableName}] Supabase insert:`, result.id);
      return result as T;
    } catch (error) {
      logger.error(`❌ [${this.tableName}] Supabase insert 失敗:`, error);
      throw error;
    }
  }

  /**
   * 根據 ID 取得單筆
   */
  async getById(id: string): Promise<T | null> {
    if (!this.enabled || typeof window === 'undefined') {
      throw new Error('Supabase not enabled');
    }

    try {
      const { supabase } = await import('@/lib/supabase/client');
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as T;
    } catch (error) {
      logger.warn(`⚠️ [${this.tableName}] Supabase getById 失敗:`, error);
      throw error;
    }
  }

  /**
   * 取得所有資料（別名）
   */
  async getAll(): Promise<T[]> {
    return this.fetchAll();
  }

  /**
   * 新增或更新資料
   */
  async put(item: T): Promise<void> {
    // Supabase 使用 upsert
    if (!this.enabled || typeof window === 'undefined') {
      return;
    }

    try {
      const { supabase } = await import('@/lib/supabase/client');
      const { error } = await supabase
        .from(this.tableName)
        .upsert(item);

      if (error) throw error;

      logger.log(`☁️ [${this.tableName}] Supabase upsert:`, item.id);
    } catch (error) {
      logger.error(`❌ [${this.tableName}] Supabase upsert 失敗:`, error);
      throw error;
    }
  }

  /**
   * 更新資料
   */
  async update(id: string, data: Partial<T>): Promise<void> {
    if (!this.enabled || typeof window === 'undefined') {
      return;
    }

    try {
      const { supabase } = await import('@/lib/supabase/client');
      const { error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id);

      if (error) throw error;

      logger.log(`☁️ [${this.tableName}] Supabase update:`, id);
    } catch (error) {
      logger.error(`❌ [${this.tableName}] Supabase update 失敗:`, error);
      throw error;
    }
  }

  /**
   * 刪除資料
   */
  async delete(id: string): Promise<void> {
    if (!this.enabled || typeof window === 'undefined') {
      return;
    }

    try {
      const { supabase } = await import('@/lib/supabase/client');
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      logger.log(`☁️ [${this.tableName}] Supabase delete:`, id);
    } catch (error) {
      logger.error(`❌ [${this.tableName}] Supabase delete 失敗:`, error);
      throw error;
    }
  }

  /**
   * 清空所有資料
   */
  async clear(): Promise<void> {
    logger.warn(`⚠️ [${this.tableName}] Supabase clear 未實作（安全考量）`);
    // 不實作，避免誤刪雲端資料
  }
}
