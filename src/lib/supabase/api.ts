import { supabase } from './client';

/**
 * 將 camelCase 轉換為 snake_case
 * 並清理空字串（轉換為 null）
 */
function toSnakeCase(obj): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (typeof obj !== 'object') return obj;

  const result: unknown = {};
  for (const key in obj) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    const value = obj[key];
    // 將空字串轉換為 null（避免 PostgreSQL DATE/TIMESTAMPTZ 欄位錯誤）
    result[snakeKey] = value === '' ? null : toSnakeCase(value);
  }
  return result;
}

/**
 * 將 snake_case 轉換為 camelCase
 */
function toCamelCase(obj): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (typeof obj !== 'object') return obj;

  const result: unknown = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = toCamelCase(obj[key]);
  }
  return result;
}

export interface QueryOptions {
  select?: string;
  filters?: Record<string, unknown>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
}

/**
 * Venturo API 統一服務層
 * 提供所有資料庫操作的抽象接口
 */
export class VenturoAPI {
  /**
   * 創建新記錄
   */
  static async create<T = any>(table: string, data: Record<string, unknown>): Promise<T> {
    try {
      // 將 camelCase 轉換為 snake_case
      const snakeData = toSnakeCase(data);

      const { data: result, error } = await supabase
        .from(table)
        .insert(snakeData)
        .select()
        .single();

      if (error) {
                throw new Error(`創建失敗: ${error.message}`);
      }

      // 將回傳的 snake_case 轉換為 camelCase
      return toCamelCase(result) as T;
    } catch (error) {
            throw error;
    }
  }

  /**
   * 批量創建記錄
   */
  static async createMany<T = any>(table: string, data: unknown[]): Promise<T[]> {
    try {
      // 將 camelCase 轉換為 snake_case
      const snakeData = data.map(toSnakeCase);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error } = await (supabase as unknown)
        .from(table)
        .insert(snakeData)
        .select();

      if (error) {
                throw new Error(`批量創建失敗: ${error.message}`);
      }

      // 將回傳的 snake_case 轉換為 camelCase
      return toCamelCase(result) as T[];
    } catch (error) {
            throw error;
    }
  }

  /**
   * 查詢記錄
   */
  static async read<T = any>(table: string, options: QueryOptions = {}): Promise<T[]> {
    try {
      let query = supabase.from(table).select(options.select || '*');

      // 添加過濾條件 (將 camelCase key 轉為 snake_case)
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          if (Array.isArray(value)) {
            query = query.in(snakeKey, value);
          } else if (value !== null && value !== undefined) {
            query = query.eq(snakeKey, value);
          }
        });
      }

      // 排序 (將 camelCase column 轉為 snake_case)
      if (options.orderBy) {
        const snakeColumn = options.orderBy.column.replace(/([A-Z])/g, '_$1').toLowerCase();
        query = query.order(snakeColumn, {
          ascending: options.orderBy.ascending ?? true
        });
      }

      // 分頁
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
                throw new Error(`查詢失敗: ${error.message}`);
      }

      // 將回傳的 snake_case 轉換為 camelCase
      return toCamelCase(data || []) as T[];
    } catch (error) {
            throw error;
    }
  }

  /**
   * 根據 ID 查詢單筆記錄
   */
  static async readById<T = any>(table: string, id: string): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // 記錄不存在
        }
                throw new Error(`查詢失敗: ${error.message}`);
      }

      // 將回傳的 snake_case 轉換為 camelCase
      return toCamelCase(data) as T;
    } catch (error) {
            throw error;
    }
  }

  /**
   * 更新記錄
   */
  static async update<T = any>(table: string, id: string, data: Record<string, unknown>): Promise<T> {
    try {
      // 將 camelCase 轉換為 snake_case
      const snakeData = toSnakeCase(data);
      // 添加更新時間
      const updateData = {
        ...snakeData,
        updated_at: new Date().toISOString()
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error } = await (supabase as unknown)
        .from(table)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
                throw new Error(`更新失敗: ${error.message}`);
      }

      // 將回傳的 snake_case 轉換為 camelCase
      return toCamelCase(result) as T;
    } catch (error) {
            throw error;
    }
  }

  /**
   * 條件更新記錄
   */
  static async updateWhere<T = any>(
    table: string,
    filters: Record<string, unknown>,
    data: any
  ): Promise<T[]> {
    try {
      // 將 camelCase 轉換為 snake_case
      const snakeData = toSnakeCase(data);
      const updateData = {
        ...snakeData,
        updated_at: new Date().toISOString()
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as unknown).from(table);
      query = query.update(updateData);

      // 過濾條件也轉換
      Object.entries(filters).forEach(([key, value]) => {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        query = query.eq(snakeKey, value);
      });

      const { data: result, error } = await query.select();

      if (error) {
                throw new Error(`條件更新失敗: ${error.message}`);
      }

      // 將回傳的 snake_case 轉換為 camelCase
      return toCamelCase(result || []) as T[];
    } catch (error) {
            throw error;
    }
  }

  /**
   * 刪除記錄
   */
  static async delete(table: string, id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
                throw new Error(`刪除失敗: ${error.message}`);
      }

      return true;
    } catch (error) {
            throw error;
    }
  }

  /**
   * 條件刪除記錄
   */
  static async deleteWhere(table: string, filters: Record<string, unknown>): Promise<boolean> {
    try {
      let query = supabase.from(table).delete();

      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { error } = await query;

      if (error) {
                throw new Error(`條件刪除失敗: ${error.message}`);
      }

      return true;
    } catch (error) {
            throw error;
    }
  }

  /**
   * 計數查詢
   */
  static async count(table: string, filters?: Record<string, unknown>): Promise<number> {
    try {
      let query = supabase.from(table).select('*', { count: 'exact', head: true });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      const { count, error } = await query;

      if (error) {
                throw new Error(`計數失敗: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
            throw error;
    }
  }

  /**
   * 執行原生 SQL 查詢
   */
  static async query<T = any>(sql: string, params?: unknown[]): Promise<T[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as unknown).rpc('execute_sql', {
        query: sql,
        params: params || []
      });

      if (error) {
                throw new Error(`SQL 查詢失敗: ${error.message}`);
      }

      return (data || []) as T[];
    } catch (error) {
            throw error;
    }
  }

  /**
   * 事務處理
   */
  static async transaction(operations: (() => Promise<unknown>)[]): Promise<any[]> {
    const results = [];

    for (const operation of operations) {
      try {
        const result = await operation();
        results.push(result);
      } catch (error) {
        // 如果任何操作失敗，拋出錯誤（簡單的事務處理）
                throw new Error(`事務處理失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      }
    }

    return results;
  }
}

// 導出 Supabase 客戶端供特殊需求使用
export { supabase };