/**
 * Realtime Hook 工廠函數
 * 為任何資料表建立按需訂閱的 Hook
 */

'use client';

import { useEffect } from 'react';
import { realtimeManager } from './realtime-manager';
import { logger } from '@/lib/utils/logger';

interface CreateRealtimeHookOptions<T> {
  tableName: string;
  indexedDB: {
    put: (record: T) => Promise<void>;
    delete: (id: string) => Promise<void>;
  };
  store: {
    setState: (updater: (state: { items: T[] }) => { items: T[] }) => void;
  };
}

/**
 * 建立 Realtime Hook
 *
 * @example
 * ```typescript
 * // 在 src/stores/index.ts 中
 * export const useRealtimeForTours = createRealtimeHook({
 *   tableName: 'tours',
 *   store: useTourStore,
 *   indexedDB: tourIndexedDB
 * });
 *
 * // 在頁面中使用
 * function ToursPage() {
 *   useRealtimeForTours(); // ← 進入頁面才訂閱
 *   const tours = useTourStore(state => state.items);
 * }
 * ```
 */
export function createRealtimeHook<T extends { id: string }>(
  options: CreateRealtimeHookOptions<T>
) {
  const { tableName, indexedDB, store } = options;

  return function useRealtimeForTable() {
    useEffect(() => {
      const subscriptionId = `${tableName}-realtime`;

      logger.log(`🔔 [${tableName}] 開始 Realtime 訂閱（按需）`);

      realtimeManager.subscribe<T>({
        table: tableName,
        subscriptionId,
        handlers: {
          // 新增資料
          onInsert: async (record) => {
            logger.log(`📥 [${tableName}] Realtime INSERT:`, record.id);

            // 更新 IndexedDB
            await indexedDB.put(record);

            // 更新 Zustand 狀態
            store.setState((state) => {
              const exists = state.items.some((item) => item.id === record.id);
              if (exists) {
                return state; // 避免重複
              }
              return {
                items: [...state.items, record],
              };
            });
          },

          // 更新資料
          onUpdate: async (record) => {
            logger.log(`📥 [${tableName}] Realtime UPDATE:`, record.id);

            await indexedDB.put(record);

            store.setState((state) => ({
              items: state.items.map((item) =>
                item.id === record.id ? record : item
              ),
            }));
          },

          // 刪除資料
          onDelete: async (oldRecord) => {
            logger.log(`📥 [${tableName}] Realtime DELETE:`, oldRecord.id);

            await indexedDB.delete(oldRecord.id);

            store.setState((state) => ({
              items: state.items.filter((item) => item.id !== oldRecord.id),
            }));
          },
        },
      });

      // 清理：離開頁面時取消訂閱
      return () => {
        logger.log(`🔕 [${tableName}] 取消 Realtime 訂閱`);
        realtimeManager.unsubscribe(subscriptionId);
      };
    }, []); // 只在組件掛載時訂閱一次
  };
}
