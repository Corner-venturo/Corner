/**
 * Realtime Hook 工廠函數
 * 為任何資料表建立按需訂閱的 Hook
 */

'use client'

import { logger } from '@/lib/utils/logger'
import { useRealtimeSubscription } from './hooks/useRealtimeSubscription'

// Zustand store 的最小介面需求
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MinimalZustandStore = any

// IndexedDB 介面
interface IndexedDBAdapter<T> {
  put: (record: T) => Promise<void>
  delete: (id: string) => Promise<void>
}

interface CreateRealtimeHookOptions<T> {
  tableName: string
  indexedDB: IndexedDBAdapter<T>
  store: MinimalZustandStore
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
  const { tableName, indexedDB, store } = options

  // 型別安全的 setState 包裝器
  const setStoreState = (updater: (state: { items: T[] }) => { items: T[] }) => {
    store.setState(updater as unknown)
  }

  // 型別安全的 getState 包裝器
  const getStoreState = (): { items: T[] } => {
    return store.getState() as { items: T[] }
  }

  return function useRealtimeForTable() {
    useRealtimeSubscription<T>({
      table: tableName,
      subscriptionId: `${tableName}-realtime`,
      handlers: {
        // 新增資料
        onInsert: async record => {
          logger.log(`➕ [${tableName}] Realtime INSERT:`, record)
          await indexedDB.put(record)

          const currentState = getStoreState()
          const exists = currentState.items.some(item => item.id === record.id)
          if (exists) {
            logger.log(`⚠️ [${tableName}] 記錄已存在，跳過:`, record.id)
            return
          }
          logger.log(`✅ [${tableName}] 新增到 Store`)
          setStoreState(state => ({
            items: [...state.items, record],
          }))
        },

        // 更新資料
        onUpdate: async record => {
          logger.log(`✏️ [${tableName}] Realtime UPDATE:`, record)
          await indexedDB.put(record)

          setStoreState(state => ({
            items: state.items.map(item => (item.id === record.id ? record : item)),
          }))
        },

        // 刪除資料
        onDelete: async oldRecord => {
          logger.log(`🗑️ [${tableName}] Realtime DELETE:`, oldRecord)
          await indexedDB.delete(oldRecord.id)

          setStoreState(state => ({
            items: state.items.filter(item => item.id !== oldRecord.id),
          }))
        },
      },
    })
  }
}
