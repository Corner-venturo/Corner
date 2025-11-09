/**
 * Realtime Hook 工廠函數
 * 為任何資料表建立按需訂閱的 Hook
 */

'use client'

import { useEffect } from 'react'
import { realtimeManager } from './realtime-manager'
import { logger } from '@/lib/utils/logger'

interface CreateRealtimeHookOptions<T> {
  tableName: string
  indexedDB: {
    put: (record: T) => Promise<void>
    delete: (id: string) => Promise<void>
  }
  store: {
    setState: (updater: (state: { items: T[] }) => { items: T[] }) => void
  }
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

  return function useRealtimeForTable() {
    useEffect(() => {
      const subscriptionId = `${tableName}-realtime`

      realtimeManager.subscribe<T>({
        table: tableName,
        subscriptionId,
        handlers: {
          // 新增資料
          onInsert: async record => {
            await indexedDB.put(record)

            store.setState(state => {
              const exists = state.items.some(item => item.id === record.id)
              if (exists) return state
              return {
                items: [...state.items, record],
              }
            })
          },

          // 更新資料
          onUpdate: async record => {
            await indexedDB.put(record)

            store.setState(state => ({
              items: state.items.map(item => (item.id === record.id ? record : item)),
            }))
          },

          // 刪除資料
          onDelete: async oldRecord => {
            await indexedDB.delete(oldRecord.id)

            store.setState(state => ({
              items: state.items.filter(item => item.id !== oldRecord.id),
            }))
          },
        },
      })

      // 清理：離開頁面時取消訂閱
      return () => {
        realtimeManager.unsubscribe(subscriptionId)
      }
    }, []) // 只在組件掛載時訂閱一次
  }
}
