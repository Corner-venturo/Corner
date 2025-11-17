/**
 * 清理 IndexedDB 中 todos 的 description 欄位
 * 這個欄位在資料庫中不存在，但可能存在於舊的本地快取中
 */

import { logger } from '@/lib/utils/logger'
import { localDB } from '../database'

export async function cleanTodosDescription() {
  try {
    const todos = await localDB.getAll('todos')

    let cleanedCount = 0
    for (const todo of todos) {
      // 檢查是否有 description 欄位
      if ('description' in todo) {
        // 移除 description 欄位
        const { description, ...cleanedTodo } = todo as any

        // 更新回 IndexedDB
        await localDB.update('todos', todo.id, cleanedTodo)
        cleanedCount++
      }
    }

    logger.log(`✅ 清理完成: ${cleanedCount} 個 todos 移除了 description 欄位`)
    return cleanedCount
  } catch (error) {
    logger.error('❌ 清理失敗:', error)
    throw error
  }
}
