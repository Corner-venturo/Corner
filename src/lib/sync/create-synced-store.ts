/**
 * 建立支援離線優先同步的 Zustand Store
 * 統一處理所有 Store 的載入、同步、Realtime 訂閱
 */

import { create, StateCreator } from 'zustand';
import { localDB, TableName } from '@/lib/db';
import { supabase } from '@/lib/supabase/client';
import { realtimeManager } from '@/lib/realtime';
import type { SyncStrategy } from './sync-manager';

/**
 * 基礎實體型別（所有資料都應該有這些欄位）
 */
export interface BaseEntity {
  id: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * 同步 Store 的設定
 */
export interface SyncedStoreConfig<T extends BaseEntity> {
  /** IndexedDB 表名 */
  tableName: TableName;
  /** Supabase 表名 */
  supabaseTable: string;
  /** 同步策略 */
  strategy: SyncStrategy;
  /** Supabase select 語句 */
  select?: string;
  /** 資料轉換函數 */
  transform?: (raw: unknown) => T;
  /** 啟用 Realtime 訂閱 */
  enableRealtime?: boolean;
  /** Realtime 過濾條件 */
  realtimeFilter?: string;
}

/**
 * 同步 Store 的狀態
 */
export interface SyncedStoreState<T extends BaseEntity> {
  items: T[];
  loading: boolean;
  syncing: boolean;
  error: string | null;
  lastSyncedAt: Date | null;
  fromCache: boolean;
}

/**
 * 同步 Store 的操作
 */
export interface SyncedStoreActions<T extends BaseEntity> {
  /** 載入資料（離線優先） */
  load: (filter?: (item: T) => boolean) => Promise<void>;

  /** 僅從本地載入（不同步） */
  loadLocal: (filter?: (item: T) => boolean) => Promise<void>;

  /** 強制從遠端同步 */
  sync: (filter?: (item: T) => boolean) => Promise<void>;

  /** 新增項目 */
  create: (item: Omit<T, 'id' | 'created_at'>) => Promise<void>;

  /** 更新項目 */
  update: (id: string, updates: Partial<T>) => Promise<void>;

  /** 刪除項目 */
  delete: (id: string) => Promise<void>;

  /** 清除錯誤 */
  clearError: () => void;

  /** 訂閱 Realtime 變更 */
  subscribeRealtime: (filter?: string) => void;

  /** 取消訂閱 Realtime */
  unsubscribeRealtime: () => void;
}

/**
 * 完整的同步 Store 型別
 */
export type SyncedStore<T extends BaseEntity> =
  SyncedStoreState<T> & SyncedStoreActions<T>;

/**
 * 建立支援離線優先同步的 Store
 */
export function createSyncedStore<T extends BaseEntity>(
  config: SyncedStoreConfig<T>
): () => SyncedStore<T> {
  const {
    tableName,
    supabaseTable,
    strategy,
    select = '*',
    transform,
    enableRealtime = true,
    realtimeFilter,
  } = config;

  const storeCreator: StateCreator<SyncedStore<T>> = (set, get) => ({
    // 初始狀態
    items: [],
    loading: false,
    syncing: false,
    error: null,
    lastSyncedAt: null,
    fromCache: false,

    // 📍 核心載入邏輯（離線優先）
    load: async (filter) => {
      set({ loading: true, error: null });

      try {
        // 步驟 1：立即從本地載入
        const cached = await localDB.getAll<T>(tableName);
        const filteredCache = filter ? cached.filter(filter) : cached;

        set({
          items: filteredCache,
          loading: false,
          fromCache: true
        });

        // 步驟 2：背景同步遠端（如果線上）
        const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
        const supabaseEnabled = process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true';

        if (isOnline && supabaseEnabled) {
          set({ syncing: true });

          const { data: remoteData, error: remoteError } = await supabase
            .from(supabaseTable)
            .select(select);

          if (remoteError) {
            console.warn(`[${tableName}] 遠端同步失敗:`, remoteError);
            set({ syncing: false });
            return;
          }

          // 步驟 3：轉換資料
          let transformedData = remoteData || [];
          if (transform) {
            transformedData = transformedData.map(transform);
          }

          // 步驟 4：過濾
          const filteredRemote = filter
            ? (transformedData as T[]).filter(filter)
            : transformedData as T[];

          // 步驟 5：合併策略
          const merged = mergeData(filteredCache, filteredRemote, strategy);

          // 步驟 6：更新本地快取
          for (const item of merged) {
            await localDB.put(tableName, item);
          }

          // 步驟 7：更新狀態
          set({
            items: merged,
            syncing: false,
            lastSyncedAt: new Date(),
            fromCache: false
          });
        }
      } catch (error) {
        console.error(`[${tableName}] 載入失敗:`, error);
        set({
          loading: false,
          syncing: false,
          error: (error as Error).message
        });
      }
    },

    // 僅本地載入
    loadLocal: async (filter) => {
      set({ loading: true, error: null });

      try {
        const cached = await localDB.getAll<T>(tableName);
        const filtered = filter ? cached.filter(filter) : cached;

        set({
          items: filtered,
          loading: false,
          fromCache: true
        });
      } catch (error) {
        console.error(`[${tableName}] 本地載入失敗:`, error);
        set({
          loading: false,
          error: (error as Error).message
        });
      }
    },

    // 強制同步
    sync: async (filter) => {
      const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
      const supabaseEnabled = process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true';

      if (!isOnline || !supabaseEnabled) {
        set({ error: '離線或 Supabase 未啟用' });
        return;
      }

      set({ syncing: true, error: null });

      try {
        const { data: remoteData, error: remoteError } = await supabase
          .from(supabaseTable)
          .select(select);

        if (remoteError) throw remoteError;

        let transformedData = remoteData || [];
        if (transform) {
          transformedData = transformedData.map(transform);
        }

        const filtered = filter
          ? (transformedData as T[]).filter(filter)
          : transformedData as T[];

        // 同步策略：強制使用遠端資料
        for (const item of filtered) {
          await localDB.put(tableName, item);
        }

        set({
          items: filtered,
          syncing: false,
          lastSyncedAt: new Date(),
          fromCache: false
        });
      } catch (error) {
        console.error(`[${tableName}] 同步失敗:`, error);
        set({
          syncing: false,
          error: (error as Error).message
        });
      }
    },

    // 新增項目
    create: async (itemData) => {
      const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
      const supabaseEnabled = process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true';

      const newItem: T = {
        ...itemData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as T;

      try {
        // 先更新本地
        await localDB.put(tableName, newItem);
        set(state => ({ items: [...state.items, newItem] }));

        // 上傳到遠端（如果線上）
        if (isOnline && supabaseEnabled) {
          const { error } = await supabase
            .from(supabaseTable)
            .insert(newItem);

          if (error) {
            console.warn(`[${tableName}] 上傳失敗，僅保存本地:`, error);
          }
        }
      } catch (error) {
        console.error(`[${tableName}] 新增失敗:`, error);
        set({ error: (error as Error).message });
      }
    },

    // 更新項目
    update: async (id, updates) => {
      const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
      const supabaseEnabled = process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true';

      try {
        const current = get().items.find(item => item.id === id);
        if (!current) {
          throw new Error(`項目不存在: ${id}`);
        }

        const updated = {
          ...current,
          ...updates,
          updated_at: new Date().toISOString(),
        };

        // 先更新本地
        await localDB.put(tableName, updated);
        set(state => ({
          items: state.items.map(item => item.id === id ? updated : item)
        }));

        // 上傳到遠端（如果線上）
        if (isOnline && supabaseEnabled) {
          const { error } = await supabase
            .from(supabaseTable)
            .update(updates)
            .eq('id', id);

          if (error) {
            console.warn(`[${tableName}] 更新上傳失敗:`, error);
          }
        }
      } catch (error) {
        console.error(`[${tableName}] 更新失敗:`, error);
        set({ error: (error as Error).message });
      }
    },

    // 刪除項目
    delete: async (id) => {
      const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
      const supabaseEnabled = process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true';

      try {
        // 先刪除本地
        await localDB.delete(tableName, id);
        set(state => ({
          items: state.items.filter(item => item.id !== id)
        }));

        // 刪除遠端（如果線上）
        if (isOnline && supabaseEnabled) {
          const { error } = await supabase
            .from(supabaseTable)
            .delete()
            .eq('id', id);

          if (error) {
            console.warn(`[${tableName}] 遠端刪除失敗:`, error);
          }
        }
      } catch (error) {
        console.error(`[${tableName}] 刪除失敗:`, error);
        set({ error: (error as Error).message });
      }
    },

    // 訂閱 Realtime
    subscribeRealtime: (filter) => {
      if (!enableRealtime) return;

      const subscriptionId = `${tableName}-realtime`;

      realtimeManager.subscribe<T>({
        table: supabaseTable,
        filter: filter || realtimeFilter,
        subscriptionId,
        handlers: {
          onInsert: (item) => {
            set(state => {
              // 🔥 防重複檢查
              const exists = state.items.some(i => i.id === item.id);
              if (exists) {
                console.warn(`[${tableName}] Realtime 重複插入:`, item.id);
                return state;
              }

              // 新增到狀態
              const newItems = [...state.items, item];

              // 同步到本地
              localDB.put(tableName, item).catch(console.error);

              return { items: newItems };
            });
          },

          onUpdate: (item) => {
            set(state => ({
              items: state.items.map(i => i.id === item.id ? item : i)
            }));

            // 同步到本地
            localDB.put(tableName, item).catch(console.error);
          },

          onDelete: (oldItem) => {
            set(state => ({
              items: state.items.filter(i => i.id !== oldItem.id)
            }));

            // 同步刪除本地
            localDB.delete(tableName, oldItem.id).catch(console.error);
          },
        },
      });
    },

    // 取消訂閱
    unsubscribeRealtime: () => {
      const subscriptionId = `${tableName}-realtime`;
      realtimeManager.unsubscribe(subscriptionId);
    },

    // 清除錯誤
    clearError: () => set({ error: null }),
  });

  return create(storeCreator);
}

/**
 * 合併本地和遠端資料
 */
function mergeData<T extends BaseEntity>(
  local: T[],
  remote: T[],
  strategy: SyncStrategy
): T[] {
  switch (strategy) {
    case 'server-authority':
      return remote;

    case 'last-write-wins': {
      const merged = new Map<string, T>();

      remote.forEach(item => merged.set(item.id, item));

      local.forEach(localItem => {
        const remoteItem = merged.get(localItem.id);

        if (!remoteItem) {
          merged.set(localItem.id, localItem);
        } else if (localItem.updated_at && remoteItem.updated_at) {
          const localTime = new Date(localItem.updated_at).getTime();
          const remoteTime = new Date(remoteItem.updated_at).getTime();

          if (localTime > remoteTime) {
            merged.set(localItem.id, localItem);
          }
        }
      });

      return Array.from(merged.values());
    }

    case 'local-first': {
      const localIds = new Set(local.map(item => item.id));
      const remoteOnly = remote.filter(item => !localIds.has(item.id));
      return [...local, ...remoteOnly];
    }

    default:
      return remote;
  }
}
