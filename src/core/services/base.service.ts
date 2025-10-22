import { BaseEntity, PageRequest, PageResponse } from '@/core/types/common';
import { NotFoundError, ValidationError } from '@/core/errors/app-errors';

export interface StoreOperations<T> {
  getAll: () => T[];
  getById: (id: string) => T | undefined;
  add: (entity: T) => void;
  update: (id: string, data: Partial<T>) => void;
  delete: (id: string) => void;
}

export abstract class BaseService<T extends BaseEntity> {
  protected abstract resourceName: string;
  protected abstract getStore: () => StoreOperations<T>;

  // 統一的 ID 生成
  protected generateId(): string {
    // 開發階段使用 crypto.randomUUID，生產環境由後端生成
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID
    return 'id_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 統一的時間戳
  protected now(): string {
    return new Date().toISOString();
  }

  // 驗證資料（子類可以覆寫）
  protected validate(data: Partial<T>): void {
    // 基本驗證邏輯，子類可以擴展
  }

  // CREATE
  async create(data: Omit<T, keyof BaseEntity>): Promise<T> {
    try {
      this.validate(data as any);

      const entity: T = {
        ...data,
        id: this.generateId(),
        created_at: this.now(),
        updated_at: this.now(),
      } as T;

      // 開發階段：直接更新 store
      const store = this.getStore();
      store.add(entity);

      // 未來：調用 API
      // const response = await api.post(`/${this.resourceName}`, data);

      return entity;
    } catch (error) {
      throw error instanceof Error ? error : new Error(`Failed to create ${this.resourceName}`);
    }
  }

  // READ (List with pagination and filtering)
  async list(params?: PageRequest): Promise<PageResponse<T>> {
    try {
      const store = this.getStore();
      let allData = store.getAll();

      // 搜尋過濾
      if (params?.search) {
        allData = allData.filter(item =>
          JSON.stringify(item).toLowerCase().includes(params.search!.toLowerCase())
        );
      }

      // 排序
      if (params?.sortBy) {
        allData.sort((a, b) => {
          const aVal = (a as any)[params.sortBy!];
          const bVal = (b as any)[params.sortBy!];

          if (aVal < bVal) return (params as any).sort_order === 'desc' ? 1 : -1;
          if (aVal > bVal) return (params as any).sort_order === 'desc' ? -1 : 1;
          return 0;
        });
      }

      // 分頁
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 10;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      return {
        data: allData.slice(start, end),
        total: allData.length,
        page,
        pageSize,
      };
    } catch (error) {
      throw error instanceof Error ? error : new Error(`Failed to list ${this.resourceName}`);
    }
  }

  // READ (Single)
  async getById(id: string): Promise<T | null> {
    try {
      const store = this.getStore();
      const entity = store.getById(id);

      if (!entity) {
        throw new NotFoundError(this.resourceName, id);
      }

      return entity;
    } catch (error) {
      throw error;
    }
  }

  // UPDATE
  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      this.validate(data);

      const store = this.getStore();
      const existing = store.getById(id);

      if (!existing) {
        throw new NotFoundError(this.resourceName, id);
      }

      const updated = {
        ...existing,
        ...data,
        id, // 確保 ID 不會被覆蓋
        updated_at: this.now(),
      } as T;

      store.update(id, updated);
      return updated;
    } catch (error) {
      throw error instanceof Error ? error : new Error(`Failed to update ${this.resourceName}`);
    }
  }

  // DELETE
  async delete(id: string): Promise<boolean> {
    try {
      const store = this.getStore();
      const existing = store.getById(id);

      if (!existing) {
        throw new NotFoundError(this.resourceName, id);
      }

      store.delete(id);
      return true;
    } catch (error) {
      throw error instanceof Error ? error : new Error(`Failed to delete ${this.resourceName}`);
    }
  }

  // Batch operations
  async batchCreate(items: Omit<T, keyof BaseEntity>[]): Promise<T[]> {
    const results: T[] = [];

    for (const item of items) {
      try {
        const created = await this.create(item);
        results.push(created);
      } catch (error) {
        // 繼續處理其他項目，但記錄錯誤
        console.error(`Failed to create item:`, error);
      }
    }

    return results;
  }

  async batchUpdate(updates: { id: string; data: Partial<T> }[]): Promise<T[]> {
    const results: T[] = [];

    for (const { id, data } of updates) {
      try {
        const updated = await this.update(id, data);
        results.push(updated);
      } catch (error) {
        console.error(`Failed to update item ${id}:`, error);
      }
    }

    return results;
  }

  async batchDelete(ids: string[]): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const id of ids) {
      try {
        await this.delete(id);
        success.push(id);
      } catch (error) {
        console.error(`Failed to delete item ${id}:`, error);
        failed.push(id);
      }
    }

    return { success, failed };
  }
}